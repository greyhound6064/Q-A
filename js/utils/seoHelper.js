/**
 * SEO Helper - 페이지 전환 시 메타 태그 동적 업데이트
 */

export function updateMetaTags(config) {
    const {
        title = '바이브코딩으로 만든 바이브코딩 SNS',
        description = '바이브코딩 SNS - 창작자들이 작품을 공유하고 소통하는 커뮤니티',
        url = window.location.href,
        image = 'https://vibing.kr/메타로고(최종).png'
    } = config;

    // Title 업데이트
    document.title = title;

    // Meta Description
    updateMetaTag('name', 'description', description);

    // Open Graph
    updateMetaTag('property', 'og:title', title);
    updateMetaTag('property', 'og:description', description);
    updateMetaTag('property', 'og:url', url);
    updateMetaTag('property', 'og:image', image);

    // Twitter Card
    updateMetaTag('name', 'twitter:title', title);
    updateMetaTag('name', 'twitter:description', description);
    updateMetaTag('name', 'twitter:image', image);

    // Canonical URL
    updateCanonicalUrl(url);
}

function updateMetaTag(attribute, key, content) {
    let element = document.querySelector(`meta[${attribute}="${key}"]`);
    if (element) {
        element.setAttribute('content', content);
    } else {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        element.setAttribute('content', content);
        document.head.appendChild(element);
    }
}

function updateCanonicalUrl(url) {
    let link = document.querySelector('link[rel="canonical"]');
    if (link) {
        link.setAttribute('href', url);
    } else {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        link.setAttribute('href', url);
        document.head.appendChild(link);
    }
}

// 페이지별 SEO 설정
export const SEO_CONFIGS = {
    board: {
        title: '게시판 - 바이브코딩 SNS',
        description: '바이브코딩 커뮤니티의 작품 게시판과 자유 게시판을 확인하세요.',
        url: 'https://vibing.kr/#/board'
    },
    profile: {
        title: '프로필 - 바이브코딩 SNS',
        description: '내 프로필과 작품을 관리하고 팔로워와 소통하세요.',
        url: 'https://vibing.kr/#/profile'
    },
    vibing: {
        title: '바이빙 - 바이브코딩 SNS',
        description: '바이브코딩 커뮤니티의 바이빙 기능을 경험하세요.',
        url: 'https://vibing.kr/#/vibing'
    },
    messages: {
        title: '메시지 - 바이브코딩 SNS',
        description: '다른 창작자들과 실시간으로 메시지를 주고받으세요.',
        url: 'https://vibing.kr/#/messages'
    },
    'user-search': {
        title: '사용자 검색 - 바이브코딩 SNS',
        description: '바이브코딩 커뮤니티의 다른 창작자들을 찾아보세요.',
        url: 'https://vibing.kr/#/user-search'
    }
};
