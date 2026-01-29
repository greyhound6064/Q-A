/**
 * 작품 수정 모달 템플릿
 */
import { createModalHeader, createModalFooter, createPostTypeSelector, createImageUploadSection, createTextInput, createTextarea, createUrlInput, createTagInput } from '../shared/components.js';

export function createEditArtworkModal() {
    return `
    <!-- 작품 수정 모달 -->
    <div id="edit-artwork-modal" class="modal" style="display:none;">
        <div class="modal-content upload-modal-content">
            ${createModalHeader('작품 수정', 'closeEditArtworkModal()')}
            <div class="modal-body">
                ${createPostTypeSelector('edit-post-type', 'handleEditPostTypeChange()')}
                ${createImageUploadSection(
                    'edit',
                    'prevEditImage()',
                    'nextEditImage()',
                    'handleEditImageChange(event)',
                    'removeCurrentEditImage()',
                    '이미지 변경',
                    'image/*'
                )}
                ${createTextInput('edit-artwork-title', '제목', '작품 제목을 입력하세요', 100, '최대 100자까지 입력 가능합니다.')}
                ${createTextarea('edit-artwork-content', '설명', '작품에 대한 설명을 작성하세요', 1000, 5, '최대 1000자까지 입력 가능합니다.')}
                ${createUrlInput('edit-vibe-link', '작품 링크', 'https://vibe.dev/...', 500, '바이브코딩 결과물 링크를 입력하세요.')}
                ${createTagInput('edit-tags')}
            </div>
            ${createModalFooter('closeEditArtworkModal()', 'updateArtwork()', '수정 완료')}
        </div>
    </div>
    `;
}
