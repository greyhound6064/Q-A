# 🏗️ 프로젝트 아키텍처

> **AI 에이전트용 핵심 참조 문서**

**버전:** 10.8.7 | **업데이트:** 2026-01-30

---

## 🤖 AI 코딩 규칙

### CSS 작업 시
1. **반응형 수정:** `css/responsive/` 폴더에서 컴포넌트별 파일 수정
2. **작품관/피드 공통 스타일:** `shared-responsive.css` 수정 (중복 금지)
3. **새 컴포넌트 반응형:** 새 파일 생성 후 `responsive.css`에 import 추가

### 템플릿/모달 작업 시
1. `js/templates/shared/icons.js`, `components.js` 먼저 확인
2. 기존 모달 템플릿 참고 (`js/templates/modals/*.js`)
3. **중복 코드 절대 금지** - 항상 공통 컴포넌트 사용
4. `templateLoader.js`에 등록 필수

### 금지 사항
- ❌ index.html에 모달 HTML 직접 추가
- ❌ SVG 코드 복사/붙여넣기
- ❌ 헤더/푸터 중복 작성
- ❌ 작품관/피드 카드 스타일 중복 작성 (shared-responsive.css 사용)

### 빠른 참조
```javascript
// 모달 구조
import { createModalHeader, createModalFooter } from '../shared/components.js';
createModalHeader('제목', 'closeFunction()')
createModalFooter('cancelFn()', 'saveFn()', '저장')

// 아이콘
import { Icons } from '../shared/icons.js';
Icons.close() / user() / search() / upload() / trash() / edit()

// 폼 입력
createTextInput('id', '라벨', 'placeholder', maxlen, '힌트')
createTextarea('id', '라벨', 'placeholder', maxlen, rows, '힌트')
createPostTypeSelector('name', 'onChangeFn()')
createImageUploadSection('prefix', 'prev()', 'next()', 'change()', 'remove()')
```

---

## 📁 디렉토리 구조

```
Q&A/
├── index.html (793줄)
├── supabase-config.js
├── server.py
│
├── css/ (24개)
│   ├── base.css - CSS 변수, 다크모드, 기본 스타일
│   ├── layout.css - 사이드바, 탭, 콘텐츠 영역
│   ├── profile.css - 프로필 헤더, 탭, 통계
│   ├── gallery.css - 작품관 카드 (인스타그램 스타일)
│   ├── feed.css - 피드 통합 스타일
│   ├── messages.css - 쪽지 시스템
│   ├── upload.css - 업로드 모달
│   ├── user-search.css - 사용자 검색
│   ├── nickname-validation.css - 닉네임 검증
│   │
│   ├── components/ (5개)
│   │   ├── modal.css - 모달 기본 구조
│   │   ├── button.css - 버튼 스타일
│   │   ├── form.css - 폼 입력 요소
│   │   ├── state.css - 로딩, 빈 상태
│   │   └── welcome.css - 웰컴 화면
│   │
│   ├── feed/ (6개)
│   │   ├── feedLayout.css - 피드 레이아웃
│   │   ├── feedItem.css - 피드 아이템 카드
│   │   ├── feedFilters.css - 검색, 필터, 정렬
│   │   ├── feedDetail.css - 피드 상세 모달
│   │   ├── feedComments.css - 댓글 시스템
│   │   └── feedVideo.css - 비디오 플레이어
│   │
│   ├── artwork/ (6개)
│   │   ├── gallery.css - 작품관 그리드
│   │   ├── info.css - 작품 정보
│   │   ├── actions.css - 좋아요, 저장 등
│   │   ├── comments.css - 댓글
│   │   ├── modal.css - 작품 상세 모달
│   │   └── responsive.css - 작품관 반응형
│   │
│   ├── responsive/ (8개) ⭐
│   │   ├── layout-responsive.css (238줄) - 사이드바, 헤더, 네비게이션
│   │   ├── profile-responsive.css (681줄) - 프로필 헤더, 탭, 통계
│   │   ├── shared-responsive.css (382줄) - 작품관 & 피드 공통 카드 스타일
│   │   ├── gallery-responsive.css (8줄) - 작품관 전용 (현재 비어있음)
│   │   ├── feed-responsive.css (218줄) - 피드 전용 (검색, 필터)
│   │   ├── messages-responsive.css (656줄) - 쪽지 사이드바, 채팅
│   │   ├── user-search-responsive.css (97줄) - 사용자 검색
│   │   └── upload-responsive.css (263줄) - 업로드/수정 모달
│   │
│   └── responsive.css - 통합 import 파일
│
├── js/ (40개)
│   ├── main.js - 진입점, 초기화
│   ├── auth.js - 인증 (Google OAuth)
│   ├── tabs.js - 탭 전환
│   ├── scrollToggle.js - 검색 버튼 스크롤 표시/숨김
│   │
│   ├── templates/ (14개) ⭐
│   │   ├── templateLoader.js (137줄) - 템플릿 동적 로딩
│   │   ├── shared/
│   │   │   ├── icons.js (83줄, 17개 아이콘)
│   │   │   └── components.js (182줄, 9개 컴포넌트)
│   │   └── modals/ (9개)
│   │       ├── upload.js - 업로드 모달
│   │       ├── editArtwork.js - 작품 수정
│   │       ├── profileEdit.js - 프로필 편집
│   │       ├── followers.js - 팔로워/팔로잉 목록
│   │       ├── customStatus.js - 커스텀 상태
│   │       ├── communityWrite.js - 커뮤니티 작성
│   │       ├── artworkDetail.js - 작품 상세
│   │       ├── communityDetail.js - 커뮤니티 상세
│   │       └── welcome.js - 웰컴 화면
│   │
│   ├── services/ (6개)
│   │   ├── commentService.js - 댓글 CRUD
│   │   ├── likeService.js - 좋아요/싫어요
│   │   ├── tagService.js - 태그 관리
│   │   ├── followService.js - 팔로우/언팔로우
│   │   ├── saveService.js - 게시물 저장
│   │   └── sortingService.js - 정렬 (최신/인기/떠오르는)
│   │
│   ├── utils/ (2개)
│   │   ├── errorHandler.js - 에러 처리
│   │   └── uiHelpers.js - UI 유틸리티
│   │
│   ├── feed/ (8개)
│   │   ├── feedCore.js - 피드 핵심 로직
│   │   ├── feedDetail.js - 피드 상세
│   │   ├── feedComments.js - 댓글 시스템
│   │   ├── feedCarousel.js - 이미지 캐러셀
│   │   ├── feedSort.js - 정렬
│   │   ├── feedSearch.js - 검색
│   │   ├── feedVideo.js - 비디오 재생
│   │   └── feedLikes.js - 좋아요/싫어요
│   │
│   ├── artwork/ (3개)
│   │   ├── artworkGrid.js - 작품 그리드
│   │   ├── artworkDetail.js - 작품 상세
│   │   └── artworkComments.js - 댓글
│   │
│   ├── profile.js - 프로필 관리
│   ├── nicknameValidator.js - 닉네임 검증
│   ├── carousel.js - 캐러셀 공통
│   ├── artwork.js - 작품 관리
│   ├── upload.js - 업로드
│   ├── edit.js - 수정
│   ├── feed.js - 피드 통합
│   ├── gallery.js - 작품관 통합
│   ├── messages.js - 쪽지 시스템
│   ├── userSearch.js - 사용자 검색
│   └── welcome.js - 웰컴 화면
│
└── sql/ (25개) - 테이블 스키마 및 RLS 정책
```

---

## 🎯 핵심 기능 매핑

### 템플릿 시스템 ⭐
- **위치:** `js/templates/`
- **컴포넌트:** `shared/components.js` (9개), `shared/icons.js` (17개)
- **모달:** `modals/*.js` (9개)
- **로더:** `templateLoader.js` - 동적 로딩, 캐싱
- **원칙:** DRY, 컴포넌트 기반, 단일 진실 공급원

### 인증
- **파일:** `js/auth.js`, `js/main.js`
- **함수:** `signInWithGoogle()`, `signOut()`, `updateAuthUI()`
- **DB:** `profiles` 테이블 자동 생성

### 프로필
- **파일:** `js/profile.js`, `js/nicknameValidator.js`
- **주요 함수:** 
  - `updateProfileInfo()` - 프로필 정보 표시
  - `saveProfileChanges()` - 프로필 저장
  - `validateNickname()` - 닉네임 검증 (중복, 길이, 특수문자)
  - `renderFollowersInline()` - 팔로워/팔로잉 인라인 표시
  - `updateProfileStatuses()` - 다중 상태 배지
- **본인 프로필:** 내 게시물(작품관/자유게시판/비공개), 저장된 게시물, 팔로워, 팔로잉, 로그아웃
- **타인 프로필:** 'XX님의 작품' (작품관 공개만), 팔로우 버튼, 쪽지 버튼

### 작품 관리
- **파일:** `js/artwork.js`, `js/upload.js`, `js/edit.js`
- **함수:** 
  - `renderArtworksGrid()` - 작품 그리드 렌더링
  - `openArtworkDetail()` - 작품 상세 모달
  - `uploadPost()` - 작품 업로드
  - `updateArtwork()` - 작품 수정
- **미디어:** 이미지(10MB), 영상/음원(50MB), 최대 10개
- **게시 설정:** 작품관/자유게시판/비공개

### 작품관 (인스타그램 스타일)
- **파일:** `js/gallery.js`, `css/gallery.css`, `css/artwork/`
- **스타일:** 카드 디자인, 고정 높이(600px), 큰 프로필(40px), 최대 너비 500px
- **레이아웃:** 사이드바 포함 중앙 정렬 (`margin-left: calc(50% - 250px - 35px)`)
- **필터:** `post_type = 'gallery'` AND `is_public = true`
- **상세 모달:** 좌우 레이아웃, 우측 500px, 통합 스크롤, 댓글 하단 sticky
- **다중 파일:**
  - 데스크톱: 캐러셀 방식 (좌우 화살표, 인디케이터)
  - 모바일(768px 이하): 레딧 스타일 좌우 스크롤 (스와이프, snap 스크롤)
  - 페이지 표시: 중앙 하단에 "현재/전체" 형식 (예: "1/5")

### 자유게시판 (스레드 스타일)
- **파일:** `js/feed.js`, `js/feed/*.js` (8개), `css/feed/*.css` (6개)
- **스타일:** 플랫 디자인, 작은 프로필(36px), 최대 너비 600px, 구분선
- **레이아웃:** 사이드바 포함 중앙 정렬 (`margin-left: calc(50% - 300px - 35px)`)
- **필터:** `post_type = 'feed'` AND `is_public = true`
- **상세 모달:** 작품관과 동일 구조
- **댓글:** 동일 계층 답글 시스템, @멘션 지원
- **다중 파일:**
  - 데스크톱: 캐러셀 방식 (좌우 화살표, 인디케이터)
  - 모바일(768px 이하): 레딧 스타일 좌우 스크롤 (스와이프, snap 스크롤)
  - 페이지 표시: 중앙 하단에 "현재/전체" 형식 (예: "1/5")

### 검색 & 플로팅 액션 버튼
- **파일:** `js/scrollToggle.js`, `css/feed/feedFilters.css`
- **데스크톱:** 
  - 검색 아이콘: 상단 중앙 sticky, 스크롤 방향에 따라 표시/숨김
  - 검색 패널: 검색 아이콘 아래 sticky 고정
- **모바일 (768px 이하):**
  - 플로팅 버튼 그룹: 우측 하단 고정 (`bottom: 80px`)
  - 게시물 추가 (+): 40px, `openUploadModal()` 호출
  - 검색 (🔍): 40px, 클릭 시 상단에 검색 패널 표시
- **검색 패널:** 검색창, 정렬(최신/인기/떠오르는), 태그 필터
- **스크롤 UX:** 
  - 아래로 스크롤: 상단/하단 네비게이션, 플로팅 버튼, 검색 아이콘 숨김
  - 위로 스크롤: 모든 네비게이션 요소 표시
- **함수:** `initScrollToggle()` - content-area 스크롤 방향 감지

### 쪽지 시스템
- **파일:** `js/messages.js`, `css/messages.css`
- **함수:** 
  - `initMessages()` - 초기화
  - `loadConversations()` - 대화 목록 로드
  - `selectConversation()` - 대화 선택
  - `sendMessageFromChat()` - 메시지 전송
- **UI:** 좌측 대화 목록 + 우측 채팅창
- **Realtime:** INSERT 이벤트 구독, 실패 시 폴링(3초)
- **데스크톱:** 모달 형태 (1050px × 75vh)
- **모바일:** 전체 화면, 뒤로가기 버튼

---

## 🗄️ DB 스키마

### profiles
```sql
id UUID PRIMARY KEY
user_id UUID UNIQUE REFERENCES auth.users
nickname TEXT UNIQUE
bio TEXT
avatar_url TEXT
followers_count INT DEFAULT 0
following_count INT DEFAULT 0
status JSONB -- 다중 상태 배지
created_at TIMESTAMPTZ
```

### artworks
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES profiles
title TEXT
description TEXT
images TEXT[] -- 최대 10개
image_url TEXT -- 호환성 (NULL 허용)
media_type TEXT -- 'image', 'video', 'audio'
is_public BOOLEAN DEFAULT true
post_type TEXT -- 'gallery', 'feed'
vibe_link TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### artwork_comments
```sql
id UUID PRIMARY KEY
artwork_id UUID REFERENCES artworks ON DELETE CASCADE
user_id UUID REFERENCES profiles
content TEXT
parent_comment_id UUID REFERENCES artwork_comments ON DELETE CASCADE
mentioned_nickname TEXT -- @멘션
created_at TIMESTAMPTZ
```

### artwork_likes
```sql
id UUID PRIMARY KEY
artwork_id UUID REFERENCES artworks ON DELETE CASCADE
user_id UUID REFERENCES profiles
like_type TEXT -- 'like', 'dislike'
created_at TIMESTAMPTZ
UNIQUE(artwork_id, user_id)
```

### follows
```sql
id UUID PRIMARY KEY
follower_id UUID REFERENCES profiles
following_id UUID REFERENCES profiles
created_at TIMESTAMPTZ
UNIQUE(follower_id, following_id)
-- 트리거: 팔로우 수 자동 업데이트
```

### messages
```sql
id UUID PRIMARY KEY
sender_id UUID REFERENCES profiles
receiver_id UUID REFERENCES profiles
content TEXT CHECK(LENGTH(content) <= 500)
is_read BOOLEAN DEFAULT false
hidden_by_sender BOOLEAN DEFAULT false
hidden_by_receiver BOOLEAN DEFAULT false
created_at TIMESTAMPTZ
```

### saved_artworks
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES profiles
artwork_id UUID REFERENCES artworks ON DELETE CASCADE
created_at TIMESTAMPTZ
UNIQUE(user_id, artwork_id)
```

### tags
```sql
id UUID PRIMARY KEY
name TEXT UNIQUE
usage_count INT DEFAULT 0
```

### artwork_tags
```sql
artwork_id UUID REFERENCES artworks ON DELETE CASCADE
tag_id UUID REFERENCES tags ON DELETE CASCADE
PRIMARY KEY(artwork_id, tag_id)
```

---

## 🔄 모듈 의존성

```
main.js
│
├─→ templates/templateLoader.js
│   └─→ modals/*.js
│       └─→ shared/icons.js, shared/components.js
│
├─→ services/ (6개)
│   ├─→ commentService.js
│   ├─→ likeService.js
│   ├─→ tagService.js
│   ├─→ followService.js
│   ├─→ saveService.js
│   └─→ sortingService.js
│
├─→ utils/ (2개)
│   ├─→ errorHandler.js
│   └─→ uiHelpers.js
│
├─→ feed/ (8개) → services
├─→ artwork/ (3개) → services
├─→ auth.js
├─→ profile.js
├─→ gallery.js
├─→ messages.js
├─→ userSearch.js
├─→ scrollToggle.js
└─→ tabs.js
```

---

## 🎨 반응형 CSS 구조

### 파일 구조
```
css/responsive/
├── layout-responsive.css       - 사이드바, 헤더, 네비게이션, 하단 네비
├── profile-responsive.css      - 프로필 헤더, 탭, 통계, 인스타그램 스타일
├── shared-responsive.css       - 작품관 & 피드 공통 카드 스타일 ⭐
├── gallery-responsive.css      - 작품관 전용 (현재 비어있음)
├── feed-responsive.css         - 피드 전용 (검색, 필터, 정렬)
├── messages-responsive.css     - 쪽지 사이드바, 채팅, 뒤로가기
├── user-search-responsive.css  - 사용자 검색
└── upload-responsive.css       - 업로드/수정 모달 (컴팩트 디자인)
```

### 중요 원칙
1. **작품관/피드 공통 스타일:** `shared-responsive.css`에만 작성
2. **컴포넌트별 수정:** 해당 파일만 열어서 수정
3. **새 컴포넌트:** 새 파일 생성 후 `responsive.css`에 import 추가
4. **중복 금지:** 동일한 스타일을 여러 파일에 작성하지 않음

### 미디어 쿼리 브레이크포인트
- `max-width: 768px` - 태블릿 이하
- `max-width: 480px` - 모바일
- `min-width: 769px and max-width: 1024px` - 태블릿 가로
- `max-height: 500px and orientation: landscape` - 모바일 가로

---

## 📱 반응형 UX

### 데스크톱 (1024px 이상)
- 사이드바: 좌측 고정 (70px)
- 작품관: 중앙 정렬 (500px)
- 피드: 중앙 정렬 (600px)
- 검색: 상단 sticky, 스크롤 시 2초간 표시

### 태블릿 (768px ~ 1024px)
- 사이드바: 상단 헤더로 전환 (48px)
- 하단 네비게이션: 표시 (65px)
- 콘텐츠: 전체 너비 사용
- 검색: 플로팅 버튼

### 모바일 (480px 이하)
- 프로필: 인스타그램 스타일 (가로 레이아웃)
- 게시물 그리드: 3x3
- 게시물 카드: 최대 높이 85vh (화면 넘침 방지), 이미지 최대 50vh, 콘텐츠 최대 20vh 스크롤
- 쪽지: 전체 화면, 뒤로가기 버튼
- 플로팅 액션 버튼: 우측 하단 (게시물 추가, 검색)
- 자유게시판 이미지: 그리드 레이아웃 (1개: 250px, 2개: 2열 160px, 3개: 첫째 전체너비+둘째셋째 2열, 4개: 2x2 그리드)

---

**이 문서를 항상 최신 상태로 유지하세요!**
