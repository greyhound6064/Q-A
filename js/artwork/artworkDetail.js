/**
 * @file artworkDetail.js
 * @description 작품 상세보기 모달 및 이미지 캐러셀
 */

import { escapeHtml, formatDate, linkifyText } from '../utils.js';
import { renderArtworksGrid } from './artworkGrid.js';
import { isSaved, toggleSave as toggleSaveService } from '../services/saveService.js';
import { decrementArtworkTags } from '../services/tagService.js';
import { historyManager } from '../utils/historyManager.js';
import { addSwipeToCloseGesture, addCarouselSwipeGesture } from '../utils/touchGestures.js';

// ========== 전역 상태 ==========
let currentArtworkId = null;
let currentArtworkImages = [];
let currentArtworkImageIndex = 0;
export let currentArtworkData = null;
let savedScrollPosition = 0; // 스크롤 위치 저장
let swipeCleanup = null; // 스와이프 제스처 클린업 함수
let carouselSwipeCleanup = null; // 캐러셀 스와이프 클린업 함수

/**
 * 현재 작품 데이터 가져오기
 */
export function getCurrentArtworkData() {
    return currentArtworkData;
}

/**
 * 현재 작품 ID 가져오기
 */
export function getCurrentArtworkId() {
    return currentArtworkId;
}

/**
 * 통합 게시물 상세보기 열기 (모든 post_type 지원)
 * @param {string} artworkId - 게시물 ID
 * @param {boolean} showComments - 댓글 포커스 여부
 * @param {Array} feedPosts - 로컬 게시물 배열 (선택사항)
 */
export async function openArtworkDetail(artworkId, showComments = false, feedPosts = []) {
    const modal = document.getElementById('artwork-detail-modal');
    if (!modal) return;
    
    // 현재 스크롤 위치 저장 (모달 열기 전)
    savedScrollPosition = historyManager.getCurrentScrollPosition();
    console.log('모달 열기 전 스크롤 위치 저장:', savedScrollPosition);
    
    // 피드의 모든 비디오 일시정지
    pauseAllFeedVideos();
    
    currentArtworkId = artworkId;
    
    try {
        // 게시물 정보 가져오기
        const { data: artwork, error } = await window._supabase
            .from('artworks')
            .select('*')
            .eq('id', artworkId)
            .single();
        
        if (error) {
            console.error('게시물 조회 에러:', error);
            alert('게시물을 불러올 수 없습니다.');
            return;
        }
        
        // 현재 게시물 데이터 저장
        currentArtworkData = artwork;
        
        // 현재 사용자 확인
        const { data: { session } } = await window._supabase.auth.getSession();
        const isOwner = session && session.user && session.user.id === artwork.user_id;
        
        // 미디어 파일 배열 설정 (파일이 없을 수도 있음)
        const hasFiles = (artwork.images && artwork.images.length > 0) || artwork.image_url;
        currentArtworkImages = hasFiles
            ? (artwork.images && artwork.images.length > 0 ? artwork.images : [artwork.image_url])
            : [];
        currentArtworkImageIndex = 0;
        
        // 미디어 타입 결정 (파일이 있는 경우만)
        let mediaType = 'image'; // 기본값
        
        if (currentArtworkImages.length > 0) {
            const firstFile = currentArtworkImages[0] || '';
            const extension = firstFile.split('.').pop().toLowerCase().split('?')[0];
            
            if (['mp4', 'webm', 'ogg', 'mov'].includes(extension)) {
                mediaType = 'video';
            } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) {
                mediaType = 'audio';
            } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
                mediaType = 'image';
            } else {
                // 확장자로 판단 불가능한 경우에만 DB 값 사용
                mediaType = artwork.media_type || 'image';
            }
            
            console.log('DB media_type:', artwork.media_type, '/ 판단된 타입:', mediaType, '/ 확장자:', extension, '/ 파일:', currentArtworkImages[0]);
        }
        
        currentArtworkData.media_type = mediaType;
        
        // 미디어 섹션 표시/숨김
        const imageSection = document.querySelector('.artwork-image-section');
        const modalBody = document.querySelector('.artwork-modal-body');
        const modalContent = document.querySelector('.artwork-modal-content');
        if (imageSection && modalBody) {
            if (currentArtworkImages.length > 0) {
                imageSection.style.display = 'block';
                modalBody.classList.remove('no-media');
                if (modalContent) modalContent.classList.remove('no-media');
                updateArtworkMedia();
            } else {
                // 파일이 없는 경우 미디어 섹션 숨김 및 단일 컬럼 레이아웃
                imageSection.style.display = 'none';
                modalBody.classList.add('no-media');
                if (modalContent) modalContent.classList.add('no-media');
            }
        }
        
        // 제목 표시
        const titleEl = document.getElementById('artwork-detail-title');
        if (titleEl) titleEl.textContent = artwork.title;
        
        // 설명 표시
        const descEl = document.getElementById('artwork-detail-description');
        if (descEl) {
            descEl.innerHTML = artwork.description ? linkifyText(artwork.description) : '설명이 없습니다.';
        }
        
        // 태그 표시
        const tagsContainer = document.getElementById('artwork-detail-tags');
        if (tagsContainer) {
            const { data: artworkTags } = await window._supabase
                .from('artwork_tags')
                .select('tag_id, tags(name)')
                .eq('artwork_id', artworkId);
            
            if (artworkTags && artworkTags.length > 0) {
                const tags = artworkTags.map(at => at.tags.name);
                tagsContainer.innerHTML = tags.map(tag => 
                    `<span class="artwork-tag" onclick="event.stopPropagation(); if(window.toggleTagFilter) { window.toggleTagFilter('${tag}'); window.switchToTab('feed'); }">#${tag}</span>`
                ).join('');
                tagsContainer.style.display = 'flex';
            } else {
                tagsContainer.style.display = 'none';
            }
        }
        
        // 바이브코딩 링크 표시
        const vibeLinkContainer = document.getElementById('artwork-vibe-link');
        const vibeLinkUrl = document.getElementById('artwork-vibe-link-url');
        if (vibeLinkContainer && vibeLinkUrl) {
            if (artwork.vibe_link) {
                vibeLinkUrl.href = artwork.vibe_link;
                vibeLinkUrl.textContent = artwork.vibe_link;
                vibeLinkContainer.style.display = 'flex';
            } else {
                vibeLinkContainer.style.display = 'none';
            }
        }
        
        // 작성자 이름 표시
        const authorNameEl = document.getElementById('artwork-author-name');
        if (authorNameEl) {
            authorNameEl.textContent = artwork.author_nickname || '알 수 없음';
        }
        
        // 작성 날짜 표시
        const dateEl = document.getElementById('artwork-date');
        if (dateEl && artwork.created_at) {
            dateEl.textContent = formatDate(artwork.created_at);
        }
        
        // 작성자 아바타 (프로필 이미지 가져오기)
        const avatarEl = document.getElementById('artwork-author-avatar');
        if (avatarEl) {
            try {
                const { data: profile } = await window._supabase
                    .from('profiles')
                    .select('avatar_url')
                    .eq('user_id', artwork.user_id)
                    .single();
                
                if (profile?.avatar_url) {
                    avatarEl.innerHTML = `<img src="${escapeHtml(profile.avatar_url)}" alt="프로필" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                } else {
                    avatarEl.innerHTML = `
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    `;
                }
            } catch (err) {
                console.log('프로필 이미지 로드 실패:', err);
                avatarEl.innerHTML = `
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                `;
            }
        }
        
        // 메뉴 버튼 표시
        const menuContainer = document.getElementById('artwork-menu-container');
        if (menuContainer) {
            menuContainer.style.display = isOwner ? 'block' : 'none';
        }
        
        // 좋아요/싫어요 버튼 이벤트 설정
        const likeBtn = document.getElementById('artwork-detail-like-btn');
        const dislikeBtn = document.getElementById('artwork-detail-dislike-btn');
        if (likeBtn) {
            likeBtn.onclick = async () => {
                if (window.toggleLike) {
                    await window.toggleLike(artworkId);
                    await loadArtworkLikesData(artworkId, session?.user?.id);
                }
            };
        }
        if (dislikeBtn) {
            dislikeBtn.onclick = async () => {
                if (window.toggleDislike) {
                    await window.toggleDislike(artworkId);
                    await loadArtworkLikesData(artworkId, session?.user?.id);
                }
            };
        }
        
        // 좋아요/싫어요 데이터 로드
        await loadArtworkLikesData(artworkId, session?.user?.id);
        
        // 저장 상태 로드 및 버튼 이벤트 설정
        const saveBtn = document.getElementById('artwork-detail-save-btn');
        if (saveBtn) {
            await loadArtworkSavedStatus(artworkId, session?.user?.id);
            
            // 저장 버튼 이벤트 설정
            saveBtn.onclick = async () => {
                try {
                    const isSavedValue = await toggleSaveService(artworkId);
                    
                    // 상세보기 모달의 저장 버튼 UI 업데이트
                    if (isSavedValue) {
                        saveBtn.classList.add('saved');
                    } else {
                        saveBtn.classList.remove('saved');
                    }
                    
                    // 피드의 저장 버튼도 업데이트 (숫자와 문자열 모두 확인)
                    const feedSaveBtn = document.getElementById(`save-btn-${artworkId}`) || 
                                      document.getElementById(`save-btn-${String(artworkId)}`);
                    if (feedSaveBtn) {
                        if (isSavedValue) {
                            feedSaveBtn.classList.add('saved');
                        } else {
                            feedSaveBtn.classList.remove('saved');
                        }
                    }
                } catch (err) {
                    console.error('저장 토글 에러:', err);
                    alert(err.message || '저장 처리 중 오류가 발생했습니다.');
                }
            };
        }
        
        // 댓글 섹션 로드 (외부 모듈)
        if (window.loadArtworkComments) {
            await window.loadArtworkComments(artworkId, showComments);
        }
        
        // 모달 표시
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        
        // 히스토리 추가 (모달 열기 전 스크롤 위치를 히스토리에 저장)
        if (!historyManager.isRestoringState()) {
            // 게시물 타입 확인
            const postType = artwork.post_type || 'gallery';
            // 모달 상태를 히스토리에 추가 (이전 스크롤 위치 포함)
            historyManager.pushArtworkDetailState(artworkId, postType, savedScrollPosition);
            console.log('히스토리 추가 - artworkId:', artworkId, 'postType:', postType, 'savedScrollPosition:', savedScrollPosition);
        }
        
        // ESC 키로 모달 닫기
        document.addEventListener('keydown', handleArtworkModalEscape);
        
        // 모바일 터치 제스처 추가
        if (window.innerWidth <= 968) {
            // 스와이프 다운으로 모달 닫기 기능 제거됨 (사용자 요청)
            // const modalContent = document.querySelector('.artwork-modal-content');
            // if (modalContent) {
            //     swipeCleanup = addSwipeToCloseGesture(modalContent, closeArtworkDetail, {
            //         threshold: 100,
            //         velocityThreshold: 0.3
            //     });
            // }
            
            // 캐러셀 스와이프 제스처
            if (currentArtworkImages.length > 1) {
                const carouselContent = document.getElementById('artwork-carousel-content');
                if (carouselContent) {
                    carouselSwipeCleanup = addCarouselSwipeGesture(
                        carouselContent,
                        () => nextArtworkImage(), // 왼쪽 스와이프 = 다음
                        () => prevArtworkImage(), // 오른쪽 스와이프 = 이전
                        {
                            threshold: 50,
                            velocityThreshold: 0.3
                        }
                    );
                }
            }
        }
        
    } catch (err) {
        console.error('작품 상세보기 에러:', err);
        alert('작품을 불러오는 중 오류가 발생했습니다.');
    }
}

/**
 * 피드의 모든 비디오 일시정지
 */
function pauseAllFeedVideos() {
    const feedVideos = document.querySelectorAll('.feed-video');
    feedVideos.forEach(video => {
        if (!video.paused) {
            video.pause();
        }
    });
}

/**
 * 작품 상세보기 모달 닫기
 */
export function closeArtworkDetail() {
    const modal = document.getElementById('artwork-detail-modal');
    if (!modal) return;
    
    // 터치 제스처 클린업
    if (swipeCleanup) {
        swipeCleanup();
        swipeCleanup = null;
    }
    if (carouselSwipeCleanup) {
        carouselSwipeCleanup();
        carouselSwipeCleanup = null;
    }
    
    // 상세보기 내 비디오 정지
    const detailVideo = document.getElementById('artwork-detail-video');
    if (detailVideo && !detailVideo.paused) {
        detailVideo.pause();
    }
    
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
    document.body.style.overflow = 'auto';
    
    document.removeEventListener('keydown', handleArtworkModalEscape);
    
    currentArtworkId = null;
    currentArtworkImages = [];
    currentArtworkImageIndex = 0;
    
    // 뒤로 가기 실행 (히스토리 복원 중이 아닐 때만)
    // X 버튼이나 ESC 키로 닫을 때만 뒤로가기 실행
    // 뒤로가기 버튼으로 닫을 때는 historyManager가 스크롤 복원을 처리
    if (!historyManager.isRestoringState()) {
        console.log('X 버튼으로 모달 닫기 - 스크롤 위치 복원:', savedScrollPosition);
        // X 버튼으로 닫을 때는 직접 스크롤 복원 (뒤로가기 없이)
        historyManager.restoreScrollPosition(savedScrollPosition);
        // 히스토리에서 모달 상태 제거
        historyManager.goBack();
    } else {
        console.log('뒤로가기 버튼으로 모달 닫기 - historyManager가 스크롤 복원 처리');
    }
}

/**
 * 저장된 스크롤 위치로 복원 (deprecated - historyManager가 처리)
 * 하위 호환성을 위해 유지
 */
function restoreScrollPosition() {
    console.log('[deprecated] restoreScrollPosition 호출 - historyManager 사용 권장');
    // historyManager의 restoreScrollPosition 사용
    if (historyManager && historyManager.restoreScrollPosition) {
        historyManager.restoreScrollPosition(savedScrollPosition);
    }
}

/**
 * 작품 미디어 업데이트 (이미지, 비디오, 오디오)
 */
function updateArtworkMedia() {
    const contentEl = document.getElementById('artwork-carousel-content');
    const prevBtn = document.querySelector('.artwork-carousel-nav.prev');
    const nextBtn = document.querySelector('.artwork-carousel-nav.next');
    const indicators = document.getElementById('artwork-carousel-indicators');
    
    if (!contentEl || currentArtworkImages.length === 0) return;
    
    const mediaType = currentArtworkData?.media_type || 'image';
    const currentUrl = currentArtworkImages[currentArtworkImageIndex];
    
    // 미디어 타입에 따라 HTML 생성
    let mediaHTML = '';
    if (mediaType === 'video') {
        mediaHTML = `
            <video 
                id="artwork-detail-video"
                controls 
                autoplay
                loop
                preload="auto"
                playsinline
                disablePictureInPicture
                x-webkit-airplay="allow"
                onloadedmetadata="this.volume = 0.3"
                style="max-width: 100%; max-height: 100%; object-fit: contain;">
                <source src="${escapeHtml(currentUrl)}" type="video/mp4">
                브라우저가 비디오를 지원하지 않습니다.
            </video>
        `;
    } else if (mediaType === 'audio') {
        mediaHTML = `
            <div class="feed-audio-container">
                <div class="feed-audio-content">
                    <svg class="feed-audio-icon" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M9 18V5l12-2v13"></path>
                        <circle cx="6" cy="18" r="3"></circle>
                        <circle cx="18" cy="16" r="3"></circle>
                    </svg>
                    <audio controls class="feed-audio-player" onloadedmetadata="this.volume = 0.3">
                        <source src="${escapeHtml(currentUrl)}" type="audio/mpeg">
                        브라우저가 오디오를 지원하지 않습니다.
                    </audio>
                </div>
            </div>
        `;
    } else {
        mediaHTML = `<img id="artwork-detail-image" src="${escapeHtml(currentUrl)}" alt="작품 이미지" style="cursor: zoom-in;" onclick="openArtworkImageViewer(${currentArtworkImageIndex})">`;
    }
    
    contentEl.innerHTML = mediaHTML;
    
    // 네비게이션 버튼 표시
    if (currentArtworkImages.length > 1) {
        if (prevBtn) prevBtn.style.display = 'flex';
        if (nextBtn) nextBtn.style.display = 'flex';
    } else {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
    }
    
    // 인디케이터 표시
    if (indicators && currentArtworkImages.length > 1) {
        indicators.innerHTML = currentArtworkImages.map((_, index) => 
            `<div class="artwork-carousel-indicator ${index === currentArtworkImageIndex ? 'active' : ''}" onclick="goToArtworkImage(${index})"></div>`
        ).join('');
    } else if (indicators) {
        indicators.innerHTML = '';
    }
}

/**
 * 작품 이미지 업데이트 (하위 호환성)
 */
function updateArtworkImage() {
    updateArtworkMedia();
}

/**
 * 이전 작품 이미지로 이동
 */
export function prevArtworkImage() {
    if (currentArtworkImages.length === 0) return;
    currentArtworkImageIndex = (currentArtworkImageIndex - 1 + currentArtworkImages.length) % currentArtworkImages.length;
    updateArtworkImage();
}

/**
 * 다음 작품 이미지로 이동
 */
export function nextArtworkImage() {
    if (currentArtworkImages.length === 0) return;
    currentArtworkImageIndex = (currentArtworkImageIndex + 1) % currentArtworkImages.length;
    updateArtworkImage();
}

/**
 * 특정 작품 이미지로 이동
 */
export function goToArtworkImage(index) {
    if (index >= 0 && index < currentArtworkImages.length) {
        currentArtworkImageIndex = index;
        updateArtworkImage();
    }
}

/**
 * ESC 키 처리
 */
function handleArtworkModalEscape(e) {
    if (e.key === 'Escape') {
        closeArtworkDetail();
    }
}

/**
 * 작품 삭제
 */
export async function deleteArtwork() {
    if (!currentArtworkId) return;
    
    if (!confirm('정말로 이 게시물을 삭제하시겠습니까?\n삭제된 게시물은 복구할 수 없습니다.')) {
        return;
    }
    
    try {
        // 작품 정보 가져오기
        const { data: artwork } = await window._supabase
            .from('artworks')
            .select('images, image_url')
            .eq('id', currentArtworkId)
            .single();
        
        // 태그 사용 횟수 감소
        await decrementArtworkTags(currentArtworkId);
        
        // Storage에서 모든 이미지 삭제
        if (artwork) {
            const imagesToDelete = artwork.images && artwork.images.length > 0 
                ? artwork.images 
                : [artwork.image_url];
            
            for (const imageUrl of imagesToDelete) {
                if (imageUrl) {
                    try {
                        const fileName = imageUrl.split('/').pop().split('?')[0];
                        await window._supabase.storage
                            .from('posts')
                            .remove([fileName]);
                        console.log('이미지 삭제 성공:', fileName);
                    } catch (err) {
                        console.log('이미지 삭제 실패 (무시):', err);
                    }
                }
            }
        }
        
        // 데이터베이스에서 작품 삭제
        const { error } = await window._supabase
            .from('artworks')
            .delete()
            .eq('id', currentArtworkId);
        
        if (error) {
            console.error('작품 삭제 에러:', error);
            alert('게시물 삭제에 실패했습니다: ' + error.message);
            return;
        }
        
        alert('게시물이 삭제되었습니다.');
        
        // 모달 닫기
        closeArtworkDetail();
        
        // 그리드 새로고침
        await renderArtworksGrid();
        
        // 통계 업데이트
        if (window.updateProfileStats) {
            await window.updateProfileStats();
        }
        
    } catch (err) {
        console.error('작품 삭제 예외:', err);
        alert('게시물 삭제 중 오류가 발생했습니다.');
    }
}

/**
 * 좋아요/싫어요 데이터 로드
 */
async function loadArtworkLikesData(artworkId, userId) {
    try {
        const [likesResult, dislikesResult, userReactionResult] = await Promise.all([
            window._supabase
                .from('artwork_likes')
                .select('*', { count: 'exact', head: true })
                .eq('artwork_id', artworkId)
                .eq('like_type', 'like'),
            window._supabase
                .from('artwork_likes')
                .select('*', { count: 'exact', head: true })
                .eq('artwork_id', artworkId)
                .eq('like_type', 'dislike'),
            userId ? window._supabase
                .from('artwork_likes')
                .select('like_type')
                .eq('artwork_id', artworkId)
                .eq('user_id', userId)
                .maybeSingle() : Promise.resolve({ data: null })
        ]);
        
        const likesCount = likesResult.count || 0;
        const dislikesCount = dislikesResult.count || 0;
        const userReaction = userReactionResult.data?.like_type || null;
        
        // UI 업데이트
        const likeBtn = document.getElementById('artwork-detail-like-btn');
        const likeCountEl = document.getElementById('artwork-detail-like-count');
        const dislikeBtn = document.getElementById('artwork-detail-dislike-btn');
        
        if (likeCountEl) likeCountEl.textContent = likesCount;
        
        if (likeBtn) {
            if (userReaction === 'like') {
                likeBtn.classList.add('liked');
            } else {
                likeBtn.classList.remove('liked');
            }
        }
        
        if (dislikeBtn) {
            if (userReaction === 'dislike') {
                dislikeBtn.classList.add('disliked');
            } else {
                dislikeBtn.classList.remove('disliked');
            }
        }
        
    } catch (err) {
        console.error('좋아요/싫어요 데이터 로드 에러:', err);
    }
}

/**
 * 저장 상태 로드
 */
async function loadArtworkSavedStatus(artworkId, userId) {
    try {
        if (!userId) {
            const saveBtn = document.getElementById('artwork-detail-save-btn');
            if (saveBtn) {
                saveBtn.classList.remove('saved');
            }
            return;
        }
        
        const saved = await isSaved(artworkId, userId);
        const saveBtn = document.getElementById('artwork-detail-save-btn');
        if (saveBtn) {
            if (saved) {
                saveBtn.classList.add('saved');
            } else {
                saveBtn.classList.remove('saved');
            }
        }
    } catch (err) {
        console.error('저장 상태 로드 에러:', err);
    }
}

/**
 * 작품 이미지 뷰어 열기
 */
export function openArtworkImageViewer(startIndex = 0) {
    if (!currentArtworkImages || currentArtworkImages.length === 0) return;
    
    // 이미지 뷰어 모달 생성
    const existingViewer = document.getElementById('artwork-image-viewer-modal');
    if (existingViewer) {
        existingViewer.remove();
    }
    
    const viewerHTML = `
        <div id="artwork-image-viewer-modal" class="image-viewer-modal" onclick="closeArtworkImageViewer()">
            <button class="image-viewer-close" onclick="closeArtworkImageViewer()">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <div class="image-viewer-content" onclick="event.stopPropagation()">
                <img id="artwork-image-viewer-img" src="${escapeHtml(currentArtworkImages[startIndex])}" alt="이미지">
                ${currentArtworkImages.length > 1 ? `
                    <button class="image-viewer-nav image-viewer-prev" onclick="prevArtworkViewerImage()">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <button class="image-viewer-nav image-viewer-next" onclick="nextArtworkViewerImage()">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                    <div class="image-viewer-indicators">
                        ${currentArtworkImages.map((_, idx) => `<div class="image-viewer-indicator ${idx === startIndex ? 'active' : ''}"></div>`).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', viewerHTML);
    
    // 전역 변수로 현재 이미지 정보 저장
    window._artworkImageViewerData = {
        files: currentArtworkImages,
        currentIndex: startIndex
    };
    
    // ESC 키로 닫기
    document.addEventListener('keydown', handleArtworkImageViewerEscape);
}

/**
 * 작품 이미지 뷰어 닫기
 */
export function closeArtworkImageViewer() {
    const viewer = document.getElementById('artwork-image-viewer-modal');
    if (viewer) {
        viewer.remove();
    }
    document.removeEventListener('keydown', handleArtworkImageViewerEscape);
    window._artworkImageViewerData = null;
}

/**
 * 작품 이미지 뷰어 - 이전 이미지
 */
export function prevArtworkViewerImage() {
    if (!window._artworkImageViewerData) return;
    
    const { files, currentIndex } = window._artworkImageViewerData;
    const newIndex = (currentIndex - 1 + files.length) % files.length;
    
    const img = document.getElementById('artwork-image-viewer-img');
    if (img) {
        img.src = files[newIndex];
    }
    
    window._artworkImageViewerData.currentIndex = newIndex;
    updateArtworkImageViewerIndicators(newIndex);
}

/**
 * 작품 이미지 뷰어 - 다음 이미지
 */
export function nextArtworkViewerImage() {
    if (!window._artworkImageViewerData) return;
    
    const { files, currentIndex } = window._artworkImageViewerData;
    const newIndex = (currentIndex + 1) % files.length;
    
    const img = document.getElementById('artwork-image-viewer-img');
    if (img) {
        img.src = files[newIndex];
    }
    
    window._artworkImageViewerData.currentIndex = newIndex;
    updateArtworkImageViewerIndicators(newIndex);
}

/**
 * 작품 이미지 뷰어 인디케이터 업데이트
 */
function updateArtworkImageViewerIndicators(activeIndex) {
    const indicators = document.querySelectorAll('#artwork-image-viewer-modal .image-viewer-indicator');
    indicators.forEach((indicator, idx) => {
        if (idx === activeIndex) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
}

/**
 * ESC 키로 작품 이미지 뷰어 닫기
 */
function handleArtworkImageViewerEscape(e) {
    if (e.key === 'Escape') {
        closeArtworkImageViewer();
    }
}

/**
 * 작품 메뉴 토글
 */
window.toggleArtworkMenu = function(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('artwork-menu-dropdown');
    if (dropdown) {
        const isVisible = dropdown.style.display === 'block';
        dropdown.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            // 외부 클릭 시 메뉴 닫기
            setTimeout(() => {
                document.addEventListener('click', closeArtworkMenuOnOutsideClick);
            }, 0);
        }
    }
};

/**
 * 외부 클릭 시 메뉴 닫기
 */
function closeArtworkMenuOnOutsideClick(event) {
    const dropdown = document.getElementById('artwork-menu-dropdown');
    const menuBtn = document.getElementById('artwork-menu-btn');
    
    if (dropdown && menuBtn && 
        !dropdown.contains(event.target) && 
        !menuBtn.contains(event.target)) {
        dropdown.style.display = 'none';
        document.removeEventListener('click', closeArtworkMenuOnOutsideClick);
    }
}
