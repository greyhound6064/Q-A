-- ==========================================
-- 🎨 작품 댓글 대댓글 기능 추가
-- ==========================================
-- 
-- 📋 사용 방법:
-- 1. Supabase 대시보드 접속
-- 2. 왼쪽 메뉴에서 "SQL Editor" 클릭
-- 3. 이 파일의 전체 내용을 복사하여 붙여넣기
-- 4. "Run" 버튼 클릭
-- 
-- ==========================================

-- ==========================================
-- 1️⃣ parent_comment_id 컬럼 추가
-- ==========================================
-- 대댓글을 위한 부모 댓글 ID 컬럼 추가
ALTER TABLE artwork_comments 
ADD COLUMN IF NOT EXISTS parent_comment_id BIGINT REFERENCES artwork_comments(id) ON DELETE CASCADE;

-- 인덱스 생성 (빠른 조회)
CREATE INDEX IF NOT EXISTS artwork_comments_parent_id_idx ON artwork_comments(parent_comment_id);

-- ==========================================
-- 2️⃣ 대댓글 수 집계 함수
-- ==========================================
-- 특정 댓글의 대댓글 수를 반환하는 함수
CREATE OR REPLACE FUNCTION get_comment_reply_count(comment_bigint BIGINT)
RETURNS INTEGER AS $$
    SELECT COUNT(*)::INTEGER FROM artwork_comments WHERE parent_comment_id = comment_bigint;
$$ LANGUAGE SQL STABLE;

-- ==========================================
-- ✅ 설정 완료!
-- ==========================================
-- 
-- 📊 추가된 컬럼:
-- - parent_comment_id (부모 댓글 ID)
--
-- 📈 인덱스 생성됨
-- 🔧 대댓글 수 집계 함수 생성됨
--
-- ==========================================
