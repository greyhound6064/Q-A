/**
 * 커스텀 상태 모달 템플릿
 */
import { createModalHeader, createModalFooter } from '../shared/components.js';

export function createCustomStatusModal() {
    return `
    <!-- 커스텀 상태 모달 -->
    <div id="custom-status-modal" class="modal" style="display:none;">
        <div class="modal-content" style="max-width: 500px;">
            ${createModalHeader('상태 직접 입력', 'closeCustomStatusModal()')}
            <div class="modal-body">
                <div class="form-group">
                    <label for="custom-status-text">상태 메시지</label>
                    <input type="text" id="custom-status-text" class="form-input" placeholder="예: 새로운 프로젝트 시작!" maxlength="30">
                    <small class="form-hint">최대 30자까지 입력 가능합니다.</small>
                </div>
                <div class="form-group">
                    <label>이모지 선택</label>
                    <div class="emoji-grid" id="emoji-grid">
                        <button class="emoji-option" data-emoji="😴" onclick="selectEmoji('😴')">😴</button>
                        <button class="emoji-option" data-emoji="💭" onclick="selectEmoji('💭')">💭</button>
                        <button class="emoji-option" data-emoji="🔥" onclick="selectEmoji('🔥')">🔥</button>
                        <button class="emoji-option" data-emoji="💡" onclick="selectEmoji('💡')">💡</button>
                        <button class="emoji-option" data-emoji="🎨" onclick="selectEmoji('🎨')">🎨</button>
                        <button class="emoji-option" data-emoji="🎵" onclick="selectEmoji('🎵')">🎵</button>
                        <button class="emoji-option" data-emoji="📚" onclick="selectEmoji('📚')">📚</button>
                        <button class="emoji-option" data-emoji="☕" onclick="selectEmoji('☕')">☕</button>
                        <button class="emoji-option" data-emoji="🌙" onclick="selectEmoji('🌙')">🌙</button>
                        <button class="emoji-option" data-emoji="⚡" onclick="selectEmoji('⚡')">⚡</button>
                        <button class="emoji-option" data-emoji="🚀" onclick="selectEmoji('🚀')">🚀</button>
                        <button class="emoji-option" data-emoji="💻" onclick="selectEmoji('💻')">💻</button>
                        <button class="emoji-option" data-emoji="🎯" onclick="selectEmoji('🎯')">🎯</button>
                        <button class="emoji-option" data-emoji="✨" onclick="selectEmoji('✨')">✨</button>
                        <button class="emoji-option" data-emoji="🌟" onclick="selectEmoji('🌟')">🌟</button>
                        <button class="emoji-option" data-emoji="🎉" onclick="selectEmoji('🎉')">🎉</button>
                    </div>
                </div>
                <div class="custom-status-preview">
                    <div class="preview-label">미리보기</div>
                    <div class="preview-badge">
                        <span class="preview-emoji" id="preview-emoji">😴</span>
                        <span class="preview-text" id="preview-text">상태 메시지를 입력하세요</span>
                    </div>
                </div>
            </div>
            ${createModalFooter('closeCustomStatusModal()', 'saveCustomStatus()', '추가')}
        </div>
    </div>
    `;
}
