-- ========================================
-- 커뮤니티 익명 게시 기능 추가
-- ========================================

-- 1. posts 테이블에 is_anonymous 컬럼 추가
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;

-- 2. 기존 게시물은 모두 익명이 아닌 것으로 설정
UPDATE posts 
SET is_anonymous = false 
WHERE is_anonymous IS NULL;

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '✅ 커뮤니티 익명 게시 기능이 추가되었습니다.';
    RAISE NOTICE '   - is_anonymous 컬럼 추가 완료';
END $$;
