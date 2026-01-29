/**
 * 커뮤니티 글쓰기 모달 템플릿
 */
import { createModalHeader, createModalFooter, createTextInput, createTextarea } from '../shared/components.js';

export function createCommunityWriteModal() {
    return `
    <!-- 커뮤니티 글쓰기 모달 -->
    <div id="community-write-modal" class="modal" style="display:none;">
        <div class="modal-content">
            ${createModalHeader('게시글 작성', 'closeCommunityWriteModal()')}
            <div class="modal-body">
                ${createTextInput('community-post-title', '제목', '제목을 입력하세요', 100, '')}
                ${createTextarea('community-post-content', '내용', '내용을 입력하세요', 5000, 10, '')}
                <div class="edit-form-group">
                    <label>작성자 표시</label>
                    <div class="author-type-selector">
                        <label class="author-type-option">
                            <input type="radio" name="author-type" value="nickname" checked>
                            <span>고유 ID (닉네임)</span>
                        </label>
                        <label class="author-type-option">
                            <input type="radio" name="author-type" value="anonymous">
                            <span>익명</span>
                        </label>
                    </div>
                    <small class="form-hint">익명 선택 시 '익명'으로 표시됩니다</small>
                </div>
            </div>
            ${createModalFooter('closeCommunityWriteModal()', 'submitCommunityPost()', '게시하기')}
        </div>
    </div>
    `;
}
