/**
 * 프로필 편집 모달 템플릿
 */
import { createModalHeader, createModalFooter, createTextarea } from '../shared/components.js';
import { Icons } from '../shared/icons.js';

export function createProfileEditModal() {
    return `
    <!-- 프로필 편집 모달 -->
    <div id="profile-edit-modal" class="modal" style="display:none;">
        <div class="modal-content">
            ${createModalHeader('프로필 편집', 'closeProfileEditModal()')}
            <div class="modal-body">
                <div class="edit-avatar-section">
                    <div class="edit-avatar-preview" id="edit-avatar-preview">
                        ${Icons.user(40, 40)}
                    </div>
                    <div class="edit-avatar-actions">
                        <input type="file" id="avatar-upload" accept="image/*" style="display:none;" onchange="handleAvatarChange(event)">
                        <button class="avatar-change-btn" onclick="document.getElementById('avatar-upload').click()">사진 변경</button>
                        <button class="avatar-remove-btn" onclick="removeAvatar()">현재 사진 삭제</button>
                    </div>
                </div>
                <div class="edit-form-group">
                    <label for="edit-nickname">닉네임 (고유 ID)</label>
                    <input type="text" id="edit-nickname" placeholder="닉네임을 입력하세요 (3-20자)" maxlength="20">
                    <small class="form-hint">영문, 숫자, 한글, 언더스코어(_)만 사용 가능 • 중복 불가</small>
                    <div class="nickname-limit-notice">
                        ${Icons.info()}
                        <span>닉네임은 <strong>30일 동안 최대 2번</strong>까지만 변경할 수 있습니다.</span>
                    </div>
                </div>
                ${createTextarea('edit-bio', '소개', '자신을 소개하는 글을 작성하세요', 150, 3, '최대 150자까지 입력 가능합니다.')}
            </div>
            ${createModalFooter('closeProfileEditModal()', 'saveProfileChanges()')}
        </div>
    </div>
    `;
}
