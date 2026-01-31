# 템플릿 시스템 가이드

## 📁 폴더 구조

```
js/templates/
├── shared/               # 공유 컴포넌트 및 아이콘
│   ├── icons.js         # SVG 아이콘 모음
│   └── components.js    # 재사용 가능한 UI 컴포넌트
├── modals/              # 모달 템플릿
│   ├── upload.js        # 작품 업로드 모달
│   ├── editArtwork.js   # 작품 수정 모달
│   ├── artworkDetail.js # 작품 상세보기 모달
│   ├── profileEdit.js   # 프로필 편집 모달
│   ├── followers.js     # 팔로워/팔로잉 모달
│   ├── customStatus.js  # 커스텀 상태 모달
│   ├── communityWrite.js # 커뮤니티 글쓰기 모달
│   └── communityDetail.js # 커뮤니티 상세보기 모달
└── templateLoader.js    # 템플릿 로딩 시스템
```

## 🎯 주요 개선 사항

### 1. 중복 코드 제거
- **이전**: index.html에 모달 HTML이 중복으로 존재
- **현재**: 모든 모달이 동적으로 생성됨 (템플릿 시스템 사용)

### 2. 컴포넌트 기반 구조
- 재사용 가능한 컴포넌트로 분리
- SVG 아이콘을 별도 모듈로 관리
- 일관된 UI 패턴 유지

### 3. 유지보수 편의성
- 한 곳에서 수정하면 모든 곳에 반영
- 새로운 모달 추가가 쉬워짐
- 코드 가독성 향상

## 🔧 사용 방법

### 아이콘 사용

```javascript
import { Icons } from '../shared/icons.js';

// 닫기 아이콘
Icons.close()

// 사용자 아이콘 (크기 지정)
Icons.user(32, 32)

// 검색 아이콘
Icons.search()
```

**사용 가능한 아이콘:**
- `close()` - 닫기 (X)
- `user(width, height)` - 사용자 프로필
- `search(width, height)` - 검색
- `tag(width, height)` - 태그
- `image(width, height)` - 이미지
- `upload(width, height)` - 업로드
- `trash(width, height)` - 삭제
- `edit(width, height)` - 편집
- `gallery(width, height)` - 자유 게시판 (그리드)
- `message(width, height)` - 메시지
- `lock(width, height)` - 잠금 (비공개)
- `link(width, height)` - 링크
- `chevronLeft(width, height)` - 왼쪽 화살표
- `chevronRight(width, height)` - 오른쪽 화살표
- `info(width, height)` - 정보
- `send(width, height)` - 보내기

### 컴포넌트 사용

#### 모달 헤더
```javascript
import { createModalHeader } from '../shared/components.js';

createModalHeader('제목', 'closeFunction()')
```

#### 모달 푸터
```javascript
import { createModalFooter } from '../shared/components.js';

createModalFooter('cancelFunction()', 'saveFunction()', '저장')
```

#### 게시 위치 선택
```javascript
import { createPostTypeSelector } from '../shared/components.js';

createPostTypeSelector('input-name', 'changeFunction()')
```

#### 이미지 업로드 섹션
```javascript
import { createImageUploadSection } from '../shared/components.js';

createImageUploadSection(
    'prefix',                    // ID 접두사 ('upload' 또는 'edit')
    'prevFunction()',           // 이전 이미지 함수
    'nextFunction()',           // 다음 이미지 함수
    'changeFunction(event)',    // 파일 변경 핸들러
    'removeFunction()',         // 현재 파일 제거 함수
    '버튼 텍스트',              // 선택 버튼 텍스트
    'image/*'                   // accept 속성 (선택사항)
)
```

#### 폼 입력 필드
```javascript
import { createTextInput, createTextarea, createUrlInput, createTagInput } from '../shared/components.js';

// 텍스트 입력
createTextInput('id', '라벨', 'placeholder', 100, '힌트 텍스트')

// 텍스트 영역
createTextarea('id', '라벨', 'placeholder', 1000, 5, '힌트 텍스트')

// URL 입력
createUrlInput('id', '라벨', 'placeholder', 500, '힌트 텍스트')

// 태그 입력
createTagInput('id')
```

## 📝 새 모달 추가하기

1. **모달 템플릿 파일 생성** (`js/templates/modals/newModal.js`)

```javascript
import { createModalHeader, createModalFooter } from '../shared/components.js';

export function createNewModal() {
    return `
    <div id="new-modal" class="modal" style="display:none;">
        <div class="modal-content">
            ${createModalHeader('새 모달', 'closeNewModal()')}
            <div class="modal-body">
                <!-- 내용 추가 -->
            </div>
            ${createModalFooter('closeNewModal()', 'saveNew()', '저장')}
        </div>
    </div>
    `;
}
```

2. **templateLoader.js에 등록**

```javascript
// import 추가
import('./modals/newModal.js'),

// 등록
templateLoader.register('new-modal', modalModules[X].createNewModal);

// 미리 로드
templateLoader.preload(['new-modal']);
```

## 🎨 스타일 가이드

### 일관된 ID 네이밍
- 모달: `{name}-modal`
- 입력: `{prefix}-{field}-input`
- 버튼: `{prefix}-{action}-btn`

### 클래스 네이밍
- 모달 콘텐츠: `modal-content`
- 헤더: `modal-header`
- 바디: `modal-body`
- 푸터: `modal-footer`
- 버튼: `modal-btn`, `modal-close`

## 🔍 디버깅

### 템플릿 로딩 확인
브라우저 콘솔에서:
```javascript
// 로드된 모든 템플릿 확인
console.log('✅ All templates initialized');
```

### 개별 템플릿 재로드
```javascript
templateLoader.load('template-name', null, true); // forceReload = true
```

## 📊 성능 최적화

### 현재 적용된 최적화
1. **지연 로딩**: 모달은 필요할 때만 DOM에 추가
2. **중복 방지**: 이미 로드된 템플릿은 재사용
3. **번들 크기 감소**: 중복 HTML 제거로 파일 크기 감소
4. **캐싱**: 한 번 로드된 템플릿은 메모리에 캐시

## 🚀 미래 개선 계획

- [ ] 더 많은 재사용 가능한 컴포넌트 추가
- [ ] 템플릿 타입 검증 (TypeScript)
- [ ] 애니메이션 컴포넌트 분리
- [ ] 테마 시스템 통합
- [ ] 다국어 지원

## 📚 참고 자료

- [ES6 Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [Template Literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)
- [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
