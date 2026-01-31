/**
 * @file commentService.js
 * @description 댓글 관련 비즈니스 로직 통합 서비스
 */

// ========== 댓글 캐시 ==========
const commentsCache = new Map();

/**
 * 댓글 캐시 초기화
 */
export function clearCommentsCache(artworkId = null) {
    if (artworkId) {
        commentsCache.delete(artworkId);
    } else {
        commentsCache.clear();
    }
}

/**
 * 작품의 댓글 수 조회
 * @param {string} artworkId - 작품 ID
 * @returns {Promise<number>} 댓글 수
 */
export async function getCommentCount(artworkId) {
    try {
        const { count, error } = await window._supabase
            .from('artwork_comments')
            .select('*', { count: 'exact', head: true })
            .eq('artwork_id', artworkId);
        
        if (error) throw error;
        return count || 0;
    } catch (err) {
        console.error('댓글 수 조회 에러:', err);
        return 0;
    }
}

/**
 * 작품의 모든 댓글 조회 (계층 구조)
 * @param {string} artworkId - 작품 ID
 * @param {boolean} useCache - 캐시 사용 여부
 * @returns {Promise<Array>} 댓글 배열 (계층 구조)
 */
export async function getComments(artworkId, useCache = true) {
    // 캐시 확인
    if (useCache && commentsCache.has(artworkId)) {
        return commentsCache.get(artworkId);
    }
    
    try {
        const { data: comments, error } = await window._supabase
            .from('artwork_comments')
            .select('*')
            .eq('artwork_id', artworkId)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        // 계층 구조로 변환
        const hierarchicalComments = buildCommentHierarchy(comments || []);
        
        // 캐시 저장
        commentsCache.set(artworkId, hierarchicalComments);
        
        return hierarchicalComments;
    } catch (err) {
        console.error('댓글 조회 에러:', err);
        return [];
    }
}

/**
 * 댓글 계층 구조 생성
 * @param {Array} comments - 평면 댓글 배열
 * @returns {Array} 계층 구조 댓글 배열
 */
function buildCommentHierarchy(comments) {
    const commentMap = new Map();
    const rootComments = [];
    
    // 1단계: 모든 댓글을 Map에 저장하고 replies 배열 초기화
    comments.forEach(comment => {
        commentMap.set(comment.id, { ...comment, replies: [] });
    });
    
    // 2단계: 부모-자식 관계 설정
    comments.forEach(comment => {
        const commentNode = commentMap.get(comment.id);
        if (comment.parent_comment_id && commentMap.has(comment.parent_comment_id)) {
            // 대댓글인 경우 부모의 replies에 추가
            const parentComment = commentMap.get(comment.parent_comment_id);
            parentComment.replies.push(commentNode);
        } else {
            // 최상위 댓글인 경우
            rootComments.push(commentNode);
        }
    });
    
    return rootComments;
}

/**
 * 댓글 작성
 * @param {string} artworkId - 작품 ID
 * @param {string} content - 댓글 내용
 * @param {string|null} parentCommentId - 부모 댓글 ID (대댓글인 경우)
 * @returns {Promise<Object>} 생성된 댓글 객체
 */
export async function createComment(artworkId, content, parentCommentId = null) {
    try {
        // 로그인 확인
        const { data: { session } } = await window._supabase.auth.getSession();
        if (!session || !session.user) {
            throw new Error('로그인이 필요합니다.');
        }
        
        // 프로필 정보 가져오기
        const { data: profile } = await window._supabase
            .from('profiles')
            .select('nickname')
            .eq('user_id', session.user.id)
            .single();
        
        // 댓글 작성
        const { data: comment, error } = await window._supabase
            .from('artwork_comments')
            .insert({
                artwork_id: artworkId,
                user_id: session.user.id,
                content: content.trim(),
                author_nickname: profile?.nickname || session.user.email?.split('@')[0] || '익명',
                author_email: session.user.email,
                parent_comment_id: parentCommentId
            })
            .select()
            .single();
        
        if (error) throw error;
        
        // 캐시 무효화
        clearCommentsCache(artworkId);
        
        return comment;
    } catch (err) {
        console.error('댓글 작성 에러:', err);
        throw err;
    }
}

/**
 * 댓글 삭제
 * @param {string} commentId - 댓글 ID
 * @param {string} artworkId - 작품 ID (캐시 무효화용)
 * @returns {Promise<boolean>} 성공 여부
 */
export async function deleteComment(commentId, artworkId) {
    try {
        // 로그인 확인
        const { data: { session } } = await window._supabase.auth.getSession();
        if (!session || !session.user) {
            throw new Error('로그인이 필요합니다.');
        }
        
        // 댓글 소유자 확인
        const { data: comment } = await window._supabase
            .from('artwork_comments')
            .select('user_id')
            .eq('id', commentId)
            .single();
        
        if (!comment || comment.user_id !== session.user.id) {
            throw new Error('삭제 권한이 없습니다.');
        }
        
        // 댓글 삭제 (CASCADE로 대댓글도 자동 삭제)
        const { error } = await window._supabase
            .from('artwork_comments')
            .delete()
            .eq('id', commentId);
        
        if (error) throw error;
        
        // 캐시 무효화
        clearCommentsCache(artworkId);
        
        return true;
    } catch (err) {
        console.error('댓글 삭제 에러:', err);
        throw err;
    }
}

/**
 * 여러 작품의 댓글 수를 한 번에 조회 (최적화된 단일 쿼리)
 * @param {Array<string>} artworkIds - 작품 ID 배열
 * @returns {Promise<Map>} artworkId -> 댓글 수 맵
 */
export async function getBatchCommentCounts(artworkIds) {
    const counts = new Map();
    
    if (!artworkIds || artworkIds.length === 0) {
        return counts;
    }
    
    try {
        // 모든 작품의 댓글을 한 번에 조회
        const { data: allComments, error } = await window._supabase
            .from('artwork_comments')
            .select('artwork_id')
            .in('artwork_id', artworkIds);
        
        if (error) throw error;
        
        // 작품별로 댓글 수 집계
        artworkIds.forEach(id => {
            counts.set(id, 0);
        });
        
        allComments?.forEach(comment => {
            const currentCount = counts.get(comment.artwork_id) || 0;
            counts.set(comment.artwork_id, currentCount + 1);
        });
        
        return counts;
    } catch (err) {
        console.error('배치 댓글 수 조회 에러:', err);
        // 에러 발생 시 기본값 반환
        artworkIds.forEach(id => {
            counts.set(id, 0);
        });
        return counts;
    }
}
