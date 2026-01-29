/**
 * 작품 상세보기 모달 템플릿
 */
export function createArtworkDetailModal() {
    return `
    <!-- 작품 상세보기 모달 -->
    <div id="artwork-detail-modal" class="modal artwork-modal" style="display:none;">
        <div class="artwork-modal-content">
            <button class="modal-close artwork-close" onclick="closeArtworkDetail()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            
            <div class="artwork-modal-body">
                <!-- 왼쪽: 이미지 캐러셀 -->
                <div class="artwork-image-section">
                    <div class="artwork-carousel">
                        <!-- 미디어 컨텐츠 영역 -->
                        <div id="artwork-carousel-content">
                            <img id="artwork-detail-image" src="" alt="작품 이미지">
                        </div>
                        <!-- 캐러셀 네비게이션 -->
                        <button class="artwork-carousel-nav prev" onclick="prevArtworkImage()" style="display:none;">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <button class="artwork-carousel-nav next" onclick="nextArtworkImage()" style="display:none;">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                        <!-- 이미지 인디케이터 -->
                        <div class="artwork-carousel-indicators" id="artwork-carousel-indicators"></div>
                    </div>
                </div>
                
                <!-- 오른쪽: 정보 및 댓글 -->
                <div class="artwork-info-section">
                    <!-- 작성자 정보 -->
                    <div class="artwork-author">
                        <div class="artwork-author-avatar" id="artwork-author-avatar">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <div class="artwork-author-info">
                            <span class="artwork-author-name" id="artwork-author-name">작성자</span>
                            <span class="artwork-date" id="artwork-date">방금 전</span>
                        </div>
                        <div class="artwork-menu-container" id="artwork-menu-container" style="display:none;">
                            <button class="artwork-menu-btn" id="artwork-menu-btn" onclick="toggleArtworkMenu(event)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="1"></circle>
                                    <circle cx="12" cy="5" r="1"></circle>
                                    <circle cx="12" cy="19" r="1"></circle>
                                </svg>
                            </button>
                            <div class="artwork-menu-dropdown" id="artwork-menu-dropdown" style="display:none;">
                                <button class="artwork-menu-item" onclick="openEditArtworkModal()">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                    <span>게시물 수정</span>
                                </button>
                                <button class="artwork-menu-item delete" onclick="deleteArtwork()">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                    <span>게시물 삭제</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 제목 및 설명 -->
                    <div class="artwork-content">
                        <h2 class="artwork-title" id="artwork-detail-title">작품 제목</h2>
                        <p class="artwork-description" id="artwork-detail-description">작품 설명이 여기에 표시됩니다.</p>
                        <div class="artwork-tags" id="artwork-detail-tags" style="display:none;"></div>
                        <div class="artwork-vibe-link" id="artwork-vibe-link" style="display:none;">
                            <span class="artwork-vibe-link-label">작품 링크:</span>
                            <a href="" target="_blank" rel="noopener noreferrer" id="artwork-vibe-link-url" class="artwork-vibe-link-text"></a>
                        </div>
                    </div>
                    
                    <!-- 액션 버튼 -->
                    <div class="artwork-actions">
                        <button class="artwork-action-btn like-btn" id="artwork-detail-like-btn">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                            </svg>
                            <span id="artwork-detail-like-count">0</span>
                        </button>
                        <button class="artwork-action-btn dislike-btn" id="artwork-detail-dislike-btn">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
                            </svg>
                        </button>
                        <button class="artwork-action-btn save-btn" id="artwork-detail-save-btn">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <!-- 댓글 섹션 -->
                    <div class="artwork-comments-section" id="artwork-comments-section">
                        <div class="artwork-comments-loading">댓글을 불러오는 중...</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
}
