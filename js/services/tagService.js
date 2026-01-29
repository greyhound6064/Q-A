/**
 * @file tagService.js
 * @description 태그 관련 비즈니스 로직 통합 서비스
 */

// ========== 태그 캐시 ==========
const tagsCache = new Map();
const artworkTagsCache = new Map();

/**
 * 태그 캐시 초기화
 */
export function clearTagsCache() {
    tagsCache.clear();
    artworkTagsCache.clear();
}

/**
 * 작품의 태그 조회
 * @param {string} artworkId - 작품 ID
 * @param {boolean} useCache - 캐시 사용 여부
 * @returns {Promise<Array<string>>} 태그 이름 배열
 */
export async function getArtworkTags(artworkId, useCache = true) {
    // 캐시 확인
    if (useCache && artworkTagsCache.has(artworkId)) {
        return artworkTagsCache.get(artworkId);
    }
    
    try {
        const { data: artworkTags, error } = await window._supabase
            .from('artwork_tags')
            .select('tag_id, tags(name)')
            .eq('artwork_id', artworkId);
        
        if (error) throw error;
        
        const tags = artworkTags?.map(at => at.tags.name) || [];
        
        // 캐시 저장
        artworkTagsCache.set(artworkId, tags);
        
        return tags;
    } catch (err) {
        console.error('작품 태그 조회 에러:', err);
        return [];
    }
}

/**
 * 태그 검색 (자동완성용)
 * @param {string} searchTerm - 검색어
 * @param {number} limit - 최대 결과 수
 * @returns {Promise<Array>} 태그 배열 { name, usage_count }
 */
export async function searchTags(searchTerm, limit = 10) {
    try {
        const { data: tags, error } = await window._supabase
            .from('tags')
            .select('name, usage_count')
            .ilike('name', `${searchTerm}%`)
            .gt('usage_count', 0)
            .order('usage_count', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        
        return tags || [];
    } catch (err) {
        console.error('태그 검색 에러:', err);
        return [];
    }
}

/**
 * 인기 태그 조회
 * @param {number} limit - 최대 결과 수
 * @returns {Promise<Array>} 태그 배열 { name, usage_count }
 */
export async function getPopularTags(limit = 20) {
    try {
        const { data: tags, error } = await window._supabase
            .from('tags')
            .select('name, usage_count')
            .gt('usage_count', 0)
            .order('usage_count', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        
        return tags || [];
    } catch (err) {
        console.error('인기 태그 조회 에러:', err);
        return [];
    }
}

/**
 * 작품에 태그 추가
 * @param {string} artworkId - 작품 ID
 * @param {Array<string>} tagNames - 태그 이름 배열
 * @returns {Promise<boolean>} 성공 여부
 */
/**
 * 작품에 태그 추가
 * @param {string} artworkId - 작품 ID
 * @param {Array<string>} tagNames - 태그 이름 배열
 * @returns {Promise<boolean>} 성공 여부
 * 
 * ⚠️ 주의: usage_count는 DB 트리거가 자동으로 관리합니다.
 * artwork_tags에 INSERT/DELETE 시 자동으로 증가/감소됩니다.
 */
export async function addTagsToArtwork(artworkId, tagNames) {
    try {
        if (!tagNames || tagNames.length === 0) return true;
        
        const tagIds = [];
        
        for (const tagName of tagNames) {
            const normalizedName = tagName.trim().toLowerCase();
            
            // 이미 이 작품에 연결된 태그인지 확인
            const { data: existingConnection } = await window._supabase
                .from('artwork_tags')
                .select('tag_id')
                .eq('artwork_id', artworkId)
                .eq('tags.name', normalizedName)
                .maybeSingle();
            
            // 이미 연결되어 있으면 스킵
            if (existingConnection) {
                console.log(`태그 "${normalizedName}"는 이미 이 작품에 연결되어 있습니다.`);
                continue;
            }
            
            // 기존 태그 확인 또는 생성
            let { data: tag } = await window._supabase
                .from('tags')
                .select('id')
                .eq('name', normalizedName)
                .maybeSingle();
            
            // 태그가 없으면 생성 (usage_count는 0으로 시작, 트리거가 자동 증가)
            if (!tag) {
                const { data: newTag, error: createError } = await window._supabase
                    .from('tags')
                    .insert({ name: normalizedName, usage_count: 0 })
                    .select('id')
                    .single();
                
                if (createError) {
                    console.error(`태그 "${normalizedName}" 생성 실패:`, createError);
                    continue;
                }
                tag = newTag;
            }
            
            // artwork_tags 연결 (트리거가 자동으로 usage_count 증가)
            const { error: insertError } = await window._supabase
                .from('artwork_tags')
                .insert({ artwork_id: artworkId, tag_id: tag.id });
            
            if (insertError) {
                console.error(`태그 "${normalizedName}" 연결 실패:`, insertError);
            } else {
                tagIds.push(tag.id);
            }
        }
        
        // 캐시 무효화
        artworkTagsCache.delete(artworkId);
        
        return true;
    } catch (err) {
        console.error('태그 추가 에러:', err);
        throw err;
    }
}

/**
 * 작품의 태그 업데이트 (기존 태그 삭제 후 새로 추가)
 * @param {string} artworkId - 작품 ID
 * @param {Array<string>} tagNames - 새 태그 이름 배열
 * @returns {Promise<boolean>} 성공 여부
 * 
 * ⚠️ 주의: usage_count는 DB 트리거가 자동으로 관리합니다.
 */
export async function updateArtworkTags(artworkId, tagNames) {
    try {
        // 1. 기존 태그 연결 삭제 (트리거가 자동으로 usage_count 감소)
        await window._supabase
            .from('artwork_tags')
            .delete()
            .eq('artwork_id', artworkId);
        
        // 2. 새 태그 추가 (트리거가 자동으로 usage_count 증가)
        await addTagsToArtwork(artworkId, tagNames);
        
        return true;
    } catch (err) {
        console.error('태그 업데이트 에러:', err);
        throw err;
    }
}

/**
 * 여러 작품의 태그를 한 번에 조회
 * @param {Array<string>} artworkIds - 작품 ID 배열
 * @returns {Promise<Map>} artworkId -> 태그 배열 맵
 */
export async function getBatchArtworkTags(artworkIds) {
    const tagsMap = new Map();
    
    try {
        // 병렬로 모든 태그 조회
        const results = await Promise.all(
            artworkIds.map(id => getArtworkTags(id))
        );
        
        artworkIds.forEach((id, index) => {
            tagsMap.set(id, results[index]);
        });
        
        return tagsMap;
    } catch (err) {
        console.error('배치 태그 조회 에러:', err);
        return tagsMap;
    }
}

/**
 * 태그 이름 정규화
 * @param {string} tagName - 태그 이름
 * @returns {string} 정규화된 태그 이름
 */
export function normalizeTagName(tagName) {
    return tagName.trim().toLowerCase().replace(/^#/, '');
}

/**
 * 태그 문자열 파싱 (쉼표 또는 공백으로 구분)
 * @param {string} tagsString - 태그 문자열 (예: "태그1, 태그2, 태그3")
 * @returns {Array<string>} 태그 배열
 */
export function parseTagsString(tagsString) {
    if (!tagsString || typeof tagsString !== 'string') return [];
    
    return tagsString
        .split(/[,\s]+/)
        .map(tag => normalizeTagName(tag))
        .filter(tag => tag.length > 0 && tag.length <= 50);
}

/**
 * 작품 삭제 시 태그 연결 제거
 * @param {string} artworkId - 작품 ID
 * @returns {Promise<boolean>} 성공 여부
 * 
 * ⚠️ 주의: usage_count는 DB 트리거가 자동으로 감소시킵니다.
 * artwork_tags 삭제만 하면 됩니다.
 */
export async function decrementArtworkTags(artworkId) {
    try {
        // artwork_tags 연결 삭제 (트리거가 자동으로 usage_count 감소)
        await window._supabase
            .from('artwork_tags')
            .delete()
            .eq('artwork_id', artworkId);
        
        artworkTagsCache.delete(artworkId);
        return true;
    } catch (err) {
        console.error('태그 연결 제거 에러:', err);
        return false;
    }
}

/**
 * 모든 태그의 usage_count를 실제 사용 횟수로 재계산
 * @returns {Promise<boolean>} 성공 여부
 */
export async function recalculateAllTagCounts() {
    try {
        console.log('🔄 태그 사용 횟수 재계산 시작...');
        
        // 모든 태그 조회
        const { data: allTags, error: tagsError } = await window._supabase
            .from('tags')
            .select('id, name, usage_count');
        
        if (tagsError) throw tagsError;
        
        console.log(`📊 총 ${allTags.length}개의 태그 발견`);
        
        let fixedCount = 0;
        
        // 각 태그의 실제 사용 횟수 계산
        for (const tag of allTags) {
            const { count, error: countError } = await window._supabase
                .from('artwork_tags')
                .select('*', { count: 'exact', head: true })
                .eq('tag_id', tag.id);
            
            if (countError) {
                console.error(`❌ 태그 "${tag.name}" 카운트 조회 실패:`, countError);
                continue;
            }
            
            const actualCount = count || 0;
            
            // 현재 저장된 값과 실제 값이 다른 경우에만 업데이트
            if (tag.usage_count !== actualCount) {
                const { error: updateError } = await window._supabase
                    .from('tags')
                    .update({ usage_count: actualCount })
                    .eq('id', tag.id);
                
                if (updateError) {
                    console.error(`❌ 태그 "${tag.name}" 업데이트 실패:`, updateError);
                } else {
                    console.log(`✅ 태그 "${tag.name}": ${tag.usage_count} → ${actualCount}`);
                    fixedCount++;
                }
            }
        }
        
        clearTagsCache();
        console.log(`✨ 태그 사용 횟수 재계산 완료! (${fixedCount}개 수정됨)`);
        return true;
    } catch (err) {
        console.error('❌ 태그 재계산 에러:', err);
        return false;
    }
}

/**
 * 특정 태그의 상세 정보 확인 (디버깅용)
 * @param {string} tagName - 태그 이름
 */
export async function debugTag(tagName) {
    try {
        const normalizedName = tagName.trim().toLowerCase().replace(/^#/, '');
        
        console.log(`🔍 태그 "${normalizedName}" 디버깅...`);
        
        // 태그 정보 조회
        const { data: tag } = await window._supabase
            .from('tags')
            .select('*')
            .eq('name', normalizedName)
            .maybeSingle();
        
        if (!tag) {
            console.log('❌ 태그를 찾을 수 없습니다.');
            return;
        }
        
        console.log('📌 태그 정보:', tag);
        
        // 실제 연결된 작품 수 확인
        const { count } = await window._supabase
            .from('artwork_tags')
            .select('*', { count: 'exact', head: true })
            .eq('tag_id', tag.id);
        
        console.log(`📊 실제 연결된 작품 수: ${count}`);
        console.log(`📊 저장된 usage_count: ${tag.usage_count}`);
        
        if (count !== tag.usage_count) {
            console.log(`⚠️ 불일치 발견! 차이: ${Math.abs(count - tag.usage_count)}`);
            console.log(`💡 자동 수정 중...`);
            
            // 자동 수정
            const { error } = await window._supabase
                .from('tags')
                .update({ usage_count: count })
                .eq('id', tag.id);
            
            if (error) {
                console.error('❌ 수정 실패:', error);
            } else {
                console.log(`✅ 수정 완료: ${tag.usage_count} → ${count}`);
            }
        } else {
            console.log('✅ 일치함');
        }
        
        // 연결된 작품 목록
        const { data: artworks } = await window._supabase
            .from('artwork_tags')
            .select('artwork_id, artworks(title)')
            .eq('tag_id', tag.id);
        
        if (artworks && artworks.length > 0) {
            console.log('📝 연결된 작품:', artworks);
        }
        
        return { tag, actualCount: count };
        
    } catch (err) {
        console.error('디버깅 에러:', err);
    }
}

/**
 * 모든 태그 상태 확인 (문제가 있는 태그만 표시)
 */
export async function checkAllTags() {
    try {
        console.log('🔍 모든 태그 상태 확인 중...');
        
        const { data: allTags } = await window._supabase
            .from('tags')
            .select('id, name, usage_count');
        
        if (!allTags || allTags.length === 0) {
            console.log('태그가 없습니다.');
            return;
        }
        
        console.log(`총 ${allTags.length}개의 태그 확인 중...`);
        
        const problems = [];
        
        for (const tag of allTags) {
            const { count } = await window._supabase
                .from('artwork_tags')
                .select('*', { count: 'exact', head: true })
                .eq('tag_id', tag.id);
            
            if (count !== tag.usage_count) {
                problems.push({
                    name: tag.name,
                    stored: tag.usage_count,
                    actual: count,
                    diff: count - tag.usage_count
                });
            }
        }
        
        if (problems.length === 0) {
            console.log('✅ 모든 태그가 정상입니다!');
        } else {
            console.log(`⚠️ ${problems.length}개의 문제 발견:`);
            console.table(problems);
        }
        
        return problems;
        
    } catch (err) {
        console.error('확인 에러:', err);
    }
}
