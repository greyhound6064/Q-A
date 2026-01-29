-- ==========================================
-- 🔒 게시물 공개/비공개 및 게시 위치 선택 기능
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
-- 1️⃣ artworks 테이블에 컬럼 추가
-- ==========================================

-- is_public: 공개(true) / 비공개(false)
ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- post_type: 'gallery'(작품관) / 'feed'(자유게시판)
ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'gallery' CHECK (post_type IN ('gallery', 'feed'));

-- 인덱스 추가 (필터링 성능 향상)
CREATE INDEX IF NOT EXISTS artworks_is_public_idx ON artworks(is_public);
CREATE INDEX IF NOT EXISTS artworks_post_type_idx ON artworks(post_type);
CREATE INDEX IF NOT EXISTS artworks_post_type_public_idx ON artworks(post_type, is_public);

-- ==========================================
-- 2️⃣ RLS 정책 업데이트
-- ==========================================

-- 기존 조회 정책 삭제
DROP POLICY IF EXISTS "Anyone can read artworks" ON artworks;

-- 새로운 조회 정책: 공개 게시물은 누구나, 비공개는 작성자만
CREATE POLICY "Anyone can read public artworks" ON artworks
    FOR SELECT USING (
        is_public = true 
        OR auth.uid() = user_id
    );

-- ==========================================
-- 3️⃣ 스키마 캐시 강제 갱신
-- ==========================================
NOTIFY pgrst, 'reload schema';

-- artworks 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'artworks' 
ORDER BY ordinal_position;

-- ==========================================
-- ✅ 설정 완료!
-- ==========================================
-- 
-- 📊 추가된 컬럼:
-- - is_public: 공개(true) / 비공개(false)
-- - post_type: 'gallery'(작품관) / 'feed'(자유게시판)
--
-- 🔒 보안 정책 (RLS) 업데이트됨
-- ⚡ 인덱스 추가됨 (성능 최적화)
-- 🔄 스키마 캐시 갱신됨
--
-- ==========================================
