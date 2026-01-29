/**
 * 팔로워/팔로잉 모달 템플릿
 */
import { createModalHeader } from '../shared/components.js';

export function createFollowersModal() {
    return `
    <!-- 팔로워 모달 -->
    <div id="followers-modal" class="modal" style="display:none;">
        <div class="modal-content follow-modal-content">
            ${createModalHeader('팔로워', 'closeFollowersModal()')}
            <div class="modal-body">
                <div id="followers-list" class="follow-list"></div>
            </div>
        </div>
    </div>
    `;
}

export function createFollowingModal() {
    return `
    <!-- 팔로잉 모달 -->
    <div id="following-modal" class="modal" style="display:none;">
        <div class="modal-content follow-modal-content">
            ${createModalHeader('팔로잉', 'closeFollowingModal()')}
            <div class="modal-body">
                <div id="following-list" class="follow-list"></div>
            </div>
        </div>
    </div>
    `;
}
