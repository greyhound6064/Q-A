/**
 * @file feedSort.js
 * @description 피드 정렬 로직 - sortingService 사용
 */

import { setFeedPosts, renderFeedList } from './feedCore.js';
import { sortPosts } from '../services/sortingService.js';

// ========== 전역 상태 ==========
let currentSortMode = 'latest'; // latest, popular, trending

/**
 * 현재 정렬 모드 가져오기
 */
export function getCurrentSortMode() {
    return currentSortMode;
}

/**
 * 정렬 모드 변경
 */
export async function changeSortMode(mode) {
    currentSortMode = mode;
    
    // 드롭다운 옵션 활성화 상태 변경
    document.querySelectorAll('#feed-sort-dropdown .feed-sort-option').forEach(btn => {
        btn.classList.remove('active');
    });
    const targetBtn = document.querySelector(`#feed-sort-dropdown .feed-sort-option[data-sort="${mode}"]`);
    if (targetBtn) targetBtn.classList.add('active');
    
    // 정렬 적용
    if (window.applySearchAndFilter) {
        window.applySearchAndFilter();
    }
    
    // 피드 렌더링
    await renderFeedList();
    
    // 드롭다운 닫기
    const dropdown = document.getElementById('feed-sort-dropdown');
    const sortBtn = document.getElementById('sort-filter-btn');
    if (dropdown) dropdown.style.display = 'none';
    if (sortBtn) sortBtn.classList.remove('active');
}

/**
 * 정렬 적용 (sortingService 사용)
 */
export function applySorting(posts) {
    const targetPosts = posts ? [...posts] : [];
    const sorted = sortPosts(targetPosts, currentSortMode);
    
    if (!posts) {
        setFeedPosts(sorted);
    }
    
    return sorted;
}

/**
 * 검색 패널 토글
 */
export function toggleFeedSearchPanel() {
    const panel = document.getElementById('feed-search-panel');
    const toggleBtn = document.getElementById('feed-search-toggle');
    
    if (panel) {
        const isVisible = panel.style.display === 'block';
        panel.style.display = isVisible ? 'none' : 'block';
        
        if (toggleBtn) {
            if (isVisible) {
                toggleBtn.classList.remove('active');
            } else {
                toggleBtn.classList.add('active');
            }
        }
    }
}

/**
 * 정렬 드롭다운 토글
 */
export function toggleSortFilter() {
    const dropdown = document.getElementById('feed-sort-dropdown');
    const tagDropdown = document.getElementById('feed-tag-dropdown');
    const sortBtn = document.getElementById('sort-filter-btn');
    const tagBtn = document.getElementById('tag-filter-btn');
    
    if (dropdown.style.display === 'none') {
        dropdown.style.display = 'block';
        sortBtn.classList.add('active');
        // 태그 드롭다운 닫기
        tagDropdown.style.display = 'none';
        tagBtn.classList.remove('active');
    } else {
        dropdown.style.display = 'none';
        sortBtn.classList.remove('active');
    }
}
