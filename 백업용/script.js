// ========== 유틸 ==========
function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ========== 탭 전환 ==========
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const currentTabTitle = document.getElementById('current-tab-title');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // 모든 탭 버튼의 active 클래스 제거
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // 클릭한 탭 버튼에 active 클래스 추가
            this.classList.add('active');
            
            // 모든 탭 콘텐츠 숨기기
            tabContents.forEach(content => {
                content.style.display = 'none';
                content.classList.remove('active');
            });
            
            // 선택한 탭 콘텐츠 표시
            const targetContent = document.getElementById(targetTab + '-tab-content');
            if (targetContent) {
                targetContent.style.display = 'block';
                targetContent.classList.add('active');
                
                // 프로필 탭이 활성화되면 프로필 정보 업데이트
                if (targetTab === 'profile') {
                    updateProfileInfo();
                    if (currentTabTitle) currentTabTitle.style.display = 'none';
                } else {
                    if (currentTabTitle) currentTabTitle.style.display = 'block';
                }
            }
            
            // 타이틀 업데이트
            if (currentTabTitle && targetTab !== 'profile') {
                const tabNames = {
                    'feed': '피드',
                    'community': '커뮤니티'
                };
                currentTabTitle.textContent = tabNames[targetTab] || '프로필';
            }
        });
    });
    
    // 프로필 페이지 내부 탭 초기화
    initProfileTabs();
}

// ========== 프로필 페이지 내부 탭 전환 ==========
function initProfileTabs() {
    const profileTabs = document.querySelectorAll('.profile-tab:not(.logout-tab)');
    
    profileTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-profile-tab');
            
            // 로그아웃 탭이 아닌 경우에만 탭 전환
            if (!targetTab) return;
            
            // 모든 프로필 탭 버튼의 active 클래스 제거
            profileTabs.forEach(btn => btn.classList.remove('active'));
            // 클릭한 탭 버튼에 active 클래스 추가
            this.classList.add('active');
            
            // 모든 프로필 탭 콘텐츠 숨기기
            const profileContents = document.querySelectorAll('.profile-tab-content');
            profileContents.forEach(content => {
                content.style.display = 'none';
                content.classList.remove('active');
            });
            
            // 선택한 탭 콘텐츠 표시
            const targetContent = document.getElementById('profile-' + targetTab + '-content');
            if (targetContent) {
                targetContent.style.display = 'block';
                targetContent.classList.add('active');
            }
            
            // 내 게시물 탭이 선택되면 그리드 렌더링
            if (targetTab === 'posts') {
                renderArtworksGrid();
            } else {
                // 다른 탭에서는 플로팅 버튼 숨김
                const floatingBtn = document.getElementById('floating-upload-btn');
                if (floatingBtn) floatingBtn.style.display = 'none';
            }
        });
    });
}

// ========== 프로필 정보 업데이트 ==========
async function updateProfileInfo() {
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
            
            // 로그아웃 버튼 표시
            if (logoutBtn) logoutBtn.style.display = 'block';
            
            // 게시물 통계 업데이트
            await updateProfileStats();
            
            // 게시물 그리드 렌더링
            await renderArtworksGrid();
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
            
            // 통계 초기화
            const postsStatEl = document.getElementById('stat-posts');
            if (postsStatEl) postsStatEl.textContent = '0';
            
            const savedStatEl = document.getElementById('stat-saved');
            if (savedStatEl) savedStatEl.textContent = '0';
        }
    } catch (err) {
        console.error('프로필 정보 업데이트 에러:', err);
    }
}

// ========== 프로필 통계 업데이트 ==========
async function updateProfileStats() {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        
        if (!session || !session.user) {
            return;
        }
        
        // 작품 게시물 수 가져오기 (artworks 테이블)
        const { count: artworksCount, error: artworksError } = await _supabase
            .from('artworks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.id);
        
        const postsCount = artworksError ? 0 : (artworksCount || 0);
        
        // 통계 업데이트
        const postsStatEl = document.getElementById('stat-posts');
        if (postsStatEl) postsStatEl.textContent = postsCount;
        
        // 저장된 게시물 수 (추후 구현)
        const savedStatEl = document.getElementById('stat-saved');
        if (savedStatEl) savedStatEl.textContent = '0';
    } catch (err) {
        console.error('프로필 통계 업데이트 에러:', err);
    }
}

// ========== 1. 초기화 및 인증 상태 ==========
document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (typeof _supabase === 'undefined' || _supabase === null) {
            throw new Error('Supabase 클라이언트가 로드되지 않았습니다. supabase-config.js를 확인하세요.');
        }

        bindLoginButton();
        initTabs(); // 탭 전환 기능 초기화

        if (isOAuthReturn()) {
            await new Promise(function (r) { setTimeout(r, 100); });
        }
        const { data: { session } } = await _supabase.auth.getSession();
        updateAuthUI(session);
        await updateProfileInfo(); // 프로필 정보 업데이트
        await renderPosts();
        clearOAuthHash();
    } catch (err) {
        console.error('초기화 에러:', err);
        alert('앱 초기화 중 오류가 발생했습니다: ' + err.message);
    }
});

function isOAuthReturn() {
    var h = window.location.hash || '';
    var q = window.location.search || '';
    return /access_token|refresh_token|code=/.test(h + q);
}

function clearOAuthHash() {
    if (!isOAuthReturn()) return;
    try {
        var u = new URL(window.location.href);
        u.hash = '';
        u.search = '';
        history.replaceState(null, '', u.pathname + (u.pathname.endsWith('/') ? '' : '/'));
    } catch (e) {}
}

function bindLoginButton() {
    var btn = document.getElementById('btn-login');
    if (!btn) return;
    btn.removeAttribute('onclick');
    btn.addEventListener('click', function () {
        if (typeof signInWithGoogle === 'function') signInWithGoogle();
    });
}

if (typeof _supabase !== 'undefined' && _supabase) {
    _supabase.auth.onAuthStateChange(function (event, session) {
        updateAuthUI(session);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            updateProfileInfo();
            renderPosts();
        }
    });
}

function updateAuthUI(session) {
    var loginBtn = document.getElementById('btn-login');
    var userInfo = document.getElementById('user-info');
    var userEmail = document.getElementById('user-email');
    if (session && session.user) {
        if (loginBtn) { loginBtn.style.display = 'none'; loginBtn.disabled = false; loginBtn.textContent = '구글 로그인'; }
        if (userInfo) userInfo.style.display = 'flex';
        if (userEmail) userEmail.textContent = session.user.email || '이메일 없음';
    } else {
        if (loginBtn) { loginBtn.style.display = 'inline-flex'; loginBtn.disabled = false; loginBtn.textContent = '구글 로그인'; }
        if (userInfo) userInfo.style.display = 'none';
    }
}

// ========== 2. 구글 로그인 / 로그아웃 ==========
async function signInWithGoogle() {
    var btn = document.getElementById('btn-login');
    try {
        console.log('구글 로그인 시작...');

        if (typeof _supabase === 'undefined' || !_supabase) {
            alert('Supabase가 로드되지 않았습니다.');
            console.error('Supabase가 로드되지 않음');
            return;
        }

        var scheme = (window.location.protocol || '').toLowerCase();
        if (!scheme.startsWith('http')) {
            alert('OAuth는 http(s) 환경에서만 동작합니다. 로컬 서버(localhost)로 실행해 주세요.');
            return;
        }

        if (btn) { btn.disabled = true; btn.textContent = '이동 중...'; }

        var base = window.location.origin;
        var path = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
        var redirectTo = base + path + (path.endsWith('/') ? '' : '/');

        console.log('리다이렉트 URL:', redirectTo);

        var res = await _supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectTo,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                }
            }
        });

        console.log('OAuth 응답:', res);

        if (res.error) {
            console.error('OAuth 에러:', res.error);
            alert('구글 로그인 실패: ' + res.error.message);
            return;
        }

        if (res.data && res.data.url) {
            console.log('OAuth URL로 이동:', res.data.url);
            window.location.href = res.data.url;
        } else {
            console.error('OAuth URL을 받지 못함:', res);
            alert('로그인 URL을 받지 못했습니다. Supabase 대시보드에서 Google Provider 설정을 확인해 주세요.');
        }
    } catch (err) {
        console.error('구글 로그인 예외:', err);
        alert('구글 로그인 중 오류: ' + (err.message || String(err)));
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '구글 로그인'; }
    }
}

window.signInWithGoogle = signInWithGoogle;

async function signOut() {
    try {
        var res = await _supabase.auth.signOut();
        if (res && res.error) {
            alert('로그아웃 실패: ' + res.error.message);
            return;
        }
        window.location.reload();
    } catch (err) {
        console.error('로그아웃 예외:', err);
        alert('로그아웃 중 오류가 발생했습니다.');
    }
}

// 프로필 탭에서 로그아웃 처리
async function handleProfileLogout() {
    try {
        if (!confirm('로그아웃 하시겠습니까?')) {
            return;
        }
        
        var btn = document.getElementById('profile-logout-btn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = '로그아웃 중...';
        }
        
        var res = await _supabase.auth.signOut();
        if (res && res.error) {
            alert('로그아웃 실패: ' + res.error.message);
            if (btn) {
                btn.disabled = false;
                btn.textContent = '로그아웃';
            }
            return;
        }
        
        // 로그아웃 후 페이지 새로고침
        window.location.reload();
    } catch (err) {
        console.error('로그아웃 예외:', err);
        alert('로그아웃 중 오류가 발생했습니다.');
        var btn = document.getElementById('profile-logout-btn');
        if (btn) {
            btn.disabled = false;
            btn.textContent = '로그아웃';
        }
    }
}

window.handleProfileLogout = handleProfileLogout;

// ========== 프로필 편집 ==========
let selectedAvatarFile = null;
let currentAvatarUrl = null;

// 프로필 편집 모달 열기
function openProfileEditModal() {
    const modal = document.getElementById('profile-edit-modal');
    if (!modal) return;
    
    // 현재 프로필 정보 로드
    loadCurrentProfileData();
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', handleModalEscape);
    
    // 모달 배경 클릭 시 닫기
    modal.addEventListener('click', handleModalBackgroundClick);
}

// ESC 키 처리
function handleModalEscape(e) {
    if (e.key === 'Escape') {
        closeProfileEditModal();
    }
}

// 모달 배경 클릭 처리
function handleModalBackgroundClick(e) {
    const modal = document.getElementById('profile-edit-modal');
    if (e.target === modal) {
        closeProfileEditModal();
    }
}

// 프로필 편집 모달 닫기
function closeProfileEditModal() {
    const modal = document.getElementById('profile-edit-modal');
    if (!modal) return;
    
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // 이벤트 리스너 제거
    document.removeEventListener('keydown', handleModalEscape);
    modal.removeEventListener('click', handleModalBackgroundClick);
    
    // 선택된 파일 초기화
    selectedAvatarFile = null;
    const fileInput = document.getElementById('avatar-upload');
    if (fileInput) fileInput.value = '';
}

// 현재 프로필 데이터 로드
async function loadCurrentProfileData() {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        
        if (!session || !session.user) {
            alert('로그인이 필요합니다.');
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
        if (nicknameInput) nicknameInput.value = nickname;
        
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
function handleAvatarChange(event) {
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
async function removeAvatar() {
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
async function saveProfileChanges() {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        
        if (!session || !session.user) {
            alert('로그인이 필요합니다.');
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
            alert('프로필 업데이트에 실패했습니다: ' + profileError.message);
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
function updateProfileAvatar(avatarUrl) {
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

window.openProfileEditModal = openProfileEditModal;
window.closeProfileEditModal = closeProfileEditModal;
window.handleAvatarChange = handleAvatarChange;
window.removeAvatar = removeAvatar;
window.saveProfileChanges = saveProfileChanges;

// ========== 작품 업로드 모달 ==========
let selectedUploadImages = []; // 여러 이미지 저장
let currentUploadImageIndex = 0;

// 업로드 모달 열기
function openUploadModal() {
    const modal = document.getElementById('upload-modal');
    if (!modal) return;
    
    // 입력 필드 초기화
    const titleInput = document.getElementById('upload-title');
    const contentInput = document.getElementById('upload-content');
    if (titleInput) titleInput.value = '';
    if (contentInput) contentInput.value = '';
    
    // 이미지 초기화
    selectedUploadImages = [];
    currentUploadImageIndex = 0;
    resetUploadImagePreview();
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', handleUploadModalEscape);
    
    // 모달 배경 클릭 시 닫기
    modal.addEventListener('click', handleUploadModalBackgroundClick);
}

// ESC 키 처리
function handleUploadModalEscape(e) {
    if (e.key === 'Escape') {
        closeUploadModal();
    }
}

// 모달 배경 클릭 처리
function handleUploadModalBackgroundClick(e) {
    const modal = document.getElementById('upload-modal');
    if (e.target === modal) {
        closeUploadModal();
    }
}

// 업로드 모달 닫기
function closeUploadModal() {
    const modal = document.getElementById('upload-modal');
    if (!modal) return;
    
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // 이벤트 리스너 제거
    document.removeEventListener('keydown', handleUploadModalEscape);
    modal.removeEventListener('click', handleUploadModalBackgroundClick);
    
    // 선택된 파일 초기화
    selectedUploadImages = [];
    currentUploadImageIndex = 0;
    const fileInput = document.getElementById('upload-image-input');
    if (fileInput) fileInput.value = '';
    resetUploadImagePreview();
}

// 이미지 미리보기 초기화
function resetUploadImagePreview() {
    const preview = document.getElementById('upload-image-preview');
    const removeBtn = document.querySelector('.upload-remove-btn');
    const prevBtn = document.querySelector('.carousel-nav.prev');
    const nextBtn = document.querySelector('.carousel-nav.next');
    const indicators = document.getElementById('upload-carousel-indicators');
    const selectText = document.getElementById('upload-select-text');
    
    if (preview) {
        preview.classList.remove('has-image');
        preview.innerHTML = `
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <p>이미지를 선택하세요 (최대 10장)</p>
        `;
    }
    
    if (removeBtn) removeBtn.style.display = 'none';
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    if (indicators) indicators.innerHTML = '';
    if (selectText) selectText.textContent = '이미지 선택';
}

// 업로드 이미지 선택 처리 (다중 선택)
function handleUploadImageChange(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    // 기존 이미지와 합쳐서 최대 10장 제한
    const totalImages = selectedUploadImages.length + files.length;
    if (totalImages > 10) {
        alert(`최대 10장까지만 업로드 가능합니다. (현재: ${selectedUploadImages.length}장, 추가: ${files.length}장)`);
        return;
    }
    
    // 각 파일 검증
    for (const file of files) {
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드 가능합니다.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert('각 파일 크기는 10MB 이하여야 합니다.');
            return;
        }
    }
    
    // 기존 이미지에 새 이미지 추가
    selectedUploadImages = [...selectedUploadImages, ...files];
    
    // 새로 추가된 첫 번째 이미지로 이동
    currentUploadImageIndex = selectedUploadImages.length - files.length;
    
    // 파일 입력 초기화 (같은 파일 재선택 가능하도록)
    event.target.value = '';
    
    // 미리보기 표시
    updateUploadImagePreview();
}

// 업로드 이미지 미리보기 업데이트
function updateUploadImagePreview() {
    if (selectedUploadImages.length === 0) {
        resetUploadImagePreview();
        return;
    }
    
    const preview = document.getElementById('upload-image-preview');
    const removeBtn = document.querySelector('.upload-remove-btn');
    const prevBtn = document.querySelector('.carousel-nav.prev');
    const nextBtn = document.querySelector('.carousel-nav.next');
    const indicators = document.getElementById('upload-carousel-indicators');
    const selectText = document.getElementById('upload-select-text');
    
    // 현재 이미지 표시
    const reader = new FileReader();
    reader.onload = function(e) {
        if (preview) {
            preview.classList.add('has-image');
            preview.innerHTML = `<img src="${e.target.result}" alt="업로드 이미지 ${currentUploadImageIndex + 1}">`;
        }
    };
    reader.readAsDataURL(selectedUploadImages[currentUploadImageIndex]);
    
    // 버튼 표시
    if (removeBtn) removeBtn.style.display = 'flex';
    if (selectText) selectText.textContent = `이미지 추가 (${selectedUploadImages.length}/10)`;
    
    // 네비게이션 버튼 표시 (2장 이상일 때)
    if (selectedUploadImages.length > 1) {
        if (prevBtn) prevBtn.style.display = 'flex';
        if (nextBtn) nextBtn.style.display = 'flex';
    } else {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
    }
    
    // 인디케이터 표시
    if (indicators && selectedUploadImages.length > 1) {
        indicators.innerHTML = selectedUploadImages.map((_, index) => 
            `<div class="carousel-indicator ${index === currentUploadImageIndex ? 'active' : ''}" onclick="goToUploadImage(${index})"></div>`
        ).join('');
    } else if (indicators) {
        indicators.innerHTML = '';
    }
}

// 이전 이미지로 이동
function prevUploadImage() {
    if (selectedUploadImages.length === 0) return;
    currentUploadImageIndex = (currentUploadImageIndex - 1 + selectedUploadImages.length) % selectedUploadImages.length;
    updateUploadImagePreview();
}

// 다음 이미지로 이동
function nextUploadImage() {
    if (selectedUploadImages.length === 0) return;
    currentUploadImageIndex = (currentUploadImageIndex + 1) % selectedUploadImages.length;
    updateUploadImagePreview();
}

// 특정 이미지로 이동
function goToUploadImage(index) {
    if (index >= 0 && index < selectedUploadImages.length) {
        currentUploadImageIndex = index;
        updateUploadImagePreview();
    }
}

// 현재 이미지 제거
function removeCurrentUploadImage() {
    if (selectedUploadImages.length === 0) return;
    
    if (!confirm('현재 이미지를 제거하시겠습니까?')) return;
    
    selectedUploadImages.splice(currentUploadImageIndex, 1);
    
    if (selectedUploadImages.length === 0) {
        currentUploadImageIndex = 0;
        const fileInput = document.getElementById('upload-image-input');
        if (fileInput) fileInput.value = '';
        resetUploadImagePreview();
    } else {
        if (currentUploadImageIndex >= selectedUploadImages.length) {
            currentUploadImageIndex = selectedUploadImages.length - 1;
        }
        updateUploadImagePreview();
    }
}

// 게시물 업로드
async function uploadPost() {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        
        if (!session || !session.user) {
            alert('로그인이 필요합니다.');
            return;
        }
        
        const userId = session.user.id;
        const titleInput = document.getElementById('upload-title');
        const contentInput = document.getElementById('upload-content');
        const saveBtn = document.querySelector('#upload-modal .modal-btn.save');
        
        const title = titleInput ? titleInput.value.trim() : '';
        const content = contentInput ? contentInput.value.trim() : '';
        
        if (!title) {
            alert('제목을 입력해주세요.');
            return;
        }
        
        if (selectedUploadImages.length === 0) {
            alert('이미지를 선택해주세요.');
            return;
        }
        
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = '업로드 중...';
        }
        
        const imageUrls = [];
        
        // 여러 이미지를 Supabase Storage에 업로드
        try {
            for (let i = 0; i < selectedUploadImages.length; i++) {
                const file = selectedUploadImages[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${userId}-${Date.now()}-${i}.${fileExt}`;
                const filePath = `${fileName}`;
                
                console.log(`이미지 ${i + 1}/${selectedUploadImages.length} 업로드 시작:`, filePath);
                
                if (saveBtn) {
                    saveBtn.textContent = `업로드 중... (${i + 1}/${selectedUploadImages.length})`;
                }
                
                // Supabase Storage에 업로드
                const { data: uploadData, error: uploadError } = await _supabase.storage
                    .from('posts')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false
                    });
                
                if (uploadError) {
                    console.error('이미지 업로드 에러:', uploadError);
                    throw uploadError;
                }
                
                console.log('이미지 업로드 성공:', uploadData);
                
                // 공개 URL 가져오기
                const { data: urlData } = _supabase.storage
                    .from('posts')
                    .getPublicUrl(filePath);
                
                imageUrls.push(urlData.publicUrl);
                console.log('공개 URL 생성:', urlData.publicUrl);
            }
            
        } catch (err) {
            console.error('이미지 업로드 처리 에러:', err);
            alert('이미지 업로드 중 오류가 발생했습니다: ' + err.message);
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = '게시하기';
            }
            return;
        }
        
        // profiles 테이블에서 닉네임 가져오기
        const { data: profile } = await _supabase
            .from('profiles')
            .select('nickname')
            .eq('user_id', userId)
            .single();
        
        const nickname = profile?.nickname || session.user.email.split('@')[0] || '사용자';
        
        // artworks 테이블에 게시물 저장
        // images 컬럼이 있는지 확인
        const insertData = {
            user_id: userId,
            title: title,
            description: content,
            image_url: imageUrls[0], // 첫 번째 이미지 (호환성)
            author_nickname: nickname,
            author_email: session.user.email
        };
        
        // images 컬럼이 있으면 추가 (없으면 무시)
        try {
            insertData.images = imageUrls;
        } catch (e) {
            console.log('images 컬럼 없음, image_url만 사용');
        }
        
        const { data: postData, error: postError } = await _supabase
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
        
        alert('작품이 성공적으로 업로드되었습니다!');
        
        // 프로필 정보 새로고침
        await updateProfileInfo();
        
        // 작품 그리드 새로고침
        await renderArtworksGrid();
        
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

window.openUploadModal = openUploadModal;
window.closeUploadModal = closeUploadModal;
window.handleUploadImageChange = handleUploadImageChange;
window.removeCurrentUploadImage = removeCurrentUploadImage;
window.prevUploadImage = prevUploadImage;
window.nextUploadImage = nextUploadImage;
window.goToUploadImage = goToUploadImage;
window.uploadPost = uploadPost;

// ========== 작품 그리드 렌더링 ==========
async function renderArtworksGrid() {
    const postsContent = document.getElementById('profile-posts-content');
    if (!postsContent) return;
    
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        
        if (!session || !session.user) {
            postsContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                    </div>
                    <h3>로그인이 필요합니다</h3>
                    <p>작품을 업로드하고 공유하려면 로그인하세요</p>
                </div>
            `;
            return;
        }
        
        // 사용자의 작품 가져오기
        const { data: artworks, error } = await _supabase
            .from('artworks')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('작품 조회 에러:', error);
            postsContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <h3>작품을 불러올 수 없습니다</h3>
                    <p>${error.message}</p>
                </div>
            `;
            return;
        }
        
        // 작품이 없는 경우
        if (!artworks || artworks.length === 0) {
            postsContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                    </div>
                    <h3>바이브코딩 결과물 공유</h3>
                    <p>당신의 창작물을 세상과 공유하세요</p>
                    <button class="empty-action-btn" onclick="openUploadModal()">첫 작품 업로드하기</button>
                </div>
            `;
            // 플로팅 버튼 숨김
            const floatingBtn = document.getElementById('floating-upload-btn');
            if (floatingBtn) floatingBtn.style.display = 'none';
            return;
        }
        
        // 작품 그리드 렌더링
        const gridHTML = artworks.map(artwork => {
            const imageUrl = (artwork.images && artwork.images.length > 0) 
                ? artwork.images[0] 
                : artwork.image_url;
            const hasMultipleImages = artwork.images && artwork.images.length > 1;
            
            return `
                <div class="artwork-grid-item" onclick="openArtworkDetail('${artwork.id}')">
                    <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(artwork.title)}">
                    ${hasMultipleImages ? `
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
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                                <span>0</span>
                            </span>
                            <span class="overlay-stat">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                                <span>0</span>
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        postsContent.innerHTML = `<div class="artworks-grid">${gridHTML}</div>`;
        
        // 플로팅 버튼 표시
        const floatingBtn = document.getElementById('floating-upload-btn');
        if (floatingBtn) floatingBtn.style.display = 'flex';
        
    } catch (err) {
        console.error('작품 그리드 렌더링 에러:', err);
        postsContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <h3>오류가 발생했습니다</h3>
                <p>페이지를 새로고침해주세요</p>
            </div>
        `;
    }
}

// ========== 작품 상세보기 ==========
let currentArtworkId = null;
let currentArtworkImages = [];
let currentArtworkImageIndex = 0;
let currentArtworkData = null;

// ========== 작품 수정 ==========
let editArtworkImages = []; // 기존 이미지 URL 배열
let editNewImages = []; // 새로 추가할 이미지 파일 배열
let currentEditImageIndex = 0;

async function openArtworkDetail(artworkId) {
    const modal = document.getElementById('artwork-detail-modal');
    if (!modal) return;
    
    currentArtworkId = artworkId;
    
    try {
        // 작품 정보 가져오기
        const { data: artwork, error } = await _supabase
            .from('artworks')
            .select('*')
            .eq('id', artworkId)
            .single();
        
        if (error) {
            console.error('작품 조회 에러:', error);
            alert('작품을 불러올 수 없습니다.');
            return;
        }
        
        // 현재 작품 데이터 저장
        currentArtworkData = artwork;
        
        // 현재 사용자 확인
        const { data: { session } } = await _supabase.auth.getSession();
        const isOwner = session && session.user && session.user.id === artwork.user_id;
        
        // 이미지 배열 설정 (images 우선, 없으면 image_url 사용)
        currentArtworkImages = artwork.images && artwork.images.length > 0 
            ? artwork.images 
            : [artwork.image_url];
        currentArtworkImageIndex = 0;
        
        // 이미지 표시
        updateArtworkImage();
        
        // 제목 표시
        const titleEl = document.getElementById('artwork-detail-title');
        if (titleEl) titleEl.textContent = artwork.title;
        
        // 설명 표시
        const descEl = document.getElementById('artwork-detail-description');
        if (descEl) {
            descEl.textContent = artwork.description || '설명이 없습니다.';
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
        
        // 작성자 아바타 (추후 구현)
        const avatarEl = document.getElementById('artwork-author-avatar');
        if (avatarEl) {
            avatarEl.innerHTML = `
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            `;
        }
        
        // 수정/삭제 버튼 표시 (본인 작품일 때만)
        const manageSection = document.getElementById('artwork-manage-section');
        if (manageSection) {
            manageSection.style.display = isOwner ? 'block' : 'none';
        }
        
        // 모달 표시
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // ESC 키로 모달 닫기
        document.addEventListener('keydown', handleArtworkModalEscape);
        
        // 모달 배경 클릭 시 닫기
        modal.addEventListener('click', handleArtworkModalBackgroundClick);
        
    } catch (err) {
        console.error('작품 상세보기 에러:', err);
        alert('작품을 불러오는 중 오류가 발생했습니다.');
    }
}

// 작품 상세보기 모달 닫기
function closeArtworkDetail() {
    const modal = document.getElementById('artwork-detail-modal');
    if (!modal) return;
    
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // 이벤트 리스너 제거
    document.removeEventListener('keydown', handleArtworkModalEscape);
    modal.removeEventListener('click', handleArtworkModalBackgroundClick);
    
    currentArtworkId = null;
    currentArtworkImages = [];
    currentArtworkImageIndex = 0;
}

// 작품 이미지 업데이트
function updateArtworkImage() {
    const imageEl = document.getElementById('artwork-detail-image');
    const prevBtn = document.querySelector('.artwork-carousel-nav.prev');
    const nextBtn = document.querySelector('.artwork-carousel-nav.next');
    const indicators = document.getElementById('artwork-carousel-indicators');
    
    if (imageEl && currentArtworkImages.length > 0) {
        imageEl.src = currentArtworkImages[currentArtworkImageIndex];
    }
    
    // 네비게이션 버튼 표시 (2장 이상일 때)
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

// 이전 작품 이미지로 이동
function prevArtworkImage() {
    if (currentArtworkImages.length === 0) return;
    currentArtworkImageIndex = (currentArtworkImageIndex - 1 + currentArtworkImages.length) % currentArtworkImages.length;
    updateArtworkImage();
}

// 다음 작품 이미지로 이동
function nextArtworkImage() {
    if (currentArtworkImages.length === 0) return;
    currentArtworkImageIndex = (currentArtworkImageIndex + 1) % currentArtworkImages.length;
    updateArtworkImage();
}

// 특정 작품 이미지로 이동
function goToArtworkImage(index) {
    if (index >= 0 && index < currentArtworkImages.length) {
        currentArtworkImageIndex = index;
        updateArtworkImage();
    }
}

// ESC 키 처리
function handleArtworkModalEscape(e) {
    if (e.key === 'Escape') {
        closeArtworkDetail();
    }
}

// 모달 배경 클릭 처리
function handleArtworkModalBackgroundClick(e) {
    const modal = document.getElementById('artwork-detail-modal');
    if (e.target === modal) {
        closeArtworkDetail();
    }
}

// 작품 삭제
async function deleteArtwork() {
    if (!currentArtworkId) return;
    
    if (!confirm('정말로 이 작품을 삭제하시겠습니까?\n삭제된 작품은 복구할 수 없습니다.')) {
        return;
    }
    
    try {
        // 작품 정보 가져오기 (이미지 URL 확인용)
        const { data: artwork } = await _supabase
            .from('artworks')
            .select('images, image_url')
            .eq('id', currentArtworkId)
            .single();
        
        // Storage에서 모든 이미지 삭제
        if (artwork) {
            const imagesToDelete = artwork.images && artwork.images.length > 0 
                ? artwork.images 
                : [artwork.image_url];
            
            for (const imageUrl of imagesToDelete) {
                if (imageUrl) {
                    try {
                        const fileName = imageUrl.split('/').pop().split('?')[0];
                        await _supabase.storage
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
        const { error } = await _supabase
            .from('artworks')
            .delete()
            .eq('id', currentArtworkId);
        
        if (error) {
            console.error('작품 삭제 에러:', error);
            alert('작품 삭제에 실패했습니다: ' + error.message);
            return;
        }
        
        alert('작품이 삭제되었습니다.');
        
        // 모달 닫기
        closeArtworkDetail();
        
        // 그리드 새로고침
        await renderArtworksGrid();
        
        // 통계 업데이트
        await updateProfileStats();
        
    } catch (err) {
        console.error('작품 삭제 예외:', err);
        alert('작품 삭제 중 오류가 발생했습니다.');
    }
}

// 날짜 포맷팅
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// ========== 작품 수정 모달 ==========
function openEditArtworkModal() {
    if (!currentArtworkData) return;
    
    const modal = document.getElementById('edit-artwork-modal');
    if (!modal) return;
    
    // 상세보기 모달 숨기기 (뒤에 보이지 않도록)
    const detailModal = document.getElementById('artwork-detail-modal');
    if (detailModal) {
        detailModal.style.display = 'none';
    }
    
    // 기존 이미지 설정
    editArtworkImages = currentArtworkData.images && currentArtworkData.images.length > 0
        ? [...currentArtworkData.images]
        : [currentArtworkData.image_url];
    editNewImages = [];
    currentEditImageIndex = 0;
    
    // 제목과 설명 설정
    const titleInput = document.getElementById('edit-artwork-title');
    const contentInput = document.getElementById('edit-artwork-content');
    if (titleInput) titleInput.value = currentArtworkData.title || '';
    if (contentInput) contentInput.value = currentArtworkData.description || '';
    
    // 이미지 미리보기 업데이트
    updateEditImagePreview();
    
    // 모달 표시
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', handleEditModalEscape);
    modal.addEventListener('click', handleEditModalBackgroundClick);
}

function closeEditArtworkModal(returnToDetail = true) {
    const modal = document.getElementById('edit-artwork-modal');
    if (!modal) return;
    
    modal.style.display = 'none';
    
    // 상세보기 모달로 돌아가기
    if (returnToDetail) {
        const detailModal = document.getElementById('artwork-detail-modal');
        if (detailModal) {
            detailModal.style.display = 'flex';
        }
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
    
    document.removeEventListener('keydown', handleEditModalEscape);
    modal.removeEventListener('click', handleEditModalBackgroundClick);
    
    // 초기화
    editArtworkImages = [];
    editNewImages = [];
    currentEditImageIndex = 0;
    
    const fileInput = document.getElementById('edit-image-input');
    if (fileInput) fileInput.value = '';
}

function handleEditModalEscape(e) {
    if (e.key === 'Escape') {
        closeEditArtworkModal();
    }
}

function handleEditModalBackgroundClick(e) {
    const modal = document.getElementById('edit-artwork-modal');
    if (e.target === modal) {
        closeEditArtworkModal();
    }
}

// 수정 이미지 미리보기 업데이트
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
    
    // 현재 이미지 표시
    const currentImage = allImages[currentEditImageIndex];
    
    if (preview) {
        preview.classList.add('has-image');
        
        // URL인 경우 (기존 이미지)
        if (typeof currentImage === 'string') {
            preview.innerHTML = `<img src="${currentImage}" alt="작품 이미지 ${currentEditImageIndex + 1}">`;
        } 
        // File 객체인 경우 (새 이미지)
        else {
            const reader = new FileReader();
            reader.onload = function(e) {
                if (preview) {
                    preview.innerHTML = `<img src="${e.target.result}" alt="작품 이미지 ${currentEditImageIndex + 1}">`;
                }
            };
            reader.readAsDataURL(currentImage);
        }
    }
    
    // 버튼 표시
    if (removeBtn) removeBtn.style.display = 'flex';
    if (selectText) selectText.textContent = `이미지 변경 (${allImages.length}/10)`;
    
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
            <p>이미지를 선택하세요 (최대 10장)</p>
        `;
    }
    
    if (removeBtn) removeBtn.style.display = 'none';
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    if (indicators) indicators.innerHTML = '';
    if (selectText) selectText.textContent = '이미지 변경';
}

// 수정 이미지 선택 처리
function handleEditImageChange(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    const allImages = [...editArtworkImages, ...editNewImages];
    const totalImages = allImages.length + files.length;
    
    if (totalImages > 10) {
        alert(`최대 10장까지만 업로드 가능합니다. (현재: ${allImages.length}장, 추가: ${files.length}장)`);
        return;
    }
    
    // 파일 검증
    for (const file of files) {
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드 가능합니다.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert('각 파일 크기는 10MB 이하여야 합니다.');
            return;
        }
    }
    
    // 새 이미지 추가
    editNewImages = [...editNewImages, ...files];
    currentEditImageIndex = allImages.length;
    
    event.target.value = '';
    updateEditImagePreview();
}

function prevEditImage() {
    const allImages = [...editArtworkImages, ...editNewImages];
    if (allImages.length === 0) return;
    currentEditImageIndex = (currentEditImageIndex - 1 + allImages.length) % allImages.length;
    updateEditImagePreview();
}

function nextEditImage() {
    const allImages = [...editArtworkImages, ...editNewImages];
    if (allImages.length === 0) return;
    currentEditImageIndex = (currentEditImageIndex + 1) % allImages.length;
    updateEditImagePreview();
}

function goToEditImage(index) {
    const allImages = [...editArtworkImages, ...editNewImages];
    if (index >= 0 && index < allImages.length) {
        currentEditImageIndex = index;
        updateEditImagePreview();
    }
}

function removeCurrentEditImage() {
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
    
    if (remainingImages.length === 0) {
        alert('최소 1장의 이미지가 필요합니다.');
        // 원래 이미지로 복원
        editArtworkImages = currentArtworkData.images && currentArtworkData.images.length > 0
            ? [...currentArtworkData.images]
            : [currentArtworkData.image_url];
        editNewImages = [];
        currentEditImageIndex = 0;
    } else {
        if (currentEditImageIndex >= remainingImages.length) {
            currentEditImageIndex = remainingImages.length - 1;
        }
    }
    
    updateEditImagePreview();
}

// 작품 수정 저장
async function updateArtwork() {
    console.log('updateArtwork 호출됨');
    console.log('currentArtworkId:', currentArtworkId);
    console.log('currentArtworkData:', currentArtworkData);
    
    if (!currentArtworkId || !currentArtworkData) {
        console.error('작품 정보가 없습니다.');
        alert('작품 정보를 불러올 수 없습니다.');
        return;
    }
    
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        console.log('세션 확인:', session);
        
        if (!session || !session.user) {
            alert('로그인이 필요합니다.');
            return;
        }
        
        const titleInput = document.getElementById('edit-artwork-title');
        const contentInput = document.getElementById('edit-artwork-content');
        const saveBtn = document.querySelector('#edit-artwork-modal .modal-btn.save');
        
        console.log('titleInput:', titleInput);
        console.log('contentInput:', contentInput);
        console.log('saveBtn:', saveBtn);
        
        const title = titleInput ? titleInput.value.trim() : '';
        const content = contentInput ? contentInput.value.trim() : '';
        
        console.log('제목:', title);
        console.log('내용:', content);
        
        if (!title) {
            alert('제목을 입력해주세요.');
            return;
        }
        
        const allImages = [...editArtworkImages, ...editNewImages];
        console.log('전체 이미지:', allImages);
        
        if (allImages.length === 0) {
            alert('최소 1장의 이미지가 필요합니다.');
            return;
        }
        
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = '수정 중...';
        }
        
        console.log('수정 시작...');
        
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
                
                const { data: uploadData, error: uploadError } = await _supabase.storage
                    .from('posts')
                    .upload(fileName, file, {
                        cacheControl: '3600',
                        upsert: false
                    });
                
                if (uploadError) throw uploadError;
                
                const { data: urlData } = _supabase.storage
                    .from('posts')
                    .getPublicUrl(fileName);
                
                newImageUrls.push(urlData.publicUrl);
            }
        }
        
        // 최종 이미지 URL 배열
        const finalImageUrls = [...editArtworkImages, ...newImageUrls];
        console.log('최종 이미지 URL:', finalImageUrls);
        
        // 데이터베이스 업데이트
        if (saveBtn) saveBtn.textContent = '저장 중...';
        
        const updateData = {
            title: title,
            description: content,
            image_url: finalImageUrls[0],
            updated_at: new Date().toISOString()
        };
        
        // images 컬럼이 있으면 추가
        try {
            updateData.images = finalImageUrls;
        } catch (e) {
            console.log('images 컬럼 없음');
        }
        
        console.log('업데이트 데이터:', updateData);
        console.log('작품 ID:', currentArtworkId);
        
        const { error: updateError } = await _supabase
            .from('artworks')
            .update(updateData)
            .eq('id', currentArtworkId);
        
        if (updateError) {
            console.error('작품 수정 에러:', updateError);
            alert('작품 수정에 실패했습니다: ' + updateError.message);
            return;
        }
        
        console.log('작품 수정 성공!');
        alert('작품이 수정되었습니다!');
        
        // 모달 닫기 (상세보기 모달로 돌아가지 않음)
        closeEditArtworkModal(false);
        closeArtworkDetail();
        
        // 그리드 새로고침
        await renderArtworksGrid();
        
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

window.renderArtworksGrid = renderArtworksGrid;
window.openArtworkDetail = openArtworkDetail;
window.closeArtworkDetail = closeArtworkDetail;
window.prevArtworkImage = prevArtworkImage;
window.nextArtworkImage = nextArtworkImage;
window.goToArtworkImage = goToArtworkImage;
window.openEditArtworkModal = openEditArtworkModal;
window.closeEditArtworkModal = closeEditArtworkModal;
window.handleEditImageChange = handleEditImageChange;
window.prevEditImage = prevEditImage;
window.nextEditImage = nextEditImage;
window.goToEditImage = goToEditImage;
window.removeCurrentEditImage = removeCurrentEditImage;
window.updateArtwork = updateArtwork;
window.deleteArtwork = deleteArtwork;

// ========== 3. 게시물 ==========
async function addPost() {
    var titleInput = document.getElementById('post-title');
    var contentInput = document.getElementById('post-content-input');
    var btn = document.querySelector('.post-form button');
    if (!titleInput || !contentInput) return;
    var title = titleInput.value.trim();
    var content = contentInput.value.trim();
    if (!title || !content) {
        alert('제목과 내용을 모두 입력해 주세요.');
        return;
    }
    try {
        var userRes = await _supabase.auth.getUser();
        var user = userRes.data && userRes.data.user;
        if (userRes.error || !user) {
            alert('로그인이 필요합니다.');
            return;
        }
        
        // profiles 테이블에서 닉네임 가져오기
        const { data: profile } = await _supabase
            .from('profiles')
            .select('nickname')
            .eq('user_id', user.id)
            .single();
        
        var nickname = profile?.nickname || user.email.split('@')[0] || '사용자';
        
        if (btn) { btn.disabled = true; btn.textContent = '업로드 중...'; }
        var ins = await _supabase.from('posts').insert([{
            title: title,
            content: content,
            author_email: user.email,
            author_nickname: nickname,
            user_id: user.id
        }]);
        if (ins.error) {
            alert('게시물 업로드 실패: ' + ins.error.message);
            return;
        }
        titleInput.value = '';
        contentInput.value = '';
        await renderPosts();
        await updateProfileStats(); // 프로필 통계 업데이트
    } catch (err) {
        console.error('게시물 업로드 예외:', err);
        alert('게시물 업로드 중 오류: ' + (err.message || String(err)));
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '게시물 업로드'; }
    }
}

async function deletePost(postId) {
    if (!confirm('이 게시물을 삭제할까요?')) return;
    try {
        var r = await _supabase.from('posts').delete().eq('id', postId);
        if (r.error) {
            alert('삭제 실패: ' + r.error.message);
            return;
        }
        await renderPosts();
    } catch (err) {
        console.error('게시물 삭제 예외:', err);
        alert('삭제 중 오류가 발생했습니다.');
    }
}

// ========== 4. 댓글 ==========
async function addComment(postId) {
    var input = document.getElementById('comment-input-' + postId);
    if (!input) return;
        var content = (input.value || '').trim();
        if (!content) return;
        console.log('addComment: 댓글 내용', content);
        try {
            var userRes = await _supabase.auth.getUser();
            var user = userRes.data && userRes.data.user;
            console.log('addComment: 현재 사용자 정보', user);
            if (userRes.error || !user) {
            alert('로그인 후 댓글을 작성할 수 있습니다.');
            return;
        }
        
        // profiles 테이블에서 닉네임 가져오기
        const { data: profile } = await _supabase
            .from('profiles')
            .select('nickname')
            .eq('user_id', user.id)
            .single();
        
        var nickname = profile?.nickname || user.email.split('@')[0] || '사용자';
        
        var ins = await _supabase.from('comments').insert([{
            post_id: postId,
            content: content,
            author_email: user.email,
            author_nickname: nickname,
            user_id: user.id
        }]);
        if (ins.error) {
            alert('댓글 등록 실패: ' + ins.error.message);
            return;
        }
        input.value = '';
        await renderPosts();
    } catch (err) {
        console.error('댓글 등록 예외:', err);
        alert('댓글 등록 중 오류: ' + (err.message || String(err)));
    }
}

async function deleteComment(commentId) {
    if (!confirm('댓글을 삭제할까요?')) return;
    try {
        var r = await _supabase.from('comments').delete().eq('id', commentId);
        if (r.error) {
            alert('댓글 삭제 실패: ' + r.error.message);
            return;
        }
        await renderPosts();
    } catch (err) {
        console.error('댓글 삭제 예외:', err);
        alert('댓글 삭제 중 오류가 발생했습니다.');
    }
}

// ========== 5. 게시물 목록 렌더링 ==========
async function renderPosts() {
    var postList = document.getElementById('post-list');
    if (!postList) return;
    try {
        var res = await _supabase.from('posts').select('*, comments(*)').order('created_at', { ascending: false });
        if (res.error) {
            postList.innerHTML = '<p class="error-msg">게시물을 불러올 수 없습니다. ' + escapeHtml(res.error.message) + '</p>';
            return;
        }
        var posts = res.data;
        var currentUser = await _supabase.auth.getUser();
        var currentUserId = currentUser.data.user ? currentUser.data.user.id : null;

        if (!posts || posts.length === 0) {
            postList.innerHTML = '<p class="empty-msg">아직 게시물이 없습니다.</p>';
            return;
        }
        postList.innerHTML = posts.map(function (post) {
            var title = escapeHtml(post.title);
            var body = escapeHtml(post.content);
            // 닉네임 우선 표시, 없으면 이메일에서 추출
            var author = escapeHtml(post.author_nickname || (post.author_email || '').split('@')[0] || '알 수 없음');
            var createdAt = post.created_at ? new Date(post.created_at).toLocaleString('ko-KR') : '';
            var comments = Array.isArray(post.comments) ? post.comments : [];
            var deleteButtonHtml = '';
            if (currentUserId && currentUserId === post.user_id) {
                deleteButtonHtml = '<button type="button" class="delete-btn" onclick="deletePost(\'' + (post.id != null ? post.id : '') + '\')">삭제</button>';
            }

            var commentLis = comments.map(function (c) {
                // 댓글도 닉네임 우선 표시
                var cAuthor = escapeHtml(c.author_nickname || (c.author_email || '').split('@')[0] || '알 수 없음');
                var cContent = escapeHtml(c.content || '');
                var deleteCommentButtonHtml = '';
                if (currentUserId && currentUserId === c.user_id) {
                    deleteCommentButtonHtml = '<button type="button" class="delete-comment-btn" onclick="deleteComment(\'' + (c.id != null ? c.id : '') + '\')">삭제</button>';
                }
                return '<li class="comment-item">' +
                    '<span><strong>' + cAuthor + ':</strong> ' + cContent + '</span>' +
                    deleteCommentButtonHtml + '</li>';
            }).join('');
            return '<div class="post-card">' +
                '<div class="post-header">' +
                '<h3 style="cursor: pointer;" onclick="togglePostContent(\'post-content-' + post.id + '\')">' + title + '</h3>' +
                deleteButtonHtml +
                '</div><p id="post-content-' + post.id + '\" class="post-content-hidden">' + body + '</p>' +
                '<small>작성자: ' + author + ' | ' + createdAt + '</small>' +
                '<div class="comment-section">' +
                '<ul class="comment-list">' + commentLis + '</ul>' +
                '<div class="comment-input-group">' +
                '<input type="text" id="comment-input-' + post.id + '" placeholder="댓글을 입력하세요" />' +
                '<button type="button" onclick="addComment(\'' + (post.id != null ? post.id : '') + '\')">등록</button>' +
                '</div></div></div>';
        }).join('');
    } catch (err) {
        console.error('게시물 렌더링 예외:', err);
        postList.innerHTML = '<p class="error-msg">게시물을 불러오는 중 오류가 발생했습니다.</p>';
    }
}

function togglePostContent(contentId) {
    var contentElement = document.getElementById(contentId);
    if (contentElement) {
        contentElement.classList.toggle('post-content-hidden');
    }
}