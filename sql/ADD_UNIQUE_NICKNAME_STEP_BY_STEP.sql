-- ===================================
-- 닉네임 고유성 시스템 구축 (단계별 실행)
-- ===================================
-- ⚠️ 각 단계를 순서대로 실행하세요!

-- ===================================
-- STEP 1: 현재 상태 확인
-- ===================================
-- 중복 닉네임 확인
SELECT nickname, COUNT(*) as count
FROM profiles
WHERE nickname IS NOT NULL AND nickname != ''
GROUP BY nickname
HAVING COUNT(*) > 1;

-- 유효하지 않은 닉네임 확인
SELECT user_id, nickname, 
    CASE 
        WHEN nickname IS NULL OR nickname = '' THEN '빈 닉네임'
        WHEN LENGTH(nickname) < 3 THEN '너무 짧음'
        WHEN LENGTH(nickname) > 20 THEN '너무 김'
        WHEN nickname !~ '^[a-zA-Z0-9가-힣_]+$' THEN '유효하지 않은 문자'
        WHEN LOWER(nickname) IN ('admin', 'system', 'anonymous', '익명', 'moderator', 'mod') THEN '예약어'
        ELSE '정상'
    END as status
FROM profiles
WHERE nickname IS NULL 
   OR nickname = ''
   OR LENGTH(nickname) < 3 
   OR LENGTH(nickname) > 20
   OR nickname !~ '^[a-zA-Z0-9가-힣_]+$'
   OR LOWER(nickname) IN ('admin', 'system', 'anonymous', '익명', 'moderator', 'mod');

-- ===================================
-- STEP 2: 기존 데이터 정규화 및 수정
-- ===================================
-- 2-1. 빈 닉네임 수정
UPDATE profiles 
SET nickname = 'user_' || SUBSTRING(user_id::text, 1, 8)
WHERE nickname IS NULL OR nickname = '' OR TRIM(nickname) = '';

-- 2-2. 공백 제거 및 소문자 변환
UPDATE profiles 
SET nickname = LOWER(TRIM(nickname))
WHERE nickname IS NOT NULL AND nickname != '';

-- 2-3. 유효하지 않은 문자 제거
UPDATE profiles
SET nickname = REGEXP_REPLACE(nickname, '[^a-z0-9가-힣_]', '', 'g')
WHERE nickname !~ '^[a-z0-9가-힣_]+$';

-- 2-4. 연속된 언더스코어 제거
UPDATE profiles
SET nickname = REGEXP_REPLACE(nickname, '_+', '_', 'g')
WHERE nickname ~ '__+';

-- 2-5. 시작/끝 언더스코어 제거
UPDATE profiles
SET nickname = TRIM(BOTH '_' FROM nickname)
WHERE nickname LIKE '\_%' OR nickname LIKE '%\_';

-- 2-6. 너무 짧은 닉네임 수정 (3자 미만)
UPDATE profiles
SET nickname = nickname || '_' || SUBSTRING(user_id::text, 1, 4)
WHERE LENGTH(nickname) < 3;

-- 2-7. 너무 긴 닉네임 수정 (20자 초과)
UPDATE profiles
SET nickname = SUBSTRING(nickname, 1, 20)
WHERE LENGTH(nickname) > 20;

-- 2-8. 예약어 수정
UPDATE profiles
SET nickname = nickname || '_user'
WHERE LOWER(nickname) IN ('admin', 'system', 'anonymous', '익명', 'moderator', 'mod', 'root', 'user');

-- 2-9. 중복 닉네임 처리 (있다면)
-- 중복된 닉네임에 순번 추가
WITH duplicates AS (
    SELECT user_id, nickname,
           ROW_NUMBER() OVER (PARTITION BY LOWER(nickname) ORDER BY created_at) as rn
    FROM profiles
    WHERE nickname IS NOT NULL
)
UPDATE profiles p
SET nickname = p.nickname || '_' || d.rn
FROM duplicates d
WHERE p.user_id = d.user_id AND d.rn > 1;

-- ===================================
-- STEP 3: 인덱스 생성
-- ===================================
-- 3-1. 기본 닉네임 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON profiles(nickname);

-- 3-2. 대소문자 구분 없는 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_nickname_lower ON profiles(LOWER(nickname));

-- 3-3. 복합 인덱스 (검색 최적화)
CREATE INDEX IF NOT EXISTS idx_profiles_search ON profiles(nickname, user_id, avatar_url);

-- ===================================
-- STEP 4: 함수 생성
-- ===================================
-- 4-1. 닉네임 정규화 함수
CREATE OR REPLACE FUNCTION normalize_nickname()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.nickname IS NOT NULL THEN
        NEW.nickname = LOWER(TRIM(NEW.nickname));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4-2. 닉네임 유효성 검사 함수
CREATE OR REPLACE FUNCTION validate_nickname()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.nickname IS NULL THEN
        RETURN NEW;
    END IF;
    
    IF LENGTH(NEW.nickname) < 3 OR LENGTH(NEW.nickname) > 20 THEN
        RAISE EXCEPTION '닉네임은 3-20자여야 합니다.';
    END IF;
    
    IF NEW.nickname !~ '^[a-zA-Z0-9가-힣_]+$' THEN
        RAISE EXCEPTION '닉네임은 영문, 숫자, 한글, 언더스코어(_)만 사용 가능합니다.';
    END IF;
    
    IF LOWER(NEW.nickname) IN ('admin', 'system', 'anonymous', '익명', 'moderator', 'mod', 'root', 'user') THEN
        RAISE EXCEPTION '사용할 수 없는 닉네임입니다.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- STEP 5: 트리거 생성
-- ===================================
-- 5-1. 정규화 트리거
DROP TRIGGER IF EXISTS normalize_nickname_trigger ON profiles;
CREATE TRIGGER normalize_nickname_trigger
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION normalize_nickname();

-- 5-2. 유효성 검사 트리거
DROP TRIGGER IF EXISTS validate_nickname_trigger ON profiles;
CREATE TRIGGER validate_nickname_trigger
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION validate_nickname();

-- ===================================
-- STEP 6: UNIQUE 제약조건 추가
-- ===================================
ALTER TABLE profiles 
ADD CONSTRAINT unique_nickname UNIQUE (nickname);

-- ===================================
-- STEP 7: RLS 정책 설정
-- ===================================
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
CREATE POLICY "Anyone can view profiles" ON profiles
    FOR SELECT USING (true);

-- ===================================
-- STEP 8: 최종 확인
-- ===================================
-- 모든 닉네임이 유효한지 확인
SELECT COUNT(*) as total_profiles,
       COUNT(CASE WHEN nickname IS NOT NULL AND nickname != '' THEN 1 END) as with_nickname,
       COUNT(CASE WHEN LENGTH(nickname) >= 3 AND LENGTH(nickname) <= 20 THEN 1 END) as valid_length,
       COUNT(CASE WHEN nickname ~ '^[a-z0-9가-힣_]+$' THEN 1 END) as valid_pattern
FROM profiles;

-- 중복 확인 (없어야 함)
SELECT nickname, COUNT(*) as count
FROM profiles
WHERE nickname IS NOT NULL
GROUP BY nickname
HAVING COUNT(*) > 1;

-- ===================================
-- 완료!
-- ===================================
-- 이제 프론트엔드에서 닉네임 검증이 작동합니다.
