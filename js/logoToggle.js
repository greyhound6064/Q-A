/**
 * @file logoToggle.js
 * @description 로고 클릭 시 이미지 토글 기능
 */

// 로고 상태 관리 (디폴트: 다크모드 = 로고2)
let isLogo1 = false;
let isWelcomeLogo1 = false;

/**
 * 사이드바 로고 이미지를 토글합니다
 */
export function toggleLogo() {
    const logoImg = document.getElementById('sidebar-logo-img');
    if (!logoImg) return;
    
    if (isLogo1) {
        logoImg.src = '로고2_작은버전2.png';
        isLogo1 = false;
    } else {
        logoImg.src = '로고1_다크모드.png';
        isLogo1 = true;
    }
}

/**
 * 웰컴 모달 로고 이미지를 토글합니다
 */
export function toggleWelcomeLogo() {
    const welcomeLogoImg = document.getElementById('welcome-logo-img');
    if (!welcomeLogoImg) return;
    
    if (isWelcomeLogo1) {
        welcomeLogoImg.src = '로고2_작은버전2.png';
        isWelcomeLogo1 = false;
    } else {
        welcomeLogoImg.src = '로고1_다크모드.png';
        isWelcomeLogo1 = true;
    }
}

/**
 * 로고 클릭 이벤트 초기화
 */
export function initLogoToggle() {
    const logoImg = document.getElementById('sidebar-logo-img');
    if (logoImg) {
        logoImg.addEventListener('click', toggleLogo);
    }
}
