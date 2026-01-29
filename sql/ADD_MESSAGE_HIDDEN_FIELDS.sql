-- =============================================
-- 쪽지 숨김 기능 추가
-- =============================================
-- 작성일: 2026-01-26
-- 설명: 사용자별로 대화를 숨길 수 있는 필드 추가

-- 1. messages 테이블에 숨김 필드 추가
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS hidden_by_sender BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hidden_by_receiver BOOLEAN DEFAULT FALSE;

-- 2. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_messages_hidden_by_sender 
ON messages(sender_id, hidden_by_sender) 
WHERE hidden_by_sender = FALSE;

CREATE INDEX IF NOT EXISTS idx_messages_hidden_by_receiver 
ON messages(receiver_id, hidden_by_receiver) 
WHERE hidden_by_receiver = FALSE;

-- 3. 기존 데이터 업데이트 (모두 숨김 해제 상태로)
UPDATE messages 
SET hidden_by_sender = FALSE, hidden_by_receiver = FALSE 
WHERE hidden_by_sender IS NULL OR hidden_by_receiver IS NULL;

-- =============================================
-- 사용 방법
-- =============================================
-- 발신자가 대화 숨기기:
-- UPDATE messages SET hidden_by_sender = TRUE 
-- WHERE sender_id = '사용자ID' AND receiver_id = '상대방ID';

-- 수신자가 대화 숨기기:
-- UPDATE messages SET hidden_by_receiver = TRUE 
-- WHERE receiver_id = '사용자ID' AND sender_id = '상대방ID';

-- 숨기지 않은 메시지만 조회:
-- SELECT * FROM messages 
-- WHERE (sender_id = '사용자ID' AND hidden_by_sender = FALSE)
--    OR (receiver_id = '사용자ID' AND hidden_by_receiver = FALSE);
