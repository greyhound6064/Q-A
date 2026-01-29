-- ===================================
-- 닉네임 고유성 및 검색 최적화
-- ===================================

-- 1. 기존 중복 닉네임 처리 (실행 전 확인 필요)
-- 중복된 닉네임이 있는지 확인
SELECT nickname, COUNT(*) as count
FROM profiles
WHERE nickname IS NOT NULL AND nickname != ''
GROUP BY nickname
HAVING COUNT(*) > 1;

-- 중복이 있다면 수동으로 처리 후 진행
-- 예: UPDATE profiles SET nickname = nickname || '_' || user_id WHERE ...

-- 2. 닉네임 UNIQUE 제약조건 추가
ALTER TABLE profiles 
ADD CONSTRAINT unique_nickname UNIQUE (nickname);

-- 3. 닉네임 NOT NULL 제약조건 추가 (선택사항)
-- 모든 사용자가 닉네임을 가져야 한다면:
-- ALTER TABLE profiles ALTER COLUMN nickname SET NOT NULL;

-- 4. 닉네임 검색 성능 향상을 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON profiles(nickname);

-- 5. 대소문자 구분 없는 검색을 위한 인덱스 (PostgreSQL)
CREATE INDEX IF NOT EXISTS idx_profiles_nickname_lower ON profiles(LOWER(nickname));

-- 6. 닉네임 정규화 함수 (소문자 변환 + 공백 제거)
CREATE OR REPLACE FUNCTION normalize_nickname()
RETURNS TRIGGER AS $$
BEGIN
    -- 닉네임이 NULL이 아니면 정규화
    IF NEW.nickname IS NOT NULL THEN
        NEW.nickname = LOWER(TRIM(NEW.nickname));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. 닉네임 정규화 트리거 생성
DROP TRIGGER IF EXISTS normalize_nickname_trigger ON profiles;
CREATE TRIGGER normalize_nickname_trigger
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION normalize_nickname();

-- 8. 닉네임 유효성 검사 함수
CREATE OR REPLACE FUNCTION validate_nickname()
RETURNS TRIGGER AS $$
BEGIN
    -- 닉네임이 NULL이면 통과
    IF NEW.nickname IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- 길이 체크 (3-20자)
    IF LENGTH(NEW.nickname) < 3 OR LENGTH(NEW.nickname) > 20 THEN
        RAISE EXCEPTION '닉네임은 3-20자여야 합니다.';
    END IF;
    
    -- 패턴 체크 (영문, 숫자, 한글, 언더스코어만 허용)
    IF NEW.nickname !~ '^[a-zA-Z0-9가-힣_]+$' THEN
        RAISE EXCEPTION '닉네임은 영문, 숫자, 한글, 언더스코어(_)만 사용 가능합니다.';
    END IF;
    
    -- 예약어 체크
    IF LOWER(NEW.nickname) IN ('admin', 'system', 'anonymous', '익명', 'moderator', 'mod') THEN
        RAISE EXCEPTION '사용할 수 없는 닉네임입니다.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. 닉네임 유효성 검사 트리거 생성
DROP TRIGGER IF EXISTS validate_nickname_trigger ON profiles;
CREATE TRIGGER validate_nickname_trigger
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION validate_nickname();

-- 10. 검색 성능 향상을 위한 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_search ON profiles(nickname, user_id, avatar_url);

-- 11. RLS 정책 확인 (닉네임 중복 체크를 위해 읽기 권한 필요)
-- 이미 있다면 스킵
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
CREATE POLICY "Anyone can view profiles" ON profiles
    FOR SELECT USING (true);

-- 12. 기존 데이터 정규화 (이미 있는 닉네임들을 소문자로 변환)
UPDATE profiles 
SET nickname = LOWER(TRIM(nickname))
WHERE nickname IS NOT NULL AND nickname != '';

-- ===================================
-- 실행 순서 및 주의사항
-- ===================================
-- ⚠️ 중요: 아래 순서대로 실행하세요!
--
-- Step 1: 중복 닉네임 확인 (1번 쿼리)
-- Step 2: 기존 데이터 정규화 (12번 쿼리) ⭐ 먼저 실행
-- Step 3: 유효하지 않은 닉네임 수정 (아래 쿼리)
-- Step 4: 인덱스 생성 (4, 5, 10번)
-- Step 5: 함수 및 트리거 생성 (6, 7, 8, 9번)
-- Step 6: UNIQUE 제약조건 추가 (2번)
-- Step 7: RLS 정책 설정 (11번)

-- ===================================
-- 추가: 유효하지 않은 닉네임 수정
-- ===================================
-- 트리거 생성 전에 먼저 실행하세요!

-- 빈 닉네임이나 NULL인 경우 기본값 설정
UPDATE profiles 
SET nickname = 'user_' || SUBSTRING(user_id::text, 1, 8)
WHERE nickname IS NULL OR nickname = '' OR TRIM(nickname) = '';

-- 유효하지 않은 문자가 포함된 닉네임 수정
-- (영문, 숫자, 한글, 언더스코어가 아닌 문자 제거)
UPDATE profiles
SET nickname = REGEXP_REPLACE(LOWER(TRIM(nickname)), '[^a-z0-9가-힣_]', '', 'g')
WHERE nickname !~ '^[a-zA-Z0-9가-힣_]+$';

-- 너무 짧은 닉네임 수정 (3자 미만)
UPDATE profiles
SET nickname = nickname || '_' || SUBSTRING(user_id::text, 1, 4)
WHERE LENGTH(nickname) < 3;

-- 너무 긴 닉네임 수정 (20자 초과)
UPDATE profiles
SET nickname = SUBSTRING(nickname, 1, 20)
WHERE LENGTH(nickname) > 20;

-- 예약어 사용 중인 닉네임 수정
UPDATE profiles
SET nickname = nickname || '_user'
WHERE LOWER(nickname) IN ('admin', 'system', 'anonymous', '익명', 'moderator', 'mod', 'root', 'user');

-- 언더스코어로 시작하거나 끝나는 닉네임 수정
UPDATE profiles
SET nickname = TRIM(BOTH '_' FROM nickname)
WHERE nickname LIKE '\_%' OR nickname LIKE '%\_';

-- 연속된 언더스코어 제거
UPDATE profiles
SET nickname = REGEXP_REPLACE(nickname, '_+', '_', 'g')
WHERE nickname ~ '__+';

-- 수정 후 다시 길이 체크 (3자 미만이면 접미사 추가)
UPDATE profiles
SET nickname = nickname || '_' || SUBSTRING(user_id::text, 1, 4)
WHERE LENGTH(nickname) < 3;
