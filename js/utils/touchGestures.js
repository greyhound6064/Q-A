/**
 * @file touchGestures.js
 * @description 모바일 터치 제스처 유틸리티 (스와이프, 풀 투 클로즈)
 */

/**
 * 모달에 스와이프 다운으로 닫기 제스처 추가
 * @param {HTMLElement} modalElement - 모달 요소
 * @param {Function} onClose - 닫기 콜백 함수
 * @param {Object} options - 옵션
 */
export function addSwipeToCloseGesture(modalElement, onClose, options = {}) {
    const {
        threshold = 100, // 닫기 트리거 거리 (px)
        velocityThreshold = 0.3, // 속도 임계값
        targetSelector = null // 특정 요소에만 제스처 적용
    } = options;

    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    let startTime = 0;
    let targetElement = null;

    const handleTouchStart = (e) => {
        // 특정 요소에만 적용하는 경우
        if (targetSelector) {
            targetElement = e.target.closest(targetSelector);
            if (!targetElement) return;
        }

        // 스크롤 가능한 요소 내부에서는 제스처 비활성화
        const scrollableParent = e.target.closest('[style*="overflow-y: auto"], [style*="overflow: auto"], .artwork-comments-list, .feed-detail-body');
        if (scrollableParent) {
            const isAtTop = scrollableParent.scrollTop === 0;
            if (!isAtTop) return; // 스크롤이 최상단이 아니면 제스처 비활성화
        }

        startY = e.touches[0].clientY;
        currentY = startY;
        startTime = Date.now();
        isDragging = true;
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;

        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;

        // 아래로만 드래그 허용
        if (deltaY > 0) {
            // 드래그 중 시각적 피드백
            const opacity = Math.max(0.3, 1 - (deltaY / threshold) * 0.7);
            const translateY = Math.min(deltaY, threshold * 1.5);
            
            if (modalElement) {
                modalElement.style.transform = `translateY(${translateY}px)`;
                modalElement.style.opacity = opacity;
                modalElement.style.transition = 'none';
            }

            // 스크롤 방지
            if (deltaY > 10) {
                e.preventDefault();
            }
        }
    };

    const handleTouchEnd = (e) => {
        if (!isDragging) return;

        const deltaY = currentY - startY;
        const deltaTime = Date.now() - startTime;
        const velocity = deltaY / deltaTime; // px/ms

        // 닫기 조건: 거리가 임계값 이상이거나 빠른 스와이프
        const shouldClose = deltaY > threshold || velocity > velocityThreshold;

        if (shouldClose && deltaY > 0) {
            // 모달 닫기 애니메이션
            if (modalElement) {
                modalElement.style.transition = 'all 0.3s ease-out';
                modalElement.style.transform = 'translateY(100%)';
                modalElement.style.opacity = '0';
            }

            // 애니메이션 후 닫기
            setTimeout(() => {
                if (onClose) onClose();
                // 스타일 리셋
                if (modalElement) {
                    modalElement.style.transform = '';
                    modalElement.style.opacity = '';
                    modalElement.style.transition = '';
                }
            }, 300);
        } else {
            // 원래 위치로 복귀
            if (modalElement) {
                modalElement.style.transition = 'all 0.3s ease-out';
                modalElement.style.transform = '';
                modalElement.style.opacity = '';
            }

            setTimeout(() => {
                if (modalElement) {
                    modalElement.style.transition = '';
                }
            }, 300);
        }

        isDragging = false;
        startY = 0;
        currentY = 0;
        targetElement = null;
    };

    // 이벤트 리스너 등록
    modalElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    modalElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    modalElement.addEventListener('touchend', handleTouchEnd, { passive: false });

    // 클린업 함수 반환
    return () => {
        modalElement.removeEventListener('touchstart', handleTouchStart);
        modalElement.removeEventListener('touchmove', handleTouchMove);
        modalElement.removeEventListener('touchend', handleTouchEnd);
    };
}

/**
 * 캐러셀에 스와이프 제스처 추가
 * @param {HTMLElement} carouselElement - 캐러셀 요소
 * @param {Function} onSwipeLeft - 왼쪽 스와이프 콜백
 * @param {Function} onSwipeRight - 오른쪽 스와이프 콜백
 * @param {Object} options - 옵션
 */
export function addCarouselSwipeGesture(carouselElement, onSwipeLeft, onSwipeRight, options = {}) {
    const {
        threshold = 50, // 스와이프 인식 거리 (px)
        velocityThreshold = 0.3 // 속도 임계값
    } = options;

    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isDragging = false;
    let startTime = 0;

    const handleTouchStart = (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        currentX = startX;
        currentY = startY;
        startTime = Date.now();
        isDragging = true;
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;

        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;

        const deltaX = Math.abs(currentX - startX);
        const deltaY = Math.abs(currentY - startY);

        // 수평 스와이프가 수직보다 클 때만 스크롤 방지
        if (deltaX > deltaY && deltaX > 10) {
            e.preventDefault();
        }
    };

    const handleTouchEnd = (e) => {
        if (!isDragging) return;

        const deltaX = currentX - startX;
        const deltaY = Math.abs(currentY - startY);
        const deltaTime = Date.now() - startTime;
        const velocity = Math.abs(deltaX) / deltaTime; // px/ms

        // 수평 스와이프만 인식 (수직 이동이 작을 때)
        if (deltaY < 50) {
            const shouldSwipe = Math.abs(deltaX) > threshold || velocity > velocityThreshold;

            if (shouldSwipe) {
                if (deltaX < 0 && onSwipeLeft) {
                    // 왼쪽 스와이프 (다음)
                    onSwipeLeft();
                } else if (deltaX > 0 && onSwipeRight) {
                    // 오른쪽 스와이프 (이전)
                    onSwipeRight();
                }
            }
        }

        isDragging = false;
        startX = 0;
        startY = 0;
        currentX = 0;
        currentY = 0;
    };

    // 이벤트 리스너 등록
    carouselElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    carouselElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    carouselElement.addEventListener('touchend', handleTouchEnd, { passive: true });

    // 클린업 함수 반환
    return () => {
        carouselElement.removeEventListener('touchstart', handleTouchStart);
        carouselElement.removeEventListener('touchmove', handleTouchMove);
        carouselElement.removeEventListener('touchend', handleTouchEnd);
    };
}

/**
 * 더블 탭 제스처 추가
 * @param {HTMLElement} element - 대상 요소
 * @param {Function} onDoubleTap - 더블 탭 콜백
 * @param {Object} options - 옵션
 */
export function addDoubleTapGesture(element, onDoubleTap, options = {}) {
    const {
        delay = 300 // 더블 탭 인식 시간 (ms)
    } = options;

    let lastTap = 0;

    const handleTouchEnd = (e) => {
        const currentTime = Date.now();
        const tapLength = currentTime - lastTap;

        if (tapLength < delay && tapLength > 0) {
            // 더블 탭 감지
            if (onDoubleTap) {
                onDoubleTap(e);
            }
            lastTap = 0;
        } else {
            lastTap = currentTime;
        }
    };

    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    // 클린업 함수 반환
    return () => {
        element.removeEventListener('touchend', handleTouchEnd);
    };
}
