/**
 * @file feed.js
 * @description 피드 모듈 통합 - 하위 모듈들의 함수를 re-export
 */

// ========== feedCore.js ==========
export {
    initFeed,
    loadFeedPosts,
    renderFeedList,
    toggleSave,
    updateLikesUI,
    updateFeedCommentCount,
    feedPosts,
    allFeedPosts,
    setFeedPosts,
    setAllFeedPosts,
    getFeedPosts
} from './post/postCore.js';

// ========== postDetail.js ==========
export {
    openFeedDetail,
    closeFeedDetail,
    toggleComments,
    toggleFeedDetailLike,
    toggleFeedDetailDislike,
    toggleFeedDetailSave,
    openEditFeedPost,
    deleteFeedPost
} from './post/postDetail.js';

// ========== postSort.js ==========
export {
    changeSortMode,
    applySorting,
    toggleFeedSearchPanel,
    toggleSortFilter,
    getCurrentSortMode
} from './post/postSort.js';

// ========== postLikes.js ==========
export {
    toggleLike,
    toggleDislike
} from './post/postLikes.js';

// ========== postComments.js ==========
export {
    loadFeedDetailComments,
    focusFeedDetailComment,
    submitFeedDetailComment,
    setFeedDetailReplyTarget,
    clearFeedDetailReplyTarget,
    toggleFeedDetailReplies,
    deleteFeedDetailComment
} from './post/postComments.js';

// ========== postSearch.js ==========
export {
    performSearch,
    clearSearch,
    addTagFilter,
    searchTagSuggestions,
    selectTagSuggestion,
    toggleTagFilter,
    toggleTagFilterDropdown,
    getSearchKeyword,
    getSelectedTags,
    applySearchAndFilter
} from './post/postSearch.js';

// ========== postVideo.js ==========
export {
    toggleVideoMute
} from './post/postVideo.js';

// ========== postCarousel.js ==========
export {
    prevFeedImage,
    nextFeedImage,
    openImageViewer,
    closeImageViewer,
    prevViewerImage,
    nextViewerImage,
    prevFeedDetailFile,
    nextFeedDetailFile,
    setFeedDetailFiles,
    getFeedDetailFiles,
    getFeedDetailFileIndex,
    currentFeedDetailFiles,
    currentFeedDetailFileIndex
} from './post/postCarousel.js';

// ========== 전역 상태 관리 ==========
// 피드 상태를 전역에서 접근 가능하도록 설정
import { feedPosts as _feedPosts, allFeedPosts as _allFeedPosts } from './post/postCore.js';
import { applySearchAndFilter as _applySearchAndFilter } from './post/postSearch.js';

// 전역 상태 객체 생성
if (typeof window !== 'undefined') {
    window._feedState = {
        get feedPosts() { return _feedPosts; },
        get allFeedPosts() { return _allFeedPosts; }
    };
    
    // applySearchAndFilter를 전역 함수로 등록
    window.applySearchAndFilter = _applySearchAndFilter;
}

// 추가로 필요한 함수들 (main.js에서 사용하는 함수들)
// 이 함수들은 실제로 존재하지 않을 수 있으므로 더미 함수로 제공하거나
// 실제 구현이 필요한 경우 추가해야 합니다.

// 비디오 관련 함수들 (실제 구현이 없으면 더미로 제공)
export function toggleVideoPlayPause(postId) {
    const video = document.querySelector(`video[data-video-id="${postId}"]`);
    if (!video) return;
    
    if (video.paused) {
        video.play();
    } else {
        video.pause();
    }
}

export function showVideoControls(postId) {
    const container = document.querySelector(`[data-video-container="${postId}"]`);
    if (container) {
        container.classList.add('show-controls');
    }
}

export function hideVideoControls(postId) {
    const container = document.querySelector(`[data-video-container="${postId}"]`);
    if (container) {
        container.classList.remove('show-controls');
    }
}

export function seekVideo(postId, time) {
    const video = document.querySelector(`video[data-video-id="${postId}"]`);
    if (video) {
        video.currentTime = time;
    }
}

export function seekVideoByClick(postId, event) {
    const video = document.querySelector(`video[data-video-id="${postId}"]`);
    if (!video) return;
    
    const progressBar = event.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    
    video.currentTime = video.duration * percentage;
}

// 댓글 제출 함수 (postComments에서 이미 있지만 별칭으로 제공)
export async function submitComment(postId) {
    // postComments의 submitFeedDetailComment를 호출
    const { submitFeedDetailComment } = await import('./post/postComments.js');
    return submitFeedDetailComment(postId);
}

// 댓글 입력 취소 함수
export function cancelFeedDetailComment() {
    const textarea = document.getElementById('feed-detail-comment-textarea');
    if (textarea) {
        textarea.value = '';
        textarea.style.height = 'auto';
    }
    
    // 답글 대상 초기화
    const { clearFeedDetailReplyTarget } = require('./post/postComments.js');
    clearFeedDetailReplyTarget();
}
