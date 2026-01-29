-- =============================================
-- 쪽지 숨김 기능을 위한 RLS 정책 수정 (간단 버전)
-- =============================================
-- 작성일: 2026-01-27
-- 설명: 발신자와 수신자 모두 메시지를 업데이트할 수 있도록 허용

-- 1. 기존 UPDATE 정책 삭제
DROP POLICY IF EXISTS "Receivers can update read status" ON messages;

-- 2. 새로운 UPDATE 정책 생성 (발신자 또는 수신자 모두 업데이트 가능)
CREATE POLICY "Users can update their messages"
    ON messages
    FOR UPDATE
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- =============================================
-- 검증 쿼리
-- =============================================
-- 정책이 제대로 생성되었는지 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'messages' AND cmd = 'UPDATE';

-- =============================================
-- 완료
-- =============================================
-- 이제 발신자와 수신자 모두 메시지를 업데이트할 수 있습니다.
-- 더 세밀한 권한 제어가 필요하면 FIX_MESSAGE_UPDATE_POLICY.sql을 사용하세요.
