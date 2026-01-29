/**
 * @file artworkComments.js
 * @description 작품 댓글 관리 (댓글, 대댓글, 답글)
 */

import { escapeHtml, formatDate } from '../utils.js';
import { getCurrentArtworkId } from './artworkDetail.js';

// ========== 전역 상태 ==========
let replyTarget = null; // 답글 대상 정보 {id, nickname, rootId}

/**
 * 댓글 섹션 로드
 */
export async function loadArtworkComments(artworkId, autoOpen = false) {
    const commentsSection = document.getElementById('artwork-comments-section');
    if (!commentsSection) return;
    
    try {
        // 로그인 확인
        const { data: { session } } = await window._supabase.auth.getSession();
        
        // 댓글 가져오기
        const { data: comments, error } = await window._supabase
            .from('artwork_comments')
            .select('*')
            .eq('artwork_id', artworkId)
            .order('created_at', { ascending: true });
        
        if (error) {
            console.error('댓글 로드 에러:', error);
            commentsSection.innerHTML = `
                <div class="artwork-comments-empty">댓글을 불러올 수 없습니다</div>
            `;
            return;
        }
        
        // 댓글 렌더링
        await renderArtworkComments(artworkId, comments || [], session);
        
    } catch (err) {
        console.error('댓글 로드 예외:', err);
        commentsSection.innerHTML = `
            <div class="artwork-comments-empty">오류가 발생했습니다</div>
        `;
    }
}

/**
 * 댓글 렌더링 (재귀적 구조)
 */
async function renderArtworkComments(artworkId, comments, session) {
    const commentsSection = document.getElementById('artwork-comments-section');
    if (!commentsSection) return;
    
    const isLoggedIn = session && session.user;
    const currentUserId = session?.user?.id;
    
    // 최상위 댓글만 필터링
    const rootComments = comments.filter(c => !c.parent_comment_id);
    
    let html = '<div class="artwork-comments-header">';
    html += `<h3 class="artwork-comments-title">댓글 ${comments.length}개</h3>`;
    html += '</div>';
    
    if (comments.length === 0) {
        html += `
            <div class="artwork-comments-empty">
                ${isLoggedIn ? '첫 댓글을 작성해보세요!' : '아직 댓글이 없습니다'}
            </div>
        `;
    } else {
        html += '<div class="artwork-comments-list">';
        
        // 사용자 프로필 이미지를 가져오는 함수
        async function getUserAvatar(userId) {
            try {
                const { data: profile } = await window._supabase
                    .from('profiles')
                    .select('avatar_url')
                    .eq('user_id', userId)
                    .single();
                
                if (profile?.avatar_url) {
                    return `<img src="${escapeHtml(profile.avatar_url)}" alt="프로필" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                }
            } catch (err) {
                console.log('프로필 이미지 로드 실패:', err);
            }
            
            return `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            `;
        }
        
        // 모든 댓글의 프로필 이미지를 미리 가져오기
        const avatarCache = new Map();
        await Promise.all(comments.map(async (comment) => {
            const avatar = await getUserAvatar(comment.user_id);
            avatarCache.set(comment.user_id, avatar);
        }));
        
        // 재귀 함수로 댓글과 대댓글 렌더링
        function renderCommentThread(comment, depth = 0, rootCommentId = null) {
            const isOwner = currentUserId === comment.user_id;
            // 최상위 댓글 ID 결정 (depth 0이면 자신이 root, 아니면 전달받은 rootId)
            const currentRootId = depth === 0 ? comment.id : rootCommentId;
            
            const replies = comments.filter(c => c.parent_comment_id === comment.id);
            const nickname = comment.author_nickname || comment.author_email?.split('@')[0] || '익명';
            const avatarHTML = avatarCache.get(comment.user_id) || `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            `;
            
            // mentioned_nickname이 있으면 표시 (답글인 경우)
            const mentionedNick = comment.mentioned_nickname;
            
            let commentHtml = `
                <div class="artwork-comment-item" data-depth="${depth}">
                    <div class="artwork-comment-avatar">
                        ${avatarHTML}
                    </div>
                    <div class="artwork-comment-content">
                        ${mentionedNick ? `
                            <div class="artwork-comment-reply-indicator">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9 14 4 9 9 4"></polyline>
                                    <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
                                </svg>
                                <span>@${escapeHtml(mentionedNick)}</span>
                            </div>
                        ` : ''}
                        <div class="artwork-comment-header">
                            <span class="artwork-comment-author">${escapeHtml(nickname)}</span>
                            <span class="artwork-comment-date">${formatDate(comment.created_at)}</span>
                        </div>
                        <div class="artwork-comment-text">${escapeHtml(comment.content)}</div>
                        <div class="artwork-comment-actions">
                            ${replies.length > 0 ? `
                                <button class="artwork-comment-action-btn toggle-replies" onclick="toggleArtworkReplies('${comment.id}')">
                                    <span class="replies-toggle-text">답글 ${replies.length}개 숨기기</span>
                                </button>
                            ` : ''}
                            ${isLoggedIn ? `
                                <button class="artwork-comment-action-btn reply" onclick="setArtworkReplyTarget('${comment.id}', '${escapeHtml(nickname)}', ${depth > 0 ? `'${currentRootId}'` : 'null'})">
                                    답글 달기
                                </button>
                            ` : ''}
                            ${isOwner ? `
                                <button class="artwork-comment-action-btn delete" onclick="deleteArtworkCommentFromModal('${artworkId}', '${comment.id}')">
                                    삭제
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            // 대댓글이 있으면 재귀적으로 렌더링
            if (replies.length > 0) {
                commentHtml += `<div class="artwork-comment-reply" id="artwork-replies-${comment.id}">`;
                replies.forEach(reply => {
                    commentHtml += renderCommentThread(reply, depth + 1, currentRootId);
                });
                commentHtml += '</div>';
            }
            
            return commentHtml;
        }
        
        // 최상위 댓글부터 렌더링
        rootComments.forEach(comment => {
            html += renderCommentThread(comment);
        });
        
        html += '</div>';
    }
    
    // 댓글 입력 폼 (로그인한 경우만)
    if (isLoggedIn) {
        html += `
            <div class="artwork-comment-form">
                <div class="artwork-comment-input-wrapper">
                    <div class="artwork-reply-tag" id="artwork-reply-tag-${artworkId}" style="display:none;">
                        <span class="reply-tag-text"></span>
                        <button class="reply-tag-close" onclick="clearArtworkReplyTarget()">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <textarea 
                        class="artwork-comment-input" 
                        id="artwork-comment-input-${artworkId}"
                        placeholder="댓글을 입력하세요..."
                        rows="1"
                    ></textarea>
                </div>
                <button 
                    class="artwork-comment-submit" 
                    onclick="submitArtworkComment('${artworkId}')"
                >
                    게시
                </button>
            </div>
        `;
    }
    
    commentsSection.innerHTML = html;
    
    // 텍스트 영역 자동 높이 조절
    if (isLoggedIn) {
        const textarea = document.getElementById(`artwork-comment-input-${artworkId}`);
        if (textarea) {
            textarea.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = Math.min(this.scrollHeight, 120) + 'px';
            });
        }
    }
}

/**
 * 댓글 작성
 */
export async function submitArtworkComment(artworkId) {
    const textarea = document.getElementById(`artwork-comment-input-${artworkId}`);
    if (!textarea) return;
    
    const content = textarea.value.trim();
    if (!content) {
        alert('댓글 내용을 입력하세요.');
        return;
    }
    
    try {
        // 로그인 확인
        const { data: { session } } = await window._supabase.auth.getSession();
        if (!session || !session.user) {
            alert('로그인이 필요합니다.');
            return;
        }
        
        // 프로필 정보 가져오기
        const { data: profile } = await window._supabase
            .from('profiles')
            .select('nickname')
            .eq('user_id', session.user.id)
            .single();
        
        // 댓글 추가
        const commentData = {
            artwork_id: artworkId,
            user_id: session.user.id,
            content: content,
            author_nickname: profile?.nickname || session.user.email?.split('@')[0] || '익명',
            author_email: session.user.email
        };
        
        // 답글 대상이 있으면 parent_comment_id 추가
        // rootId가 있으면 최상위 댓글을 parent로 설정 (동일 계층 유지)
        if (replyTarget) {
            commentData.parent_comment_id = replyTarget.rootId || replyTarget.id;
            // 답글 대상의 닉네임 저장 (멘션 표시용)
            commentData.mentioned_nickname = replyTarget.nickname;
        }
        
        const { error } = await window._supabase
            .from('artwork_comments')
            .insert(commentData);
        
        if (error) {
            console.error('댓글 작성 에러:', error);
            alert('댓글 작성에 실패했습니다: ' + error.message);
            return;
        }
        
        // 입력 필드 초기화
        textarea.value = '';
        textarea.style.height = 'auto';
        
        // 답글 대상 초기화
        clearArtworkReplyTarget();
        
        // 댓글 다시 로드
        await loadArtworkComments(artworkId);
        
        // 피드의 댓글 수도 업데이트
        if (window.updateFeedCommentCount) {
            await window.updateFeedCommentCount(artworkId);
        }
        
    } catch (err) {
        console.error('댓글 작성 예외:', err);
        alert('댓글 작성 중 오류가 발생했습니다.');
    }
}

/**
 * 답글 대상 설정
 */
export function setArtworkReplyTarget(commentId, nickname, rootId = null) {
    replyTarget = { 
        id: commentId, 
        nickname: nickname,
        rootId: rootId // 답글의 답글인 경우 최상위 댓글 ID
    };
    
    const currentId = getCurrentArtworkId();
    const replyTag = document.getElementById(`artwork-reply-tag-${currentId}`);
    const replyTagText = replyTag?.querySelector('.reply-tag-text');
    const textarea = document.getElementById(`artwork-comment-input-${currentId}`);
    
    if (replyTag && replyTagText) {
        replyTagText.textContent = `@${nickname}`;
        replyTag.style.display = 'flex';
    }
    
    if (textarea) {
        textarea.focus();
        textarea.placeholder = `@${nickname}님에게 답글 작성...`;
    }
}

/**
 * 답글 대상 초기화
 */
export function clearArtworkReplyTarget() {
    replyTarget = null;
    
    const currentId = getCurrentArtworkId();
    const replyTag = document.getElementById(`artwork-reply-tag-${currentId}`);
    const textarea = document.getElementById(`artwork-comment-input-${currentId}`);
    
    if (replyTag) {
        replyTag.style.display = 'none';
    }
    
    if (textarea) {
        textarea.placeholder = '댓글을 입력하세요...';
    }
}

/**
 * 답글 보이기/숨기기
 */
export function toggleArtworkReplies(commentId) {
    const repliesContainer = document.getElementById(`artwork-replies-${commentId}`);
    const toggleBtn = event.target.closest('.toggle-replies');
    const toggleText = toggleBtn?.querySelector('.replies-toggle-text');
    
    if (!repliesContainer || !toggleText) return;
    
    if (repliesContainer.style.display === 'none') {
        repliesContainer.style.display = 'block';
        const replyCount = repliesContainer.querySelectorAll('.artwork-comment-item[data-depth]').length;
        toggleText.textContent = `답글 ${replyCount}개 숨기기`;
    } else {
        repliesContainer.style.display = 'none';
        const replyCount = repliesContainer.querySelectorAll('.artwork-comment-item[data-depth]').length;
        toggleText.textContent = `답글 ${replyCount}개 보기`;
    }
}

/**
 * 댓글 삭제
 */
export async function deleteArtworkCommentFromModal(artworkId, commentId) {
    if (!confirm('댓글을 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        const { error } = await window._supabase
            .from('artwork_comments')
            .delete()
            .eq('id', commentId);
        
        if (error) {
            console.error('댓글 삭제 에러:', error);
            alert('댓글 삭제에 실패했습니다: ' + error.message);
            return;
        }
        
        // 댓글 다시 로드
        await loadArtworkComments(artworkId);
        
        // 피드의 댓글 수도 업데이트
        if (window.updateFeedCommentCount) {
            await window.updateFeedCommentCount(artworkId);
        }
        
    } catch (err) {
        console.error('댓글 삭제 예외:', err);
        alert('댓글 삭제 중 오류가 발생했습니다.');
    }
}
