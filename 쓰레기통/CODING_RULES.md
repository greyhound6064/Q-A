# 📐 코딩 규칙 (Coding Rules)

> **⚠️ 필수:** 모든 코드 작성 시 이 규칙을 따라야 합니다.

**마지막 업데이트:** 2026-01-23

---

## 🎯 핵심 원칙

### 1. **파일 수정 전 반드시 확인**
```
✅ ARCHITECTURE.md 확인
✅ FILE_MAP.md에서 함수 위치 확인
✅ 의존성 확인
✅ 수정 후 문서 업데이트
```

### 2. **한 파일 = 한 책임**
```
✅ 각 파일은 명확한 단일 책임
❌ 여러 기능을 한 파일에 섞지 않기
```

### 3. **모듈화 우선**
```
✅ 재사용 가능한 함수는 별도 모듈로
✅ export/import 명확하게
❌ 전역 변수 남발 금지
```

---

## 📁 파일 구조 규칙

### JavaScript 파일 구조
```javascript
/**
 * @file filename.js
 * @description 파일 설명
 */

// ========== import ==========
import { func1, func2 } from './module.js';

// ========== 전역 변수 (최소화) ==========
let globalVar = null;

// ========== 내부 함수 (export 안 함) ==========
function internalFunction() {
    // ...
}

// ========== export 함수 ==========
export function publicFunction() {
    // ...
}

// ========== 클래스 (필요시) ==========
export class ClassName {
    constructor() {
        // ...
    }
}
```

### CSS 파일 구조
```css
/**
 * @file filename.css
 * @description 파일 설명
 */

/* ========== 섹션 제목 ========== */
.class-name {
    /* 속성들 */
}

/* ========== 반응형 (파일 끝에) ========== */
@media (max-width: 768px) {
    /* 모바일 스타일 */
}
```

---

## 🔤 네이밍 규칙

### JavaScript
```javascript
// ✅ 함수: camelCase
function getUserProfile() { }
function openUploadModal() { }

// ✅ 변수: camelCase
let currentUser = null;
const maxFileSize = 10 * 1024 * 1024;

// ✅ 상수: UPPER_SNAKE_CASE
const MAX_IMAGES = 10;
const API_BASE_URL = 'https://api.example.com';

// ✅ 클래스: PascalCase
class CarouselManager { }
class UserProfile { }

// ✅ private 함수: 앞에 언더스코어 (선택)
function _internalHelper() { }

// ❌ 나쁜 예
function get_user() { }  // snake_case 금지
let UserName = '';       // 변수는 camelCase
```

### CSS
```css
/* ✅ 클래스: kebab-case */
.profile-avatar { }
.upload-modal-content { }

/* ✅ ID: kebab-case */
#artwork-detail-modal { }
#profile-edit-modal { }

/* ✅ BEM 방식 (선택) */
.block__element--modifier { }
.card__title--large { }

/* ❌ 나쁜 예 */
.profileAvatar { }  /* camelCase 금지 */
.Profile_Avatar { } /* 혼합 금지 */
```

### 파일명
```
✅ JavaScript: camelCase.js
   - auth.js
   - profile.js
   - artwork.js

✅ CSS: kebab-case.css
   - base.css
   - profile.css
   - artwork.css

✅ 문서: UPPER_CASE.md
   - README.md
   - ARCHITECTURE.md
   - FILE_MAP.md
```

---

## 🎨 코드 스타일

### JavaScript

#### 1. 들여쓰기 및 공백
```javascript
// ✅ 4칸 들여쓰기
function example() {
    if (condition) {
        doSomething();
    }
}

// ✅ 연산자 주변 공백
const sum = a + b;
const result = (x > 10) ? 'big' : 'small';

// ✅ 쉼표 뒤 공백
const arr = [1, 2, 3];
const obj = { a: 1, b: 2 };
```

#### 2. 함수 선언
```javascript
// ✅ export 함수는 명시적으로
export function functionName(param1, param2) {
    // ...
}

// ✅ 비동기 함수는 async 명시
export async function fetchData() {
    const data = await api.get();
    return data;
}

// ✅ 화살표 함수 (콜백용)
const callback = (item) => {
    return item * 2;
};
```

#### 3. 주석
```javascript
// ✅ 함수 위에 설명 주석
/**
 * 사용자 프로필을 업데이트합니다.
 * @param {string} userId - 사용자 ID
 * @param {Object} data - 업데이트할 데이터
 * @returns {Promise<Object>} 업데이트된 프로필
 */
export async function updateProfile(userId, data) {
    // ...
}

// ✅ 복잡한 로직 설명
// 이미지 배열을 순회하면서 Storage에 업로드
for (let i = 0; i < images.length; i++) {
    // ...
}

// ❌ 불필요한 주석
const x = 5; // x에 5를 할당
```

#### 4. 에러 처리
```javascript
// ✅ try-catch 사용
export async function saveData() {
    try {
        const result = await api.save(data);
        return result;
    } catch (error) {
        console.error('데이터 저장 에러:', error);
        alert('저장에 실패했습니다: ' + error.message);
        throw error;
    }
}

// ✅ 에러 메시지는 사용자 친화적으로
alert('작품 업로드에 실패했습니다. 다시 시도해주세요.');

// ❌ 에러 무시 금지
try {
    await api.save();
} catch (e) {
    // 아무것도 안 함 - 금지!
}
```

### CSS

#### 1. 들여쓰기 및 공백
```css
/* ✅ 4칸 들여쓰기 */
.class-name {
    property: value;
    another-property: value;
}

/* ✅ 속성 정렬 (선택) */
.class-name {
    /* 위치 */
    position: relative;
    top: 0;
    left: 0;
    
    /* 크기 */
    width: 100%;
    height: 200px;
    
    /* 스타일 */
    background: white;
    color: black;
}
```

#### 2. CSS 변수 사용
```css
/* ✅ 색상은 변수 사용 */
.button {
    background: var(--primary);
    color: white;
}

.button:hover {
    background: var(--primary-hover);
}

/* ❌ 하드코딩 금지 */
.button {
    background: #2563eb; /* 변수 사용하세요 */
}
```

#### 3. 반응형
```css
/* ✅ 모바일 퍼스트 */
.container {
    width: 100%;
}

@media (min-width: 768px) {
    .container {
        width: 750px;
    }
}

/* 또는 데스크톱 퍼스트 */
.container {
    width: 1200px;
}

@media (max-width: 768px) {
    .container {
        width: 100%;
    }
}
```

---

## 🗄️ Supabase 사용 규칙

### 1. 인증
```javascript
// ✅ 세션 확인
const { data: { session } } = await window._supabase.auth.getSession();
if (!session || !session.user) {
    alert('로그인이 필요합니다.');
    return;
}

// ✅ 사용자 ID 가져오기
const userId = session.user.id;
```

### 2. 데이터베이스 조회
```javascript
// ✅ 단일 레코드
const { data, error } = await window._supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

// ✅ 여러 레코드
const { data, error } = await window._supabase
    .from('artworks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

// ✅ 에러 처리
if (error) {
    console.error('조회 에러:', error);
    alert('데이터를 불러올 수 없습니다.');
    return;
}
```

### 3. 데이터베이스 삽입/수정
```javascript
// ✅ 삽입
const { data, error } = await window._supabase
    .from('artworks')
    .insert({
        user_id: userId,
        title: title,
        description: description
    })
    .select()
    .single();

// ✅ 수정
const { error } = await window._supabase
    .from('artworks')
    .update({
        title: newTitle,
        updated_at: new Date().toISOString()
    })
    .eq('id', artworkId);

// ✅ Upsert (있으면 수정, 없으면 삽입)
const { data, error } = await window._supabase
    .from('profiles')
    .upsert({
        user_id: userId,
        nickname: nickname
    }, {
        onConflict: 'user_id'
    });
```

### 4. Storage 사용
```javascript
// ✅ 파일 업로드
const fileName = `${userId}-${Date.now()}.jpg`;
const { data, error } = await window._supabase.storage
    .from('posts')
    .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
    });

// ✅ 공개 URL 가져오기
const { data: urlData } = window._supabase.storage
    .from('posts')
    .getPublicUrl(fileName);

const publicUrl = urlData.publicUrl;

// ✅ 파일 삭제
const { error } = await window._supabase.storage
    .from('posts')
    .remove([fileName]);
```

---

## 🔒 보안 규칙

### 1. XSS 방지
```javascript
// ✅ HTML 이스케이프 사용
import { escapeHtml } from './utils.js';

const safeTitle = escapeHtml(userInput);
element.textContent = safeTitle; // textContent 사용

// ❌ innerHTML 직접 사용 금지
element.innerHTML = userInput; // 위험!
```

### 2. 입력 검증
```javascript
// ✅ 항상 검증
function validateInput(title, content) {
    if (!title || !title.trim()) {
        alert('제목을 입력해주세요.');
        return false;
    }
    
    if (title.length > 100) {
        alert('제목은 100자 이하여야 합니다.');
        return false;
    }
    
    return true;
}

// ✅ 파일 검증
function validateImage(file) {
    if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return false;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        alert('파일 크기는 10MB 이하여야 합니다.');
        return false;
    }
    
    return true;
}
```

### 3. 권한 확인
```javascript
// ✅ 본인 확인
const { data: { session } } = await window._supabase.auth.getSession();
const isOwner = session && session.user && session.user.id === artwork.user_id;

if (!isOwner) {
    alert('권한이 없습니다.');
    return;
}
```

---

## 📝 문서화 규칙

### 1. 새 함수 추가 시
```
✅ FILE_MAP.md에 함수 정보 추가
   - 함수명
   - 입력 파라미터
   - 반환값
   - 용도

✅ 함수 위에 JSDoc 주석 추가
```

### 2. 새 파일 추가 시
```
✅ ARCHITECTURE.md에 파일 경로 추가
✅ FILE_MAP.md에 파일 상세 정보 추가
✅ 의존성 그래프 업데이트
```

### 3. 기능 수정 시
```
✅ FILE_MAP.md의 "마지막 수정" 날짜 업데이트
✅ 변경 내용 간단히 기록
```

---

## 🚫 금지 사항

### 절대 하지 말 것
```
❌ 전역 변수 남발
❌ 하드코딩 (색상, URL 등)
❌ console.log 프로덕션 배포
❌ 에러 무시 (빈 catch 블록)
❌ innerHTML에 사용자 입력 직접 삽입
❌ 비밀키 코드에 포함
❌ 문서 업데이트 없이 코드 수정
❌ 테스트 없이 배포
```

---

## ✅ 체크리스트

### 코드 작성 전
```
[ ] ARCHITECTURE.md 확인
[ ] FILE_MAP.md에서 관련 함수 확인
[ ] 의존성 확인
[ ] 네이밍 규칙 확인
```

### 코드 작성 중
```
[ ] 네이밍 규칙 준수
[ ] 주석 작성
[ ] 에러 처리
[ ] 입력 검증
[ ] XSS 방지
```

### 코드 작성 후
```
[ ] 테스트 (브라우저)
[ ] 콘솔 에러 확인
[ ] FILE_MAP.md 업데이트
[ ] ARCHITECTURE.md 업데이트 (필요시)
[ ] Git 커밋
```

---

**이 규칙을 항상 따르세요!**
**일관성이 가장 중요합니다!**
