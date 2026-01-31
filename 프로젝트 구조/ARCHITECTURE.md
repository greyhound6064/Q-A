# 프로젝트 아키텍처

**버전:** 12.0.0 | **업데이트:** 2026-02-01

---

## 🤖 AI 코딩 규칙

### CSS 작업
- 반응형: `css/responsive/` 컴포넌트별 파일 수정
- 공통 카드 스타일: `shared-responsive.css` (중복 금지)
- 새 컴포넌트: 새 파일 생성 → `responsive.css`에 import

### 템플릿/모달 작업
1. `js/templates/shared/icons.js`, `components.js` 먼저 확인
2. 기존 모달 템플릿 참고 (`js/templates/modals/*.js`)
3. 중복 코드 금지 - 공통 컴포넌트 사용
4. `templateLoader.js`에 등록

### 금지 사항
- ❌ 설명파일 생성
- ❌ index.html에 모달 HTML 직접 추가
- ❌ SVG 코드 복사/붙여넣기
- ❌ 헤더/푸터 중복 작성

### 빠른 참조
```javascript
// 모달
import { createModalHeader, createModalFooter } from '../shared/components.js';
createModalHeader('제목', 'closeFunction()')
createModalFooter('cancelFn()', 'saveFn()', '저장')

// 아이콘
import { Icons } from '../shared/icons.js';
Icons.close() / user() / search() / upload() / trash() / edit()

// 폼
createTextInput('id', '라벨', 'placeholder', maxlen, '힌트')
createTextarea('id', '라벨', 'placeholder', maxlen, rows, '힌트')
createPostTypeSelector('name', 'onChangeFn()')
```

---

## 📁 디렉토리 구조

```
├── css/ (27개)
│   ├── base.css, layout.css, profile.css
│   ├── post.css (게시물 공통), artworkBoard.css (작품 게시판)
│   ├── board.css (통합 게시판) ⭐
│   ├── messages.css, upload.css, user-search.css
│   ├── components/ (6) - modal, button, form, state, welcome, loginRequired
│   ├── post/ (6) - layout, item, filters, detail, comments, video
│   ├── artwork/ (6) - gallery, info, actions, comments, modal, responsive
│   └── responsive/ (9) ⭐
│       ├── layout-responsive.css (234줄)
│       ├── profile-responsive.css (681줄)
│       ├── shared-responsive.css (382줄) - 공통 카드
│       ├── artworkBoard-responsive.css, post-responsive.css
│       ├── messages-responsive.css (656줄)
│       ├── user-search-responsive.css, upload-responsive.css, welcome-responsive.css
│
├── js/ (43개)
│   ├── main.js, auth.js, tabs.js
│   ├── board.js (통합 게시판) ⭐
│   ├── darkMode.js, backgroundMusic.js
│   ├── templates/ (15)
│   │   ├── templateLoader.js (145줄)
│   │   ├── shared/ - icons.js (17개), components.js (9개)
│   │   └── modals/ (10) - upload, editArtwork, profileEdit, followers, customStatus, 
│   │                       communityWrite, artworkDetail, communityDetail, welcome, loginRequired
│   ├── services/ (7) ⭐
│   │   ├── commentService.js, likeService.js, tagService.js
│   │   ├── followService.js, saveService.js, sortingService.js
│   │   └── profileService.js (프로필 캐싱) ⭐
│   ├── utils/ (4) - errorHandler, uiHelpers, historyManager, typeUtils
│   ├── post/ (8) - core, detail, comments, carousel, sort, search, video, likes
│   ├── artwork/ (3) - grid, detail, comments
│   ├── profile.js, nicknameValidator.js, carousel.js
│   ├── artwork.js, upload.js, edit.js
│   ├── post.js, artworkBoard.js, messages.js, userSearch.js, welcome.js, utils.js
│
└── sql/ (26) - ADD_PERFORMANCE_INDEXES.sql ⭐
```

---

## 🎯 핵심 기능

### 통합 게시판 ⭐ (리팩토링 완료)
**파일:** `js/board.js`, `css/board.css`
- 메인 탭: "게시판" (단일)
- 서브탭: "작품 게시판" / "자유 게시판"
- DB 필터: `post_type` ('gallery' / 'feed')
- 스타일: 인스타그램 카드 (600px)
- 최적화: 배치 조회, 초기 30개, Intersection Observer
- 함수: `initBoard()`, `switchBoardType()`, `loadBoardPosts()`, `renderBoardList()`
- 공통 모듈: `js/post/*.js` (8개), `css/post/*.css` (6개)

### 프로필 서비스 ⭐
**파일:** `js/services/profileService.js`
- `getProfile(userId, useCache)`, `getBatchProfiles(userIds, useCache)`
- `getAvatarHTML(profile)`, `updateProfile(userId, updates)`
- `clearProfilesCache(userId)` - 메모리 캐싱

### 히스토리 관리
**파일:** `js/utils/historyManager.js`
- 지원: 탭, 서브탭, 모달
- 메서드: `pushTabState()`, `pushModalState()`, `goBack()`, `isRestoringState()`

### 템플릿 시스템
**위치:** `js/templates/`
- 컴포넌트: `shared/components.js` (9개), `shared/icons.js` (17개)
- 모달: `modals/*.js` (10개)
- 로더: `templateLoader.js` (동적 로딩, 캐싱)

### 인증
**파일:** `js/auth.js`
- `signInWithGoogle()`, `signOut()`, `updateAuthUI()`, `showLoginRequiredModal()`

### 프로필
**파일:** `js/profile.js`, `js/nicknameValidator.js`
- `updateProfileInfo()`, `saveProfileChanges()`, `validateNickname()`
- `renderFollowersInline()`, `updateProfileStatuses()`

### 작품 관리
**파일:** `js/artwork.js`, `js/upload.js`, `js/edit.js`
- `renderArtworksGrid()`, `openArtworkDetail()`, `uploadPost()`, `updateArtwork()`
- 미디어: 이미지(10MB), 영상/음원(50MB), 최대 10개

### 작품 게시판
**파일:** `js/artworkBoard.js` (독립), `js/board.js` (통합)
- 필터: `post_type = 'gallery'` AND `is_public = true`
- 스타일: 인스타그램 카드 (500px, 프로필 40px)

### 자유 게시판
**파일:** `js/post.js` (공통), `js/post/*.js` (8개)
- 필터: `post_type = 'feed'` AND `is_public = true`
- 스타일: 플랫 디자인 (600px, 프로필 36px)
- 댓글: 동일 계층 답글, @멘션

### 검색 & 플로팅 버튼
**파일:** `js/board.js`, `css/board.css`
- 데스크톱: 상단 우측 (`top: 24px, right: 240px`), 가로 배치
- 모바일: 우측 하단 (`bottom: 80px, right: 16px`), 세로 배치 (48px)
- 기능: 검색, 정렬, 태그 필터
- 함수: `toggleBoardSearchPanel()`, `performBoardSearch()`, `changeBoardSortMode()`

### 쪽지
**파일:** `js/messages.js`, `css/messages.css`
- `initMessages()`, `loadConversations()`, `selectConversation()`, `sendMessageFromChat()`
- UI: 좌측 대화 목록 + 우측 채팅창
- Realtime: INSERT 구독, 실패 시 폴링(3초)

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
status JSONB
created_at TIMESTAMPTZ
```

### artworks ⭐
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES profiles
title TEXT
description TEXT
images TEXT[] -- 최대 10개
image_url TEXT -- NULL 허용
media_type TEXT -- 'image', 'video', 'audio'
is_public BOOLEAN DEFAULT true
post_type TEXT -- 'gallery', 'feed'
vibe_link TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ

-- 인덱스
INDEX idx_artworks_post_type_public (post_type, is_public, created_at DESC)
INDEX idx_artworks_user_id (user_id, created_at DESC)
INDEX idx_artworks_created_at (created_at DESC)
```

### artwork_comments ⭐
```sql
id UUID PRIMARY KEY
artwork_id UUID REFERENCES artworks ON DELETE CASCADE
user_id UUID REFERENCES profiles
content TEXT
parent_comment_id UUID REFERENCES artwork_comments ON DELETE CASCADE
mentioned_nickname TEXT
created_at TIMESTAMPTZ

INDEX idx_artwork_comments_artwork_id (artwork_id, created_at ASC)
INDEX idx_artwork_comments_parent_id (parent_comment_id)
```

### artwork_likes ⭐
```sql
id UUID PRIMARY KEY
artwork_id UUID REFERENCES artworks ON DELETE CASCADE
user_id UUID REFERENCES profiles
like_type TEXT -- 'like', 'dislike'
created_at TIMESTAMPTZ
UNIQUE(artwork_id, user_id)

INDEX idx_artwork_likes_artwork_id (artwork_id, like_type)
INDEX idx_artwork_likes_user_artwork (user_id, artwork_id)
```

### follows
```sql
id UUID PRIMARY KEY
follower_id UUID REFERENCES profiles
following_id UUID REFERENCES profiles
created_at TIMESTAMPTZ
UNIQUE(follower_id, following_id)
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

### saved_artworks ⭐
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES profiles
artwork_id UUID REFERENCES artworks ON DELETE CASCADE
created_at TIMESTAMPTZ
UNIQUE(user_id, artwork_id)

INDEX idx_saved_artworks_user_id (user_id, created_at DESC)
INDEX idx_saved_artworks_artwork_id (artwork_id)
```

### tags ⭐
```sql
id UUID PRIMARY KEY
name TEXT UNIQUE
usage_count INT DEFAULT 0

INDEX idx_tags_name (name)
INDEX idx_tags_usage_count (usage_count DESC)
```

### artwork_tags ⭐
```sql
artwork_id UUID REFERENCES artworks ON DELETE CASCADE
tag_id UUID REFERENCES tags ON DELETE CASCADE
PRIMARY KEY(artwork_id, tag_id)

INDEX idx_artwork_tags_artwork_id (artwork_id)
INDEX idx_artwork_tags_tag_id (tag_id)
```

---

## 🔄 모듈 의존성

```
main.js
├─→ templates/templateLoader.js → modals/*.js → shared/icons.js, components.js
├─→ services/ (7) - comment, like, tag, follow, save, sorting, profile ⭐
├─→ utils/ (4) - errorHandler, uiHelpers, historyManager, typeUtils
├─→ board.js ⭐ → services, post/postLikes
├─→ post.js → post/ (8) → services
├─→ artworkBoard.js → services, post/postLikes
├─→ artwork/ (3) → services
├─→ auth.js, profile.js, messages.js, userSearch.js, tabs.js
```

---

## 🎨 반응형 CSS

### 구조
```
css/responsive/
├── layout-responsive.css - 사이드바, 헤더, 네비게이션
├── profile-responsive.css - 프로필 헤더, 탭, 통계
├── shared-responsive.css - 공통 카드 ⭐
├── artworkBoard-responsive.css, post-responsive.css
├── messages-responsive.css, user-search-responsive.css
├── upload-responsive.css, welcome-responsive.css
```

### 원칙
1. 공통 스타일: `shared-responsive.css`만 수정
2. 컴포넌트별 파일 분리
3. 중복 금지

### 브레이크포인트
- `max-width: 768px` - 태블릿 이하
- `max-width: 480px` - 모바일
- `min-width: 769px and max-width: 1024px` - 태블릿 가로
- `max-height: 500px and orientation: landscape` - 모바일 가로

---

## 📱 반응형 UX

### 데스크톱 (1024px+)
- 사이드바: 70px 좌측 고정
- 작품 게시판: 500px, 자유 게시판: 600px
- 검색: 상단 sticky

### 태블릿 (768px~1024px)
- 사이드바 → 상단 헤더 (48px)
- 하단 네비게이션 (65px)
- 검색: 플로팅 버튼

### 모바일 (480px-)
- 프로필: 인스타그램 스타일
- 게시물 그리드: 3x3
- 카드: 최대 85vh
- 플로팅 버튼: 우측 하단
