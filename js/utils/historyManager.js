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
     */
    restoreTab(state) {
        // 모든 모달 닫기 (히스토리 없이)
        this.closeAllModals();
        
        // 탭 전환
        if (window.switchToTab) {
            window.switchToTab(state.tab);
        }
        
        // 스크롤 위치 복원
        if (state.scrollPosition !== undefined) {
            requestAnimationFrame(() => {
                const contentArea = document.querySelector('.content-area');
                const boardContainer = document.querySelector('.board-container');
                
                if (contentArea) {
                    contentArea.scrollTop = state.scrollPosition;
                } else if (boardContainer) {
                    boardContainer.scrollTop = state.scrollPosition;
                } else {
                    window.scrollTo(0, state.scrollPosition);
                }
                
                // 추가 안전장치
                setTimeout(() => {
                    if (contentArea) {
                        contentArea.scrollTop = state.scrollPosition;
                    } else if (boardContainer) {
                        boardContainer.scrollTop = state.scrollPosition;
                    } else {
                        window.scrollTo(0, state.scrollPosition);
                    }
                }, 50);
            });
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
        
        // 프로필 내부 탭 전환 (클릭 이벤트로 처리)
        setTimeout(() => {
            const profileTab = document.querySelector(`.profile-tab[data-profile-tab="${state.subTab}"]`);
            if (profileTab) {
                // 직접 탭 전환 (이벤트 발생 안 함)
                const profileTabs = document.querySelectorAll('.profile-tab:not(.logout-tab)');
                profileTabs.forEach(btn => btn.classList.remove('active'));
                profileTab.classList.add('active');
                
                const profileContents = document.querySelectorAll('.profile-tab-content');
                profileContents.forEach(content => {
                    content.style.display = 'none';
                    content.classList.remove('active');
                });
                
                const targetContent = document.getElementById('profile-' + state.subTab + '-content');
                if (targetContent) {
                    targetContent.style.display = 'block';
                    targetContent.classList.add('active');
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
        
        document.body.style.overflow = 'auto';
        
        // 이전 상태(모달 열기 전 상태)의 스크롤 위치 복원
        const scrollPosition = currentState?.previousScrollPosition || 0;
        console.log('[closePostDetailAndRestore] 복원할 스크롤 위치:', scrollPosition);
        
        // 스크롤 위치 복원
        this.restoreScrollPosition(scrollPosition);
    }
    
    /**
     * 스크롤 위치 복원 헬퍼 함수
     */
    restoreScrollPosition(scrollPosition) {
        console.log('[restoreScrollPosition] 복원 시작 - 목표 위치:', scrollPosition);
        
        if (scrollPosition === 0) {
            console.log('[restoreScrollPosition] 목표 위치가 0이므로 복원 불필요');
            return;
        }
        
        // 스크롤 복원 함수
        const performRestore = () => {
            const contentArea = document.querySelector('.content-area');
            const boardContainer = document.querySelector('.board-container');
            
            let currentScroll = 0;
            let target = null;
            
            if (contentArea) {
                contentArea.scrollTop = scrollPosition;
                currentScroll = contentArea.scrollTop;
                target = 'contentArea';
            } else if (boardContainer) {
                boardContainer.scrollTop = scrollPosition;
                currentScroll = boardContainer.scrollTop;
                target = 'boardContainer';
            } else {
                window.scrollTo(0, scrollPosition);
                currentScroll = window.scrollY || window.pageYOffset;
                target = 'window';
            }
            
            const success = Math.abs(currentScroll - scrollPosition) < 10; // 10px 오차 허용
            console.log(`[restoreScrollPosition] ${target} 복원 시도 - 목표: ${scrollPosition}, 현재: ${currentScroll}, 성공: ${success}`);
            
            return { target, currentScroll, success };
        };
        
        // 첫 번째 시도 (즉시)
        let result = performRestore();
        
        // 성공하면 종료
        if (result.success) {
            console.log('[restoreScrollPosition] 즉시 복원 성공');
            return;
        }
        
        // 두 번째 시도 (다음 프레임)
        requestAnimationFrame(() => {
            result = performRestore();
            
            if (result.success) {
                console.log('[restoreScrollPosition] 1프레임 후 복원 성공');
                return;
            }
            
            // 세 번째 시도 (50ms 후)
            setTimeout(() => {
                result = performRestore();
                
                if (result.success) {
                    console.log('[restoreScrollPosition] 50ms 후 복원 성공');
                    return;
                }
                
                // 네 번째 시도 (100ms 후)
                setTimeout(() => {
                    result = performRestore();
                    
                    if (result.success) {
                        console.log('[restoreScrollPosition] 100ms 후 복원 성공');
                        return;
                    }
                    
                    // 다섯 번째 시도 (200ms 후 - 최종)
                    setTimeout(() => {
                        result = performRestore();
                        console.log(`[restoreScrollPosition] 최종 복원 완료 (${result.target}) - 목표: ${scrollPosition}, 최종: ${result.currentScroll}`);
                    }, 200);
                }, 100);
            }, 50);
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
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = '';
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
     * 현재 스크롤 위치 가져오기
     */
    getCurrentScrollPosition() {
        const contentArea = document.querySelector('.content-area');
        const boardContainer = document.querySelector('.board-container');
        
        let scrollPos = 0;
        let source = 'none';
        
        if (contentArea) {
            scrollPos = contentArea.scrollTop;
            source = 'contentArea';
        } else if (boardContainer) {
            scrollPos = boardContainer.scrollTop;
            source = 'boardContainer';
        } else {
            scrollPos = window.scrollY || window.pageYOffset;
            source = 'window';
        }
        
        console.log(`[getCurrentScrollPosition] ${source}에서 스크롤 위치 가져옴:`, scrollPos);
        return scrollPos;
    }

    /**
     * 뒤로 가기 실행
     */
    goBack() {
        history.back();
    }

    /**
     * 현재 히스토리 상태에 스크롤 위치 업데이트 (deprecated)
     * 이제 pushArtworkDetailState에서 previousScrollPosition으로 처리
     */
    updateCurrentStateScrollPosition(scrollPosition) {
        console.log('[deprecated] updateCurrentStateScrollPosition - pushArtworkDetailState의 previousScrollPosition 사용 권장');
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
