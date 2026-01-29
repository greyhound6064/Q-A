# 👍👎 좋아요/싫어요 기능 설정 가이드

## 📋 개요

피드의 게시물에 대한 좋아요/싫어요 기능이 구현되었습니다.

## 🚀 설정 방법

### 1단계: 데이터베이스 테이블 생성

1. **Supabase 대시보드** 접속
2. 왼쪽 메뉴에서 **"SQL Editor"** 클릭
3. `SETUP_ARTWORK_LIKES.sql` 파일의 전체 내용을 복사하여 붙여넣기
4. **"Run"** 버튼 클릭

### 2단계: 확인

SQL 실행 후 다음 항목들이 생성됩니다:

- ✅ `artwork_likes` 테이블
- ✅ RLS (Row Level Security) 정책
- ✅ 인덱스 (빠른 조회용)
- ✅ `artwork_likes_summary` 뷰 (집계용)

## 📊 데이터베이스 구조

### artwork_likes 테이블

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | UUID | 기본 키 |
| artwork_id | BIGINT | 작품 ID (artworks 테이블 참조) |
| user_id | UUID | 사용자 ID (auth.users 참조) |
| like_type | TEXT | 'like' 또는 'dislike' |
| created_at | TIMESTAMPTZ | 생성 시간 |
| updated_at | TIMESTAMPTZ | 수정 시간 |

**제약 조건:**
- `UNIQUE(artwork_id, user_id)`: 한 사용자는 하나의 작품에 하나의 반응만 가능
- `CHECK (like_type IN ('like', 'dislike'))`: like_type은 'like' 또는 'dislike'만 가능

## 🎯 기능 설명

### 좋아요 버튼
- 클릭 시 좋아요 추가
- 이미 좋아요를 누른 상태에서 다시 클릭하면 취소
- 싫어요를 누른 상태에서 클릭하면 좋아요로 변경

### 싫어요 버튼
- 클릭 시 싫어요 추가
- 이미 싫어요를 누른 상태에서 다시 클릭하면 취소
- 좋아요를 누른 상태에서 클릭하면 싫어요로 변경

### UI 표시
- 좋아요를 누른 버튼은 빨간색으로 표시 (하트 아이콘)
- 싫어요를 누른 버튼은 파란색으로 표시 (싫어요 아이콘)
- 각 버튼 옆에 좋아요/싫어요 수가 표시됨

## 🔒 보안

### RLS 정책
- **조회**: 누구나 가능
- **생성**: 인증된 사용자만 가능
- **수정/삭제**: 본인의 반응만 가능

## 💡 사용 예시

### 좋아요 추가
```javascript
// 사용자가 좋아요 버튼 클릭
toggleLike(artworkId)
```

### 싫어요 추가
```javascript
// 사용자가 싫어요 버튼 클릭
toggleDislike(artworkId)
```

### 좋아요/싫어요 수 조회
```javascript
// 특정 작품의 좋아요/싫어요 데이터 가져오기
const likesData = await getLikesData(artworkId, userId);
// 결과: { likes: 10, dislikes: 2, userReaction: 'like' }
```

## 📈 집계 뷰

`artwork_likes_summary` 뷰를 사용하여 작품별 좋아요/싫어요를 쉽게 조회할 수 있습니다:

```sql
SELECT * FROM artwork_likes_summary WHERE artwork_id = 123;
```

결과:
| artwork_id | likes_count | dislikes_count | total_reactions |
|------------|-------------|----------------|-----------------|
| 123 | 10 | 2 | 12 |

## 🎨 스타일링

### 좋아요 버튼 (활성화 시)
- 색상: 빨간색 (#ef4444)
- 아이콘: 채워진 하트

### 싫어요 버튼 (활성화 시)
- 색상: 파란색 (#6366f1)
- 아이콘: 채워진 싫어요

## 🔧 문제 해결

### 좋아요/싫어요가 작동하지 않는 경우

1. **로그인 확인**: 로그인된 상태인지 확인
2. **SQL 실행 확인**: `SETUP_ARTWORK_LIKES.sql`이 정상적으로 실행되었는지 확인
3. **브라우저 콘솔 확인**: F12를 눌러 콘솔에서 에러 메시지 확인

### 데이터베이스 재설정이 필요한 경우

```sql
-- artwork_likes 테이블 삭제
DROP TABLE IF EXISTS artwork_likes CASCADE;

-- 뷰 삭제
DROP VIEW IF EXISTS artwork_likes_summary;

-- 그 후 SETUP_ARTWORK_LIKES.sql 다시 실행
```

## 📝 변경 이력

### v1.3.0 (2026-01-24)
- ✅ 좋아요/싫어요 기능 추가
- ✅ artwork_likes 테이블 생성
- ✅ RLS 정책 적용
- ✅ UI 업데이트 (좋아요/싫어요 버튼)
- ✅ 실시간 카운트 업데이트

## 🎉 완료!

이제 피드에서 게시물에 좋아요/싫어요를 누를 수 있습니다!
