/**
 * @file main.js
 * @description 앱 초기화 및 전역 함수 등록
 */

// 템플릿 시스템 import
import { initializeTemplates } from './templates/templateLoader.js';

// 웰컴 모달 import
import { checkAndShowWelcomeModal } from './welcome.js';

// 로고 토글 import
import { initLogoToggle, toggleLogo, toggleWelcomeLogo } from './logoToggle.js';

// 다크모드 import
import { initDarkMode, toggleDarkMode } from './darkMode.js';

// 모든 모듈 import
import { initAuth, signInWithGoogle, signOut, handleProfileLogout, updateAuthUI } from './auth.js';
import { 
    updateProfileInfo, 
    updateProfileStats, 
    updateProfileAvatar,
    openProfileEditModal, 
    closeProfileEditModal, 
    handleAvatarChange, 
    removeAvatar, 
    saveProfileChanges,
    showOwnProfileUI,
    showOtherProfileUI,
    setCurrentViewingUserId,
    getCurrentViewingUserId,
    filterProfilePosts
} from './profile.js';
import { initTabs, switchToTab, switchToOtherProfile } from './tabs.js';
import { 
    renderArtworksGrid, 
    openArtworkDetail, 
    closeArtworkDetail, 
    prevArtworkImage, 
    nextArtworkImage, 
    goToArtworkImage,
    deleteArtwork,
    deleteArtworkComment,
    openArtworkImageViewer,
    closeArtworkImageViewer,
    prevArtworkViewerImage,
    nextArtworkViewerImage
} from './artwork.js';
import { 
    openUploadModal, 
    closeUploadModal, 
    handleUploadImageChange, 
    removeCurrentUploadImage, 
    prevUploadImage, 
    nextUploadImage, 
    goToUploadImage, 
    uploadPost,
    handleUploadPostTypeChange
} from './upload.js';
import { 
    openEditArtworkModal, 
    closeEditArtworkModal, 
    handleEditImageChange, 
    prevEditImage, 
    nextEditImage, 
    goToEditImage, 
    removeCurrentEditImage, 
    updateArtwork,
    handleEditPostTypeChange
} from './edit.js';
import { 
    initFeed, 
    changeSortMode, 
    openFeedDetail,
    closeFeedDetail,
    focusFeedDetailComment,
    cancelFeedDetailComment,
    submitFeedDetailComment,
    toggleFeedDetailLike,
    toggleFeedDetailDislike,
    toggleFeedDetailSave,
    setFeedDetailReplyTarget,
    clearFeedDetailReplyTarget,
    toggleFeedDetailReplies,
    deleteFeedDetailComment,
    prevFeedDetailFile,
    nextFeedDetailFile,
    toggleLike,
    toggleDislike, 
    toggleSave, 
    toggleComments,
    submitComment,
    updateFeedCommentCount,
    performSearch,
    clearSearch,
    addTagFilter,
    searchTagSuggestions,
    selectTagSuggestion,
    toggleTagFilter,
    toggleSortFilter,
    toggleTagFilterDropdown,
    toggleFeedSearchPanel,
    toggleVideoMute,
    toggleVideoPlayPause,
    showVideoControls,
    hideVideoControls,
    seekVideo,
    seekVideoByClick,
    prevFeedImage,
    nextFeedImage,
    openImageViewer,
    closeImageViewer,
    prevViewerImage,
    nextViewerImage
} from './feed.js';
import { 
    initGallery,
    changeGallerySortMode,
    toggleGallerySortFilter,
    toggleGallerySearchPanel,
    performGallerySearch,
    clearGallerySearch,
    addGalleryTagFilter,
    removeGalleryTagFilter,
    searchGalleryTagSuggestions,
    selectGalleryTagSuggestion,
    toggleGalleryTagFilterDropdown,
    toggleGalleryLike,
    toggleGalleryDislike,
    toggleGallerySave,
    prevGalleryImage,
    nextGalleryImage,
    openGalleryImageViewer,
    closeGalleryImageViewer
} from './gallery.js';
import { 
    initUserSearch, 
    handleUserSearch, 
    selectUser, 
    clearUserSearch,
    removeRecentSearch,
    selectUserById
} from './userSearch.js';
import { validateNickname, validateNicknameFormat, checkNicknameAvailability } from './nicknameValidator.js';
import {
    initMessages,
    updateUnreadCount,
    handleSendMessageFromProfile
} from './messages.js';
import { recalculateAllTagCounts, debugTag, checkAllTags } from './services/tagService.js';

// ========== 전역 함수 등록 (HTML onclick 속성에서 사용) ==========
window.signInWithGoogle = signInWithGoogle;
window.signOut = signOut;
window.handleProfileLogout = handleProfileLogout;
window.updateProfileInfo = updateProfileInfo;
window.updateProfileStats = updateProfileStats;
window.updateProfileAvatar = updateProfileAvatar;
window.openProfileEditModal = openProfileEditModal;
window.closeProfileEditModal = closeProfileEditModal;
window.handleAvatarChange = handleAvatarChange;
window.removeAvatar = removeAvatar;
window.saveProfileChanges = saveProfileChanges;
window.showOwnProfileUI = showOwnProfileUI;
window.showOtherProfileUI = showOtherProfileUI;
window.setCurrentViewingUserId = setCurrentViewingUserId;
window.getCurrentViewingUserId = getCurrentViewingUserId;
window.filterProfilePosts = filterProfilePosts;
window.renderArtworksGrid = renderArtworksGrid;
window.openArtworkDetail = openArtworkDetail;
window.closeArtworkDetail = closeArtworkDetail;
window.prevArtworkImage = prevArtworkImage;
window.nextArtworkImage = nextArtworkImage;
window.goToArtworkImage = goToArtworkImage;
window.deleteArtwork = deleteArtwork;
window.openArtworkImageViewer = openArtworkImageViewer;
window.closeArtworkImageViewer = closeArtworkImageViewer;
window.prevArtworkViewerImage = prevArtworkViewerImage;
window.nextArtworkViewerImage = nextArtworkViewerImage;
window.openUploadModal = openUploadModal;
window.closeUploadModal = closeUploadModal;
window.handleUploadImageChange = handleUploadImageChange;
window.removeCurrentUploadImage = removeCurrentUploadImage;
window.prevUploadImage = prevUploadImage;
window.nextUploadImage = nextUploadImage;
window.goToUploadImage = goToUploadImage;
window.uploadPost = uploadPost;
window.handleUploadPostTypeChange = handleUploadPostTypeChange;
window.openEditArtworkModal = openEditArtworkModal;
window.closeEditArtworkModal = closeEditArtworkModal;
window.handleEditImageChange = handleEditImageChange;
window.prevEditImage = prevEditImage;
window.nextEditImage = nextEditImage;
window.goToEditImage = goToEditImage;
window.removeCurrentEditImage = removeCurrentEditImage;
window.updateArtwork = updateArtwork;
window.handleEditPostTypeChange = handleEditPostTypeChange;
window.initFeed = initFeed;
window.changeSortMode = changeSortMode;
window.openFeedDetail = openFeedDetail;
window.closeFeedDetail = closeFeedDetail;
window.focusFeedDetailComment = focusFeedDetailComment;
window.cancelFeedDetailComment = cancelFeedDetailComment;
window.submitFeedDetailComment = submitFeedDetailComment;
window.toggleFeedDetailLike = toggleFeedDetailLike;
window.toggleFeedDetailDislike = toggleFeedDetailDislike;
window.toggleFeedDetailSave = toggleFeedDetailSave;
window.setFeedDetailReplyTarget = setFeedDetailReplyTarget;
window.clearFeedDetailReplyTarget = clearFeedDetailReplyTarget;
window.toggleFeedDetailReplies = toggleFeedDetailReplies;
window.deleteFeedDetailComment = deleteFeedDetailComment;
window.prevFeedDetailFile = prevFeedDetailFile;
window.nextFeedDetailFile = nextFeedDetailFile;
window.toggleLike = toggleLike;
window.toggleDislike = toggleDislike;
window.toggleSave = toggleSave;
window.toggleComments = toggleComments;
window.submitComment = submitComment;
window.deleteArtworkComment = deleteArtworkComment;
window.updateFeedCommentCount = updateFeedCommentCount;
window.performSearch = performSearch;
window.clearSearch = clearSearch;
window.addTagFilter = addTagFilter;
window.searchTagSuggestions = searchTagSuggestions;
window.selectTagSuggestion = selectTagSuggestion;
window.toggleTagFilter = toggleTagFilter;
window.toggleSortFilter = toggleSortFilter;
window.toggleTagFilterDropdown = toggleTagFilterDropdown;
window.toggleFeedSearchPanel = toggleFeedSearchPanel;
window.toggleVideoMute = toggleVideoMute;
window.toggleVideoPlayPause = toggleVideoPlayPause;
window.showVideoControls = showVideoControls;
window.hideVideoControls = hideVideoControls;
window.seekVideo = seekVideo;
window.seekVideoByClick = seekVideoByClick;
window.prevFeedImage = prevFeedImage;
window.nextFeedImage = nextFeedImage;
window.openImageViewer = openImageViewer;
window.closeImageViewer = closeImageViewer;
window.prevViewerImage = prevViewerImage;
window.nextViewerImage = nextViewerImage;
window.initGallery = initGallery;
window.changeGallerySortMode = changeGallerySortMode;
window.toggleGallerySortFilter = toggleGallerySortFilter;
window.toggleGallerySearchPanel = toggleGallerySearchPanel;
window.performGallerySearch = performGallerySearch;
window.clearGallerySearch = clearGallerySearch;
window.addGalleryTagFilter = addGalleryTagFilter;
window.removeGalleryTagFilter = removeGalleryTagFilter;
window.searchGalleryTagSuggestions = searchGalleryTagSuggestions;
window.selectGalleryTagSuggestion = selectGalleryTagSuggestion;
window.toggleGalleryTagFilterDropdown = toggleGalleryTagFilterDropdown;
window.toggleGalleryLike = toggleGalleryLike;
window.toggleGalleryDislike = toggleGalleryDislike;
window.toggleGallerySave = toggleGallerySave;
window.prevGalleryImage = prevGalleryImage;
window.nextGalleryImage = nextGalleryImage;
window.openGalleryImageViewer = openGalleryImageViewer;
window.closeGalleryImageViewer = closeGalleryImageViewer;
window.switchToTab = switchToTab;
window.switchToOtherProfile = switchToOtherProfile;
window.initUserSearch = initUserSearch;
window.handleUserSearch = handleUserSearch;
window.selectUserById = selectUserById;
window.selectUser = selectUser;
window.clearUserSearch = clearUserSearch;
window.removeRecentSearch = removeRecentSearch;
window.validateNickname = validateNickname;
window.validateNicknameFormat = validateNicknameFormat;
window.checkNicknameAvailability = checkNicknameAvailability;
window.initMessages = initMessages;
window.updateUnreadCount = updateUnreadCount;
window.handleSendMessageFromProfile = handleSendMessageFromProfile;
window.toggleLogo = toggleLogo;
window.toggleWelcomeLogo = toggleWelcomeLogo;
window.toggleDarkMode = toggleDarkMode;
window.recalculateAllTagCounts = recalculateAllTagCounts;
window.debugTag = debugTag;
window.checkAllTags = checkAllTags;

// ========== OAuth 관련 유틸리티 ==========
function isOAuthReturn() {
    var h = window.location.hash || '';
    var q = window.location.search || '';
    return /access_token|refresh_token|code=/.test(h + q);
}

function clearOAuthHash() {
    if (!isOAuthReturn()) return;
    try {
        var u = new URL(window.location.href);
        u.hash = '';
        u.search = '';
        history.replaceState(null, '', u.pathname + (u.pathname.endsWith('/') ? '' : '/'));
    } catch (e) {}
}

function bindLoginButton() {
    var btn = document.getElementById('btn-login');
    if (!btn) return;
    btn.removeAttribute('onclick');
    btn.addEventListener('click', function () {
        signInWithGoogle();
    });
}

// ========== 앱 초기화 ==========
document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (typeof window._supabase === 'undefined' || window._supabase === null) {
            throw new Error('Supabase 클라이언트가 로드되지 않았습니다. supabase-config.js를 확인하세요.');
        }

        // 템플릿 시스템 초기화 (모달들을 동적으로 로드)
        await initializeTemplates();

        bindLoginButton();
        initTabs();
        initLogoToggle();
        initDarkMode();

        if (isOAuthReturn()) {
            await new Promise(function (r) { setTimeout(r, 100); });
        }
        
        const { data: { session } } = await window._supabase.auth.getSession();
        updateAuthUI(session);
        await updateProfileInfo();
        
        // 작품관이 첫 화면이므로 초기화
        await initGallery();
        
        // 웰컴 모달 표시 (비로그인 사용자에게만)
        if (!session) {
            checkAndShowWelcomeModal();
        }
        
        clearOAuthHash();
    } catch (err) {
        console.error('초기화 에러:', err);
        alert('앱 초기화 중 오류가 발생했습니다: ' + err.message);
    }
});

// ========== 인증 상태 변경 감지 ==========
if (typeof window._supabase !== 'undefined' && window._supabase) {
    window._supabase.auth.onAuthStateChange(async function (event, session) {
        updateAuthUI(session);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            updateProfileInfo();
        }
    });
}
