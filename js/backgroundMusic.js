/**
 * @file backgroundMusic.js
 * @description 배경음악 재생/일시정지, 배경음 폴더 랜덤 재생
 */

// 배경음 폴더 내 mp3 목록 (랜덤 재생용)
const BGM_TRACKS = [
    '배경음/1.mp3',
    '배경음/2.mp3',
    '배경음/3.mp3',
    '배경음/4.mp3',
    '배경음/5.mp3',
    '배경음/Untitled (1).mp3',
    '배경음/Untitled (2).mp3',
    '배경음/Untitled (3).mp3',
    '배경음/Untitled.mp3',
];

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

bgMusic.preload = 'auto';
bgMusic.loop = false; // 랜덤 연속 재생으로 대체

/** 배경음 목록에서 랜덤 트랙 경로 반환 */
function getRandomTrack() {
    return BGM_TRACKS[Math.floor(Math.random() * BGM_TRACKS.length)];
}

/** 다음 곡을 랜덤으로 설정하고 재생 (재생 중일 때만) */
function playNextRandom() {
    if (!isMusicPlaying) return;
    const src = getRandomTrack();
    bgMusic.src = src;
    bgMusic.load();
    bgMusic.play().catch(err => console.log('재생 실패:', err));
}

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

// 음악 재생 함수 (배경음 폴더에서 랜덤 트랙으로 시작)
function playMusic() {
    const src = getRandomTrack();
    bgMusic.src = src;
    bgMusic.load();
    isMusicPlaying = true;
    localStorage.setItem('musicPlaying', 'true');
    updateMusicIcon();

    bgMusic.play()
        .then(() => {
            if (window.innerWidth <= 768) {
                volumeControl.classList.add('show');
                isVolumeControlVisible = true;
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

// 곡이 끝나면 다음 곡 랜덤 재생
bgMusic.addEventListener('ended', () => {
    if (isMusicPlaying) {
        playNextRandom();
    } else {
        updateMusicIcon();
    }
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
