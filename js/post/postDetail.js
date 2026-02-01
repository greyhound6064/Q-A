/**
 * @file feedDetail.js
 * @description 피드 상세보기 모달 (자유 게시판 스타일)
 */

import { escapeHtml, formatDate, linkifyText } from '../utils.js';
import { getLikesData } from '../services/likeService.js';
import { getArtworkTags } from '../services/tagService.js';
import { isSaved } from '../services/saveService.js';
import { setFeedDetailFiles } from './postCarousel.js';
import { loadFeedDetailComments } from './postComments.js';
import { showLoginRequiredModal } from '../utils/errorHandler.js';
import { historyManager } from '../utils/historyManager.js';

/**
 * 피드 상세보기 열기 (스레드 스타일 모달)
 */
export async function openFeedDetail(postId, showComments = false, feedPosts = []) {
    // 기존 모달이 있으면 제거
    const existingModal = document.getElementById('feed-detail-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 리스트의 모든 비디오 정지
    const allVideos = document.querySelectorAll('.feed-video');
    allVideos.forEach(video => {
        video.pause();
    });
    
    // 게시물 데이터 가져오기 (먼저 로컬에서 찾고, 없으면 DB에서 가져오기)
    let post = feedPosts.find(p => String(p.id) === String(postId));
    
    if (!post) {
        console.log('로컬에서 게시물을 찾을 수 없어 DB에서 가져옵니다:', postId);
        try {
            const { data, error } = await window._supabase
                .from('artworks')
                .select('*')
                .eq('id', postId)
                .single();
            
            if (error || !data) {
                console.error('게시물을 찾을 수 없습니다:', postId, error);
                alert('게시물을 불러올 수 없습니다.');
                return;
            }
            
            // 태그 정보 가져오기
            const tags = await getArtworkTags(postId);
            post = { ...data, tags };
        } catch (err) {
            console.error('게시물 로드 실패:', err);
            alert('게시물을 불러올 수 없습니다.');
            return;
        }
    }
    
    // 현재 사용자 확인
    const { data: { session } } = await window._supabase.auth.getSession();
    const userId = session?.user?.id || null;
    
    // 좋아요/싫어요 정보 가져오기
    const likesData = await getLikesData(postId, userId);
    const isSavedValue = userId ? await isSaved(postId, userId) : false;
    
    // 작성자 프로필 이미지 가져오기
    let avatarHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
            avatarHTML = `<img src="${escapeHtml(profile.avatar_url)}" alt="프로필">`;
        }
    } catch (err) {
        console.log('프로필 이미지 로드 실패:', err);
    }
    
    // 미디어 HTML 생성 (좌측 섹션용 - 캐러셀 지원)
    let mediaHTML = '';
    let hasMedia = false;
    
    // 파일 목록 설정
    let feedDetailFiles = [];
    if (post.images && post.images.length > 0) {
        feedDetailFiles = post.images;
        hasMedia = true;
    } else if (post.image_url) {
        feedDetailFiles = [post.image_url];
        hasMedia = true;
    }
    
    // 캐러셀 상태 설정
    setFeedDetailFiles(feedDetailFiles);
    
    if (hasMedia) {
        const fileUrl = feedDetailFiles[0];
        const mediaType = post.media_type || 'image';
        const hasMultipleFiles = feedDetailFiles.length > 1;
        
        if (mediaType === 'video') {
            mediaHTML = `
                <div id="feed-detail-media-content">
                    <video id="feed-detail-video" controls loop playsinline autoplay onloadedmetadata="this.volume = 0.3">
                        <source src="${escapeHtml(fileUrl)}" type="video/mp4">
                        브라우저가 비디오를 지원하지 않습니다.
                    </video>
                </div>
                ${hasMultipleFiles ? `
                    <button class="feed-detail-carousel-nav feed-detail-carousel-prev" onclick="prevFeedDetailFile()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <button class="feed-detail-carousel-nav feed-detail-carousel-next" onclick="nextFeedDetailFile()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                    <div class="feed-detail-carousel-indicators" id="feed-detail-carousel-indicators">
                        ${feedDetailFiles.map((_, idx) => `<div class="feed-detail-carousel-indicator ${idx === 0 ? 'active' : ''}"></div>`).join('')}
                    </div>
                ` : ''}
            `;
        } else if (mediaType === 'audio') {
            mediaHTML = `
                <div id="feed-detail-media-content" class="audio-content">
                    <audio controls onloadedmetadata="this.volume = 0.3">
                        <source src="${escapeHtml(fileUrl)}" type="audio/mpeg">
                        브라우저가 오디오를 지원하지 않습니다.
                    </audio>
                </div>
                ${hasMultipleFiles ? `
                    <button class="feed-detail-carousel-nav feed-detail-carousel-prev" onclick="prevFeedDetailFile()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <button class="feed-detail-carousel-nav feed-detail-carousel-next" onclick="nextFeedDetailFile()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                    <div class="feed-detail-carousel-indicators" id="feed-detail-carousel-indicators">
                        ${feedDetailFiles.map((_, idx) => `<div class="feed-detail-carousel-indicator ${idx === 0 ? 'active' : ''}"></div>`).join('')}
                    </div>
                ` : ''}
            `;
        } else {
            mediaHTML = `
                <div id="feed-detail-media-content">
                    <img src="${escapeHtml(fileUrl)}" alt="${escapeHtml(post.title)}">
                </div>
                ${hasMultipleFiles ? `
                    <button class="feed-detail-carousel-nav feed-detail-carousel-prev" onclick="prevFeedDetailFile()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <button class="feed-detail-carousel-nav feed-detail-carousel-next" onclick="nextFeedDetailFile()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                    <div class="feed-detail-carousel-indicators" id="feed-detail-carousel-indicators">
                        ${feedDetailFiles.map((_, idx) => `<div class="feed-detail-carousel-indicator ${idx === 0 ? 'active' : ''}"></div>`).join('')}
                    </div>
                ` : ''}
            `;
        }
    }
    
    // 태그 HTML 생성
    let tagsHTML = '';
    if (post.tags && post.tags.length > 0) {
        tagsHTML = `
            <div class="feed-detail-tags">
                ${post.tags.map(tag => `
                    <span class="feed-detail-tag" onclick="toggleTagFilter('${tag}')">#${escapeHtml(tag)}</span>
                `).join(' ')}
            </div>
        `;
    }
    
    // 모달 HTML 생성 (자유 게시판 스타일 - 좌우 레이아웃)
    const modalHTML = `
        <div id="feed-detail-modal" class="feed-detail-modal">
            <div class="feed-detail-content ${!hasMedia ? 'no-media' : ''}">
                ${hasMedia ? `
                <!-- 미디어 섹션 (좌측) -->
                <div class="feed-detail-media-section">
                    ${mediaHTML}
                </div>
                ` : ''}
                
                <!-- 정보 섹션 (우측 또는 전체) -->
                <div class="feed-detail-info-section">
                    <div class="feed-detail-header">
                        <div class="feed-detail-header-user">
                            <div class="feed-detail-header-avatar" onclick="selectUserById('${post.user_id}')">
                                ${avatarHTML}
                            </div>
                            <div class="feed-detail-header-info">
                                <span class="feed-detail-header-name" onclick="selectUserById('${post.user_id}')">${escapeHtml(post.author_nickname || '익명')}</span>
                                <span class="feed-detail-header-date">${formatDate(post.created_at)}</span>
                            </div>
                        </div>
                        <div class="feed-detail-header-actions">
                            ${userId && post.user_id === userId ? `
                            <button class="feed-detail-menu-btn" onclick="toggleFeedDetailMenu(event)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="1"></circle>
                                    <circle cx="12" cy="5" r="1"></circle>
                                    <circle cx="12" cy="19" r="1"></circle>
                                </svg>
                            </button>
                            <div class="feed-detail-menu-dropdown" id="feed-detail-menu-dropdown" style="display:none;">
                                <button class="feed-detail-menu-item" onclick="openEditFeedPost('${postId}')">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                    <span>게시물 수정</span>
                                </button>
                                <button class="feed-detail-menu-item delete" onclick="deleteFeedPost('${postId}')">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                    <span>게시물 삭제</span>
                                </button>
                            </div>
                            ` : ''}
                            <button class="feed-detail-close" onclick="closeFeedDetail()">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="feed-detail-body">
                        <div class="feed-detail-post">
                            
                            <!-- 게시물 내용 -->
                            ${post.title ? `<div class="feed-detail-title">${escapeHtml(post.title)}</div>` : ''}
                            ${post.description ? `<div class="feed-detail-description">${linkifyText(post.description)}</div>` : ''}
                            
                            <!-- 태그 -->
                            ${tagsHTML}
                            
                            <!-- 좋아요/싫어요/저장 버튼 -->
                            <div class="feed-detail-reactions">
                                <button class="feed-detail-reaction-btn like-btn ${likesData.userReaction === 'like' ? 'active' : ''}" 
                                        id="feed-detail-like-btn" 
                                        onclick="toggleFeedDetailLike('${postId}')">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M7 10v12"></path>
                                        <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"></path>
                                    </svg>
                                    <span id="feed-detail-like-count">${likesData.likes}</span>
                                </button>
                                <button class="feed-detail-reaction-btn dislike-btn ${likesData.userReaction === 'dislike' ? 'active' : ''}" 
                                        id="feed-detail-dislike-btn" 
                                        onclick="toggleFeedDetailDislike('${postId}')">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M17 14V2"></path>
                                        <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"></path>
                                    </svg>
                                </button>
                                <button class="feed-detail-reaction-btn save-btn ${isSavedValue ? 'active' : ''}" 
                                        id="feed-detail-save-btn" 
                                        onclick="toggleFeedDetailSave('${postId}')">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <!-- 댓글 섹션 -->
                        <div class="feed-detail-comments">
                            <h4 class="feed-detail-comments-title" id="feed-detail-comments-title">댓글 <span id="feed-detail-comment-count">0</span>개</h4>
                            
                            <!-- 댓글 리스트 -->
                            <div class="feed-detail-comments-list" id="feed-detail-comments-list">
                                <div style="text-align:center;padding:20px;color:var(--text-light);">댓글을 불러오는 중...</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 댓글 입력 (body 외부 - 하단 고정) -->
                    ${userId ? `
                    <div class="feed-detail-comment-form">
                        <div class="feed-detail-comment-input-wrapper">
                            <div class="feed-detail-reply-tag" id="feed-detail-reply-tag" style="display:none;">
                                <span class="reply-tag-text"></span>
                                <button class="reply-tag-close" onclick="clearFeedDetailReplyTarget()">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                            <textarea 
                                id="feed-detail-comment-textarea" 
                                class="feed-detail-comment-textarea" 
                                placeholder="댓글을 입력하세요..."
                                rows="1"></textarea>
                        </div>
                        <button class="feed-detail-comment-submit" onclick="submitFeedDetailComment('${postId}')">
                            게시
                        </button>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    // 모달 추가
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // body 스크롤 방지
    document.body.style.overflow = 'hidden';
    
    // 히스토리 추가
    if (!historyManager.isRestoringState()) {
        historyManager.pushFeedDetailState(postId, showComments);
    }
    
    // 댓글 로드
    await loadFeedDetailComments(postId);
    
    // ESC 키로 닫기
    document.addEventListener('keydown', handleFeedDetailEscape);
    
    // 저장된 postId
    window._currentFeedDetailPostId = postId;
}

/**
 * 댓글 토글 (상세보기 열기)
 */
export async function toggleComments(artworkId, feedPosts = []) {
    await openFeedDetail(artworkId, true, feedPosts);
}

/**
 * 피드 상세보기 모달 닫기
 */
export function closeFeedDetail() {
    const modal = document.getElementById('feed-detail-modal');
    if (modal) {
        modal.remove();
    }
    document.body.style.overflow = 'auto';
    document.removeEventListener('keydown', handleFeedDetailEscape);
    window._currentFeedDetailPostId = null;
    
    // 뒤로 가기 실행 (히스토리 복원 중이 아닐 때만)
    // X 버튼 클릭 시에만 뒤로가기 실행
    if (!historyManager.isRestoringState()) {
        // 약간의 지연을 두고 뒤로가기 실행하여 모달이 완전히 닫힌 후 히스토리 이동
        setTimeout(() => {
            historyManager.goBack();
        }, 50);
    }
}

/**
 * ESC 키로 피드 상세보기 닫기
 */
function handleFeedDetailEscape(e) {
    if (e.key === 'Escape') {
        closeFeedDetail();
    }
}

/**
 * 피드 상세보기 좋아요 토글
 */
export async function toggleFeedDetailLike(postId) {
    try {
        const { data: { session } } = await window._supabase.auth.getSession();
        if (!session || !session.user) {
            showLoginRequiredModal();
            return;
        }
        
        await window.toggleLike(postId);
        
        // UI 업데이트
        const likesData = await getLikesData(postId, session.user.id);
        const likeBtn = document.getElementById('feed-detail-like-btn');
        const dislikeBtn = document.getElementById('feed-detail-dislike-btn');
        const likeCount = document.getElementById('feed-detail-like-count');
        const dislikeCount = document.getElementById('feed-detail-dislike-count');
        
        if (likeBtn && likeCount) {
            likeCount.textContent = likesData.likes;
            if (likesData.userReaction === 'like') {
                likeBtn.classList.add('active');
            } else {
                likeBtn.classList.remove('active');
            }
        }
        
        if (dislikeBtn && dislikeCount) {
            dislikeCount.textContent = likesData.dislikes;
            if (likesData.userReaction === 'dislike') {
                dislikeBtn.classList.add('active');
            } else {
                dislikeBtn.classList.remove('active');
            }
        }
    } catch (error) {
        console.error('좋아요 토글 실패:', error);
    }
}

/**
 * 피드 상세보기 싫어요 토글
 */
export async function toggleFeedDetailDislike(postId) {
    try {
        const { data: { session } } = await window._supabase.auth.getSession();
        if (!session || !session.user) {
            showLoginRequiredModal();
            return;
        }
        
        await window.toggleDislike(postId);
        
        // UI 업데이트
        const likesData = await getLikesData(postId, session.user.id);
        const likeBtn = document.getElementById('feed-detail-like-btn');
        const dislikeBtn = document.getElementById('feed-detail-dislike-btn');
        const likeCount = document.getElementById('feed-detail-like-count');
        
        if (likeBtn && likeCount) {
            likeCount.textContent = likesData.likes;
            if (likesData.userReaction === 'like') {
                likeBtn.classList.add('active');
            } else {
                likeBtn.classList.remove('active');
            }
        }
        
        if (dislikeBtn) {
            if (likesData.userReaction === 'dislike') {
                dislikeBtn.classList.add('active');
            } else {
                dislikeBtn.classList.remove('active');
            }
        }
    } catch (error) {
        console.error('싫어요 토글 실패:', error);
    }
}

/**
 * 피드 상세보기 저장 토글
 */
export async function toggleFeedDetailSave(postId) {
    try {
        const { data: { session } } = await window._supabase.auth.getSession();
        if (!session || !session.user) {
            showLoginRequiredModal();
            return;
        }
        
        const isSavedValue = await window.toggleSave(postId);
        
        // UI 업데이트
        const saveBtn = document.getElementById('feed-detail-save-btn');
        if (saveBtn) {
            if (isSavedValue) {
                saveBtn.classList.add('active');
            } else {
                saveBtn.classList.remove('active');
            }
        }
    } catch (error) {
        console.error('저장 토글 실패:', error);
    }
}

/**
 * 피드 게시물 수정 모달 열기
 */
export async function openEditFeedPost(postId) {
    try {
        const { data: post, error } = await window._supabase
            .from('artworks')
            .select('*')
            .eq('id', postId)
            .single();
        
        if (error || !post) {
            alert('게시물을 불러올 수 없습니다.');
            return;
        }
        
        // 작품 수정 모달 열기 (기존 edit.js 활용)
        if (window.openEditArtworkModalWithData) {
            await window.openEditArtworkModalWithData(post);
        } else {
            alert('수정 기능을 불러올 수 없습니다.');
        }
    } catch (err) {
        console.error('게시물 수정 모달 열기 실패:', err);
        alert('게시물 수정 중 오류가 발생했습니다.');
    }
}

/**
 * 피드 게시물 삭제
 */
export async function deleteFeedPost(postId) {
    if (!confirm('정말로 이 게시물을 삭제하시겠습니까?\n삭제된 게시물은 복구할 수 없습니다.')) {
        return;
    }
    
    try {
        // 게시물 정보 가져오기
        const { data: post } = await window._supabase
            .from('artworks')
            .select('images, image_url')
            .eq('id', postId)
            .single();
        
        // Storage에서 모든 파일 삭제
        if (post) {
            const filesToDelete = post.images && post.images.length > 0 
                ? post.images 
                : (post.image_url ? [post.image_url] : []);
            
            for (const fileUrl of filesToDelete) {
                if (fileUrl) {
                    try {
                        const fileName = fileUrl.split('/').pop().split('?')[0];
                        await window._supabase.storage
                            .from('posts')
                            .remove([fileName]);
                        console.log('파일 삭제 성공:', fileName);
                    } catch (err) {
                        console.log('파일 삭제 실패 (무시):', err);
                    }
                }
            }
        }
        
        // 데이터베이스에서 게시물 삭제
        const { error } = await window._supabase
            .from('artworks')
            .delete()
            .eq('id', postId);
        
        if (error) {
            console.error('게시물 삭제 에러:', error);
            alert('게시물 삭제에 실패했습니다: ' + error.message);
            return;
        }
        
        alert('게시물이 삭제되었습니다.');
        
        // 모달 닫기
        closeFeedDetail();
        
        // 피드 새로고침
        if (window.loadFeedPosts) {
            await window.loadFeedPosts();
        }
        
    } catch (err) {
        console.error('게시물 삭제 예외:', err);
        alert('게시물 삭제 중 오류가 발생했습니다.');
    }
}

/**
 * 피드 상세 메뉴 토글
 */
window.toggleFeedDetailMenu = function(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('feed-detail-menu-dropdown');
    if (dropdown) {
        const isVisible = dropdown.style.display === 'block';
        dropdown.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            // 외부 클릭 시 메뉴 닫기
            setTimeout(() => {
                document.addEventListener('click', closeFeedDetailMenuOnOutsideClick);
            }, 0);
        }
    }
};

/**
 * 외부 클릭 시 메뉴 닫기
 */
function closeFeedDetailMenuOnOutsideClick(event) {
    const dropdown = document.getElementById('feed-detail-menu-dropdown');
    const menuBtn = document.querySelector('.feed-detail-menu-btn');
    
    if (dropdown && menuBtn && 
        !dropdown.contains(event.target) && 
        !menuBtn.contains(event.target)) {
        dropdown.style.display = 'none';
        document.removeEventListener('click', closeFeedDetailMenuOnOutsideClick);
    }
}

// 전역 함수로 노출
window.openEditFeedPost = openEditFeedPost;
window.deleteFeedPost = deleteFeedPost;
window.toggleFeedDetailDislike = toggleFeedDetailDislike;
