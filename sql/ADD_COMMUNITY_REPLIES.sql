-- ========================================
-- 커뮤니티 대댓글 기능 추가
-- ========================================

-- 1. comments 테이블에 parent_comment_id 컬럼 추가
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE;

-- 2. comments 테이블에 is_anonymous 컬럼 추가
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;

-- 3. 기존 댓글은 모두 익명이 아닌 것으로 설정
UPDATE comments 
SET is_anonymous = false 
WHERE is_anonymous IS NULL;

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '✅ 커뮤니티 대댓글 기능이 추가되었습니다.';
    RAISE NOTICE '   - parent_comment_id 컬럼 추가 완료';
    RAISE NOTICE '   - is_anonymous 컬럼 추가 완료';
END $$;
