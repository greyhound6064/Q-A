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
                this.restoreTab(state.tab);
                break;
            case 'modal':
                this.restoreModal(state);
                break;
            case 'profile-tab':
                this.restoreProfileTab(state);
                break;
            case 'artwork-detail':
                // 뒤로가기 시 상세화면 닫기만 처리
                this.closeArtworkDetailOnly();
                break;
            case 'feed-detail':
                // 뒤로가기 시 상세화면 닫기만 처리
                this.closeFeedDetailOnly();
                break;
            default:
                console.warn('Unknown history state type:', state.type);
                break;
        }
    }

    /**
     * 탭 복원 (모든 모달 닫고 탭 전환)
     */
    restoreTab(tab) {
        // 모든 모달 닫기 (히스토리 없이)
        this.closeAllModals();
        
        // 탭 전환
        if (window.switchToTab) {
            window.switchToTab(tab);
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
     * 작품 상세화면 닫기만 처리 (뒤로가기 시)
     */
    closeArtworkDetailOnly() {
        const modal = document.getElementById('artwork-detail-modal');
        if (modal && modal.style.display !== 'none') {
            // 상세보기 내 비디오 정지
            const detailVideo = document.getElementById('artwork-detail-video');
            if (detailVideo && !detailVideo.paused) {
                detailVideo.pause();
            }
            
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // ESC 리스너 제거는 closeArtworkDetail에서 처리되므로 생략
        }
    }

    /**
     * 피드 상세화면 닫기만 처리 (뒤로가기 시)
     */
    closeFeedDetailOnly() {
        const modal = document.getElementById('feed-detail-modal');
        if (modal) {
            modal.remove();
            document.body.style.overflow = 'auto';
            window._currentFeedDetailPostId = null;
        }
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
        
        history.pushState(
            { type: 'tab', tab: tab },
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
     * 작품 상세 열기 시 히스토리 추가
     */
    pushArtworkDetailState(artworkId) {
        if (this.isRestoring) return;
        
        history.pushState(
            { type: 'artwork-detail', artworkId: artworkId },
            '',
            `#artwork/${artworkId}`
        );
    }

    /**
     * 피드 상세 열기 시 히스토리 추가
     */
    pushFeedDetailState(postId, showComments = false) {
        if (this.isRestoring) return;
        
        history.pushState(
            { type: 'feed-detail', postId: postId, showComments: showComments },
            '',
            `#feed/${postId}`
        );
    }

    /**
     * 뒤로 가기 실행
     */
    goBack() {
        history.back();
    }
}

// 싱글톤 인스턴스 생성 및 export
export const historyManager = new HistoryManager();
