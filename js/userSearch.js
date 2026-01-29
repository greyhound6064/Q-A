/**
 * 사용자 검색 기능
 * - 사용자 검색 및 표시
 * - 최근 검색 기록 관리
 */

import { getFollowStats, isFollowing, toggleFollow } from './services/followService.js';

// Supabase 클라이언트 (전역 변수 사용)
const supabase = window._supabase;

// 최근 검색 기록 (로컬 스토리지)
const RECENT_SEARCHES_KEY = 'user_search_recent';
const MAX_RECENT_SEARCHES = 10;

/**
 * 사용자 검색 탭 초기화
 */
export async function initUserSearch() {
    console.log('사용자 검색 탭 초기화');
    
    // 최근 검색 기록 로드
    loadRecentSearches();
}

/**
 * 사용자 검색 처리
 */
export async function handleUserSearch() {
    const searchInput = document.getElementById('user-search-input');
    const clearBtn = document.getElementById('user-search-clear');
    const recentSection = document.getElementById('user-search-recent-section');
    const resultsSection = document.getElementById('user-search-results-section');
    const resultsList = document.getElementById('user-search-results-list');
    
    const searchTerm = searchInput.value.trim();
    
    // 클리어 버튼 표시/숨김
    if (searchTerm) {
        clearBtn.style.display = 'flex';
    } else {
        clearBtn.style.display = 'none';
    }
    
    // 검색어가 없으면 최근 검색 표시
    if (!searchTerm) {
        recentSection.style.display = 'block';
        resultsSection.style.display = 'none';
        return;
    }
    
    // 최근 검색 숨기고 결과 표시
    recentSection.style.display = 'none';
    resultsSection.style.display = 'block';
    
    // 로딩 표시
    resultsList.innerHTML = `
        <div class="user-search-loading">
            <div class="user-search-loading-spinner"></div>
        </div>
    `;
    
    try {
        // 사용자 검색 (닉네임으로만 검색)
        const { data: users, error } = await supabase
            .from('profiles')
            .select('user_id, nickname, bio, avatar_url, status')
            .ilike('nickname', `%${searchTerm}%`)
            .limit(20);
        
        if (error) throw error;
        
        // 검색 결과 렌더링 (이메일 없이)
        renderSearchResults(users || [], searchTerm);
        
    } catch (error) {
        console.error('사용자 검색 오류:', error);
        resultsList.innerHTML = `
            <div class="user-search-no-results">
                검색 중 오류가 발생했습니다.
            </div>
        `;
    }
}

/**
 * 검색 결과 렌더링
 */
function renderSearchResults(users, searchTerm) {
    const resultsList = document.getElementById('user-search-results-list');
    
    if (users.length === 0) {
        resultsList.innerHTML = `
            <div class="user-search-no-results">
                "${searchTerm}"에 대한 검색 결과가 없습니다.
            </div>
        `;
        return;
    }
    
    resultsList.innerHTML = users.map(user => {
        const displayName = user.nickname || '익명';
        const avatarHtml = user.avatar_url 
            ? `<img src="${user.avatar_url}" alt="${displayName}">`
            : `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>`;
        
        // displayName에서 작은따옴표 이스케이프
        const escapedDisplayName = displayName.replace(/'/g, "\\'");
        
        return `
            <div class="user-search-result-item" onclick="selectUser('${user.user_id}', '${escapedDisplayName}')">
                <div class="user-search-result-avatar">
                    ${avatarHtml}
                </div>
                <div class="user-search-result-info">
                    <div class="user-search-result-nickname">${displayName}</div>
                    ${user.bio ? `<div class="user-search-result-bio">${user.bio}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * 사용자 선택 처리
 */
export async function selectUser(userId, displayName) {
    console.log('사용자 선택:', userId, displayName);
    
    // 최근 검색에 추가
    addToRecentSearches(userId, displayName);
    
    // 프로필 탭으로 전환 (타인 프로필이므로 탭 활성화 제거)
    if (window.switchToOtherProfile) {
        window.switchToOtherProfile();
    }
    
    // 선택한 사용자의 프로필 정보 로드
    await loadUserProfile(userId);
}

/**
 * 선택한 사용자의 프로필 정보 로드
 */
async function loadUserProfile(userId) {
    try {
        // 사용자 프로필 정보 가져오기
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('user_id, nickname, bio, avatar_url, status')
            .eq('user_id', userId)
            .single();
        
        if (error) throw error;
        
        // 프로필 정보 업데이트
        const profileAvatar = document.getElementById('profile-avatar');
        const profileUsername = document.getElementById('profile-username');
        const profileBio = document.getElementById('profile-bio');
        
        if (profile) {
            // 아바타 업데이트
            if (profile.avatar_url) {
                profileAvatar.innerHTML = `<img src="${profile.avatar_url}" alt="프로필" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            } else {
                profileAvatar.innerHTML = `
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                `;
            }
            
            // 닉네임 업데이트
            const displayName = profile.nickname || '익명';
            profileUsername.textContent = displayName;
            
            // 소개글 업데이트
            if (profile.bio) {
                profileBio.textContent = profile.bio;
            } else {
                profileBio.textContent = '소개글이 없습니다.';
            }
            
            // 상태 업데이트
            if (window.updateProfileStatuses) {
                let statuses = [];
                try {
                    if (profile?.status) {
                        statuses = typeof profile.status === 'string' ? JSON.parse(profile.status) : profile.status;
                        if (!Array.isArray(statuses)) {
                            statuses = [profile.status];
                        }
                    }
                } catch (e) {
                    statuses = profile?.status ? [profile.status] : [];
                }
                window.updateProfileStatuses(statuses);
            }
            
            // 팔로우 통계 업데이트
            await updateUserFollowStats(userId);
            
            // 팔로우 버튼 표시 (다른 사용자인 경우)
            await updateFollowButton(userId, profile.nickname);
            
            // 현재 보고 있는 사용자 ID 저장
            if (window.setCurrentViewingUserId) {
                window.setCurrentViewingUserId(userId);
            }
            
            // 타인 프로필 UI 표시
            if (window.showOtherProfileUI) {
                window.showOtherProfileUI();
            }
            
            // 프로필 내부 탭을 "XX님의 작품" 탭으로 강제 전환
            const profileTabs = document.querySelectorAll('.profile-tab:not(.logout-tab)');
            profileTabs.forEach(tab => tab.classList.remove('active'));
            
            const postsTab = document.querySelector('.profile-tab[data-profile-tab="posts"]');
            if (postsTab) postsTab.classList.add('active');
            
            const profileContents = document.querySelectorAll('.profile-tab-content');
            profileContents.forEach(content => {
                content.style.display = 'none';
                content.classList.remove('active');
            });
            
            const postsContent = document.getElementById('profile-posts-content');
            if (postsContent) {
                postsContent.style.display = 'block';
                postsContent.classList.add('active');
            }
            
            // 해당 사용자의 작품 로드 (renderArtworksGrid 사용)
            if (window.renderArtworksGrid) {
                await window.renderArtworksGrid(userId);
            }
        }
    } catch (error) {
        console.error('사용자 프로필 로드 오류:', error);
        alert('사용자 프로필을 불러오는 중 오류가 발생했습니다.');
    }
}

/**
 * 사용자 ID로 직접 프로필 로드 (팔로워/팔로잉 목록에서 호출)
 */
export async function selectUserById(userId) {
    // 프로필 탭으로 전환 (타인 프로필이므로 탭 활성화 제거)
    if (window.switchToOtherProfile) {
        window.switchToOtherProfile();
    }
    
    // 선택한 사용자의 프로필 정보 로드
    await loadUserProfile(userId);
}

/**
 * 사용자의 팔로우 통계 업데이트
 */
async function updateUserFollowStats(userId) {
    try {
        const stats = await getFollowStats(userId);
        
        const followersStatEl = document.getElementById('stat-followers');
        if (followersStatEl) followersStatEl.textContent = stats.followers;
        
        const followingStatEl = document.getElementById('stat-following');
        if (followingStatEl) followingStatEl.textContent = stats.following;
        
        // 게시물 수 업데이트
        const { count, error } = await supabase
            .from('artworks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
        
        const postsStatEl = document.getElementById('stat-posts');
        if (postsStatEl) postsStatEl.textContent = error ? 0 : (count || 0);
    } catch (err) {
        console.error('팔로우 통계 업데이트 에러:', err);
    }
}

/**
 * 팔로우 버튼 업데이트
 */
async function updateFollowButton(targetUserId, targetNickname) {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const editBtn = document.getElementById('profile-edit-btn');
        const followBtn = document.getElementById('profile-follow-btn');
        
        if (!session || !session.user) {
            // 로그인하지 않은 경우
            if (editBtn) editBtn.style.display = 'none';
            if (followBtn) followBtn.style.display = 'none';
            return;
        }
        
        if (session.user.id === targetUserId) {
            // 본인 프로필
            if (editBtn) editBtn.style.display = 'inline-block';
            if (followBtn) followBtn.style.display = 'none';
        } else {
            // 다른 사용자 프로필
            if (editBtn) editBtn.style.display = 'none';
            if (followBtn) {
                followBtn.style.display = 'inline-block';
                followBtn.dataset.userId = targetUserId;
                followBtn.dataset.nickname = targetNickname || '사용자';
                
                const following = await isFollowing(session.user.id, targetUserId);
                if (following) {
                    followBtn.textContent = '팔로잉';
                    followBtn.classList.add('following');
                } else {
                    followBtn.textContent = '팔로우';
                    followBtn.classList.remove('following');
                }
            }
        }
    } catch (err) {
        console.error('팔로우 버튼 업데이트 에러:', err);
    }
}

/**
 * 프로필 페이지 팔로우 토글
 */
window.handleProfileFollowToggle = async function() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session || !session.user) {
            alert('로그인이 필요합니다.');
            return;
        }
        
        const followBtn = document.getElementById('profile-follow-btn');
        if (!followBtn) return;
        
        const targetUserId = followBtn.dataset.userId;
        const targetNickname = followBtn.dataset.nickname || '이 사용자';
        if (!targetUserId) return;
        
        const isCurrentlyFollowing = followBtn.classList.contains('following');
        
        // 언팔로우 시 확인 절차
        if (isCurrentlyFollowing) {
            if (!confirm(`${targetNickname}님을 언팔로우 하시겠습니까?`)) {
                return;
            }
        }
        
        followBtn.disabled = true;
        const originalText = followBtn.textContent;
        followBtn.textContent = '처리 중...';
        
        const result = await toggleFollow(session.user.id, targetUserId);
        
        if (result.isFollowing) {
            followBtn.textContent = '팔로잉';
            followBtn.classList.add('following');
        } else {
            followBtn.textContent = '팔로우';
            followBtn.classList.remove('following');
        }
        
        // 통계 업데이트
        await updateUserFollowStats(targetUserId);
        
    } catch (err) {
        console.error('팔로우 토글 에러:', err);
        alert(err.message || '팔로우 처리 중 오류가 발생했습니다.');
        const followBtn = document.getElementById('profile-follow-btn');
        if (followBtn) followBtn.textContent = originalText;
    } finally {
        const followBtn = document.getElementById('profile-follow-btn');
        if (followBtn) followBtn.disabled = false;
    }
};


/**
 * 검색 초기화
 */
export function clearUserSearch() {
    const searchInput = document.getElementById('user-search-input');
    const clearBtn = document.getElementById('user-search-clear');
    const recentSection = document.getElementById('user-search-recent-section');
    const resultsSection = document.getElementById('user-search-results-section');
    
    searchInput.value = '';
    clearBtn.style.display = 'none';
    recentSection.style.display = 'block';
    resultsSection.style.display = 'none';
}

/**
 * 최근 검색 기록 로드
 */
function loadRecentSearches() {
    const recentList = document.getElementById('user-search-recent-list');
    const searches = getRecentSearches();
    
    if (searches.length === 0) {
        recentList.innerHTML = `
            <div class="user-search-empty">
                최근 검색 내역 없음.
            </div>
        `;
        return;
    }
    
    recentList.innerHTML = searches.map((search, index) => `
        <div class="user-search-recent-item">
            <div class="user-search-recent-item-left" onclick="selectUser('${search.userId}', '${search.displayName}')">
                <svg class="user-search-recent-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span class="user-search-recent-item-text">${search.displayName}</span>
            </div>
            <button class="user-search-recent-item-remove" onclick="removeRecentSearch(${index})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `).join('');
}

/**
 * 최근 검색 기록 가져오기
 */
function getRecentSearches() {
    try {
        const searches = localStorage.getItem(RECENT_SEARCHES_KEY);
        return searches ? JSON.parse(searches) : [];
    } catch (error) {
        console.error('최근 검색 기록 로드 오류:', error);
        return [];
    }
}

/**
 * 최근 검색에 추가
 */
function addToRecentSearches(userId, displayName) {
    try {
        let searches = getRecentSearches();
        
        // 중복 제거
        searches = searches.filter(s => s.userId !== userId);
        
        // 맨 앞에 추가
        searches.unshift({ userId, displayName, timestamp: Date.now() });
        
        // 최대 개수 제한
        if (searches.length > MAX_RECENT_SEARCHES) {
            searches = searches.slice(0, MAX_RECENT_SEARCHES);
        }
        
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
        
        // UI 업데이트
        loadRecentSearches();
    } catch (error) {
        console.error('최근 검색 추가 오류:', error);
    }
}

/**
 * 최근 검색 항목 제거
 */
export function removeRecentSearch(index) {
    try {
        let searches = getRecentSearches();
        searches.splice(index, 1);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
        
        // UI 업데이트
        loadRecentSearches();
    } catch (error) {
        console.error('최근 검색 제거 오류:', error);
    }
}
