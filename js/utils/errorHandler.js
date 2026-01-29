/**
 * @file errorHandler.js
 * @description 에러 처리 및 사용자 알림 유틸리티
 */

/**
 * 에러 메시지 표시
 * @param {string} message - 사용자에게 표시할 메시지
 * @param {Error} error - 에러 객체 (선택)
 */
export function showError(message, error = null) {
    console.error(message, error);
    alert(message);
}

/**
 * 성공 메시지 표시
 * @param {string} message - 성공 메시지
 */
export function showSuccess(message) {
    console.log('✓', message);
    // TODO: 토스트 알림으로 개선
    alert(message);
}

/**
 * 확인 대화상자
 * @param {string} message - 확인 메시지
 * @returns {boolean} 사용자 선택
 */
export function confirm(message) {
    return window.confirm(message);
}

/**
 * 로그인 필요 에러 처리
 * @returns {boolean} false
 */
export function handleAuthRequired() {
    showError('로그인이 필요합니다.');
    return false;
}

/**
 * 권한 없음 에러 처리
 * @returns {boolean} false
 */
export function handleUnauthorized() {
    showError('권한이 없습니다.');
    return false;
}

/**
 * Supabase 에러 처리
 * @param {Error} error - Supabase 에러
 * @param {string} context - 에러 발생 컨텍스트
 */
export function handleSupabaseError(error, context = '') {
    console.error(`Supabase 에러 (${context}):`, error);
    
    const message = error.message || '알 수 없는 오류가 발생했습니다.';
    showError(`${context ? context + ': ' : ''}${message}`);
}

/**
 * 비동기 함수 에러 래퍼
 * @param {Function} fn - 비동기 함수
 * @param {string} errorMessage - 에러 시 표시할 메시지
 * @returns {Function} 래핑된 함수
 */
export function withErrorHandler(fn, errorMessage = '오류가 발생했습니다.') {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            showError(errorMessage, error);
            throw error;
        }
    };
}

/**
 * 폼 유효성 검사 에러
 * @param {string} fieldName - 필드 이름
 * @param {string} requirement - 요구사항
 */
export function showValidationError(fieldName, requirement) {
    showError(`${fieldName}: ${requirement}`);
}

/**
 * 네트워크 에러 처리
 */
export function handleNetworkError() {
    showError('네트워크 연결을 확인해주세요.');
}
