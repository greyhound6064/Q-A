-- =====================================================
-- 성능 최적화를 위한 인덱스 추가
-- =====================================================
-- 작성일: 2026-01-31
-- 목적: 게시물 로딩 속도 개선을 위한 인덱스 추가
-- =====================================================

-- 1. artworks 테이블 인덱스
-- =====================================================

-- post_type과 is_public을 함께 조회하는 경우가 많으므로 복합 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_artworks_post_type_public 
ON artworks(post_type, is_public, created_at DESC);

-- user_id로 작품을 조회하는 경우 (프로필 페이지)
CREATE INDEX IF NOT EXISTS idx_artworks_user_id 
ON artworks(user_id, created_at DESC);

-- created_at으로 정렬하는 경우
CREATE INDEX IF NOT EXISTS idx_artworks_created_at 
ON artworks(created_at DESC);

-- 2. artwork_likes 테이블 인덱스
-- =====================================================

-- artwork_id로 좋아요/싫어요 조회
CREATE INDEX IF NOT EXISTS idx_artwork_likes_artwork_id 
ON artwork_likes(artwork_id, like_type);

-- user_id와 artwork_id로 사용자 반응 조회
CREATE INDEX IF NOT EXISTS idx_artwork_likes_user_artwork 
ON artwork_likes(user_id, artwork_id);

-- 3. artwork_comments 테이블 인덱스
-- =====================================================

-- artwork_id로 댓글 조회
CREATE INDEX IF NOT EXISTS idx_artwork_comments_artwork_id 
ON artwork_comments(artwork_id, created_at ASC);

-- parent_comment_id로 대댓글 조회
CREATE INDEX IF NOT EXISTS idx_artwork_comments_parent_id 
ON artwork_comments(parent_comment_id);

-- 4. artwork_tags 테이블 인덱스
-- =====================================================

-- artwork_id로 태그 조회
CREATE INDEX IF NOT EXISTS idx_artwork_tags_artwork_id 
ON artwork_tags(artwork_id);

-- tag_id로 작품 조회
CREATE INDEX IF NOT EXISTS idx_artwork_tags_tag_id 
ON artwork_tags(tag_id);

-- 5. profiles 테이블 인덱스
-- =====================================================

-- user_id로 프로필 조회 (이미 UNIQUE 제약조건이 있어 인덱스 자동 생성됨)
-- nickname으로 프로필 조회 (이미 UNIQUE 제약조건이 있어 인덱스 자동 생성됨)

-- 6. saved_artworks 테이블 인덱스
-- =====================================================

-- user_id로 저장된 작품 조회
CREATE INDEX IF NOT EXISTS idx_saved_artworks_user_id 
ON saved_artworks(user_id, created_at DESC);

-- artwork_id로 저장 여부 확인
CREATE INDEX IF NOT EXISTS idx_saved_artworks_artwork_id 
ON saved_artworks(artwork_id);

-- 7. follows 테이블 인덱스
-- =====================================================

-- follower_id로 팔로잉 목록 조회
CREATE INDEX IF NOT EXISTS idx_follows_follower_id 
ON follows(follower_id);

-- following_id로 팔로워 목록 조회
CREATE INDEX IF NOT EXISTS idx_follows_following_id 
ON follows(following_id);

-- 8. messages 테이블 인덱스
-- =====================================================

-- sender_id와 receiver_id로 대화 조회
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver 
ON messages(sender_id, receiver_id, created_at DESC);

-- receiver_id와 is_read로 읽지 않은 메시지 조회
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread 
ON messages(receiver_id, is_read);

-- =====================================================
-- 인덱스 생성 완료
-- =====================================================

-- 인덱스 확인 쿼리:
-- SELECT * FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

-- 인덱스 사용 통계 확인:
-- SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public' ORDER BY idx_scan DESC;
