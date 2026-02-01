/**
 * 웰컴 모달 관리
 */

const WELCOME_STORAGE_KEY = 'welcome_modal_shown';

/**
 * 웰컴 모달 표시 여부 확인 및 표시
 */
export function checkAndShowWelcomeModal() {
    // localStorage에서 확인
    const hasShown = localStorage.getItem(WELCOME_STORAGE_KEY);
    
    // 이미 본 적이 있으면 표시하지 않음
    if (hasShown === 'true') {
        return;
    }

    // 웰컴 모달 표시
    showWelcomeModal();
}

/**
 * 웰컴 모달 표시
 */
export function showWelcomeModal() {
    const modal = document.getElementById('welcome-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');
    }
}

/**
 * 웰컴 모달 닫기
 */
export function closeWelcomeModal() {
    const modal = document.getElementById('welcome-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
    }

    // 다시 보지 않기가 체크되지 않았다면 localStorage에 저장
    const dontShowCheckbox = document.getElementById('welcome-dont-show');
    if (!dontShowCheckbox || !dontShowCheckbox.checked) {
        // 세션 동안만 표시하지 않음 (새로고침하면 다시 표시)
        sessionStorage.setItem(WELCOME_STORAGE_KEY, 'true');
    }
}

/**
 * 다시 보지 않기 처리
 */
window.handleWelcomeDontShow = function(checked) {
    if (checked) {
        localStorage.setItem(WELCOME_STORAGE_KEY, 'true');
    } else {
        localStorage.removeItem(WELCOME_STORAGE_KEY);
    }
};

/**
 * 웰컴 모달에서 로그인 버튼 클릭
 */
window.handleWelcomeLogin = async function() {
    closeWelcomeModal();
    
    // signInWithGoogle 함수 직접 호출
    if (window.signInWithGoogle) {
        window.signInWithGoogle();
    }
};

// 전역 함수로 등록
window.closeWelcomeModal = closeWelcomeModal;
window.showWelcomeModal = showWelcomeModal;
