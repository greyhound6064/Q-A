# 🔧 프로젝트 리팩토링 계획 및 진행 상황

**작성일:** 2026-01-25  
**프로젝트 버전:** 1.11.1 → 2.0.0 (리팩토링)

---

## 📋 리팩토링 목표

### 주요 문제점
1. **대형 파일 문제**
   - `feed.js`: 984줄 (너무 많은 책임)
   - `artwork.js`: 840줄 (작품 조회 + 댓글 시스템)

2. **중복 코드**
   - 댓글 시스템이 여러 파일에 중복 구현
   - 좋아요/싫어요 로직 중복
   - 태그 관련 로직 분산

3. **전역 상태 관리 문제**
   - 각 모듈마다 독립적인 전역 변수
   - 캐시 관리 분산

4. **유지보수성 문제**
   - 비즈니스 로직과 UI 로직 혼재
   - 에러 처리 표준화 부재

---

## ✅ 완료된 작업 (Phase 1)

### 1. 서비스 레이어 구축 ✅

#### `js/services/commentService.js` (새 파일)
- **목적:** 댓글 관련 비즈니스 로직 통합
- **주요 기능:**
  - `getCommentCount()` - 댓글 수 조회
  - `getComments()` - 계층 구조 댓글 조회
  - `buildCommentHierarchy()` - 댓글 트리 구조 생성
  - `createComment()` - 댓글 작성
  - `deleteComment()` - 댓글 삭제
  - `getBatchCommentCounts()` - 배치 조회
  - 캐시 관리 (Map 기반)

#### `js/services/likeService.js` (새 파일)
- **목적:** 좋아요/싫어요 비즈니스 로직 통합
- **주요 기능:**
  - `getLikesData()` - 좋아요 데이터 조회
  - `toggleLike()` - 좋아요 토글
  - `toggleDislike()` - 싫어요 토글
  - `getBatchLikesData()` - 배치 조회
  - `calculateNetLikes()` - 순 좋아요 계산
  - `calculateWilsonScore()` - Wilson Score 계산
  - 캐시 관리 (Map 기반)

#### `js/services/tagService.js` (새 파일)
- **목적:** 태그 관련 비즈니스 로직 통합
- **주요 기능:**
  - `getArtworkTags()` - 작품 태그 조회
  - `searchTags()` - 태그 검색 (자동완성)
  - `getPopularTags()` - 인기 태그 조회
  - `addTagsToArtwork()` - 태그 추가
  - `updateArtworkTags()` - 태그 업데이트
  - `getBatchArtworkTags()` - 배치 조회
  - `normalizeTagName()` - 태그 정규화
  - `parseTagsString()` - 태그 파싱
  - 캐시 관리 (Map 기반)

### 2. 유틸리티 강화 ✅

#### `js/utils/errorHandler.js` (새 파일)
- **목적:** 에러 처리 표준화
- **주요 기능:**
  - `showError()` - 에러 메시지 표시
  - `showSuccess()` - 성공 메시지 표시
  - `handleAuthRequired()` - 로그인 필요 처리
  - `handleUnauthorized()` - 권한 없음 처리
  - `handleSupabaseError()` - Supabase 에러 처리
  - `withErrorHandler()` - 에러 래퍼
  - `showValidationError()` - 유효성 검사 에러

#### `js/utils/uiHelpers.js` (새 파일)
- **목적:** 공통 UI 컴포넌트 생성
- **주요 기능:**
  - `createLoadingHTML()` - 로딩 스피너
  - `createEmptyStateHTML()` - 빈 상태 UI
  - `createErrorHTML()` - 에러 UI
  - `openModal()` / `closeModal()` - 모달 제어
  - `toggleElement()` - 요소 표시/숨김
  - `createMultipleImageIndicator()` - 다중 이미지 표시
  - `createUserAvatarSVG()` - 아바타 SVG
  - `createCarouselIndicators()` - 캐러셀 인디케이터
  - `createTagChipsHTML()` - 태그 칩
  - `createLikeButtonHTML()` - 좋아요 버튼
  - `createDislikeButtonHTML()` - 싫어요 버튼
  - `createCommentButtonHTML()` - 댓글 버튼

#### `js/utils.js` (확장)
- **추가된 기능:**
  - `formatAbsoluteDate()` - 절대 날짜 포맷
  - `truncateText()` - 텍스트 자르기
  - `extractUsername()` - 이메일에서 사용자명 추출
  - `getDisplayName()` - 작성자 이름 가져오기
  - `chunkArray()` - 배열 청크 분할
  - `uniqueArray()` - 중복 제거
  - `formatNumber()` - 숫자 포맷팅 (K, M)
  - `formatFileSize()` - 파일 크기 포맷팅
  - `validateImageFile()` - 이미지 파일 검증
  - `debounce()` - 디바운스
  - `throttle()` - 쓰로틀
  - `setLocalStorage()` / `getLocalStorage()` - 로컬 스토리지

---

## 🔄 진행 중인 작업 (Phase 2)

### 1. feed.js 리팩토링 (진행 예정)

#### 분할 계획:
```
js/feed/
├── feedCore.js          - 피드 로딩/렌더링 (200줄)
├── feedSort.js          - 정렬 로직 (150줄)
├── feedSearch.js        - 검색/필터 (150줄)
└── feedUI.js            - UI 렌더링 헬퍼 (100줄)
```

#### 개선 사항:
- 서비스 레이어 사용 (commentService, likeService, tagService)
- UI 헬퍼 사용 (uiHelpers)
- 에러 처리 표준화 (errorHandler)
- 전역 변수 최소화

### 2. artwork.js 리팩토링 (진행 예정)

#### 분할 계획:
```
js/artwork/
├── artworkGrid.js       - 그리드 렌더링 (150줄)
├── artworkDetail.js     - 상세보기 모달 (200줄)
└── artworkComments.js   - 댓글 UI (150줄)
```

#### 개선 사항:
- 서비스 레이어 사용
- 댓글 시스템 통합 (commentService)
- 좋아요 시스템 통합 (likeService)
- UI 컴포넌트 재사용

---

## 📅 향후 작업 (Phase 3)

### 1. 상태 관리 시스템 구축
```javascript
js/services/stateManager.js
- 중앙 집중식 상태 관리
- 이벤트 기반 상태 업데이트
- 상태 구독 시스템
```

### 2. 성능 최적화
- 이미지 레이지 로딩 개선
- 무한 스크롤 구현
- 가상 스크롤링 (대량 데이터)
- 메모이제이션 적용

### 3. 테스트 코드 작성
- 유닛 테스트 (서비스 레이어)
- 통합 테스트 (UI 컴포넌트)
- E2E 테스트 (주요 플로우)

---

## 📊 리팩토링 효과

### 코드 품질 개선
- ✅ 중복 코드 제거 (약 30% 감소 예상)
- ✅ 모듈화 개선 (단일 책임 원칙)
- ✅ 재사용성 증가 (서비스 레이어)
- ✅ 유지보수성 향상 (명확한 구조)

### 성능 개선
- ✅ 캐시 시스템 통합 (Map 기반)
- ⏳ 배치 조회 최적화
- ⏳ 불필요한 재렌더링 방지

### 개발 경험 개선
- ✅ 에러 처리 표준화
- ✅ UI 컴포넌트 재사용
- ✅ 명확한 파일 구조
- ⏳ 타입 안정성 (JSDoc)

---

## 🗂️ 새로운 디렉토리 구조

```
Q&A/
├── js/
│   ├── services/              ⭐ 새로 추가
│   │   ├── commentService.js
│   │   ├── likeService.js
│   │   ├── tagService.js
│   │   └── stateManager.js    (예정)
│   │
│   ├── utils/                 ⭐ 새로 추가
│   │   ├── errorHandler.js
│   │   └── uiHelpers.js
│   │
│   ├── feed/                  (예정)
│   │   ├── feedCore.js
│   │   ├── feedSort.js
│   │   ├── feedSearch.js
│   │   └── feedUI.js
│   │
│   ├── artwork/               (예정)
│   │   ├── artworkGrid.js
│   │   ├── artworkDetail.js
│   │   └── artworkComments.js
│   │
│   ├── utils.js               ⭐ 확장됨
│   ├── auth.js
│   ├── profile.js
│   ├── carousel.js
│   ├── tabs.js
│   ├── upload.js
│   ├── edit.js
│   ├── posts.js
│   ├── main.js
│   └── supabase-config.js
│
├── css/
├── sql/
└── 프로젝트 구조/
```

---

## 📌 주의사항

### 기존 코드 호환성
- 기존 `feed.js`와 `artwork.js`는 당분간 유지
- 점진적 마이그레이션 진행
- 전역 함수 노출 유지 (window 객체)

### 테스트 필요 항목
- [ ] 댓글 작성/삭제
- [ ] 좋아요/싫어요 토글
- [ ] 태그 검색/필터
- [ ] 피드 정렬
- [ ] 작품 상세보기

---

## 🎯 다음 단계

1. **feed.js 리팩토링**
   - 서비스 레이어 통합
   - 파일 분할
   - 테스트

2. **artwork.js 리팩토링**
   - 서비스 레이어 통합
   - 파일 분할
   - 테스트

3. **main.js 업데이트**
   - 새 모듈 import
   - 전역 함수 등록

4. **ARCHITECTURE.md 업데이트**
   - 새로운 구조 반영
   - 의존성 그래프 업데이트

---

**리팩토링 진행률:** 30% (Phase 1 완료)
