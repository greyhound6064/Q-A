-- =====================================================
-- 태그 사용 횟수 자동 관리 트리거
-- =====================================================
-- 목적: artwork_tags 테이블의 INSERT/DELETE 시 
--       tags.usage_count를 자동으로 증가/감소
-- =====================================================

-- 기존 트리거 삭제 (있다면)
DROP TRIGGER IF EXISTS trigger_increment_tag_usage ON artwork_tags;
DROP TRIGGER IF EXISTS trigger_decrement_tag_usage ON artwork_tags;
DROP FUNCTION IF EXISTS increment_tag_usage_count();
DROP FUNCTION IF EXISTS decrement_tag_usage_count();

-- 1. artwork_tags INSERT 시 usage_count 증가
-- SECURITY DEFINER: RLS를 우회하여 실행 (시스템 권한으로 실행)
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

CREATE TRIGGER trigger_increment_tag_usage
AFTER INSERT ON artwork_tags
FOR EACH ROW
EXECUTE FUNCTION increment_tag_usage_count();


-- 2. artwork_tags DELETE 시 usage_count 감소
-- SECURITY DEFINER: RLS를 우회하여 실행 (시스템 권한으로 실행)
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

CREATE TRIGGER trigger_decrement_tag_usage
AFTER DELETE ON artwork_tags
FOR EACH ROW
EXECUTE FUNCTION decrement_tag_usage_count();


-- =====================================================
-- 사용 방법:
-- 1. Supabase SQL Editor에서 이 스크립트 실행
-- 2. 기존 데이터 재계산: 브라우저 콘솔에서 recalculateAllTagCounts() 실행
-- 3. 이후부터는 자동으로 관리됨
-- =====================================================
