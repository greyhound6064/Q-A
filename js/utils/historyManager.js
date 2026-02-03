/**
 * @file historyManager.js
 * @description 브라우저 히스토리 관리 - 뒤로 가기 버튼으로 사이트 이탈 방지
 * 
 * 기능:
 * - 탭 전환 시 히스토리 추가
 * - 모달 열기/닫기 시 히스토리 추가
 * - 뒤로 가기 시 이전 상태로 복원
 * - 최초 상태(자유 게시판)에서만 사이트 이탈 허용
 */

class HistoryManager {
    constructor() {
        this.isRestoring = false; // 상태 복원 중 플래그
        this._lastPostDetailScrollPosition = undefined; // 게시물 상세 모달 닫을 때 복원할 스크롤 (popstate 시 post-detail state 접근 불가 대비)
        this.init();
    }

    init() {
        // popstate 이벤트 리스너 등록 (뒤로 가기/앞으로 가기)
        window.addEventListener('popstate', (event) => {
            this.isRestoring = true;
            
            if (event.state) {
                this.handleState(event.state);
            } else {
                // 초기 상태 (자유 게시판)
                this.handleState({ type: 'tab', tab: 'gallery' });
            }
            
            // 복원 완료 후 플래그 해제
            setTimeout(() => {
                this.isRestoring = false;
            }, 100);
        });

        // 초기 상태 설정 (페이지 로드 시)
        if (!history.state) {
            history.replaceState(
                { type: 'tab', tab: 'gallery' },
                '',
                '#gallery'
            );
        }
    }

    /**
     * 상태에 따라 적절한 복원 함수 호출
     */
    handleState(state) {
        console.log('History state:', state);
        
        switch (state.type) {
            case 'tab':
                this.restoreTab(state);
                break;
            case 'modal':
                this.restoreModal(state);
                break;
            case 'profile-tab':
                this.restoreProfileTab(state);
                break;
            case 'artwork-detail':
            case 'feed-detail':
            case 'post-detail':
                // 뒤로가기 시 상세화면 닫기 및 이전 상태 복원
                this.closePostDetailAndRestore(state);
                break;
            default:
                console.warn('Unknown history state type:', state.type);
                break;
        }
    }

    /**
     * 탭 복원 (모든 모달 닫고 탭 전환)
     * 주의: 게시물 상세 모달에서 뒤로갈 때 popstate에는 탭 state만 전달됨.
     * post-detail의 previousScrollPosition은 접근 불가하므로 _lastPostDetailScrollPosition 사용.
     */
    restoreTab(state) {
        const fromPostDetail = this._lastPostDetailScrollPosition !== undefined;
        
        // 모든 모달 닫기 (히스토리 없이)
        this.closeAllModals();
        
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
        
        // 탭 전환 (게시물 상세→보드 복귀 시 생략 - initBoard 리로드가 스크롤 초기화하므로)
        const skipTabSwitch = fromPostDetail && (state.tab === 'board' || state.tab === 'gallery' || state.tab === 'feed');
        if (!skipTabSwitch && window.switchToTab) {
            window.switchToTab(state.tab);
        }
        
        // 스크롤 위치 복원: 게시물 상세에서 돌아온 경우 우선 적용
        const scrollToRestore = fromPostDetail
            ? this._lastPostDetailScrollPosition
            : state.scrollPosition;
        
        if (fromPostDetail) {
            this._lastPostDetailScrollPosition = undefined;
        }
        
        if (scrollToRestore !== undefined && scrollToRestore !== null) {
            this.restoreScrollPosition(scrollToRestore);
        }
    }

    /**
     * 프로필 내부 탭 복원
     */
    restoreProfileTab(state) {
        // 모든 모달 닫기 (히스토리 없이)
        this.closeAllModals();
        
        // 프로필 탭으로 전환
        if (window.switchToTab) {
            window.switchToTab('profile');
        }
        
        // 프로필 내부 탭 전환 (팔로워/팔로잉은 통합 탭 'follow'로 매핑)
        const subTab = (state.subTab === 'followers' || state.subTab === 'following') ? 'follow' : state.subTab;
        setTimeout(() => {
            const profileTab = document.querySelector(`.profile-tab[data-profile-tab="${subTab}"]`);
            if (profileTab) {
                const profileTabs = document.querySelectorAll('.profile-tab:not(.logout-tab)');
                profileTabs.forEach(btn => btn.classList.remove('active'));
                profileTab.classList.add('active');
                
                const profileContents = document.querySelectorAll('.profile-tab-content');
                profileContents.forEach(content => {
                    content.style.display = 'none';
                    content.classList.remove('active');
                });
                
                const targetContent = document.getElementById('profile-' + subTab + '-content');
                if (targetContent) {
                    targetContent.style.display = 'block';
                    targetContent.classList.add('active');
                    if (subTab === 'follow' && window.renderFollowUnified) {
                        window.renderFollowUnified();
                    }
                }
            }
        }, 50);
    }

    /**
     * 모달 복원
     */
    restoreModal(state) {
        const { modalId, data } = state;
        
        // 모달 종류에 따라 열기
        switch (modalId) {
            case 'upload-modal':
                if (window.openUploadModal) window.openUploadModal();
                break;
            case 'edit-artwork-modal':
                if (data && window.openEditArtworkModalWithData) {
                    window.openEditArtworkModalWithData(data);
                }
                break;
            case 'profile-edit-modal':
                if (window.openProfileEditModal) window.openProfileEditModal();
                break;
            case 'followers-modal':
                if (window.openFollowersModal) window.openFollowersModal();
                break;
            case 'following-modal':
                if (window.openFollowingModal) window.openFollowingModal();
                break;
            default:
                // 일반 모달 열기
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                }
                break;
        }
    }

    /**
     * 통합 게시물 상세화면 닫기 및 이전 상태 복원 (뒤로가기 시)
     */
    closePostDetailAndRestore(currentState) {
        console.log('[closePostDetailAndRestore] 시작 - currentState:', currentState);
        
        // 통합 모달 닫기 (artwork-detail-modal만 사용)
        const modal = document.getElementById('artwork-detail-modal');
        if (modal && modal.style.display !== 'none') {
            const detailVideo = document.getElementById('artwork-detail-video');
            if (detailVideo && !detailVideo.paused) {
                detailVideo.pause();
            }
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
        
        document.body.style.overflow = '';
        
        // 이전 상태(모달 열기 전 상태)의 스크롤 위치 복원
        const scrollPosition = currentState?.previousScrollPosition;
        console.log('[closePostDetailAndRestore] 복원할 스크롤 위치:', scrollPosition);
        
        // 스크롤 위치 복원 (undefined나 null이 아닌 경우에만)
        if (scrollPosition !== undefined && scrollPosition !== null) {
            this.restoreScrollPosition(scrollPosition);
        }
    }
    
    /**
     * 스크롤 위치 복원 헬퍼 함수
     * @param {number} scrollPosition - 복원할 스크롤 위치
     */
    restoreScrollPosition(scrollPosition) {
        console.log('[restoreScrollPosition] 복원 시작 - 목표 위치:', scrollPosition);
        
        // 스크롤 복원 함수
        const performRestore = () => {
            const { container, containerType } = this.getScrollContainer();
            
            if (container === window) {
                window.scrollTo(0, scrollPosition);
            } else if (container) {
                container.scrollTop = scrollPosition;
            }
            
            // 복원 후 실제 위치 확인
            let actualScroll = 0;
            if (container === window) {
                actualScroll = window.scrollY || window.pageYOffset;
            } else if (container) {
                actualScroll = container.scrollTop;
            }
            
            const success = Math.abs(actualScroll - scrollPosition) < 10; // 10px 오차 허용
            
            console.log(`[restoreScrollPosition] ${containerType} 복원 - 목표: ${scrollPosition}, 실제: ${actualScroll}, 성공: ${success}`);
            
            return success;
        };
        
        // 첫 번째 시도 (다음 프레임 - 모달 닫기 애니메이션 후)
        requestAnimationFrame(() => {
            const success = performRestore();
            
            if (success) {
                console.log('[restoreScrollPosition] 1프레임 후 복원 성공');
                return;
            }
            
            // 두 번째 시도 (100ms 후 - 최종)
            setTimeout(() => {
                performRestore();
                console.log('[restoreScrollPosition] 최종 복원 완료');
            }, 100);
        });
    }
    
    /**
     * 하위 호환성을 위한 별칭 (deprecated)
     */
    closePostDetailOnly(previousState) {
        this.closePostDetailAndRestore(previousState);
    }
    
    closeArtworkDetailOnly(previousState) {
        this.closePostDetailAndRestore(previousState);
    }
    
    closeFeedDetailOnly(previousState) {
        this.closePostDetailAndRestore(previousState);
    }

    /**
     * 모든 모달 닫기
     */
    closeAllModals() {
        const detailModal = document.getElementById('artwork-detail-modal');
        if (detailModal && detailModal.style.display !== 'none') {
            const detailVideo = document.getElementById('artwork-detail-video');
            if (detailVideo && !detailVideo.paused) detailVideo.pause();
        }
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
    }

    /**
     * 복원 중인지 확인
     */
    isRestoringState() {
        return this.isRestoring;
    }

    // ========== 상태 추가 메서드들 ==========

    /**
     * 탭 전환 시 히스토리 추가
     */
    pushTabState(tab) {
        if (this.isRestoring) return;
        
        // 현재 스크롤 위치 저장
        const contentArea = document.querySelector('.content-area');
        const boardContainer = document.querySelector('.board-container');
        let scrollPosition = 0;
        
        if (contentArea) {
            scrollPosition = contentArea.scrollTop;
        } else if (boardContainer) {
            scrollPosition = boardContainer.scrollTop;
        } else {
            scrollPosition = window.scrollY || window.pageYOffset;
        }
        
        history.pushState(
            { 
                type: 'tab', 
                tab: tab,
                scrollPosition: scrollPosition 
            },
            '',
            `#${tab}`
        );
    }

    /**
     * 프로필 내부 탭 전환 시 히스토리 추가
     */
    pushProfileTabState(subTab) {
        if (this.isRestoring) return;
        
        history.pushState(
            { type: 'profile-tab', tab: 'profile', subTab: subTab },
            '',
            `#profile/${subTab}`
        );
    }

    /**
     * 모달 열기 시 히스토리 추가
     */
    pushModalState(modalId, data = null) {
        if (this.isRestoring) return;
        
        history.pushState(
            { type: 'modal', modalId: modalId, data: data },
            '',
            `#${modalId}`
        );
    }

    /**
     * 작품 상세 열기 시 히스토리 추가 (통합)
     * @param {string} artworkId - 게시물 ID
     * @param {string} postType - 게시물 타입
     * @param {number} previousScrollPosition - 모달 열기 전 스크롤 위치
     */
    pushArtworkDetailState(artworkId, postType = 'gallery', previousScrollPosition = 0) {
        if (this.isRestoring) return;
        
        this._lastPostDetailScrollPosition = previousScrollPosition;
        console.log('pushArtworkDetailState - 이전 스크롤 위치 저장:', previousScrollPosition);
        
        history.pushState(
            { 
                type: 'post-detail',
                postId: artworkId,
                postType: postType,
                previousScrollPosition: previousScrollPosition  // 모달 열기 전 위치 저장
            },
            '',
            `#post/${artworkId}`
        );
    }

    /**
     * 피드 상세 열기 시 히스토리 추가 (통합)
     */
    pushFeedDetailState(postId, postType = 'feed', previousScrollPosition = 0) {
        if (this.isRestoring) return;
        
        // pushArtworkDetailState와 통합
        this.pushArtworkDetailState(postId, postType, previousScrollPosition);
    }
    
    /**
     * 게시물 상세 열기 시 히스토리 추가 (통합 함수)
     */
    pushPostDetailState(postId, postType = 'gallery', previousScrollPosition = 0) {
        this.pushArtworkDetailState(postId, postType, previousScrollPosition);
    }
    
    /**
     * 현재 스크롤 컨테이너와 위치 가져오기
     * @returns {Object} { container, scrollTop, containerType }
     */
    getScrollContainer() {
        const contentArea = document.querySelector('.content-area');
        const boardContainer = document.querySelector('.board-container');
        
        // contentArea가 표시되고 스크롤 가능한 경우
        if (contentArea && 
            contentArea.offsetParent !== null && 
            contentArea.scrollHeight > contentArea.clientHeight) {
            return {
                container: contentArea,
                scrollTop: contentArea.scrollTop,
                containerType: 'contentArea'
            };
        }
        
        // boardContainer가 표시되고 스크롤 가능한 경우
        if (boardContainer && 
            boardContainer.offsetParent !== null && 
            boardContainer.scrollHeight > boardContainer.clientHeight) {
            return {
                container: boardContainer,
                scrollTop: boardContainer.scrollTop,
                containerType: 'boardContainer'
            };
        }
        
        // boardContainer가 있고 표시 중이면 (스크롤 가능 여부와 관계없이)
        // 현재 스크롤 위치 반환
        if (boardContainer && boardContainer.offsetParent !== null) {
            return {
                container: boardContainer,
                scrollTop: boardContainer.scrollTop,
                containerType: 'boardContainer'
            };
        }
        
        // contentArea가 있고 표시 중이면
        if (contentArea && contentArea.offsetParent !== null) {
            return {
                container: contentArea,
                scrollTop: contentArea.scrollTop,
                containerType: 'contentArea'
            };
        }
        
        // fallback: window
        return {
            container: window,
            scrollTop: window.scrollY || window.pageYOffset,
            containerType: 'window'
        };
    }
    
    /**
     * 현재 스크롤 위치 가져오기
     */
    getCurrentScrollPosition() {
        const { container, scrollTop, containerType } = this.getScrollContainer();
        
        // 디버깅: 컨테이너 정보 출력
        if (container !== window) {
            console.log(`[getCurrentScrollPosition] ${containerType} 정보:`, {
                scrollTop: scrollTop,
                scrollHeight: container.scrollHeight,
                clientHeight: container.clientHeight,
                offsetParent: container.offsetParent !== null,
                display: window.getComputedStyle(container).display
            });
        }
        
        console.log(`[getCurrentScrollPosition] ${containerType}에서 스크롤 위치 가져옴:`, scrollTop);
        return scrollTop;
    }

    /**
     * 뒤로 가기 실행
     */
    goBack() {
        history.back();
    }

    /**
     * 현재 히스토리 상태에 스크롤 위치 업데이트 (deprecated - 제거 예정)
     * @deprecated pushArtworkDetailState의 previousScrollPosition 파라미터 사용
     */
    updateCurrentStateScrollPosition(scrollPosition) {
        console.warn('[DEPRECATED] updateCurrentStateScrollPosition - pushArtworkDetailState의 previousScrollPosition 사용 권장');
        if (this.isRestoring) return;
        
        const currentState = history.state;
        if (currentState) {
            history.replaceState(
                { ...currentState, previousScrollPosition: scrollPosition },
                '',
                window.location.hash
            );
        }
    }
}

// 싱글톤 인스턴스 생성 및 export
export const historyManager = new HistoryManager();
