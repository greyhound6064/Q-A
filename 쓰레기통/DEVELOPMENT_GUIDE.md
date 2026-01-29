# 🛠️ 개발 가이드

## 목차
1. [개발 환경 설정](#개발-환경-설정)
2. [프로젝트 구조 이해](#프로젝트-구조-이해)
3. [자주 하는 작업](#자주-하는-작업)
4. [디버깅 가이드](#디버깅-가이드)
5. [배포 가이드](#배포-가이드)

---

## 개발 환경 설정

### 필수 요구사항
- Python 3.x (로컬 서버용)
- 모던 브라우저 (Chrome, Firefox, Edge 등)
- Supabase 계정
- 코드 에디터 (VS Code, Cursor 권장)

### 로컬 개발 서버 실행

```bash
# 프로젝트 디렉토리로 이동
cd "c:\Users\rksk8\OneDrive\바탕 화면\Q&A"

# Python 서버 실행
python server.py

# 브라우저에서 접속
# http://localhost:8000
```

### Supabase 설정

1. **프로젝트 생성**
   - https://supabase.com 접속
   - 새 프로젝트 생성
   - 프로젝트 URL과 Anon Key 복사

2. **supabase-config.js 수정**
   ```javascript
   const SUPABASE_URL = 'your-project-url';
   const SUPABASE_ANON_KEY = 'your-anon-key';
   ```

3. **데이터베이스 설정**
   - Supabase Dashboard → SQL Editor
   - `sql/SETUP_DATABASE.sql` 실행
   - `sql/SETUP_ARTWORKS_TABLE.sql` 실행
   - `sql/FIX_IMAGES_COLUMN.sql` 실행

4. **Google OAuth 설정**
   - Supabase Dashboard → Authentication → Providers
   - Google 활성화
   - Redirect URL 설정: `http://localhost:8000`

---

## 프로젝트 구조 이해

### 파일 구조 한눈에 보기

```
현재 상태 (통합 파일):
├── index.html          # 모든 HTML
├── style.css           # 모든 CSS (1,658줄)
└── script.js           # 모든 JavaScript (2,112줄)

리팩토링 목표 (모듈화):
├── index.html
├── css/
│   ├── base.css       # 변수, 리셋 (100줄)
│   ├── layout.css     # 레이아웃 (200줄)
│   ├── components.css # 공통 (300줄)
│   ├── profile.css    # 프로필 (400줄)
│   ├── artwork.css    # 작품 (400줄)
│   └── upload.css     # 업로드 (300줄)
└── js/
    ├── main.js        # 초기화 (200줄)
    ├── auth.js        # 인증 (300줄) ✅
    ├── profile.js     # 프로필 (400줄) ✅
    ├── artwork.js     # 작품 (400줄)
    ├── upload.js      # 업로드 (400줄)
    ├── edit.js        # 수정 (400줄)
    ├── carousel.js    # 캐러셀 (200줄) ✅
    ├── tabs.js        # 탭 (200줄)
    ├── posts.js       # 게시물 (200줄)
    └── utils.js       # 유틸 (200줄) ✅
```

### 주요 파일 역할

| 파일 | 역할 | 상태 |
|-----|------|------|
| `js/auth.js` | 로그인, 로그아웃 | ✅ 완료 |
| `js/profile.js` | 프로필 조회/수정 | ✅ 완료 |
| `js/carousel.js` | 캐러셀 공통 로직 | ✅ 완료 |
| `js/utils.js` | 유틸리티 함수 | ✅ 완료 |
| `js/artwork.js` | 작품 조회/삭제 | 🚧 진행 중 |
| `js/upload.js` | 작품 업로드 | 🚧 진행 중 |
| `js/edit.js` | 작품 수정 | 🚧 진행 중 |

---

## 자주 하는 작업

### 1. 새 기능 추가하기

#### 예시: 좋아요 기능 추가

**1단계: 계획**
```
- 어디에 추가? → artwork.js
- UI는? → 작품 상세보기 모달
- 데이터는? → artworks 테이블에 likes 컬럼 추가
```

**2단계: 데이터베이스 수정**
```sql
-- likes 컬럼 추가
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;

-- likes_users 테이블 생성 (누가 좋아요 눌렀는지)
CREATE TABLE IF NOT EXISTS likes_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(artwork_id, user_id)
);
```

**3단계: JavaScript 함수 추가**
```javascript
// js/artwork.js (또는 script.js)

async function toggleLike(artworkId) {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        
        if (!session) {
            alert('로그인이 필요합니다.');
            return;
        }
        
        // 좋아요 상태 확인
        const { data: existingLike } = await _supabase
            .from('likes_users')
            .select('*')
            .eq('artwork_id', artworkId)
            .eq('user_id', session.user.id)
            .single();
        
        if (existingLike) {
            // 좋아요 취소
            await _supabase
                .from('likes_users')
                .delete()
                .eq('artwork_id', artworkId)
                .eq('user_id', session.user.id);
            
            // likes 카운트 감소
            await _supabase.rpc('decrement_likes', { artwork_id: artworkId });
        } else {
            // 좋아요 추가
            await _supabase
                .from('likes_users')
                .insert({ artwork_id: artworkId, user_id: session.user.id });
            
            // likes 카운트 증가
            await _supabase.rpc('increment_likes', { artwork_id: artworkId });
        }
        
        // UI 업데이트
        await updateLikeButton(artworkId);
        
    } catch (err) {
        console.error('좋아요 처리 에러:', err);
        alert('좋아요 처리 중 오류가 발생했습니다.');
    }
}

// window에 등록 (HTML onclick에서 사용)
window.toggleLike = toggleLike;
```

**4단계: HTML 수정**
```html
<!-- index.html -->
<button class="artwork-action-btn like-btn" onclick="toggleLike(currentArtworkId)">
    <svg>...</svg>
    <span id="like-count">0</span>
</button>
```

**5단계: CSS 추가**
```css
/* style.css */
.artwork-action-btn.liked {
    color: #ef4444;
    border-color: #ef4444;
}

.artwork-action-btn.liked svg {
    fill: #ef4444;
}
```

### 2. 버그 수정하기

#### 예시: 이미지 업로드 실패 문제

**1단계: 문제 파악**
```javascript
// 콘솔 로그 확인
console.log('업로드 시작:', file);
console.log('파일 크기:', file.size);
console.log('파일 타입:', file.type);
```

**2단계: 원인 찾기**
```javascript
// 파일 크기 제한 확인
if (file.size > 10 * 1024 * 1024) {
    console.error('파일이 너무 큽니다:', file.size);
    alert('파일 크기는 10MB 이하여야 합니다.');
    return;
}
```

**3단계: 수정**
```javascript
// 에러 처리 개선
try {
    const { data, error } = await _supabase.storage
        .from('posts')
        .upload(fileName, file);
    
    if (error) {
        console.error('Storage 업로드 에러:', error);
        throw new Error(`업로드 실패: ${error.message}`);
    }
    
    console.log('업로드 성공:', data);
} catch (err) {
    console.error('업로드 예외:', err);
    alert('이미지 업로드 중 오류가 발생했습니다: ' + err.message);
}
```

### 3. 스타일 수정하기

#### 예시: 버튼 색상 변경

**1단계: CSS 변수 확인**
```css
/* style.css 상단 */
:root {
    --primary: #2563eb;      /* 기본 파란색 */
    --primary-hover: #1d4ed8;
}
```

**2단계: 변수 수정**
```css
:root {
    --primary: #8b5cf6;      /* 보라색으로 변경 */
    --primary-hover: #7c3aed;
}
```

**3단계: 특정 요소만 수정**
```css
/* 특정 버튼만 색상 변경 */
.profile-edit-btn {
    background: #10b981;  /* 초록색 */
}

.profile-edit-btn:hover {
    background: #059669;
}
```

---

## 디버깅 가이드

### 콘솔 로그 활용

```javascript
// 함수 시작
console.log('=== functionName 시작 ===');

// 변수 확인
console.log('변수명:', variable);
console.log('객체:', JSON.stringify(object, null, 2));

// 조건문 확인
if (condition) {
    console.log('조건 true');
} else {
    console.log('조건 false');
}

// API 호출 전후
console.log('API 호출 전:', params);
const result = await apiCall(params);
console.log('API 호출 후:', result);

// 함수 종료
console.log('=== functionName 종료 ===');
```

### 자주 발생하는 에러

#### 1. `_supabase is not defined`
```javascript
// 원인: supabase-config.js가 로드되지 않음
// 해결: index.html에서 script 순서 확인
<script src="supabase-config.js"></script>  <!-- 먼저 -->
<script src="script.js"></script>            <!-- 나중에 -->
```

#### 2. `Cannot read property of undefined`
```javascript
// 원인: 객체가 null 또는 undefined
// 해결: Optional chaining 사용
const nickname = profile?.nickname || '기본값';
```

#### 3. `CORS error`
```javascript
// 원인: 로컬 파일로 직접 열기 (file://)
// 해결: 반드시 HTTP 서버로 실행
python server.py  // http://localhost:8000
```

#### 4. `Schema cache` 에러
```sql
-- 원인: 데이터베이스 변경사항이 반영되지 않음
-- 해결: 스키마 캐시 강제 갱신
NOTIFY pgrst, 'reload schema';
```

### 브라우저 개발자 도구

```
F12 또는 Ctrl+Shift+I

주요 탭:
- Console: 로그 확인, 에러 확인
- Network: API 호출 확인
- Application: 로컬 스토리지, 쿠키 확인
- Sources: 브레이크포인트 설정
```

---

## 배포 가이드

### Vercel 배포 (권장)

1. **GitHub에 코드 푸시**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Vercel 설정**
   - https://vercel.com 접속
   - GitHub 저장소 연결
   - 프로젝트 import
   - 배포 완료!

3. **Supabase 설정 업데이트**
   - Supabase Dashboard → Authentication → URL Configuration
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**`

### Netlify 배포

1. **netlify.toml 생성**
   ```toml
   [build]
     publish = "."
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Netlify에 배포**
   - https://netlify.com 접속
   - 드래그 앤 드롭으로 배포
   - 또는 GitHub 연결

### 환경 변수 설정

```javascript
// 개발 환경
const SUPABASE_URL = 'http://localhost:54321';

// 프로덕션 환경
const SUPABASE_URL = process.env.SUPABASE_URL || 'your-production-url';
```

---

## 팁과 트릭

### 1. 빠른 개발을 위한 단축키

```
VS Code / Cursor:
- Ctrl + P: 파일 빠르게 열기
- Ctrl + Shift + F: 전체 검색
- Ctrl + /: 주석 토글
- Alt + Up/Down: 줄 이동
- Ctrl + D: 같은 단어 선택
```

### 2. Git 커밋 메시지 규칙

```
feat: 새 기능 추가
fix: 버그 수정
style: 스타일 변경
refactor: 리팩토링
docs: 문서 수정
test: 테스트 추가

예시:
feat: 좋아요 기능 추가
fix: 이미지 업로드 오류 수정
style: 버튼 색상 변경
```

### 3. 코드 리뷰 체크리스트

- [ ] 콘솔 에러 없음
- [ ] 모든 기능 정상 동작
- [ ] 반응형 디자인 확인
- [ ] 에러 처리 추가
- [ ] 로딩 상태 관리
- [ ] 주석 추가
- [ ] 불필요한 콘솔 로그 제거

---

## 참고 자료

### 공식 문서
- [Supabase 문서](https://supabase.com/docs)
- [MDN Web Docs](https://developer.mozilla.org/ko/)
- [JavaScript ES6](https://es6.io/)

### 프로젝트 문서
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - 프로젝트 구조
- [.cursorrules](.cursorrules) - Cursor AI 규칙
- [README.md](README.md) - 프로젝트 개요

---

**Happy Coding! 🚀**
