/**
 * @file artwork.js
 * @description 작품 통합 모듈 - 리팩토링 완료
 * 
 * 구조:
 * - artwork/artworkGrid.js: 작품 그리드 렌더링
 * - artwork/artworkDetail.js: 상세보기 모달 및 캐러셀
 * - artwork/artworkComments.js: 댓글 관리
 */

// ========== 하위 모듈 import ==========
import { renderArtworksGrid } from './artwork/artworkGrid.js';
import { 
    openArtworkDetail,
    closeArtworkDetail,
    prevArtworkImage,
    nextArtworkImage,
    goToArtworkImage,
    deleteArtwork,
    getCurrentArtworkData,
    getCurrentArtworkId,
    currentArtworkData,
    openArtworkImageViewer,
    closeArtworkImageViewer,
    prevArtworkViewerImage,
    nextArtworkViewerImage
} from './artwork/artworkDetail.js';
import { 
    loadArtworkComments,
    submitArtworkComment,
    setArtworkReplyTarget,
    clearArtworkReplyTarget,
    toggleArtworkReplies,
    deleteArtworkCommentFromModal
} from './artwork/artworkComments.js';

// ========== 전역 함수 등록 (window 객체) ==========
// 댓글 관련 함수들을 window에 등록 (HTML onclick에서 사용)
window.submitArtworkComment = submitArtworkComment;
window.setArtworkReplyTarget = setArtworkReplyTarget;
window.clearArtworkReplyTarget = clearArtworkReplyTarget;
window.toggleArtworkReplies = toggleArtworkReplies;
window.deleteArtworkCommentFromModal = deleteArtworkCommentFromModal;
window.loadArtworkComments = loadArtworkComments;
window.getCurrentArtworkId = getCurrentArtworkId;
window.openArtworkImageViewer = openArtworkImageViewer;
window.closeArtworkImageViewer = closeArtworkImageViewer;
window.prevArtworkViewerImage = prevArtworkViewerImage;
window.nextArtworkViewerImage = nextArtworkViewerImage;

// ========== 모든 함수 export ==========
export {
    // Grid
    renderArtworksGrid,
    
    // Detail
    openArtworkDetail,
    closeArtworkDetail,
    prevArtworkImage,
    nextArtworkImage,
    goToArtworkImage,
    deleteArtwork,
    getCurrentArtworkData,
    getCurrentArtworkId,
    currentArtworkData,
    openArtworkImageViewer,
    closeArtworkImageViewer,
    prevArtworkViewerImage,
    nextArtworkViewerImage,
    
    // Comments
    loadArtworkComments,
    submitArtworkComment,
    setArtworkReplyTarget,
    clearArtworkReplyTarget,
    toggleArtworkReplies,
    deleteArtworkCommentFromModal,
    deleteArtworkCommentFromModal as deleteArtworkComment  // alias for backward compatibility
};
