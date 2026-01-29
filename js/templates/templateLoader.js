/**
 * 템플릿 로더 시스템
 * HTML 템플릿을 동적으로 로드하고 DOM에 추가하는 유틸리티
 */

class TemplateLoader {
    constructor() {
        this.loadedTemplates = new Map();
    }

    /**
     * 템플릿 함수를 등록
     * @param {string} name - 템플릿 이름
     * @param {Function} templateFn - 템플릿 생성 함수
     */
    register(name, templateFn) {
        this.loadedTemplates.set(name, templateFn);
    }

    /**
     * 템플릿을 DOM에 추가 (중복 방지)
     * @param {string} name - 템플릿 이름
     * @param {string} containerId - 컨테이너 ID (선택사항)
     * @param {boolean} forceReload - 강제 재로드 여부
     * @returns {HTMLElement} 생성된 엘리먼트
     */
    load(name, containerId = null, forceReload = false) {
        const templateFn = this.loadedTemplates.get(name);
        if (!templateFn) {
            console.error(`Template "${name}" not found`);
            return null;
        }

        // 이미 DOM에 있는지 확인
        const existingElement = document.getElementById(this.getElementId(name));
        if (existingElement && !forceReload) {
            return existingElement;
        }

        // 기존 요소가 있고 강제 재로드인 경우 제거
        if (existingElement && forceReload) {
            existingElement.remove();
        }

        // 템플릿 생성
        const html = templateFn();
        const container = containerId ? document.getElementById(containerId) : document.body;
        
        // DOM에 추가
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html.trim();
        const element = tempDiv.firstElementChild;
        
        container.appendChild(element);
        return element;
    }

    /**
     * 템플릿을 미리 로드 (초기화 시)
     * @param {Array<string>} names - 로드할 템플릿 이름 배열
     */
    preload(names) {
        names.forEach(name => this.load(name));
    }

    /**
     * 템플릿의 기본 엘리먼트 ID 가져오기
     * @param {string} name - 템플릿 이름
     * @returns {string} 엘리먼트 ID
     */
    getElementId(name) {
        // 템플릿 이름을 ID로 변환 (예: 'profile-edit' -> 'profile-edit-modal')
        return `${name}-modal`;
    }

    /**
     * 모든 템플릿 제거 (테스트용)
     */
    clear() {
        this.loadedTemplates.forEach((_, name) => {
            const element = document.getElementById(this.getElementId(name));
            if (element) {
                element.remove();
            }
        });
        this.loadedTemplates.clear();
    }
}

// 싱글톤 인스턴스 생성
export const templateLoader = new TemplateLoader();

/**
 * 템플릿 초기화 - 모달 템플릿만 등록
 * (탭 컨텐츠는 index.html에 그대로 유지)
 */
export async function initializeTemplates() {
    // 동적 import로 모달 템플릿 모듈 로드
    const modalModules = await Promise.all([
        import('./modals/profileEdit.js'),
        import('./modals/upload.js'),
        import('./modals/artworkDetail.js'),
        import('./modals/editArtwork.js'),
        import('./modals/followers.js'),
        import('./modals/customStatus.js'),
        import('./modals/welcome.js')
    ]);

    // 모달 템플릿 등록
    templateLoader.register('profile-edit', modalModules[0].createProfileEditModal);
    templateLoader.register('upload', modalModules[1].createUploadModal);
    templateLoader.register('artwork-detail', modalModules[2].createArtworkDetailModal);
    templateLoader.register('edit-artwork', modalModules[3].createEditArtworkModal);
    templateLoader.register('followers', modalModules[4].createFollowersModal);
    templateLoader.register('following', modalModules[4].createFollowingModal);
    templateLoader.register('custom-status', modalModules[5].createCustomStatusModal);
    templateLoader.register('welcome', modalModules[6].createWelcomeModal);

    // 모든 모달 미리 로드
    templateLoader.preload([
        'profile-edit',
        'upload',
        'artwork-detail',
        'edit-artwork',
        'followers',
        'following',
        'custom-status',
        'welcome'
    ]);

    console.log('✅ All templates initialized');
}
