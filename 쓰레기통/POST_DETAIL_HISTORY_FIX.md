# 게시물 상세 모달 뒤로가기 UX 개선

**날짜:** 2026-02-01  
**버전:** 1.0.0

---

## 🎯 개선 목표

게시물 상세 모달에서 뒤로가기 시 이전 스크롤 위치가 제대로 기록되고 복원되지 않는 문제를 해결합니다.

---

## 🐛 발견된 문제점

### 1. 스크롤 위치 저장 타이밍 문제
- **문제**: 모달을 열 때 스크롤 위치를 저장하지만, 히스토리에 잘못된 위치로 저장됨
- **원인**: `updateCurrentStateScrollPosition()`이 현재 상태(모달 열기 전)를 업데이트하는 것이 아니라, 새로운 모달 상태에 스크롤 위치를 저장함

### 2. 히스토리 상태 구조 문제
- **문제**: 뒤로가기 시 복원할 스크롤 위치가 잘못된 히스토리 상태에 저장됨
- **원인**: 모달 상태에 `scrollPosition`을 저장했지만, 실제로는 이전 페이지의 스크롤 위치여야 함

### 3. 스크롤 복원 로직 중복
- **문제**: `artworkDetail.js`와 `historyManager.js` 양쪽에서 스크롤 복원을 시도하여 충돌 발생
- **원인**: 책임 분리가 명확하지 않음

---

## ✅ 개선 내용

### 1. 히스토리 상태 구조 변경

**이전:**
```javascript
history.pushState({
    type: 'post-detail',
    postId: artworkId,
    scrollPosition: savedScrollPosition  // ❌ 모달 상태에 저장
}, '', `#post/${artworkId}`);
```

**개선:**
```javascript
history.pushState({
    type: 'post-detail',
    postId: artworkId,
    previousScrollPosition: savedScrollPosition  // ✅ 이전 위치로 명확히 표시
}, '', `#post/${artworkId}`);
```

### 2. 스크롤 위치 저장 개선

**`artworkDetail.js` - openArtworkDetail():**
```javascript
// 개선 전: 여러 곳에서 스크롤 위치 가져오기
const contentArea = document.querySelector('.content-area');
const boardContainer = document.querySelector('.board-container');
if (contentArea) {
    savedScrollPosition = contentArea.scrollTop;
} else if (boardContainer) {
    savedScrollPosition = boardContainer.scrollTop;
} else {
    savedScrollPosition = window.scrollY || window.pageYOffset;
}

// 개선 후: historyManager의 헬퍼 함수 사용
savedScrollPosition = historyManager.getCurrentScrollPosition();
```

### 3. 히스토리 추가 로직 개선

**`artworkDetail.js` - openArtworkDetail():**
```javascript
// 개선 전
if (!historyManager.isRestoringState()) {
    historyManager.updateCurrentStateScrollPosition(savedScrollPosition);
    historyManager.pushArtworkDetailState(artworkId);
}

// 개선 후
if (!historyManager.isRestoringState()) {
    const postType = artwork.post_type || 'gallery';
    historyManager.pushArtworkDetailState(artworkId, postType, savedScrollPosition);
}
```

### 4. 뒤로가기 처리 개선

**`historyManager.js`:**

**개선 전:**
```javascript
closePostDetailOnly(previousState) {
    // previousState는 실제로 현재 상태(모달 상태)
    const scrollPosition = previousState?.scrollPosition || 0;
    // ... 스크롤 복원
}
```

**개선 후:**
```javascript
closePostDetailAndRestore(currentState) {
    // 모달 닫기
    const modal = document.getElementById('artwork-detail-modal');
    if (modal && modal.style.display !== 'none') {
        // ... 모달 닫기 로직
    }
    
    // 이전 상태의 스크롤 위치 복원
    const scrollPosition = currentState?.previousScrollPosition || 0;
    this.restoreScrollPosition(scrollPosition);
}
```

### 5. 스크롤 복원 책임 분리

**`historyManager.js`에 스크롤 복원 헬퍼 추가:**
```javascript
restoreScrollPosition(scrollPosition) {
    requestAnimationFrame(() => {
        const contentArea = document.querySelector('.content-area');
        const boardContainer = document.querySelector('.board-container');
        
        if (contentArea) {
            contentArea.scrollTop = scrollPosition;
        } else if (boardContainer) {
            boardContainer.scrollTop = scrollPosition;
        } else {
            window.scrollTo(0, scrollPosition);
        }
        
        // 추가 안전장치
        setTimeout(() => {
            // 재시도
        }, 150);
    });
}
```

### 6. 모달 닫기 로직 개선

**`artworkDetail.js` - closeArtworkDetail():**
```javascript
// 개선 전: 직접 스크롤 복원 시도
restoreScrollPosition();
if (!historyManager.isRestoringState()) {
    setTimeout(() => {
        historyManager.goBack();
    }, 50);
}

// 개선 후: historyManager에게 위임
if (!historyManager.isRestoringState()) {
    // X 버튼으로 닫을 때만 뒤로가기 실행
    // historyManager가 스크롤 복원을 처리
    historyManager.goBack();
} else {
    // 뒤로가기 버튼으로 닫을 때는 historyManager가 이미 처리함
}
```

---

## 🔄 처리 흐름

### 모달 열기 (openArtworkDetail)
1. **현재 스크롤 위치 저장**: `historyManager.getCurrentScrollPosition()`
2. **게시물 데이터 로드**: Supabase에서 데이터 가져오기
3. **모달 표시**: DOM 업데이트 및 표시
4. **히스토리 추가**: `pushArtworkDetailState(id, type, savedScrollPosition)`
   - `previousScrollPosition`에 모달 열기 전 위치 저장

### 모달 닫기 - X 버튼 클릭
1. **모달 닫기**: DOM 업데이트
2. **뒤로가기 실행**: `historyManager.goBack()`
3. **popstate 이벤트 발생**
4. **historyManager가 스크롤 복원**: `previousScrollPosition` 사용

### 모달 닫기 - 뒤로가기 버튼
1. **popstate 이벤트 발생**
2. **historyManager.handleState()** 호출
3. **closePostDetailAndRestore()** 실행
   - 모달 닫기
   - `previousScrollPosition`으로 스크롤 복원

---

## 📊 개선 효과

### 1. 정확한 스크롤 위치 복원
- ✅ 모달 열기 전 정확한 위치로 복원
- ✅ 여러 번 모달을 열고 닫아도 일관된 동작

### 2. 코드 명확성 향상
- ✅ `previousScrollPosition`으로 의미 명확화
- ✅ 책임 분리: historyManager가 스크롤 복원 담당

### 3. 안정성 향상
- ✅ 이중 복원 시도 제거
- ✅ 타이밍 이슈 해결
- ✅ 로깅 추가로 디버깅 용이

---

## 🧪 테스트 시나리오

### 시나리오 1: 기본 모달 열기/닫기
1. 게시판에서 스크롤 다운 (예: 500px)
2. 게시물 클릭하여 모달 열기
3. X 버튼으로 모달 닫기
4. **예상 결과**: 500px 위치로 복원

### 시나리오 2: 뒤로가기 버튼
1. 게시판에서 스크롤 다운 (예: 800px)
2. 게시물 클릭하여 모달 열기
3. 브라우저 뒤로가기 버튼 클릭
4. **예상 결과**: 800px 위치로 복원

### 시나리오 3: 여러 모달 연속 열기
1. 게시판에서 스크롤 다운 (예: 300px)
2. 게시물 A 클릭 → 모달 열기
3. X 버튼으로 닫기 → 300px 복원 확인
4. 다시 스크롤 다운 (예: 600px)
5. 게시물 B 클릭 → 모달 열기
6. 뒤로가기 버튼 클릭 → 600px 복원 확인

### 시나리오 4: 다른 컨테이너에서 테스트
1. **프로필 페이지** (`.content-area` 사용)
2. **게시판** (`.board-container` 사용)
3. **기타 페이지** (`window.scrollY` 사용)
4. **예상 결과**: 모든 경우에 정확한 복원

---

## 🔧 수정된 파일

### 1. `js/utils/historyManager.js`
- ✅ `closePostDetailAndRestore()` 추가 (기존 `closePostDetailOnly` 개선)
- ✅ `restoreScrollPosition()` 헬퍼 함수 추가
- ✅ `getCurrentScrollPosition()` 헬퍼 함수 추가
- ✅ `pushArtworkDetailState()` 시그니처 변경 (previousScrollPosition 추가)
- ✅ 로깅 추가

### 2. `js/artwork/artworkDetail.js`
- ✅ `openArtworkDetail()` - 스크롤 저장 로직 개선
- ✅ `openArtworkDetail()` - 히스토리 추가 로직 개선
- ✅ `closeArtworkDetail()` - 스크롤 복원 책임 위임
- ✅ `restoreScrollPosition()` deprecated 표시

---

## 📝 하위 호환성

모든 기존 함수는 유지되며, deprecated 표시와 함께 새로운 함수로 리다이렉트됩니다:

- ✅ `closePostDetailOnly()` → `closePostDetailAndRestore()`
- ✅ `closeArtworkDetailOnly()` → `closePostDetailAndRestore()`
- ✅ `closeFeedDetailOnly()` → `closePostDetailAndRestore()`
- ✅ `updateCurrentStateScrollPosition()` - deprecated 경고 추가

---

## 🎨 사용자 경험 개선

### 개선 전
- ❌ 모달 닫으면 페이지 최상단으로 이동
- ❌ 또는 잘못된 위치로 이동
- ❌ 사용자가 다시 스크롤해야 함

### 개선 후
- ✅ 모달 닫으면 정확히 이전 위치로 복원
- ✅ 자연스러운 네비게이션 경험
- ✅ 사용자 불편 최소화

---

## 🚀 향후 개선 사항

1. **성능 최적화**
   - 스크롤 위치 캐싱 전략 검토
   - requestAnimationFrame 최적화

2. **추가 테스트**
   - 다양한 브라우저 테스트
   - 모바일 디바이스 테스트
   - 느린 네트워크 환경 테스트

3. **에러 처리**
   - 스크롤 복원 실패 시 fallback 로직
   - 로깅 레벨 조정

---

## 📚 관련 문서

- `프로젝트 구조/ARCHITECTURE.md` - 전체 아키텍처
- `js/utils/historyManager.js` - 히스토리 관리
- `js/artwork/artworkDetail.js` - 게시물 상세 모달

---

**작성자:** AI Assistant  
**검토자:** -  
**승인자:** -
