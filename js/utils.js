/**
 * @file utils.js
 * @description 유틸리티 함수 (확장판)
 */

// ========== HTML 처리 ==========

/**
 * HTML 이스케이프 함수
 * @param {string} text - 이스케이프할 텍스트
 * @returns {string} 이스케이프된 텍스트
 */
export function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * 텍스트 내 URL을 링크로 변환
 * @param {string} text - 원본 텍스트
 * @returns {string} 링크가 포함된 HTML
 */
export function linkifyText(text) {
    if (!text) return '';
    
    // URL 정규식 (http://, https://, www. 포함)
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
    
    // 먼저 HTML 이스케이프
    const escaped = escapeHtml(text);
    
    // URL을 링크로 변환
    return escaped.replace(urlRegex, (url) => {
        // www로 시작하는 경우 https:// 추가
        const href = url.startsWith('www.') ? `https://${url}` : url;
        return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="linkified-url" onclick="event.stopPropagation()">${escapeHtml(url)}</a>`;
    });
}

// ========== 날짜/시간 처리 ==========

/**
 * 날짜 포맷팅 함수 (상대 시간)
 * @param {string} dateString - ISO 날짜 문자열
 * @returns {string} 포맷된 날짜
 */
export function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * 절대 날짜 포맷팅
 * @param {string} dateString - ISO 날짜 문자열
 * @returns {string} 포맷된 날짜 (YYYY.MM.DD)
 */
export function formatAbsoluteDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).replace(/\. /g, '.').replace(/\.$/, '');
}

// ========== 문자열 처리 ==========

/**
 * 텍스트 자르기 (말줄임표 추가)
 * @param {string} text - 원본 텍스트
 * @param {number} maxLength - 최대 길이
 * @returns {string} 잘린 텍스트
 */
export function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * 이메일에서 사용자명 추출
 * @param {string} email - 이메일 주소
 * @returns {string} 사용자명 (@ 앞부분)
 */
export function extractUsername(email) {
    if (!email) return '익명';
    return email.split('@')[0];
}

/**
 * 작성자 이름 가져오기 (닉네임 우선, 없으면 이메일 아이디)
 * @param {Object} author - { nickname, email }
 * @returns {string} 표시할 이름
 */
export function getDisplayName(author) {
    if (!author) return '익명';
    if (author.nickname) return author.nickname;
    if (author.email) return extractUsername(author.email);
    return '익명';
}

// ========== 배열/객체 처리 ==========

/**
 * 배열을 특정 크기의 청크로 분할
 * @param {Array} array - 원본 배열
 * @param {number} size - 청크 크기
 * @returns {Array<Array>} 청크 배열
 */
export function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

/**
 * 배열에서 중복 제거
 * @param {Array} array - 원본 배열
 * @returns {Array} 중복 제거된 배열
 */
export function uniqueArray(array) {
    return [...new Set(array)];
}

// ========== 숫자 처리 ==========

/**
 * 숫자를 K, M 단위로 포맷팅
 * @param {number} num - 숫자
 * @returns {string} 포맷된 문자열
 */
export function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// ========== 파일 처리 ==========

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환
 * @param {number} bytes - 바이트 크기
 * @returns {string} 포맷된 크기
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 이미지 파일 검증
 * @param {File} file - 파일 객체
 * @param {number} maxSizeMB - 최대 크기 (MB)
 * @returns {Object} { valid, error }
 */
export function validateImageFile(file, maxSizeMB = 10) {
    if (!file) {
        return { valid: false, error: '파일이 선택되지 않았습니다.' };
    }
    
    if (!file.type.startsWith('image/')) {
        return { valid: false, error: '이미지 파일만 업로드할 수 있습니다.' };
    }
    
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
        return { valid: false, error: `파일 크기는 ${maxSizeMB}MB 이하여야 합니다.` };
    }
    
    return { valid: true };
}

// ========== 디바운스/쓰로틀 ==========

/**
 * 디바운스 함수
 * @param {Function} func - 실행할 함수
 * @param {number} wait - 대기 시간 (ms)
 * @returns {Function} 디바운스된 함수
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 쓰로틀 함수
 * @param {Function} func - 실행할 함수
 * @param {number} limit - 제한 시간 (ms)
 * @returns {Function} 쓰로틀된 함수
 */
export function throttle(func, limit = 300) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ========== 로컬 스토리지 ==========

/**
 * 로컬 스토리지에 JSON 저장
 * @param {string} key - 키
 * @param {*} value - 값
 */
export function setLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
        console.error('로컬 스토리지 저장 에러:', err);
    }
}

/**
 * 로컬 스토리지에서 JSON 가져오기
 * @param {string} key - 키
 * @param {*} defaultValue - 기본값
 * @returns {*} 저장된 값 또는 기본값
 */
export function getLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (err) {
        console.error('로컬 스토리지 읽기 에러:', err);
        return defaultValue;
    }
}

// ========== 타입 안전성 ==========
// typeUtils.js의 함수들을 재export
export { toSafeId, toSafeIds, toStringId, isSameId, isValidId } from './utils/typeUtils.js';
