-- =====================================================
-- 닉네임 변경 제한 시스템 (30일에 2번)
-- =====================================================
-- 작성일: 2026-01-26
-- 설명: 사용자의 닉네임 변경 이력을 추적하고 30일 내 2번으로 제한
-- =====================================================

-- 1. 닉네임 변경 이력 테이블 생성
CREATE TABLE IF NOT EXISTS nickname_change_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    old_nickname TEXT,
    new_nickname TEXT NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_nickname_history_user_id ON nickname_change_history(user_id);
CREATE INDEX IF NOT EXISTS idx_nickname_history_changed_at ON nickname_change_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_nickname_history_user_changed ON nickname_change_history(user_id, changed_at DESC);

-- 3. RLS (Row Level Security) 활성화
ALTER TABLE nickname_change_history ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책: 본인의 변경 이력만 조회 가능
DROP POLICY IF EXISTS "Users can view own nickname history" ON nickname_change_history;
CREATE POLICY "Users can view own nickname history"
    ON nickname_change_history
    FOR SELECT
    USING (auth.uid() = user_id);

-- 5. RLS 정책: 시스템만 삽입 가능 (트리거를 통해)
DROP POLICY IF EXISTS "System can insert nickname history" ON nickname_change_history;
CREATE POLICY "System can insert nickname history"
    ON nickname_change_history
    FOR INSERT
    WITH CHECK (true);

-- 6. 닉네임 변경 횟수 확인 함수
CREATE OR REPLACE FUNCTION check_nickname_change_limit(p_user_id UUID)
RETURNS TABLE(
    change_count BIGINT,
    remaining_changes INT,
    next_available_date TIMESTAMPTZ,
    can_change BOOLEAN,
    recent_changes JSONB
) AS $$
DECLARE
    v_count BIGINT;
    v_oldest_change TIMESTAMPTZ;
    v_changes JSONB;
BEGIN
    -- 최근 30일 내 변경 횟수 조회
    SELECT 
        COUNT(*),
        MIN(changed_at),
        jsonb_agg(
            jsonb_build_object(
                'old_nickname', old_nickname,
                'new_nickname', new_nickname,
                'changed_at', changed_at
            ) ORDER BY changed_at DESC
        )
    INTO v_count, v_oldest_change, v_changes
    FROM nickname_change_history
    WHERE user_id = p_user_id
      AND changed_at > NOW() - INTERVAL '30 days';
    
    -- 결과 반환
    RETURN QUERY SELECT
        COALESCE(v_count, 0)::BIGINT as change_count,
        CASE 
            WHEN COALESCE(v_count, 0) >= 2 THEN 0
            ELSE (2 - COALESCE(v_count, 0))::INT
        END as remaining_changes,
        CASE 
            WHEN COALESCE(v_count, 0) >= 2 THEN v_oldest_change + INTERVAL '30 days'
            ELSE NULL
        END as next_available_date,
        CASE 
            WHEN COALESCE(v_count, 0) < 2 THEN true
            ELSE false
        END as can_change,
        COALESCE(v_changes, '[]'::jsonb) as recent_changes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 닉네임 변경 시 이력 자동 기록 트리거 함수
CREATE OR REPLACE FUNCTION record_nickname_change()
RETURNS TRIGGER AS $$
BEGIN
    -- 닉네임이 실제로 변경된 경우에만 기록
    IF (OLD.nickname IS DISTINCT FROM NEW.nickname) THEN
        -- 변경 제한 확인
        DECLARE
            v_can_change BOOLEAN;
            v_change_count BIGINT;
            v_next_date TIMESTAMPTZ;
        BEGIN
            SELECT can_change, change_count, next_available_date
            INTO v_can_change, v_change_count, v_next_date
            FROM check_nickname_change_limit(NEW.user_id);
            
            -- 변경 불가능한 경우 에러 발생
            IF NOT v_can_change THEN
                RAISE EXCEPTION '닉네임 변경 제한: 30일 내 2번까지만 변경할 수 있습니다. 다음 변경 가능 날짜: %', 
                    TO_CHAR(v_next_date, 'YYYY-MM-DD HH24:MI:SS');
            END IF;
            
            -- 변경 이력 기록
            INSERT INTO nickname_change_history (user_id, old_nickname, new_nickname, changed_at)
            VALUES (NEW.user_id, OLD.nickname, NEW.nickname, NOW());
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 트리거 생성 (profiles 테이블의 nickname 변경 시 자동 실행)
DROP TRIGGER IF EXISTS trigger_record_nickname_change ON profiles;
CREATE TRIGGER trigger_record_nickname_change
    BEFORE UPDATE OF nickname ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION record_nickname_change();

-- 9. 기존 사용자의 초기 이력 생성 (선택사항)
-- 주의: 이미 닉네임이 설정된 사용자는 초기 이력이 없으므로, 
--       첫 변경 시 제한 없이 변경 가능하도록 하려면 이 부분을 실행하지 않습니다.
-- INSERT INTO nickname_change_history (user_id, old_nickname, new_nickname, changed_at)
-- SELECT user_id, NULL, nickname, created_at
-- FROM profiles
-- WHERE nickname IS NOT NULL
-- ON CONFLICT DO NOTHING;

-- =====================================================
-- 사용 예시 (JavaScript에서 호출)
-- =====================================================
-- // 닉네임 변경 가능 여부 확인
-- const { data, error } = await supabase.rpc('check_nickname_change_limit', {
--     p_user_id: userId
-- });
-- 
-- if (data && data.length > 0) {
--     const result = data[0];
--     console.log('변경 횟수:', result.change_count);
--     console.log('남은 횟수:', result.remaining_changes);
--     console.log('변경 가능:', result.can_change);
--     console.log('다음 가능 날짜:', result.next_available_date);
--     console.log('최근 변경 이력:', result.recent_changes);
-- }
-- =====================================================

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '✅ 닉네임 변경 제한 시스템이 성공적으로 설정되었습니다.';
    RAISE NOTICE '   - 30일 내 최대 2번까지 변경 가능';
    RAISE NOTICE '   - 변경 이력 자동 기록';
    RAISE NOTICE '   - check_nickname_change_limit() 함수로 제한 확인 가능';
END $$;
