/**
 * 작품 업로드 모달 템플릿
 */
import { createModalHeader, createModalFooter, createPostTypeSelector, createImageUploadSection, createTextInput, createTextarea, createUrlInput, createTagInput } from '../shared/components.js';

export function createUploadModal() {
    return `
    <!-- 작품 업로드 모달 -->
    <div id="upload-modal" class="modal" style="display:none;">
        <div class="modal-content upload-modal-content">
            ${createModalHeader('작품 업로드', 'closeUploadModal()')}
            <div class="modal-body">
                ${createPostTypeSelector('upload-post-type', 'handleUploadPostTypeChange()')}
                ${createImageUploadSection(
                    'upload',
                    'prevUploadImage()',
                    'nextUploadImage()',
                    'handleUploadImageChange(event)',
                    'removeCurrentUploadImage()',
                    '이미지 선택'
                )}
                ${createTextInput('upload-title', '제목', '작품 제목을 입력하세요', 100, '최대 100자까지 입력 가능합니다.')}
                ${createTextarea('upload-content', '설명', '작품에 대한 설명을 작성하세요', 1000, 5, '최대 1000자까지 입력 가능합니다.')}
                ${createUrlInput('upload-vibe-link', '작품 링크', 'https://vibe.dev/...', 500, '바이브코딩 결과물 링크를 입력하세요.')}
                ${createTagInput('upload-tags')}
            </div>
            ${createModalFooter('closeUploadModal()', 'uploadPost()', '게시하기')}
        </div>
    </div>
    `;
}
