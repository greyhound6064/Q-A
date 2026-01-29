# 📁 프로젝트 구조

## 프로젝트 개요
바이브 코딩 결과물을 공유하는 소셜 미디어 웹 애플리케이션

**기술 스택:**
- Frontend: Vanilla JavaScript (ES6 모듈), HTML5, CSS3
- Backend: Supabase (인증, 데이터베이스, 스토리지)
- 데이터베이스: PostgreSQL (Supabase)

---

## 📂 디렉토리 구조

```
Q&A/
├── index.html                  # 메인 HTML 파일
├── supabase-config.js          # Supabase 설정
├── server.py                   # 로컬 개발 서버
│
├── css/                        # 스타일시트 (분리 권장)
│   ├── base.css               # CSS 변수, 리셋 스타일
│   ├── layout.css             # 레이아웃, 그리드
│   ├── components.css         # 공통 컴포넌트 (버튼, 모달, 폼)
│   ├── profile.css            # 프로필 페이지
│   ├── artwork.css            # 작품 그리드, 상세보기
│   └── upload.css             # 업로드/수정 모달
│
├── js/                         # JavaScript 모듈
│   ├── main.js                # 앱 초기화, 라우팅
│   ├── auth.js                # 인증 (로그인, 로그아웃) ✅
│   ├── profile.js             # 프로필 조회/수정 ✅
│   ├── artwork.js             # 작품 CRUD
│   ├── upload.js              # 작품 업로드
│   ├── edit.js                # 작품 수정
│   ├── carousel.js            # 캐러셀 공통 로직 ✅
│   ├── tabs.js                # 탭 전환 로직
│   ├── posts.js               # 커뮤니티 게시물 (레거시)
│   └── utils.js               # 유틸리티 함수 ✅
│
└── sql/                        # 데이터베이스 스크립트
    ├── SETUP_DATABASE.sql
    ├── SETUP_ARTWORKS_TABLE.sql
    └── FIX_IMAGES_COLUMN.sql
```

---

## 🎯 주요 기능별 파일 위치

| 기능 | HTML | CSS | JavaScript |
|-----|------|-----|------------|
| **로그인/회원가입** | `index.html` (auth-section) | `style.css` (layout) | `js/auth.js` ✅ |
| **프로필 보기/수정** | `index.html` (profile-section) | `style.css` (profile) | `js/profile.js` ✅ |
| **작품 그리드** | `index.html` (artworks-grid) | `style.css` (artwork) | `js/artwork.js` |
| **작품 상세보기** | `index.html` (artwork-detail-modal) | `style.css` (artwork) | `js/artwork.js` |
| **작품 업로드** | `index.html` (upload-modal) | `style.css` (upload) | `js/upload.js` |
| **작품 수정** | `index.html` (edit-artwork-modal) | `style.css` (upload) | `js/edit.js` |
| **탭 전환** | `index.html` (tabs) | `style.css` (layout) | `js/tabs.js` |
| **커뮤니티** | `index.html` (community-tab) | `style.css` (post-card) | `js/posts.js` |

---

## 📝 주요 함수 위치

### 🔐 인증 (auth.js) ✅
```javascript
- signInWithGoogle()        // 구글 로그인
- signOut()                 // 로그아웃
- handleProfileLogout()     // 프로필 탭 로그아웃
- updateAuthUI(session)     // 인증 UI 업데이트
- initAuth()                // 인증 초기화
```

### 👤 프로필 (profile.js) ✅
```javascript
- updateProfileInfo()           // 프로필 정보 표시
- updateProfileStats()          // 통계 업데이트
- openProfileEditModal()        // 프로필 편집 모달 열기
- closeProfileEditModal()       // 프로필 편집 모달 닫기
- handleAvatarChange(event)     // 아바타 파일 선택
- removeAvatar()                // 아바타 삭제
- saveProfileChanges()          // 프로필 저장
- updateProfileAvatar(url)      // 아바타 UI 업데이트
```

### 🎨 작품 (artwork.js)
```javascript
- renderArtworksGrid()          // 작품 그리드 렌더링
- openArtworkDetail(id)         // 상세보기 열기
- closeArtworkDetail()          // 상세보기 닫기
- updateArtworkImage()          // 이미지 캐러셀 업데이트
- prevArtworkImage()            // 이전 이미지
- nextArtworkImage()            // 다음 이미지
- goToArtworkImage(index)       // 특정 이미지로 이동
- deleteArtwork()               // 작품 삭제
```

### 📤 업로드 (upload.js)
```javascript
- openUploadModal()             // 업로드 모달 열기
- closeUploadModal()            // 업로드 모달 닫기
- handleUploadImageChange(e)    // 이미지 선택 (다중)
- updateUploadImagePreview()    // 미리보기 업데이트
- prevUploadImage()             // 이전 이미지
- nextUploadImage()             // 다음 이미지
- goToUploadImage(index)        // 특정 이미지로 이동
- removeCurrentUploadImage()    // 현재 이미지 제거
- uploadPost()                  // 작품 업로드
```

### ✏️ 수정 (edit.js)
```javascript
- openEditArtworkModal()        // 수정 모달 열기
- closeEditArtworkModal()       // 수정 모달 닫기
- handleEditImageChange(e)      // 이미지 선택
- updateEditImagePreview()      // 미리보기 업데이트
- prevEditImage()               // 이전 이미지
- nextEditImage()               // 다음 이미지
- goToEditImage(index)          // 특정 이미지로 이동
- removeCurrentEditImage()      // 현재 이미지 제거
- updateArtwork()               // 작품 수정 저장
```

### 🎠 캐러셀 (carousel.js) ✅
```javascript
class CarouselManager {
    - prev()                    // 이전 이미지
    - next()                    // 다음 이미지
    - goTo(index)               // 특정 이미지로 이동
    - getCurrentImage()         // 현재 이미지 가져오기
    - getImages()               // 모든 이미지 가져오기
    - getCurrentIndex()         // 현재 인덱스
    - getLength()               // 이미지 개수
}
```

### 🛠️ 유틸리티 (utils.js) ✅
```javascript
- escapeHtml(str)               // HTML 이스케이프
- formatDate(dateString)        // 날짜 포맷팅
```

### 📑 탭 (tabs.js)
```javascript
- initTabs()                    // 메인 탭 초기화
- initProfileTabs()             // 프로필 탭 초기화
```

### 📰 게시물 (posts.js - 레거시)
```javascript
- addPost()                     // 게시물 추가
- deletePost(id)                // 게시물 삭제
- renderPosts()                 // 게시물 목록 렌더링
- addComment(postId)            // 댓글 추가
- deleteComment(id)             // 댓글 삭제
- togglePostContent(id)         // 게시물 내용 토글
```

---

## 🗄️ 데이터베이스 스키마

### profiles 테이블
```sql
- id: uuid (PK)
- user_id: uuid (FK → auth.users)
- nickname: text
- bio: text
- avatar_url: text
- created_at: timestamp
- updated_at: timestamp
```

### artworks 테이블
```sql
- id: uuid (PK)
- user_id: uuid (FK → auth.users)
- title: text
- description: text
- image_url: text (첫 번째 이미지, 호환성)
- images: text[] (다중 이미지 배열)
- author_nickname: text
- author_email: text
- created_at: timestamp
- updated_at: timestamp
```

### posts 테이블 (레거시)
```sql
- id: uuid (PK)
- user_id: uuid
- title: text
- content: text
- author_email: text
- author_nickname: text
- created_at: timestamp
```

### comments 테이블 (레거시)
```sql
- id: uuid (PK)
- post_id: uuid (FK → posts)
- user_id: uuid
- content: text
- author_email: text
- author_nickname: text
- created_at: timestamp
```

---

## 🎨 CSS 구조 (권장 분리)

### base.css (100줄)
- CSS 변수 (`:root`)
- 리셋 스타일 (`*`)
- 기본 타이포그래피 (`body`, `h1-h6`)

### layout.css (200줄)
- `.main-layout` - 전체 레이아웃
- `.sidebar` - 사이드바
- `.content-area` - 콘텐츠 영역
- `.tabs`, `.tab-button` - 탭 네비게이션
- 반응형 미디어 쿼리

### components.css (300줄)
- `.modal`, `.modal-content` - 모달 공통
- `.btn`, `.modal-btn` - 버튼 스타일
- `.form-hint`, `.edit-form-group` - 폼 요소
- `.empty-state` - 빈 상태 UI

### profile.css (400줄)
- `.profile-container` - 프로필 컨테이너
- `.profile-header` - 프로필 헤더
- `.profile-avatar` - 아바타
- `.profile-stats` - 통계
- `.profile-tabs` - 프로필 탭
- `.profile-edit-btn` - 편집 버튼

### artwork.css (400줄)
- `.artworks-grid` - 3열 그리드
- `.artwork-grid-item` - 그리드 아이템
- `.artwork-modal` - 상세보기 모달
- `.artwork-carousel` - 이미지 캐러셀
- `.artwork-actions` - 액션 버튼

### upload.css (300줄)
- `.upload-modal-content` - 업로드 모달
- `.upload-image-section` - 이미지 영역
- `.upload-image-preview` - 이미지 미리보기
- `.carousel-nav` - 캐러셀 네비게이션
- `.carousel-indicators` - 인디케이터

---

## 🔗 파일 간 의존성

### JavaScript 모듈 의존성
```
main.js
  ├─> auth.js (initAuth)
  ├─> profile.js (updateProfileInfo)
  ├─> tabs.js (initTabs)
  ├─> artwork.js (renderArtworksGrid)
  └─> posts.js (renderPosts)

auth.js
  └─> (supabase-config.js)

profile.js
  ├─> (supabase-config.js)
  └─> utils.js (formatDate)

artwork.js
  ├─> (supabase-config.js)
  ├─> carousel.js (CarouselManager)
  └─> utils.js (escapeHtml, formatDate)

upload.js
  ├─> (supabase-config.js)
  ├─> carousel.js (CarouselManager)
  └─> profile.js (updateProfileInfo)

edit.js
  ├─> (supabase-config.js)
  ├─> carousel.js (CarouselManager)
  └─> artwork.js (renderArtworksGrid)
```

### CSS 로드 순서
```
1. base.css        (변수 정의)
2. layout.css      (레이아웃)
3. components.css  (공통 컴포넌트)
4. profile.css     (프로필)
5. artwork.css     (작품)
6. upload.css      (업로드/수정)
```

---

## 🚀 개발 가이드

### 로컬 개발 환경 설정
```bash
# Python 서버 실행
python server.py

# 브라우저에서 접속
http://localhost:8000
```

### 새 기능 추가 프로세스
1. **기능 설계** - 어떤 기능을 추가할지 명확히 정의
2. **파일 확인** - `PROJECT_STRUCTURE.md` 참조하여 관련 파일 확인
3. **코드 작성** - 해당 JS 파일에 함수 추가
4. **스타일 추가** - 해당 CSS 파일에 스타일 추가
5. **HTML 수정** - `index.html`에 필요한 HTML 추가
6. **테스트** - 브라우저에서 기능 테스트
7. **커밋** - Git에 변경사항 커밋

### 자주 하는 작업

#### 새 모달 추가
1. `index.html`에 모달 HTML 추가
2. 해당 CSS 파일에 스타일 추가
3. 해당 JS 파일에 `open/close` 함수 추가
4. `window` 객체에 함수 등록

#### 새 API 호출 추가
1. 해당 JS 파일에 `async` 함수 작성
2. `try-catch`로 에러 처리
3. 로딩 상태 관리 (버튼 비활성화 등)
4. 성공/실패 메시지 표시

---

## 📋 코딩 규칙

### 함수 명명 규칙
- 모달 열기: `open{Name}Modal()`
- 모달 닫기: `close{Name}Modal()`
- 데이터 렌더링: `render{Name}()`
- 데이터 저장: `save{Name}()` 또는 `update{Name}()`
- 이벤트 핸들러: `handle{Action}()`

### 전역 함수 등록
```javascript
// 각 모듈에서 필요한 함수만 window에 등록
window.functionName = functionName;
```

### Supabase 사용
```javascript
// 항상 _supabase 변수 사용
const { data, error } = await _supabase
    .from('table_name')
    .select('*');
```

### 에러 처리
```javascript
try {
    // 작업 수행
    console.log('작업 시작:', details);
    // ...
    console.log('작업 완료:', result);
} catch (err) {
    console.error('에러 발생:', err);
    alert('사용자 친화적 메시지');
}
```

---

## 🎯 현재 상태

### ✅ 완료된 기능
- [x] 구글 로그인/로그아웃
- [x] 프로필 조회/수정 (닉네임, 소개, 아바타)
- [x] 작품 업로드 (다중 이미지, 제목, 설명)
- [x] 작품 그리드 (3열 레이아웃, 반응형)
- [x] 작품 상세보기 (이미지 캐러셀)
- [x] 작품 수정 (이미지, 제목, 설명)
- [x] 작품 삭제
- [x] 커뮤니티 게시판 (레거시)

### 🚧 개발 중
- [ ] 파일 모듈화 (진행 중)
  - [x] `js/utils.js`
  - [x] `js/auth.js`
  - [x] `js/profile.js`
  - [x] `js/carousel.js`
  - [ ] `js/artwork.js`
  - [ ] `js/upload.js`
  - [ ] `js/edit.js`
  - [ ] `js/tabs.js`
  - [ ] `js/posts.js`
  - [ ] `js/main.js`

### 📝 향후 계획
- [ ] CSS 파일 분리
- [ ] 좋아요 기능
- [ ] 저장 기능
- [ ] 댓글 기능 (작품)
- [ ] 검색 기능
- [ ] 팔로우 기능

---

## 🐛 알려진 이슈

### 해결됨
- ✅ `bio` 컬럼 누락 → `SETUP_DATABASE.sql` 실행
- ✅ `images` 컬럼 누락 → `FIX_IMAGES_COLUMN.sql` 실행
- ✅ 이미지 추가 시 기존 이미지 사라짐 → 배열 병합 수정
- ✅ 수정 모달이 상세보기 뒤에 표시 → z-index 조정

---

## 📞 문의 및 지원

프로젝트 관련 문의사항이나 버그 리포트는 이슈로 등록해주세요.

---

**마지막 업데이트:** 2026-01-23
**버전:** 1.0.0 (리팩토링 진행 중)
