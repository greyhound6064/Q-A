/**
 * @file feedCore.js
 * @description 피드 핵심 로직 - 게시물 로딩 및 리스트 렌더링
 */

import { escapeHtml, formatDate } from '../utils.js';
import { getLikesData } from '../services/likeService.js';
import { getArtworkTags } from '../services/tagService.js';
import { getCommentCount } from '../services/commentService.js';
import { toggleSave as toggleSaveService, getBatchSavedStatus } from '../services/saveService.js';
import { showLoginRequiredModal } from '../utils/errorHandler.js';

// ========== 전역 상태 ==========
export let feedPosts = [];
export let allFeedPosts = [];

/**
 * 피드 게시물 설정
 */
export function setFeedPosts(posts) {
    feedPosts = posts;
}

/**
 * 전체 피드 게시물 설정
 */
export function setAllFeedPosts(posts) {
    allFeedPosts = posts;
}

/**
 * 피드 게시물 가져오기
 */
export function getFeedPosts() {
    return feedPosts;
}

/**
 * 피드 초기화
 */
export async function initFeed() {
    console.log('피드 초기화');
    await loadFeedPosts();
}

/**
 * 피드 게시물 로드
 */
export async function loadFeedPosts() {
    const feedList = document.getElementById('feed-list');
    if (!feedList) return;
    
    // 로딩 표시
    feedList.innerHTML = `
        <div class="feed-loading">
            <div class="feed-loading-spinner"></div>
        </div>
    `;
    
    try {
        // 자유게시판 게시물만 가져오기 (post_type이 'feed'이고 공개 게시물만)
        const { data: artworks, error } = await window._supabase
            .from('artworks')
            .select('*')
            .eq('post_type', 'feed')
            .eq('is_public', true)
            .limit(100);
        
        if (error) {
            console.error('피드 로드 에러:', error);
            feedList.innerHTML = `
                <div class="feed-empty">
                    <div class="feed-empty-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <h3>피드를 불러올 수 없습니다</h3>
                    <p>${escapeHtml(error.message)}</p>
                </div>
            `;
            return;
        }
        
        // 게시물이 없는 경우
        if (!artworks || artworks.length === 0) {
            feedList.innerHTML = `
                <div class="feed-empty">
                    <div class="feed-empty-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                    </div>
                    <h3>아직 게시물이 없습니다</h3>
                    <p>첫 번째 작품을 업로드하고 커뮤니티를 시작하세요!</p>
                    <button class="feed-empty-btn" onclick="openUploadModal()">작품 업로드하기</button>
                </div>
            `;
            return;
        }
        
        // 각 게시물의 좋아요/싫어요 및 태그 데이터 가져오기
        const artworksWithData = await Promise.all(
            artworks.map(async (artwork) => {
                const [likesData, tagsData] = await Promise.all([
                    getLikesData(artwork.id, null),
                    getArtworkTags(artwork.id)
                ]);
                
                return {
                    ...artwork,
                    likes_count: likesData.likes,
                    dislikes_count: likesData.dislikes,
                    engagement_score: likesData.likes - likesData.dislikes,
                    tags: tagsData
                };
            })
        );
        
        // 전체 게시물 저장
        allFeedPosts = artworksWithData;
        
        return artworksWithData;
        
    } catch (err) {
        console.error('피드 로드 예외:', err);
        feedList.innerHTML = `
            <div class="feed-empty">
                <div class="feed-empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <h3>오류가 발생했습니다</h3>
                <p>페이지를 새로고침해주세요</p>
            </div>
        `;
    }
}

/**
 * 피드 리스트 렌더링
 */
export async function renderFeedList() {
    const feedList = document.getElementById('feed-list');
    if (!feedList) return;
    
    // 현재 사용자 확인
    const { data: { session } } = await window._supabase.auth.getSession();
    const userId = session?.user?.id || null;
    
    // 각 게시물의 댓글 수, 좋아요/싫어요 정보, 저장 상태 가져오기
    const [commentCounts, likesData, savedStatus] = await Promise.all([
        Promise.all(feedPosts.map(post => getCommentCount(post.id))),
        Promise.all(feedPosts.map(post => getLikesData(post.id, userId))),
        userId ? getBatchSavedStatus(feedPosts.map(p => p.id), userId) : Promise.resolve(new Map())
    ]);
    
    const feedHTML = await Promise.all(feedPosts.map(async (post, index) => {
        // 파일이 실제로 존재하는지 확인
        const hasFiles = (post.images && post.images.length > 0 && post.images.some(img => img)) || (post.image_url && post.image_url.trim());
        const allFiles = hasFiles 
            ? ((post.images && post.images.length > 0) ? post.images.filter(img => img) : [post.image_url])
            : [];
        const hasMultipleFiles = allFiles.length > 1;
        const fileCount = allFiles.length;
        const commentCount = commentCounts[index] || 0;
        const likes = likesData[index] || { likes: 0, dislikes: 0, userReaction: null };
        // 저장 상태 확인 (숫자와 문자열 모두 확인)
        const postIdStr = String(post.id);
        const isSavedValue = userId ? (savedStatus.get(post.id) || savedStatus.get(postIdStr) || false) : false;
        const isOwnPost = userId && post.user_id === userId;
        const mediaType = post.media_type || 'image';
        
        // 미디어 타입에 따른 렌더링 (첫 번째 파일)
        const fileUrl = allFiles.length > 0 ? allFiles[0] : null;
        let mediaHTML = '';
        
        // 파일이 있는 경우에만 미디어 렌더링
        if (fileUrl) {
            if (mediaType === 'video') {
                mediaHTML = `
                    <div class="video-container" data-video-container="${post.id}">
                        <video 
                            class="feed-video" 
                            data-video-id="${post.id}"
                            controls
                            muted
                            loop 
                            playsinline
                            preload="auto"
                            disablePictureInPicture
                            x-webkit-airplay="allow"
                            onloadedmetadata="this.volume = 0.3"
                            style="width: 100%; height: 100%; max-height: 600px; object-fit: contain;">
                            <source src="${escapeHtml(fileUrl)}" type="video/mp4">
                            브라우저가 비디오를 지원하지 않습니다.
                        </video>
                    </div>
                `;
            } else if (mediaType === 'audio') {
                mediaHTML = `
                    <div class="feed-audio-container">
                        <div class="feed-audio-content">
                            <svg class="feed-audio-icon" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M9 18V5l12-2v13"></path>
                                <circle cx="6" cy="18" r="3"></circle>
                                <circle cx="18" cy="16" r="3"></circle>
                            </svg>
                            <audio controls class="feed-audio-player" onloadedmetadata="this.volume = 0.3">
                                <source src="${escapeHtml(fileUrl)}" type="audio/mpeg">
                                브라우저가 오디오를 지원하지 않습니다.
                            </audio>
                        </div>
                    </div>
                `;
            } else {
                // 모바일 스크롤 뷰 (768px 이하 - 레딧 스타일)
                const scrollHTML = `
                    <div class="feed-images-scroll" data-feed-scroll="${post.id}">
                        <div class="feed-images-scroll-container" data-scroll-container="${post.id}">
                            ${allFiles.map((file, idx) => `
                                <div class="feed-scroll-image" data-scroll-index="${idx}">
                                    <img src="${escapeHtml(file)}" alt="${escapeHtml(post.title)} ${idx + 1}" loading="lazy" draggable="false">
                                </div>
                            `).join('')}
                        </div>
                        ${hasMultipleFiles ? `
                            <div class="feed-scroll-page-indicator" data-page-indicator="${post.id}">1/${fileCount}</div>
                        ` : ''}
                    </div>
                `;
                
                // 데스크톱 캐러셀 뷰
                const carouselHTML = `
                    <div class="feed-carousel-container" data-feed-carousel="${post.id}">
                        <img src="${escapeHtml(fileUrl)}" alt="${escapeHtml(post.title)}" loading="lazy" data-file-index="0">
                        ${hasMultipleFiles ? `
                            <button class="feed-carousel-nav feed-carousel-prev" onclick="event.stopPropagation(); prevFeedImage('${post.id}', ${JSON.stringify(allFiles).replace(/"/g, '&quot;')})">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>
                            <button class="feed-carousel-nav feed-carousel-next" onclick="event.stopPropagation(); nextFeedImage('${post.id}', ${JSON.stringify(allFiles).replace(/"/g, '&quot;')})">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                            <div class="feed-carousel-indicators">
                                ${allFiles.map((_, idx) => `<div class="feed-carousel-indicator ${idx === 0 ? 'active' : ''}" data-indicator-index="${idx}"></div>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
                
                mediaHTML = carouselHTML + scrollHTML;
            }
        }
        
        // 작성자 프로필 이미지 가져오기
        let avatarHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
        `;
        
        try {
            const { data: profile } = await window._supabase
                .from('profiles')
                .select('avatar_url')
                .eq('user_id', post.user_id)
                .single();
            
            if (profile?.avatar_url) {
                avatarHTML = `<img src="${escapeHtml(profile.avatar_url)}" alt="프로필" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            }
        } catch (err) {
            console.log('프로필 이미지 로드 실패:', err);
        }
        
        return `
            <div class="feed-item" data-post-id="${post.id}" onclick="openFeedDetail('${post.id}', false, window._feedState?.feedPosts || [])">
                <!-- 헤더 -->
                <div class="feed-item-header">
                    <div class="feed-author-avatar" onclick="event.stopPropagation(); selectUserById('${post.user_id}')">
                        ${avatarHTML}
                    </div>
                    <div class="feed-author-info">
                        <div>
                            <span class="feed-author-name" onclick="event.stopPropagation(); selectUserById('${post.user_id}')">${escapeHtml(post.author_nickname || '익명')}</span>
                            <span class="feed-post-date">${formatDate(post.created_at)}</span>
                        </div>
                    </div>
                </div>
                
                <!-- 콘텐츠 -->
                <div class="feed-item-content">
                    ${post.title ? `<div class="feed-item-title">${escapeHtml(post.title)}</div>` : ''}
                    ${post.description ? `
                        <div class="feed-item-description" id="desc-${post.id}">
                            ${escapeHtml(post.description)}
                        </div>
                        <span class="feed-read-more" id="read-more-${post.id}" style="display:none;" onclick="event.stopPropagation(); toggleFeedDescription('${post.id}')">...더보기</span>
                    ` : ''}
                    
                    <!-- 미디어 (파일이 있는 경우만 표시) -->
                    ${fileUrl ? `
                    <div class="feed-item-image ${mediaType === 'audio' ? 'feed-item-audio' : ''}" ${mediaType === 'image' ? `onclick="event.stopPropagation(); openImageViewer('${post.id}', ${JSON.stringify(allFiles).replace(/"/g, '&quot;')}, 0)"` : 'onclick="event.stopPropagation();"'}>
                        ${mediaHTML}
                        ${hasMultipleFiles ? `
                            <div class="feed-multiple-indicator">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <rect x="7" y="7" width="10" height="10" rx="1" ry="1"></rect>
                                </svg>
                                ${fileCount}
                            </div>
                        ` : ''}
                    </div>
                    ` : ''}
                    
                    ${post.tags && post.tags.length > 0 ? `
                        <div class="feed-item-tags">
                            ${post.tags.map(tag => `
                                <span class="feed-item-tag" onclick="event.stopPropagation(); toggleTagFilter('${tag}')">#${tag}</span>
                            `).join(' ')}
                        </div>
                    ` : ''}
                </div>
                
                <!-- 액션 바 -->
                <div class="feed-item-actions">
                    <button class="feed-action-btn like-btn ${likes.userReaction === 'like' ? 'liked' : ''}" 
                            id="like-btn-${post.id}" 
                            onclick="event.stopPropagation(); toggleLike('${post.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M7 10v12"></path>
                            <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"></path>
                        </svg>
                        <span id="like-count-${post.id}">${likes.likes}</span>
                    </button>
                    <button class="feed-action-btn dislike-btn ${likes.userReaction === 'dislike' ? 'disliked' : ''}" 
                            id="dislike-btn-${post.id}" 
                            onclick="event.stopPropagation(); toggleDislike('${post.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M17 14V2"></path>
                            <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"></path>
                        </svg>
                    </button>
                    <button class="feed-action-btn" onclick="event.stopPropagation(); toggleComments('${post.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                        </svg>
                        <span id="comment-count-${post.id}">${commentCount}</span>
                    </button>
                    <button class="feed-action-btn save-btn ${isSavedValue ? 'saved' : ''}" 
                            id="save-btn-${post.id}" 
                            onclick="event.stopPropagation(); toggleSave('${post.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }));
    
    feedList.innerHTML = feedHTML.join('');
    
    // 더보기 버튼 표시 여부 확인 (렌더링 후)
    setTimeout(() => {
        checkFeedDescriptions();
        setupVideoIntersectionObserver();
        setupScrollObservers();
    }, 100);
}

/**
 * 실제 렌더링된 줄 수를 계산
 */
function getLineCount(element) {
    const text = element.textContent || element.innerText;
    if (!text.trim()) return 0;
    
    // Range API를 사용하여 실제 줄 수 계산
    const range = document.createRange();
    range.selectNodeContents(element);
    
    const rects = range.getClientRects();
    let lineCount = 0;
    let lastTop = null;
    
    for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];
        if (lastTop === null || Math.abs(rect.top - lastTop) > 1) {
            lineCount++;
            lastTop = rect.top;
        }
    }
    
    return lineCount || 1; // 최소 1줄
}

/**
 * 설명이 5줄을 넘는지 확인하고 더보기 버튼 표시
 */
function checkFeedDescriptions() {
    const descriptions = document.querySelectorAll('.feed-item-description');
    descriptions.forEach(desc => {
        const postId = desc.id.replace('desc-', '');
        const readMoreBtn = document.getElementById(`read-more-${postId}`);
        
        if (!readMoreBtn) return;
        
        // expanded 상태 저장
        const wasExpanded = desc.classList.contains('expanded');
        
        // line-clamp를 임시로 제거하여 전체 텍스트 렌더링
        desc.classList.remove('expanded');
        const originalDisplay = desc.style.display;
        const originalWebkitLineClamp = desc.style.webkitLineClamp;
        const originalWebkitBoxOrient = desc.style.webkitBoxOrient;
        
        desc.style.display = 'block';
        desc.style.webkitLineClamp = 'unset';
        desc.style.webkitBoxOrient = 'unset';
        
        // 실제 줄 수 계산
        const lineCount = getLineCount(desc);
        
        // 원래 스타일 복원
        desc.style.display = originalDisplay;
        desc.style.webkitLineClamp = originalWebkitLineClamp;
        desc.style.webkitBoxOrient = originalWebkitBoxOrient;
        
        if (wasExpanded) {
            desc.classList.add('expanded');
        }
        
        // 5줄을 넘으면 더보기 버튼 표시
        if (lineCount > 5) {
            readMoreBtn.style.display = 'inline-block';
            desc.classList.add('has-read-more');
            // ellipsis 숨기기 위해 -webkit-line-clamp 제거하고 max-height 사용
            const lineHeight = parseFloat(getComputedStyle(desc).lineHeight) || (parseFloat(getComputedStyle(desc).fontSize) * 1.5);
            desc.style.display = 'block';
            desc.style.webkitLineClamp = 'unset';
            desc.style.webkitBoxOrient = 'unset';
            desc.style.maxHeight = `${lineHeight * 5}px`;
            desc.style.textOverflow = 'clip';
        } else {
            readMoreBtn.style.display = 'none';
            desc.classList.remove('has-read-more');
            // 원래 스타일 복원
            desc.style.display = '';
            desc.style.webkitLineClamp = '';
            desc.style.webkitBoxOrient = '';
            desc.style.maxHeight = '';
            desc.style.textOverflow = '';
        }
    });
}

/**
 * 피드 설명 더보기/접기 토글
 */
export function toggleFeedDescription(postId) {
    const descEl = document.getElementById(`desc-${postId}`);
    const readMoreBtn = document.getElementById(`read-more-${postId}`);
    
    if (!descEl || !readMoreBtn) return;
    
    const isExpanded = descEl.classList.contains('expanded');
    
    if (isExpanded) {
        // 접기
        descEl.classList.remove('expanded');
        readMoreBtn.textContent = '...더보기';
        // 다시 3줄 제한 적용
        const lineHeight = parseFloat(getComputedStyle(descEl).lineHeight) || (parseFloat(getComputedStyle(descEl).fontSize) * 1.5);
        descEl.style.maxHeight = `${lineHeight * 3}px`;
    } else {
        // 펼치기
        descEl.classList.add('expanded');
        readMoreBtn.textContent = '접기';
        // maxHeight 제거하여 전체 내용 표시
        descEl.style.maxHeight = 'none';
    }
}

// 전역 함수로 노출
window.toggleFeedDescription = toggleFeedDescription;

/**
 * Intersection Observer로 비디오 자동 재생 최적화
 */
function setupVideoIntersectionObserver() {
    const videos = document.querySelectorAll('.feed-video');
    
    if (videos.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            
            if (entry.isIntersecting) {
                // 화면에 50% 이상 보이면 재생
                if (entry.intersectionRatio >= 0.5) {
                    video.play().catch(err => {
                        console.log('자동 재생 실패:', err);
                    });
                }
            } else {
                // 화면에서 벗어나면 일시정지
                video.pause();
            }
        });
    }, {
        threshold: [0, 0.5, 1.0] // 0%, 50%, 100% 보일 때 감지
    });
    
    videos.forEach(video => observer.observe(video));
}

/**
 * 스크롤 인디케이터 업데이트 (레딧 스타일)
 */
function setupScrollObservers() {
    const scrollContainers = document.querySelectorAll('.feed-images-scroll-container');
    
    scrollContainers.forEach(container => {
        const postId = container.dataset.scrollContainer;
        const indicatorsContainer = document.querySelector(`[data-scroll-indicators="${postId}"]`);
        
        if (!indicatorsContainer) return;
        
        // 스크롤 이벤트로 인디케이터 업데이트
        let scrollTimeout;
        container.addEventListener('scroll', () => {
            // 스크롤이 멈춘 후에만 업데이트 (성능 최적화)
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollLeft = container.scrollLeft;
                const containerWidth = container.offsetWidth;
                const currentIndex = Math.round(scrollLeft / containerWidth);
                
                // 모든 인디케이터 비활성화
                const indicators = indicatorsContainer.querySelectorAll('.feed-scroll-indicator');
                indicators.forEach((indicator, idx) => {
                    if (idx === currentIndex) {
                        indicator.classList.add('active');
                    } else {
                        indicator.classList.remove('active');
                    }
                });
            }, 50);
        });
        
        // 터치 스와이프 개선 (데스크톱 드래그)
        let isDown = false;
        let startX;
        let scrollLeftStart;
        
        container.addEventListener('mousedown', (e) => {
            isDown = true;
            startX = e.pageX - container.offsetLeft;
            scrollLeftStart = container.scrollLeft;
            container.style.cursor = 'grabbing';
            e.preventDefault();
        });
        
        container.addEventListener('mouseleave', () => {
            isDown = false;
            container.style.cursor = 'grab';
        });
        
        container.addEventListener('mouseup', () => {
            isDown = false;
            container.style.cursor = 'grab';
        });
        
        container.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 2;
            container.scrollLeft = scrollLeftStart - walk;
        });
    });
}

/**
 * 저장 토글
 */
export async function toggleSave(postId) {
    try {
        const { data: { session } } = await window._supabase.auth.getSession();
        if (!session || !session.user) {
            showLoginRequiredModal();
            return;
        }
        
        const isSavedValue = await toggleSaveService(postId);
        
        // 피드의 저장 버튼 UI 업데이트 (숫자와 문자열 모두 확인)
        const saveBtn = document.getElementById(`save-btn-${postId}`) || 
                       document.getElementById(`save-btn-${String(postId)}`);
        if (saveBtn) {
            if (isSavedValue) {
                saveBtn.classList.add('saved');
            } else {
                saveBtn.classList.remove('saved');
            }
        }
        
        // 상세보기 모달이 열려있으면 업데이트
        const detailSaveBtn = document.getElementById('feed-detail-save-btn');
        if (detailSaveBtn) {
            if (isSavedValue) {
                detailSaveBtn.classList.add('saved');
            } else {
                detailSaveBtn.classList.remove('saved');
            }
        }
    } catch (err) {
        console.error('저장 토글 에러:', err);
        alert(err.message || '저장 처리 중 오류가 발생했습니다.');
    }
}

/**
 * 좋아요/싫어요 UI 업데이트
 */
export async function updateLikesUI(artworkId, userId) {
    const likesData = await getLikesData(artworkId, userId);
    
    // 좋아요 버튼 업데이트
    const likeBtn = document.getElementById(`like-btn-${artworkId}`);
    const likeCount = document.getElementById(`like-count-${artworkId}`);
    if (likeBtn && likeCount) {
        likeCount.textContent = likesData.likes;
        if (likesData.userReaction === 'like') {
            likeBtn.classList.add('liked');
        } else {
            likeBtn.classList.remove('liked');
        }
    }
    
    // 싫어요 버튼 업데이트 (개수는 표시하지 않음)
    const dislikeBtn = document.getElementById(`dislike-btn-${artworkId}`);
    if (dislikeBtn) {
        if (likesData.userReaction === 'dislike') {
            dislikeBtn.classList.add('disliked');
        } else {
            dislikeBtn.classList.remove('disliked');
        }
    }
}

/**
 * 댓글 수 업데이트
 */
export async function updateFeedCommentCount(artworkId) {
    const newCount = await getCommentCount(artworkId);
    const countEl = document.getElementById(`comment-count-${artworkId}`);
    if (countEl) countEl.textContent = newCount;
}
