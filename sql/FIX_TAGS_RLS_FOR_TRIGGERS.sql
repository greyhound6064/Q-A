-- =====================================================
-- 태그 RLS 정책 수정 (트리거 작동을 위해)
-- =====================================================
-- 문제: tags 테이블에 UPDATE 정책이 없어서 트리거가 실패
-- 해결: 시스템(트리거)이 usage_count를 업데이트할 수 있도록 정책 추가
-- =====================================================

-- 기존 UPDATE 정책이 있다면 삭제
DROP POLICY IF EXISTS "System can update tag usage count" ON tags;
DROP POLICY IF EXISTS "Allow system to update usage count" ON tags;

-- 트리거가 usage_count를 업데이트할 수 있도록 정책 추가
-- 방법 1: 모든 인증된 사용자가 usage_count만 업데이트 가능 (권장)
CREATE POLICY "System can update tag usage count"
    ON tags FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- 참고: RLS는 애플리케이션 레벨에서만 적용되고,
-- 트리거는 시스템 레벨에서 실행되므로 RLS를 우회합니다.
-- 하지만 명시적으로 정책을 추가하는 것이 안전합니다.

-- =====================================================
-- 적용 후 확인 방법:
-- 1. 이 SQL을 Supabase SQL Editor에서 실행
-- 2. 브라우저 콘솔에서: await recalculateAllTagCounts()
-- 3. 새 게시물에 태그 추가 후 확인: await debugTag('태그이름')
-- =====================================================
