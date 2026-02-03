/**
 * @file tabs.js
 * @description 탭 전환 기능 (메인 탭, 프로필 내부 탭)
 */

import { showLoginRequiredModal } from './utils/errorHandler.js';
import { historyManager } from './utils/historyManager.js';
import { updateMetaTags, SEO_CONFIGS } from './utils/seoHelper.js';

// ========== 메인 탭 전환 ==========
export function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const targetTab = this.getAttribute('data-tab');
            
            // 로그인 필요 탭 체크
            if (targetTab === 'profile' || targetTab === 'messages') {
                const { data: { session } } = await window._supabase.auth.getSession();
                if (!session) {
                    showLoginRequiredModal();
                    return;
                }
            }
            
            switchToTab(targetTab);
        });
    });
    
    // 프로필 페이지 내부 탭 초기화
    initProfileTabs();
    
    // 모바일 네비게이션 초기화
    initMobileNav();
}

// ========== 모바일 네비게이션 초기화 ==========
function initMobileNav() {
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    const mobileNav = document.querySelector('.mobile-bottom-nav');
    
    // 화면 크기에 따라 모바일 네비게이션 표시/숨김
    function toggleMobileNav() {
        if (window.innerWidth <= 768) {
            if (mobileNav) mobileNav.style.display = 'flex';
        } else {
            if (mobileNav) mobileNav.style.display = 'none';
        }
    }
    
    // 초기 실행
    toggleMobileNav();
    
    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', toggleMobileNav);
    
    // 모바일 네비게이션 아이템 클릭 이벤트
    mobileNavItems.forEach(item => {
        item.addEventListener('click', async function() {
            const targetTab = this.getAttribute('data-tab');
            
            // 로그인 필요 탭 체크
            if (targetTab === 'profile' || targetTab === 'messages') {
                const { data: { session } } = await window._supabase.auth.getSession();
                if (!session) {
                    showLoginRequiredModal();
                    return;
                }
            }
            
            // 모바일 네비게이션 아이템 active 클래스 업데이트
            mobileNavItems.forEach(navItem => navItem.classList.remove('active'));
            this.classList.add('active');
            
            switchToTab(targetTab);
        });
    });
}

// ========== 타인 프로필로 전환 (프로필 탭 표시 + 프로필 버튼 활성화) ==========
export function switchToOtherProfile() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    
    // 모든 탭 버튼의 active 클래스 제거
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // 프로필 탭 버튼만 active (타인 프로필이어도 프로필 화면이므로 프로필 탭이 선택된 상태로 표시)
    const profileTabBtn = document.querySelector('.tab-button[data-tab="profile"]');
    if (profileTabBtn) profileTabBtn.classList.add('active');
    
    // 모바일 네비도 프로필로 동기화
    mobileNavItems.forEach(item => {
        if (item.getAttribute('data-tab') === 'profile') {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // 모든 탭 콘텐츠 숨기기
    tabContents.forEach(content => {
        content.style.display = 'none';
        content.classList.remove('active');
    });
    
    // 프로필 탭 콘텐츠만 표시
    const profileContent = document.getElementById('profile-tab-content');
    if (profileContent) {
        profileContent.style.display = 'block';
        profileContent.classList.add('active');
    }
}

// ========== 탭 전환 함수 (외부에서 호출 가능) ==========
export function switchToTab(targetTab) {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    
    // 히스토리 추가 (복원 중이 아닐 때만)
    if (!historyManager.isRestoringState()) {
        historyManager.pushTabState(targetTab);
    }
    
    // 모든 탭 버튼의 active 클래스 제거
    tabButtons.forEach(btn => btn.classList.remove('active'));
    // 대상 탭 버튼에 active 클래스 추가
    const targetButton = document.querySelector(`.tab-button[data-tab="${targetTab}"]`);
    if (targetButton) targetButton.classList.add('active');
    
    // 모바일 네비게이션 아이템도 동기화
    mobileNavItems.forEach(item => {
        if (item.getAttribute('data-tab') === targetTab) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // 모든 탭 콘텐츠 숨기기
    tabContents.forEach(content => {
        content.style.display = 'none';
        content.classList.remove('active');
    });
    
    // 선택한 탭 콘텐츠 표시
    const targetContent = document.getElementById(targetTab + '-tab-content');
    if (targetContent) {
        targetContent.style.display = 'block';
        targetContent.classList.add('active');
        
        // SEO 메타 태그 업데이트
        if (SEO_CONFIGS[targetTab]) {
            updateMetaTags(SEO_CONFIGS[targetTab]);
        }
        
        // 프로필 탭이 활성화되면 프로필 정보 업데이트 (본인 프로필로 복귀)
        if (targetTab === 'profile') {
            if (window.updateProfileInfo) window.updateProfileInfo();
        }
        // 게시판 탭이 활성화되면 초기화
        else if (targetTab === 'board') {
            if (window.initBoard) window.initBoard();
        }
        // 자유 게시판 탭이 활성화되면 피드 초기화 (하위 호환성)
        else if (targetTab === 'gallery') {
            if (window.initGallery) window.initGallery();
        }
        // 자유 게시판 탭이 활성화되면 피드 초기화 (하위 호환성)
        else if (targetTab === 'feed') {
            if (window.initFeed) window.initFeed();
        }
        // 쪽지함 탭이 활성화되면 쪽지 초기화
        else if (targetTab === 'messages') {
            if (window.initMessages) window.initMessages();
        }
        // 사용자 검색 탭이 활성화되면 초기화
        else if (targetTab === 'user-search') {
            if (window.initUserSearch) window.initUserSearch();
        }
    }
}

// ========== 프로필 페이지 내부 탭 전환 ==========
export function initProfileTabs() {
    const profileTabs = document.querySelectorAll('.profile-tab:not(.logout-tab)');
    
    profileTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-profile-tab');
            
            // 로그아웃 탭이 아닌 경우에만 탭 전환
            if (!targetTab) return;
            
            // 히스토리 추가 (복원 중이 아닐 때만)
            if (!historyManager.isRestoringState()) {
                historyManager.pushProfileTabState(targetTab);
            }
            
            // 모든 프로필 탭 버튼의 active 클래스 제거
            profileTabs.forEach(btn => btn.classList.remove('active'));
            // 클릭한 탭 버튼에 active 클래스 추가
            this.classList.add('active');
            
            // 모든 프로필 탭 콘텐츠 숨기기
            const profileContents = document.querySelectorAll('.profile-tab-content');
            profileContents.forEach(content => {
                content.style.display = 'none';
                content.classList.remove('active');
            });
            
            // 선택한 탭 콘텐츠 표시
            const targetContent = document.getElementById('profile-' + targetTab + '-content');
            if (targetContent) {
                targetContent.style.display = 'block';
                targetContent.classList.add('active');
            }
            
            // 내 게시물 탭이 선택되면 그리드 렌더링
            if (targetTab === 'posts') {
                // 현재 보고 있는 사용자 ID로 렌더링
                const currentUserId = window.getCurrentViewingUserId ? window.getCurrentViewingUserId() : null;
                // 서브 탭을 'gallery'로 활성화
                const subTabs = document.querySelectorAll('.profile-sub-tab');
                subTabs.forEach(tab => {
                    if (tab.dataset.postFilter === 'gallery') {
                        tab.classList.add('active');
                    } else {
                        tab.classList.remove('active');
                    }
                });
                // 기본 필터를 'gallery'로 설정하여 렌더링
                if (window.renderArtworksGrid) window.renderArtworksGrid(currentUserId, 'gallery');
            } else if (targetTab === 'saved') {
                // 저장된 게시물 탭이 선택되면 저장된 게시물 렌더링
                if (window.renderSavedArtworks) window.renderSavedArtworks();
            } else if (targetTab === 'follow') {
                // 팔로워·팔로잉 통합 탭: 둘 다 렌더링
                if (window.renderFollowUnified) window.renderFollowUnified();
            } else {
                // 다른 탭에서는 플로팅 버튼 숨김
                const floatingBtn = document.getElementById('floating-upload-btn');
                if (floatingBtn) floatingBtn.style.display = 'none';
            }
        });
    });
}
