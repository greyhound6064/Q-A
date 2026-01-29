# 🏗️ 프로젝트 아키텍처

> **AI 에이전트용 핵심 참조 문서**

**버전:** 10.7.11 | **업데이트:** 2026-01-29

---

## 🤖 AI 코딩 규칙

### 템플릿/모달 작업 시
1. `js/templates/shared/icons.js`, `components.js` 먼저 확인
2. 기존 모달 템플릿 참고 (`js/templates/modals/*.js`)
3. **중복 코드 절대 금지** - 항상 공통 컴포넌트 사용
4. `templateLoader.js`에 등록 필수

### 금지 사항
- ❌ index.html에 모달 HTML 직접 추가
- ❌ SVG 코드 복사/붙여넣기
- ❌ 헤더/푸터 중복 작성

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
├── index.html (628줄)
├── supabase-config.js
├── server.py
├── 최최종11-Photoroom.png (브랜드 로고)
│
├── css/ (16개)
│   ├── feed/ (6개) - 자유게시판 스레드 스타일
│   ├── artwork/ (6개) - 작품관 인스타그램 스타일
│   ├── components/ (5개) - modal, button, form, state, welcome
│   └── base.css, layout.css, profile.css, upload.css, gallery.css, messages.css
│
├── js/ (40개)
│   ├── templates/ ⭐ 템플릿 시스템 (14개)
│   │   ├── shared/
│   │   │   ├── icons.js (83줄, 17개 아이콘)
│   │   │   └── components.js (182줄, 9개 컴포넌트)
│   │   ├── modals/ (9개)
│   │   │   ├── upload.js (27줄)
│   │   │   ├── editArtwork.js (29줄)
│   │   │   ├── profileEdit.js (41줄)
│   │   │   ├── followers.js (28줄)
│   │   │   ├── customStatus.js (43줄)
│   │   │   ├── communityWrite.js (28줄)
│   │   │   ├── artworkDetail.js (125줄)
│   │   │   ├── communityDetail.js (130줄)
│   │   │   └── welcome.js (62줄)
│   │   └── templateLoader.js (137줄)
│   │
│   ├── services/ (6개) - commentService, likeService, tagService, followService, saveService, sortingService
│   ├── utils/ (2개) - errorHandler, uiHelpers
│   ├── feed/ (8개) - feedCore, feedDetail, feedComments, feedCarousel, feedSort, feedSearch, feedVideo, feedLikes
│   ├── artwork/ (3개) - artworkGrid, artworkDetail, artworkComments
│   │
│   └── auth.js, profile.js, nicknameValidator.js, carousel.js, tabs.js
│       artwork.js, upload.js, edit.js, feed.js, gallery.js, messages.js, userSearch.js, welcome.js, main.js
│
└── sql/ (25개) - 테이블 스키마 및 RLS 정책
```

---

## 🎯 핵심 기능 매핑

### 템플릿 시스템 ⭐
- **파일:** `js/templates/`
- **컴포넌트:** `shared/components.js` (9개), `shared/icons.js` (17개)
- **모달:** `modals/*.js` (8개)
- **원칙:** DRY, 컴포넌트 기반, 단일 진실 공급원, 동적 로딩

### 인증
- **파일:** `js/auth.js`, `js/main.js`
- **함수:** `signInWithGoogle()`, `signOut()`, `updateAuthUI()`

### 프로필
- **파일:** `js/profile.js`, `js/nicknameValidator.js`
- **주요 함수:** `updateProfileInfo()`, `saveProfileChanges()`, `validateNickname()`, `renderFollowersInline()`, `updateProfileStatuses()`
- **본인:** 내 게시물(작품관/자유게시판/비공개) / 저장된 게시물 / 팔로워 / 팔로잉 / 로그아웃
- **타인:** 'XX님의 작품' (작품관 공개만), 팔로우 버튼, 쪽지 버튼

### 작품 관리
- **파일:** `js/artwork.js`, `js/upload.js`, `js/edit.js`
- **함수:** `renderArtworksGrid()`, `openArtworkDetail()`, `uploadPost()`, `updateArtwork()`
- **미디어:** 이미지(10MB), 영상/음원(50MB), 최대 10개
- **게시 설정:** 작품관/자유게시판/비공개

### 작품관 (인스타그램 스타일)
- **파일:** `js/gallery.js` (통합), `css/gallery.css`
- **스타일:** 카드 디자인, 고정 높이(600px), 큰 프로필(40px), 최대 너비 500px
- **레이아웃:** 사이드바 포함 전체 화면 중앙 정렬 (`margin-left: calc(50% - 250px - 35px)`)
- **필터:** `post_type = 'gallery'` AND `is_public = true`
- **상세:** 좌우 레이아웃, 우측 500px, 통합 스크롤, 댓글 하단 sticky

### 자유게시판 (스레드 스타일)
- **파일:** `js/feed.js` (통합), `js/feed/*.js` (8개), `css/feed/*.css` (6개)
- **스타일:** 플랫 디자인, 작은 프로필(36px), 최대 너비 600px, 구분선
- **레이아웃:** 사이드바 포함 전체 화면 중앙 정렬 (`margin-left: calc(50% - 300px - 35px)`)
- **필터:** `post_type = 'feed'` AND `is_public = true`
- **상세:** 작품관과 동일 구조, 동일 계층 답글 시스템

### 쪽지 시스템
- **파일:** `js/messages.js`, `css/messages.css`
- **함수:** `initMessages()`, `loadConversations()`, `selectConversation()`, `sendMessageFromChat()`
- **UI:** 좌측 대화 목록 + 우측 채팅창
- **Realtime:** INSERT 이벤트 구독, 실패 시 폴링(3초)

---

## 🗄️ DB 스키마 (핵심)

### profiles
```sql
id, user_id (UNIQUE), nickname (UNIQUE), bio, avatar_url
followers_count, following_count
status (JSON 배열 - 다중 상태)
```

### artworks
```sql
id, user_id, title, description, images[], vibe_link
media_type ('image', 'video', 'audio')
is_public (true/false), post_type ('gallery'/'feed')
image_url, images: NULL 허용 (텍스트만 게시 가능)
```

### artwork_comments
```sql
id, artwork_id, user_id, content
parent_comment_id (최상위 원댓글), mentioned_nickname (@멘션)
CASCADE 삭제: 원댓글 삭제 시 모든 답글 삭제
```

### artwork_likes
```sql
id, artwork_id, user_id, like_type ('like'|'dislike')
UNIQUE(artwork_id, user_id)
```

### follows
```sql
id, follower_id, following_id, created_at
UNIQUE(follower_id, following_id)
트리거: 팔로우 수 자동 업데이트
```

### messages
```sql
id, sender_id, receiver_id, content, is_read, created_at
hidden_by_sender, hidden_by_receiver
content: 최대 500자
```

---

## 🔄 모듈 의존성

```
main.js
│
├─→ templates/
│   ├─→ templateLoader.js
│   │   └─→ modals/*.js → shared/icons.js, shared/components.js
│
├─→ services/ (6개)
│   └─→ Supabase (comments, likes, tags, follows, saves)
│
├─→ utils/ (2개)
│
├─→ feed/ (8개) → services
├─→ artwork/ (3개) → services
├─→ auth.js, profile.js, gallery.js, messages.js, userSearch.js
```


---

## 🎨 UI/UX 주요 변경사항

### 컬러 시스템 (v10.7.8)
- **라이트모드:**
  - Primary: #2c2c2c (다크 그레이)
  - Primary Hover: #1a1a1a (블랙)
  - 배경: #f0f0f0 (그레이), 카드 #ffffff (화이트)
  - 테두리: #e0e0e0 (연한 그레이)
  - 텍스트: #1a1a1a (블랙), 보조 #666666
- **다크모드:**
  - Primary: #e0e0e0 (라이트 그레이)
  - Primary Hover: #f5f5f5 (화이트)
  - 배경: #0f0f0f (블랙), 카드 #1a1a1a (다크 그레이)
  - 테두리: #2c2c2c (그레이)
  - 텍스트: #e0e0e0 (라이트 그레이), 보조 #a0a0a0
- **전환:** 로고 클릭 시 다크모드 전환, 로컬스토리지 저장

### 사이드바 (v10.7.11)
- **너비:** 고정 70px (항상 collapsed 상태)
- **로고:** 상단 고정, 사이드바 호버 시 '화면 모드' 툴팁 표시
- **탭:** 중앙 배치, 아이콘만 표시(50px), 사이드바 호버 시 우측 툴팁(배경 없음, left: 70px)
- **헤드셋:** 하단 고정, 사이드바 호버 시 음량조절 툴팁 표시
- **호버 영역:** 사이드바 전체 영역
- **툴팁:** 사이드바 호버 시 모든 탭 이름 + 로고 툴팁 + 헤드셋 음량조절 동시 표시

### 웰컴 모달
- **표시 조건:** 비로그인 사용자에게만 표시

### 검색 UI (v10.7.9)
- **작품관/자유게시판:** 검색 토글 버튼 (돋보기 아이콘)
- **토글 버튼:** 중앙 정렬, 56px 원형, 클릭 시 검색 패널 표시/숨김
- **검색 패널:** 검색창, 정렬 버튼, 태그 버튼 포함
- **함수:** `toggleGallerySearchPanel()`, `toggleFeedSearchPanel()`

---

**이 문서를 항상 최신 상태로 유지하세요!**
