/**
 * 커뮤니티 상세보기 모달 템플릿
 */
export function createCommunityDetailModal() {
    return `
    <!-- 커뮤니티 상세보기 모달 -->
    <div id="community-detail-modal" class="modal" style="display:none;">
        <div class="modal-content community-detail-modal-content">
            <div class="community-detail-wrapper">
                <button class="community-detail-close-btn" onclick="closeCommunityDetailModal()">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <!-- 게시글 헤더 -->
                <div class="community-detail-header">
                    <h1 class="community-detail-title" id="community-detail-title">게시글 제목</h1>
                    <div class="community-detail-meta">
                        <div class="meta-left">
                            <span class="meta-author">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                <span id="community-detail-author">작성자</span>
                            </span>
                            <span class="meta-divider">|</span>
                            <span class="meta-date">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                <span id="community-detail-date">2024-01-01</span>
                            </span>
                            <span class="meta-divider">|</span>
                            <span class="meta-views">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                                조회 <strong id="community-detail-views">0</strong>
                            </span>
                        </div>
                        <div class="meta-right" id="community-manage-section" style="display:none;">
                            <button class="meta-action-btn edit-btn" onclick="editCommunityPost()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                                수정
                            </button>
                            <button class="meta-action-btn delete-btn" onclick="deleteCommunityPost()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                                삭제
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 게시글 내용 -->
                <div class="community-detail-body">
                    <div class="community-detail-content" id="community-detail-content">
                        게시글 내용이 여기에 표시됩니다.
                    </div>
                </div>
                
                <!-- 댓글 섹션 -->
                <div class="community-comments-wrapper">
                    <div class="comments-header">
                        <h3 class="comments-title">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            댓글 <span class="comments-count" id="community-comments-count">0</span>
                        </h3>
                    </div>
                    
                    <div class="community-comments-list" id="community-comments-list">
                        <!-- 댓글이 여기에 표시됩니다 -->
                    </div>
                    
                    <div class="community-comment-input-wrapper">
                        <!-- 답글 대상 표시 -->
                        <div id="community-reply-target" class="community-reply-target" style="display:none;">
                            <span class="reply-target-text">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9 14 4 9 9 4"></polyline>
                                    <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
                                </svg>
                                <span id="community-reply-target-name"></span>님에게 답글
                            </span>
                            <button class="reply-target-close" onclick="clearCommunityReplyTarget()">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        
                        <textarea id="community-comment-input" class="community-comment-textarea" placeholder="댓글을 입력하세요" rows="3" maxlength="500"></textarea>
                        
                        <div class="community-comment-footer">
                            <div class="comment-author-type">
                                <label class="comment-author-option">
                                    <input type="radio" name="comment-author-type" value="nickname">
                                    <span>고유 ID</span>
                                </label>
                                <label class="comment-author-option">
                                    <input type="radio" name="comment-author-type" value="anonymous" checked>
                                    <span>익명</span>
                                </label>
                            </div>
                            <button class="comment-submit-btn" onclick="submitCommunityComment()">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                                댓글 작성
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
}
