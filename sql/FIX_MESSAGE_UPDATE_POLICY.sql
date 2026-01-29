-- =============================================
-- 쪽지 숨김 기능을 위한 RLS 정책 수정
-- =============================================
-- 작성일: 2026-01-27
-- 설명: 발신자와 수신자 모두 자신의 숨김 플래그를 업데이트할 수 있도록 RLS 정책 수정

-- 1. 기존 UPDATE 정책 삭제
DROP POLICY IF EXISTS "Receivers can update read status" ON messages;

-- 2. 발신자를 위한 UPDATE 정책 생성
-- 발신자는 hidden_by_sender만 업데이트 가능
CREATE POLICY "Senders can update their hidden flag"
    ON messages
    FOR UPDATE
    USING (auth.uid() = sender_id)
    WITH CHECK (
        auth.uid() = sender_id AND
        -- 발신자는 hidden_by_sender만 변경 가능 (is_read, hidden_by_receiver는 변경 불가)
        (is_read IS NOT DISTINCT FROM (SELECT is_read FROM messages WHERE id = messages.id)) AND
        (hidden_by_receiver IS NOT DISTINCT FROM (SELECT hidden_by_receiver FROM messages WHERE id = messages.id))
    );

-- 3. 수신자를 위한 UPDATE 정책 생성
-- 수신자는 is_read와 hidden_by_receiver를 업데이트 가능
CREATE POLICY "Receivers can update read status and hidden flag"
    ON messages
    FOR UPDATE
    USING (auth.uid() = receiver_id)
    WITH CHECK (
        auth.uid() = receiver_id AND
        -- 수신자는 hidden_by_sender를 변경할 수 없음
        (hidden_by_sender IS NOT DISTINCT FROM (SELECT hidden_by_sender FROM messages WHERE id = messages.id))
    );

-- =============================================
-- 검증 쿼리
-- =============================================
-- 정책이 제대로 생성되었는지 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'messages' AND cmd = 'UPDATE';

-- =============================================
-- 완료
-- =============================================
-- 이제 발신자와 수신자 모두 자신의 숨김 플래그를 업데이트할 수 있습니다.
-- - 발신자: hidden_by_sender 업데이트 가능
-- - 수신자: is_read, hidden_by_receiver 업데이트 가능
