-- posts 테이블에 updated_at 컬럼 추가
-- 게시물 수정 시간 추적을 위한 컬럼

-- 1. updated_at 컬럼 추가
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. 기존 레코드의 updated_at을 created_at으로 초기화
UPDATE posts 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- 3. updated_at 자동 업데이트 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 트리거 생성 (이미 존재하면 삭제 후 재생성)
DROP TRIGGER IF EXISTS posts_updated_at_trigger ON posts;

CREATE TRIGGER posts_updated_at_trigger
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_posts_updated_at();

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE 'posts 테이블에 updated_at 컬럼 및 자동 업데이트 트리거가 추가되었습니다.';
END $$;
