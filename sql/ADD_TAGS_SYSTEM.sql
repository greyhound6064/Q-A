-- ================================================
-- 태그 시스템 추가
-- ================================================
-- 작성일: 2026-01-25
-- 설명: 작품에 태그를 추가하여 검색 및 필터링 기능 강화

-- 1. tags 테이블 생성
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. artwork_tags 연결 테이블 생성 (다대다 관계)
CREATE TABLE IF NOT EXISTS artwork_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artwork_id BIGINT REFERENCES artworks(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(artwork_id, tag_id)
);

-- 3. 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_artwork_tags_artwork ON artwork_tags(artwork_id);
CREATE INDEX IF NOT EXISTS idx_artwork_tags_tag ON artwork_tags(tag_id);

-- 4. RLS (Row Level Security) 정책 설정
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE artwork_tags ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 태그 읽기 가능
CREATE POLICY "Tags are viewable by everyone"
    ON tags FOR SELECT
    USING (true);

-- 로그인한 사용자만 태그 생성 가능
CREATE POLICY "Authenticated users can create tags"
    ON tags FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- artwork_tags 읽기 정책
CREATE POLICY "Artwork tags are viewable by everyone"
    ON artwork_tags FOR SELECT
    USING (true);

-- artwork_tags 생성 정책 (작품 소유자만)
CREATE POLICY "Users can tag their own artworks"
    ON artwork_tags FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM artworks
            WHERE artworks.id = artwork_tags.artwork_id
            AND artworks.user_id = auth.uid()
        )
    );

-- artwork_tags 삭제 정책 (작품 소유자만)
CREATE POLICY "Users can untag their own artworks"
    ON artwork_tags FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM artworks
            WHERE artworks.id = artwork_tags.artwork_id
            AND artworks.user_id = auth.uid()
        )
    );
