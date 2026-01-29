/**
 * 닉네임 유효성 검사 및 중복 체크
 * - 익명 기반 커뮤니티를 위한 고유 닉네임 시스템
 */

// Supabase 클라이언트
const supabase = window._supabase;

// 닉네임 규칙
const NICKNAME_RULES = {
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9가-힣_]+$/,
    reserved: ['admin', 'system', 'anonymous', '익명', 'moderator', 'mod', 'root', 'user']
};

/**
 * 닉네임 유효성 검사
 */
export function validateNicknameFormat(nickname) {
    // 1. 빈 값 체크
    if (!nickname || nickname.trim() === '') {
        return { valid: false, message: '닉네임을 입력해주세요.' };
    }
    
    const trimmed = nickname.trim();
    
    // 2. 길이 체크
    if (trimmed.length < NICKNAME_RULES.minLength) {
        return { valid: false, message: `닉네임은 최소 ${NICKNAME_RULES.minLength}자 이상이어야 합니다.` };
    }
    
    if (trimmed.length > NICKNAME_RULES.maxLength) {
        return { valid: false, message: `닉네임은 최대 ${NICKNAME_RULES.maxLength}자까지 가능합니다.` };
    }
    
    // 3. 패턴 체크
    if (!NICKNAME_RULES.pattern.test(trimmed)) {
        return { valid: false, message: '닉네임은 영문, 숫자, 한글, 언더스코어(_)만 사용 가능합니다.' };
    }
    
    // 4. 예약어 체크
    if (NICKNAME_RULES.reserved.includes(trimmed.toLowerCase())) {
        return { valid: false, message: '사용할 수 없는 닉네임입니다.' };
    }
    
    // 5. 연속된 언더스코어 체크
    if (/__+/.test(trimmed)) {
        return { valid: false, message: '언더스코어(_)는 연속해서 사용할 수 없습니다.' };
    }
    
    // 6. 시작/끝 언더스코어 체크
    if (trimmed.startsWith('_') || trimmed.endsWith('_')) {
        return { valid: false, message: '닉네임은 언더스코어(_)로 시작하거나 끝날 수 없습니다.' };
    }
    
    return { valid: true, message: '' };
}

/**
 * 닉네임 중복 체크
 */
export async function checkNicknameAvailability(nickname, currentUserId = null) {
    try {
        const normalized = nickname.toLowerCase().trim();
        
        // 현재 사용자의 닉네임은 제외하고 중복 체크
        let query = supabase
            .from('profiles')
            .select('user_id, nickname')
            .ilike('nickname', normalized);
        
        if (currentUserId) {
            query = query.neq('user_id', currentUserId);
        }
        
        const { data, error } = await query.single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw error;
        }
        
        if (data) {
            return { available: false, message: '이미 사용 중인 닉네임입니다.' };
        }
        
        return { available: true, message: '사용 가능한 닉네임입니다.' };
        
    } catch (error) {
        console.error('닉네임 중복 체크 오류:', error);
        return { available: false, message: '중복 체크 중 오류가 발생했습니다.' };
    }
}

/**
 * 닉네임 전체 검증 (형식 + 중복)
 */
export async function validateNickname(nickname, currentUserId = null) {
    // 1. 형식 검증
    const formatCheck = validateNicknameFormat(nickname);
    if (!formatCheck.valid) {
        return { valid: false, message: formatCheck.message };
    }
    
    // 2. 중복 체크
    const availabilityCheck = await checkNicknameAvailability(nickname, currentUserId);
    if (!availabilityCheck.available) {
        return { valid: false, message: availabilityCheck.message };
    }
    
    return { valid: true, message: '사용 가능한 닉네임입니다.' };
}

/**
 * 추천 닉네임 생성 (중복 시)
 */
export function generateSuggestedNicknames(baseNickname) {
    const suggestions = [];
    const base = baseNickname.toLowerCase().trim();
    
    // 1. 숫자 추가
    for (let i = 1; i <= 3; i++) {
        suggestions.push(`${base}${Math.floor(Math.random() * 1000)}`);
    }
    
    // 2. 언더스코어 + 숫자
    suggestions.push(`${base}_${Math.floor(Math.random() * 100)}`);
    
    // 3. 랜덤 접미사
    const suffixes = ['_pro', '_user', '_master', '_king', '_ace'];
    suggestions.push(`${base}${suffixes[Math.floor(Math.random() * suffixes.length)]}`);
    
    return suggestions.slice(0, 3);
}

/**
 * 실시간 닉네임 검증 UI 업데이트
 */
export function updateNicknameValidationUI(inputElement, feedbackElement, isValid, message) {
    if (!inputElement || !feedbackElement) return;
    
    feedbackElement.textContent = message;
    
    if (isValid) {
        inputElement.classList.remove('invalid');
        inputElement.classList.add('valid');
        feedbackElement.classList.remove('error');
        feedbackElement.classList.add('success');
    } else {
        inputElement.classList.remove('valid');
        inputElement.classList.add('invalid');
        feedbackElement.classList.remove('success');
        feedbackElement.classList.add('error');
    }
}

/**
 * 디바운스 유틸리티
 */
export function debounce(func, wait) {
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
