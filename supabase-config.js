// ⚠️ 아래 값을 본인의 Supabase 프로젝트 값으로 변경하세요!
// Supabase 대시보드 → Project Settings → API 에서 확인
const SUPABASE_URL = 'https://aymgfbvosidrziopfbir.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWdmYnZvc2lkcnppb3BmYmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5ODk3MzcsImV4cCI6MjA4NDU2NTczN30.YOy7JfbWqwVsZHjN9zuZoq4LvmwboetND2ANPyx69I8';

// 전역 변수로 선언
window._supabase = null;

try {
    if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'YOUR_ANON_KEY_HERE') {
        throw new Error('Supabase API 키를 설정해주세요. supabase-config.js 파일을 확인하세요.');
    }
    
    window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'pkce'
        }
    });
    
    console.log('✅ Supabase 연결 성공');
} catch (e) {
    console.error('❌ Supabase 초기화 실패:', e);
    alert('Supabase 연결 실패: ' + e.message);
    window._supabase = null;
}
