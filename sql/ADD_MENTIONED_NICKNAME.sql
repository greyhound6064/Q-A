-- artwork_comments 테이블에 mentioned_nickname 컬럼 추가
-- 답글 대상의 닉네임을 저장하여 @멘션 표시에 사용

ALTER TABLE artwork_comments
ADD COLUMN IF NOT EXISTS mentioned_nickname TEXT;

COMMENT ON COLUMN artwork_comments.mentioned_nickname IS '답글 대상의 닉네임 (동일 계층 답글 시스템용)';
