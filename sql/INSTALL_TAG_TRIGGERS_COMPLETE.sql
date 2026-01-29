-- =====================================================
-- 태그 시스템 완전 수정 (한 번에 실행)
-- =====================================================
-- 이 파일을 Supabase SQL Editor에서 한 번에 실행하세요
-- =====================================================

-- ========== 1단계: 기존 트리거 및 함수 삭제 ==========
DROP TRIGGER IF EXISTS trigger_increment_tag_usage ON artwork_tags;
DROP TRIGGER IF EXISTS trigger_decrement_tag_usage ON artwork_tags;
DROP FUNCTION IF EXISTS increment_tag_usage_count();
DROP FUNCTION IF EXISTS decrement_tag_usage_count();

-- ========== 2단계: RLS 정책 추가 (UPDATE 허용) ==========
DROP POLICY IF EXISTS "System can update tag usage count" ON tags;

CREATE POLICY "System can update tag usage count"
    ON tags FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- ========== 3단계: 트리거 함수 생성 ==========

-- INSERT 트리거 함수 (SECURITY DEFINER로 RLS 우회)
CREATE OR REPLACE FUNCTION increment_tag_usage_count()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE tags
    SET usage_count = usage_count + 1
    WHERE id = NEW.tag_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- DELETE 트리거 함수 (SECURITY DEFINER로 RLS 우회)
CREATE OR REPLACE FUNCTION decrement_tag_usage_count()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE tags
    SET usage_count = GREATEST(usage_count - 1, 0)
    WHERE id = OLD.tag_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ========== 4단계: 트리거 생성 ==========

CREATE TRIGGER trigger_increment_tag_usage
AFTER INSERT ON artwork_tags
FOR EACH ROW
EXECUTE FUNCTION increment_tag_usage_count();

CREATE TRIGGER trigger_decrement_tag_usage
AFTER DELETE ON artwork_tags
FOR EACH ROW
EXECUTE FUNCTION decrement_tag_usage_count();

-- =====================================================
-- 설치 완료!
-- =====================================================
-- 다음 단계:
-- 1. 브라우저 콘솔(F12) 열기
-- 2. await recalculateAllTagCounts() 실행
-- 3. await checkAllTags() 로 확인
-- 4. 새 게시물에 태그 추가하여 테스트
-- =====================================================

-- 트리거 확인 쿼리 (선택사항)
-- SELECT * FROM pg_trigger WHERE tgname LIKE '%tag_usage%';
