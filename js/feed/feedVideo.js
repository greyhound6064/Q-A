/**
 * @file feedVideo.js
 * @description 피드 비디오 컨트롤 로직
 */

/**
 * 비디오 음소거 토글
 */
export function toggleVideoMute(postId) {
    const video = document.querySelector(`video[data-video-id="${postId}"]`);
    const muteIcon = document.getElementById(`mute-icon-${postId}`);
    
    if (!video || !muteIcon) return;
    
    video.muted = !video.muted;
    
    // 뮤트 해제 시 볼륨을 30으로 설정
    if (!video.muted) {
        video.volume = 0.3;
    }
    
    // 아이콘 변경
    if (video.muted) {
        // 음소거 아이콘
        muteIcon.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="white"></polygon>
            <line x1="23" y1="9" x2="17" y2="15" stroke="white" stroke-width="2"></line>
            <line x1="17" y1="9" x2="23" y2="15" stroke="white" stroke-width="2"></line>
        `;
    } else {
        // 음소거 해제 아이콘
        muteIcon.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="white"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" stroke="white" stroke-width="2" fill="none"></path>
        `;
    }
    
    // 이벤트 전파 중지
    if (window.event) {
        window.event.stopPropagation();
    }
}

// 전역 함수로 export (HTML onclick에서 사용)
window.toggleVideoMute = toggleVideoMute;
