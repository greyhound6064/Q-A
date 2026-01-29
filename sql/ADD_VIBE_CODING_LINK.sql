-- ==========================================
-- 🔗 바이브코딩 링크 기능 추가
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
-- 1️⃣ artworks 테이블에 vibe_link 컬럼 추가
-- ==========================================
ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS vibe_link TEXT;

-- vibe_link 컬럼에 코멘트 추가
COMMENT ON COLUMN artworks.vibe_link IS '바이브코딩 결과물 링크';

-- ==========================================
-- 2️⃣ 스키마 캐시 강제 갱신
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
-- - vibe_link (바이브코딩 결과물 링크)
--
-- 🔄 스키마 캐시 갱신됨
--
-- 💡 실행 후 artworks 테이블의 전체 컬럼 목록이 표시됩니다.
--
-- ==========================================
