-- ==========================================
-- 🔧 images 컬럼 문제 해결
-- ==========================================
-- 
-- 📋 이 파일을 실행하세요:
-- 1. Supabase 대시보드 접속
-- 2. SQL Editor 클릭
-- 3. 이 파일 전체 복사 & 붙여넣기
-- 4. Run 버튼 클릭
-- 
-- ==========================================

-- ==========================================
-- 1️⃣ artworks 테이블 확인
-- ==========================================
-- 현재 테이블 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'artworks' 
ORDER BY ordinal_position;

-- ==========================================
-- 2️⃣ images 컬럼 추가
-- ==========================================
-- images 컬럼이 없으면 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'artworks' AND column_name = 'images'
    ) THEN
        ALTER TABLE artworks ADD COLUMN images TEXT[];
        RAISE NOTICE 'images 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE 'images 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- ==========================================
-- 3️⃣ 기존 데이터 마이그레이션
-- ==========================================
-- image_url이 있고 images가 NULL인 경우 마이그레이션
UPDATE artworks 
SET images = ARRAY[image_url] 
WHERE images IS NULL AND image_url IS NOT NULL;

-- ==========================================
-- 4️⃣ 스키마 캐시 강제 갱신 (여러 번)
-- ==========================================
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- 잠시 대기
SELECT pg_sleep(1);

-- 다시 한 번 갱신
NOTIFY pgrst, 'reload schema';

-- ==========================================
-- 5️⃣ 최종 확인
-- ==========================================
-- artworks 테이블의 모든 컬럼 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'artworks' 
ORDER BY ordinal_position;

-- images 컬럼 존재 여부 확인
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'artworks' AND column_name = 'images'
        ) 
        THEN '✅ images 컬럼이 존재합니다!'
        ELSE '❌ images 컬럼이 없습니다. 다시 시도하세요.'
    END AS status;

-- ==========================================
-- ✅ 완료!
-- ==========================================
-- 
-- 위의 결과에서 images 컬럼이 보이는지 확인하세요.
-- 
-- 만약 여전히 오류가 발생한다면:
-- 1. 페이지 새로고침 (F5)
-- 2. 브라우저 캐시 삭제
-- 3. 5분 정도 기다린 후 재시도
-- 4. Supabase 프로젝트 재시작 (Settings → General → Restart project)
--
-- ==========================================
