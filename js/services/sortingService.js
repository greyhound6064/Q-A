/**
 * @file sortingService.js
 * @description 게시물 정렬 공통 서비스 (자유 게시판 + 자유 게시판)
 */

import { calculateWilsonScore } from './likeService.js';

/**
 * 게시물 배열을 정렬
 * @param {Array} posts - 정렬할 게시물 배열
 * @param {string} mode - 'latest' | 'popular' | 'trending'
 * @returns {Array} 정렬된 게시물 배열
 */
export function sortPosts(posts, mode = 'latest') {
    if (!Array.isArray(posts)) {
        console.error('sortPosts: posts가 배열이 아닙니다', posts);
        return [];
    }
    
    const sorted = [...posts];
    
    switch (mode) {
        case 'latest':
            return sortByLatest(sorted);
        case 'popular':
            return sortByPopular(sorted);
        case 'trending':
            return sortByTrending(sorted);
        default:
            console.warn(`알 수 없는 정렬 모드: ${mode}, 최신순으로 정렬합니다.`);
            return sortByLatest(sorted);
    }
}

/**
 * 최신순 정렬
 * @param {Array} posts - 게시물 배열
 * @returns {Array} 정렬된 배열
 */
export function sortByLatest(posts) {
    return posts.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
    );
}

/**
 * 인기순 정렬 (좋아요 많은 순)
 * @param {Array} posts - 게시물 배열
 * @returns {Array} 정렬된 배열
 */
export function sortByPopular(posts) {
    return posts.sort((a, b) => {
        const scoreA = (a.likes_count || 0) - (a.dislikes_count || 0);
        const scoreB = (b.likes_count || 0) - (b.dislikes_count || 0);
        return scoreB - scoreA;
    });
}

/**
 * 떠오르는순 정렬 (Wilson Score + 시간 가중치)
 * @param {Array} posts - 게시물 배열
 * @returns {Array} 정렬된 배열
 */
export function sortByTrending(posts) {
    return posts.sort((a, b) => {
        const scoreA = calculateTrendingScore(a);
        const scoreB = calculateTrendingScore(b);
        return scoreB - scoreA;
    });
}

/**
 * 떠오르는순 점수 계산 (Wilson Score + 시간 가중치)
 * @param {Object} artwork - 게시물 객체
 * @returns {number} 떠오르는순 점수
 */
function calculateTrendingScore(artwork) {
    const likes = artwork.likes_count || 0;
    const dislikes = artwork.dislikes_count || 0;
    const total = likes + dislikes;
    
    // 투표가 없는 경우 시간 가중치만 적용
    if (total === 0) {
        return getTimeWeight(artwork.created_at);
    }
    
    // Wilson Score 계산
    const wilsonScore = calculateWilsonScore(likes, dislikes);
    
    // 시간 가중치 계산
    const timeWeight = getTimeWeight(artwork.created_at);
    
    // 최종 점수: Wilson Score * 100 + 시간 가중치
    return wilsonScore * 100 + timeWeight;
}

/**
 * 시간 가중치 계산 (지수 감쇠)
 * @param {string} createdAt - ISO 날짜 문자열
 * @returns {number} 시간 가중치 (0-10)
 */
function getTimeWeight(createdAt) {
    const now = new Date();
    const created = new Date(createdAt);
    const hoursDiff = (now - created) / (1000 * 60 * 60);
    
    // 24시간 이내: 최대 10점
    if (hoursDiff < 24) {
        return 10 * Math.exp(-hoursDiff / 24);
    } 
    // 7일 이내: 1-10점
    else if (hoursDiff < 168) {
        return 10 * Math.exp(-hoursDiff / 168);
    } 
    // 7일 이후: 0-1점
    else {
        return Math.exp(-hoursDiff / 720);
    }
}

/**
 * 정렬 모드 이름 가져오기
 * @param {string} mode - 정렬 모드
 * @returns {string} 정렬 모드 이름
 */
export function getSortModeName(mode) {
    const names = {
        'latest': '최신순',
        'popular': '인기순',
        'trending': '떠오르는순'
    };
    return names[mode] || '최신순';
}
