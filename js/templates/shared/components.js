/**
 * 재사용 가능한 UI 컴포넌트 모음
 */

import { Icons } from './icons.js';

/**
 * 모달 헤더 컴포넌트
 * @param {string} title - 모달 제목
 * @param {string} closeFunction - 닫기 버튼 onclick 함수명
 */
export function createModalHeader(title, closeFunction) {
    return `
        <div class="modal-header">
            <h2>${title}</h2>
            <button class="modal-close" onclick="${closeFunction}">
                ${Icons.close()}
            </button>
        </div>
    `;
}

/**
 * 모달 푸터 컴포넌트
 * @param {string} cancelFunction - 취소 버튼 onclick 함수명
 * @param {string} saveFunction - 저장 버튼 onclick 함수명
 * @param {string} saveLabel - 저장 버튼 텍스트 (기본값: "저장")
 */
export function createModalFooter(cancelFunction, saveFunction, saveLabel = '저장') {
    return `
        <div class="modal-footer">
            <button class="modal-btn cancel" onclick="${cancelFunction}">취소</button>
            <button class="modal-btn save" onclick="${saveFunction}">${saveLabel}</button>
        </div>
    `;
}

/**
 * 게시 위치 선택 라디오 버튼 (작품관/자유게시판/비공개)
 * @param {string} name - input name 속성
 * @param {string} changeFunction - onchange 함수명
 */
export function createPostTypeSelector(name, changeFunction) {
    return `
        <div class="edit-form-group">
            <label>게시 위치</label>
            <div class="post-type-options">
                <label class="radio-option">
                    <input type="radio" name="${name}" value="gallery" checked onchange="${changeFunction}">
                    <span class="radio-label">
                        ${Icons.gallery()}
                        작품관
                    </span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="${name}" value="feed" onchange="${changeFunction}">
                    <span class="radio-label">
                        ${Icons.message()}
                        자유게시판
                    </span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="${name}" value="private" onchange="${changeFunction}">
                    <span class="radio-label">
                        ${Icons.lock()}
                        비공개
                    </span>
                </label>
            </div>
            <small class="form-hint">'작품관'은 바이브코딩 결과물을 게시하는 공간입니다.</small>
        </div>
    `;
}

/**
 * 이미지 업로드 섹션 (캐러셀 + 업로드 버튼)
 * @param {string} prefix - ID 접두사 ('upload' 또는 'edit')
 * @param {string} prevFunction - 이전 이미지 함수명
 * @param {string} nextFunction - 다음 이미지 함수명
 * @param {string} changeFunction - 파일 변경 핸들러 함수명
 * @param {string} removeFunction - 현재 파일 제거 함수명
 * @param {string} selectButtonText - 선택 버튼 텍스트
 * @param {string} acceptTypes - accept 속성 (기본값: 이미지/비디오/오디오)
 */
export function createImageUploadSection(
    prefix, 
    prevFunction, 
    nextFunction, 
    changeFunction, 
    removeFunction,
    selectButtonText = '이미지 선택',
    acceptTypes = 'image/*,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4'
) {
    return `
        <div class="upload-image-section">
            <!-- 이미지 미리보기 캐러셀 -->
            <div class="upload-image-carousel" id="${prefix}-image-carousel">
                <div class="upload-image-preview" id="${prefix}-image-preview">
                    ${Icons.image(60, 60)}
                    <p>이미지를 선택하세요 (최대 10장)</p>
                </div>
                <!-- 캐러셀 네비게이션 버튼 -->
                <button class="carousel-nav prev" onclick="${prevFunction}" style="display:none;">
                    ${Icons.chevronLeft()}
                </button>
                <button class="carousel-nav next" onclick="${nextFunction}" style="display:none;">
                    ${Icons.chevronRight()}
                </button>
                <!-- 이미지 인디케이터 -->
                <div class="carousel-indicators" id="${prefix}-carousel-indicators"></div>
            </div>
            
            <input type="file" id="${prefix}-image-input" accept="${acceptTypes}" multiple style="display:none;" onchange="${changeFunction}">
            <div class="upload-image-actions">
                <button class="upload-select-btn" onclick="document.getElementById('${prefix}-image-input').click()">
                    ${Icons.upload()}
                    <span id="${prefix}-select-text">${selectButtonText}</span>
                </button>
                <button class="upload-remove-btn" onclick="${removeFunction}" style="display:none;">
                    ${Icons.trash()}
                    현재 파일 제거
                </button>
            </div>
        </div>
    `;
}

/**
 * 폼 그룹 - 텍스트 입력
 * @param {string} id - input ID
 * @param {string} label - 라벨 텍스트
 * @param {string} placeholder - placeholder 텍스트
 * @param {number} maxlength - 최대 길이
 * @param {string} hint - 힌트 텍스트
 */
export function createTextInput(id, label, placeholder, maxlength, hint) {
    return `
        <div class="edit-form-group">
            <label for="${id}">${label}</label>
            <input type="text" id="${id}" placeholder="${placeholder}" maxlength="${maxlength}">
            <small class="form-hint">${hint}</small>
        </div>
    `;
}

/**
 * 폼 그룹 - URL 입력
 * @param {string} id - input ID
 * @param {string} label - 라벨 텍스트
 * @param {string} placeholder - placeholder 텍스트
 * @param {number} maxlength - 최대 길이
 * @param {string} hint - 힌트 텍스트
 */
export function createUrlInput(id, label, placeholder, maxlength, hint) {
    return `
        <div class="edit-form-group">
            <label for="${id}">${label}</label>
            <input type="url" id="${id}" placeholder="${placeholder}" maxlength="${maxlength}">
            <small class="form-hint">${hint}</small>
        </div>
    `;
}

/**
 * 폼 그룹 - 텍스트 영역 (Textarea)
 * @param {string} id - textarea ID
 * @param {string} label - 라벨 텍스트
 * @param {string} placeholder - placeholder 텍스트
 * @param {number} maxlength - 최대 길이
 * @param {number} rows - 행 수
 * @param {string} hint - 힌트 텍스트
 */
export function createTextarea(id, label, placeholder, maxlength, rows, hint) {
    return `
        <div class="edit-form-group">
            <label for="${id}">${label}</label>
            <textarea id="${id}" placeholder="${placeholder}" maxlength="${maxlength}" rows="${rows}"></textarea>
            <small class="form-hint">${hint}</small>
        </div>
    `;
}

/**
 * 태그 입력 폼 그룹
 * @param {string} id - input ID
 */
export function createTagInput(id) {
    return `
        <div class="edit-form-group">
            <label for="${id}">태그 (선택사항)</label>
            <input type="text" id="${id}" placeholder="#일러스트 #3D #애니메이션 (최대 10개)" maxlength="200">
            <small class="form-hint">태그는 #으로 시작하며 공백으로 구분합니다. (예: #일러스트 #3D)</small>
        </div>
    `;
}
