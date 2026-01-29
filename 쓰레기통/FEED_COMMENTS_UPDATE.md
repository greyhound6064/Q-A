# 피드 댓글 UI 개선 (인스타그램 스타일)

## 📋 변경 개요

피드의 댓글 버튼을 클릭하면 게시물 아래로 댓글창이 열리는 대신, **게시물 상세보기 모달**이 열리고 오른쪽에 댓글 섹션이 표시되도록 변경했습니다. (인스타그램 스타일)

**업데이트 날짜:** 2026-01-24  
**버전:** 1.4.0

---

## 🎯 주요 변경사항

### 1. 댓글 버튼 동작 변경
- **이전**: 피드 아이템 아래로 댓글 섹션 토글
- **이후**: 상세보기 모달 열기 (댓글 섹션 포함)

### 2. 상세보기 모달 구조
```
┌─────────────────────────────────────────────────┐
│  [X]                                            │
├──────────────────┬──────────────────────────────┤
│                  │  👤 작성자                    │
│                  ├──────────────────────────────┤
│                  │  제목 및 설명                 │
│   이미지         ├──────────────────────────────┤
│   (캐러셀)       │  ❤️ 👎 💾 (좋아요/싫어요/저장) │
│                  ├──────────────────────────────┤
│                  │  댓글 N개                     │
│                  │  ┌────────────────────────┐  │
│                  │  │ 댓글 리스트 (스크롤)    │  │
│                  │  │                        │  │
│                  │  └────────────────────────┘  │
│                  │  ┌────────────────────────┐  │
│                  │  │ 댓글 입력창 (고정)      │  │
│                  │  └────────────────────────┘  │
└──────────────────┴──────────────────────────────┘
```

---

## 📝 수정된 파일

### 1. `js/feed.js`
```javascript
// 댓글 토글 함수 변경
export async function toggleComments(artworkId) {
    // 상세보기 모달 열기 (댓글 섹션 표시)
    openFeedDetail(artworkId, true);
}

// 상세보기 함수에 showComments 파라미터 추가
export function openFeedDetail(postId, showComments = false) {
    if (window.openArtworkDetail) {
        window.openArtworkDetail(postId, showComments);
    }
}

// 댓글 수 업데이트 함수 추가 (외부에서 호출)
export async function updateFeedCommentCount(artworkId) {
    const newCount = await getCommentCount(artworkId);
    const countEl = document.getElementById(`comment-count-${artworkId}`);
    if (countEl) countEl.textContent = newCount;
}

// 피드 렌더링에서 댓글 섹션 제거
// (이제 모달에서만 표시)
```

### 2. `js/artwork.js`
```javascript
// 상세보기 함수에 showComments 파라미터 추가
export async function openArtworkDetail(artworkId, showComments = false) {
    // ... 기존 코드 ...
    
    // 좋아요/싫어요 데이터 로드
    await loadArtworkLikesData(artworkId, session?.user?.id);
    
    // 댓글 섹션 로드
    await loadArtworkComments(artworkId, showComments);
}

// 좋아요/싫어요 데이터 로드 함수 추가
async function loadArtworkLikesData(artworkId, userId) {
    // artwork_likes 테이블에서 데이터 조회
    // UI 업데이트 (liked/disliked 클래스 추가)
}

// 댓글 로드 함수 추가
async function loadArtworkComments(artworkId, autoOpen = false) {
    // artwork_comments 테이블에서 댓글 조회
    // renderArtworkComments() 호출
}

// 댓글 렌더링 함수 추가
function renderArtworkComments(artworkId, comments, session) {
    // 댓글 리스트 HTML 생성
    // 댓글 입력 폼 추가 (로그인한 경우)
}

// 댓글 작성 함수 추가
window.submitArtworkComment = async function(artworkId) {
    // 댓글 DB에 추가
    // 댓글 다시 로드
    // 피드의 댓글 수 업데이트
}

// 댓글 삭제 함수 추가
window.deleteArtworkCommentFromModal = async function(artworkId, commentId) {
    // 댓글 DB에서 삭제
    // 댓글 다시 로드
    // 피드의 댓글 수 업데이트
}
```

### 3. `index.html`
```html
<!-- 작품 상세보기 모달 - 오른쪽 섹션 수정 -->
<div class="artwork-info-section">
    <!-- 작성자 정보 -->
    <div class="artwork-author">...</div>
    
    <!-- 제목 및 설명 -->
    <div class="artwork-content">...</div>
    
    <!-- 액션 버튼 (좋아요/싫어요 추가) -->
    <div class="artwork-actions">
        <button id="artwork-detail-like-btn">
            ❤️ <span id="artwork-detail-like-count">0</span>
        </button>
        <button id="artwork-detail-dislike-btn">
            👎 <span id="artwork-detail-dislike-count">0</span>
        </button>
        <button class="save-btn">💾</button>
    </div>
    
    <!-- 댓글 섹션 (새로 추가) -->
    <div class="artwork-comments-section" id="artwork-comments-section">
        <div class="artwork-comments-loading">댓글을 불러오는 중...</div>
    </div>
    
    <!-- 수정/삭제 버튼 -->
    <div class="artwork-manage-section">...</div>
</div>
```

### 4. `css/artwork.css`
```css
/* 정보 영역 높이 조정 */
.artwork-info-section {
    flex: 0.8;
    max-width: 450px;
    overflow: hidden; /* 스크롤 제어 */
}

/* 제목/설명 영역 높이 제한 */
.artwork-content {
    flex: 0 0 auto;
    max-height: 200px;
    overflow-y: auto;
}

/* 액션 버튼 스타일 */
.artwork-actions {
    border-bottom: 1px solid var(--border); /* 하단 구분선 추가 */
}

.artwork-action-btn.liked svg {
    fill: #ef4444;
    stroke: #ef4444;
}

.artwork-action-btn.disliked svg {
    fill: #6366f1;
    stroke: #6366f1;
}

/* 댓글 섹션 스타일 */
.artwork-comments-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.artwork-comments-header {
    padding: 16px 20px 12px 20px;
    border-bottom: 1px solid var(--border);
}

.artwork-comments-list {
    flex: 1;
    overflow-y: auto; /* 스크롤 가능 */
    padding: 16px 20px;
}

.artwork-comment-item {
    display: flex;
    gap: 12px;
}

.artwork-comment-form {
    padding: 12px 20px;
    border-top: 1px solid var(--border);
    position: sticky; /* 하단 고정 */
    bottom: 0;
}

.artwork-comment-input {
    flex: 1;
    resize: none;
    min-height: 40px;
    max-height: 120px;
}

/* 반응형 스타일 */
@media (max-width: 968px) {
    .artwork-image-section {
        flex: 0 0 40%;
    }
    
    .artwork-content {
        max-height: 150px;
    }
}
```

### 5. `js/main.js`
```javascript
// updateFeedCommentCount 함수 export 및 전역 등록
import { updateFeedCommentCount } from './feed.js';
window.updateFeedCommentCount = updateFeedCommentCount;
```

---

## 🔄 데이터 흐름

### 댓글 버튼 클릭 시
```
1. 사용자가 피드에서 댓글 버튼 클릭
   ↓
2. toggleComments(artworkId) 호출
   ↓
3. openFeedDetail(artworkId, true) 호출
   ↓
4. openArtworkDetail(artworkId, showComments=true) 호출
   ↓
5. 작품 정보 로드
   ↓
6. loadArtworkLikesData() - 좋아요/싫어요 데이터 로드
   ↓
7. loadArtworkComments() - 댓글 로드
   ↓
8. renderArtworkComments() - 댓글 렌더링
   ↓
9. 모달 표시
```

### 댓글 작성 시
```
1. 사용자가 댓글 입력 후 "게시" 버튼 클릭
   ↓
2. submitArtworkComment(artworkId) 호출
   ↓
3. artwork_comments 테이블에 INSERT
   ↓
4. loadArtworkComments() - 댓글 다시 로드
   ↓
5. updateFeedCommentCount() - 피드의 댓글 수 업데이트
```

### 댓글 삭제 시
```
1. 사용자가 "삭제" 버튼 클릭
   ↓
2. deleteArtworkCommentFromModal(artworkId, commentId) 호출
   ↓
3. artwork_comments 테이블에서 DELETE
   ↓
4. loadArtworkComments() - 댓글 다시 로드
   ↓
5. updateFeedCommentCount() - 피드의 댓글 수 업데이트
```

---

## ✨ 주요 기능

### 1. 댓글 섹션
- ✅ 댓글 리스트 (스크롤 가능)
- ✅ 댓글 작성 (하단 고정)
- ✅ 댓글 삭제 (본인 댓글만)
- ✅ 실시간 댓글 수 업데이트

### 2. 좋아요/싫어요
- ✅ 좋아요/싫어요 토글
- ✅ 실시간 카운트 업데이트
- ✅ 시각적 피드백 (색상 변경)
- ✅ 피드와 모달 간 동기화

### 3. 반응형 디자인
- ✅ 데스크톱: 좌우 레이아웃
- ✅ 모바일: 상하 레이아웃
- ✅ 댓글 섹션 스크롤 최적화

---

## 🎨 UI/UX 개선사항

### 1. 인스타그램 스타일 채택
- 이미지와 댓글을 한 화면에서 볼 수 있음
- 댓글 작성 시 컨텍스트 유지
- 직관적인 네비게이션

### 2. 스크롤 최적화
- 댓글 리스트만 스크롤 가능
- 댓글 입력창 하단 고정
- 작성자 정보 상단 고정

### 3. 시각적 피드백
- 좋아요: 빨간색 하트 (❤️)
- 싫어요: 보라색 엄지 (👎)
- 호버 효과 및 애니메이션

---

## 🐛 해결된 이슈

1. ✅ 피드에서 댓글창이 아래로 열려 레이아웃이 깨지는 문제
2. ✅ 댓글 작성 시 이미지를 볼 수 없는 문제
3. ✅ 좋아요/싫어요가 모달에서 작동하지 않는 문제
4. ✅ 댓글 수가 실시간으로 업데이트되지 않는 문제

---

## 📱 테스트 체크리스트

### 기능 테스트
- [ ] 피드에서 댓글 버튼 클릭 시 모달 열림
- [ ] 모달에서 댓글 리스트 표시
- [ ] 댓글 작성 가능
- [ ] 댓글 삭제 가능 (본인 댓글만)
- [ ] 좋아요/싫어요 토글 작동
- [ ] 댓글 수 실시간 업데이트

### UI 테스트
- [ ] 데스크톱 레이아웃 정상
- [ ] 모바일 레이아웃 정상
- [ ] 댓글 리스트 스크롤 정상
- [ ] 댓글 입력창 하단 고정
- [ ] 좋아요/싫어요 색상 변경

### 반응형 테스트
- [ ] 1920px (데스크톱)
- [ ] 1024px (태블릿)
- [ ] 768px (모바일)
- [ ] 480px (소형 모바일)

---

## 🔮 향후 개선 사항

1. **댓글 기능 확장**
   - 대댓글 (답글) 기능
   - 댓글 수정 기능
   - 댓글 좋아요 기능

2. **성능 최적화**
   - 댓글 무한 스크롤 (페이지네이션)
   - 댓글 캐싱
   - 낙관적 UI 업데이트

3. **사용자 경험 개선**
   - 댓글 작성 시 실시간 프리뷰
   - 멘션 기능 (@사용자)
   - 이모지 선택기

4. **접근성 개선**
   - 키보드 네비게이션
   - 스크린 리더 지원
   - ARIA 레이블 추가

---

## 📚 참고 자료

- [Instagram Web UI](https://www.instagram.com/)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [CSS Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)

---

**작성자:** AI Assistant  
**검토자:** -  
**승인일:** 2026-01-24
