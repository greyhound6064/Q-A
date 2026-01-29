/**
 * @file feedCarousel.js
 * @description 피드 캐러셀 및 이미지 뷰어
 */

import { escapeHtml } from '../utils.js';

// ========== 전역 상태 ==========
export let currentFeedDetailFiles = []; // 현재 상세보기 파일 목록
export let currentFeedDetailFileIndex = 0; // 현재 파일 인덱스

/**
 * 상세모달 파일 목록 설정
 */
export function setFeedDetailFiles(files) {
    currentFeedDetailFiles = files;
    currentFeedDetailFileIndex = 0;
}

/**
 * 상세모달 파일 목록 가져오기
 */
export function getFeedDetailFiles() {
    return currentFeedDetailFiles;
}

/**
 * 상세모달 파일 인덱스 가져오기
 */
export function getFeedDetailFileIndex() {
    return currentFeedDetailFileIndex;
}

// ========== 리스트 캐러셀 ==========

/**
 * 피드 이미지 캐러셀 - 이전 이미지
 */
export function prevFeedImage(postId, allFiles) {
    const container = document.querySelector(`[data-feed-carousel="${postId}"]`);
    if (!container) return;
    
    const img = container.querySelector('img');
    const currentIndex = parseInt(img.dataset.fileIndex || '0');
    const newIndex = (currentIndex - 1 + allFiles.length) % allFiles.length;
    
    img.src = allFiles[newIndex];
    img.dataset.fileIndex = newIndex;
    
    // 인디케이터 업데이트
    updateFeedCarouselIndicators(container, newIndex);
}

/**
 * 피드 이미지 캐러셀 - 다음 이미지
 */
export function nextFeedImage(postId, allFiles) {
    const container = document.querySelector(`[data-feed-carousel="${postId}"]`);
    if (!container) return;
    
    const img = container.querySelector('img');
    const currentIndex = parseInt(img.dataset.fileIndex || '0');
    const newIndex = (currentIndex + 1) % allFiles.length;
    
    img.src = allFiles[newIndex];
    img.dataset.fileIndex = newIndex;
    
    // 인디케이터 업데이트
    updateFeedCarouselIndicators(container, newIndex);
}

/**
 * 피드 캐러셀 인디케이터 업데이트
 */
function updateFeedCarouselIndicators(container, activeIndex) {
    const indicators = container.querySelectorAll('.feed-carousel-indicator');
    indicators.forEach((indicator, idx) => {
        if (idx === activeIndex) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
}

// ========== 이미지 뷰어 ==========

/**
 * 이미지 크게 보기 뷰어 열기
 */
export function openImageViewer(postId, allFiles, startIndex = 0) {
    // 이미지 뷰어 모달 생성
    const existingViewer = document.getElementById('image-viewer-modal');
    if (existingViewer) {
        existingViewer.remove();
    }
    
    const viewerHTML = `
        <div id="image-viewer-modal" class="image-viewer-modal" onclick="closeImageViewer()">
            <button class="image-viewer-close" onclick="closeImageViewer()">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <div class="image-viewer-content" onclick="event.stopPropagation()">
                <img id="image-viewer-img" src="${escapeHtml(allFiles[startIndex])}" alt="이미지">
                ${allFiles.length > 1 ? `
                    <button class="image-viewer-nav image-viewer-prev" onclick="prevViewerImage()">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <button class="image-viewer-nav image-viewer-next" onclick="nextViewerImage()">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                    <div class="image-viewer-indicators">
                        ${allFiles.map((_, idx) => `<div class="image-viewer-indicator ${idx === startIndex ? 'active' : ''}"></div>`).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', viewerHTML);
    
    // 전역 변수로 현재 이미지 정보 저장
    window._imageViewerData = {
        files: allFiles,
        currentIndex: startIndex
    };
    
    // body 스크롤 방지
    document.body.style.overflow = 'hidden';
    
    // ESC 키로 닫기
    document.addEventListener('keydown', handleImageViewerEscape);
}

/**
 * 이미지 뷰어 닫기
 */
export function closeImageViewer() {
    const viewer = document.getElementById('image-viewer-modal');
    if (viewer) {
        viewer.remove();
    }
    document.body.style.overflow = 'auto';
    document.removeEventListener('keydown', handleImageViewerEscape);
    window._imageViewerData = null;
}

/**
 * 이미지 뷰어 - 이전 이미지
 */
export function prevViewerImage() {
    if (!window._imageViewerData) return;
    
    const { files, currentIndex } = window._imageViewerData;
    const newIndex = (currentIndex - 1 + files.length) % files.length;
    
    const img = document.getElementById('image-viewer-img');
    if (img) {
        img.src = files[newIndex];
    }
    
    window._imageViewerData.currentIndex = newIndex;
    updateImageViewerIndicators(newIndex);
}

/**
 * 이미지 뷰어 - 다음 이미지
 */
export function nextViewerImage() {
    if (!window._imageViewerData) return;
    
    const { files, currentIndex } = window._imageViewerData;
    const newIndex = (currentIndex + 1) % files.length;
    
    const img = document.getElementById('image-viewer-img');
    if (img) {
        img.src = files[newIndex];
    }
    
    window._imageViewerData.currentIndex = newIndex;
    updateImageViewerIndicators(newIndex);
}

/**
 * 이미지 뷰어 인디케이터 업데이트
 */
function updateImageViewerIndicators(activeIndex) {
    const indicators = document.querySelectorAll('.image-viewer-indicator');
    indicators.forEach((indicator, idx) => {
        if (idx === activeIndex) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
}

/**
 * ESC 키로 이미지 뷰어 닫기
 */
function handleImageViewerEscape(e) {
    if (e.key === 'Escape') {
        closeImageViewer();
    }
}

// ========== 상세모달 캐러셀 ==========

/**
 * 피드 상세보기 파일 캐러셀 - 이전 파일
 */
export function prevFeedDetailFile() {
    if (currentFeedDetailFiles.length === 0) return;
    currentFeedDetailFileIndex = (currentFeedDetailFileIndex - 1 + currentFeedDetailFiles.length) % currentFeedDetailFiles.length;
    updateFeedDetailMedia();
}

/**
 * 피드 상세보기 파일 캐러셀 - 다음 파일
 */
export function nextFeedDetailFile() {
    if (currentFeedDetailFiles.length === 0) return;
    currentFeedDetailFileIndex = (currentFeedDetailFileIndex + 1) % currentFeedDetailFiles.length;
    updateFeedDetailMedia();
}

/**
 * 피드 상세보기 미디어 업데이트
 */
function updateFeedDetailMedia() {
    const contentEl = document.getElementById('feed-detail-media-content');
    if (!contentEl || currentFeedDetailFiles.length === 0) return;
    
    const fileUrl = currentFeedDetailFiles[currentFeedDetailFileIndex];
    const extension = fileUrl.split('.').pop().toLowerCase().split('?')[0];
    
    let mediaHTML = '';
    if (['mp4', 'webm', 'ogg', 'mov'].includes(extension)) {
        mediaHTML = `
            <video controls muted loop playsinline>
                <source src="${escapeHtml(fileUrl)}" type="video/mp4">
                브라우저가 비디오를 지원하지 않습니다.
            </video>
        `;
    } else if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(extension)) {
        mediaHTML = `
            <audio controls>
                <source src="${escapeHtml(fileUrl)}" type="audio/mpeg">
                브라우저가 오디오를 지원하지 않습니다.
            </audio>
        `;
        contentEl.classList.add('audio-content');
    } else {
        mediaHTML = `<img src="${escapeHtml(fileUrl)}" alt="이미지">`;
        contentEl.classList.remove('audio-content');
    }
    
    contentEl.innerHTML = mediaHTML;
    
    // 인디케이터 업데이트
    const indicators = document.querySelectorAll('.feed-detail-carousel-indicator');
    indicators.forEach((indicator, idx) => {
        if (idx === currentFeedDetailFileIndex) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
}
