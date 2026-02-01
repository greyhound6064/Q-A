/**
 * @file board.js
 * @description 통합 게시판 모듈 - 작품 게시판(gallery)과 자유 게시판(feed)을 하나로 통합
 * 
 * 구조:
 * - 단일 "게시판" 탭
 * - 내부 서브탭으로 작품 게시판/자유 게시판 전환
 * - DB는 post_type 필드로 구분 ('gallery' / 'feed')
 * - 중복 코드 제거 및 효율적인 코드 재사용
 */

// ========== 하위 모듈 import ==========
import { escapeHtml, formatDate } from './utils.js';
import { getBatchLikesData } from './services/likeService.js';
import { getBatchArtworkTags } from './services/tagService.js';
import { getBatchCommentCounts } from './services/commentService.js';
import { getBatchSavedStatus } from './services/saveService.js';
import { getBatchProfiles, getAvatarHTML } from './services/profileService.js';
import { sortPosts } from './services/sortingService.js';
import * as PostLikes from './post/postLikes.js';

// ========== 전역 상태 관리 ==========
window._boardState = {
    currentBoardType: 'gallery', // 'gallery' 또는 'feed'
    allPosts: [],
    filteredPosts: [],
    currentSortMode: 'latest'
};

// ========== 게시판 초기화 ==========
export async function initBoard() {
    // 기본값: 작품 게시판
    window._boardState.currentBoardType = 'gallery';
    
    // 서브탭 UI 업데이트 (작품 게시판을 활성화)
    const buttons = document.querySelectorAll('.board-type-btn');
    buttons.forEach(btn => {
        if (btn.dataset.boardType === 'gallery') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    const posts = await loadBoardPosts('gallery');
    if (posts) {
        window._boardState.allPosts = posts;
        window._boardState.filteredPosts = posts;
        await applyBoardSearchAndFilter(posts);
    }
    
    // 플로팅 버튼 아이콘 초기화
    updateBoardTypeSwitchButton('gallery');
}

// ========== 게시판 타입 전환 ==========
export async function switchBoardType(type) {
    window._boardState.currentBoardType = type;
    
    // 서브탭 UI 업데이트
    const buttons = document.querySelectorAll('.board-type-btn');
    buttons.forEach(btn => {
        if (btn.dataset.boardType === type) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // 플로팅 버튼 아이콘 업데이트
    updateBoardTypeSwitchButton(type);
    
    // 해당 타입의 게시물 로드
    const posts = await loadBoardPosts(type);
    if (posts) {
        window._boardState.allPosts = posts;
        window._boardState.filteredPosts = posts;
        await applyBoardSearchAndFilter(posts);
    }
}

// ========== 플로팅 버튼으로 게시판 전환 ==========
export async function toggleBoardTypeFromButton() {
    // 현재 게시판 타입 확인
    const currentType = window._boardState.currentBoardType;
    const newType = currentType === 'gallery' ? 'feed' : 'gallery';
    
    // 게시판 전환
    await switchBoardType(newType);
    
    // 화면 맨 위로 스크롤
    const boardContainer = document.querySelector('.board-container');
    if (boardContainer) {
        boardContainer.scrollTop = 0;
    }
    
    // content-area도 스크롤 초기화
    const contentArea = document.querySelector('.content-area');
    if (contentArea) {
        contentArea.scrollTop = 0;
    }
    
    // 전체 페이지 스크롤 초기화
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========== 플로팅 버튼 아이콘 업데이트 ==========
function updateBoardTypeSwitchButton(type) {
    const switchBtnDesktop = document.getElementById('board-type-switch-btn');
    const switchBtnMobile = document.querySelector('.floating-switch-btn');
    
    // 현재 게시판에 맞는 아이콘으로 변경 (현재 위치의 아이콘 표시)
    if (type === 'gallery') {
        // 작품 게시판 아이콘
        const galleryIcon = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
        `;
        if (switchBtnDesktop) {
            switchBtnDesktop.innerHTML = galleryIcon;
            switchBtnDesktop.title = '자유 게시판으로 전환';
        }
        if (switchBtnMobile) {
            switchBtnMobile.innerHTML = galleryIcon;
            switchBtnMobile.title = '자유 게시판으로 전환';
        }
    } else {
        // 자유 게시판 아이콘 (문서 아이콘)
        const feedIcon = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
        `;
        if (switchBtnDesktop) {
            switchBtnDesktop.innerHTML = feedIcon;
            switchBtnDesktop.title = '작품 게시판으로 전환';
        }
        if (switchBtnMobile) {
            switchBtnMobile.innerHTML = feedIcon;
            switchBtnMobile.title = '작품 게시판으로 전환';
        }
    }
}

// ========== 게시물 로드 (통합 함수) ==========
/**
 * 게시물 로드 - 작품 게시판과 자유 게시판 통합
 * @param {string} type - 'gallery' 또는 'feed'
 * @returns {Promise<Array>} 게시물 배열
 */
export async function loadBoardPosts(type) {
    const boardList = document.getElementById('board-list');
    if (!boardList) return;
    
    // 로딩 표시
    boardList.innerHTML = `
        <div class="feed-loading">
            <div class="feed-loading-spinner"></div>
        </div>
    `;
    
    try {
        // 현재 사용자 확인
        const { data: { session } } = await window._supabase.auth.getSession();
        const userId = session?.user?.id || null;
        
        // post_type에 따라 필터링 (gallery 또는 feed)
        // 초기 로딩 개수를 30개로 제한하여 성능 향상
        const { data: artworks, error } = await window._supabase
            .from('artworks')
            .select('*')
            .eq('post_type', type)
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .limit(30);
        
        if (error) {
            console.error('게시판 로드 에러:', error);
            boardList.innerHTML = getEmptyStateHTML('error', error.message);
            return;
        }
        
        // 게시물이 없는 경우
        if (!artworks || artworks.length === 0) {
            const typeName = type === 'gallery' ? '작품 게시판' : '자유 게시판';
            boardList.innerHTML = getEmptyStateHTML('empty', `아직 ${typeName} 게시물이 없습니다`);
            return;
        }
        
        // 모든 필요한 데이터를 한 번에 병렬로 가져오기 (최적화)
        const artworkIds = artworks.map(a => a.id);
        const uniqueUserIds = [...new Set(artworks.map(a => a.user_id))];
        
        const [likesMap, tagsMap, commentCountsMap, savedStatus, profilesMap] = await Promise.all([
            getBatchLikesData(artworkIds, userId),
            getBatchArtworkTags(artworkIds),
            getBatchCommentCounts(artworkIds),
            userId ? getBatchSavedStatus(artworkIds, userId) : Promise.resolve(new Map()),
            getBatchProfiles(uniqueUserIds)
        ]);
        
        // 데이터 병합 (렌더링에 필요한 모든 정보 포함)
        const artworksWithData = artworks.map(artwork => {
            const likesData = likesMap.get(artwork.id) || { likes: 0, dislikes: 0, userReaction: null };
            const tags = tagsMap.get(artwork.id) || [];
            const commentCount = commentCountsMap.get(artwork.id) || 0;
            const postIdStr = String(artwork.id);
            const isSaved = userId ? (savedStatus.get(artwork.id) || savedStatus.get(postIdStr) || false) : false;
            const profile = profilesMap.get(artwork.user_id);
            
            return {
                ...artwork,
                likes_count: likesData.likes,
                dislikes_count: likesData.dislikes,
                engagement_score: likesData.likes - likesData.dislikes,
                userReaction: likesData.userReaction,
                tags: tags,
                comment_count: commentCount,
                is_saved: isSaved,
                author_profile: profile
            };
        });
        
        return artworksWithData;
        
    } catch (err) {
        console.error('게시판 로드 예외:', err);
        boardList.innerHTML = getEmptyStateHTML('error', '오류가 발생했습니다');
    }
}

// ========== 게시물 렌더링 (통합 함수) ==========
export async function renderBoardList() {
    const boardList = document.getElementById('board-list');
    if (!boardList) return;
    
    const posts = window._boardState.filteredPosts;
    
    // 현재 사용자 확인
    const { data: { session } } = await window._supabase.auth.getSession();
    const userId = session?.user?.id || null;
    
    // 게시물이 없는 경우
    if (!posts || posts.length === 0) {
        boardList.innerHTML = getEmptyStateHTML('search', '검색 결과가 없습니다');
        return;
    }
    
    // 이미 데이터가 포함된 경우 추가 조회 생략
    const needsDataFetch = posts.length > 0 && !posts[0].hasOwnProperty('comment_count');
    
    let commentCountsMap, likesDataMap, savedStatus, profilesMap;
    
    if (needsDataFetch) {
        // 데이터가 없는 경우에만 조회 (필터링/정렬 후 재렌더링 시)
        const artworkIds = posts.map(p => p.id);
        const uniqueUserIds = [...new Set(posts.map(p => p.user_id))];
        
        [commentCountsMap, likesDataMap, savedStatus, profilesMap] = await Promise.all([
            getBatchCommentCounts(artworkIds),
            getBatchLikesData(artworkIds, userId),
            userId ? getBatchSavedStatus(artworkIds, userId) : Promise.resolve(new Map()),
            getBatchProfiles(uniqueUserIds)
        ]);
    }
    
    const boardHTML = posts.map((post) => {
        // 파일이 실제로 존재하는지 확인
        const hasFiles = (post.images && post.images.length > 0 && post.images.some(img => img)) || (post.image_url && post.image_url.trim());
        const allFiles = hasFiles 
            ? ((post.images && post.images.length > 0) ? post.images.filter(img => img) : [post.image_url])
            : [];
        const hasMultipleFiles = allFiles.length > 1;
        const fileCount = allFiles.length;
        
        // 이미 로드된 데이터 사용 또는 새로 조회한 데이터 사용
        const commentCount = post.comment_count ?? (commentCountsMap?.get(post.id) || 0);
        const likes = needsDataFetch 
            ? (likesDataMap?.get(post.id) || { likes: 0, dislikes: 0, userReaction: null })
            : { likes: post.likes_count || 0, dislikes: post.dislikes_count || 0, userReaction: post.userReaction || null };
        
        const postIdStr = String(post.id);
        const isSavedValue = post.is_saved ?? (userId ? (savedStatus?.get(post.id) || savedStatus?.get(postIdStr) || false) : false);
        const mediaType = post.media_type || 'image';
        
        // 작성자 프로필 가져오기 (이미 로드된 데이터 또는 캐시된 데이터 사용)
        const profile = post.author_profile ?? profilesMap?.get(post.user_id);
        const avatarHTML = getAvatarHTML(profile);
        
        // 미디어 렌더링
        const fileUrl = allFiles.length > 0 ? allFiles[0] : null;
        const mediaHTML = fileUrl ? renderMediaHTML(post.id, fileUrl, allFiles, mediaType) : '';
        
        return `
            <div class="board-item" data-post-id="${post.id}" onclick="openArtworkDetail('${post.id}')">
                <div class="board-item-header">
                    <div class="board-author-avatar" onclick="event.stopPropagation(); selectUserById('${post.user_id}')">
                        ${avatarHTML}
                    </div>
                    <div class="board-author-info">
                        <span class="board-author-name" onclick="event.stopPropagation(); selectUserById('${post.user_id}')">${escapeHtml(post.author_nickname || '익명')}</span>
                        <span class="board-post-date">${formatDate(post.created_at)}</span>
                    </div>
                </div>
                
                <div class="board-item-title-wrapper">
                    <div class="board-item-title">${escapeHtml(post.title)}</div>
                </div>
                
                ${fileUrl ? `
                <div class="board-item-image ${mediaType === 'audio' ? 'board-item-audio' : ''}" ${mediaType === 'image' ? `onclick="event.stopPropagation(); openImageViewer('${post.id}', ${JSON.stringify(allFiles).replace(/"/g, '&quot;')}, 0)"` : 'onclick="event.stopPropagation();"'}>
                    ${mediaHTML}
                    ${hasMultipleFiles ? `
                        <div class="board-multiple-indicator">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <rect x="7" y="7" width="10" height="10" rx="1" ry="1"></rect>
                            </svg>
                            ${fileCount}
                        </div>
                    ` : ''}
                </div>
                ` : ''}
                
                <div class="board-item-content">
                    ${post.description ? `
                        <div class="board-item-description" id="board-description-${post.id}">
                            ${escapeHtml(post.description)}
                        </div>
                        <span class="board-read-more" id="board-read-more-${post.id}" style="display:none;" onclick="event.stopPropagation(); toggleBoardDescription('${post.id}')">...더보기</span>
                    ` : ''}
                    ${post.tags && post.tags.length > 0 ? `
                        <div class="board-item-tags">
                            ${post.tags.map(tag => `<span class="board-item-tag" onclick="event.stopPropagation(); toggleBoardTagFilter('${tag}')">#${escapeHtml(tag)}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
                
                ${renderActionsHTML(post.id, likes, commentCount, isSavedValue)}
            </div>
        `;
    });
    
    boardList.innerHTML = boardHTML.join('');
    
    // 더보기 버튼 표시 여부 확인 (렌더링 후)
    requestAnimationFrame(() => {
        checkBoardDescriptions();
        setupVideoIntersectionObserver();
        setupBoardScrollObservers();
    });
}

// ========== 헬퍼 함수들 ==========

/**
 * 빈 상태 HTML 생성
 */
function getEmptyStateHTML(type, message) {
    const icons = {
        error: `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
        `,
        empty: `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
        `,
        search: `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
        `
    };
    
    const descriptions = {
        error: '페이지를 새로고침해주세요',
        empty: '첫 번째 게시물을 업로드하고 커뮤니티를 시작하세요!',
        search: '다른 검색어나 필터를 시도해보세요'
    };
    
    return `
        <div class="feed-empty">
            <div class="feed-empty-icon">
                ${icons[type] || icons.error}
            </div>
            <h3>${escapeHtml(message)}</h3>
            <p>${descriptions[type] || ''}</p>
            ${type === 'empty' ? '<button class="feed-empty-btn" onclick="openUploadModal()">게시물 업로드하기</button>' : ''}
        </div>
    `;
}

/**
 * 미디어 HTML 렌더링 (비디오, 오디오, 이미지)
 */
function renderMediaHTML(postId, fileUrl, allFiles, mediaType) {
    if (mediaType === 'video') {
        return `
            <div class="video-container" data-video-container="${postId}">
                <video 
                    class="board-video" 
                    data-video-id="${postId}"
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
    }
    
    if (mediaType === 'audio') {
        return `
            <div class="board-audio-container">
                <div class="board-audio-content">
                    <svg class="board-audio-icon" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M9 18V5l12-2v13"></path>
                        <circle cx="6" cy="18" r="3"></circle>
                        <circle cx="18" cy="16" r="3"></circle>
                    </svg>
                    <audio controls class="board-audio-player" onloadedmetadata="this.volume = 0.3">
                        <source src="${escapeHtml(fileUrl)}" type="audio/mpeg">
                        브라우저가 오디오를 지원하지 않습니다.
                    </audio>
                </div>
            </div>
        `;
    }
    
    // 이미지: 모바일 스크롤 + 데스크톱 캐러셀
    const hasMultiple = allFiles.length > 1;
    const fileCount = allFiles.length;
    
    // 모바일 스크롤 뷰
    const scrollHTML = `
        <div class="board-images-scroll" data-board-scroll="${postId}">
            <div class="board-images-scroll-container" data-scroll-container="${postId}">
                ${allFiles.map((file, idx) => `
                    <div class="board-scroll-image" data-scroll-index="${idx}">
                        <img src="${escapeHtml(file)}" alt="이미지 ${idx + 1}" loading="lazy" draggable="false">
                    </div>
                `).join('')}
            </div>
            ${hasMultiple ? `
                <div class="board-scroll-page-indicator" data-page-indicator="${postId}">1/${fileCount}</div>
            ` : ''}
        </div>
    `;
    
    // 데스크톱 캐러셀 뷰
    const carouselHTML = `
        <div class="board-carousel-container" data-board-carousel="${postId}">
            <img src="${escapeHtml(fileUrl)}" alt="이미지" loading="lazy" data-file-index="0">
            ${hasMultiple ? `
                <button class="board-carousel-nav board-carousel-prev" onclick="event.stopPropagation(); prevBoardImage('${postId}', ${JSON.stringify(allFiles).replace(/"/g, '&quot;')})">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <button class="board-carousel-nav board-carousel-next" onclick="event.stopPropagation(); nextBoardImage('${postId}', ${JSON.stringify(allFiles).replace(/"/g, '&quot;')})">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
                <div class="board-carousel-indicators">
                    ${allFiles.map((_, idx) => `<div class="board-carousel-indicator ${idx === 0 ? 'active' : ''}" data-indicator-index="${idx}"></div>`).join('')}
                </div>
            ` : ''}
        </div>
    `;
    
    return carouselHTML + scrollHTML;
}

/**
 * 액션 버튼 HTML 렌더링
 */
function renderActionsHTML(postId, likes, commentCount, isSaved) {
    return `
        <div class="board-item-actions">
            <button class="board-action-btn like-btn ${likes.userReaction === 'like' ? 'liked' : ''}" 
                    id="like-btn-${postId}" 
                    onclick="event.stopPropagation(); toggleLike('${postId}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                </svg>
                <span id="like-count-${postId}">${likes.likes}</span>
            </button>
            <button class="board-action-btn dislike-btn ${likes.userReaction === 'dislike' ? 'disliked' : ''}" 
                    id="dislike-btn-${postId}" 
                    onclick="event.stopPropagation(); toggleDislike('${postId}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
                </svg>
            </button>
            <button class="board-action-btn comment-btn" onclick="event.stopPropagation(); openArtworkDetail('${postId}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span id="comment-count-${postId}">${commentCount}</span>
            </button>
            <button class="board-action-btn save-btn ${isSaved ? 'saved' : ''}" 
                    id="save-btn-${postId}" 
                    onclick="event.stopPropagation(); toggleSave('${postId}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
            </button>
        </div>
    `;
}

// ========== 설명 더보기/접기 ==========
function checkBoardDescriptions() {
    const descriptions = document.querySelectorAll('.board-item-description');
    descriptions.forEach(desc => {
        const postId = desc.id.replace('board-description-', '');
        const readMoreBtn = document.getElementById(`board-read-more-${postId}`);
        
        if (!readMoreBtn) return;
        
        const lineHeight = parseFloat(getComputedStyle(desc).lineHeight) || 24;
        const maxHeight = lineHeight * 5;
        
        if (desc.scrollHeight > maxHeight) {
            readMoreBtn.style.display = 'inline-block';
            desc.style.maxHeight = `${maxHeight}px`;
            desc.style.overflow = 'hidden';
        }
    });
}

export function toggleBoardDescription(postId) {
    const descEl = document.getElementById(`board-description-${postId}`);
    const readMoreBtn = document.getElementById(`board-read-more-${postId}`);
    
    if (!descEl || !readMoreBtn) return;
    
    const isExpanded = descEl.classList.contains('expanded');
    
    if (isExpanded) {
        descEl.classList.remove('expanded');
        readMoreBtn.textContent = '...더보기';
        const lineHeight = parseFloat(getComputedStyle(descEl).lineHeight) || 24;
        descEl.style.maxHeight = `${lineHeight * 5}px`;
    } else {
        descEl.classList.add('expanded');
        readMoreBtn.textContent = '접기';
        descEl.style.maxHeight = 'none';
    }
}

// ========== 비디오 자동 재생 최적화 ==========
function setupVideoIntersectionObserver() {
    const videos = document.querySelectorAll('.board-video');
    
    if (videos.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                video.play().catch(err => console.log('자동 재생 실패:', err));
            } else {
                video.pause();
            }
        });
    }, { threshold: [0, 0.5, 1.0] });
    
    videos.forEach(video => observer.observe(video));
}

// ========== 스크롤 인디케이터 ==========
function setupBoardScrollObservers() {
    const scrollContainers = document.querySelectorAll('.board-images-scroll-container');
    
    scrollContainers.forEach(container => {
        const postId = container.dataset.scrollContainer;
        const pageIndicator = document.querySelector(`[data-page-indicator="${postId}"]`);
        
        if (!pageIndicator) return;
        
        let scrollTimeout;
        container.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollLeft = container.scrollLeft;
                const containerWidth = container.offsetWidth;
                const currentIndex = Math.round(scrollLeft / containerWidth);
                const totalImages = container.querySelectorAll('.board-scroll-image').length;
                
                pageIndicator.textContent = `${currentIndex + 1}/${totalImages}`;
            }, 50);
        });
        
        // 모바일에서 세로 스크롤 방지
        let startY = 0;
        let startX = 0;
        
        container.addEventListener('touchstart', (e) => {
            startY = e.touches[0].pageY;
            startX = e.touches[0].pageX;
        }, { passive: true });
        
        container.addEventListener('touchmove', (e) => {
            const deltaY = Math.abs(e.touches[0].pageY - startY);
            const deltaX = Math.abs(e.touches[0].pageX - startX);
            
            // 가로 스크롤이 세로 스크롤보다 크면 세로 스크롤 방지
            if (deltaX > deltaY) {
                e.stopPropagation();
            }
        }, { passive: false });
    });
}

// ========== 검색 & 필터 ==========
export async function performBoardSearch() {
    const searchInput = document.getElementById('board-search-input');
    const clearBtn = document.getElementById('board-search-clear');
    
    if (!searchInput) return;
    
    const query = searchInput.value.trim().toLowerCase();
    
    if (query) {
        if (clearBtn) clearBtn.style.display = 'flex';
    } else {
        if (clearBtn) clearBtn.style.display = 'none';
    }
    
    await applyBoardSearchAndFilter();
}

export async function clearBoardSearch() {
    const searchInput = document.getElementById('board-search-input');
    const clearBtn = document.getElementById('board-search-clear');
    
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    
    await applyBoardSearchAndFilter();
}

export async function applyBoardSearchAndFilter(posts = null) {
    const allPosts = posts || window._boardState.allPosts;
    const searchInput = document.getElementById('board-search-input');
    const selectedTagsContainer = document.getElementById('board-selected-tags');
    
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
        const selectedTags = Array.from(selectedTagsContainer.querySelectorAll('.board-selected-tag'))
            .map(chip => chip.textContent.trim().replace('×', '').trim().replace(/^#/, '').toLowerCase());
        
        if (selectedTags.length > 0) {
            filtered = filtered.filter(post => {
                const postTags = (post.tags || []).map(tag => tag.toLowerCase());
                return selectedTags.every(tag => postTags.includes(tag));
            });
        }
    }
    
    // 정렬 적용
    const sortMode = window._boardState.currentSortMode || 'latest';
    filtered = sortPosts(filtered, sortMode);
    
    window._boardState.filteredPosts = filtered;
    await renderBoardList();
}

// ========== 정렬 ==========
export async function changeBoardSortMode(mode) {
    const sortButtons = document.querySelectorAll('#board-sort-dropdown .feed-sort-option');
    sortButtons.forEach(btn => {
        if (btn.getAttribute('data-sort') === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    window._boardState.currentSortMode = mode;
    
    const sorted = sortPosts([...window._boardState.filteredPosts], mode);
    window._boardState.filteredPosts = sorted;
    await renderBoardList();
}

// ========== UI 토글 함수들 ==========
export function toggleBoardSearchPanel() {
    const panel = document.getElementById('board-search-panel');
    const toggleBtn = document.getElementById('board-search-toggle');
    
    if (panel) {
        const isVisible = panel.style.display === 'block';
        panel.style.display = isVisible ? 'none' : 'block';
        
        if (toggleBtn) {
            toggleBtn.classList.toggle('active', !isVisible);
        }
    }
}

export function toggleBoardSortFilter() {
    const dropdown = document.getElementById('board-sort-dropdown');
    const tagDropdown = document.getElementById('board-tag-dropdown');
    
    if (dropdown) {
        const isVisible = dropdown.style.display === 'block';
        dropdown.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible && tagDropdown) {
            tagDropdown.style.display = 'none';
        }
    }
}

export function toggleBoardTagFilterDropdown() {
    const dropdown = document.getElementById('board-tag-dropdown');
    const sortDropdown = document.getElementById('board-sort-dropdown');
    
    if (dropdown) {
        const isVisible = dropdown.style.display === 'block';
        dropdown.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible && sortDropdown) {
            sortDropdown.style.display = 'none';
        }
    }
}

// ========== 태그 필터 ==========
export async function addBoardTagFilter() {
    const tagInput = document.getElementById('board-tag-input');
    const selectedTagsContainer = document.getElementById('board-selected-tags');
    const suggestionsContainer = document.getElementById('board-tag-suggestions');
    
    if (!tagInput || !selectedTagsContainer) return;
    
    const tagName = tagInput.value.trim().toLowerCase().replace(/^#/, '');
    if (!tagName) return;
    
    // 기존 태그 확인
    const existingTags = Array.from(selectedTagsContainer.querySelectorAll('.board-selected-tag'))
        .map(chip => chip.textContent.trim().replace('×', '').trim().replace(/^#/, ''));
    
    if (existingTags.includes(tagName)) {
        tagInput.value = '';
        if (suggestionsContainer) suggestionsContainer.style.display = 'none';
        return;
    }
    
    // 태그 칩 생성
    const tagChip = document.createElement('div');
    tagChip.className = 'board-selected-tag';
    tagChip.innerHTML = `
        #${escapeHtml(tagName)}
        <button class="board-tag-remove" onclick="removeBoardTagFilter(this)">
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
    
    await applyBoardSearchAndFilter();
}

export async function removeBoardTagFilter(button) {
    const chip = button.parentElement;
    const container = document.getElementById('board-selected-tags');
    
    if (chip) chip.remove();
    
    if (container && container.children.length === 0) {
        container.style.display = 'none';
    }
    
    await applyBoardSearchAndFilter();
}

export async function searchBoardTagSuggestions() {
    const tagInput = document.getElementById('board-tag-input');
    const suggestionsContainer = document.getElementById('board-tag-suggestions');
    
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
                <div class="feed-tag-suggestion-item" onclick="selectBoardTagSuggestion('${escapeHtml(tag.name)}')">
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

export async function selectBoardTagSuggestion(tagName) {
    const tagInput = document.getElementById('board-tag-input');
    if (tagInput) {
        tagInput.value = tagName;
    }
    await addBoardTagFilter();
}

export async function toggleBoardTagFilter(tagName) {
    const tagInput = document.getElementById('board-tag-input');
    if (tagInput) {
        tagInput.value = tagName;
    }
    await addBoardTagFilter();
}

// ========== 캐러셀 네비게이션 ==========
export function prevBoardImage(postId, files) {
    const container = document.querySelector(`[data-board-carousel="${postId}"]`);
    if (!container) return;
    
    const img = container.querySelector('img');
    const indicators = container.querySelectorAll('.board-carousel-indicator');
    const currentIndex = parseInt(img.dataset.fileIndex || '0');
    const newIndex = currentIndex > 0 ? currentIndex - 1 : files.length - 1;
    
    img.src = files[newIndex];
    img.dataset.fileIndex = newIndex;
    
    indicators.forEach((indicator, idx) => {
        indicator.classList.toggle('active', idx === newIndex);
    });
}

export function nextBoardImage(postId, files) {
    const container = document.querySelector(`[data-board-carousel="${postId}"]`);
    if (!container) return;
    
    const img = container.querySelector('img');
    const indicators = container.querySelectorAll('.board-carousel-indicator');
    const currentIndex = parseInt(img.dataset.fileIndex || '0');
    const newIndex = currentIndex < files.length - 1 ? currentIndex + 1 : 0;
    
    img.src = files[newIndex];
    img.dataset.fileIndex = newIndex;
    
    indicators.forEach((indicator, idx) => {
        indicator.classList.toggle('active', idx === newIndex);
    });
}

// ========== 전역 함수 노출 ==========
window.initBoard = initBoard;
window.switchBoardType = switchBoardType;
window.toggleBoardTypeFromButton = toggleBoardTypeFromButton;
window.toggleBoardDescription = toggleBoardDescription;
window.performBoardSearch = performBoardSearch;
window.clearBoardSearch = clearBoardSearch;
window.changeBoardSortMode = changeBoardSortMode;
window.toggleBoardSearchPanel = toggleBoardSearchPanel;
window.toggleBoardSortFilter = toggleBoardSortFilter;
window.toggleBoardTagFilterDropdown = toggleBoardTagFilterDropdown;
window.addBoardTagFilter = addBoardTagFilter;
window.removeBoardTagFilter = removeBoardTagFilter;
window.searchBoardTagSuggestions = searchBoardTagSuggestions;
window.selectBoardTagSuggestion = selectBoardTagSuggestion;
window.toggleBoardTagFilter = toggleBoardTagFilter;
window.prevBoardImage = prevBoardImage;
window.nextBoardImage = nextBoardImage;

// 좋아요/싫어요는 기존 함수 재사용
window.toggleLike = PostLikes.toggleLike;
window.toggleDislike = PostLikes.toggleDislike;
