/**
 * @file postDetail.js
 * @description 통합 게시물 상세보기 (작품 + 자유 게시판)
 * 
 * 이제 모든 게시물 타입이 openArtworkDetail을 통해 단일 모달을 사용합니다.
 * 이 파일은 하위 호환성을 위한 래퍼 함수들을 제공합니다.
 */

/**
 * 피드 상세보기 열기 (통합 모달 사용)
 * @param {string} postId - 게시물 ID
 * @param {boolean} showComments - 댓글 포커스 여부
 * @param {Array} feedPosts - 로컬 게시물 배열 (선택사항)
 * 
 * 이제 openArtworkDetail을 호출하여 통합 모달을 사용합니다.
 */
export async function openFeedDetail(postId, showComments = false, feedPosts = []) {
    // 통합 모달 사용: openArtworkDetail 호출
    if (window.openArtworkDetail) {
        return await window.openArtworkDetail(postId, showComments, feedPosts);
    }
    
    console.error('openArtworkDetail 함수를 찾을 수 없습니다.');
}

/**
 * 댓글 토글 (상세보기 열기)
 */
export async function toggleComments(artworkId, feedPosts = []) {
    await openFeedDetail(artworkId, true, feedPosts);
}

/**
 * 피드 상세보기 모달 닫기 (통합 모달 사용)
 */
export function closeFeedDetail() {
    // 통합 모달 닫기: closeArtworkDetail 호출
    if (window.closeArtworkDetail) {
        window.closeArtworkDetail();
    }
}

// ========== 하위 호환성을 위한 전역 함수 별칭 ==========
// 이제 통합 모달을 사용하므로 기존 피드 전용 함수들은 작품 함수로 리다이렉트

/**
 * 피드 상세보기 좋아요 토글 (통합 모달 사용)
 */
export async function toggleFeedDetailLike(postId) {
    // 통합 모달의 좋아요 버튼 클릭
    const likeBtn = document.getElementById('artwork-detail-like-btn');
    if (likeBtn) {
        likeBtn.click();
    }
}

/**
 * 피드 상세보기 싫어요 토글 (통합 모달 사용)
 */
export async function toggleFeedDetailDislike(postId) {
    // 통합 모달의 싫어요 버튼 클릭
    const dislikeBtn = document.getElementById('artwork-detail-dislike-btn');
    if (dislikeBtn) {
        dislikeBtn.click();
    }
}

/**
 * 피드 상세보기 저장 토글 (통합 모달 사용)
 */
export async function toggleFeedDetailSave(postId) {
    // 통합 모달의 저장 버튼 클릭
    const saveBtn = document.getElementById('artwork-detail-save-btn');
    if (saveBtn) {
        saveBtn.click();
    }
}

/**
 * 피드 게시물 수정 모달 열기 (통합)
 */
export async function openEditFeedPost(postId) {
    // 작품 수정 모달 사용
    if (window.openEditArtworkModal) {
        await window.openEditArtworkModal();
    }
}

/**
 * 피드 게시물 삭제 (통합)
 */
export async function deleteFeedPost(postId) {
    // 작품 삭제 함수 사용
    if (window.deleteArtwork) {
        await window.deleteArtwork();
    }
}

// 전역 함수로 노출
window.openEditFeedPost = openEditFeedPost;
window.deleteFeedPost = deleteFeedPost;
window.toggleFeedDetailLike = toggleFeedDetailLike;
window.toggleFeedDetailDislike = toggleFeedDetailDislike;
window.toggleFeedDetailSave = toggleFeedDetailSave;
