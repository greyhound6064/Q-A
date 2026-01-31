/**
 * @file gallery.js
 * @description 작품관 통합 모듈 - 독립적인 구현
 */

// ========== 하위 모듈 import ==========
import { escapeHtml, formatDate } from './utils.js';
import { getLikesData } from './services/likeService.js';
import { getArtworkTags } from './services/tagService.js';
import { getCommentCount } from './services/commentService.js';
import { getBatchSavedStatus } from './services/saveService.js';
import { sortPosts } from './services/sortingService.js';
import * as FeedLikes from './feed/feedLikes.js';

// ========== 전역 상태 관리 ==========
window._galleryState = {
    allFeedPosts: [],
    feedPosts: [],
    currentSortMode: 'latest'
};

// ========== 작품관 초기화 ==========
export async function initGallery() {
    const posts = await loadGalleryPosts();
    if (posts) {
        window._galleryState.allFeedPosts = posts;
        window._galleryState.feedPosts = posts;
        await applyGallerySearchAndFilter(posts);
    }
}

// ========== Core 함수 (Gallery 전용) ==========
export async function loadGalleryPosts() {
    const feedList = document.getElementById('gallery-list');
    if (!feedList) return;
    
    // 로딩 표시
    feedList.innerHTML = `
        <div class="feed-loading">
            <div class="feed-loading-spinner"></div>
        </div>
    `;
    
    try {
        // 작품관 게시물만 가져오기 (post_type이 'gallery'이고 공개 게시물만)
        const { data: artworks, error } = await window._supabase
            .from('artworks')
            .select('*')
            .eq('post_type', 'gallery')
            .eq('is_public', true)
            .limit(100);
        
        if (error) {
            console.error('작품관 로드 에러:', error);
            feedList.innerHTML = `
                <div class="feed-empty">
                    <div class="feed-empty-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <h3>작품관을 불러올 수 없습니다</h3>
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
        
        return artworksWithData;
        
    } catch (err) {
        console.error('작품관 로드 예외:', err);
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

export async function renderGalleryList() {
    const feedList = document.getElementById('gallery-list');
    if (!feedList) return;
    
    const posts = window._galleryState.feedPosts;
    
    // 현재 사용자 확인
    const { data: { session } } = await window._supabase.auth.getSession();
    const userId = session?.user?.id || null;
    
    // 게시물이 없는 경우
    if (!posts || posts.length === 0) {
        feedList.innerHTML = `
            <div class="feed-empty">
                <div class="feed-empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>
                <h3>검색 결과가 없습니다</h3>
                <p>다른 검색어나 필터를 시도해보세요</p>
            </div>
        `;
        return;
    }
    
    // 각 게시물의 댓글 수, 좋아요/싫어요 정보, 저장 상태 가져오기
    const [commentCounts, likesData, savedStatus] = await Promise.all([
        Promise.all(posts.map(post => getCommentCount(post.id))),
        Promise.all(posts.map(post => getLikesData(post.id, userId))),
        userId ? getBatchSavedStatus(posts.map(p => p.id), userId) : Promise.resolve(new Map())
    ]);
    
    const feedHTML = await Promise.all(posts.map(async (post, index) => {
        // 파일이 실제로 존재하는지 확인
        const hasFiles = (post.images && post.images.length > 0 && post.images.some(img => img)) || (post.image_url && post.image_url.trim());
        const allFiles = hasFiles 
            ? ((post.images && post.images.length > 0) ? post.images.filter(img => img) : [post.image_url])
            : [];
        const hasMultipleFiles = allFiles.length > 1;
        const fileCount = allFiles.length;
        const commentCount = commentCounts[index] || 0;
        const likes = likesData[index] || { likes: 0, dislikes: 0, userReaction: null };
        const postIdStr = String(post.id);
        const isSavedValue = userId ? (savedStatus.get(post.id) || savedStatus.get(postIdStr) || false) : false;
        const mediaType = post.media_type || 'image';
        
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
        
        // 미디어 타입에 따른 렌더링
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
                    <div class="gallery-audio-container">
                        <div class="gallery-audio-content">
                            <svg class="gallery-audio-icon" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M9 18V5l12-2v13"></path>
                                <circle cx="6" cy="18" r="3"></circle>
                                <circle cx="18" cy="16" r="3"></circle>
                            </svg>
                            <audio controls class="gallery-audio-player" onloadedmetadata="this.volume = 0.3">
                                <source src="${escapeHtml(fileUrl)}" type="audio/mpeg">
                                브라우저가 오디오를 지원하지 않습니다.
                            </audio>
                        </div>
                    </div>
                `;
            } else {
                // 모바일 스크롤 뷰 (768px 이하 - 레딧 스타일)
                const scrollHTML = `
                    <div class="gallery-images-scroll" data-gallery-scroll="${post.id}">
                        <div class="gallery-images-scroll-container" data-scroll-container="${post.id}">
                            ${allFiles.map((file, idx) => `
                                <div class="gallery-scroll-image" data-scroll-index="${idx}">
                                    <img src="${escapeHtml(file)}" alt="${escapeHtml(post.title)} ${idx + 1}" loading="lazy" draggable="false">
                                </div>
                            `).join('')}
                        </div>
                        ${hasMultipleFiles ? `
                            <div class="gallery-scroll-page-indicator" data-page-indicator="${post.id}">1/${fileCount}</div>
                        ` : ''}
                    </div>
                `;
                
                // 데스크톱 캐러셀 뷰
                const carouselHTML = `
                    <div class="gallery-carousel-container" data-feed-carousel="${post.id}">
                        <img src="${escapeHtml(fileUrl)}" alt="${escapeHtml(post.title)}" loading="lazy" data-file-index="0">
                        ${hasMultipleFiles ? `
                            <button class="gallery-carousel-nav gallery-carousel-prev" onclick="event.stopPropagation(); prevFeedImage('${post.id}', ${JSON.stringify(allFiles).replace(/"/g, '&quot;')})">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>
                            <button class="gallery-carousel-nav gallery-carousel-next" onclick="event.stopPropagation(); nextFeedImage('${post.id}', ${JSON.stringify(allFiles).replace(/"/g, '&quot;')})">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                            <div class="gallery-carousel-indicators">
                                ${allFiles.map((_, idx) => `<div class="gallery-carousel-indicator ${idx === 0 ? 'active' : ''}" data-indicator-index="${idx}"></div>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
                
                mediaHTML = carouselHTML + scrollHTML;
            }
        }
        
        return `
            <div class="gallery-item" data-post-id="${post.id}" onclick="openArtworkDetail('${post.id}')">
                <div class="gallery-item-header">
                    <div class="gallery-author-avatar" onclick="event.stopPropagation(); selectUserById('${post.user_id}')">
                        ${avatarHTML}
                    </div>
                    <div class="gallery-author-info">
                        <span class="gallery-author-name" onclick="event.stopPropagation(); selectUserById('${post.user_id}')">${escapeHtml(post.author_nickname || '익명')}</span>
                        <span class="gallery-post-date">${formatDate(post.created_at)}</span>
                    </div>
                </div>
                
                <div class="gallery-item-title-wrapper">
                    <div class="gallery-item-title">${escapeHtml(post.title)}</div>
                </div>
                
                ${fileUrl ? `
                <div class="gallery-item-image ${mediaType === 'audio' ? 'gallery-item-audio' : ''}" ${mediaType === 'image' ? `onclick="event.stopPropagation(); openImageViewer('${post.id}', ${JSON.stringify(allFiles).replace(/"/g, '&quot;')}, 0)"` : 'onclick="event.stopPropagation();"'}>
                    ${mediaHTML}
                    ${hasMultipleFiles ? `
                        <div class="gallery-multiple-indicator">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <rect x="7" y="7" width="10" height="10" rx="1" ry="1"></rect>
                            </svg>
                            ${fileCount}
                        </div>
                    ` : ''}
                </div>
                ` : ''}
                
                <div class="gallery-item-content">
                    ${post.description ? `
                        <div class="gallery-item-description" id="gallery-description-${post.id}">
                            ${escapeHtml(post.description)}
                        </div>
                        <span class="gallery-read-more" id="gallery-read-more-${post.id}" style="display:none;" onclick="event.stopPropagation(); toggleGalleryDescription('${post.id}')">...더보기</span>
                    ` : ''}
                    ${post.tags && post.tags.length > 0 ? `
                        <div class="gallery-item-tags">
                            ${post.tags.map(tag => `<span class="gallery-item-tag" onclick="event.stopPropagation(); toggleTagFilter('${tag}')">#${escapeHtml(tag)}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <div class="gallery-item-actions">
                    <button class="gallery-action-btn like-btn ${likes.userReaction === 'like' ? 'liked' : ''}" 
                            id="like-btn-${post.id}" 
                            onclick="event.stopPropagation(); toggleLike('${post.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                        </svg>
                        <span id="like-count-${post.id}">${likes.likes}</span>
                    </button>
                    <button class="gallery-action-btn dislike-btn ${likes.userReaction === 'dislike' ? 'disliked' : ''}" 
                            id="dislike-btn-${post.id}" 
                            onclick="event.stopPropagation(); toggleDislike('${post.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
                        </svg>
                    </button>
                    <button class="gallery-action-btn comment-btn" onclick="event.stopPropagation(); openArtworkDetail('${post.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span id="comment-count-${post.id}">${commentCount}</span>
                    </button>
                    <button class="gallery-action-btn save-btn ${isSavedValue ? 'saved' : ''}" 
                            id="save-btn-${post.id}" 
                            onclick="event.stopPropagation(); toggleSave('${post.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
        checkGalleryDescriptions();
        setupVideoIntersectionObserver();
        setupGalleryScrollObservers();
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
function checkGalleryDescriptions() {
    const descriptions = document.querySelectorAll('.gallery-item-description');
    descriptions.forEach(desc => {
        const postId = desc.id.replace('gallery-description-', '');
        const readMoreBtn = document.getElementById(`gallery-read-more-${postId}`);
        
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
            const lineHeight = parseFloat(getComputedStyle(desc).lineHeight) || (parseFloat(getComputedStyle(desc).fontSize) * 1.6);
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
 * 작품관 설명 더보기/접기 토글
 */
export function toggleGalleryDescription(postId) {
    const descEl = document.getElementById(`gallery-description-${postId}`);
    const readMoreBtn = document.getElementById(`gallery-read-more-${postId}`);
    
    if (!descEl || !readMoreBtn) return;
    
    const isExpanded = descEl.classList.contains('expanded');
    
    if (isExpanded) {
        // 접기
        descEl.classList.remove('expanded');
        readMoreBtn.textContent = '...더보기';
        // 다시 3줄 제한 적용
        const lineHeight = parseFloat(getComputedStyle(descEl).lineHeight) || (parseFloat(getComputedStyle(descEl).fontSize) * 1.6);
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
window.toggleGalleryDescription = toggleGalleryDescription;

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
function setupGalleryScrollObservers() {
    const scrollContainers = document.querySelectorAll('.gallery-images-scroll-container');
    
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
                const indicators = indicatorsContainer.querySelectorAll('.gallery-scroll-indicator');
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

// ========== Search 함수 (Gallery 전용) ==========
export async function performGallerySearch() {
    const searchInput = document.getElementById('gallery-search-input');
    const clearBtn = document.getElementById('gallery-search-clear');
    
    if (!searchInput) return;
    
    const query = searchInput.value.trim().toLowerCase();
    
    if (query) {
        if (clearBtn) clearBtn.style.display = 'flex';
    } else {
        if (clearBtn) clearBtn.style.display = 'none';
    }
    
    await applyGallerySearchAndFilter();
}

export async function clearGallerySearch() {
    const searchInput = document.getElementById('gallery-search-input');
    const clearBtn = document.getElementById('gallery-search-clear');
    
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    
    await applyGallerySearchAndFilter();
}

export async function applyGallerySearchAndFilter(posts = null) {
    const allPosts = posts || window._galleryState.allFeedPosts;
    const searchInput = document.getElementById('gallery-search-input');
    const selectedTagsContainer = document.getElementById('gallery-selected-tags');
    
    let filtered = [...allPosts];
    
    // 검색어 필터
    if (searchInput && searchInput.value.trim()) {
        const query = searchInput.value.trim().toLowerCase();
        filtered = filtered.filter(post => {
            const title = (post.title || '').toLowerCase();
            const description = (post.description || '').toLowerCase();
            return title.includes(query) || description.includes(query);
        });
    }
    
    // 태그 필터
    if (selectedTagsContainer) {
        const selectedTags = Array.from(selectedTagsContainer.querySelectorAll('.feed-selected-tag'))
            .map(chip => {
                const text = chip.textContent.trim();
                // "×" 버튼과 SVG 제거, # 제거
                return text.replace('×', '').trim().replace(/^#/, '').toLowerCase();
            });
        
        if (selectedTags.length > 0) {
            filtered = filtered.filter(post => {
                const postTags = (post.tags || []).map(tag => tag.toLowerCase());
                return selectedTags.every(tag => postTags.includes(tag));
            });
        }
    }
    
    // 정렬 적용 (sortingService 사용)
    const sortMode = window._galleryState.currentSortMode || 'latest';
    filtered = sortPosts(filtered, sortMode);
    
    window._galleryState.feedPosts = filtered;
    await renderGalleryList();
}

// ========== Sort 함수 (Gallery 전용) ==========
export async function changeGallerySortMode(mode) {
    const sortButtons = document.querySelectorAll('#gallery-sort-dropdown .feed-sort-option');
    sortButtons.forEach(btn => {
        if (btn.getAttribute('data-sort') === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // 현재 정렬 모드 저장
    window._galleryState.currentSortMode = mode;
    
    // 필터링된 결과에 정렬 적용 (sortingService 사용)
    const sorted = sortPosts([...window._galleryState.feedPosts], mode);
    window._galleryState.feedPosts = sorted;
    await renderGalleryList();
}

// ========== 검색 패널 토글 ==========
export function toggleGallerySearchPanel() {
    const panel = document.getElementById('gallery-search-panel');
    const toggleBtn = document.getElementById('gallery-search-toggle');
    
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

export function toggleGallerySortFilter() {
    const dropdown = document.getElementById('gallery-sort-dropdown');
    const tagDropdown = document.getElementById('gallery-tag-dropdown');
    
    if (dropdown) {
        const isVisible = dropdown.style.display === 'block';
        dropdown.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible && tagDropdown) {
            tagDropdown.style.display = 'none';
        }
    }
}

// ========== Tag 함수 (Gallery 전용) ==========
export async function addGalleryTagFilter() {
    const tagInput = document.getElementById('gallery-tag-input');
    const selectedTagsContainer = document.getElementById('gallery-selected-tags');
    const suggestionsContainer = document.getElementById('gallery-tag-suggestions');
    
    if (!tagInput || !selectedTagsContainer) return;
    
    // # 제거 및 소문자 변환
    const tagName = tagInput.value.trim().toLowerCase().replace(/^#/, '');
    if (!tagName) return;
    
    // 기존 태그 확인
    const existingTags = Array.from(selectedTagsContainer.querySelectorAll('.feed-selected-tag'))
        .map(chip => {
            const text = chip.textContent.trim();
            // "×" 버튼 텍스트 제거
            return text.replace('×', '').trim().replace(/^#/, '');
        });
    
    if (existingTags.includes(tagName)) {
        tagInput.value = '';
        if (suggestionsContainer) suggestionsContainer.style.display = 'none';
        return;
    }
    
    // 태그 칩 생성
    const tagChip = document.createElement('div');
    tagChip.className = 'feed-selected-tag';
    tagChip.innerHTML = `
        #${escapeHtml(tagName)}
        <button class="feed-tag-remove" onclick="removeGalleryTagFilter(this)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;
    
    selectedTagsContainer.appendChild(tagChip);
    selectedTagsContainer.style.display = 'flex';
    
    tagInput.value = '';
    if (suggestionsContainer) suggestionsContainer.style.display = 'none';
    
    await applyGallerySearchAndFilter();
}

export async function removeGalleryTagFilter(button) {
    const chip = button.parentElement;
    const container = document.getElementById('gallery-selected-tags');
    
    if (chip) chip.remove();
    
    if (container && container.children.length === 0) {
        container.style.display = 'none';
    }
    
    await applyGallerySearchAndFilter();
}

export async function searchGalleryTagSuggestions() {
    const tagInput = document.getElementById('gallery-tag-input');
    const suggestionsContainer = document.getElementById('gallery-tag-suggestions');
    
    if (!tagInput || !suggestionsContainer) return;
    
    const query = tagInput.value.trim().toLowerCase().replace(/^#/, '');
    
    if (!query) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    
    try {
        const { data: tags, error } = await window._supabase
            .from('tags')
            .select('name, usage_count')
            .ilike('name', `%${query}%`)
            .gt('usage_count', 0)
            .order('usage_count', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        
        if (tags && tags.length > 0) {
            suggestionsContainer.innerHTML = tags.map(tag => `
                <div class="feed-tag-suggestion-item" onclick="selectGalleryTagSuggestion('${escapeHtml(tag.name)}')">
                    <span class="feed-tag-suggestion-name">#${escapeHtml(tag.name)}</span>
                    <span class="feed-tag-suggestion-count">${tag.usage_count}개</span>
                </div>
            `).join('');
            suggestionsContainer.style.display = 'block';
        } else {
            suggestionsContainer.innerHTML = '<div class="feed-tag-suggestions-empty">검색 결과가 없습니다</div>';
            suggestionsContainer.style.display = 'block';
        }
    } catch (error) {
        console.error('태그 검색 실패:', error);
        suggestionsContainer.style.display = 'none';
    }
}

export async function selectGalleryTagSuggestion(tagName) {
    const tagInput = document.getElementById('gallery-tag-input');
    if (tagInput) {
        tagInput.value = tagName;
    }
    await addGalleryTagFilter();
}

export function toggleGalleryTagFilterDropdown() {
    const dropdown = document.getElementById('gallery-tag-dropdown');
    const sortDropdown = document.getElementById('gallery-sort-dropdown');
    
    if (dropdown) {
        const isVisible = dropdown.style.display === 'block';
        dropdown.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible && sortDropdown) {
            sortDropdown.style.display = 'none';
        }
    }
}

// ========== 기타 함수들 (자유게시판 함수 재사용) ==========
// 좋아요/싫어요는 FeedLikes 사용
export const toggleGalleryLike = FeedLikes.toggleLike;
export const toggleGalleryDislike = FeedLikes.toggleDislike;

// 저장, 이미지 네비게이션 등은 자유게시판 함수를 직접 호출
// (작품관과 자유게시판이 같은 데이터를 공유하므로 함수 재사용 가능)
export function toggleGallerySave(artworkId) {
    if (window.toggleSave) {
        return window.toggleSave(artworkId);
    }
}

export function prevGalleryImage(postId, files) {
    if (window.prevFeedImage) {
        return window.prevFeedImage(postId, files);
    }
}

export function nextGalleryImage(postId, files) {
    if (window.nextFeedImage) {
        return window.nextFeedImage(postId, files);
    }
}

export function openGalleryImageViewer(postId, files, index) {
    if (window.openImageViewer) {
        return window.openImageViewer(postId, files, index);
    }
}

export function closeGalleryImageViewer() {
    if (window.closeImageViewer) {
        return window.closeImageViewer();
    }
}
