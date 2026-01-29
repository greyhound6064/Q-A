# 🤖 AI 에이전트 코딩 요청 가이드

> **효율적인 AI 코딩을 위한 프롬프트 작성 가이드**

## 📌 기본 프롬프트 템플릿

```
@프로젝트 구조/ARCHITECTURE.md 를 참고해서 [요청 내용]
```

## ✨ 효과적인 요청 예시

### 1. 새 모달 추가

**❌ 비효율적:**
```
새 설정 모달 만들어줘
```

**✅ 효율적:**
```
@프로젝트 구조/ARCHITECTURE.md 를 참고해서 설정 모달 만들어줘.
- 닉네임 입력
- 알림 설정 토글
- 저장/취소 버튼
```

**AI가 자동으로:**
- ✅ `shared/components.js`의 컴포넌트 사용
- ✅ `shared/icons.js`의 아이콘 사용
- ✅ 중복 코드 없이 20줄 내외로 작성
- ✅ `templateLoader.js`에 자동 등록

---

### 2. 기존 모달 수정

**❌ 비효율적:**
```
업로드 모달에 미리보기 기능 추가해줘
```

**✅ 효율적:**
```
@프로젝트 구조/ARCHITECTURE.md 를 참고해서 
@js/templates/modals/upload.js 에 미리보기 기능 추가해줘.
- 이미지 선택 시 즉시 미리보기
- 캐러셀 형태로 여러 이미지 확인 가능
```

**AI가 자동으로:**
- ✅ 기존 `createImageUploadSection` 활용
- ✅ 필요시 새 컴포넌트 제안
- ✅ 일관된 스타일 유지

---

### 3. 전역 스타일 변경

**❌ 비효율적:**
```
모든 모달의 닫기 버튼 크기를 32px로 키워줘
```

**✅ 효율적:**
```
@프로젝트 구조/ARCHITECTURE.md 를 참고해서
@js/templates/shared/icons.js 의 close() 아이콘 크기를 32px로 변경해줘
```

**AI가 자동으로:**
- ✅ `icons.js`의 한 줄만 수정
- ✅ 8개 모달에 자동 반영
- ✅ 일관성 유지

---

### 4. 새 컴포넌트 추가

**❌ 비효율적:**
```
드롭다운 메뉴 만들어줘
```

**✅ 효율적:**
```
@프로젝트 구조/ARCHITECTURE.md 를 참고해서
@js/templates/shared/components.js 에 드롭다운 컴포넌트 추가해줘.
- createDropdown(options, onChange) 형태
- 옵션 배열 받아서 select 태그 생성
```

**AI가 자동으로:**
- ✅ 일관된 네이밍 패턴 적용
- ✅ JSDoc 주석 추가
- ✅ 재사용 가능한 형태로 작성

---

## 🎯 프롬프트 작성 팁

### 1. 항상 ARCHITECTURE.md 참조
```
@프로젝트 구조/ARCHITECTURE.md 를 참고해서 [요청]
```

### 2. 구체적인 파일 지정
```
@js/templates/modals/upload.js 수정해줘
@js/templates/shared/components.js 에 추가해줘
```

### 3. 원하는 결과 명시
```
- 중복 코드 없이
- 공통 컴포넌트 사용해서
- 기존 스타일과 일관되게
```

### 4. 예시 제공
```
@js/templates/modals/upload.js 처럼 만들어줘
```

---

## 📊 효율성 비교

| 프롬프트 방식 | AI 작업 시간 | 코드 품질 | 일관성 |
|--------------|-------------|----------|--------|
| 일반 요청 | 5분 | 중복 발생 | 낮음 |
| ARCHITECTURE.md 참조 | 2분 | 컴포넌트 사용 | 높음 |
| **차이** | **60% ↓** | **중복 0%** | **100%** |

---

## 🚀 고급 활용

### 여러 파일 동시 수정
```
@프로젝트 구조/ARCHITECTURE.md 를 참고해서
1. @js/templates/shared/icons.js 에 새 아이콘 추가
2. @js/templates/modals/upload.js 에서 새 아이콘 사용
```

### 리팩토링 요청
```
@프로젝트 구조/ARCHITECTURE.md 를 참고해서
@js/templates/modals/ 의 모든 모달에서 중복된 코드 찾아서
@js/templates/shared/components.js 로 추출해줘
```

### 문서 업데이트 포함
```
@프로젝트 구조/ARCHITECTURE.md 를 참고해서 새 기능 추가하고
@js/templates/README.md 에 사용 예시도 추가해줘
```

---

## 💡 자주 하는 실수

### ❌ 실수 1: 파일 참조 없이 요청
```
모달 만들어줘
→ AI가 중복 코드 작성 가능성 높음
```

### ❌ 실수 2: 너무 모호한 요청
```
업로드 기능 개선해줘
→ AI가 무엇을 개선할지 모름
```

### ❌ 실수 3: 기존 구조 무시
```
index.html에 모달 추가해줘
→ 템플릿 시스템 무시, 중복 발생
```

---

## ✅ 올바른 예시

### 예시 1: 새 기능 추가
```
@프로젝트 구조/ARCHITECTURE.md 를 참고해서
프로필 모달에 소셜 링크 입력 필드 추가해줘.
- GitHub, Twitter, Website 3개
- createUrlInput 컴포넌트 사용
- 기존 스타일과 일관되게
```

### 예시 2: 버그 수정
```
@프로젝트 구조/ARCHITECTURE.md 를 참고해서
@js/templates/modals/upload.js 의 파일 선택 버튼이 안 보이는 문제 수정해줘
```

### 예시 3: 스타일 개선
```
@프로젝트 구조/ARCHITECTURE.md 를 참고해서
모든 모달의 버튼 스타일을 더 현대적으로 개선해줘.
- 둥근 모서리
- 호버 효과
- 부드러운 트랜지션
```

---

## 🎓 학습 리소스

1. **ARCHITECTURE.md** - 전체 프로젝트 구조
2. **js/templates/README.md** - 템플릿 시스템 상세 가이드
3. **REFACTORING_SUMMARY.md** - 리팩토링 사례 연구

---

## 📞 문제 해결

### AI가 중복 코드를 작성했다면?
```
@프로젝트 구조/ARCHITECTURE.md 를 다시 확인하고
@js/templates/shared/components.js 의 기존 컴포넌트를 사용해서 다시 작성해줘
```

### AI가 템플릿 시스템을 무시했다면?
```
@프로젝트 구조/ARCHITECTURE.md 의 "AI 에이전트 작업 가이드" 섹션을 참고해서
템플릿 시스템 규칙에 맞게 다시 작성해줘
```

### 결과가 기대와 다르다면?
```
@js/templates/modals/upload.js 처럼 작성해줘
(구체적인 예시 제공)
```

---

**💡 핵심 요약:**
1. 항상 `@프로젝트 구조/ARCHITECTURE.md` 참조
2. 구체적인 파일 경로 지정
3. 원하는 결과 명확히 설명
4. 기존 코드 예시 활용

이렇게 요청하면 AI가 **중복 없이, 일관되게, 효율적으로** 코딩합니다! 🚀
