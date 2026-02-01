/**
 * @file edit.js
 * @description 작품 수정 모달 및 기능
 */

import { getCurrentArtworkData } from './artwork.js';
import { updateArtworkTags } from './services/tagService.js';
import { showLoginRequiredModal } from './utils/errorHandler.js';
import { historyManager } from './utils/historyManager.js';

// ========== 전역 변수 ==========
let editArtworkImages = [];
let editNewImages = [];
let currentEditImageIndex = 0;

// ========== 미디어 타입 검증 ==========
const SUPPORTED_MEDIA = {
    image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/webm', 'video/quicktime'], // quicktime = .mov
    audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4'] // mp4 = .m4a
};

function getMediaType(file) {
    // File 객체인 경우
    if (file instanceof File || file instanceof Blob) {
        for (const [type, mimes] of Object.entries(SUPPORTED_MEDIA)) {
            if (mimes.includes(file.type)) {
                return type;
            }
        }
        return null;
    }
    // URL 문자열인 경우 (기존 파일) - 확장자로 판단
    if (typeof file === 'string') {
        const ext = file.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
        if (['mp4', 'webm', 'mov'].includes(ext)) return 'video';
        if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio';
        return 'image'; // 기본값
    }
    return null;
}

function isValidMediaFile(file) {
    return getMediaType(file) !== null;
}

// ========== 기존 태그 로드 ==========
async function loadExistingTags(artworkId, tagsInput) {
    try {
        const { data: artworkTags } = await window._supabase
            .from('artwork_tags')
            .select('tags(name)')
            .eq('artwork_id', artworkId);
        
        if (artworkTags && artworkTags.length > 0) {
            const tagNames = artworkTags
                .map(item => item.tags?.name)
                .filter(name => name)
                .map(name => `#${name}`)
                .join(' ');
            tagsInput.value = tagNames;
        }
    } catch (err) {
        console.error('태그 로드 에러:', err);
    }
}

// ========== 태그 저장 함수 ==========
async function saveTags(artworkId, tagsString) {
    try {
        // 새 태그 파싱
        const tagNames = tagsString
            .split(/\s+/)
            .filter(tag => tag.startsWith('#') && tag.length > 1)
            .map(tag => tag.substring(1).toLowerCase())
            .slice(0, 10);
        
        // tagService 사용 (기존 태그 삭제 및 새 태그 추가)
        await updateArtworkTags(artworkId, tagNames);
    } catch (err) {
        console.error('태그 저장 에러:', err);
    }
}

// ========== 작품 수정 모달 ==========
export function openEditArtworkModal() {
    const currentArtworkData = getCurrentArtworkData();
    if (!currentArtworkData) return;
    
    openEditArtworkModalWithData(currentArtworkData, 'artwork-detail-modal');
}

/**
 * 데이터를 직접 받아서 수정 모달 열기
 */
export function openEditArtworkModalWithData(artworkData, sourceModalId = null) {
    if (!artworkData) return;
    
    const modal = document.getElementById('edit-artwork-modal');
    if (!modal) return;
    
    // 원본 모달 숨기기
    if (sourceModalId) {
        const sourceModal = document.getElementById(sourceModalId);
        if (sourceModal) {
            sourceModal.style.display = 'none';
        }
    }
    
    // 피드 상세보기 모달 숨기기
    const feedDetailModal = document.getElementById('feed-detail-modal');
    if (feedDetailModal) {
        feedDetailModal.style.display = 'none';
    }
    
    // 작품 상세보기 모달 숨기기
    const artworkDetailModal = document.getElementById('artwork-detail-modal');
    if (artworkDetailModal) {
        artworkDetailModal.style.display = 'none';
    }
    
    // 기존 이미지 설정 (파일이 없을 수도 있음)
    const hasFiles = (artworkData.images && artworkData.images.length > 0) || artworkData.image_url;
    editArtworkImages = hasFiles
        ? (artworkData.images && artworkData.images.length > 0 
            ? [...artworkData.images] 
            : [artworkData.image_url])
        : [];
    editNewImages = [];
    currentEditImageIndex = 0;
    
    // 제목과 설명 설정
    const titleInput = document.getElementById('edit-artwork-title');
    const contentInput = document.getElementById('edit-artwork-content');
    const vibeLinkInput = document.getElementById('edit-vibe-link');
    const tagsInput = document.getElementById('edit-tags');
    if (titleInput) titleInput.value = artworkData.title || '';
    if (contentInput) contentInput.value = artworkData.description || '';
    if (vibeLinkInput) vibeLinkInput.value = artworkData.vibe_link || '';
    
    // 기존 태그 로드
    if (tagsInput) {
        loadExistingTags(artworkData.id, tagsInput);
    }
    
    // 게시 위치 로드 (공개/비공개 통합)
    const isPublic = artworkData.is_public !== false; // 기본값 true
    const postType = artworkData.post_type || 'gallery'; // 기본값 gallery
    
    const galleryRadio = document.querySelector('input[name="edit-post-type"][value="gallery"]');
    const feedRadio = document.querySelector('input[name="edit-post-type"][value="feed"]');
    const privateRadio = document.querySelector('input[name="edit-post-type"][value="private"]');
    
    if (!isPublic) {
        // 비공개인 경우
        if (privateRadio) privateRadio.checked = true;
    } else if (postType === 'gallery') {
        // 공개 + 작품 게시판
        if (galleryRadio) galleryRadio.checked = true;
    } else {
        // 공개 + 자유 게시판
        if (feedRadio) feedRadio.checked = true;
    }
    
    // 현재 작품 데이터 저장 (updateArtwork에서 사용)
    window._currentEditArtworkData = artworkData;
    
    // 이미지 미리보기 업데이트
    updateEditImagePreview();
    
    // 모달 표시
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    
    // 히스토리 추가
    if (!historyManager.isRestoringState()) {
        historyManager.pushModalState('edit-artwork-modal', artworkData);
    }
    
    document.addEventListener('keydown', handleEditModalEscape);
}

// 전역 함수로 노출
window.openEditArtworkModalWithData = openEditArtworkModalWithData;

export function closeEditArtworkModal(returnToDetail = true) {
    const modal = document.getElementById('edit-artwork-modal');
    if (!modal) return;
    
    modal.style.display = 'none';
    
    // 뒤로 가기 (히스토리 복원 중이 아닐 때만)
    if (!historyManager.isRestoringState()) {
        historyManager.goBack();
        return; // 히스토리로 처리하므로 아래 코드 실행 안 함
    }
    
    // 상세보기 모달로 돌아가기 (히스토리 복원 중일 때만)
    if (returnToDetail) {
        // 피드 상세보기 모달 확인
        const feedDetailModal = document.getElementById('feed-detail-modal');
        if (feedDetailModal) {
            feedDetailModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            document.body.classList.add('modal-open');
        } else {
            // 작품 상세보기 모달 확인
            const artworkDetailModal = document.getElementById('artwork-detail-modal');
            if (artworkDetailModal) {
                artworkDetailModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                document.body.classList.add('modal-open');
            } else {
                document.body.style.overflow = '';
                document.body.classList.remove('modal-open');
            }
        }
    } else {
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
    }
    
    document.removeEventListener('keydown', handleEditModalEscape);
    
    // 초기화
    editArtworkImages = [];
    editNewImages = [];
    currentEditImageIndex = 0;
    window._currentEditArtworkData = null;
    
    const fileInput = document.getElementById('edit-image-input');
    if (fileInput) fileInput.value = '';
}

function handleEditModalEscape(e) {
    if (e.key === 'Escape') {
        closeEditArtworkModal();
    }
}

// ========== 이미지 미리보기 ==========
function updateEditImagePreview() {
    const allImages = [...editArtworkImages, ...editNewImages];
    
    if (allImages.length === 0) {
        resetEditImagePreview();
        return;
    }
    
    const preview = document.getElementById('edit-image-preview');
    const removeBtn = document.querySelector('#edit-artwork-modal .upload-remove-btn');
    const prevBtn = document.querySelector('#edit-artwork-modal .carousel-nav.prev');
    const nextBtn = document.querySelector('#edit-artwork-modal .carousel-nav.next');
    const indicators = document.getElementById('edit-carousel-indicators');
    const selectText = document.getElementById('edit-select-text');
    
    // 현재 파일 표시
    const currentFile = allImages[currentEditImageIndex];
    
    // currentFile이 유효하지 않은 경우 처리
    if (!currentFile) {
        resetEditImagePreview();
        return;
    }
    
    const mediaType = getMediaType(currentFile);
    
    if (preview) {
        preview.classList.add('has-image');
        
        // URL인 경우 (기존 파일)
        if (typeof currentFile === 'string') {
            if (mediaType === 'image') {
                preview.innerHTML = `<img src="${currentFile}" alt="작품 이미지 ${currentEditImageIndex + 1}">`;
            } else if (mediaType === 'video') {
                preview.innerHTML = `
                    <video controls style="max-width: 100%; max-height: 100%; object-fit: contain;">
                        <source src="${currentFile}">
                        브라우저가 비디오를 지원하지 않습니다.
                    </video>
                `;
            } else if (mediaType === 'audio') {
                const fileName = currentFile.split('/').pop();
                preview.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M9 18V5l12-2v13"></path>
                            <circle cx="6" cy="18" r="3"></circle>
                            <circle cx="18" cy="16" r="3"></circle>
                        </svg>
                        <p style="font-weight: 600; color: var(--text);">${fileName}</p>
                        <audio controls style="width: 100%; max-width: 400px;">
                            <source src="${currentFile}">
                            브라우저가 오디오를 지원하지 않습니다.
                        </audio>
                    </div>
                `;
            }
        } 
        // File 객체인 경우 (새 파일)
        else if (currentFile instanceof File || currentFile instanceof Blob) {
            const reader = new FileReader();
            reader.onload = function(e) {
                if (preview) {
                    if (mediaType === 'image') {
                        preview.innerHTML = `<img src="${e.target.result}" alt="작품 이미지 ${currentEditImageIndex + 1}">`;
                    } else if (mediaType === 'video') {
                        preview.innerHTML = `
                            <video controls style="max-width: 100%; max-height: 100%; object-fit: contain;">
                                <source src="${e.target.result}" type="${currentFile.type}">
                                브라우저가 비디오를 지원하지 않습니다.
                            </video>
                        `;
                    } else if (mediaType === 'audio') {
                        preview.innerHTML = `
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
                                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <path d="M9 18V5l12-2v13"></path>
                                    <circle cx="6" cy="18" r="3"></circle>
                                    <circle cx="18" cy="16" r="3"></circle>
                                </svg>
                                <p style="font-weight: 600; color: var(--text);">${currentFile.name}</p>
                                <audio controls style="width: 100%; max-width: 400px;">
                                    <source src="${e.target.result}" type="${currentFile.type}">
                                    브라우저가 오디오를 지원하지 않습니다.
                                </audio>
                            </div>
                        `;
                    }
                }
            };
            reader.readAsDataURL(currentFile);
        } else {
            // 예상치 못한 타입인 경우
            console.error('Invalid file type:', currentFile);
            resetEditImagePreview();
            return;
        }
    }
    
    // 버튼 표시
    if (removeBtn) removeBtn.style.display = 'flex';
    if (selectText) selectText.textContent = `파일 추가 (${allImages.length}/10)`;
    
    // 네비게이션 버튼
    if (allImages.length > 1) {
        if (prevBtn) prevBtn.style.display = 'flex';
        if (nextBtn) nextBtn.style.display = 'flex';
    } else {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
    }
    
    // 인디케이터
    if (indicators && allImages.length > 1) {
        indicators.innerHTML = allImages.map((_, index) => 
            `<div class="carousel-indicator ${index === currentEditImageIndex ? 'active' : ''}" onclick="goToEditImage(${index})"></div>`
        ).join('');
    } else if (indicators) {
        indicators.innerHTML = '';
    }
}

function resetEditImagePreview() {
    const preview = document.getElementById('edit-image-preview');
    const removeBtn = document.querySelector('#edit-artwork-modal .upload-remove-btn');
    const prevBtn = document.querySelector('#edit-artwork-modal .carousel-nav.prev');
    const nextBtn = document.querySelector('#edit-artwork-modal .carousel-nav.next');
    const indicators = document.getElementById('edit-carousel-indicators');
    const selectText = document.getElementById('edit-select-text');
    
    if (preview) {
        preview.classList.remove('has-image');
        preview.innerHTML = `
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <p>파일을 선택하세요 (최대 10개)</p>
            <p style="font-size: 12px; color: var(--text-light); margin-top: 8px;">
                이미지, 영상(mp4, webm, mov), 음원(mp3, wav, ogg, m4a)
            </p>
        `;
    }
    
    if (removeBtn) removeBtn.style.display = 'none';
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    if (indicators) indicators.innerHTML = '';
    if (selectText) selectText.textContent = '파일 선택';
}

export function handleEditImageChange(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    const allFiles = [...editArtworkImages, ...editNewImages];
    const totalFiles = allFiles.length + files.length;
    
    if (totalFiles > 10) {
        alert(`최대 10개까지만 업로드 가능합니다. (현재: ${allFiles.length}개, 추가: ${files.length}개)`);
        return;
    }
    
    // 파일 검증
    let firstMediaType = null;
    
    // 기존 파일이 있으면 그 타입을 기준으로
    if (allFiles.length > 0) {
        firstMediaType = getMediaType(allFiles[0]);
    }
    
    for (const file of files) {
        if (!isValidMediaFile(file)) {
            alert('지원하지 않는 파일 형식입니다.\n\n지원 형식:\n- 이미지: jpg, png, gif, webp\n- 영상: mp4, webm, mov\n- 음원: mp3, wav, ogg, m4a');
            return;
        }
        
        const mediaType = getMediaType(file);
        
        // 첫 번째 파일 타입 설정
        if (!firstMediaType) {
            firstMediaType = mediaType;
        }
        
        // 다른 타입의 파일이 섞이는 것 방지
        if (mediaType !== firstMediaType) {
            alert(`같은 종류의 파일만 함께 업로드할 수 있습니다.\n\n현재 선택된 파일: ${firstMediaType === 'video' ? '영상' : firstMediaType === 'audio' ? '음원' : '이미지'}\n추가하려는 파일: ${mediaType === 'video' ? '영상' : mediaType === 'audio' ? '음원' : '이미지'}`);
            return;
        }
        
        // 파일 크기 제한 (Supabase 기본 제한: 50MB)
        // 영상 50MB, 음원 50MB, 이미지 10MB
        const maxSize = mediaType === 'video' ? 50 : mediaType === 'audio' ? 50 : 10;
        if (file.size > maxSize * 1024 * 1024) {
            alert(`${mediaType === 'video' ? '영상' : mediaType === 'audio' ? '음원' : '이미지'} 파일 크기는 ${maxSize}MB 이하여야 합니다.\n\n현재 파일: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
            return;
        }
    }
    
    // 새 파일 추가
    editNewImages = [...editNewImages, ...files];
    currentEditImageIndex = allFiles.length;
    
    event.target.value = '';
    updateEditImagePreview();
}

export function prevEditImage() {
    const allImages = [...editArtworkImages, ...editNewImages];
    if (allImages.length === 0) return;
    currentEditImageIndex = (currentEditImageIndex - 1 + allImages.length) % allImages.length;
    updateEditImagePreview();
}

export function nextEditImage() {
    const allImages = [...editArtworkImages, ...editNewImages];
    if (allImages.length === 0) return;
    currentEditImageIndex = (currentEditImageIndex + 1) % allImages.length;
    updateEditImagePreview();
}

export function goToEditImage(index) {
    const allImages = [...editArtworkImages, ...editNewImages];
    if (index >= 0 && index < allImages.length) {
        currentEditImageIndex = index;
        updateEditImagePreview();
    }
}

export function removeCurrentEditImage() {
    const currentArtworkData = window._currentEditArtworkData || getCurrentArtworkData();
    const allImages = [...editArtworkImages, ...editNewImages];
    if (allImages.length === 0) return;
    
    if (!confirm('현재 이미지를 제거하시겠습니까?')) return;
    
    // 기존 이미지 제거
    if (currentEditImageIndex < editArtworkImages.length) {
        editArtworkImages.splice(currentEditImageIndex, 1);
    } 
    // 새 이미지 제거
    else {
        const newImageIndex = currentEditImageIndex - editArtworkImages.length;
        editNewImages.splice(newImageIndex, 1);
    }
    
    const remainingImages = [...editArtworkImages, ...editNewImages];
    
    // 파일이 모두 제거되어도 허용 (모든 게시 위치에서 파일 선택사항)
    if (currentEditImageIndex >= remainingImages.length) {
        currentEditImageIndex = Math.max(0, remainingImages.length - 1);
    }
    
    updateEditImagePreview();
}

// ========== 게시 위치 변경 핸들러 ==========
export function handleEditPostTypeChange() {
    // 추가 로직이 필요한 경우 여기에 작성
    // 현재는 선택 상태만 유지
}

// ========== 작품 수정 저장 ==========
export async function updateArtwork() {
    const currentArtworkData = window._currentEditArtworkData || getCurrentArtworkData();
    const currentArtworkId = currentArtworkData?.id;
    
    console.log('updateArtwork 호출됨');
    console.log('currentArtworkId:', currentArtworkId);
    console.log('currentArtworkData:', currentArtworkData);
    
    if (!currentArtworkId || !currentArtworkData) {
        console.error('작품 정보가 없습니다.');
        alert('작품 정보를 불러올 수 없습니다.');
        return;
    }
    
    try {
        const { data: { session } } = await window._supabase.auth.getSession();
        console.log('세션 확인:', session);
        
        if (!session || !session.user) {
            showLoginRequiredModal();
            return;
        }
        
        const titleInput = document.getElementById('edit-artwork-title');
        const contentInput = document.getElementById('edit-artwork-content');
        const vibeLinkInput = document.getElementById('edit-vibe-link');
        const saveBtn = document.querySelector('#edit-artwork-modal .modal-btn.save');
        
        const title = titleInput ? titleInput.value.trim() : '';
        const content = contentInput ? contentInput.value.trim() : '';
        const vibeLink = vibeLinkInput ? vibeLinkInput.value.trim() : '';
        
        if (!title) {
            alert('제목을 입력해주세요.');
            return;
        }
        
        const allImages = [...editArtworkImages, ...editNewImages];
        
        // 게시 위치 확인
        const postTypeRadio = document.querySelector('input[name="edit-post-type"]:checked');
        const postTypeValue = postTypeRadio ? postTypeRadio.value : 'gallery';
        
        // 공개 설정 및 게시 위치 결정
        let isPublic = true;
        let postType = 'gallery';
        
        if (postTypeValue === 'private') {
            // 비공개 선택 시
            isPublic = false;
            postType = 'gallery'; // 비공개는 기본적으로 작품 게시판으로 저장
        } else {
            // 작품 게시판 또는 자유 게시판 선택 시
            isPublic = true;
            postType = postTypeValue;
        }
        
        // 파일 선택사항 (모든 게시 위치에서 파일 없이 수정 가능)
        
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = '수정 중...';
        }
        
        // 새 이미지 업로드
        const newImageUrls = [];
        if (editNewImages.length > 0) {
            for (let i = 0; i < editNewImages.length; i++) {
                const file = editNewImages[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${session.user.id}-${Date.now()}-${i}.${fileExt}`;
                
                if (saveBtn) {
                    saveBtn.textContent = `이미지 업로드 중... (${i + 1}/${editNewImages.length})`;
                }
                
                const { data: uploadData, error: uploadError } = await window._supabase.storage
                    .from('posts')
                    .upload(fileName, file, {
                        cacheControl: '3600',
                        upsert: false
                    });
                
                if (uploadError) throw uploadError;
                
                const { data: urlData } = window._supabase.storage
                    .from('posts')
                    .getPublicUrl(fileName);
                
                newImageUrls.push(urlData.publicUrl);
            }
        }
        
        // 최종 파일 URL 배열
        const finalFileUrls = [...editArtworkImages, ...newImageUrls];
        
        // 미디어 타입 확인 (파일이 있는 경우)
        let mediaType = 'image'; // 기본값
        if (finalFileUrls.length > 0) {
            // 첫 번째 파일의 타입으로 결정
            const firstFile = allImages[0];
            mediaType = getMediaType(firstFile);
        }
        
        // 데이터베이스 업데이트
        if (saveBtn) saveBtn.textContent = '저장 중...';
        
        const updateData = {
            title: title,
            description: content,
            media_type: mediaType, // 미디어 타입 추가
            is_public: isPublic, // 공개 설정
            post_type: postType, // 게시 위치
            updated_at: new Date().toISOString()
        };
        
        // 파일이 있는 경우에만 추가, 없으면 null로 설정
        if (finalFileUrls.length > 0) {
            updateData.image_url = finalFileUrls[0];
            updateData.images = finalFileUrls;
        } else {
            updateData.image_url = null;
            updateData.images = null;
        }
        
        // vibe_link 추가 (있는 경우)
        if (vibeLink) {
            updateData.vibe_link = vibeLink;
        } else {
            updateData.vibe_link = null;
        }
        
        const { error: updateError } = await window._supabase
            .from('artworks')
            .update(updateData)
            .eq('id', currentArtworkId);
        
        if (updateError) {
            console.error('작품 수정 에러:', updateError);
            alert('작품 수정에 실패했습니다: ' + updateError.message);
            return;
        }
        
        console.log('작품 수정 성공!');
        
        // 태그 처리
        const tagsInput = document.getElementById('edit-tags');
        if (tagsInput) {
            await saveTags(currentArtworkId, tagsInput.value.trim());
        }
        
        alert('게시물이 수정되었습니다!');
        
        // 모달 닫기
        closeEditArtworkModal(false);
        
        // 피드 상세보기 모달 닫기
        const feedDetailModal = document.getElementById('feed-detail-modal');
        if (feedDetailModal) {
            feedDetailModal.remove();
        }
        
        // 작품 상세보기 모달 닫기
        if (window.closeArtworkDetail) {
            window.closeArtworkDetail();
        }
        
        // 그리드 새로고침
        if (window.renderArtworksGrid) {
            await window.renderArtworksGrid();
        }
        
        // 피드 새로고침 (현재 탭이 피드인 경우)
        const feedTab = document.querySelector('.tab-button[data-tab="feed"]');
        if (feedTab && feedTab.classList.contains('active') && window.loadFeedPosts) {
            await window.loadFeedPosts();
        }
        
        // 갤러리 새로고침 (현재 탭이 갤러리인 경우)
        const galleryTab = document.querySelector('.tab-button[data-tab="gallery"]');
        if (galleryTab && galleryTab.classList.contains('active') && window.loadGalleryPosts) {
            await window.loadGalleryPosts();
        }
        
    } catch (err) {
        console.error('작품 수정 예외:', err);
        alert('작품 수정 중 오류가 발생했습니다: ' + (err.message || String(err)));
    } finally {
        const saveBtn = document.querySelector('#edit-artwork-modal .modal-btn.save');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = '수정 완료';
        }
    }
}
