/**
 * @file saveService.js
 * @description 게시물 저장 관련 비즈니스 로직 통합 서비스
 */

// ========== 저장 캐시 ==========
const savedCache = new Map();

/**
 * 저장 캐시 초기화
 */
export function clearSavedCache(artworkId = null, userId = null) {
    if (artworkId && userId) {
        // 특정 작품과 사용자의 캐시만 삭제
        savedCache.delete(`${artworkId}_${userId}`);
    } else if (artworkId) {
        // 특정 작품의 모든 캐시 삭제
        for (const key of savedCache.keys()) {
            if (key.startsWith(`${artworkId}_`)) {
                savedCache.delete(key);
            }
        }
    } else {
        // 모든 캐시 삭제
        savedCache.clear();
    }
}

/**
 * 작품 저장 여부 확인
 * @param {string} artworkId - 작품 ID
 * @param {string} userId - 사용자 ID
 * @param {boolean} useCache - 캐시 사용 여부
 * @returns {Promise<boolean>} 저장 여부
 */
export async function isSaved(artworkId, userId, useCache = true) {
    if (!userId) return false;
    
    const cacheKey = `${artworkId}_${userId}`;
    if (useCache && savedCache.has(cacheKey)) {
        return savedCache.get(cacheKey);
    }
    
    try {
        const { data, error } = await window._supabase
            .from('saved_artworks')
            .select('id')
            .eq('artwork_id', artworkId)
            .eq('user_id', userId)
            .maybeSingle();
        
        const isSavedValue = !error && data !== null;
        savedCache.set(cacheKey, isSavedValue);
        
        return isSavedValue;
    } catch (err) {
        console.error('저장 여부 확인 에러:', err);
        return false;
    }
}

/**
 * 작품 저장 토글
 * @param {string} artworkId - 작품 ID
 * @returns {Promise<boolean>} 저장 여부 (저장됨: true, 저장 취소됨: false)
 */
export async function toggleSave(artworkId) {
    try {
        const { data: { session } } = await window._supabase.auth.getSession();
        if (!session || !session.user) {
            throw new Error('로그인이 필요합니다.');
        }
        
        const userId = session.user.id;
        
        // 작품 정보 가져오기 (작성자 확인)
        const { data: artwork, error: artworkError } = await window._supabase
            .from('artworks')
            .select('user_id')
            .eq('id', artworkId)
            .single();
        
        if (artworkError) throw artworkError;
        
        // 자기 자신의 게시물은 저장할 수 없음
        if (artwork.user_id === userId) {
            throw new Error('자신의 게시물은 저장할 수 없습니다.');
        }
        
        // 현재 저장 여부 확인
        const currentlySaved = await isSaved(artworkId, userId, false);
        
        if (currentlySaved) {
            // 저장 취소
            const { error } = await window._supabase
                .from('saved_artworks')
                .delete()
                .eq('artwork_id', artworkId)
                .eq('user_id', userId);
            
            if (error) throw error;
            
            // 캐시 무효화
            clearSavedCache(artworkId, userId);
            
            return false;
        } else {
            // 저장
            const { error } = await window._supabase
                .from('saved_artworks')
                .insert({
                    artwork_id: artworkId,
                    user_id: userId
                });
            
            if (error) throw error;
            
            // 캐시 무효화
            clearSavedCache(artworkId, userId);
            
            return true;
        }
    } catch (err) {
        console.error('저장 토글 에러:', err);
        throw err;
    }
}

/**
 * 사용자가 저장한 작품 목록 조회
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Array>} 저장된 작품 배열
 */
export async function getSavedArtworks(userId) {
    try {
        const { data, error } = await window._supabase
            .from('saved_artworks')
            .select(`
                artwork_id,
                created_at,
                artworks (
                    id,
                    user_id,
                    title,
                    description,
                    images,
                    image_url,
                    media_type,
                    author_nickname,
                    author_email,
                    created_at
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return data
            .filter(item => item.artworks !== null)
            .map(item => ({
                ...item.artworks,
                saved_at: item.created_at
            }));
    } catch (err) {
        console.error('저장된 작품 조회 에러:', err);
        return [];
    }
}

/**
 * 여러 작품의 저장 여부를 한 번에 조회
 * @param {Array<string>} artworkIds - 작품 ID 배열
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Map>} artworkId -> 저장 여부 맵
 */
export async function getBatchSavedStatus(artworkIds, userId) {
    const savedMap = new Map();
    
    if (!userId || artworkIds.length === 0) {
        return savedMap;
    }
    
    try {
        const { data, error } = await window._supabase
            .from('saved_artworks')
            .select('artwork_id')
            .eq('user_id', userId)
            .in('artwork_id', artworkIds);
        
        if (error) throw error;
        
        const savedIds = new Set(data.map(item => String(item.artwork_id)));
        
        artworkIds.forEach(id => {
            // 숫자와 문자열 모두 처리
            const idStr = String(id);
            savedMap.set(id, savedIds.has(idStr));
            savedMap.set(idStr, savedIds.has(idStr));
        });
        
        return savedMap;
    } catch (err) {
        console.error('배치 저장 상태 조회 에러:', err);
        return savedMap;
    }
}
