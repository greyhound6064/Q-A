-- ==========================================
-- 👍👎 작품 좋아요/싫어요 기능 설정
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
-- 1️⃣ artwork_likes 테이블 생성
-- ==========================================
CREATE TABLE IF NOT EXISTS artwork_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artwork_id BIGINT NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    like_type TEXT NOT NULL CHECK (like_type IN ('like', 'dislike')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 한 사용자는 하나의 작품에 하나의 반응만 가능
    UNIQUE(artwork_id, user_id)
);

-- artwork_id에 인덱스 생성 (빠른 조회)
CREATE INDEX IF NOT EXISTS artwork_likes_artwork_id_idx ON artwork_likes(artwork_id);

-- user_id에 인덱스 생성 (사용자별 좋아요 조회)
CREATE INDEX IF NOT EXISTS artwork_likes_user_id_idx ON artwork_likes(user_id);

-- like_type에 인덱스 생성 (좋아요/싫어요 집계)
CREATE INDEX IF NOT EXISTS artwork_likes_like_type_idx ON artwork_likes(like_type);

-- ==========================================
-- 2️⃣ RLS (Row Level Security) 활성화
-- ==========================================
ALTER TABLE artwork_likes ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3️⃣ artwork_likes 테이블 보안 정책
-- ==========================================
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Anyone can read likes" ON artwork_likes;
DROP POLICY IF EXISTS "Authenticated users can create likes" ON artwork_likes;
DROP POLICY IF EXISTS "Users can update own likes" ON artwork_likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON artwork_likes;

-- 누구나 좋아요/싫어요 조회 가능
CREATE POLICY "Anyone can read likes" ON artwork_likes
    FOR SELECT USING (true);

-- 인증된 사용자만 좋아요/싫어요 생성 가능
CREATE POLICY "Authenticated users can create likes" ON artwork_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 본인 좋아요/싫어요만 수정 가능
CREATE POLICY "Users can update own likes" ON artwork_likes
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 본인 좋아요/싫어요만 삭제 가능
CREATE POLICY "Users can delete own likes" ON artwork_likes
    FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 4️⃣ updated_at 자동 갱신 트리거
-- ==========================================
-- 트리거 함수는 이미 존재한다고 가정 (SETUP_DATABASE.sql에서 생성됨)
-- 없다면 아래 주석을 해제하여 생성
/*
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
*/

-- artwork_likes 테이블 트리거
DROP TRIGGER IF EXISTS update_artwork_likes_updated_at ON artwork_likes;
CREATE TRIGGER update_artwork_likes_updated_at
    BEFORE UPDATE ON artwork_likes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 5️⃣ 좋아요/싫어요 집계 뷰 생성 (선택사항)
-- ==========================================
CREATE OR REPLACE VIEW artwork_likes_summary AS
SELECT 
    artwork_id,
    COUNT(CASE WHEN like_type = 'like' THEN 1 END) as likes_count,
    COUNT(CASE WHEN like_type = 'dislike' THEN 1 END) as dislikes_count,
    COUNT(*) as total_reactions
FROM artwork_likes
GROUP BY artwork_id;

-- ==========================================
-- 6️⃣ 스키마 캐시 강제 갱신
-- ==========================================
NOTIFY pgrst, 'reload schema';

-- artwork_likes 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'artwork_likes' 
ORDER BY ordinal_position;

-- ==========================================
-- ✅ 설정 완료!
-- ==========================================
-- 
-- 📊 생성된 테이블:
-- - artwork_likes (좋아요/싫어요: artwork_id, user_id, like_type)
--
-- 📈 생성된 뷰:
-- - artwork_likes_summary (작품별 좋아요/싫어요 집계)
--
-- 🔒 보안 정책 (RLS) 적용됨
-- ⚡ 자동 갱신 트리거 적용됨
-- 🔄 스키마 캐시 갱신됨
--
-- 💡 실행 후 artwork_likes 테이블의 컬럼 목록이 표시됩니다.
--
-- ==========================================
