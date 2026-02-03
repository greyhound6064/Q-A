/**
 * @file profile.js
 * @description 프로필 조회 및 수정 기능
 * @dependencies supabase-config.js, utils.js, nicknameValidator.js
 * @exports updateProfileInfo, updateProfileStats, openProfileEditModal, closeProfileEditModal, 
 *          handleAvatarChange, removeAvatar, saveProfileChanges, updateProfileAvatar
 */

import { validateNickname, updateNicknameValidationUI, debounce } from './nicknameValidator.js';
import { getFollowStats, getFollowers, getFollowing, toggleFollow, isFollowing } from './services/followService.js';
import { getSavedArtworks } from './services/saveService.js';
import { renderArtworksGrid } from './artwork/artworkGrid.js';
import { showLoginRequiredModal } from './utils/errorHandler.js';
import { historyManager } from './utils/historyManager.js';

let selectedAvatarFile = null;
let currentAvatarUrl = null;
let nicknameCheckTimeout = null;
let currentViewingUserId = null; // 현재 보고 있는 사용자 ID (본인 또는 타인)
let currentStatuses = []; // 현재 선택된 상태 목록
let selectedCustomEmoji = '😴'; // 커스텀 상태 선택된 이모지

// 상태 정보 매핑
const STATUS_INFO = {
    breathing: { emoji: '💡', text: '영감 얻는 중' },
    developing: { emoji: '🔥', text: '작품 개발 중' }
};

/** onclick 등 HTML 속성에 넣을 값 이스케이프 (따옴표/역슬래시) */
function escapeAttr(val) {
    if (val == null) return '';
    return String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// 프로필 정보 업데이트
export async function updateProfileInfo() {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        const logoutBtn = document.getElementById('profile-logout-btn');
        
        if (session && session.user) {
            const user = session.user;
            const userId = user.id;
            
            // profiles 테이블에서 프로필 정보 가져오기
            const { data: profile, error: profileError } = await _supabase
                .from('profiles')
                .select('*')
                .eq('user_id', userId)
                .single();
            
            if (profileError && profileError.code !== 'PGRST116') {
                console.error('프로필 조회 에러:', profileError);
            }
            
            const email = user.email || '';
            const nickname = profile?.nickname || email.split('@')[0] || '사용자';
            const bio = profile?.bio || '';
            const avatarUrl = profile?.avatar_url || null;
            
            // 닉네임 업데이트
            const usernameEl = document.getElementById('profile-username');
            if (usernameEl) usernameEl.textContent = nickname;
            
            // 소개 업데이트
            const bioEl = document.getElementById('profile-bio');
            if (bioEl) bioEl.textContent = bio || '소개글이 아직 없습니다.';
            
            // 프로필 아바타 업데이트
            updateProfileAvatar(avatarUrl);
            
            // 상태 업데이트 (JSON 배열로 저장된 상태 파싱)
            let statuses = [];
            try {
                if (profile?.status) {
                    statuses = typeof profile.status === 'string' ? JSON.parse(profile.status) : profile.status;
                    if (!Array.isArray(statuses)) {
                        statuses = [profile.status]; // 기존 단일 값 호환성
                    }
                }
            } catch (e) {
                statuses = profile?.status ? [profile.status] : [];
            }
            updateProfileStatuses(statuses);
            
            // 로그아웃 버튼 표시
            if (logoutBtn) logoutBtn.style.display = 'block';
            
            // 현재 보고 있는 사용자 ID 저장 (본인)
            currentViewingUserId = userId;
            
            // 본인 프로필 UI 설정
            showOwnProfileUI();
            
            // 게시물 통계 업데이트
            await updateProfileStats();
            
            // 팔로우 통계 업데이트
            await updateFollowStats();
            
            // 게시물 그리드 렌더링 (기본: gallery 필터)
            if (window.renderArtworksGrid) await window.renderArtworksGrid(userId, 'gallery');
        } else {
            // 로그인하지 않은 경우 기본값 표시
            const usernameEl = document.getElementById('profile-username');
            if (usernameEl) usernameEl.textContent = '로그인이 필요합니다';
            
            const bioEl = document.getElementById('profile-bio');
            if (bioEl) bioEl.textContent = '구글 계정으로 로그인하여 프로필을 확인하세요';
            
            // 프로필 아바타 초기화
            updateProfileAvatar(null);
            
            // 로그아웃 버튼 숨김
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    } catch (err) {
        console.error('프로필 정보 업데이트 에러:', err);
    }
}

// 프로필 통계 업데이트 (제거됨 - 통계 표시 없음)
export async function updateProfileStats() {
    // 통계 표시가 제거되어 더 이상 사용하지 않음
}

// 프로필 편집 모달 열기
export function openProfileEditModal() {
    const modal = document.getElementById('profile-edit-modal');
    if (!modal) return;
    
    // 현재 프로필 정보 로드
    loadCurrentProfileData();
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    
    // 히스토리 추가
    if (!historyManager.isRestoringState()) {
        historyManager.pushModalState('profile-edit-modal');
    }
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', handleModalEscape);
}

// 프로필 편집 모달 닫기
export function closeProfileEditModal() {
    const modal = document.getElementById('profile-edit-modal');
    if (!modal) return;
    
    modal.style.display = 'none';
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
    
    // 이벤트 리스너 제거
    document.removeEventListener('keydown', handleModalEscape);
    
    // 선택된 파일 초기화
    selectedAvatarFile = null;
    const fileInput = document.getElementById('avatar-upload');
    if (fileInput) fileInput.value = '';
    
    // 뒤로 가기 (히스토리 복원 중이 아닐 때만)
    if (!historyManager.isRestoringState()) {
        historyManager.goBack();
    }
}

// ESC 키 처리
function handleModalEscape(e) {
    if (e.key === 'Escape') {
        closeProfileEditModal();
    }
}

// 현재 프로필 데이터 로드
async function loadCurrentProfileData() {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        
        if (!session || !session.user) {
            showLoginRequiredModal();
            closeProfileEditModal();
            return;
        }
        
        const user = session.user;
        const userId = user.id;
        const email = user.email || '';
        const username = email.split('@')[0] || '';
        
        // profiles 테이블에서 프로필 정보 가져오기
        const { data: profile, error: profileError } = await _supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
            console.error('프로필 조회 에러:', profileError);
        }
        
        const nickname = profile?.nickname || username;
        const bio = profile?.bio || '';
        const avatarUrl = profile?.avatar_url || null;
        
        // 닉네임 필드 설정
        const nicknameInput = document.getElementById('edit-nickname');
        if (nicknameInput) {
            nicknameInput.value = nickname;
            // 실시간 닉네임 검증 이벤트 리스너 추가
            setupNicknameValidation(nicknameInput, userId);
        }
        
        // 닉네임 변경 제한 정보 표시
        await displayNicknameChangeLimit(userId);
        
        // 소개 필드 설정
        const bioInput = document.getElementById('edit-bio');
        if (bioInput) bioInput.value = bio;
        
        // 아바타 미리보기 설정
        currentAvatarUrl = avatarUrl;
        updateAvatarPreview(avatarUrl);
        
    } catch (err) {
        console.error('프로필 데이터 로드 에러:', err);
    }
}

// 닉네임 변경 제한 정보 표시
async function displayNicknameChangeLimit(userId) {
    try {
        // 닉네임 변경 제한 확인
        const { data: limitCheck, error: limitError } = await _supabase
            .rpc('check_nickname_change_limit', { p_user_id: userId });
        
        if (limitError) {
            console.error('닉네임 변경 제한 확인 에러:', limitError);
            return;
        }
        
        // 기존 안내 문구 제거
        const existingNotice = document.querySelector('.nickname-change-notice');
        if (existingNotice) {
            existingNotice.remove();
        }
        
        if (limitCheck && limitCheck.length > 0) {
            const result = limitCheck[0];
            const nicknameFormGroup = document.querySelector('#edit-nickname').closest('.edit-form-group');
            
            if (!nicknameFormGroup) return;
            
            // 안내 문구 생성
            const noticeDiv = document.createElement('div');
            noticeDiv.className = 'nickname-change-notice';
            
            let noticeHTML = '';
            
            if (result.can_change) {
                // 변경 가능한 경우
                if (result.change_count === 0) {
                    noticeHTML = `
                        <div class="notice-info">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                            <span>닉네임은 30일 동안 <strong>최대 2번</strong>까지 변경할 수 있습니다.</span>
                        </div>
                    `;
                } else if (result.remaining_changes === 1) {
                    noticeHTML = `
                        <div class="notice-warning">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                            <span>최근 30일 내 <strong>${result.change_count}번</strong> 변경했습니다. <strong>1번</strong>의 변경 기회가 남았습니다.</span>
                        </div>
                    `;
                }
            } else {
                // 변경 불가능한 경우
                const nextDate = new Date(result.next_available_date);
                const dateStr = nextDate.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                noticeHTML = `
                    <div class="notice-error">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        <div>
                            <div><strong>닉네임 변경 불가</strong></div>
                            <div style="margin-top: 4px; font-size: 13px;">30일 내 2번 변경 제한에 도달했습니다.</div>
                            <div style="margin-top: 4px; font-size: 13px;">다음 변경 가능 날짜: <strong>${dateStr}</strong></div>
                        </div>
                    </div>
                `;
                
                // 닉네임 입력 필드 비활성화
                const nicknameInput = document.getElementById('edit-nickname');
                if (nicknameInput) {
                    nicknameInput.disabled = true;
                    nicknameInput.style.opacity = '0.6';
                    nicknameInput.style.cursor = 'not-allowed';
                }
            }
            
            noticeDiv.innerHTML = noticeHTML;
            
            // 닉네임 입력 필드 아래에 안내 문구 삽입
            const formHint = nicknameFormGroup.querySelector('.form-hint');
            if (formHint) {
                formHint.insertAdjacentElement('afterend', noticeDiv);
            } else {
                nicknameFormGroup.appendChild(noticeDiv);
            }
        }
    } catch (err) {
        console.error('닉네임 변경 제한 정보 표시 에러:', err);
    }
}

// 아바타 미리보기 업데이트
function updateAvatarPreview(imageUrl) {
    const preview = document.getElementById('edit-avatar-preview');
    if (!preview) return;
    
    if (imageUrl) {
        preview.innerHTML = `<img src="${imageUrl}" alt="프로필 이미지">`;
    } else {
        preview.innerHTML = `
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
        `;
    }
}

// 아바타 파일 선택 처리
export function handleAvatarChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 이미지 파일인지 확인
    if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
    }
    
    // 파일 크기 확인 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
    }
    
    selectedAvatarFile = file;
    
    // 미리보기 표시
    const reader = new FileReader();
    reader.onload = function(e) {
        updateAvatarPreview(e.target.result);
    };
    reader.readAsDataURL(file);
}

// 아바타 삭제
export async function removeAvatar() {
    if (!confirm('프로필 사진을 삭제하시겠습니까?')) {
        return;
    }
    
    // Storage에서 기존 이미지 삭제
    if (currentAvatarUrl) {
        try {
            const fileName = currentAvatarUrl.split('/').pop().split('?')[0];
            await _supabase.storage
                .from('avatars')
                .remove([fileName]);
            console.log('Storage에서 이미지 삭제:', fileName);
        } catch (err) {
            console.error('이미지 삭제 에러:', err);
        }
    }
    
    selectedAvatarFile = null;
    currentAvatarUrl = null;
    updateAvatarPreview(null);
    
    const fileInput = document.getElementById('avatar-upload');
    if (fileInput) fileInput.value = '';
}

// 프로필 변경사항 저장
export async function saveProfileChanges() {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        
        if (!session || !session.user) {
            showLoginRequiredModal();
            return;
        }
        
        const userId = session.user.id;
        const nicknameInput = document.getElementById('edit-nickname');
        const bioInput = document.getElementById('edit-bio');
        const saveBtn = document.querySelector('.modal-btn.save');
        
        const nickname = nicknameInput ? nicknameInput.value.trim() : '';
        const bio = bioInput ? bioInput.value.trim() : '';
        
        if (!nickname) {
            alert('닉네임을 입력해주세요.');
            return;
        }
        
        // 닉네임 유효성 검사
        const validation = await validateNickname(nickname, userId);
        if (!validation.valid) {
            alert(validation.message);
            return;
        }
        
        // 현재 프로필 정보 조회 (닉네임 변경 여부 확인)
        const { data: currentProfile } = await _supabase
            .from('profiles')
            .select('nickname')
            .eq('user_id', userId)
            .single();
        
        // 닉네임이 변경된 경우에만 변경 제한 확인
        if (currentProfile && currentProfile.nickname !== nickname) {
            // 닉네임 변경 제한 확인
            const { data: limitCheck, error: limitError } = await _supabase
                .rpc('check_nickname_change_limit', { p_user_id: userId });
            
            if (limitError) {
                console.error('닉네임 변경 제한 확인 에러:', limitError);
                alert('닉네임 변경 제한 확인 중 오류가 발생했습니다.');
                return;
            }
            
            if (limitCheck && limitCheck.length > 0) {
                const result = limitCheck[0];
                
                if (!result.can_change) {
                    const nextDate = new Date(result.next_available_date);
                    const dateStr = nextDate.toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    alert(
                        `⚠️ 닉네임 변경 제한\n\n` +
                        `닉네임은 30일 동안 최대 2번까지만 변경할 수 있습니다.\n\n` +
                        `현재 변경 횟수: ${result.change_count}/2\n` +
                        `다음 변경 가능 날짜: ${dateStr}\n\n` +
                        `신중하게 닉네임을 선택해주세요.`
                    );
                    return;
                }
                
                // 변경 가능하지만 경고 표시
                if (result.remaining_changes === 1) {
                    const confirmMsg = 
                        `⚠️ 닉네임 변경 안내\n\n` +
                        `현재 변경 횟수: ${result.change_count}/2\n` +
                        `남은 변경 횟수: ${result.remaining_changes}번\n\n` +
                        `30일 동안 1번의 변경 기회만 남았습니다.\n` +
                        `정말로 닉네임을 변경하시겠습니까?`;
                    
                    if (!confirm(confirmMsg)) {
                        return;
                    }
                }
            }
        }
        
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = '저장 중...';
        }
        
        let avatarUrl = currentAvatarUrl;
        
        // 새 이미지가 선택된 경우 Supabase Storage에 업로드
        if (selectedAvatarFile) {
            try {
                const fileExt = selectedAvatarFile.name.split('.').pop();
                const fileName = `${userId}-${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;
                
                console.log('이미지 업로드 시작:', filePath);
                
                // 기존 아바타가 있으면 삭제
                if (currentAvatarUrl) {
                    try {
                        const oldFileName = currentAvatarUrl.split('/').pop().split('?')[0];
                        await _supabase.storage
                            .from('avatars')
                            .remove([oldFileName]);
                        console.log('기존 이미지 삭제:', oldFileName);
                    } catch (deleteErr) {
                        console.log('기존 이미지 삭제 실패 (무시):', deleteErr);
                    }
                }
                
                // Supabase Storage에 업로드
                const { data: uploadData, error: uploadError } = await _supabase.storage
                    .from('avatars')
                    .upload(filePath, selectedAvatarFile, {
                        cacheControl: '3600',
                        upsert: true
                    });
                
                if (uploadError) {
                    console.error('이미지 업로드 에러:', uploadError);
                    throw uploadError;
                }
                
                console.log('이미지 업로드 성공:', uploadData);
                
                // 공개 URL 가져오기
                const { data: urlData } = _supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);
                
                avatarUrl = urlData.publicUrl;
                console.log('공개 URL 생성:', avatarUrl);
                
            } catch (err) {
                console.error('이미지 업로드 처리 에러:', err);
                alert('이미지 업로드 중 오류가 발생했습니다: ' + err.message);
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = '저장';
                }
                return;
            }
        }
        
        // profiles 테이블에 프로필 정보 저장 (upsert)
        const { data: profileData, error: profileError } = await _supabase
            .from('profiles')
            .upsert({
                user_id: userId,
                nickname: nickname,
                bio: bio,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            })
            .select()
            .single();
        
        if (profileError) {
            console.error('프로필 업데이트 에러:', profileError);
            // 닉네임 중복 에러 처리
            if (profileError.code === '23505') {
                alert('이미 사용 중인 닉네임입니다. 다른 닉네임을 선택해주세요.');
            } else {
                alert('프로필 업데이트에 실패했습니다: ' + profileError.message);
            }
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = '저장';
            }
            return;
        }
        
        console.log('프로필 저장 성공:', profileData);
        
        // user_metadata에도 저장 (호환성)
        await _supabase.auth.updateUser({
            data: {
                nickname: nickname,
                bio: bio
            }
        });
        
        alert('프로필이 성공적으로 업데이트되었습니다.');
        
        // 프로필 정보 새로고침
        await updateProfileInfo();
        
        // 모달 닫기
        closeProfileEditModal();
        
    } catch (err) {
        console.error('프로필 저장 예외:', err);
        alert('프로필 저장 중 오류가 발생했습니다: ' + (err.message || String(err)));
    } finally {
        const saveBtn = document.querySelector('.modal-btn.save');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = '저장';
        }
    }
}

// 프로필 아바타 업데이트
export function updateProfileAvatar(avatarUrl) {
    const profileAvatar = document.getElementById('profile-avatar');
    if (!profileAvatar) return;
    
    if (avatarUrl) {
        profileAvatar.innerHTML = `<img src="${avatarUrl}" alt="프로필 이미지" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    } else {
        profileAvatar.innerHTML = `
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
        `;
    }
}

// 팔로우 통계 업데이트
export async function updateFollowStats() {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        
        if (!session || !session.user) {
            return;
        }
        
        const stats = await getFollowStats(session.user.id);
        
        const followersStatEl = document.getElementById('stat-followers');
        if (followersStatEl) followersStatEl.textContent = stats.followers;
        
        const followingStatEl = document.getElementById('stat-following');
        if (followingStatEl) followingStatEl.textContent = stats.following;
    } catch (err) {
        console.error('팔로우 통계 업데이트 에러:', err);
    }
}

// 팔로워 모달 열기
export async function openFollowersModal() {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        
        if (!session || !session.user) {
            showLoginRequiredModal();
            return;
        }
        
        const modal = document.getElementById('followers-modal');
        if (!modal) return;
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
        
        // 히스토리 추가
        if (!historyManager.isRestoringState()) {
            historyManager.pushModalState('followers-modal');
        }
        
        const listEl = document.getElementById('followers-list');
        if (listEl) listEl.innerHTML = '<div class="follow-empty">로딩 중...</div>';
        
        // 현재 보고 있는 사용자의 팔로워 조회 (본인 프로필이므로 session.user.id 사용)
        const targetUserId = currentViewingUserId || session.user.id;
        const followers = await getFollowers(targetUserId);
        
        if (followers.length === 0) {
            listEl.innerHTML = '<div class="follow-empty">팔로워가 없습니다.</div>';
            return;
        }
        
        listEl.innerHTML = '';
        for (const follow of followers) {
            const profile = follow.follower_profile;
            if (!profile) continue;
            
            const following = await isFollowing(session.user.id, profile.user_id);
            const uid = escapeAttr(profile.user_id);
            const nick = escapeAttr(profile.nickname);
            
            const item = document.createElement('div');
            item.className = 'follow-item';
            item.setAttribute('data-user-id', profile.user_id);
            item.innerHTML = `
                <div class="follow-avatar" style="cursor: pointer;">
                    ${profile.avatar_url 
                        ? `<img src="${profile.avatar_url}" alt="${profile.nickname}">` 
                        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>`
                    }
                </div>
                <div class="follow-info" style="cursor: pointer;">
                    <p class="follow-nickname">${profile.nickname || '사용자'}</p>
                    <p class="follow-bio">${profile.bio || ''}</p>
                </div>
                ${profile.user_id !== session.user.id 
                    ? `<button class="follow-btn ${following ? 'following' : ''}" 
                        onclick="handleFollowToggle('${uid}', '${nick}', this)">
                        ${following ? '팔로잉' : '팔로우'}
                    </button>` 
                    : ''
                }
            `;
            listEl.appendChild(item);
        }
    } catch (err) {
        console.error('팔로워 모달 열기 에러:', err);
        alert('팔로워 목록을 불러오는 중 오류가 발생했습니다.');
    }
}

// 팔로잉 모달 열기
export async function openFollowingModal() {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        
        if (!session || !session.user) {
            showLoginRequiredModal();
            return;
        }
        
        const modal = document.getElementById('following-modal');
        if (!modal) return;
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
        
        // 히스토리 추가
        if (!historyManager.isRestoringState()) {
            historyManager.pushModalState('following-modal');
        }
        
        const listEl = document.getElementById('following-list');
        if (listEl) listEl.innerHTML = '<div class="follow-empty">로딩 중...</div>';
        
        // 현재 보고 있는 사용자의 팔로잉 조회 (본인 프로필이므로 session.user.id 사용)
        const targetUserId = currentViewingUserId || session.user.id;
        const following = await getFollowing(targetUserId);
        
        console.log('팔로잉 데이터:', following);
        
        if (following.length === 0) {
            listEl.innerHTML = '<div class="follow-empty">팔로잉이 없습니다.</div>';
            return;
        }
        
        listEl.innerHTML = '';
        for (const follow of following) {
            const profile = follow.following_profile;
            if (!profile) {
                console.warn('프로필 데이터 없음:', follow);
                continue;
            }
            
            const uid = escapeAttr(profile.user_id);
            const nick = escapeAttr(profile.nickname);
            const item = document.createElement('div');
            item.className = 'follow-item';
            item.setAttribute('data-user-id', profile.user_id);
            item.innerHTML = `
                <div class="follow-avatar" style="cursor: pointer;">
                    ${profile.avatar_url 
                        ? `<img src="${profile.avatar_url}" alt="${profile.nickname}">` 
                        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>`
                    }
                </div>
                <div class="follow-info" style="cursor: pointer;">
                    <p class="follow-nickname">${profile.nickname || '사용자'}</p>
                    <p class="follow-bio">${profile.bio || ''}</p>
                </div>
                <button class="follow-btn following" 
                    onclick="handleFollowToggle('${uid}', '${nick}', this)">
                    팔로잉
                </button>
            `;
            listEl.appendChild(item);
        }
    } catch (err) {
        console.error('팔로잉 모달 열기 에러:', err);
        alert('팔로잉 목록을 불러오는 중 오류가 발생했습니다.');
    }
}

// 팔로워 모달 닫기 (skipGoBack: true면 히스토리 뒤로가기 생략 - 사용자 프로필로 이동 시 사용)
export function closeFollowersModal(skipGoBack = false) {
    const modal = document.getElementById('followers-modal');
    if (!modal) return;
    
    modal.style.display = 'none';
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
    
    if (!skipGoBack && !historyManager.isRestoringState()) {
        historyManager.goBack();
    }
}

// 팔로잉 모달 닫기 (skipGoBack: true면 히스토리 뒤로가기 생략 - 사용자 프로필로 이동 시 사용)
export function closeFollowingModal(skipGoBack = false) {
    const modal = document.getElementById('following-modal');
    if (!modal) return;
    
    modal.style.display = 'none';
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
    
    if (!skipGoBack && !historyManager.isRestoringState()) {
        historyManager.goBack();
    }
}

// 팔로우 토글 핸들러
export async function handleFollowToggle(targetUserId, targetNickname, buttonEl) {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        
        if (!session || !session.user) {
            showLoginRequiredModal();
            return;
        }
        
        const isCurrentlyFollowing = buttonEl.classList.contains('following');
        
        // 언팔로우 시 확인 절차
        if (isCurrentlyFollowing) {
            const displayName = targetNickname || '이 사용자';
            if (!confirm(`${displayName}님을 언팔로우 하시겠습니까?`)) {
                return;
            }
        }
        
        buttonEl.disabled = true;
        const originalText = buttonEl.textContent;
        buttonEl.textContent = '처리 중...';
        
        const result = await toggleFollow(session.user.id, targetUserId);
        
        if (result.isFollowing) {
            buttonEl.textContent = '팔로잉';
            buttonEl.classList.add('following');
        } else {
            buttonEl.textContent = '팔로우';
            buttonEl.classList.remove('following');
        }
        
        // 통계 업데이트
        await updateFollowStats();
        
    } catch (err) {
        console.error('팔로우 토글 에러:', err);
        alert(err.message || '팔로우 처리 중 오류가 발생했습니다.');
        buttonEl.textContent = originalText;
    } finally {
        buttonEl.disabled = false;
    }
}

// 본인 프로필 UI 표시
export function showOwnProfileUI() {
    const editBtn = document.getElementById('profile-edit-btn');
    const followBtn = document.getElementById('profile-follow-btn');
    const messageBtn = document.getElementById('profile-message-btn');
    const uploadBtn = document.getElementById('profile-upload-btn');
    const postsTabLabel = document.getElementById('profile-posts-tab-label');
    const savedTab = document.getElementById('profile-saved-tab');
    const followTab = document.getElementById('profile-follow-tab');
    const logoutTab = document.getElementById('profile-logout-tab');
    const subTabs = document.querySelector('.profile-sub-tabs'); // 서브 탭
    const privacyNotice = document.getElementById('profile-privacy-notice'); // 안내 문구
    const statusContainer = document.getElementById('profile-status-container');
    
    if (editBtn) editBtn.style.display = 'inline-block';
    if (followBtn) followBtn.style.display = 'none';
    if (messageBtn) messageBtn.style.display = 'none'; // 본인 프로필에서는 쪽지 버튼 숨김
    if (uploadBtn) uploadBtn.style.display = 'flex';
    if (postsTabLabel) postsTabLabel.textContent = '내 게시물';
    if (savedTab) savedTab.style.display = 'flex';
    if (followTab) followTab.style.display = 'flex';
    if (logoutTab) logoutTab.style.display = 'flex';
    if (subTabs) subTabs.style.display = 'flex'; // 본인 프로필에서는 서브 탭 표시
    if (privacyNotice) privacyNotice.style.display = 'flex'; // 본인 프로필에서는 안내 문구 표시
    if (statusContainer) {
        statusContainer.style.display = 'block';
        statusContainer.classList.remove('readonly');
    }
}

// 타인 프로필 UI 표시
export function showOtherProfileUI() {
    const editBtn = document.getElementById('profile-edit-btn');
    const uploadBtn = document.getElementById('profile-upload-btn');
    const messageBtn = document.getElementById('profile-message-btn');
    const postsTabLabel = document.getElementById('profile-posts-tab-label');
    const savedTab = document.getElementById('profile-saved-tab');
    const followTab = document.getElementById('profile-follow-tab');
    const logoutTab = document.getElementById('profile-logout-tab');
    const subTabs = document.querySelector('.profile-sub-tabs'); // 서브 탭
    const privacyNotice = document.getElementById('profile-privacy-notice'); // 안내 문구
    const statusContainer = document.getElementById('profile-status-container');
    const usernameEl = document.getElementById('profile-username');
    const username = usernameEl ? usernameEl.textContent : '사용자';
    
    if (editBtn) editBtn.style.display = 'none';
    if (uploadBtn) uploadBtn.style.display = 'none';
    if (messageBtn) messageBtn.style.display = 'flex'; // 쪽지 버튼 표시
    if (postsTabLabel) postsTabLabel.textContent = `${username}님의 작품`;
    if (savedTab) savedTab.style.display = 'none';
    if (followTab) followTab.style.display = 'none';
    if (logoutTab) logoutTab.style.display = 'none';
    if (subTabs) subTabs.style.display = 'none'; // 타인 프로필에서는 서브 탭 숨김
    if (privacyNotice) privacyNotice.style.display = 'none'; // 타인 프로필에서는 안내 문구 숨김
    if (statusContainer) {
        statusContainer.style.display = 'block';
        statusContainer.classList.add('readonly');
    }
}

// 현재 보고 있는 사용자 ID 관리
export function setCurrentViewingUserId(userId) {
    currentViewingUserId = userId;
}

export function getCurrentViewingUserId() {
    return currentViewingUserId;
}

// 사용자 ID로 프로필 로드 (팔로워/팔로잉 목록에서 클릭 시)
export async function loadUserProfileById(userId) {
    try {
        userId = (userId || '').trim();
        if (!userId) return;
        
        const { data: { session } } = await _supabase.auth.getSession();
        
        // 본인 프로필인 경우 (문자열 비교로 타입 차이 방지)
        const currentId = session?.user?.id ? String(session.user.id) : '';
        if (currentId && currentId === String(userId)) {
            if (window.switchTab) window.switchTab('profile');
            if (window.updateProfileInfo) await window.updateProfileInfo();
            closeFollowersModal();
            closeFollowingModal();
            return;
        }
        
        // 타인 프로필: 프로필 탭으로 전환 후 해당 사용자 프로필 로드
        if (typeof window.selectUserById !== 'function') {
            console.error('selectUserById not available');
            alert('프로필을 불러올 수 없습니다.');
            return;
        }
        await window.selectUserById(userId);
        // 모달만 닫고 goBack() 호출 안 함 → 히스토리 복원으로 본인 프로필로 덮어씌워지는 것 방지
        closeFollowersModal(true);
        closeFollowingModal(true);
    } catch (error) {
        console.error('프로필 로드 에러:', error);
        alert('프로필을 불러오는 중 오류가 발생했습니다.');
    }
}

/** 팔로워/팔로잉 목록에서 아바타·이름 클릭 시 프로필로 이동 (이벤트 위임, 전파 차단) */
function initFollowListClickDelegation() {
    document.addEventListener('click', (e) => {
        const avatarOrInfo = e.target.closest('.follow-avatar') || e.target.closest('.follow-info');
        if (!avatarOrInfo) return;
        if (e.target.closest('.follow-btn')) return;
        const item = avatarOrInfo.closest('.follow-item');
        if (!item) return;
        const uid = item.getAttribute('data-user-id');
        if (!uid) return;
        e.preventDefault();
        e.stopPropagation();
        if (window.loadUserProfileById) window.loadUserProfileById(uid);
    }, true);
}

/**
 * 저장된 게시물 렌더링
 */
export async function renderSavedArtworks() {
    const savedContent = document.getElementById('profile-saved-content');
    if (!savedContent) return;
    
    try {
        const { data: { session } } = await window._supabase.auth.getSession();
        
        if (!session || !session.user) {
            savedContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </div>
                    <h3>로그인이 필요합니다</h3>
                    <p>저장된 게시물을 보려면 로그인하세요</p>
                </div>
            `;
            return;
        }
        
        const savedArtworks = await getSavedArtworks(session.user.id);
        
        if (!savedArtworks || savedArtworks.length === 0) {
            savedContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </div>
                    <h3>저장된 게시물 없음</h3>
                    <p>마음에 드는 작품을 저장하고 나중에 다시 감상하세요</p>
                </div>
            `;
            return;
        }
        
        // 저장된 작품을 그리드 형식으로 렌더링
        const { escapeHtml } = await import('./utils.js');
        const { getBatchLikesData } = await import('./services/likeService.js');
        const { getBatchCommentCounts } = await import('./services/commentService.js');
        
        // 작품 ID 배열 추출
        const artworkIds = savedArtworks.map(a => a.id);
        
        // 좋아요 수와 댓글 수를 배치로 조회
        const [likesMap, commentsMap] = await Promise.all([
            getBatchLikesData(artworkIds, session.user.id),
            getBatchCommentCounts(artworkIds)
        ]);
        
        const gridHTML = savedArtworks.map(artwork => {
            const fileUrl = (artwork.images && artwork.images.length > 0) 
                ? artwork.images[0] 
                : artwork.image_url;
            const hasMultipleFiles = artwork.images && artwork.images.length > 1;
            const mediaType = artwork.media_type || 'image';
            
            // 좋아요 수와 댓글 수 가져오기
            const likesData = likesMap.get(artwork.id) || { likes: 0 };
            const commentCount = commentsMap.get(artwork.id) || 0;
            
            // 미디어 타입에 따른 썸네일
            let thumbnailHTML = '';
            if (mediaType === 'video') {
                thumbnailHTML = `
                    <video style="width: 100%; height: 100%; object-fit: cover;">
                        <source src="${escapeHtml(fileUrl)}" type="video/mp4">
                    </video>
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.6); border-radius: 50%; padding: 12px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                    </div>
                `;
            } else if (mediaType === 'audio') {
                thumbnailHTML = `
                    <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--primary), var(--primary-hover));">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                            <path d="M9 18V5l12-2v13"></path>
                            <circle cx="6" cy="18" r="3"></circle>
                            <circle cx="18" cy="16" r="3"></circle>
                        </svg>
                    </div>
                `;
            } else {
                thumbnailHTML = `<img src="${escapeHtml(fileUrl)}" alt="${escapeHtml(artwork.title)}">`;
            }
            
            return `
                <div class="artwork-grid-item" onclick="openArtworkDetail('${artwork.id}')">
                    ${thumbnailHTML}
                    ${hasMultipleFiles ? `
                        <div class="grid-multiple-indicator">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <rect x="7" y="7" width="10" height="10" rx="1" ry="1"></rect>
                            </svg>
                        </div>
                    ` : ''}
                    <div class="artwork-overlay">
                        <div class="artwork-overlay-stats">
                            <span class="overlay-stat">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                                </svg>
                                <span>${likesData.likes}</span>
                            </span>
                            <span class="overlay-stat">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                                <span>${commentCount}</span>
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        savedContent.innerHTML = `<div class="artworks-grid">${gridHTML}</div>`;
        
    } catch (err) {
        console.error('저장된 게시물 렌더링 에러:', err);
        savedContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <h3>오류가 발생했습니다</h3>
                <p>저장된 게시물을 불러오는 중 오류가 발생했습니다</p>
            </div>
        `;
    }
}

// ========== 프로필 게시물 필터링 ==========
export async function filterProfilePosts(filter) {
    // 서브 탭 활성화 상태 변경
    const subTabs = document.querySelectorAll('.profile-sub-tab');
    subTabs.forEach(tab => {
        if (tab.dataset.postFilter === filter) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // 현재 보고 있는 사용자 ID 가져오기
    const userId = currentViewingUserId;
    
    // 필터에 따라 게시물 렌더링
    await renderArtworksGrid(userId, filter);
}

// ========== 팔로워·팔로잉 통합 화면 렌더링 ==========
export async function renderFollowUnified() {
    const followersCountEl = document.getElementById('follow-section-followers-count');
    const followingCountEl = document.getElementById('follow-section-following-count');
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        if (session?.user) {
            const stats = await getFollowStats(currentViewingUserId || session.user.id);
            if (followersCountEl) followersCountEl.textContent = `(${stats.followers})`;
            if (followingCountEl) followingCountEl.textContent = `(${stats.following})`;
        } else {
            if (followersCountEl) followersCountEl.textContent = '';
            if (followingCountEl) followingCountEl.textContent = '';
        }
    } catch (err) {
        if (followersCountEl) followersCountEl.textContent = '';
        if (followingCountEl) followingCountEl.textContent = '';
    }
    await Promise.all([renderFollowersInline(), renderFollowingInline()]);
}

// ========== 인라인 팔로워 렌더링 ==========
export async function renderFollowersInline() {
    const listEl = document.getElementById('followers-list-inline');
    if (!listEl) return;
    
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        
        if (!session || !session.user) {
            listEl.innerHTML = '<div class="follow-empty">로그인이 필요합니다.</div>';
            return;
        }
        
        listEl.innerHTML = '<div class="follow-empty">로딩 중...</div>';
        
        const targetUserId = currentViewingUserId || session.user.id;
        const followers = await getFollowers(targetUserId);
        
        if (followers.length === 0) {
            listEl.innerHTML = '<div class="follow-empty">팔로워가 없습니다.</div>';
            return;
        }
        
        listEl.innerHTML = '';
        
        for (const follower of followers) {
            const profile = follower.follower_profile;
            if (!profile) continue;
            
            // 팔로우 상태 확인
            const following = await isFollowing(session.user.id, profile.user_id);
            const uid = escapeAttr(profile.user_id);
            const nick = escapeAttr(profile.nickname);
            
            const item = document.createElement('div');
            item.className = 'follow-item';
            item.setAttribute('data-user-id', profile.user_id);
            item.innerHTML = `
                <div class="follow-avatar" style="cursor: pointer;">
                    ${profile.avatar_url 
                        ? `<img src="${profile.avatar_url}" alt="${profile.nickname}">` 
                        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>`
                    }
                </div>
                <div class="follow-info" style="cursor: pointer;">
                    <p class="follow-nickname">${profile.nickname || '사용자'}</p>
                    <p class="follow-bio">${profile.bio || ''}</p>
                </div>
                ${profile.user_id !== session.user.id 
                    ? `<button class="follow-btn ${following ? 'following' : ''}" 
                        onclick="handleFollowToggle('${uid}', '${nick}', this)">
                        ${following ? '팔로잉' : '팔로우'}
                    </button>` 
                    : ''
                }
            `;
            listEl.appendChild(item);
        }
    } catch (err) {
        console.error('팔로워 렌더링 에러:', err);
        listEl.innerHTML = '<div class="follow-empty">팔로워 목록을 불러올 수 없습니다.</div>';
    }
}

// ========== 인라인 팔로잉 렌더링 ==========
export async function renderFollowingInline() {
    const listEl = document.getElementById('following-list-inline');
    if (!listEl) return;
    
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        
        if (!session || !session.user) {
            listEl.innerHTML = '<div class="follow-empty">로그인이 필요합니다.</div>';
            return;
        }
        
        listEl.innerHTML = '<div class="follow-empty">로딩 중...</div>';
        
        const targetUserId = currentViewingUserId || session.user.id;
        const following = await getFollowing(targetUserId);
        
        if (following.length === 0) {
            listEl.innerHTML = '<div class="follow-empty">팔로잉이 없습니다.</div>';
            return;
        }
        
        listEl.innerHTML = '';
        
        for (const follow of following) {
            const profile = follow.following_profile;
            if (!profile) continue;
            
            const uid = escapeAttr(profile.user_id);
            const nick = escapeAttr(profile.nickname);
            const item = document.createElement('div');
            item.className = 'follow-item';
            item.setAttribute('data-user-id', profile.user_id);
            item.innerHTML = `
                <div class="follow-avatar" style="cursor: pointer;">
                    ${profile.avatar_url 
                        ? `<img src="${profile.avatar_url}" alt="${profile.nickname}">` 
                        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>`
                    }
                </div>
                <div class="follow-info" style="cursor: pointer;">
                    <p class="follow-nickname">${profile.nickname || '사용자'}</p>
                    <p class="follow-bio">${profile.bio || ''}</p>
                </div>
                <button class="follow-btn following" 
                    onclick="handleFollowToggle('${uid}', '${nick}', this)">
                    팔로잉
                </button>
            `;
            listEl.appendChild(item);
        }
    } catch (err) {
        console.error('팔로잉 렌더링 에러:', err);
        listEl.innerHTML = '<div class="follow-empty">팔로잉 목록을 불러올 수 없습니다.</div>';
    }
}

// ========== 프로필 상태 관리 ==========
// 상태 목록 렌더링
function renderStatusBadges() {
    const listEl = document.getElementById('profile-status-list');
    const addBtn = document.getElementById('profile-status-add-btn');
    if (!listEl) return;
    
    listEl.innerHTML = '';
    
    // 상태 배지 렌더링
    currentStatuses.forEach(status => {
        let statusInfo;
        let statusKey;
        
        // 커스텀 상태인지 확인 (객체 형태)
        if (typeof status === 'object' && status.emoji && status.text) {
            statusInfo = status;
            statusKey = `custom_${status.text}`;
        } else {
            statusInfo = STATUS_INFO[status];
            statusKey = status;
        }
        
        if (!statusInfo) return;
        
        const badge = document.createElement('div');
        badge.className = 'profile-status-badge';
        
        // 이스케이프 처리
        const escapedKey = statusKey.replace(/'/g, "\\'");
        
        badge.innerHTML = `
            <span class="status-emoji">${statusInfo.emoji}</span>
            <span class="status-text">${statusInfo.text}</span>
            <span class="status-remove" onclick="removeProfileStatusByKey('${escapedKey}')">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </span>
        `;
        listEl.appendChild(badge);
    });
    
    // 상태 추가 버튼을 마지막 상태 배지의 오른쪽에 배치
    // 버튼이 컨테이너에 있으면 제거하고 리스트 내부로 이동
    if (addBtn && addBtn.parentElement) {
        addBtn.parentElement.removeChild(addBtn);
    }
    
    // 상태 추가 버튼을 리스트의 마지막에 추가
    if (addBtn) {
        listEl.appendChild(addBtn);
    }
    
    // 드롭다운 옵션 비활성화 업데이트
    updateDropdownOptions();
}

// 드롭다운 옵션 업데이트
function updateDropdownOptions() {
    const options = document.querySelectorAll('.status-option');
    options.forEach(option => {
        const status = option.dataset.status;
        if (currentStatuses.includes(status)) {
            option.classList.add('disabled');
            option.style.pointerEvents = 'none';
        } else {
            option.classList.remove('disabled');
            option.style.pointerEvents = 'auto';
        }
    });
}

// 상태 목록 업데이트 (외부에서 호출)
export function updateProfileStatuses(statuses) {
    currentStatuses = Array.isArray(statuses) ? statuses : [];
    renderStatusBadges();
}

// 전역에서 접근 가능하도록 등록
window.updateProfileStatuses = updateProfileStatuses;

// 상태 추가
window.addProfileStatus = async function(status) {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        if (!session || !session.user) return;
        
        // 이미 추가된 상태인지 확인
        if (currentStatuses.includes(status)) {
            return;
        }
        
        // 상태 추가
        currentStatuses.push(status);
        
        // DB 업데이트 (JSON 배열로 저장)
        const { error } = await _supabase
            .from('profiles')
            .update({ status: JSON.stringify(currentStatuses) })
            .eq('user_id', session.user.id);
        
        if (error) {
            console.error('상태 업데이트 에러:', error);
            currentStatuses.pop(); // 실패시 롤백
            return;
        }
        
        // UI 업데이트
        renderStatusBadges();
        
        // 드롭다운 닫기
        const dropdown = document.getElementById('profile-status-dropdown');
        if (dropdown) dropdown.style.display = 'none';
    } catch (err) {
        console.error('상태 추가 에러:', err);
    }
};

// 상태 제거 (키로 제거)
window.removeProfileStatusByKey = async function(statusKey) {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        if (!session || !session.user) return;
        
        // 상태 제거
        currentStatuses = currentStatuses.filter(s => {
            if (typeof s === 'object') {
                return `custom_${s.text}` !== statusKey;
            }
            return s !== statusKey;
        });
        
        // DB 업데이트
        const { error } = await _supabase
            .from('profiles')
            .update({ status: JSON.stringify(currentStatuses) })
            .eq('user_id', session.user.id);
        
        if (error) {
            console.error('상태 업데이트 에러:', error);
            return;
        }
        
        // UI 업데이트
        renderStatusBadges();
    } catch (err) {
        console.error('상태 제거 에러:', err);
    }
};

// 상태 제거 (하위 호환성)
window.removeProfileStatus = window.removeProfileStatusByKey;

// 상태 드롭다운 토글
window.toggleStatusDropdown = function() {
    const dropdown = document.getElementById('profile-status-dropdown');
    if (!dropdown) return;
    
    const isVisible = dropdown.style.display === 'block';
    dropdown.style.display = isVisible ? 'none' : 'block';
};

// ========== 커스텀 상태 모달 ==========
// 커스텀 상태 모달 열기
window.openCustomStatusModal = function() {
    const modal = document.getElementById('custom-status-modal');
    if (!modal) return;
    
    // 드롭다운 닫기
    const dropdown = document.getElementById('profile-status-dropdown');
    if (dropdown) dropdown.style.display = 'none';
    
    // 모달 초기화
    selectedCustomEmoji = '😴';
    document.getElementById('custom-status-text').value = '';
    document.getElementById('preview-emoji').textContent = '😴';
    document.getElementById('preview-text').textContent = '상태 메시지를 입력하세요';
    
    // 이모지 선택 초기화
    document.querySelectorAll('.emoji-option').forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.emoji === '😴') {
            option.classList.add('selected');
        }
    });
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
};

// 커스텀 상태 모달 닫기
window.closeCustomStatusModal = function() {
    const modal = document.getElementById('custom-status-modal');
    if (!modal) return;
    
    modal.style.display = 'none';
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
};

// 이모지 선택
window.selectEmoji = function(emoji) {
    selectedCustomEmoji = emoji;
    
    // 선택 상태 업데이트
    document.querySelectorAll('.emoji-option').forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.emoji === emoji) {
            option.classList.add('selected');
        }
    });
    
    // 미리보기 업데이트
    document.getElementById('preview-emoji').textContent = emoji;
};

// 커스텀 상태 저장
window.saveCustomStatus = async function() {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        if (!session || !session.user) return;
        
        const text = document.getElementById('custom-status-text').value.trim();
        
        if (!text) {
            alert('상태 메시지를 입력해주세요.');
            return;
        }
        
        // 커스텀 상태 객체 생성
        const customStatus = {
            emoji: selectedCustomEmoji,
            text: text,
            custom: true
        };
        
        // 상태 추가
        currentStatuses.push(customStatus);
        
        // DB 업데이트
        const { error } = await _supabase
            .from('profiles')
            .update({ status: JSON.stringify(currentStatuses) })
            .eq('user_id', session.user.id);
        
        if (error) {
            console.error('상태 업데이트 에러:', error);
            currentStatuses.pop();
            alert('상태 추가 중 오류가 발생했습니다.');
            return;
        }
        
        // UI 업데이트
        renderStatusBadges();
        
        // 모달 닫기
        closeCustomStatusModal();
    } catch (err) {
        console.error('커스텀 상태 저장 에러:', err);
        alert('상태 추가 중 오류가 발생했습니다.');
    }
};

// 상태 메시지 입력 시 미리보기 업데이트
document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('custom-status-text');
    if (textInput) {
        textInput.addEventListener('input', (e) => {
            const text = e.target.value.trim();
            const previewText = document.getElementById('preview-text');
            if (previewText) {
                previewText.textContent = text || '상태 메시지를 입력하세요';
            }
        });
    }
});

// 외부 클릭 시 드롭다운 닫기 + 팔로우 목록 클릭 위임 (전파 차단으로 잘못된 탭 전환 방지)
document.addEventListener('DOMContentLoaded', () => {
    initFollowListClickDelegation();
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('profile-status-dropdown');
        const addBtn = document.getElementById('profile-status-add-btn');
        
        if (dropdown && addBtn && !addBtn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
});

// 전역 함수로 등록
window.openFollowersModal = openFollowersModal;
window.openFollowingModal = openFollowingModal;
window.closeFollowersModal = closeFollowersModal;
window.closeFollowingModal = closeFollowingModal;
window.handleFollowToggle = handleFollowToggle;
window.setCurrentViewingUserId = setCurrentViewingUserId;
window.getCurrentViewingUserId = getCurrentViewingUserId;
window.loadUserProfileById = loadUserProfileById;
window.renderSavedArtworks = renderSavedArtworks;
window.filterProfilePosts = filterProfilePosts;
window.renderFollowUnified = renderFollowUnified;
window.renderFollowersInline = renderFollowersInline;
window.renderFollowingInline = renderFollowingInline;
