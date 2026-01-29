-- ==========================================
-- 💾 작품 저장 기능 설정
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
-- 1️⃣ saved_artworks 테이블 생성
-- ==========================================
CREATE TABLE IF NOT EXISTS saved_artworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artwork_id BIGINT NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 한 사용자는 하나의 작품을 한 번만 저장 가능
    UNIQUE(artwork_id, user_id)
);

-- artwork_id에 인덱스 생성 (빠른 조회)
CREATE INDEX IF NOT EXISTS saved_artworks_artwork_id_idx ON saved_artworks(artwork_id);

-- user_id에 인덱스 생성 (사용자별 저장된 작품 조회)
CREATE INDEX IF NOT EXISTS saved_artworks_user_id_idx ON saved_artworks(user_id);

-- ==========================================
-- 2️⃣ RLS (Row Level Security) 활성화
-- ==========================================
ALTER TABLE saved_artworks ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3️⃣ saved_artworks 테이블 보안 정책
-- ==========================================
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can read own saved artworks" ON saved_artworks;
DROP POLICY IF EXISTS "Authenticated users can create saved artworks" ON saved_artworks;
DROP POLICY IF EXISTS "Users can delete own saved artworks" ON saved_artworks;

-- 본인 저장된 작품만 조회 가능
CREATE POLICY "Users can read own saved artworks" ON saved_artworks
    FOR SELECT USING (auth.uid() = user_id);

-- 인증된 사용자만 작품 저장 가능
CREATE POLICY "Authenticated users can create saved artworks" ON saved_artworks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 본인 저장된 작품만 삭제 가능
CREATE POLICY "Users can delete own saved artworks" ON saved_artworks
    FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 4️⃣ 스키마 캐시 강제 갱신
-- ==========================================
NOTIFY pgrst, 'reload schema';

-- saved_artworks 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'saved_artworks' 
ORDER BY ordinal_position;

-- ==========================================
-- ✅ 설정 완료!
-- ==========================================
-- 
-- 📊 생성된 테이블:
-- - saved_artworks (저장된 작품: artwork_id, user_id)
--
-- 🔒 보안 정책 (RLS) 적용됨
-- 🔄 스키마 캐시 갱신됨
--
-- 💡 실행 후 saved_artworks 테이블의 컬럼 목록이 표시됩니다.
--
-- ==========================================
