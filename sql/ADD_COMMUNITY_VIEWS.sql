-- ========================================
-- 커뮤니티 게시판 조회수 기능 추가
-- ========================================

-- 1. posts 테이블에 views 컬럼 추가
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- 2. 조회수 증가 함수 생성
CREATE OR REPLACE FUNCTION increment_post_views(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE posts
    SET views = COALESCE(views, 0) + 1
    WHERE id = post_id;
END;
$$;

-- 3. 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION increment_post_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_post_views(UUID) TO anon;

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '✅ 커뮤니티 조회수 기능이 추가되었습니다.';
END $$;
