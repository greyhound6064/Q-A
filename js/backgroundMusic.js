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
const musicChangeTrackBtn = document.getElementById('music-change-track-btn');
const musicControl = document.querySelector('.music-control');

// 음악 재생 상태 (기본값: false - 음소거)
let isMusicPlaying = false;
let isVolumeControlVisible = false;

// 모바일 재생바 자동 숨김 (표시 후 이 시간이 지나면 숨김)
const MOBILE_VOLUME_BAR_AUTO_HIDE_MS = 2500;
let mobileVolumeBarHideTimeoutId = null;

// 데스크톱 재생바 자동 숨김 (표시 후 2.5초 뒤 숨김, 그 전에는 호버 풀려도 유지)
const DESKTOP_VOLUME_BAR_AUTO_HIDE_MS = 2500;
let desktopVolumeBarHideTimeoutId = null;

// 목표 볼륨 (슬라이더/저장값, 크로스페이드 끝에도 적용)
let targetVolume = parseFloat(localStorage.getItem('musicVolume')) || 0.3;
currentBgm.volume = targetVolume;
nextBgm.volume = 0;
volumeSlider.value = targetVolume * 100;
volumePercentage.textContent = Math.round(targetVolume * 100) + '%';

// 이번 사이클에서 이미 재생한 곡 (전체 재생 후에만 다시 선택 가능)
const playedTracksThisCycle = new Set();

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

/** 데스크톱에서 재생바 자동 숨김 타이머 예약 (표시 후 2.5초 뒤 숨김, 호버 풀려도 유지) */
function scheduleDesktopVolumeBarAutoHide() {
    if (desktopVolumeBarHideTimeoutId) {
        clearTimeout(desktopVolumeBarHideTimeoutId);
        desktopVolumeBarHideTimeoutId = null;
    }
    if (window.innerWidth <= 768) return;
    desktopVolumeBarHideTimeoutId = setTimeout(() => {
        volumeControl.classList.remove('show');
        isVolumeControlVisible = false;
        desktopVolumeBarHideTimeoutId = null;
    }, DESKTOP_VOLUME_BAR_AUTO_HIDE_MS);
}

/** 데스크톱 재생바 자동 숨김 타이머 취소 */
function clearDesktopVolumeBarAutoHide() {
    if (desktopVolumeBarHideTimeoutId) {
        clearTimeout(desktopVolumeBarHideTimeoutId);
        desktopVolumeBarHideTimeoutId = null;
    }
}

/** src(절대 URL 또는 상대 경로)를 BGM_TRACKS 형식 경로로 정규화 (예: '배경음/1.mp3') */
function normalizeTrackPath(src) {
    if (!src) return '';
    const s = src.split('?')[0];
    const idx = s.indexOf('배경음/');
    if (idx !== -1) return s.substring(idx);
    const parts = s.split('/').filter(Boolean);
    return parts.length ? '배경음/' + parts[parts.length - 1] : '';
}

/** 이번 사이클에서 재생한 곡으로 기록 (전체 곡 재생 후에만 다시 선택 가능) */
function markTrackAsPlayed(src) {
    const path = normalizeTrackPath(src);
    if (path) playedTracksThisCycle.add(path);
}

/** 배경음 목록에서 랜덤 트랙 경로 반환. 이번 사이클에서 아직 안 들은 곡만 선택, 다 들으면 사이클 초기화 후 선택 */
function getRandomTrack(excludeSrc = '') {
    const excludePath = normalizeTrackPath(excludeSrc);
    const isCurrent = (path) => path === excludePath || path === excludeSrc || (excludeSrc && excludeSrc.endsWith(path));
    let list = BGM_TRACKS.filter(p => !playedTracksThisCycle.has(p) && !isCurrent(p));
    if (list.length === 0) {
        playedTracksThisCycle.clear();
        list = excludePath ? BGM_TRACKS.filter(p => !isCurrent(p)) : BGM_TRACKS;
    }
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
    markTrackAsPlayed(nextSrc);
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

/** 볼륨바 "음악 바꾸기" 버튼용: 다음 랜덤 곡으로 전환 (재생 중이면 재생, 일시정지면 로드만) */
function changeToNextTrack() {
    const src = getRandomTrack(currentBgm.src || '');
    currentBgm.src = src;
    markTrackAsPlayed(src);
    currentBgm.volume = targetVolume;
    currentBgm.load();
    if (isMusicPlaying) {
        currentBgm.play().catch(err => console.log('재생 실패:', err));
    }
}

/** 다음 곡 즉시 재생 (크로스페이드 미적용: 짧은 곡/폴백) */
function playNextRandom() {
    if (!isMusicPlaying) return;
    const src = getRandomTrack(currentBgm.src || '');
    currentBgm.src = src;
    markTrackAsPlayed(src);
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
    
    // 데스크톱에서 클릭 시 볼륨바 표시 (2.5초 후 자동 숨김, 그 전에는 호버 풀려도 유지)
    if (window.innerWidth > 768) {
        volumeControl.classList.add('show');
        isVolumeControlVisible = true;
        scheduleDesktopVolumeBarAutoHide();
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

// 데스크톱: 볼륨바는 2.5초 후 자동 숨김만 적용 (마우스 이탈 시 즉시 숨기지 않음)

// 음악 재생 함수 (이미 로드된 곡이 있으면 이어서 재생, 없으면 랜덤 트랙으로 시작)
function playMusic() {
    crossfadeStarted = false;
    if (crossfadeIntervalId) {
        clearInterval(crossfadeIntervalId);
        crossfadeIntervalId = null;
    }
    // 이미 로드된 곡이 있으면 이어서 재생 (헤드셋 재클릭 시 음악 바꾸지 않음)
    const hasLoadedTrack = currentBgm.src && (currentBgm.currentTime > 0 || (currentBgm.duration && !isNaN(currentBgm.duration) && currentBgm.duration > 0));
    if (hasLoadedTrack) {
        currentBgm.volume = targetVolume;
        nextBgm.volume = 0;
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
            .catch(error => console.log('음악 재생 실패:', error));
        return;
    }
    // 새로 재생 시작
    const src = getRandomTrack();
    currentBgm.src = src;
    markTrackAsPlayed(src);
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

// 음악 바꾸기 버튼: 다음 랜덤 곡으로 전환
if (musicChangeTrackBtn) {
    musicChangeTrackBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        changeToNextTrack();
        if (window.innerWidth <= 768 && isVolumeControlVisible) {
            scheduleMobileVolumeBarAutoHide();
        }
        if (window.innerWidth > 768 && isVolumeControlVisible) {
            scheduleDesktopVolumeBarAutoHide();
        }
    });
}

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
    // 데스크톱: 볼륨 조정 중에는 2.5초 자동 숨김 타이머 리셋
    if (window.innerWidth > 768 && isVolumeControlVisible) {
        scheduleDesktopVolumeBarAutoHide();
    }
});

// 초기 아이콘 상태 설정
updateMusicIcon();
