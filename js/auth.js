/**
 * @file auth.js
 * @description 사용자 인증 관련 기능 (로그인, 로그아웃)
 * @dependencies supabase-config.js
 * @exports signInWithGoogle, signOut, handleProfileLogout, updateAuthUI
 */

// OAuth 리턴 확인
function isOAuthReturn() {
    var h = window.location.hash || '';
    var q = window.location.search || '';
    return /access_token|refresh_token|code=/.test(h + q);
}

// OAuth 해시 클리어
function clearOAuthHash() {
    if (!isOAuthReturn()) return;
    try {
        var u = new URL(window.location.href);
        u.hash = '';
        u.search = '';
        history.replaceState(null, '', u.pathname + (u.pathname.endsWith('/') ? '' : '/'));
    } catch (e) {}
}

// 로그인 버튼 바인딩
function bindLoginButton() {
    var btn = document.getElementById('btn-login');
    if (!btn) return;
    btn.removeAttribute('onclick');
    btn.addEventListener('click', function () {
        if (typeof signInWithGoogle === 'function') signInWithGoogle();
    });
}

// 인증 UI 업데이트
export function updateAuthUI(session) {
    var loginBtn = document.getElementById('btn-login');
    var userInfo = document.getElementById('user-info');
    var userEmail = document.getElementById('user-email');
    if (session && session.user) {
        if (loginBtn) { loginBtn.style.display = 'none'; loginBtn.disabled = false; }
        if (userInfo) userInfo.style.display = 'flex';
        if (userEmail) userEmail.textContent = session.user.email || '이메일 없음';
        
        // 읽지 않은 쪽지 개수 업데이트
        if (window.updateUnreadCount) {
            window.updateUnreadCount();
        }
    } else {
        if (loginBtn) { 
            loginBtn.style.display = 'inline-flex'; 
            loginBtn.disabled = false;
            // 버튼 내용 복원 (아이콘 + 텍스트)
            var span = loginBtn.querySelector('span');
            if (span) span.textContent = '구글 로그인';
        }
        if (userInfo) userInfo.style.display = 'none';
    }
}

// 구글 로그인
export async function signInWithGoogle() {
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

        if (btn) { 
            btn.disabled = true;
            var span = btn.querySelector('span');
            if (span) span.textContent = '이동 중...';
        }

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
        if (btn) { 
            btn.disabled = false;
            var span = btn.querySelector('span');
            if (span) span.textContent = '구글 로그인';
        }
    }
}

// 로그아웃
export async function signOut() {
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
export async function handleProfileLogout() {
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

// 인증 초기화
export function initAuth() {
    bindLoginButton();
    
    if (isOAuthReturn()) {
        setTimeout(() => {}, 100);
    }
    
    clearOAuthHash();
    
    // 인증 상태 변경 리스너
    if (typeof _supabase !== 'undefined' && _supabase) {
        _supabase.auth.onAuthStateChange(function (event, session) {
            updateAuthUI(session);
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                // 프로필 정보 업데이트는 main.js에서 처리
                if (window.updateProfileInfo) window.updateProfileInfo();
                if (window.renderPosts) window.renderPosts();
            }
        });
    }
}
