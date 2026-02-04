/**
 * @file backgroundMusic.js
 * @description 배경음악 재생/일시정지, 배경음 폴더 랜덤 재생, 크로스페이드 전환
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

// 크로스페이드 설정
const CROSSFADE_TRIGGER_SEC = 3;   // 끝나기 N초 전에 다음 곡 시작
const CROSSFADE_DURATION_SEC = 2.5;
const CROSSFADE_INTERVAL_MS = 50;

// 배경음악 요소 (2개: 크로스페이드용)
const bgMusic = document.getElementById('background-music');
const bgMusicNext = new Audio();
bgMusic.preload = 'auto';
bgMusicNext.preload = 'auto';
bgMusic.loop = false;
bgMusicNext.loop = false;

let currentBgm = bgMusic;
let nextBgm = bgMusicNext;
let crossfadeStarted = false;
let crossfadeIntervalId = null;

const musicToggleBtn = document.getElementById('music-toggle-btn');
const musicPlayIcon = document.querySelector('.music-play');
const musicPauseIcon = document.querySelector('.music-pause');
const volumeSlider = document.getElementById('music-volume-slider');
const volumePercentage = document.getElementById('volume-percentage');
const volumeControl = document.getElementById('music-volume-control');
const musicControl = document.querySelector('.music-control');

// 음악 재생 상태 (기본값: false - 음소거)
let isMusicPlaying = false;
let isVolumeControlVisible = false;

// 모바일 재생바 자동 숨김 (표시 후 이 시간이 지나면 숨김)
const MOBILE_VOLUME_BAR_AUTO_HIDE_MS = 2500;
let mobileVolumeBarHideTimeoutId = null;

// 목표 볼륨 (슬라이더/저장값, 크로스페이드 끝에도 적용)
let targetVolume = parseFloat(localStorage.getItem('musicVolume')) || 0.3;
currentBgm.volume = targetVolume;
nextBgm.volume = 0;
volumeSlider.value = targetVolume * 100;
volumePercentage.textContent = Math.round(targetVolume * 100) + '%';

/** 모바일에서 재생바 자동 숨김 타이머 예약 (표시 후 MOBILE_VOLUME_BAR_AUTO_HIDE_MS 뒤에 숨김) */
function scheduleMobileVolumeBarAutoHide() {
    if (mobileVolumeBarHideTimeoutId) {
        clearTimeout(mobileVolumeBarHideTimeoutId);
        mobileVolumeBarHideTimeoutId = null;
    }
    if (window.innerWidth > 768) return;
    mobileVolumeBarHideTimeoutId = setTimeout(() => {
        volumeControl.classList.remove('show');
        isVolumeControlVisible = false;
        mobileVolumeBarHideTimeoutId = null;
    }, MOBILE_VOLUME_BAR_AUTO_HIDE_MS);
}

/** 모바일 재생바 자동 숨김 타이머 취소 */
function clearMobileVolumeBarAutoHide() {
    if (mobileVolumeBarHideTimeoutId) {
        clearTimeout(mobileVolumeBarHideTimeoutId);
        mobileVolumeBarHideTimeoutId = null;
    }
}

/** 배경음 목록에서 랜덤 트랙 경로 반환 (이전 곡 제외 가능, src는 절대 URL일 수 있음) */
function getRandomTrack(excludeSrc = '') {
    const isCurrent = (path) => path === excludeSrc || (excludeSrc && excludeSrc.endsWith(path));
    const list = excludeSrc ? BGM_TRACKS.filter(p => !isCurrent(p)) : BGM_TRACKS;
    if (list.length === 0) return BGM_TRACKS[0];
    return list[Math.floor(Math.random() * list.length)];
}

/** 크로스페이드 시작: 끝나기 N초 전에 다음 곡을 0 볼륨으로 재생 후 서서히 전환 */
function startCrossfade() {
    if (!isMusicPlaying || crossfadeStarted) return;
    const duration = currentBgm.duration;
    if (!duration || isNaN(duration) || duration - currentBgm.currentTime > CROSSFADE_TRIGGER_SEC) return;

    crossfadeStarted = true;
    const nextSrc = getRandomTrack(currentBgm.src || '');
    nextBgm.src = nextSrc;
    nextBgm.volume = 0;
    nextBgm.load();
    nextBgm.play().catch(err => console.log('다음 곡 재생 실패:', err));

    const startTime = performance.now();
    crossfadeIntervalId = setInterval(() => {
        const elapsed = (performance.now() - startTime) / 1000;
        const t = Math.min(1, elapsed / CROSSFADE_DURATION_SEC);
        currentBgm.volume = targetVolume * (1 - t);
        nextBgm.volume = targetVolume * t;

        if (t >= 1) {
            clearInterval(crossfadeIntervalId);
            crossfadeIntervalId = null;
            currentBgm.pause();
            currentBgm.currentTime = 0;
            const prev = currentBgm;
            currentBgm = nextBgm;
            nextBgm = prev;
            crossfadeStarted = false;
        }
    }, CROSSFADE_INTERVAL_MS);
}

/** 다음 곡 즉시 재생 (크로스페이드 미적용: 짧은 곡/폴백) */
function playNextRandom() {
    if (!isMusicPlaying) return;
    const src = getRandomTrack(currentBgm.src || '');
    currentBgm.src = src;
    currentBgm.volume = targetVolume;
    currentBgm.load();
    currentBgm.play().catch(err => console.log('재생 실패:', err));
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
    
    // 데스크톱에서 클릭 시 볼륨바 표시
    if (window.innerWidth > 768) {
        volumeControl.classList.add('show');
        isVolumeControlVisible = true;
    }
});

// 음량 조절 바 외부 클릭 시 숨김 (모바일용)
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && isVolumeControlVisible) {
        // 음악 버튼이나 음량 조절 바 클릭이 아닌 경우
        if (!musicToggleBtn.contains(e.target) && !volumeControl.contains(e.target)) {
            volumeControl.classList.remove('show');
            isVolumeControlVisible = false;
            clearMobileVolumeBarAutoHide();
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
            clearMobileVolumeBarAutoHide();
        }
    });
}

// 마우스 이탈 시 볼륨바 숨김 (데스크톱용)
if (musicControl) {
    musicControl.addEventListener('mouseleave', () => {
        if (window.innerWidth > 768 && isVolumeControlVisible) {
            volumeControl.classList.remove('show');
            isVolumeControlVisible = false;
        }
    });
}

// 음악 재생 함수 (배경음 폴더에서 랜덤 트랙으로 시작)
function playMusic() {
    crossfadeStarted = false;
    if (crossfadeIntervalId) {
        clearInterval(crossfadeIntervalId);
        crossfadeIntervalId = null;
    }
    const src = getRandomTrack();
    currentBgm.src = src;
    currentBgm.volume = targetVolume;
    nextBgm.volume = 0;
    currentBgm.load();
    isMusicPlaying = true;
    localStorage.setItem('musicPlaying', 'true');
    updateMusicIcon();

    currentBgm.play()
        .then(() => {
            if (window.innerWidth <= 768) {
                volumeControl.classList.add('show');
                isVolumeControlVisible = true;
                scheduleMobileVolumeBarAutoHide();
            }
        })
        .catch(error => {
            console.log('음악 재생 실패:', error);
        });
}

// 음악 일시정지 함수
function pauseMusic() {
    if (crossfadeIntervalId) {
        clearInterval(crossfadeIntervalId);
        crossfadeIntervalId = null;
    }
    currentBgm.pause();
    nextBgm.pause();
    isMusicPlaying = false;
    crossfadeStarted = false;
    localStorage.setItem('musicPlaying', 'false');
    updateMusicIcon();

    if (window.innerWidth <= 768) {
        volumeControl.classList.remove('show');
        isVolumeControlVisible = false;
        clearMobileVolumeBarAutoHide();
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

// 크로스페이드 트리거: 재생 중인 곡이 끝나기 N초 전에 다음 곡과 크로스페이드
function onTimeUpdate(e) {
    if (e.target !== currentBgm || !isMusicPlaying) return;
    const el = e.target;
    if (el.duration && !isNaN(el.duration) && el.duration - el.currentTime <= CROSSFADE_TRIGGER_SEC) {
        startCrossfade();
    }
}
bgMusic.addEventListener('timeupdate', onTimeUpdate);
bgMusicNext.addEventListener('timeupdate', onTimeUpdate);

// 곡이 끝나면 다음 곡 재생 (크로스페이드 안 된 경우 폴백)
function onEnded(e) {
    if (e.target !== currentBgm) return;
    if (isMusicPlaying && !crossfadeStarted) {
        playNextRandom();
    } else {
        updateMusicIcon();
    }
}
bgMusic.addEventListener('ended', onEnded);
bgMusicNext.addEventListener('ended', onEnded);

// 음악 로드 에러 처리
function onBgmError(e) {
    console.error('음악 파일 로드 실패:', e);
    musicToggleBtn.style.opacity = '0.5';
    musicToggleBtn.style.cursor = 'not-allowed';
    musicToggleBtn.disabled = true;
}
bgMusic.addEventListener('error', onBgmError);
bgMusicNext.addEventListener('error', onBgmError);

// 음량 슬라이더: 목표 볼륨 반영 (현재 재생 중인 곡에 즉시 적용)
volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    targetVolume = volume;
    currentBgm.volume = volume;
    volumePercentage.textContent = e.target.value + '%';
    localStorage.setItem('musicVolume', volume);
    // 모바일: 슬라이더 조작 시 자동 숨김 타이머 리셋
    if (window.innerWidth <= 768 && isVolumeControlVisible) {
        scheduleMobileVolumeBarAutoHide();
    }
});

// 초기 아이콘 상태 설정
updateMusicIcon();
