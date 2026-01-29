# 🔄 업데이트 프로토콜 (Update Protocol)

> **⚠️ 필수:** 코드 변경 시 반드시 이 프로토콜을 따르세요.

**마지막 업데이트:** 2026-01-23

---

## 🎯 핵심 원칙

### **문서 우선 (Documentation First)**
```
1️⃣ 문서 업데이트 (ARCHITECTURE.md, FILE_MAP.md)
2️⃣ 코드 작성/수정
3️⃣ 테스트
4️⃣ 문서 최종 확인
```

---

## 📋 시나리오별 프로토콜

### 1. 새 기능 추가

#### Step 1: 계획 (Planning)
```
[ ] ARCHITECTURE.md 열기
[ ] 기능이 어디에 속하는지 결정
    - 인증? → js/auth.js
    - 프로필? → js/profile.js
    - 작품? → js/artwork.js, upload.js, edit.js
    - 커뮤니티? → js/posts.js
    - 새 카테고리? → 새 파일 생성

[ ] 필요한 파일 목록 작성
    예: 좋아요 기능
    - js/likes.js (새 파일)
    - css/likes.css (새 파일)
    - index.html (버튼 추가)
    - sql/setup_likes.sql (새 파일)
```

#### Step 2: 문서 업데이트
```
[ ] ARCHITECTURE.md 업데이트
    - 디렉토리 구조에 새 파일 추가
    - 기능별 파일 매핑에 새 섹션 추가
    - 의존성 그래프 업데이트
    - 데이터베이스 스키마 추가 (필요시)

[ ] FILE_MAP.md 업데이트
    - 새 파일 섹션 추가
    - 역할, 의존성, export 함수 목록 작성
    - 함수별 상세 정보 작성
```

#### Step 3: 코드 작성
```
[ ] 파일 생성
[ ] 헤더 주석 작성
    /**
     * @file filename.js
     * @description 파일 설명
     */

[ ] import 작성
[ ] 함수 작성 (JSDoc 주석 포함)
[ ] export 작성
```

#### Step 4: 통합
```
[ ] main.js에 import 추가
[ ] main.js에 전역 함수 등록 (HTML onclick용)
[ ] index.html에 UI 요소 추가 (필요시)
[ ] CSS 파일에 스타일 추가 (필요시)
```

#### Step 5: 테스트
```
[ ] 브라우저에서 기능 테스트
[ ] 콘솔 에러 확인
[ ] 네트워크 탭 확인
[ ] 다양한 시나리오 테스트
```

#### Step 6: 문서 최종 확인
```
[ ] ARCHITECTURE.md 최종 확인
[ ] FILE_MAP.md 최종 확인
[ ] "마지막 업데이트" 날짜 변경
```

---

### 2. 기존 함수 수정

#### Step 1: 확인
```
[ ] FILE_MAP.md에서 함수 위치 확인
[ ] 함수의 의존성 확인
[ ] 함수를 사용하는 다른 코드 확인
```

#### Step 2: 수정
```
[ ] 함수 코드 수정
[ ] JSDoc 주석 업데이트
[ ] 관련 코드 수정 (필요시)
```

#### Step 3: 문서 업데이트
```
[ ] FILE_MAP.md에서 함수 설명 업데이트
[ ] "마지막 수정" 날짜 업데이트
[ ] 변경 내용 간단히 기록
```

#### Step 4: 테스트
```
[ ] 수정한 함수 테스트
[ ] 의존하는 다른 기능 테스트
[ ] 콘솔 에러 확인
```

---

### 3. 새 파일 추가

#### Step 1: 파일 생성
```
[ ] 적절한 디렉토리에 파일 생성
    - JavaScript → js/
    - CSS → css/
    - SQL → sql/
    - 문서 → 프로젝트 구조/

[ ] 파일명 규칙 확인
    - JavaScript: camelCase.js
    - CSS: kebab-case.css
    - 문서: UPPER_CASE.md
```

#### Step 2: ARCHITECTURE.md 업데이트
```
[ ] 디렉토리 구조에 파일 추가
    예:
    ├── 📂 js/
    │   ├── likes.js        ⭐ 새로 추가!
    │   └── ...

[ ] 기능별 파일 매핑에 추가
    예:
    ### 5. 좋아요 (Likes)
    ```
    관련 파일:
    ├── js/likes.js         ⭐ 메인 로직
    ├── css/likes.css       스타일
    └── index.html          UI 요소
    ```

[ ] 의존성 그래프 업데이트
    예:
    main.js
    └─→ likes.js
        ├─→ utils.js
        └─→ Supabase DB (likes)

[ ] 파일 수 업데이트
    총 파일 수: 31개 → 33개
```

#### Step 3: FILE_MAP.md 업데이트
```
[ ] 새 파일 섹션 추가
    ### js/likes.js (~150줄)
    ```
    역할: 좋아요 기능
    의존성: utils.js, Supabase DB (likes)
    export: toggleLike, getLikeCount, isLiked
    
    전역 변수:
    └── likeCache    좋아요 캐시
    
    함수 목록:
    ├── toggleLike(artworkId)
    │   비동기: ✅
    │   ...
    ```

[ ] "마지막 수정" 날짜 추가
```

#### Step 4: 통합 및 테스트
```
[ ] main.js에 import 추가
[ ] 전역 함수 등록 (필요시)
[ ] 테스트
[ ] 문서 최종 확인
```

---

### 4. 파일 삭제

#### Step 1: 확인
```
[ ] 파일이 다른 곳에서 사용되는지 확인
[ ] 의존성 그래프 확인
[ ] import 하는 파일 검색
```

#### Step 2: 의존성 제거
```
[ ] 다른 파일에서 import 제거
[ ] main.js에서 전역 함수 등록 제거
[ ] HTML에서 onclick 제거
```

#### Step 3: 파일 삭제
```
[ ] 파일 삭제 또는 백업 폴더로 이동
```

#### Step 4: 문서 업데이트
```
[ ] ARCHITECTURE.md에서 파일 제거
[ ] FILE_MAP.md에서 섹션 제거
[ ] 의존성 그래프 업데이트
[ ] 파일 수 업데이트
```

---

### 5. CSS 변수 변경

#### Step 1: 확인
```
[ ] css/base.css 열기
[ ] 변경할 변수 확인
[ ] 변수를 사용하는 곳 검색
```

#### Step 2: 변경
```
[ ] css/base.css에서 변수 값 변경
    예:
    --primary: #8b5cf6;  /* 파란색 → 보라색 */
```

#### Step 3: 테스트
```
[ ] 브라우저에서 전체 UI 확인
[ ] 모든 페이지 확인
[ ] 호버 효과 확인
```

#### Step 4: 문서 업데이트
```
[ ] ARCHITECTURE.md의 "CSS 변수 시스템" 섹션 업데이트
[ ] FILE_MAP.md의 css/base.css 섹션 업데이트
```

---

### 6. 데이터베이스 스키마 변경

#### Step 1: SQL 파일 작성
```
[ ] sql/ 디렉토리에 새 SQL 파일 생성
    예: sql/ADD_LIKES_TABLE.sql

[ ] SQL 작성
    - CREATE TABLE
    - ALTER TABLE
    - CREATE POLICY
    - NOTIFY pgrst, 'reload schema'
```

#### Step 2: Supabase에서 실행
```
[ ] Supabase 대시보드 → SQL Editor
[ ] SQL 파일 내용 복사 → 실행
[ ] 에러 확인
[ ] 테이블 확인
```

#### Step 3: 문서 업데이트
```
[ ] ARCHITECTURE.md의 "데이터베이스 스키마" 섹션 업데이트
    예:
    ### likes 테이블
    ```sql
    CREATE TABLE likes (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id),
        artwork_id UUID REFERENCES artworks(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ```

[ ] FILE_MAP.md의 SQL 파일 섹션 추가
```

---

## 🔄 자동화 체크리스트

### AI에게 명령할 때 항상 포함할 내용

#### 새 기능 추가 시
```
"@프로젝트 구조/ARCHITECTURE.md 를 참고해서 [기능명] 추가해줘.
추가 후 ARCHITECTURE.md와 FILE_MAP.md를 업데이트해줘."
```

#### 기존 기능 수정 시
```
"@프로젝트 구조/FILE_MAP.md 에서 [함수명] 위치 확인하고 수정해줘.
수정 후 FILE_MAP.md를 업데이트해줘."
```

#### 스타일 변경 시
```
"@프로젝트 구조/ARCHITECTURE.md 의 CSS 변수 시스템을 참고해서
[색상/레이아웃] 변경해줘."
```

---

## 📊 업데이트 빈도 가이드

### 매번 업데이트 필수
```
✅ 새 함수 추가
✅ 함수 시그니처 변경
✅ 새 파일 추가
✅ 파일 삭제
✅ 데이터베이스 스키마 변경
```

### 선택적 업데이트
```
⚠️ 함수 내부 로직 수정 (시그니처 동일)
⚠️ CSS 속성 값 변경 (구조 동일)
⚠️ 주석 수정
```

### 업데이트 불필요
```
⭕ 오타 수정
⭕ 공백 정리
⭕ 콘솔 로그 추가/제거
```

---

## 🚨 긴급 상황 프로토콜

### 버그 발견 시
```
1. 버그 재현
2. FILE_MAP.md에서 관련 함수 찾기
3. 함수 수정
4. 테스트
5. FILE_MAP.md 업데이트 (수정 내용 기록)
```

### 프로덕션 배포 전
```
[ ] 모든 기능 테스트
[ ] 콘솔 에러 없음 확인
[ ] 네트워크 에러 없음 확인
[ ] ARCHITECTURE.md 최신 상태 확인
[ ] FILE_MAP.md 최신 상태 확인
[ ] console.log 제거
[ ] 주석 정리
```

---

## 📝 템플릿

### 새 JavaScript 파일 템플릿
```javascript
/**
 * @file filename.js
 * @description 파일 설명
 */

// ========== import ==========
import { func1 } from './module.js';

// ========== 전역 변수 ==========
let globalVar = null;

// ========== 내부 함수 ==========
function internalFunction() {
    // ...
}

// ========== export 함수 ==========
/**
 * 함수 설명
 * @param {type} paramName - 파라미터 설명
 * @returns {type} 반환값 설명
 */
export function functionName(paramName) {
    // ...
}
```

### FILE_MAP.md 함수 항목 템플릿
```markdown
├── functionName(param)         함수 설명
│   비동기: ✅/❌
│   입력: 파라미터 설명
│   출력: 반환값 설명
│   Supabase: 사용하는 API
│   호출: 호출하는 함수
│   용도: 사용 목적
```

---

## ✅ 최종 체크리스트

### 코드 변경 후 반드시 확인
```
[ ] 기능이 정상 작동하는가?
[ ] 콘솔 에러가 없는가?
[ ] ARCHITECTURE.md가 업데이트되었는가?
[ ] FILE_MAP.md가 업데이트되었는가?
[ ] "마지막 업데이트" 날짜가 변경되었는가?
[ ] 다른 기능에 영향이 없는가?
```

---

**이 프로토콜을 항상 따르세요!**
**문서가 최신 상태여야 AI가 효율적으로 작업할 수 있습니다!**
