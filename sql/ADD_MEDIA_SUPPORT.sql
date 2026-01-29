-- ==========================================
-- 🎬 미디어 파일 지원 추가 (이미지, 영상, 음원)
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
-- 1️⃣ artworks 테이블에 media_type 컬럼 추가
-- ==========================================
-- 미디어 타입: 'image', 'video', 'audio'
ALTER TABLE artworks 
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video', 'audio'));

-- media_type에 인덱스 생성 (타입별 필터링)
CREATE INDEX IF NOT EXISTS artworks_media_type_idx ON artworks(media_type);

-- ==========================================
-- 2️⃣ 기존 데이터 업데이트
-- ==========================================
-- 기존 모든 작품을 'image' 타입으로 설정
UPDATE artworks SET media_type = 'image' WHERE media_type IS NULL;

-- ==========================================
-- 3️⃣ Storage 버킷 정책 업데이트 (다양한 파일 타입 지원)
-- ==========================================
-- 기존 정책은 유지되며, 이미지/영상/음원 모두 지원

-- ==========================================
-- 4️⃣ 스키마 캐시 강제 갱신
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
-- - media_type (미디어 타입: image, video, audio)
--
-- 🎨 지원 파일 형식:
-- - 이미지: jpg, jpeg, png, gif, webp
-- - 영상: mp4, webm, mov
-- - 음원: mp3, wav, ogg, m4a
--
-- 🔒 보안 정책 유지됨
-- 🔄 스키마 캐시 갱신됨
--
-- ==========================================
