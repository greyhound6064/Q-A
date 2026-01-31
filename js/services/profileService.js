/**
 * @file profileService.js
 * @description 프로필 관련 비즈니스 로직 통합 서비스
 */

import { escapeHtml } from '../utils.js';

// ========== 프로필 캐시 ==========
const profilesCache = new Map();

/**
 * 프로필 캐시 초기화
 */
export function clearProfilesCache(userId = null) {
    if (userId) {
        profilesCache.delete(userId);
    } else {
        profilesCache.clear();
    }
}

/**
 * 단일 프로필 조회
 * @param {string} userId - 사용자 ID
 * @param {boolean} useCache - 캐시 사용 여부
 * @returns {Promise<Object|null>} 프로필 객체
 */
export async function getProfile(userId, useCache = true) {
    // 캐시 확인
    if (useCache && profilesCache.has(userId)) {
        return profilesCache.get(userId);
    }
    
    try {
        const { data: profile, error } = await window._supabase
            .from('profiles')
            .select('user_id, nickname, avatar_url, bio, status')
            .eq('user_id', userId)
            .single();
        
        if (error) throw error;
        
        // 캐시 저장
        if (profile) {
            profilesCache.set(userId, profile);
        }
        
        return profile;
    } catch (err) {
        console.error('프로필 조회 에러:', err);
        return null;
    }
}

/**
 * 여러 프로필을 한 번에 조회 (배치 조회)
 * @param {Array<string>} userIds - 사용자 ID 배열
 * @param {boolean} useCache - 캐시 사용 여부
 * @returns {Promise<Map>} userId -> 프로필 객체 맵
 */
export async function getBatchProfiles(userIds, useCache = true) {
    const profilesMap = new Map();
    
    if (!userIds || userIds.length === 0) {
        return profilesMap;
    }
    
    // 고유한 ID만 추출
    const uniqueUserIds = [...new Set(userIds)];
    
    // 캐시에서 먼저 확인
    const uncachedIds = [];
    if (useCache) {
        uniqueUserIds.forEach(userId => {
            if (profilesCache.has(userId)) {
                profilesMap.set(userId, profilesCache.get(userId));
            } else {
                uncachedIds.push(userId);
            }
        });
    } else {
        uncachedIds.push(...uniqueUserIds);
    }
    
    // 캐시에 없는 프로필만 DB에서 조회
    if (uncachedIds.length > 0) {
        try {
            const { data: profiles, error } = await window._supabase
                .from('profiles')
                .select('user_id, nickname, avatar_url, bio, status')
                .in('user_id', uncachedIds);
            
            if (error) throw error;
            
            // 결과를 Map과 캐시에 저장
            profiles?.forEach(profile => {
                profilesMap.set(profile.user_id, profile);
                profilesCache.set(profile.user_id, profile);
            });
            
            // 조회되지 않은 ID는 null로 설정
            uncachedIds.forEach(userId => {
                if (!profilesMap.has(userId)) {
                    profilesMap.set(userId, null);
                }
            });
        } catch (err) {
            console.error('배치 프로필 조회 에러:', err);
            // 에러 발생 시 uncachedIds를 null로 설정
            uncachedIds.forEach(userId => {
                if (!profilesMap.has(userId)) {
                    profilesMap.set(userId, null);
                }
            });
        }
    }
    
    return profilesMap;
}

/**
 * 프로필 아바타 HTML 생성
 * @param {Object|null} profile - 프로필 객체
 * @returns {string} 아바타 HTML
 */
export function getAvatarHTML(profile) {
    if (profile?.avatar_url) {
        return `<img src="${escapeHtml(profile.avatar_url)}" alt="프로필" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    }
    
    // 기본 아바타 아이콘
    return `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>
    `;
}

/**
 * 프로필 업데이트 (캐시 무효화)
 * @param {string} userId - 사용자 ID
 * @param {Object} updates - 업데이트할 필드
 * @returns {Promise<Object|null>} 업데이트된 프로필
 */
export async function updateProfile(userId, updates) {
    try {
        const { data: profile, error } = await window._supabase
            .from('profiles')
            .update(updates)
            .eq('user_id', userId)
            .select()
            .single();
        
        if (error) throw error;
        
        // 캐시 무효화
        clearProfilesCache(userId);
        
        return profile;
    } catch (err) {
        console.error('프로필 업데이트 에러:', err);
        throw err;
    }
}
