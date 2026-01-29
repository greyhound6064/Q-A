# 📋 파일별 상세 맵 (실시간 업데이트)

> **⚠️ 중요:** 파일 수정 시 이 문서를 **즉시 업데이트**하세요.

**마지막 업데이트:** 2026-01-23

---

## ⚙️ 설정 파일

### supabase-config.js (~30줄)
```
역할: Supabase 클라이언트 초기화 및 전역 설정
위치: 루트
의존성: Supabase CDN

주요 내용:
├── SUPABASE_URL                   Supabase 프로젝트 URL
├── SUPABASE_ANON_KEY              공개 API 키
├── window._supabase               전역 Supabase 클라이언트
└── 에러 처리                       초기화 실패 시 alert

설정:
- persistSession: true             세션 지속
- autoRefreshToken: true           자동 토큰 갱신
- detectSessionInUrl: true         URL에서 세션 감지
- flowType: 'pkce'                 PKCE 플로우

마지막 수정: 2026-01-23
수정 내용: 루트 디렉토리로 이동, window._supabase로 전역 노출
```

---

## 📄 HTML 파일

### index.html (468줄)
```
역할: 메인 HTML 구조
위치: 루트
의존성: 모든 CSS, JS 모듈

주요 섹션:
├── <head>                          메타데이터, CSS 로드
├── <body>
│   ├── .main-layout                전체 레이아웃
│   │   ├── .sidebar                사이드바 (탭, 인증)
│   │   └── .content-area           콘텐츠 영역
│   │       ├── #feed-tab-content   피드 탭
│   │       ├── #community-tab-content  커뮤니티 탭
│   │       └── #profile-tab-content    프로필 탭
│   │
│   ├── 모달들
│   │   ├── #profile-edit-modal     프로필 편집
│   │   ├── #upload-modal           작품 업로드
│   │   ├── #artwork-detail-modal   작품 상세보기
│   │   └── #edit-artwork-modal     작품 수정
│   │
│   └── <script>                    JS 로드

마지막 수정: 2026-01-23
수정 내용: CSS/JS 모듈 로드 방식으로 변경
```

---

## 🎨 CSS 파일 (6개)

### css/base.css (~100줄)
```
역할: CSS 변수, 리셋 스타일, 기본 타이포그래피
의존성: 없음 (최우선 로드)

주요 내용:
├── * { }                           리셋 스타일
├── :root { }                       CSS 변수 정의
│   ├── --primary                   메인 색상
│   ├── --bg                        배경 색상
│   ├── --text                      텍스트 색상
│   └── --shadow                    그림자
├── body { }                        기본 body 스타일
└── h1, hr { }                      기본 요소 스타일

마지막 수정: 2026-01-23
수정 내용: 초기 생성
```

### css/layout.css (~200줄)
```
역할: 레이아웃, 그리드, 사이드바, 탭
의존성: base.css (CSS 변수 사용)

주요 클래스:
├── .main-layout                    전체 레이아웃
├── .sidebar                        사이드바
├── .tabs, .tab-button              탭 네비게이션
├── .content-area                   콘텐츠 영역
└── @media (max-width: 768px)       반응형

마지막 수정: 2026-01-23
수정 내용: 초기 생성
```

### css/components.css (~300줄)
```
역할: 공통 컴포넌트 (모달, 버튼, 폼, 카드)
의존성: base.css

주요 클래스:
├── .modal                          모달 공통
├── .modal-btn                      버튼
├── .edit-form-group                폼 그룹
├── .empty-state                    빈 상태
├── .post-card                      게시물 카드
└── .comment-section                댓글 섹션

마지막 수정: 2026-01-23
수정 내용: 초기 생성
```

### css/profile.css (~400줄)
```
역할: 프로필 페이지 스타일 (인스타그램 스타일)
의존성: base.css, components.css

주요 클래스:
├── .profile-container              프로필 컨테이너
├── .profile-header                 프로필 헤더
├── .profile-avatar                 아바타
├── .profile-stats                  통계
├── .profile-tabs                   프로필 탭
└── .edit-avatar-section            아바타 편집

마지막 수정: 2026-01-23
수정 내용: 초기 생성
```

### css/artwork.css (~400줄)
```
역할: 작품 그리드, 상세보기 모달
의존성: base.css, components.css

주요 클래스:
├── .artworks-grid                  3열 그리드
├── .artwork-grid-item              그리드 아이템
├── .artwork-modal                  상세보기 모달
├── .artwork-carousel               캐러셀
├── .artwork-actions                액션 버튼
└── .artwork-manage-section         수정/삭제 버튼

마지막 수정: 2026-01-23
수정 내용: 초기 생성
```

### css/upload.css (~300줄)
```
역할: 작품 업로드 및 수정 모달
의존성: base.css, components.css

주요 클래스:
├── .upload-modal-content           업로드 모달
├── .upload-image-section           이미지 영역
├── .upload-image-preview           이미지 미리보기
├── .carousel-nav                   캐러셀 네비게이션
├── .carousel-indicators            인디케이터
└── .floating-upload-btn            플로팅 버튼

마지막 수정: 2026-01-23
수정 내용: 초기 생성
```

---

## 💻 JavaScript 파일 (10개)

### js/utils.js (~50줄)
```
역할: 유틸리티 함수
의존성: 없음
export: escapeHtml, formatDate

함수 목록:
├── escapeHtml(str)                 HTML 이스케이프
│   입력: string
│   출력: string
│   용도: XSS 방지
│
└── formatDate(dateString)          날짜 포맷팅
    입력: ISO 날짜 문자열
    출력: "방금 전", "5분 전" 등
    용도: 사용자 친화적 날짜 표시

마지막 수정: 2026-01-23
수정 내용: 초기 생성
```

### js/auth.js (~180줄)
```
역할: 인증 관리
의존성: Supabase Auth API
export: signInWithGoogle, signOut, handleProfileLogout, updateAuthUI, initAuth

함수 목록:
├── signInWithGoogle()              구글 로그인
│   비동기: ✅
│   Supabase: auth.signInWithOAuth()
│   리다이렉트: OAuth URL
│
├── signOut()                       로그아웃
│   비동기: ✅
│   Supabase: auth.signOut()
│   리로드: window.location.reload()
│
├── handleProfileLogout()           프로필 탭 로그아웃
│   비동기: ✅
│   확인: confirm()
│   Supabase: auth.signOut()
│
├── updateAuthUI(session)           UI 업데이트
│   입력: session 객체
│   업데이트: 로그인 버튼, 사용자 정보
│
└── initAuth()                      인증 초기화
    호출: DOMContentLoaded
    설정: onAuthStateChange

마지막 수정: 2026-01-23
수정 내용: 초기 생성
```

### js/profile.js (~200줄)
```
역할: 프로필 관리
의존성: Supabase DB (profiles), Supabase Storage (avatars)
export: updateProfileInfo, updateProfileStats, updateProfileAvatar,
        openProfileEditModal, closeProfileEditModal, handleAvatarChange,
        removeAvatar, saveProfileChanges

전역 변수:
├── selectedAvatarFile              선택된 아바타 파일
└── currentAvatarUrl                현재 아바타 URL

함수 목록:
├── updateProfileInfo()             프로필 정보 업데이트
│   비동기: ✅
│   Supabase: profiles 테이블 조회
│   업데이트: 닉네임, 소개, 아바타
│
├── updateProfileStats()            통계 업데이트
│   비동기: ✅
│   Supabase: artworks 테이블 count
│   업데이트: 게시물 수, 저장된 게시물 수
│
├── updateProfileAvatar(url)        아바타 업데이트
│   입력: 이미지 URL
│   업데이트: DOM 요소
│
├── openProfileEditModal()          편집 모달 열기
│   호출: loadCurrentProfileData()
│   표시: 모달
│
├── closeProfileEditModal()         편집 모달 닫기
│   초기화: selectedAvatarFile
│   숨김: 모달
│
├── handleAvatarChange(event)       아바타 파일 선택
│   입력: file input event
│   검증: 이미지 타입, 5MB 제한
│   미리보기: FileReader
│
├── removeAvatar()                  아바타 삭제
│   비동기: ✅
│   확인: confirm()
│   Supabase: storage.remove()
│
└── saveProfileChanges()            변경사항 저장
    비동기: ✅
    업로드: 아바타 (있으면)
    Supabase: profiles.upsert()
    업데이트: auth.updateUser()

마지막 수정: 2026-01-23
수정 내용: 초기 생성
```

### js/carousel.js (~100줄)
```
역할: 캐러셀 공통 로직
의존성: 없음
export: CarouselManager (클래스)

클래스: CarouselManager
├── constructor(images)             생성자
│   입력: 이미지 배열
│   초기화: currentIndex = 0
│
├── prev()                          이전 이미지
│   순환: ✅
│   반환: 현재 이미지
│
├── next()                          다음 이미지
│   순환: ✅
│   반환: 현재 이미지
│
├── goTo(index)                     특정 이미지로 이동
│   입력: index
│   반환: 현재 이미지
│
├── getCurrentImage()               현재 이미지 가져오기
│   반환: 이미지 URL/File
│
├── getImages()                     모든 이미지 가져오기
│   반환: 이미지 배열
│
├── getCurrentIndex()               현재 인덱스 가져오기
│   반환: number
│
└── getLength()                     이미지 개수 가져오기
    반환: number

마지막 수정: 2026-01-23
수정 내용: 초기 생성
```

### js/tabs.js (~100줄)
```
역할: 탭 전환 기능
의존성: profile.js (updateProfileInfo), artwork.js (renderArtworksGrid)
export: initTabs, initProfileTabs

함수 목록:
├── initTabs()                      메인 탭 초기화
│   이벤트: click on .tab-button
│   전환: 피드, 커뮤니티, 프로필
│   호출: initProfileTabs()
│
└── initProfileTabs()               프로필 내부 탭 초기화
    이벤트: click on .profile-tab
    전환: 내 게시물, 저장된 게시물
    호출: renderArtworksGrid() (내 게시물 탭)

마지막 수정: 2026-01-23
수정 내용: 초기 생성
```

### js/artwork.js (~350줄)
```
역할: 작품 조회 및 삭제
의존성: utils.js, profile.js, Supabase DB (artworks)
export: renderArtworksGrid, openArtworkDetail, closeArtworkDetail,
        prevArtworkImage, nextArtworkImage, goToArtworkImage,
        deleteArtwork, getCurrentArtworkData

전역 변수:
├── currentArtworkId                현재 작품 ID
├── currentArtworkImages            현재 작품 이미지 배열
├── currentArtworkImageIndex        현재 이미지 인덱스
└── currentArtworkData              현재 작품 데이터

함수 목록:
├── renderArtworksGrid()            작품 그리드 렌더링
│   비동기: ✅
│   Supabase: artworks 테이블 조회
│   렌더링: 3열 그리드
│   빈 상태: 업로드 안내
│
├── openArtworkDetail(id)           상세보기 열기
│   비동기: ✅
│   입력: 작품 ID
│   Supabase: artworks 조회
│   표시: 모달, 이미지 캐러셀
│   권한: 본인 작품이면 수정/삭제 버튼
│
├── closeArtworkDetail()            상세보기 닫기
│   초기화: 전역 변수
│   숨김: 모달
│
├── prevArtworkImage()              이전 이미지
│   순환: ✅
│   업데이트: 캐러셀
│
├── nextArtworkImage()              다음 이미지
│   순환: ✅
│   업데이트: 캐러셀
│
├── goToArtworkImage(index)         특정 이미지로 이동
│   입력: index
│   업데이트: 캐러셀
│
├── deleteArtwork()                 작품 삭제
│   비동기: ✅
│   확인: confirm()
│   Supabase: storage.remove() (이미지들)
│   Supabase: artworks.delete()
│   새로고침: renderArtworksGrid()
│
└── getCurrentArtworkData()         현재 작품 데이터 가져오기
    반환: currentArtworkData

마지막 수정: 2026-01-23
수정 내용: 초기 생성
```

### js/upload.js (~300줄)
```
역할: 작품 업로드
의존성: profile.js, artwork.js, Supabase Storage (posts)
export: openUploadModal, closeUploadModal, handleUploadImageChange,
        removeCurrentUploadImage, prevUploadImage, nextUploadImage,
        goToUploadImage, uploadPost

전역 변수:
├── selectedUploadImages            선택된 이미지 배열 (File[])
└── currentUploadImageIndex         현재 이미지 인덱스

함수 목록:
├── openUploadModal()               업로드 모달 열기
│   초기화: 입력 필드, 이미지
│   표시: 모달
│
├── closeUploadModal()              업로드 모달 닫기
│   초기화: 전역 변수
│   숨김: 모달
│
├── handleUploadImageChange(event)  이미지 선택
│   입력: file input event
│   검증: 이미지 타입, 10MB 제한, 최대 10장
│   추가: selectedUploadImages
│   미리보기: FileReader
│
├── removeCurrentUploadImage()      현재 이미지 제거
│   확인: confirm()
│   제거: splice()
│   업데이트: 미리보기
│
├── prevUploadImage()               이전 이미지
│   순환: ✅
│   업데이트: 미리보기
│
├── nextUploadImage()               다음 이미지
│   순환: ✅
│   업데이트: 미리보기
│
├── goToUploadImage(index)          특정 이미지로 이동
│   입력: index
│   업데이트: 미리보기
│
└── uploadPost()                    게시물 업로드
    비동기: ✅
    검증: 제목, 이미지
    업로드: 모든 이미지 → Storage
    Supabase: artworks.insert()
    새로고침: renderArtworksGrid()
    닫기: closeUploadModal()

마지막 수정: 2026-01-23
수정 내용: 초기 생성
```

### js/edit.js (~350줄)
```
역할: 작품 수정
의존성: artwork.js (getCurrentArtworkData), Supabase Storage (posts)
export: openEditArtworkModal, closeEditArtworkModal, handleEditImageChange,
        prevEditImage, nextEditImage, goToEditImage,
        removeCurrentEditImage, updateArtwork

전역 변수:
├── editArtworkImages               기존 이미지 URL 배열
├── editNewImages                   새로 추가할 이미지 파일 배열
└── currentEditImageIndex           현재 이미지 인덱스

함수 목록:
├── openEditArtworkModal()          수정 모달 열기
│   가져오기: getCurrentArtworkData()
│   초기화: editArtworkImages, editNewImages
│   설정: 제목, 설명
│   표시: 모달
│   숨김: 상세보기 모달
│
├── closeEditArtworkModal(returnToDetail)  수정 모달 닫기
│   입력: returnToDetail (boolean)
│   초기화: 전역 변수
│   숨김: 모달
│   표시: 상세보기 모달 (returnToDetail = true)
│
├── handleEditImageChange(event)    이미지 변경
│   입력: file input event
│   검증: 이미지 타입, 10MB 제한, 최대 10장
│   추가: editNewImages
│   미리보기: FileReader
│
├── prevEditImage()                 이전 이미지
│   순환: ✅
│   업데이트: 미리보기
│
├── nextEditImage()                 다음 이미지
│   순환: ✅
│   업데이트: 미리보기
│
├── goToEditImage(index)            특정 이미지로 이동
│   입력: index
│   업데이트: 미리보기
│
├── removeCurrentEditImage()        현재 이미지 제거
│   확인: confirm()
│   제거: editArtworkImages 또는 editNewImages
│   최소: 1장 유지
│   업데이트: 미리보기
│
└── updateArtwork()                 작품 수정 저장
    비동기: ✅
    검증: 제목, 최소 1장 이미지
    업로드: editNewImages → Storage
    병합: editArtworkImages + 새 URL
    Supabase: artworks.update()
    새로고침: renderArtworksGrid()
    닫기: closeEditArtworkModal(false)

마지막 수정: 2026-01-23
수정 내용: 초기 생성
```

### js/posts.js (~200줄)
```
역할: 커뮤니티 게시물 및 댓글
의존성: utils.js, profile.js, Supabase DB (posts, comments)
export: addPost, deletePost, addComment, deleteComment,
        renderPosts, togglePostContent

함수 목록:
├── addPost()                       게시물 추가
│   비동기: ✅
│   검증: 제목, 내용
│   Supabase: posts.insert()
│   새로고침: renderPosts()
│
├── deletePost(postId)              게시물 삭제
│   비동기: ✅
│   입력: 게시물 ID
│   확인: confirm()
│   Supabase: posts.delete()
│   새로고침: renderPosts()
│
├── addComment(postId)              댓글 추가
│   비동기: ✅
│   입력: 게시물 ID
│   검증: 내용
│   Supabase: comments.insert()
│   새로고침: renderPosts()
│
├── deleteComment(commentId)        댓글 삭제
│   비동기: ✅
│   입력: 댓글 ID
│   확인: confirm()
│   Supabase: comments.delete()
│   새로고침: renderPosts()
│
├── renderPosts()                   게시물 목록 렌더링
│   비동기: ✅
│   Supabase: posts + comments 조회
│   렌더링: 게시물 카드, 댓글
│   권한: 본인 게시물/댓글만 삭제 버튼
│
└── togglePostContent(contentId)    게시물 내용 토글
    입력: 콘텐츠 ID
    토글: .post-content-hidden 클래스

마지막 수정: 2026-01-23
수정 내용: 초기 생성
```

### js/main.js (~150줄)
```
역할: 앱 초기화 및 전역 함수 등록
의존성: 모든 모듈
export: 없음 (진입점)

주요 기능:
├── 모듈 import                     모든 모듈 가져오기
├── 전역 함수 등록                   window 객체에 등록
│   ├── window.signInWithGoogle
│   ├── window.openUploadModal
│   ├── window.uploadPost
│   └── ... (30개 이상)
│
├── OAuth 유틸리티
│   ├── isOAuthReturn()             OAuth 리다이렉트 감지
│   ├── clearOAuthHash()            URL 해시 정리
│   └── bindLoginButton()           로그인 버튼 바인딩
│
├── DOMContentLoaded                앱 초기화
│   ├── Supabase 확인
│   ├── bindLoginButton()
│   ├── initTabs()
│   ├── updateAuthUI()
│   ├── updateProfileInfo()
│   ├── renderPosts()
│   └── clearOAuthHash()
│
└── onAuthStateChange               인증 상태 변경 감지
    ├── updateAuthUI()
    ├── updateProfileInfo()
    └── renderPosts()

마지막 수정: 2026-01-23
수정 내용: 초기 생성
```

---

## 🗄️ SQL 파일 (3개)

### sql/SETUP_DATABASE.sql
```
역할: 초기 데이터베이스 설정
테이블: profiles
버킷: avatars
정책: RLS 정책 설정

마지막 수정: 2026-01-23
```

### sql/SETUP_ARTWORKS_TABLE.sql
```
역할: 작품 테이블 설정
테이블: artworks
버킷: posts
정책: RLS 정책 설정

마지막 수정: 2026-01-23
```

### sql/FIX_IMAGES_COLUMN.sql
```
역할: images 컬럼 추가 및 마이그레이션
작업: ALTER TABLE, UPDATE, NOTIFY
목적: 다중 이미지 지원

마지막 수정: 2026-01-23
```

---

## 📝 업데이트 로그

### 2026-01-23
```
- 초기 파일 맵 생성
- CSS 6개 파일 분리 완료
- JavaScript 10개 파일 분리 완료
- 모든 파일 상세 정보 작성
```

---

**이 파일을 항상 최신 상태로 유지하세요!**
**새 함수 추가 시 즉시 기록하세요!**
