-- =============================================
-- 쪽지 시스템 테이블 생성
-- =============================================
-- 작성일: 2026-01-26
-- 설명: 사용자 간 쪽지 기능을 위한 테이블 생성

-- 1. messages 테이블 생성
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT check_content_length CHECK (char_length(content) <= 500),
    CONSTRAINT check_different_users CHECK (sender_id != receiver_id)
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read) WHERE is_read = FALSE;

-- 3. RLS (Row Level Security) 활성화
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성

-- 받은 쪽지 조회: 수신자 본인만 조회 가능
CREATE POLICY "Users can view received messages"
    ON messages
    FOR SELECT
    USING (auth.uid() = receiver_id);

-- 보낸 쪽지 조회: 발신자 본인만 조회 가능
CREATE POLICY "Users can view sent messages"
    ON messages
    FOR SELECT
    USING (auth.uid() = sender_id);

-- 쪽지 전송: 인증된 사용자만 가능
CREATE POLICY "Authenticated users can send messages"
    ON messages
    FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- 쪽지 수정: 수신자만 읽음 상태 변경 가능
CREATE POLICY "Receivers can update read status"
    ON messages
    FOR UPDATE
    USING (auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = receiver_id);

-- 쪽지 삭제: 발신자 또는 수신자만 삭제 가능
CREATE POLICY "Users can delete their messages"
    ON messages
    FOR DELETE
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 5. 함수: 읽지 않은 쪽지 개수 조회
CREATE OR REPLACE FUNCTION get_unread_message_count(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM messages
        WHERE receiver_id = user_id AND is_read = FALSE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 트리거: 쪽지 전송 시 알림 (선택사항)
-- 실시간 알림을 위한 트리거 함수
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Supabase Realtime을 통해 알림 전송
    PERFORM pg_notify(
        'new_message',
        json_build_object(
            'receiver_id', NEW.receiver_id,
            'sender_id', NEW.sender_id,
            'message_id', NEW.id
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_message_created
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_message();

-- =============================================
-- 테스트 쿼리 (선택사항)
-- =============================================

-- 읽지 않은 쪽지 개수 조회 예시
-- SELECT get_unread_message_count('사용자UUID');

-- 받은 쪽지 목록 조회 예시
-- SELECT 
--     m.*,
--     p.nickname as sender_nickname,
--     p.avatar_url as sender_avatar
-- FROM messages m
-- LEFT JOIN profiles p ON p.user_id = m.sender_id
-- WHERE m.receiver_id = auth.uid()
-- ORDER BY m.created_at DESC;

-- 보낸 쪽지 목록 조회 예시
-- SELECT 
--     m.*,
--     p.nickname as receiver_nickname,
--     p.avatar_url as receiver_avatar
-- FROM messages m
-- LEFT JOIN profiles p ON p.user_id = m.receiver_id
-- WHERE m.sender_id = auth.uid()
-- ORDER BY m.created_at DESC;

-- =============================================
-- 완료
-- =============================================
-- 쪽지 시스템 테이블 생성 완료
-- 이제 프론트엔드에서 쪽지 기능을 사용할 수 있습니다.
