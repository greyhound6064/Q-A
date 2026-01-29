# 📝 변경 로그 - 대댓글 기능 추가

## 버전 1.5.0 (2026-01-24)

### 🎉 새로운 기능

#### 대댓글 (답글) 시스템
- 사용자가 댓글에 답글을 달 수 있는 기능 추가
- 계층적 댓글 구조 지원 (부모 댓글 → 대댓글)
- "@작성자명" 멘션 표시로 답글 대상 명확화

### 📦 변경된 파일

#### 신규 파일
1. **sql/ADD_REPLY_TO_COMMENTS.sql**
   - 대댓글 기능을 위한 데이터베이스 마이그레이션 스크립트
   - `parent_comment_id` 컬럼 추가
   - 인덱스 및 집계 함수 생성

2. **대댓글_기능_설치_가이드.md**
   - 대댓글 기능 설치 및 사용 가이드
   - 문제 해결 방법 포함

3. **CHANGELOG_대댓글기능.md**
   - 이 파일 (변경 로그)

#### 수정된 파일
1. **js/artwork.js** (~150줄 추가)
   - `renderArtworkComments()`: 대댓글 렌더링 로직 추가
   - `submitArtworkComment()`: 대댓글 작성 지원 (parentCommentId 파라미터 추가)
   - `showArtworkReplyForm()`: 대댓글 입력 폼 표시 함수 (신규)
   - `hideArtworkReplyForm()`: 대댓글 입력 폼 숨기기 함수 (신규)

2. **css/feed.css** (~100줄 추가)
   - `.feed-comment-reply`: 대댓글 컨테이너 스타일
   - `.feed-reply-form`: 대댓글 입력 폼 스타일
   - `.feed-comment-action-btn.reply`: 답글 달기 버튼 스타일
   - `.feed-comment-reply-indicator`: 대댓글 표시 인디케이터

3. **css/artwork.css** (~100줄 추가)
   - `.artwork-comment-reply`: 대댓글 컨테이너 스타일
   - `.artwork-reply-form`: 대댓글 입력 폼 스타일
   - `.artwork-comment-action-btn.reply`: 답글 달기 버튼 스타일
   - `.artwork-comment-reply-indicator`: 대댓글 표시 인디케이터

4. **프로젝트 구조/ARCHITECTURE.md**
   - 프로젝트 버전 1.5.0으로 업데이트
   - 파일 수 36개 → 37개로 업데이트
   - 코드 라인 수 업데이트
   - 함수 목록에 대댓글 관련 함수 추가
   - 데이터베이스 스키마에 `parent_comment_id` 컬럼 추가

### 🗄️ 데이터베이스 변경사항

#### artwork_comments 테이블
```sql
-- 추가된 컬럼
ALTER TABLE artwork_comments 
ADD COLUMN parent_comment_id BIGINT REFERENCES artwork_comments(id) ON DELETE CASCADE;

-- 추가된 인덱스
CREATE INDEX artwork_comments_parent_id_idx ON artwork_comments(parent_comment_id);

-- 추가된 함수
CREATE FUNCTION get_comment_reply_count(comment_bigint BIGINT) RETURNS INTEGER;
```

### 🎨 UI/UX 개선사항

#### 시각적 변화
- 대댓글은 42px 왼쪽 들여쓰기
- 대댓글 컨테이너에 2px 왼쪽 테두리 (var(--border))
- 대댓글은 흰색 배경으로 부모 댓글과 구분
- "@작성자명" 인디케이터로 답글 대상 표시

#### 인터랙션 개선
- 각 댓글에 "답글 달기" 버튼 추가
- 답글 입력 폼은 해당 댓글 바로 아래에 표시
- 답글 입력 폼에 "취소" 버튼 추가
- 한 번에 하나의 답글 입력 폼만 표시 (다른 폼은 자동 숨김)

#### 사용자 경험
- 직관적인 계층 구조로 대화 흐름 파악 용이
- 답글 대상이 명확하게 표시됨
- 부드러운 애니메이션과 호버 효과

### 🔧 기술적 개선사항

#### 성능 최적화
- 댓글 조회 시 인덱스 활용으로 빠른 대댓글 검색
- 클라이언트 사이드에서 댓글 분류 (부모/자식)
- 불필요한 리렌더링 방지

#### 코드 품질
- 함수 재사용성 향상 (`submitArtworkComment` 통합)
- 명확한 함수명과 주석
- 일관된 코드 스타일 유지

#### 보안
- XSS 방지를 위한 `escapeHtml()` 사용
- RLS 정책 자동 적용 (기존 정책 활용)
- 본인 댓글만 삭제 가능

### 📊 통계

#### 코드 변경량
- **JavaScript**: +150줄 (artwork.js)
- **CSS**: +200줄 (feed.css + artwork.css)
- **SQL**: +50줄 (ADD_REPLY_TO_COMMENTS.sql)
- **문서**: +300줄 (가이드 및 로그)

#### 파일 변경
- 신규 생성: 3개
- 수정: 4개
- 총 영향 파일: 7개

### 🐛 버그 수정
- 없음 (신규 기능)

### ⚠️ 주의사항

1. **필수 작업**: `sql/ADD_REPLY_TO_COMMENTS.sql` 실행 필요
2. **호환성**: 기존 댓글은 자동으로 부모 댓글로 처리됨
3. **제한사항**: 현재 1단계 대댓글만 지원 (대댓글의 대댓글 미지원)

### 🚀 향후 계획

#### 단기 (v1.6.0)
- [ ] 대댓글 수 표시 기능
- [ ] 대댓글 접기/펼치기 기능
- [ ] 대댓글 알림 시스템

#### 중기 (v1.7.0)
- [ ] 멘션 자동완성 기능
- [ ] 대댓글 정렬 옵션
- [ ] 댓글 수정 기능

#### 장기 (v2.0.0)
- [ ] 다단계 대댓글 지원 (무제한 깊이)
- [ ] 댓글 좋아요 기능
- [ ] 댓글 신고 기능

### 📚 참고 문서
- [대댓글 기능 설치 가이드](./대댓글_기능_설치_가이드.md)
- [프로젝트 아키텍처](./프로젝트%20구조/ARCHITECTURE.md)
- [SQL 마이그레이션 스크립트](./sql/ADD_REPLY_TO_COMMENTS.sql)

### 👥 기여자
- AI Assistant (2026-01-24)

---

## 이전 버전

### 버전 1.4.0
- 피드 시스템 구현
- 좋아요/싫어요 기능
- 댓글 시스템 (대댓글 미지원)

### 버전 1.3.0
- 작품 업로드 기능
- 다중 이미지 지원
- 캐러셀 기능

### 버전 1.2.0
- 프로필 시스템
- 작품 그리드 표시
- 작품 상세보기

### 버전 1.1.0
- Google OAuth 인증
- 기본 UI 구조
- Supabase 연동

### 버전 1.0.0
- 초기 프로젝트 설정
- 기본 HTML 구조
- CSS 스타일 시스템
