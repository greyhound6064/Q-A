/**
 * @file feedComments.js
 * @description 피드 댓글 시스템 (재귀적 답글 지원)
 */

import { escapeHtml, formatDate } from '../utils.js';
import { showLoginRequiredModal } from '../utils/errorHandler.js';

// ========== 전역 상태 ==========
let feedDetailReplyTarget = null; // 답글 대상 {id, nickname, rootId}

/**
 * 피드 상세보기 댓글 로드 (재귀적 답글 지원)
 */
export async function loadFeedDetailComments(postId) {
    const commentsList = document.getElementById('feed-detail-comments-list');
    if (!commentsList) return;
    
    try {
        // postId를 숫자로 변환 (문자열로 전달될 수 있음)
        const numericPostId = typeof postId === 'string' ? parseInt(postId, 10) : postId;
        
        // 댓글 조회 (평면 배열로 가져오기)
        const { data: comments, error } = await window._supabase
            .from('artwork_comments')
            .select('*')
            .eq('artwork_id', numericPostId)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        const commentCount = document.getElementById('feed-detail-comment-count');
        if (commentCount) {
            commentCount.textContent = (comments || []).length;
        }
        
        if (!comments || comments.length === 0) {
            commentsList.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-light);">첫 번째 댓글을 작성해보세요!</div>';
            return;
        }
        
        // 현재 사용자 확인
        const { data: { session } } = await window._supabase.auth.getSession();
        const currentUserId = session?.user?.id || null;
        
        // 최상위 댓글만 필터링 (parent_comment_id가 null이거나 undefined인 경우)
        const rootComments = comments.filter(c => c.parent_comment_id == null);
        
        // 모든 댓글의 프로필 이미지를 미리 가져오기
        const avatarCache = new Map();
        await Promise.all(comments.map(async (comment) => {
            try {
                const { data: profile } = await window._supabase
                    .from('profiles')
                    .select('avatar_url')
                    .eq('user_id', comment.user_id)
                    .single();
                
                if (profile?.avatar_url) {
                    avatarCache.set(comment.user_id, `<img src="${escapeHtml(profile.avatar_url)}" alt="프로필">`);
                } else {
                    avatarCache.set(comment.user_id, `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    `);
                }
            } catch (err) {
                avatarCache.set(comment.user_id, `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                `);
            }
        }));
        
        // 재귀 함수로 댓글과 대댓글 렌더링
        function renderCommentThread(comment, depth = 0, rootCommentId = null) {
            const isOwner = currentUserId === comment.user_id;
            // 최상위 댓글 ID 결정 (depth 0이면 자신이 root, 아니면 전달받은 rootId)
            const currentRootId = depth === 0 ? comment.id : rootCommentId;
            
            // parent_comment_id와 comment.id를 비교할 때 타입 일치 확인
            const replies = comments.filter(c => {
                const parentId = c.parent_comment_id;
                const commentId = comment.id;
                // 타입 변환하여 비교 (문자열/숫자 모두 처리)
                return parentId != null && String(parentId) === String(commentId);
            });
            const nickname = comment.author_nickname || comment.author_email?.split('@')[0] || '익명';
            const avatarHTML = avatarCache.get(comment.user_id) || `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            `;
            
            // mentioned_nickname이 있으면 표시 (답글인 경우)
            const mentionedNick = comment.mentioned_nickname;
            
            let commentHtml = `
                <div class="feed-detail-comment-item" data-depth="${depth}">
                    <div class="feed-detail-comment-avatar" onclick="selectUserById('${comment.user_id}')">
                        ${avatarHTML}
                    </div>
                    <div class="feed-detail-comment-content">
                        ${mentionedNick ? `
                            <div class="feed-detail-reply-indicator">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9 14 4 9 9 4"></polyline>
                                    <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
                                </svg>
                                <span>@${escapeHtml(mentionedNick)}</span>
                            </div>
                        ` : ''}
                        <div class="feed-detail-comment-header">
                            <span class="feed-detail-comment-author" onclick="selectUserById('${comment.user_id}')">${escapeHtml(nickname)}</span>
                            <span class="feed-detail-comment-date">${formatDate(comment.created_at)}</span>
                        </div>
                        <div class="feed-detail-comment-text">${escapeHtml(comment.content)}</div>
                        <div class="feed-detail-comment-actions-row">
                            ${replies.length > 0 ? `
                                <button class="feed-detail-comment-action toggle-replies" onclick="toggleFeedDetailReplies('${comment.id}')">
                                    <span class="replies-toggle-text">답글 ${replies.length}개 숨기기</span>
                                </button>
                            ` : ''}
                            ${currentUserId ? `
                                <button class="feed-detail-comment-action" onclick="setFeedDetailReplyTarget('${comment.id}', '${escapeHtml(nickname)}', ${depth > 0 ? `'${currentRootId}'` : 'null'})">
                                    답글 달기
                                </button>
                            ` : ''}
                            ${isOwner ? `
                                <button class="feed-detail-comment-action" onclick="deleteFeedDetailComment('${postId}', '${comment.id}')">
                                    삭제
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            // 대댓글이 있으면 재귀적으로 렌더링
            if (replies.length > 0) {
                commentHtml += `<div class="feed-detail-replies" id="feed-detail-replies-${comment.id}">`;
                replies.forEach(reply => {
                    commentHtml += renderCommentThread(reply, depth + 1, currentRootId);
                });
                commentHtml += '</div>';
            }
            
            return commentHtml;
        }
        
        // 최상위 댓글부터 렌더링
        let commentsHTML = '';
        rootComments.forEach(comment => {
            commentsHTML += renderCommentThread(comment);
        });
        
        commentsList.innerHTML = commentsHTML;
        
        // 텍스트 영역 자동 높이 조절 이벤트 추가
        const textarea = document.getElementById('feed-detail-comment-textarea');
        if (textarea && !textarea.dataset.listenerAdded) {
            textarea.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = Math.min(this.scrollHeight, 120) + 'px';
            });
            textarea.dataset.listenerAdded = 'true';
        }
    } catch (error) {
        console.error('댓글 로드 실패:', error);
        commentsList.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-light);">댓글을 불러올 수 없습니다.</div>';
    }
}

/**
 * 피드 상세보기 댓글 입력 포커스
 */
export function focusFeedDetailComment() {
    const textarea = document.getElementById('feed-detail-comment-textarea');
    if (textarea) {
        textarea.focus();
    }
}

/**
 * 피드 상세보기 댓글 작성 (답글 지원)
 */
export async function submitFeedDetailComment(postId) {
    const textarea = document.getElementById('feed-detail-comment-textarea');
    if (!textarea) return;
    
    const content = textarea.value.trim();
    if (!content) return;
    
    try {
        const { data: { session } } = await window._supabase.auth.getSession();
        if (!session || !session.user) {
            showLoginRequiredModal();
            return;
        }
        
        // postId를 숫자로 변환 (문자열로 전달될 수 있음)
        const numericPostId = typeof postId === 'string' ? parseInt(postId, 10) : postId;
        
        // 프로필 정보 가져오기
        const { data: profile } = await window._supabase
            .from('profiles')
            .select('nickname')
            .eq('user_id', session.user.id)
            .single();
        
        // 댓글 데이터
        const commentData = {
            artwork_id: numericPostId,
            user_id: session.user.id,
            content: content,
            author_nickname: profile?.nickname || session.user.email?.split('@')[0] || '익명',
            author_email: session.user.email
        };
        
        // 답글 대상이 있으면 parent_comment_id 추가 (숫자로 변환)
        // rootId가 있으면 최상위 댓글을 parent로 설정 (동일 계층 유지)
        if (feedDetailReplyTarget) {
            const parentId = feedDetailReplyTarget.rootId 
                ? (typeof feedDetailReplyTarget.rootId === 'string' 
                    ? parseInt(feedDetailReplyTarget.rootId, 10) 
                    : feedDetailReplyTarget.rootId)
                : (typeof feedDetailReplyTarget.id === 'string' 
                    ? parseInt(feedDetailReplyTarget.id, 10) 
                    : feedDetailReplyTarget.id);
            commentData.parent_comment_id = parentId;
            // 답글 대상의 닉네임 저장 (멘션 표시용)
            commentData.mentioned_nickname = feedDetailReplyTarget.nickname;
        }
        
        const { error } = await window._supabase
            .from('artwork_comments')
            .insert(commentData);
        
        if (error) {
            console.error('댓글 작성 에러:', error);
            alert('댓글 작성에 실패했습니다: ' + error.message);
            return;
        }
        
        // 입력창 초기화
        textarea.value = '';
        textarea.style.height = 'auto';
        
        // 답글 대상 초기화
        clearFeedDetailReplyTarget();
        
        // 댓글 목록 새로고침
        await loadFeedDetailComments(numericPostId);
        
        // 피드 목록의 댓글 수 업데이트
        if (window.updateFeedCommentCount) {
            await window.updateFeedCommentCount(numericPostId);
        }
    } catch (error) {
        console.error('댓글 작성 실패:', error);
        alert('댓글 작성 중 오류가 발생했습니다.');
    }
}

/**
 * 피드 상세보기 답글 대상 설정
 */
export function setFeedDetailReplyTarget(commentId, nickname, rootId = null) {
    // commentId를 숫자로 변환 (문자열로 전달될 수 있음)
    const numericCommentId = typeof commentId === 'string' ? parseInt(commentId, 10) : commentId;
    const numericRootId = rootId ? (typeof rootId === 'string' ? parseInt(rootId, 10) : rootId) : null;
    
    feedDetailReplyTarget = { 
        id: numericCommentId, 
        nickname: nickname,
        rootId: numericRootId // 답글의 답글인 경우 최상위 댓글 ID
    };
    
    const replyTag = document.getElementById('feed-detail-reply-tag');
    const replyTagText = replyTag?.querySelector('.reply-tag-text');
    const textarea = document.getElementById('feed-detail-comment-textarea');
    
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
 * 피드 상세보기 답글 대상 초기화
 */
export function clearFeedDetailReplyTarget() {
    feedDetailReplyTarget = null;
    
    const replyTag = document.getElementById('feed-detail-reply-tag');
    const textarea = document.getElementById('feed-detail-comment-textarea');
    
    if (replyTag) {
        replyTag.style.display = 'none';
    }
    
    if (textarea) {
        textarea.placeholder = '댓글을 입력하세요...';
    }
}

/**
 * 피드 상세보기 답글 토글
 */
export function toggleFeedDetailReplies(commentId) {
    const repliesContainer = document.getElementById(`feed-detail-replies-${commentId}`);
    const toggleBtn = event.target.closest('.toggle-replies');
    const toggleText = toggleBtn?.querySelector('.replies-toggle-text');
    
    if (!repliesContainer || !toggleText) return;
    
    if (repliesContainer.style.display === 'none') {
        repliesContainer.style.display = 'flex';
        const replyCount = repliesContainer.querySelectorAll('.feed-detail-comment-item[data-depth]').length;
        toggleText.textContent = `답글 ${replyCount}개 숨기기`;
    } else {
        repliesContainer.style.display = 'none';
        const replyCount = repliesContainer.querySelectorAll('.feed-detail-comment-item[data-depth]').length;
        toggleText.textContent = `답글 ${replyCount}개 보기`;
    }
}

/**
 * 피드 상세보기 댓글 삭제
 */
export async function deleteFeedDetailComment(postId, commentId) {
    if (!confirm('댓글을 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        // ID를 숫자로 변환 (문자열로 전달될 수 있음)
        const numericPostId = typeof postId === 'string' ? parseInt(postId, 10) : postId;
        const numericCommentId = typeof commentId === 'string' ? parseInt(commentId, 10) : commentId;
        
        const { error } = await window._supabase
            .from('artwork_comments')
            .delete()
            .eq('id', numericCommentId);
        
        if (error) {
            console.error('댓글 삭제 에러:', error);
            alert('댓글 삭제에 실패했습니다: ' + error.message);
            return;
        }
        
        // 댓글 다시 로드
        await loadFeedDetailComments(numericPostId);
        
        // 피드 목록의 댓글 수도 업데이트
        if (window.updateFeedCommentCount) {
            await window.updateFeedCommentCount(numericPostId);
        }
        
    } catch (err) {
        console.error('댓글 삭제 예외:', err);
        alert('댓글 삭제 중 오류가 발생했습니다.');
    }
}
