-- ==========================================
-- 🎨 자유 게시판 텍스트 전용 게시물 지원
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
-- 1️⃣ image_url 컬럼 NULL 허용으로 변경
-- ==========================================
-- 자유 게시판에서 파일 없이 텍스트만 게시할 수 있도록 변경
ALTER TABLE artworks 
ALTER COLUMN image_url DROP NOT NULL;

-- ==========================================
-- 2️⃣ images 컬럼도 NULL 허용 확인 (이미 NULL 허용일 가능성 높음)
-- ==========================================
-- images 컬럼이 있다면 NULL 허용 확인
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'artworks' 
        AND column_name = 'images'
    ) THEN
        ALTER TABLE artworks 
        ALTER COLUMN images DROP NOT NULL;
    END IF;
END $$;

-- ==========================================
-- 3️⃣ 스키마 캐시 강제 갱신
-- ==========================================
NOTIFY pgrst, 'reload schema';

-- ==========================================
-- 4️⃣ 변경 사항 확인
-- ==========================================
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'artworks' 
AND column_name IN ('image_url', 'images')
ORDER BY ordinal_position;

-- ==========================================
-- ✅ 설정 완료!
-- ==========================================
-- 
-- 📝 변경 사항:
-- - image_url: NOT NULL → NULL 허용
-- - images: NULL 허용 확인
--
-- 💡 이제 자유 게시판에서 파일 없이 텍스트만 게시할 수 있습니다.
-- 💡 자유 게시판은 여전히 애플리케이션 레벨에서 파일을 필수로 요구합니다.
--
-- ==========================================
