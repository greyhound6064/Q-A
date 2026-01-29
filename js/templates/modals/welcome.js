/**
 * 웰컴 모달 템플릿 (첫 방문자용)
 */
import { Icons } from '../shared/icons.js';

export function createWelcomeModal() {
    return `
    <!-- 웰컴 모달 -->
    <div id="welcome-modal" class="modal" style="display:none;">
        <div class="modal-content welcome-modal-content">
            <div class="welcome-terminal-header">
                <div class="welcome-terminal-buttons">
                    <span class="terminal-btn terminal-close"></span>
                    <span class="terminal-btn terminal-minimize"></span>
                    <span class="terminal-btn terminal-maximize"></span>
                </div>
                <div class="welcome-terminal-title">vibing-terminal</div>
            </div>
            <div class="modal-body">
                <div class="welcome-logo">
                    <img src="로고2_작은버전2.png" alt="VIBING Logo" id="welcome-logo-img" style="cursor: pointer;">
                </div>
                
                <div class="welcome-terminal-output">
                    <div class="terminal-line">
                        <span class="terminal-prompt">$</span>
                        <span class="terminal-command">welcome --info</span>
                    </div>
                    <div class="terminal-line terminal-feature">
                        <span class="feature-number">-</span>
                        <span class="feature-text">바이브코딩하는 사람들을 위한 공간입니다.</span>
                    </div>
                    <div class="terminal-line terminal-blank"></div>
                    
                    <div class="terminal-line">
                        <span class="terminal-prompt">$</span>
                        <span class="terminal-command">vibing --features</span>
                    </div>
                    <div class="welcome-features">
                        <div class="terminal-line terminal-feature">
                            <span class="feature-number">-</span>
                            <span class="feature-text">'나'의 작품을 기록하세요.</span>
                        </div>
                        <div class="terminal-line terminal-feature">
                            <span class="feature-number">-</span>
                            <span class="feature-text">'남'의 작품을 구경하세요.</span>
                        </div>
                        <div class="terminal-line terminal-feature">
                            <span class="feature-number">-</span>
                            <span class="feature-text">'바이브'를 교류하고 영감을 빌드하세요.</span>
                        </div>
                    </div>
                    <div class="terminal-line terminal-blank"></div>
                    
                    <div class="terminal-line">
                        <span class="terminal-prompt">$</span>
                        <span class="terminal-command">vibing --start</span>
                    </div>
                    <div class="terminal-line terminal-feature">
                        <span class="feature-number">-</span>
                        <span class="feature-text">시작 옵션을 선택하세요:</span>
                    </div>
                </div>

                <div class="welcome-actions">
                    <button class="welcome-btn browse" onclick="closeWelcomeModal()">
                        <span class="btn-prompt">></span>
                        둘러보기
                    </button>
                    <button class="welcome-btn login" onclick="handleWelcomeLogin()">
                        <span class="btn-prompt">></span>
                        구글로 로그인
                    </button>
                </div>

                <div class="welcome-footer">
                    <label class="welcome-checkbox">
                        <input type="checkbox" id="welcome-dont-show" onchange="handleWelcomeDontShow(this.checked)">
                        <span class="checkbox-text">다시 보지 않기</span>
                    </label>
                </div>
            </div>
        </div>
    </div>
    `;
}
