/**
 * @file artworkGrid.js
 * @description 작품 그리드 렌더링
 */

import { escapeHtml } from '../utils.js';
import { getBatchLikesData } from '../services/likeService.js';
import { getBatchCommentCounts } from '../services/commentService.js';

/**
 * 작품 그리드 렌더링
 */
export async function renderArtworksGrid(targetUserId = null, filter = 'all') {
    const postsGrid = document.getElementById('profile-posts-grid');
    if (!postsGrid) return;
    
    try {
        const { data: { session } } = await window._supabase.auth.getSession();
        
        // targetUserId가 없으면 현재 로그인한 사용자의 ID 사용
        let userId = targetUserId;
        if (!userId) {
            if (!session || !session.user) {
                postsGrid.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                        </div>
                        <h3>로그인이 필요합니다</h3>
                        <p>작품을 업로드하고 공유하려면 로그인하세요</p>
                    </div>
                `;
                return;
            }
            userId = session.user.id;
        }
        
        // 본인 프로필인지 확인
        const isOwnProfile = session && session.user && session.user.id === userId;
        
        // 사용자의 작품 가져오기 (필터 적용)
        let query = window._supabase
            .from('artworks')
            .select('*')
            .eq('user_id', userId);
        
        // 타인 프로필인 경우 자유 게시판 공개 게시물만 표시
        if (!isOwnProfile) {
            query = query.eq('is_public', true).eq('post_type', 'gallery');
        } else {
            // 본인 프로필인 경우 필터 적용
            if (filter === 'gallery') {
                query = query.eq('post_type', 'gallery').eq('is_public', true);
            } else if (filter === 'feed') {
                query = query.eq('post_type', 'feed').eq('is_public', true);
            } else if (filter === 'private') {
                query = query.eq('is_public', false);
            }
            // 'all'인 경우 필터 없이 모든 게시물 표시
        }
        
        const { data: artworks, error } = await query.order('created_at', { ascending: false });
        
        if (error) {
            console.error('작품 조회 에러:', error);
            postsGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <h3>작품을 불러올 수 없습니다</h3>
                    <p>${error.message}</p>
                </div>
            `;
            return;
        }
        
        // 작품이 없는 경우
        if (!artworks || artworks.length === 0) {
            let emptyMessage = '';
            
            if (!isOwnProfile) {
                // 타인 프로필
                emptyMessage = '아직 공개된 작품이 없습니다';
            } else {
                // 본인 프로필
                if (filter === 'gallery') {
                    emptyMessage = '자유 게시판에 게시된 작품이 없습니다';
                } else if (filter === 'feed') {
                    emptyMessage = '자유 게시판에 게시된 글이 없습니다';
                } else if (filter === 'private') {
                    emptyMessage = '비공개 게시물이 없습니다';
                } else {
                    emptyMessage = '바이브코딩 결과물 공유';
                }
            }
            
            postsGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                    </div>
                    <h3>${emptyMessage}</h3>
                    <p>${isOwnProfile ? '당신의 창작물을 세상과 공유하세요' : ''}</p>
                    ${isOwnProfile && filter === 'all' ? '<button class="empty-action-btn" onclick="openUploadModal()">첫 작품 업로드하기</button>' : ''}
                </div>
            `;
            // 플로팅 버튼 숨김
            const floatingBtn = document.getElementById('floating-upload-btn');
            if (floatingBtn) floatingBtn.style.display = 'none';
            return;
        }
        
        // 작품 ID 배열 추출
        const artworkIds = artworks.map(a => a.id);
        
        // 좋아요 수와 댓글 수를 배치로 조회
        const currentUserId = session?.user?.id || null;
        
        const [likesMap, commentsMap] = await Promise.all([
            getBatchLikesData(artworkIds, currentUserId),
            getBatchCommentCounts(artworkIds)
        ]);
        
        // 작품 그리드 렌더링
        const gridHTML = artworks.map(artwork => {
            // 파일이 있는지 확인
            const hasFiles = (artwork.images && artwork.images.length > 0) || artwork.image_url;
            const fileUrl = hasFiles
                ? ((artwork.images && artwork.images.length > 0) ? artwork.images[0] : artwork.image_url)
                : null;
            const hasMultipleFiles = artwork.images && artwork.images.length > 1;
            const mediaType = artwork.media_type || 'image';
            
            // 좋아요 수와 댓글 수 가져오기
            const likesData = likesMap.get(artwork.id) || { likes: 0 };
            const commentCount = commentsMap.get(artwork.id) || 0;
            
            // 미디어 타입에 따른 썸네일
            let thumbnailHTML = '';
            if (!fileUrl) {
                // 파일이 없는 경우 (텍스트만 있는 게시물)
                thumbnailHTML = `
                    <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--card-bg); padding: 20px; text-align: center;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" stroke-width="1.5" style="margin-bottom: 12px;">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <p style="color: var(--text); font-weight: 600; font-size: 14px; margin: 0; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${escapeHtml(artwork.title)}</p>
                    </div>
                `;
            } else if (mediaType === 'video') {
                thumbnailHTML = `
                    <video style="width: 100%; height: 100%; object-fit: cover;">
                        <source src="${escapeHtml(fileUrl)}" type="video/mp4">
                    </video>
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.6); border-radius: 50%; padding: 12px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                    </div>
                `;
            } else if (mediaType === 'audio') {
                thumbnailHTML = `
                    <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--primary), var(--primary-hover));">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                            <path d="M9 18V5l12-2v13"></path>
                            <circle cx="6" cy="18" r="3"></circle>
                            <circle cx="18" cy="16" r="3"></circle>
                        </svg>
                    </div>
                `;
            } else {
                thumbnailHTML = `<img src="${escapeHtml(fileUrl)}" alt="${escapeHtml(artwork.title)}">`;
            }
            
            return `
                <div class="artwork-grid-item" onclick="openArtworkDetail('${artwork.id}')">
                    ${thumbnailHTML}
                    ${hasMultipleFiles ? `
                        <div class="grid-multiple-indicator">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <rect x="7" y="7" width="10" height="10" rx="1" ry="1"></rect>
                            </svg>
                        </div>
                    ` : ''}
                    <div class="artwork-overlay">
                        <div class="artwork-overlay-stats">
                            <span class="overlay-stat">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                                </svg>
                                <span>${likesData.likes}</span>
                            </span>
                            <span class="overlay-stat">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                                <span>${commentCount}</span>
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        postsGrid.innerHTML = `<div class="artworks-grid">${gridHTML}</div>`;
        
        // 플로팅 버튼 표시
        const floatingBtn = document.getElementById('floating-upload-btn');
        if (floatingBtn) floatingBtn.style.display = 'flex';
        
    } catch (err) {
        console.error('작품 그리드 렌더링 에러:', err);
        const postsGrid = document.getElementById('profile-posts-grid');
        if (postsGrid) {
            postsGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
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
}
