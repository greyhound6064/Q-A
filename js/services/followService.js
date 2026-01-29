/**
 * @file followService.js
 * @description 팔로우 시스템 비즈니스 로직
 */

/**
 * 팔로우 상태 확인
 */
export async function isFollowing(currentUserId, targetUserId) {
    if (!currentUserId || !targetUserId) return false;
    
    const { data, error } = await _supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .single();
    
    return !error && data !== null;
}

/**
 * 팔로우/언팔로우 토글
 */
export async function toggleFollow(currentUserId, targetUserId) {
    if (!currentUserId || !targetUserId) {
        throw new Error('유효하지 않은 사용자 ID');
    }
    
    if (currentUserId === targetUserId) {
        throw new Error('자기 자신을 팔로우할 수 없습니다');
    }
    
    const following = await isFollowing(currentUserId, targetUserId);
    
    if (following) {
        // 언팔로우
        const { error } = await _supabase
            .from('follows')
            .delete()
            .eq('follower_id', currentUserId)
            .eq('following_id', targetUserId);
        
        if (error) throw error;
        return { isFollowing: false };
    } else {
        // 팔로우
        const { error } = await _supabase
            .from('follows')
            .insert({
                follower_id: currentUserId,
                following_id: targetUserId
            });
        
        if (error) throw error;
        return { isFollowing: true };
    }
}

/**
 * 팔로워 수 조회
 */
export async function getFollowersCount(userId) {
    const { count, error } = await _supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);
    
    if (error) {
        console.error('팔로워 수 조회 에러:', error);
        return 0;
    }
    
    return count || 0;
}

/**
 * 팔로잉 수 조회
 */
export async function getFollowingCount(userId) {
    const { count, error } = await _supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);
    
    if (error) {
        console.error('팔로잉 수 조회 에러:', error);
        return 0;
    }
    
    return count || 0;
}

/**
 * 팔로워 목록 조회 (프로필 정보 포함)
 */
export async function getFollowers(userId, limit = 50, offset = 0) {
    // follows 테이블에서 팔로워 ID 조회
    const { data: followData, error: followError } = await _supabase
        .from('follows')
        .select('follower_id, created_at')
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
    
    if (followError) {
        console.error('팔로워 목록 조회 에러:', followError);
        return [];
    }
    
    if (!followData || followData.length === 0) {
        return [];
    }
    
    // 팔로워 프로필 정보 조회
    const followerIds = followData.map(f => f.follower_id);
    const { data: profiles, error: profileError } = await _supabase
        .from('profiles')
        .select('user_id, nickname, bio, avatar_url')
        .in('user_id', followerIds);
    
    if (profileError) {
        console.error('프로필 조회 에러:', profileError);
        return [];
    }
    
    // 데이터 병합
    return followData.map(follow => ({
        follower_id: follow.follower_id,
        created_at: follow.created_at,
        follower_profile: profiles?.find(p => p.user_id === follow.follower_id)
    }));
}

/**
 * 팔로잉 목록 조회 (프로필 정보 포함)
 */
export async function getFollowing(userId, limit = 50, offset = 0) {
    // follows 테이블에서 팔로잉 ID 조회
    const { data: followData, error: followError } = await _supabase
        .from('follows')
        .select('following_id, created_at')
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
    
    if (followError) {
        console.error('팔로잉 목록 조회 에러:', followError);
        return [];
    }
    
    if (!followData || followData.length === 0) {
        return [];
    }
    
    // 팔로잉 프로필 정보 조회
    const followingIds = followData.map(f => f.following_id);
    const { data: profiles, error: profileError } = await _supabase
        .from('profiles')
        .select('user_id, nickname, bio, avatar_url')
        .in('user_id', followingIds);
    
    if (profileError) {
        console.error('프로필 조회 에러:', profileError);
        return [];
    }
    
    // 데이터 병합
    return followData.map(follow => ({
        following_id: follow.following_id,
        created_at: follow.created_at,
        following_profile: profiles?.find(p => p.user_id === follow.following_id)
    }));
}

/**
 * 팔로우 통계 조회 (실제 follows 테이블에서 직접 계산)
 */
export async function getFollowStats(userId) {
    try {
        // 실제 follows 테이블에서 직접 카운트
        const followers = await getFollowersCount(userId);
        const following = await getFollowingCount(userId);
        
        return {
            followers: followers || 0,
            following: following || 0
        };
    } catch (error) {
        console.error('팔로우 통계 조회 에러:', error);
        return { followers: 0, following: 0 };
    }
}
