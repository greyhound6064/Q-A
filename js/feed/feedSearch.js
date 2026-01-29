/**
 * @file feedSearch.js
 * @description 피드 검색 및 태그 필터 로직
 */

import { setFeedPosts, renderFeedList } from './feedCore.js';
import { applySorting } from './feedSort.js';
import { searchTags } from '../services/tagService.js';
import { escapeHtml } from '../utils.js';

// ========== 전역 상태 ==========
let searchKeyword = '';
let selectedTags = [];

/**
 * 현재 검색 키워드 가져오기
 */
export function getSearchKeyword() {
    return searchKeyword;
}

/**
 * 선택된 태그 가져오기
 */
export function getSelectedTags() {
    return selectedTags;
}

/**
 * 검색 및 필터 적용
 */
export function applySearchAndFilter(allPosts = null) {
    // 전역 상태에서 가져오기
    const posts = allPosts || (window._feedState ? window._feedState.allFeedPosts : []);
    let filteredPosts = [...posts];
    
    // 태그 필터 적용
    if (selectedTags.length > 0) {
        filteredPosts = filteredPosts.filter(post => {
            if (!post.tags || post.tags.length === 0) return false;
            return selectedTags.every(selectedTag => 
                post.tags.some(tag => tag === selectedTag)
            );
        });
    }
    
    // 검색 필터 적용
    if (searchKeyword.trim()) {
        const keyword = searchKeyword.toLowerCase().trim();
        filteredPosts = filteredPosts.filter(post => {
            const title = (post.title || '').toLowerCase();
            const description = (post.description || '').toLowerCase();
            const author = (post.author_nickname || '').toLowerCase();
            
            return title.includes(keyword) || 
                   description.includes(keyword) || 
                   author.includes(keyword);
        });
    }
    
    // 정렬 적용
    const sortedPosts = applySorting(filteredPosts);
    setFeedPosts(sortedPosts);
    
    return sortedPosts;
}

/**
 * 검색 실행
 */
export async function performSearch() {
    const searchInput = document.getElementById('feed-search-input');
    if (!searchInput) return;
    
    searchKeyword = searchInput.value.trim();
    
    // 검색어가 있으면 클리어 버튼 표시
    const clearBtn = document.getElementById('feed-search-clear');
    if (clearBtn) {
        clearBtn.style.display = (searchKeyword || selectedTags.length > 0) ? 'flex' : 'none';
    }
    
    applySearchAndFilter();
    await renderFeedList();
}

/**
 * 검색 초기화
 */
export async function clearSearch() {
    const searchInput = document.getElementById('feed-search-input');
    const clearBtn = document.getElementById('feed-search-clear');
    
    if (searchInput) {
        searchInput.value = '';
        searchKeyword = '';
    }
    
    if (clearBtn) {
        clearBtn.style.display = 'none';
    }
    
    // 태그 필터도 초기화
    selectedTags = [];
    updateSelectedTagsUI();
    
    applySearchAndFilter();
    await renderFeedList();
}

/**
 * 태그 필터 추가
 */
export async function addTagFilter() {
    const tagInput = document.getElementById('feed-tag-input');
    if (!tagInput) return;
    
    const tagValue = tagInput.value.trim().toLowerCase().replace(/^#/, '');
    
    if (tagValue && !selectedTags.includes(tagValue)) {
        selectedTags.push(tagValue);
        updateSelectedTagsUI();
        applySearchAndFilter();
        await renderFeedList();
    }
    
    tagInput.value = '';
    
    // 자동완성 숨기기
    const suggestions = document.getElementById('feed-tag-suggestions');
    if (suggestions) suggestions.style.display = 'none';
}

/**
 * 태그 자동완성 검색
 */
export async function searchTagSuggestions() {
    const tagInput = document.getElementById('feed-tag-input');
    const suggestionsContainer = document.getElementById('feed-tag-suggestions');
    
    if (!tagInput || !suggestionsContainer) return;
    
    const searchQuery = tagInput.value.trim().toLowerCase().replace(/^#/, '');
    
    // 입력이 없으면 숨기기
    if (!searchQuery) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    
    try {
        // 서비스 레이어 사용
        const tags = await searchTags(searchQuery, 10);
        
        // 결과가 있으면 표시
        if (tags && tags.length > 0) {
            suggestionsContainer.innerHTML = tags.map(tag => `
                <div class="feed-tag-suggestion-item" onclick="selectTagSuggestion('${tag.name}')">
                    <span class="feed-tag-suggestion-name">#${tag.name}</span>
                    <span class="feed-tag-suggestion-count">${tag.usage_count}개</span>
                </div>
            `).join('');
            suggestionsContainer.style.display = 'block';
        } else {
            suggestionsContainer.innerHTML = '<div class="feed-tag-suggestions-empty">검색 결과가 없습니다</div>';
            suggestionsContainer.style.display = 'block';
        }
    } catch (error) {
        console.error('태그 검색 에러:', error);
        suggestionsContainer.style.display = 'none';
    }
}

/**
 * 태그 자동완성 선택
 */
export function selectTagSuggestion(tagName) {
    const tagInput = document.getElementById('feed-tag-input');
    if (tagInput) {
        tagInput.value = tagName;
    }
    addTagFilter();
}

/**
 * 태그 필터 토글
 */
export async function toggleTagFilter(tagName) {
    const index = selectedTags.indexOf(tagName);
    
    if (index > -1) {
        selectedTags.splice(index, 1);
    } else {
        selectedTags.push(tagName);
    }
    
    updateSelectedTagsUI();
    applySearchAndFilter();
    await renderFeedList();
}

/**
 * 선택된 태그 UI 업데이트
 */
function updateSelectedTagsUI() {
    const selectedTagsContainer = document.getElementById('feed-selected-tags');
    if (!selectedTagsContainer) return;
    
    if (selectedTags.length === 0) {
        selectedTagsContainer.style.display = 'none';
        selectedTagsContainer.innerHTML = '';
        
        // 클리어 버튼 업데이트
        const clearBtn = document.getElementById('feed-search-clear');
        const searchInput = document.getElementById('feed-search-input');
        if (clearBtn && searchInput) {
            clearBtn.style.display = searchInput.value.trim() ? 'flex' : 'none';
        }
        return;
    }
    
    selectedTagsContainer.style.display = 'flex';
    selectedTagsContainer.innerHTML = selectedTags.map(tag => `
        <div class="feed-selected-tag">
            #${tag}
            <button class="feed-tag-remove" onclick="toggleTagFilter('${tag}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `).join('');
    
    // 클리어 버튼 표시
    const clearBtn = document.getElementById('feed-search-clear');
    if (clearBtn) {
        clearBtn.style.display = 'flex';
    }
    
    // 태그 칩 활성화 상태 업데이트
    document.querySelectorAll('.feed-tag-chip').forEach(chip => {
        const tagName = chip.textContent.trim().split('\n')[0].substring(1);
        if (selectedTags.includes(tagName)) {
            chip.classList.add('active');
        } else {
            chip.classList.remove('active');
        }
    });
}

/**
 * 태그 드롭다운 토글
 */
export function toggleTagFilterDropdown() {
    const dropdown = document.getElementById('feed-tag-dropdown');
    const sortDropdown = document.getElementById('feed-sort-dropdown');
    const tagBtn = document.getElementById('tag-filter-btn');
    const sortBtn = document.getElementById('sort-filter-btn');
    const tagInput = document.getElementById('feed-tag-input');
    
    if (dropdown.style.display === 'none') {
        dropdown.style.display = 'block';
        tagBtn.classList.add('active');
        // 정렬 드롭다운 닫기
        sortDropdown.style.display = 'none';
        sortBtn.classList.remove('active');
        // 태그 입력창에 포커스
        setTimeout(() => {
            if (tagInput) {
                tagInput.focus();
            }
        }, 100);
    } else {
        dropdown.style.display = 'none';
        tagBtn.classList.remove('active');
        // 자동완성 숨기기
        const suggestionsContainer = document.getElementById('feed-tag-suggestions');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
    }
}
