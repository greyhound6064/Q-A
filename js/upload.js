/**
 * @file upload.js
 * @description 작품 업로드 모달 및 기능
 */

import { addTagsToArtwork, parseTagsString } from './services/tagService.js';

// ========== 전역 변수 ==========
let selectedUploadFiles = []; // 이미지, 영상, 음원 파일
let currentUploadFileIndex = 0;

// ========== 미디어 타입 검증 ==========
const SUPPORTED_MEDIA = {
    image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/webm', 'video/quicktime'], // quicktime = .mov
    audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4'] // mp4 = .m4a
};

function getMediaType(file) {
    for (const [type, mimes] of Object.entries(SUPPORTED_MEDIA)) {
        if (mimes.includes(file.type)) {
            return type;
        }
    }
    return null;
}

function isValidMediaFile(file) {
    return getMediaType(file) !== null;
}

// ========== 태그 저장 함수 ==========
async function saveTags(artworkId, tagsString) {
    try {
        // 태그 파싱 (#으로 시작하는 단어 추출)
        const tagNames = tagsString
            .split(/\s+/)
            .filter(tag => tag.startsWith('#') && tag.length > 1)
            .map(tag => tag.substring(1).toLowerCase())
            .slice(0, 10); // 최대 10개
        
        if (tagNames.length === 0) return;
        
        // tagService 사용
        await addTagsToArtwork(artworkId, tagNames);
    } catch (err) {
        console.error('태그 저장 에러:', err);
    }
}

// ========== 업로드 모달 ==========
export function openUploadModal() {
    const modal = document.getElementById('upload-modal');
    if (!modal) return;
    
    // 입력 필드 초기화
    const titleInput = document.getElementById('upload-title');
    const contentInput = document.getElementById('upload-content');
    const vibeLinkInput = document.getElementById('upload-vibe-link');
    const tagsInput = document.getElementById('upload-tags');
    if (titleInput) titleInput.value = '';
    if (contentInput) contentInput.value = '';
    if (vibeLinkInput) vibeLinkInput.value = '';
    if (tagsInput) tagsInput.value = '';
    
    // 게시 위치 초기화 (작품관 기본 선택)
    const galleryRadio = document.querySelector('input[name="upload-post-type"][value="gallery"]');
    if (galleryRadio) galleryRadio.checked = true;
    
    // 파일 초기화
    selectedUploadFiles = [];
    currentUploadFileIndex = 0;
    resetUploadFilePreview();
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    document.addEventListener('keydown', handleUploadModalEscape);
}

export function closeUploadModal() {
    const modal = document.getElementById('upload-modal');
    if (!modal) return;
    
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    document.removeEventListener('keydown', handleUploadModalEscape);
    
    selectedUploadFiles = [];
    currentUploadFileIndex = 0;
    const fileInput = document.getElementById('upload-image-input');
    if (fileInput) fileInput.value = '';
    resetUploadFilePreview();
}

function handleUploadModalEscape(e) {
    if (e.key === 'Escape') {
        closeUploadModal();
    }
}

// ========== 파일 미리보기 ==========
function resetUploadFilePreview() {
    const modal = document.getElementById('upload-modal');
    if (!modal) return;
    
    const preview = modal.querySelector('#upload-image-preview');
    const removeBtn = modal.querySelector('.upload-remove-btn');
    const prevBtn = modal.querySelector('.carousel-nav.prev');
    const nextBtn = modal.querySelector('.carousel-nav.next');
    const indicators = modal.querySelector('#upload-carousel-indicators');
    const selectText = modal.querySelector('#upload-select-text');
    
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

export function handleUploadImageChange(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    console.log('파일 선택됨:', files.length, '개');
    
    const totalFiles = selectedUploadFiles.length + files.length;
    if (totalFiles > 10) {
        alert(`최대 10개까지만 업로드 가능합니다. (현재: ${selectedUploadFiles.length}개, 추가: ${files.length}개)`);
        return;
    }
    
    // 파일 검증
    let firstMediaType = null;
    
    // 기존 파일이 있으면 그 타입을 기준으로
    if (selectedUploadFiles.length > 0) {
        firstMediaType = getMediaType(selectedUploadFiles[0]);
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
    
    // 기존 파일에 새 파일 추가
    selectedUploadFiles = [...selectedUploadFiles, ...files];
    currentUploadFileIndex = selectedUploadFiles.length - files.length;
    
    console.log('파일 배열 업데이트됨:', selectedUploadFiles.length, '개');
    
    event.target.value = '';
    
    // 화면 강제 업데이트
    setTimeout(() => {
        updateUploadFilePreview();
    }, 0);
}

function updateUploadFilePreview() {
    if (selectedUploadFiles.length === 0) {
        resetUploadFilePreview();
        return;
    }
    
    const modal = document.getElementById('upload-modal');
    if (!modal) {
        console.error('업로드 모달을 찾을 수 없습니다.');
        return;
    }
    
    const preview = modal.querySelector('#upload-image-preview');
    const removeBtn = modal.querySelector('.upload-remove-btn');
    const prevBtn = modal.querySelector('.carousel-nav.prev');
    const nextBtn = modal.querySelector('.carousel-nav.next');
    const indicators = modal.querySelector('#upload-carousel-indicators');
    const selectText = modal.querySelector('#upload-select-text');
    
    console.log('updateUploadFilePreview 호출됨:', {
        filesCount: selectedUploadFiles.length,
        currentIndex: currentUploadFileIndex,
        removeBtn: !!removeBtn,
        prevBtn: !!prevBtn,
        nextBtn: !!nextBtn
    });
    
    const currentFile = selectedUploadFiles[currentUploadFileIndex];
    const mediaType = getMediaType(currentFile);
    
    // 현재 파일 표시
    const reader = new FileReader();
    reader.onload = function(e) {
        if (preview) {
            preview.classList.add('has-image');
            
            if (mediaType === 'image') {
                preview.innerHTML = `<img src="${e.target.result}" alt="업로드 이미지 ${currentUploadFileIndex + 1}">`;
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
    reader.readAsDataURL(selectedUploadFiles[currentUploadFileIndex]);
    
    // 버튼 표시 (강제 렌더링)
    if (removeBtn) {
        removeBtn.style.display = 'flex';
        console.log('제거 버튼 표시됨');
    } else {
        console.error('제거 버튼을 찾을 수 없습니다.');
    }
    
    if (selectText) {
        selectText.textContent = `파일 추가 (${selectedUploadFiles.length}/10)`;
    }
    
    // 네비게이션 버튼 (강제 렌더링)
    if (selectedUploadFiles.length > 1) {
        if (prevBtn) {
            prevBtn.style.display = 'flex';
            console.log('이전 버튼 표시됨');
        } else {
            console.error('이전 버튼을 찾을 수 없습니다.');
        }
        if (nextBtn) {
            nextBtn.style.display = 'flex';
            console.log('다음 버튼 표시됨');
        } else {
            console.error('다음 버튼을 찾을 수 없습니다.');
        }
    } else {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
    }
    
    // 인디케이터
    if (indicators && selectedUploadFiles.length > 1) {
        indicators.innerHTML = selectedUploadFiles.map((_, index) => 
            `<div class="carousel-indicator ${index === currentUploadFileIndex ? 'active' : ''}" onclick="goToUploadImage(${index})"></div>`
        ).join('');
    } else if (indicators) {
        indicators.innerHTML = '';
    }
    
    // 강제 리플로우 (브라우저가 변경사항을 즉시 반영하도록)
    if (removeBtn) removeBtn.offsetHeight;
    if (prevBtn) prevBtn.offsetHeight;
    if (nextBtn) nextBtn.offsetHeight;
}

export function prevUploadImage() {
    if (selectedUploadFiles.length === 0) return;
    currentUploadFileIndex = (currentUploadFileIndex - 1 + selectedUploadFiles.length) % selectedUploadFiles.length;
    console.log('이전 이미지로 이동:', currentUploadFileIndex);
    setTimeout(() => {
        updateUploadFilePreview();
    }, 0);
}

export function nextUploadImage() {
    if (selectedUploadFiles.length === 0) return;
    currentUploadFileIndex = (currentUploadFileIndex + 1) % selectedUploadFiles.length;
    console.log('다음 이미지로 이동:', currentUploadFileIndex);
    setTimeout(() => {
        updateUploadFilePreview();
    }, 0);
}

export function goToUploadImage(index) {
    if (index >= 0 && index < selectedUploadFiles.length) {
        currentUploadFileIndex = index;
        console.log('이미지로 이동:', currentUploadFileIndex);
        setTimeout(() => {
            updateUploadFilePreview();
        }, 0);
    }
}

export function removeCurrentUploadImage() {
    if (selectedUploadFiles.length === 0) return;
    
    if (!confirm('현재 파일을 제거하시겠습니까?')) return;
    
    console.log('파일 제거 전:', selectedUploadFiles.length, '개');
    
    selectedUploadFiles.splice(currentUploadFileIndex, 1);
    
    console.log('파일 제거 후:', selectedUploadFiles.length, '개');
    
    if (selectedUploadFiles.length === 0) {
        currentUploadFileIndex = 0;
        const fileInput = document.getElementById('upload-image-input');
        if (fileInput) fileInput.value = '';
        setTimeout(() => {
            resetUploadFilePreview();
        }, 0);
    } else {
        if (currentUploadFileIndex >= selectedUploadFiles.length) {
            currentUploadFileIndex = selectedUploadFiles.length - 1;
        }
        setTimeout(() => {
            updateUploadFilePreview();
        }, 0);
    }
}

// ========== 게시 위치 변경 핸들러 ==========
export function handleUploadPostTypeChange() {
    // 추가 로직이 필요한 경우 여기에 작성
    // 현재는 선택 상태만 유지
}

// ========== 게시물 업로드 ==========
export async function uploadPost() {
    try {
        const { data: { session } } = await window._supabase.auth.getSession();
        
        if (!session || !session.user) {
            alert('로그인이 필요합니다.');
            return;
        }
        
        const userId = session.user.id;
        const titleInput = document.getElementById('upload-title');
        const contentInput = document.getElementById('upload-content');
        const vibeLinkInput = document.getElementById('upload-vibe-link');
        const saveBtn = document.querySelector('#upload-modal .modal-btn.save');
        
        const title = titleInput ? titleInput.value.trim() : '';
        const content = contentInput ? contentInput.value.trim() : '';
        const vibeLink = vibeLinkInput ? vibeLinkInput.value.trim() : '';
        
        if (!title) {
            alert('제목을 입력해주세요.');
            return;
        }
        
        // 게시 위치 확인
        const postTypeRadio = document.querySelector('input[name="upload-post-type"]:checked');
        const postTypeValue = postTypeRadio ? postTypeRadio.value : 'gallery';
        
        // 공개 설정 및 게시 위치 결정
        let isPublic = true;
        let postType = 'gallery';
        
        if (postTypeValue === 'private') {
            // 비공개 선택 시
            isPublic = false;
            postType = 'gallery'; // 비공개는 기본적으로 작품관으로 저장
        } else {
            // 작품관 또는 자유게시판 선택 시
            isPublic = true;
            postType = postTypeValue;
        }
        
        // 파일 선택사항 (모든 게시 위치에서 파일 없이 게시 가능)
        
        // 첫 번째 파일의 미디어 타입 확인 (파일이 있는 경우)
        let mediaType = 'image'; // 기본값
        if (selectedUploadFiles.length > 0) {
            const firstFile = selectedUploadFiles[0];
            mediaType = getMediaType(firstFile);
        }
        
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = selectedUploadFiles.length > 0 ? '업로드 중...' : '게시 중...';
        }
        
        const fileUrls = [];
        
        // 파일이 있는 경우에만 Supabase Storage에 업로드
        if (selectedUploadFiles.length > 0) {
            try {
                for (let i = 0; i < selectedUploadFiles.length; i++) {
                    const file = selectedUploadFiles[i];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${userId}-${Date.now()}-${i}.${fileExt}`;
                    const filePath = `${fileName}`;
                    
                    console.log(`파일 ${i + 1}/${selectedUploadFiles.length} 업로드 시작:`, filePath);
                    
                    if (saveBtn) {
                        saveBtn.textContent = `업로드 중... (${i + 1}/${selectedUploadFiles.length})`;
                    }
                    
                    const { data: uploadData, error: uploadError } = await window._supabase.storage
                        .from('posts')
                        .upload(filePath, file, {
                            cacheControl: '3600',
                            upsert: false
                        });
                    
                    if (uploadError) {
                        console.error('파일 업로드 에러:', uploadError);
                        throw uploadError;
                    }
                    
                    console.log('파일 업로드 성공:', uploadData);
                    
                    const { data: urlData } = window._supabase.storage
                        .from('posts')
                        .getPublicUrl(filePath);
                    
                    fileUrls.push(urlData.publicUrl);
                    console.log('공개 URL 생성:', urlData.publicUrl);
                }
                
            } catch (err) {
                console.error('파일 업로드 처리 에러:', err);
                alert('파일 업로드 중 오류가 발생했습니다: ' + err.message);
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = '게시하기';
                }
                return;
            }
        }
        
        // profiles 테이블에서 닉네임 가져오기
        const { data: profile } = await window._supabase
            .from('profiles')
            .select('nickname')
            .eq('user_id', userId)
            .single();
        
        const nickname = profile?.nickname || session.user.email.split('@')[0] || '사용자';
        
        // artworks 테이블에 게시물 저장
        const insertData = {
            user_id: userId,
            title: title,
            description: content,
            media_type: mediaType, // 미디어 타입 추가
            author_nickname: nickname,
            author_email: session.user.email,
            is_public: isPublic, // 공개 설정
            post_type: postType // 게시 위치
        };
        
        // 파일이 있는 경우에만 image_url과 images 추가
        if (fileUrls.length > 0) {
            insertData.image_url = fileUrls[0];
            insertData.images = fileUrls;
        }
        
        // vibe_link 추가 (있는 경우)
        if (vibeLink) {
            insertData.vibe_link = vibeLink;
        }
        
        const { data: postData, error: postError } = await window._supabase
            .from('artworks')
            .insert(insertData)
            .select()
            .single();
        
        if (postError) {
            console.error('게시물 저장 에러:', postError);
            alert('게시물 저장에 실패했습니다: ' + postError.message);
            return;
        }
        
        console.log('게시물 저장 성공:', postData);
        
        // 태그 처리
        const tagsInput = document.getElementById('upload-tags')?.value.trim();
        if (tagsInput && postData) {
            await saveTags(postData.id, tagsInput);
        }
        
        alert('게시물이 성공적으로 업로드되었습니다!');
        
        // 프로필 정보 새로고침
        if (window.updateProfileInfo) {
            await window.updateProfileInfo();
        }
        
        // 작품 그리드 새로고침
        if (window.renderArtworksGrid) {
            await window.renderArtworksGrid();
        }
        
        // 피드 새로고침 (현재 탭이 피드인 경우)
        const feedTab = document.querySelector('.tab-button[data-tab="feed"]');
        if (feedTab && feedTab.classList.contains('active') && window.initFeed) {
            await window.initFeed();
        }
        
        // 갤러리 새로고침 (현재 탭이 갤러리인 경우)
        const galleryTab = document.querySelector('.tab-button[data-tab="gallery"]');
        if (galleryTab && galleryTab.classList.contains('active') && window.initGallery) {
            await window.initGallery();
        }
        
        // 모달 닫기
        closeUploadModal();
        
    } catch (err) {
        console.error('게시물 업로드 예외:', err);
        alert('게시물 업로드 중 오류가 발생했습니다: ' + (err.message || String(err)));
    } finally {
        const saveBtn = document.querySelector('#upload-modal .modal-btn.save');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = '게시하기';
        }
    }
}
