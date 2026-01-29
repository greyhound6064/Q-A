/**
 * @file feed.js
 * @description 피드 통합 모듈 - 리팩토링 완료
 * 
 * 구조:
 * - feed/feedCore.js: 피드 로딩 및 리스트 렌더링
 * - feed/feedDetail.js: 상세보기 모달
 * - feed/feedComments.js: 댓글 시스템
 * - feed/feedCarousel.js: 캐러셀 및 이미지 뷰어
 * - feed/feedSort.js: 정렬 로직
 * - feed/feedSearch.js: 검색 및 태그 필터
 * - feed/feedVideo.js: 비디오 컨트롤
 * - feed/feedLikes.js: 좋아요/싫어요
 */

// ========== 하위 모듈 import ==========
import * as FeedCore from './feed/feedCore.js';
import * as FeedDetail from './feed/feedDetail.js';
import * as FeedComments from './feed/feedComments.js';
import * as FeedCarousel from './feed/feedCarousel.js';
import * as FeedSort from './feed/feedSort.js';
import * as FeedSearch from './feed/feedSearch.js';
import * as FeedVideo from './feed/feedVideo.js';
import * as FeedLikes from './feed/feedLikes.js';

// ========== 전역 상태 관리 ==========
window._feedState = {
    allFeedPosts: [],
    feedPosts: []
};

// ========== 피드 초기화 ==========
export async function initFeed() {
    const posts = await FeedCore.loadFeedPosts();
    if (posts) {
        window._feedState.allFeedPosts = posts;
        window._feedState.feedPosts = posts;
        FeedCore.setAllFeedPosts(posts);
        FeedCore.setFeedPosts(posts);
        FeedSearch.applySearchAndFilter(posts);
        await FeedCore.renderFeedList();
    }
}

// applySearchAndFilter를 전역으로 노출
window.applySearchAndFilter = FeedSearch.applySearchAndFilter;

// ========== Core 함수 export ==========
export const loadFeedPosts = FeedCore.loadFeedPosts;
export const renderFeedList = FeedCore.renderFeedList;
export const getFeedPosts = FeedCore.getFeedPosts;
export const toggleSave = FeedCore.toggleSave;
export const updateLikesUI = FeedCore.updateLikesUI;
export const updateFeedCommentCount = FeedCore.updateFeedCommentCount;

// ========== Detail 함수 export ==========
export const openFeedDetail = (postId, showComments = false) => {
    return FeedDetail.openFeedDetail(postId, showComments, FeedCore.getFeedPosts());
};
export const closeFeedDetail = FeedDetail.closeFeedDetail;
export const toggleComments = (artworkId) => {
    return FeedDetail.toggleComments(artworkId, FeedCore.getFeedPosts());
};
export const toggleFeedDetailLike = FeedDetail.toggleFeedDetailLike;
export const toggleFeedDetailDislike = FeedDetail.toggleFeedDetailDislike;
export const toggleFeedDetailSave = FeedDetail.toggleFeedDetailSave;

// ========== Comments 함수 export ==========
export const loadFeedDetailComments = FeedComments.loadFeedDetailComments;
export const focusFeedDetailComment = FeedComments.focusFeedDetailComment;
export const cancelFeedDetailComment = FeedComments.cancelFeedDetailComment;
export const submitFeedDetailComment = FeedComments.submitFeedDetailComment;
export const setFeedDetailReplyTarget = FeedComments.setFeedDetailReplyTarget;
export const clearFeedDetailReplyTarget = FeedComments.clearFeedDetailReplyTarget;
export const toggleFeedDetailReplies = FeedComments.toggleFeedDetailReplies;
export const deleteFeedDetailComment = FeedComments.deleteFeedDetailComment;

// ========== Carousel 함수 export ==========
export const prevFeedImage = FeedCarousel.prevFeedImage;
export const nextFeedImage = FeedCarousel.nextFeedImage;
export const openImageViewer = FeedCarousel.openImageViewer;
export const closeImageViewer = FeedCarousel.closeImageViewer;
export const prevViewerImage = FeedCarousel.prevViewerImage;
export const nextViewerImage = FeedCarousel.nextViewerImage;
export const prevFeedDetailFile = FeedCarousel.prevFeedDetailFile;
export const nextFeedDetailFile = FeedCarousel.nextFeedDetailFile;

// ========== Sort 함수 export ==========
export const changeSortMode = FeedSort.changeSortMode;
export const toggleSortFilter = FeedSort.toggleSortFilter;
export const toggleFeedSearchPanel = FeedSort.toggleFeedSearchPanel;

// ========== Search 함수 export ==========
export const performSearch = FeedSearch.performSearch;
export const clearSearch = FeedSearch.clearSearch;
export const addTagFilter = FeedSearch.addTagFilter;
export const searchTagSuggestions = FeedSearch.searchTagSuggestions;
export const selectTagSuggestion = FeedSearch.selectTagSuggestion;
export const toggleTagFilter = FeedSearch.toggleTagFilter;
export const toggleTagFilterDropdown = FeedSearch.toggleTagFilterDropdown;

// ========== Video 함수 export ==========
export const toggleVideoPlayPause = FeedVideo.toggleVideoPlayPause;
export const showVideoControls = FeedVideo.showVideoControls;
export const hideVideoControls = FeedVideo.hideVideoControls;
export const seekVideo = FeedVideo.seekVideo;
export const seekVideoByClick = FeedVideo.seekVideoByClick;
export const setupVideoEventListeners = FeedVideo.setupVideoEventListeners;
export const toggleVideoMute = FeedVideo.toggleVideoMute;
export const updateVideoProgress = FeedVideo.updateVideoProgress;
export const formatVideoTime = FeedVideo.formatVideoTime;

// ========== Likes 함수 export ==========
export const toggleLike = FeedLikes.toggleLike;
export const toggleDislike = FeedLikes.toggleDislike;

// ========== 댓글 함수 (호환성) ==========
export function submitComment() {
    console.warn('submitComment는 artwork 모달에서 submitArtworkComment로 처리됩니다.');
    if (window.submitArtworkComment) {
        return window.submitArtworkComment();
    }
}
