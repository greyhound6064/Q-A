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
const volumeControl = document.getElementById('music-volume-control');

// 음악 재생 상태 (기본값: false - 음소거)
let isMusicPlaying = false;
let isVolumeControlVisible = false;

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
musicToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // 모바일과 데스크톱 모두 음악 재생/일시정지
    if (isMusicPlaying) {
        pauseMusic();
    } else {
        playMusic();
    }
});

// 음량 조절 바 외부 클릭 시 숨김 (모바일용)
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && isVolumeControlVisible) {
        // 음악 버튼이나 음량 조절 바 클릭이 아닌 경우
        if (!musicToggleBtn.contains(e.target) && !volumeControl.contains(e.target)) {
            volumeControl.classList.remove('show');
            isVolumeControlVisible = false;
        }
    }
});

// 스크롤 시 음량 조절 바 숨김 (모바일용)
let scrollTimeout;
const contentArea = document.querySelector('.content-area');

if (contentArea) {
    contentArea.addEventListener('scroll', () => {
        if (window.innerWidth <= 768 && isVolumeControlVisible) {
            // 스크롤 시작 시 바로 숨김
            volumeControl.classList.remove('show');
            isVolumeControlVisible = false;
        }
    });
}

// 음악 재생 함수
function playMusic() {
    bgMusic.play()
        .then(() => {
            isMusicPlaying = true;
            localStorage.setItem('musicPlaying', 'true');
            updateMusicIcon();
            
            // 모바일에서 음악 재생 성공 시 음량 조절 바 표시
            if (window.innerWidth <= 768) {
                console.log('모바일: 음량 조절 바 표시');
                volumeControl.classList.add('show');
                isVolumeControlVisible = true;
                console.log('show 클래스 추가됨:', volumeControl.classList.contains('show'));
            }
        })
        .catch(error => {
            console.log('음악 재생 실패:', error);
        });
}

// 음악 일시정지 함수
function pauseMusic() {
    bgMusic.pause();
    isMusicPlaying = false;
    localStorage.setItem('musicPlaying', 'false');
    updateMusicIcon();
    
    // 모바일에서 음악 정지 시 음량 조절 바 숨김
    if (window.innerWidth <= 768) {
        volumeControl.classList.remove('show');
        isVolumeControlVisible = false;
    }
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
