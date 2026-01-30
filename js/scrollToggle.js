/**
 * @file scrollToggle.js
 * @description 스크롤 방향에 따라 네비게이션 요소 표시/숨김 처리
 */

let scrollTimeout = null;
let lastScrollY = 0;
let isScrollingDown = false;

/**
 * 스크롤 이벤트 핸들러
 */
function handleScroll(event) {
    // 현재 활성화된 탭 확인
    const galleryTab = document.getElementById('gallery-tab-content');
    const feedTab = document.getElementById('feed-tab-content');
    
    // 작품관 또는 자유게시판이 활성화되어 있을 때만 동작
    const isGalleryActive = galleryTab && galleryTab.style.display !== 'none';
    const isFeedActive = feedTab && feedTab.style.display !== 'none';
    
    if (!isGalleryActive && !isFeedActive) {
        // 프로필, 쪽지, 사용자 검색 탭에서는 동작하지 않음
        return;
    }
    
    const scrollElement = event.target;
    const currentScrollY = scrollElement.scrollTop || 0;
    
    // 스크롤 방향 감지 (최소 10px 이상 이동)
    if (Math.abs(currentScrollY - lastScrollY) > 10) {
        const scrollingDown = currentScrollY > lastScrollY;
        
        // 스크롤 방향이 변경되었을 때만 UI 업데이트
        if (scrollingDown !== isScrollingDown) {
            isScrollingDown = scrollingDown;
            updateNavigationVisibility(scrollingDown);
        }
        
        lastScrollY = currentScrollY;
    }
}

/**
 * 네비게이션 요소들의 가시성 업데이트
 * @param {boolean} hide - true면 숨김, false면 표시
 */
function updateNavigationVisibility(hide) {
    // 상단 헤더 (모바일에서 사이드바가 헤더로 변경됨)
    const sidebar = document.querySelector('.sidebar');
    
    // 하단 네비게이션
    const bottomNav = document.querySelector('.mobile-bottom-nav');
    
    // 콘텐츠 영역
    const contentArea = document.querySelector('.content-area');
    
    // 플로팅 액션 버튼 그룹 (작품관, 피드)
    const floatingButtonGroups = document.querySelectorAll('.floating-action-buttons');
    
    // 검색 토글 래퍼 (데스크톱)
    const galleryWrapper = document.querySelector('#gallery-tab-content .search-toggle-wrapper');
    const feedWrapper = document.querySelector('#feed-tab-content .search-toggle-wrapper');
    
    if (hide) {
        // 아래로 스크롤: 모든 네비게이션 숨김
        if (sidebar) sidebar.classList.add('hidden');
        if (bottomNav) bottomNav.classList.add('hidden');
        if (contentArea) contentArea.classList.add('nav-hidden');
        floatingButtonGroups.forEach(group => {
            const buttons = group.querySelectorAll('.floating-add-btn, .search-toggle-btn');
            buttons.forEach(btn => btn.classList.add('hidden'));
        });
        if (galleryWrapper) galleryWrapper.classList.add('hidden');
        if (feedWrapper) feedWrapper.classList.add('hidden');
    } else {
        // 위로 스크롤: 모든 네비게이션 표시
        if (sidebar) sidebar.classList.remove('hidden');
        if (bottomNav) bottomNav.classList.remove('hidden');
        if (contentArea) contentArea.classList.remove('nav-hidden');
        floatingButtonGroups.forEach(group => {
            const buttons = group.querySelectorAll('.floating-add-btn, .search-toggle-btn');
            buttons.forEach(btn => btn.classList.remove('hidden'));
        });
        if (galleryWrapper) galleryWrapper.classList.remove('hidden');
        if (feedWrapper) feedWrapper.classList.remove('hidden');
    }
}

/**
 * 스크롤 토글 초기화
 */
export function initScrollToggle() {
    // content-area에 스크롤 이벤트 리스너 추가
    const contentArea = document.querySelector('.content-area');
    if (contentArea) {
        contentArea.addEventListener('scroll', handleScroll);
        console.log('스크롤 방향 감지 초기화 완료 - 작품관/자유게시판에서만 네비게이션 숨김');
        
        // 초기 상태: 모든 네비게이션 표시
        updateNavigationVisibility(false);
    } else {
        console.warn('content-area를 찾을 수 없습니다');
    }
}

/**
 * 탭 전환 시 네비게이션 상태 초기화
 */
export function resetNavigationVisibility() {
    updateNavigationVisibility(false);
    isScrollingDown = false;
    lastScrollY = 0;
}

/**
 * 검색 패널이 열려있을 때는 버튼을 계속 표시
 */
export function keepSearchToggleVisible(tabName) {
    const wrapper = document.querySelector(`#${tabName}-tab-content .search-toggle-wrapper`);
    if (wrapper) {
        wrapper.classList.add('visible');
        
        // 타이머 제거
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
    }
}

/**
 * 검색 패널이 닫힐 때 버튼 숨김
 */
export function hideSearchToggle(tabName) {
    const wrapper = document.querySelector(`#${tabName}-tab-content .search-toggle-wrapper`);
    if (wrapper) {
        wrapper.classList.remove('visible');
    }
}
