/**
 * @file uiHelpers.js
 * @description 공통 UI 컴포넌트 및 헬퍼 함수
 */

import { escapeHtml } from './utils.js';

/**
 * 로딩 스피너 HTML 생성
 * @param {string} message - 로딩 메시지 (선택)
 * @returns {string} 로딩 HTML
 */
export function createLoadingHTML(message = '') {
    return `
        <div class="feed-loading">
            <div class="feed-loading-spinner"></div>
            ${message ? `<p>${escapeHtml(message)}</p>` : ''}
        </div>
    `;
}

/**
 * 빈 상태 HTML 생성
 * @param {Object} options - { icon, title, message, buttonText, buttonAction }
 * @returns {string} 빈 상태 HTML
 */
export function createEmptyStateHTML(options) {
    const {
        icon = 'default',
        title = '내용이 없습니다',
        message = '',
        buttonText = '',
        buttonAction = ''
    } = options;
    
    const icons = {
        default: `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
        `,
        error: `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
        `,
        upload: `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
        `
    };
    
    return `
        <div class="feed-empty">
            <div class="feed-empty-icon">
                ${icons[icon] || icons.default}
            </div>
            <h3>${escapeHtml(title)}</h3>
            ${message ? `<p>${escapeHtml(message)}</p>` : ''}
            ${buttonText ? `
                <button class="feed-empty-btn" onclick="${buttonAction}">
                    ${escapeHtml(buttonText)}
                </button>
            ` : ''}
        </div>
    `;
}

/**
 * 에러 상태 HTML 생성
 * @param {string} message - 에러 메시지
 * @returns {string} 에러 HTML
 */
export function createErrorHTML(message) {
    return createEmptyStateHTML({
        icon: 'error',
        title: '오류가 발생했습니다',
        message: message
    });
}

/**
 * body 스크롤 잠금 (모달 열 때)
 */
export function lockBodyScroll() {
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
}

/**
 * body 스크롤 해제 (모달 닫을 때)
 */
export function unlockBodyScroll() {
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
}

/**
 * 모달 열기
 * @param {string} modalId - 모달 ID
 */
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.style.display = 'flex';
    lockBodyScroll();
}

/**
 * 모달 닫기
 * @param {string} modalId - 모달 ID
 */
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.style.display = 'none';
    unlockBodyScroll();
}

/**
 * 요소 표시/숨김 토글
 * @param {string} elementId - 요소 ID
 * @param {boolean} show - 표시 여부 (선택)
 */
export function toggleElement(elementId, show = null) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (show === null) {
        element.style.display = element.style.display === 'none' ? '' : 'none';
    } else {
        element.style.display = show ? '' : 'none';
    }
}

/**
 * 다중 이미지 인디케이터 HTML 생성
 * @param {number} count - 이미지 개수
 * @returns {string} 인디케이터 HTML
 */
export function createMultipleImageIndicator(count) {
    if (count <= 1) return '';
    
    return `
        <div class="feed-multiple-indicator">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <rect x="7" y="7" width="10" height="10" rx="1" ry="1"></rect>
            </svg>
            ${count}
        </div>
    `;
}

/**
 * 사용자 아바타 SVG 생성
 * @param {number} size - 아이콘 크기
 * @returns {string} SVG HTML
 */
export function createUserAvatarSVG(size = 24) {
    return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>
    `;
}

/**
 * 캐러셀 인디케이터 HTML 생성
 * @param {number} total - 전체 이미지 수
 * @param {number} current - 현재 인덱스
 * @param {string} onClickFunction - 클릭 시 호출할 함수명
 * @returns {string} 인디케이터 HTML
 */
export function createCarouselIndicators(total, current, onClickFunction) {
    if (total <= 1) return '';
    
    return Array.from({ length: total }, (_, index) => 
        `<div class="artwork-carousel-indicator ${index === current ? 'active' : ''}" 
              onclick="${onClickFunction}(${index})"></div>`
    ).join('');
}

/**
 * 태그 칩 HTML 생성
 * @param {Array<string>} tags - 태그 배열
 * @param {string} onClickFunction - 클릭 시 호출할 함수명
 * @returns {string} 태그 HTML
 */
export function createTagChipsHTML(tags, onClickFunction = '') {
    if (!tags || tags.length === 0) return '';
    
    return `
        <div class="feed-item-tags">
            ${tags.map(tag => `
                <span class="feed-item-tag" ${onClickFunction ? `onclick="${onClickFunction}('${tag}')"` : ''}>
                    #${escapeHtml(tag)}
                </span>
            `).join('')}
        </div>
    `;
}

/**
 * 좋아요 버튼 HTML 생성
 * @param {Object} options - { postId, likes, isLiked }
 * @returns {string} 버튼 HTML
 */
export function createLikeButtonHTML(options) {
    const { postId, likes = 0, isLiked = false } = options;
    
    return `
        <button class="feed-action-btn like-btn ${isLiked ? 'liked' : ''}" 
                id="like-btn-${postId}" 
                onclick="toggleLike('${postId}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
            </svg>
            <span id="like-count-${postId}">${likes}</span>
        </button>
    `;
}

/**
 * 싫어요 버튼 HTML 생성
 * @param {Object} options - { postId, dislikes, isDisliked }
 * @returns {string} 버튼 HTML
 */
export function createDislikeButtonHTML(options) {
    const { postId, dislikes = 0, isDisliked = false } = options;
    
    return `
        <button class="feed-action-btn dislike-btn ${isDisliked ? 'disliked' : ''}" 
                id="dislike-btn-${postId}" 
                onclick="toggleDislike('${postId}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
            </svg>
            <span id="dislike-count-${postId}">${dislikes}</span>
        </button>
    `;
}

/**
 * 댓글 버튼 HTML 생성
 * @param {string} postId - 게시물 ID
 * @param {number} count - 댓글 수
 * @returns {string} 버튼 HTML
 */
export function createCommentButtonHTML(postId, count = 0) {
    return `
        <button class="feed-action-btn" onclick="toggleComments('${postId}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span id="comment-count-${postId}">${count}</span>
        </button>
    `;
}
