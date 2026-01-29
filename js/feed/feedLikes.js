/**
 * @file feedLikes.js
 * @description 피드 좋아요/싫어요 UI 통합 로직
 */

import { toggleLike as serviceLike, toggleDislike as serviceDislike } from '../services/likeService.js';
import { updateLikesUI } from './feedCore.js';

/**
 * 좋아요 토글
 */
export async function toggleLike(postId) {
    try {
        // 로그인 확인
        const { data: { session } } = await window._supabase.auth.getSession();
        if (!session || !session.user) {
            alert('로그인이 필요합니다.');
            return;
        }
        
        // 서비스 레이어 사용
        await serviceLike(postId);
        
        // UI 업데이트
        await updateLikesUI(postId, session.user.id);
        
    } catch (err) {
        console.error('좋아요 토글 예외:', err);
        alert('좋아요 처리 중 오류가 발생했습니다.');
    }
}

/**
 * 싫어요 토글
 */
export async function toggleDislike(postId) {
    try {
        // 로그인 확인
        const { data: { session } } = await window._supabase.auth.getSession();
        if (!session || !session.user) {
            alert('로그인이 필요합니다.');
            return;
        }
        
        // 서비스 레이어 사용
        await serviceDislike(postId);
        
        // UI 업데이트
        await updateLikesUI(postId, session.user.id);
        
    } catch (err) {
        console.error('싫어요 토글 예외:', err);
        alert('싫어요 처리 중 오류가 발생했습니다.');
    }
}
