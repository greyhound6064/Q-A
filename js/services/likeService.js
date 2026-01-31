/**
 * @file likeService.js
 * @description 좋아요/싫어요 관련 비즈니스 로직 통합 서비스
 */

// ========== 좋아요 캐시 ==========
const likesCache = new Map();

/**
 * 좋아요 캐시 초기화
 */
export function clearLikesCache(artworkId = null) {
    if (artworkId) {
        likesCache.delete(artworkId);
    } else {
        likesCache.clear();
    }
}

/**
 * 작품의 좋아요/싫어요 데이터 조회
 * @param {string} artworkId - 작품 ID
 * @param {string|null} userId - 사용자 ID (현재 사용자 반응 조회용)
 * @param {boolean} useCache - 캐시 사용 여부
 * @returns {Promise<Object>} { likes, dislikes, userReaction }
 */
export async function getLikesData(artworkId, userId = null, useCache = true) {
    // 캐시 확인 (userId가 같은 경우만)
    const cacheKey = `${artworkId}_${userId || 'anonymous'}`;
    if (useCache && likesCache.has(cacheKey)) {
        return likesCache.get(cacheKey);
    }
    
    try {
        // 좋아요/싫어요 수와 사용자 반응을 병렬로 조회
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
        
        const data = {
            likes: likesResult.count || 0,
            dislikes: dislikesResult.count || 0,
            userReaction: userReactionResult.data?.like_type || null
        };
        
        // 캐시 저장
        likesCache.set(cacheKey, data);
        
        return data;
    } catch (err) {
        console.error('좋아요/싫어요 데이터 조회 에러:', err);
        return { likes: 0, dislikes: 0, userReaction: null };
    }
}

/**
 * 좋아요 토글
 * @param {string} artworkId - 작품 ID
 * @returns {Promise<Object>} 업데이트된 좋아요 데이터
 */
export async function toggleLike(artworkId) {
    try {
        // 로그인 확인
        const { data: { session } } = await window._supabase.auth.getSession();
        if (!session || !session.user) {
            throw new Error('로그인이 필요합니다.');
        }
        
        const userId = session.user.id;
        
        // 현재 사용자의 반응 확인
        const { data: existingLike } = await window._supabase
            .from('artwork_likes')
            .select('*')
            .eq('artwork_id', artworkId)
            .eq('user_id', userId)
            .maybeSingle();
        
        if (existingLike) {
            if (existingLike.like_type === 'like') {
                // 이미 좋아요를 누른 경우 -> 취소
                await window._supabase
                    .from('artwork_likes')
                    .delete()
                    .eq('id', existingLike.id);
            } else {
                // 싫어요를 누른 경우 -> 좋아요로 변경
                await window._supabase
                    .from('artwork_likes')
                    .update({ like_type: 'like' })
                    .eq('id', existingLike.id);
            }
        } else {
            // 반응이 없는 경우 -> 좋아요 추가
            await window._supabase
                .from('artwork_likes')
                .insert({
                    artwork_id: artworkId,
                    user_id: userId,
                    like_type: 'like'
                });
        }
        
        // 캐시 무효화
        clearLikesCache(artworkId);
        
        // 업데이트된 데이터 반환
        return await getLikesData(artworkId, userId, false);
    } catch (err) {
        console.error('좋아요 토글 에러:', err);
        throw err;
    }
}

/**
 * 싫어요 토글
 * @param {string} artworkId - 작품 ID
 * @returns {Promise<Object>} 업데이트된 좋아요 데이터
 */
export async function toggleDislike(artworkId) {
    try {
        // 로그인 확인
        const { data: { session } } = await window._supabase.auth.getSession();
        if (!session || !session.user) {
            throw new Error('로그인이 필요합니다.');
        }
        
        const userId = session.user.id;
        
        // 현재 사용자의 반응 확인
        const { data: existingLike } = await window._supabase
            .from('artwork_likes')
            .select('*')
            .eq('artwork_id', artworkId)
            .eq('user_id', userId)
            .maybeSingle();
        
        if (existingLike) {
            if (existingLike.like_type === 'dislike') {
                // 이미 싫어요를 누른 경우 -> 취소
                await window._supabase
                    .from('artwork_likes')
                    .delete()
                    .eq('id', existingLike.id);
            } else {
                // 좋아요를 누른 경우 -> 싫어요로 변경
                await window._supabase
                    .from('artwork_likes')
                    .update({ like_type: 'dislike' })
                    .eq('id', existingLike.id);
            }
        } else {
            // 반응이 없는 경우 -> 싫어요 추가
            await window._supabase
                .from('artwork_likes')
                .insert({
                    artwork_id: artworkId,
                    user_id: userId,
                    like_type: 'dislike'
                });
        }
        
        // 캐시 무효화
        clearLikesCache(artworkId);
        
        // 업데이트된 데이터 반환
        return await getLikesData(artworkId, userId, false);
    } catch (err) {
        console.error('싫어요 토글 에러:', err);
        throw err;
    }
}

/**
 * 여러 작품의 좋아요 데이터를 한 번에 조회 (최적화된 단일 쿼리)
 * @param {Array<string>} artworkIds - 작품 ID 배열
 * @param {string|null} userId - 사용자 ID
 * @returns {Promise<Map>} artworkId -> 좋아요 데이터 맵
 */
export async function getBatchLikesData(artworkIds, userId = null) {
    const likesMap = new Map();
    
    if (!artworkIds || artworkIds.length === 0) {
        return likesMap;
    }
    
    try {
        // 1. 모든 작품의 좋아요/싫어요 수를 한 번에 조회
        const { data: allLikes, error: likesError } = await window._supabase
            .from('artwork_likes')
            .select('artwork_id, like_type')
            .in('artwork_id', artworkIds);
        
        if (likesError) throw likesError;
        
        // 2. 작품별로 좋아요/싫어요 집계
        const countsMap = new Map();
        artworkIds.forEach(id => {
            countsMap.set(id, { likes: 0, dislikes: 0 });
        });
        
        allLikes?.forEach(like => {
            const counts = countsMap.get(like.artwork_id);
            if (counts) {
                if (like.like_type === 'like') {
                    counts.likes++;
                } else if (like.like_type === 'dislike') {
                    counts.dislikes++;
                }
            }
        });
        
        // 3. 사용자 반응 조회 (로그인한 경우)
        let userReactionsMap = new Map();
        if (userId) {
            const { data: userReactions, error: reactionsError } = await window._supabase
                .from('artwork_likes')
                .select('artwork_id, like_type')
                .in('artwork_id', artworkIds)
                .eq('user_id', userId);
            
            if (!reactionsError && userReactions) {
                userReactions.forEach(reaction => {
                    userReactionsMap.set(reaction.artwork_id, reaction.like_type);
                });
            }
        }
        
        // 4. 최종 데이터 구성
        artworkIds.forEach(id => {
            const counts = countsMap.get(id) || { likes: 0, dislikes: 0 };
            const userReaction = userReactionsMap.get(id) || null;
            
            const data = {
                likes: counts.likes,
                dislikes: counts.dislikes,
                userReaction: userReaction
            };
            
            likesMap.set(id, data);
            
            // 캐시 저장
            const cacheKey = `${id}_${userId || 'anonymous'}`;
            likesCache.set(cacheKey, data);
        });
        
        return likesMap;
    } catch (err) {
        console.error('배치 좋아요 데이터 조회 에러:', err);
        // 에러 발생 시 기본값 반환
        artworkIds.forEach(id => {
            likesMap.set(id, { likes: 0, dislikes: 0, userReaction: null });
        });
        return likesMap;
    }
}

/**
 * 순 좋아요 수 계산 (좋아요 - 싫어요)
 * @param {Object} likesData - { likes, dislikes, userReaction }
 * @returns {number} 순 좋아요 수
 */
export function calculateNetLikes(likesData) {
    return (likesData.likes || 0) - (likesData.dislikes || 0);
}

/**
 * Wilson Score 계산 (신뢰도 기반 점수)
 * @param {number} likes - 좋아요 수
 * @param {number} dislikes - 싫어요 수
 * @returns {number} Wilson Score (0-1)
 */
export function calculateWilsonScore(likes, dislikes) {
    const n = likes + dislikes;
    if (n === 0) return 0;
    
    const z = 1.96; // 95% 신뢰구간
    const phat = likes / n;
    
    const score = (phat + z * z / (2 * n) - z * Math.sqrt((phat * (1 - phat) + z * z / (4 * n)) / n)) / (1 + z * z / n);
    return score;
}
