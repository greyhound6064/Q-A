/**
 * @file ADD_PROFILE_STATUS.sql
 * @description 프로필에 상태(status) 컬럼 추가 (다중 선택 가능)
 * @created 2026-01-26
 * @updated 2026-01-26 - JSON 배열로 변경하여 다중 상태 지원
 */

-- 기존 CHECK 제약 조건 제거 (있다면)
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_status_check;

-- profiles 테이블에 status 컬럼 추가 (JSON 배열로 저장)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT '[]';

-- 기존 레코드에 기본값 설정
UPDATE profiles
SET status = '[]'
WHERE status IS NULL OR status = '';

-- 상태 정보 (다중 선택 가능):
-- 'breathing': 숨만 쉬는 중 😴
-- 'planning': 작품 기획 중 💭
-- 'developing': 작품 개발 중 🔥

-- 예시: ["breathing", "developing"] 형태로 저장됨
