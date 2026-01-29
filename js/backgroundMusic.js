/**
 * @file backgroundMusic.js
 * @description 배경음악 재생/일시정지 기능
 */

// 배경음악 요소
const bgMusic = document.getElementById('background-music');
const musicToggleBtn = document.getElementById('music-toggle-btn');
const musicPlayIcon = document.querySelector('.music-play');
const musicPauseIcon = document.querySelector('.music-pause');
const volumeSlider = document.getElementById('music-volume-slider');
const volumePercentage = document.getElementById('volume-percentage');

// 음악 재생 상태 (기본값: false - 음소거)
let isMusicPlaying = false;

// 초기 볼륨 설정 (0.3 = 30%)
const savedVolume = parseFloat(localStorage.getItem('musicVolume')) || 0.3;
bgMusic.volume = savedVolume;
volumeSlider.value = savedVolume * 100;
volumePercentage.textContent = Math.round(savedVolume * 100) + '%';

// 부드러운 루프를 위한 설정
bgMusic.preload = 'auto'; // 전체 파일 미리 로드
bgMusic.loop = true; // 기본 루프 활성화

// 루프 끊김 방지: 끝나기 직전에 처음으로 되돌리기
bgMusic.addEventListener('timeupdate', () => {
    // 음악이 끝나기 0.5초 전에 처음으로 되돌림 (더 부드러운 루프)
    if (bgMusic.duration > 0 && bgMusic.currentTime >= bgMusic.duration - 0.5) {
        bgMusic.currentTime = 0;
    }
});

// 페이지 로드 시 음소거 상태로 시작
window.addEventListener('DOMContentLoaded', () => {
    // 항상 음소거 상태로 시작
    isMusicPlaying = false;
    updateMusicIcon();
});

// 음악 토글 버튼 클릭 이벤트
musicToggleBtn.addEventListener('click', () => {
    if (isMusicPlaying) {
        pauseMusic();
    } else {
        playMusic();
    }
});

// 음악 재생 함수
function playMusic() {
    bgMusic.play()
        .then(() => {
            isMusicPlaying = true;
            localStorage.setItem('musicPlaying', 'true');
            updateMusicIcon();
        })
        .catch(error => {
            console.log('음악 재생 실패:', error);
            // 브라우저 자동 재생 정책으로 인한 실패는 무시
        });
}

// 음악 일시정지 함수
function pauseMusic() {
    bgMusic.pause();
    isMusicPlaying = false;
    localStorage.setItem('musicPlaying', 'false');
    updateMusicIcon();
}

// 아이콘 업데이트 함수
function updateMusicIcon() {
    if (isMusicPlaying) {
        musicPlayIcon.style.display = 'block';
        musicPauseIcon.style.display = 'none';
        musicToggleBtn.classList.add('playing');
        musicToggleBtn.title = '배경음악 일시정지';
    } else {
        musicPlayIcon.style.display = 'none';
        musicPauseIcon.style.display = 'block';
        musicToggleBtn.classList.remove('playing');
        musicToggleBtn.title = '배경음악 재생';
    }
}

// 음악 종료 시 이벤트 (loop 속성이 있어서 실제로는 발생하지 않음)
bgMusic.addEventListener('ended', () => {
    isMusicPlaying = false;
    localStorage.setItem('musicPlaying', 'false');
    updateMusicIcon();
});

// 음악 로드 에러 처리
bgMusic.addEventListener('error', (e) => {
    console.error('음악 파일 로드 실패:', e);
    musicToggleBtn.style.opacity = '0.5';
    musicToggleBtn.style.cursor = 'not-allowed';
    musicToggleBtn.disabled = true;
});

// 음량 슬라이더 이벤트
volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    bgMusic.volume = volume;
    volumePercentage.textContent = e.target.value + '%';
    localStorage.setItem('musicVolume', volume);
});

// 초기 아이콘 상태 설정
updateMusicIcon();
