/**
 * @file typeUtils.js
 * @description 타입 변환 유틸리티
 * 
 * ID 타입 변환 버그를 방지하기 위한 안전한 변환 함수
 * 
 * 배경: 
 * - HTML에서 전달되는 ID는 문자열
 * - Supabase는 integer를 요구
 * - 타입 불일치로 foreign key constraint 에러 발생
 */

/**
 * 안전하게 ID를 정수로 변환
 * @param {string|number} id - 변환할 ID
 * @param {string} [context='ID'] - 에러 메시지용 컨텍스트
 * @returns {number} - 정수 ID
 * @throws {Error} - 유효하지 않은 ID인 경우
 */
export function toSafeId(id, context = 'ID') {
    // null, undefined 체크
    if (id == null) {
        throw new Error(`${context}가 null 또는 undefined입니다.`);
    }
    
    // 이미 숫자인 경우
    if (typeof id === 'number') {
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error(`${context}가 유효하지 않은 숫자입니다: ${id}`);
        }
        return id;
    }
    
    // 문자열인 경우 변환
    if (typeof id === 'string') {
        const numericId = parseInt(id, 10);
        
        if (isNaN(numericId) || numericId <= 0) {
            throw new Error(`${context}를 숫자로 변환할 수 없습니다: "${id}"`);
        }
        
        return numericId;
    }
    
    throw new Error(`${context}의 타입이 올바르지 않습니다: ${typeof id}`);
}

/**
 * 안전하게 ID 배열을 정수 배열로 변환
 * @param {Array<string|number>} ids - 변환할 ID 배열
 * @param {string} [context='ID'] - 에러 메시지용 컨텍스트
 * @returns {number[]} - 정수 ID 배열
 */
export function toSafeIds(ids, context = 'ID') {
    if (!Array.isArray(ids)) {
        throw new Error(`${context} 배열이 아닙니다: ${typeof ids}`);
    }
    
    return ids.map((id, index) => toSafeId(id, `${context}[${index}]`));
}

/**
 * ID를 문자열로 안전하게 변환 (비교용)
 * @param {string|number} id - 변환할 ID
 * @returns {string} - 문자열 ID
 */
export function toStringId(id) {
    if (id == null) {
        return '';
    }
    return String(id);
}

/**
 * 두 ID가 같은지 타입 안전하게 비교
 * @param {string|number} id1 - 첫 번째 ID
 * @param {string|number} id2 - 두 번째 ID
 * @returns {boolean} - 같으면 true
 */
export function isSameId(id1, id2) {
    if (id1 == null || id2 == null) {
        return false;
    }
    return String(id1) === String(id2);
}

/**
 * ID가 유효한지 검증
 * @param {any} id - 검증할 ID
 * @returns {boolean} - 유효하면 true
 */
export function isValidId(id) {
    try {
        toSafeId(id);
        return true;
    } catch {
        return false;
    }
}

/**
 * 사용 예시:
 * 
 * // HTML에서 전달된 ID 처리
 * function deleteComment(postId, commentId) {
 *     try {
 *         const numericPostId = toSafeId(postId, 'postId');
 *         const numericCommentId = toSafeId(commentId, 'commentId');
 *         
 *         await supabase
 *             .from('comments')
 *             .delete()
 *             .eq('post_id', numericPostId)
 *             .eq('id', numericCommentId);
 *     } catch (error) {
 *         console.error('ID 변환 실패:', error.message);
 *     }
 * }
 * 
 * // ID 비교
 * if (isSameId(currentUserId, post.user_id)) {
 *     // 본인의 게시물
 * }
 */
