# Type Utils - ID 타입 안전성 가이드

## 📌 문제 상황

### Before (문제)
```javascript
// HTML에서 전달된 ID는 문자열
function deleteComment(postId, commentId) {
    await supabase
        .from('artwork_comments')
        .delete()
        .eq('id', commentId);  // ❌ "123" (문자열)
}
```

**에러 발생:**
```
insert or update on table "artwork_comments" 
violates foreign key constraint "artwork_comments_parent_comment_id_fkey"
```

### 원인
- HTML `onclick` 속성에서 전달되는 ID는 **문자열**
- Supabase 데이터베이스는 **integer** 타입 요구
- 타입 불일치로 foreign key constraint 위반

---

## ✅ 해결 방법

### After (해결)
```javascript
import { toSafeId } from '../utils.js';

function deleteComment(postId, commentId) {
    // ✅ 안전하게 정수로 변환
    const numericPostId = toSafeId(postId, 'postId');
    const numericCommentId = toSafeId(commentId, 'commentId');
    
    await supabase
        .from('artwork_comments')
        .delete()
        .eq('post_id', numericPostId)    // ✅ 123 (정수)
        .eq('id', numericCommentId);     // ✅ 456 (정수)
}
```

---

## 🛠️ API 레퍼런스

### `toSafeId(id, context)`
안전하게 ID를 정수로 변환

```javascript
import { toSafeId } from '../utils.js';

// 문자열 → 정수
toSafeId("123");           // → 123
toSafeId("456", "userId"); // → 456

// 이미 정수면 그대로 반환
toSafeId(123);             // → 123

// 에러 처리
try {
    toSafeId("abc");       // ❌ throw Error
    toSafeId(null);        // ❌ throw Error
    toSafeId(-1);          // ❌ throw Error (음수)
} catch (error) {
    console.error(error.message);
}
```

### `toSafeIds(ids, context)`
ID 배열을 정수 배열로 변환

```javascript
import { toSafeIds } from '../utils.js';

toSafeIds(["1", "2", "3"]);          // → [1, 2, 3]
toSafeIds([1, "2", 3]);              // → [1, 2, 3]
toSafeIds(["1", "2"], "postIds");    // → [1, 2]
```

### `isSameId(id1, id2)`
두 ID가 같은지 타입 안전하게 비교

```javascript
import { isSameId } from '../utils.js';

isSameId("123", 123);    // → true
isSameId(123, 123);      // → true
isSameId("123", "123");  // → true
isSameId("123", "456");  // → false
isSameId(null, 123);     // → false
```

### `toStringId(id)`
ID를 문자열로 변환 (비교용)

```javascript
import { toStringId } from '../utils.js';

toStringId(123);         // → "123"
toStringId("123");       // → "123"
toStringId(null);        // → ""
```

### `isValidId(id)`
ID가 유효한지 검증

```javascript
import { isValidId } from '../utils.js';

isValidId(123);          // → true
isValidId("123");        // → true
isValidId("abc");        // → false
isValidId(null);         // → false
isValidId(-1);           // → false
```

---

## 📝 실전 예시

### 1. 댓글 작성
```javascript
import { toSafeId } from '../utils.js';

export async function submitComment(postId) {
    try {
        const numericPostId = toSafeId(postId, 'postId');
        
        const commentData = {
            artwork_id: numericPostId,  // ✅ 정수
            content: '댓글 내용',
            user_id: session.user.id
        };
        
        const { error } = await supabase
            .from('artwork_comments')
            .insert(commentData);
            
        if (error) throw error;
    } catch (error) {
        console.error('댓글 작성 실패:', error.message);
    }
}
```

### 2. 답글 작성
```javascript
import { toSafeId } from '../utils.js';

export function setReplyTarget(commentId, nickname) {
    const numericCommentId = toSafeId(commentId, 'commentId');
    
    replyTarget = { 
        id: numericCommentId,  // ✅ 정수로 저장
        nickname 
    };
}

export async function submitReply(postId) {
    const numericPostId = toSafeId(postId, 'postId');
    const parentId = toSafeId(replyTarget.id, 'parentCommentId');
    
    const commentData = {
        artwork_id: numericPostId,       // ✅ 정수
        parent_comment_id: parentId,     // ✅ 정수
        content: '답글 내용'
    };
    
    // ...
}
```

### 3. 본인 게시물 확인
```javascript
import { isSameId } from '../utils.js';

const isOwner = isSameId(currentUserId, post.user_id);

if (isOwner) {
    // 삭제 버튼 표시
}
```

### 4. 댓글 필터링
```javascript
import { isSameId } from '../utils.js';

// 대댓글 찾기
const replies = comments.filter(c => 
    isSameId(c.parent_comment_id, comment.id)
);
```

---

## 🎯 Best Practices

### ✅ DO
```javascript
// 1. HTML에서 전달받는 즉시 변환
export function deleteComment(postId, commentId) {
    const numericPostId = toSafeId(postId);
    const numericCommentId = toSafeId(commentId);
    // ...
}

// 2. 상태 저장 시 정수로 변환
export function setReplyTarget(commentId, nickname) {
    replyTarget = { 
        id: toSafeId(commentId),  // ✅
        nickname 
    };
}

// 3. 비교 시 isSameId 사용
if (isSameId(userId, post.user_id)) {
    // ...
}
```

### ❌ DON'T
```javascript
// 1. 타입 변환 없이 사용
function deleteComment(postId, commentId) {
    await supabase.delete().eq('id', commentId);  // ❌
}

// 2. 문자열로 상태 저장
replyTarget = { id: commentId };  // ❌ 문자열

// 3. === 연산자로 직접 비교
if (userId === post.user_id) {  // ❌ 타입 불일치 가능
    // ...
}
```

---

## 🔧 마이그레이션 가이드

기존 코드를 수정하는 방법:

### 1. 함수 파라미터 검증
```diff
  export async function deleteComment(postId, commentId) {
+     const numericPostId = toSafeId(postId, 'postId');
+     const numericCommentId = toSafeId(commentId, 'commentId');
+     
      const { error } = await supabase
          .from('artwork_comments')
          .delete()
-         .eq('id', commentId);
+         .eq('id', numericCommentId);
  }
```

### 2. 전역 상태 변환
```diff
  export function setReplyTarget(commentId, nickname) {
+     const numericCommentId = toSafeId(commentId, 'commentId');
+     
      replyTarget = { 
-         id: commentId,
+         id: numericCommentId,
          nickname 
      };
  }
```

### 3. 조건문 비교
```diff
- if (String(currentUserId) === String(post.user_id)) {
+ if (isSameId(currentUserId, post.user_id)) {
      // ...
  }
```

---

## 📚 관련 파일

- **구현**: `js/utils/typeUtils.js`
- **Export**: `js/utils.js`
- **사용처**: 
  - `js/feed/feedComments.js`
  - `js/artwork/artworkComments.js`
  - 기타 ID를 다루는 모든 모듈

---

## 🐛 트러블슈팅

### Q: "ID가 null 또는 undefined입니다" 에러
```javascript
// A: null 체크 추가
if (commentId) {
    const numericId = toSafeId(commentId);
}
```

### Q: "ID를 숫자로 변환할 수 없습니다" 에러
```javascript
// A: 전달되는 값 확인
console.log('commentId:', commentId, typeof commentId);

// HTML에서 올바르게 전달되는지 확인
<button onclick="deleteComment('${postId}', '${commentId}')">
```

### Q: 기존 코드 모두 수정해야 하나요?
```
A: 아니요! 버그가 발생한 곳만 우선 수정하세요.
   - 우선순위: 댓글 CRUD, 좋아요, 저장 기능
   - 점진적으로 마이그레이션
```
