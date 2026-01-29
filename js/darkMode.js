/**
 * @file darkMode.js
 * @description 다크모드 전환 기능
 */

/**
 * 다크모드 초기화
 */
export function initDarkMode() {
    // 로컬스토리지에서 다크모드 설정 불러오기
    const savedMode = localStorage.getItem('darkMode');
    const isDarkMode = savedMode === 'enabled';
    
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
    
    // 초기 로고 설정
    updateLogo(isDarkMode);

    // 사이드바 로고 클릭 이벤트 리스너
    const logo = document.getElementById('sidebar-logo-img');
    if (logo) {
        logo.addEventListener('click', toggleDarkMode);
    }
    
    // 웰컴 모달 로고 클릭 이벤트 리스너
    const welcomeLogo = document.getElementById('welcome-logo-img');
    if (welcomeLogo) {
        welcomeLogo.addEventListener('click', toggleDarkMode);
    }
}

/**
 * 로고 이미지 업데이트
 */
function updateLogo(isDarkMode) {
    const logo = document.getElementById('sidebar-logo-img');
    if (logo) {
        logo.src = isDarkMode ? '로고1_다크모드.png' : '로고2_작은버전2.png';
    }
    
    // 웰컴 모달 로고도 업데이트
    const welcomeLogo = document.getElementById('welcome-logo-img');
    if (welcomeLogo) {
        welcomeLogo.src = isDarkMode ? '로고1_다크모드.png' : '로고2_작은버전2.png';
    }
}

/**
 * 다크모드 전환
 */
export function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    // 로고 이미지 업데이트
    updateLogo(isDarkMode);
    
    // 로컬스토리지에 저장
    if (isDarkMode) {
        localStorage.setItem('darkMode', 'enabled');
    } else {
        localStorage.setItem('darkMode', 'disabled');
    }
}
