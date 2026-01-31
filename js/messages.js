import { escapeHtml, formatDate } from './utils.js';
import { showError, showLoginRequiredModal } from './utils/errorHandler.js';

// 쪽지 상태 관리
window._messageState = {
    currentConversationUserId: null,
    currentConversationNickname: null,
    currentConversationAvatar: null,
    conversations: [],
    realtimeChannel: null,
    pollingInterval: null,
    lastMessageCheckTime: null,
    sendingMessage: false,
    isRealtimeActive: false
};

// 쪽지함 초기화
export async function initMessages() {
    const user = window._supabase.auth.getUser ? (await window._supabase.auth.getUser()).data.user : null;
    if (!user) {
        showLoginRequiredModal();
        return;
    }

    // 기존 구독/폴링 정리
    await cleanupMessageSystem();

    // 모바일 환경에서 초기 상태 설정
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        const sidebar = document.querySelector('.messages-sidebar');
        const chatContent = document.getElementById('messages-chat-content');
        const chatEmpty = document.getElementById('messages-chat-empty');
        const chatArea = document.querySelector('.messages-chat-area');
        
        if (sidebar) {
            sidebar.classList.remove('mobile-hidden');
        }
        if (chatContent) {
            chatContent.style.display = 'none';
        }
        if (chatEmpty) {
            chatEmpty.style.display = 'flex';
        }
        if (chatArea) {
            chatArea.classList.remove('active');
        }
    }

    await loadConversations();
    await updateUnreadCount();
    
    // 마지막 확인 시간 초기화
    window._messageState.lastMessageCheckTime = new Date().toISOString();
    
    // Realtime 구독 시도
    await setupRealtimeSubscription();
}

// 메시지 시스템 정리
async function cleanupMessageSystem() {
    // Realtime 채널 정리
    if (window._messageState.realtimeChannel) {
        try {
            await window._supabase.removeChannel(window._messageState.realtimeChannel);
            console.log('기존 Realtime 채널 제거');
        } catch (error) {
            console.warn('채널 제거 실패:', error);
        }
        window._messageState.realtimeChannel = null;
        window._messageState.isRealtimeActive = false;
    }

    // 폴링 정리
    if (window._messageState.pollingInterval) {
        clearInterval(window._messageState.pollingInterval);
        window._messageState.pollingInterval = null;
        console.log('폴링 중지');
    }
}

// Realtime 구독 설정
async function setupRealtimeSubscription() {
    const user = window._supabase.auth.getUser ? (await window._supabase.auth.getUser()).data.user : null;
    if (!user) return;

    try {
        console.log('Realtime 구독 시도...');
        
        const channel = window._supabase
            .channel(`messages-${user.id}`)
            // 받은 메시지 구독
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}`
                },
                async (payload) => {
                    console.log('✅ Realtime: 받은 메시지', payload.new.id);
                    await handleNewMessage(payload.new, 'received');
                }
            )
            // 보낸 메시지 구독 (상대방 화면 업데이트용)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `sender_id=eq.${user.id}`
                },
                async (payload) => {
                    console.log('✅ Realtime: 보낸 메시지 확인', payload.new.id);
                    // 보낸 메시지는 이미 UI에 추가되어 있으므로 대화 목록만 업데이트
                    await loadConversations();
                }
            )
            .subscribe((status) => {
                console.log('Realtime 상태:', status);
                
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Realtime 구독 성공 - 폴링 사용 안 함');
                    window._messageState.isRealtimeActive = true;
                    
                    // 폴링이 실행 중이면 중지
                    if (window._messageState.pollingInterval) {
                        clearInterval(window._messageState.pollingInterval);
                        window._messageState.pollingInterval = null;
                        console.log('폴링 중지 (Realtime 활성화)');
                    }
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                    console.warn('⚠️ Realtime 실패/종료:', status, '- 폴링으로 전환');
                    window._messageState.isRealtimeActive = false;
                    startPolling();
                }
            });

        window._messageState.realtimeChannel = channel;

        // 5초 후에도 구독 안 되면 폴링으로 전환
        setTimeout(() => {
            if (!window._messageState.isRealtimeActive) {
                console.warn('⚠️ Realtime 구독 타임아웃 - 폴링으로 전환');
                startPolling();
            }
        }, 5000);

    } catch (error) {
        console.error('❌ Realtime 구독 실패:', error);
        startPolling();
    }
}

// 폴링 시작 (Realtime 실패 시에만)
function startPolling() {
    // 이미 폴링 중이거나 Realtime이 활성화되어 있으면 무시
    if (window._messageState.pollingInterval || window._messageState.isRealtimeActive) {
        return;
    }

    console.log('🔄 폴링 시작 (3초 간격) - Realtime 대체');
    
    window._messageState.pollingInterval = setInterval(async () => {
        // Realtime이 다시 활성화되면 폴링 중지
        if (window._messageState.isRealtimeActive) {
            clearInterval(window._messageState.pollingInterval);
            window._messageState.pollingInterval = null;
            console.log('폴링 중지 (Realtime 재활성화)');
            return;
        }
        
        await checkNewMessages();
    }, 3000);
}

// 새 메시지 확인 (폴링용)
async function checkNewMessages() {
    const user = window._supabase.auth.getUser ? (await window._supabase.auth.getUser()).data.user : null;
    if (!user) return;

    try {
        const lastCheckTime = window._messageState.lastMessageCheckTime || new Date(Date.now() - 5000).toISOString();
        
        const { data: newMessages, error } = await window._supabase
            .from('messages')
            .select('*')
            .eq('receiver_id', user.id)
            .gt('created_at', lastCheckTime)
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (newMessages && newMessages.length > 0) {
            console.log('🔄 폴링: 새 메시지 발견', newMessages.length, '개');
            
            for (const message of newMessages) {
                await handleNewMessage(message);
            }

            window._messageState.lastMessageCheckTime = newMessages[newMessages.length - 1].created_at;
        }
    } catch (error) {
        console.error('새 메시지 확인 실패:', error);
    }
}

// 새 메시지 처리
async function handleNewMessage(message, type = 'received') {
    if (!message || !message.id) return;

    const user = window._supabase.auth.getUser ? (await window._supabase.auth.getUser()).data.user : null;
    if (!user) return;

    const isReceived = message.receiver_id === user.id;
    
    // 받은 메시지만 처리 (내가 보낸 메시지는 이미 UI에 추가됨)
    if (!isReceived) return;
    
    // 현재 보고 있는 대화면 새 메시지 추가
    if (window._messageState.currentConversationUserId === message.sender_id) {
        await addMessageToChat(message);
    }

    // 대화 목록 업데이트
    await loadConversations();
    
    // 읽지 않은 메시지 개수 업데이트
    await updateUnreadCount();
}

// 채팅에 새 메시지 추가
async function addMessageToChat(message) {
    const chatMessages = document.getElementById('messages-chat-messages');
    if (!chatMessages) return;

    const user = window._supabase.auth.getUser ? (await window._supabase.auth.getUser()).data.user : null;
    if (!user) return;

    // 중복 체크
    if (message.id) {
        const existingMessage = chatMessages.querySelector(`[data-message-id="${message.id}"]`);
        if (existingMessage) {
            return;
        }
    }

    const isSent = message.sender_id === user.id;
    
    const messageHTML = `
        <div class="message-bubble ${isSent ? 'sent' : 'received'}" data-message-id="${message.id}">
            <div class="message-bubble-content">
                <div class="message-bubble-text">${escapeHtml(message.content)}</div>
                <div class="message-bubble-time">${formatDate(message.created_at)}</div>
            </div>
        </div>
    `;

    // 빈 상태 제거
    const emptyState = chatMessages.querySelector('.messages-empty');
    if (emptyState) {
        emptyState.remove();
    }

    // 메시지 추가
    chatMessages.insertAdjacentHTML('beforeend', messageHTML);

    // 스크롤
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // 받은 메시지 읽음 처리
    if (!isSent && !message.is_read) {
        await markMessageAsRead(message.id);
    }
}

// 대화 목록 로드
async function loadConversations() {
    const user = window._supabase.auth.getUser ? (await window._supabase.auth.getUser()).data.user : null;
    if (!user) return;

    const conversationsList = document.getElementById('messages-conversations-list');
    if (!conversationsList) return;

    try {
        // 숨기지 않은 메시지만 조회 (쿼리 레벨에서 필터링)
        // 내가 보낸 메시지: hidden_by_sender가 true가 아닌 것 (null 또는 false)
        // 내가 받은 메시지: hidden_by_receiver가 true가 아닌 것 (null 또는 false)
        const { data: visibleMessages, error } = await window._supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},hidden_by_sender.neq.true),and(receiver_id.eq.${user.id},hidden_by_receiver.neq.true)`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!visibleMessages || visibleMessages.length === 0) {
            conversationsList.innerHTML = `
                <div class="messages-empty" style="padding: 40px 20px; text-align: center;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 12px;">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <p style="font-size: 14px; color: #999;">대화 내역이 없습니다</p>
                </div>
            `;
            window._messageState.conversations = [];
            return;
        }

        // 대화 상대별로 그룹화 (보이는 메시지만)
        const visibleConversations = new Map();
        
        visibleMessages.forEach(msg => {
            const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
            
            if (!visibleConversations.has(otherUserId)) {
                visibleConversations.set(otherUserId, {
                    lastMessage: msg,
                    hasUnread: msg.receiver_id === user.id && !msg.is_read
                });
            } else {
                const existing = visibleConversations.get(otherUserId);
                // 더 최근 메시지로 업데이트
                if (new Date(msg.created_at) > new Date(existing.lastMessage.created_at)) {
                    existing.lastMessage = msg;
                }
                if (msg.receiver_id === user.id && !msg.is_read) {
                    existing.hasUnread = true;
                }
            }
        });

        const visibleUserIds = Array.from(visibleConversations.keys());

        if (visibleUserIds.length === 0) {
            conversationsList.innerHTML = `
                <div class="messages-empty" style="padding: 40px 20px; text-align: center;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 12px;">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <p style="font-size: 14px; color: #999;">대화 내역이 없습니다</p>
                </div>
            `;
            window._messageState.conversations = [];
            return;
        }

        const { data: profiles, error: profilesError } = await window._supabase
            .from('profiles')
            .select('user_id, nickname, avatar_url')
            .in('user_id', visibleUserIds);

        if (profilesError) throw profilesError;

        const profilesMap = new Map();
        profiles.forEach(profile => {
            profilesMap.set(profile.user_id, profile);
        });

        const conversations = visibleUserIds
            .map(userId => {
                const convData = visibleConversations.get(userId);
                const profile = profilesMap.get(userId);
                
                if (!profile || !convData.lastMessage) return null;
                
                return {
                    userId: userId,
                    nickname: profile.nickname || '알 수 없음',
                    avatarUrl: profile.avatar_url || null,
                    lastMessage: convData.lastMessage.content,
                    lastMessageTime: convData.lastMessage.created_at,
                    unread: convData.hasUnread
                };
            })
            .filter(conv => conv !== null);

        window._messageState.conversations = conversations;

        conversationsList.innerHTML = conversations.map(conv => {
            const safeNickname = escapeHtml(conv.nickname);
            const safeAvatarUrl = conv.avatarUrl ? escapeHtml(conv.avatarUrl) : '';
            return `
            <div class="conversation-item ${conv.unread ? 'unread' : ''} ${window._messageState.currentConversationUserId === conv.userId ? 'active' : ''}" 
                 onclick="selectConversation('${conv.userId}', '${safeNickname}', '${safeAvatarUrl}', this)">
                <div class="conversation-avatar">
                    ${conv.avatarUrl 
                        ? `<img src="${conv.avatarUrl}" alt="${safeNickname}">` 
                        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>`
                    }
                </div>
                <div class="conversation-info">
                    <div class="conversation-header">
                        <span class="conversation-name" onclick="event.stopPropagation(); if(window.selectUserById) window.selectUserById('${conv.userId}');">${safeNickname}</span>
                        <span class="conversation-time">${formatDate(conv.lastMessageTime)}</span>
                    </div>
                    <div class="conversation-preview">${escapeHtml(conv.lastMessage)}</div>
                </div>
                <button class="conversation-delete-btn" onclick="event.stopPropagation(); hideConversation('${conv.userId}', '${safeNickname}');" title="대화 숨기기">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </div>
        `;
        }).join('');

    } catch (error) {
        console.error('대화 목록 로드 실패:', error);
    }
}

// 대화 선택
async function selectConversation(userId, nickname, avatarUrl, eventElement) {
    window._messageState.currentConversationUserId = userId;
    window._messageState.currentConversationNickname = nickname;
    window._messageState.currentConversationAvatar = avatarUrl;

    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });
    if (eventElement) {
        eventElement.classList.add('active');
    }

    const chatEmpty = document.getElementById('messages-chat-empty');
    const chatContent = document.getElementById('messages-chat-content');
    const chatArea = document.querySelector('.messages-chat-area');
    
    if (chatEmpty) chatEmpty.style.display = 'none';
    if (chatContent) chatContent.style.display = 'flex';
    
    // 모바일 환경에서 채팅 영역 활성화 및 사이드바 숨기기
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        const sidebar = document.querySelector('.messages-sidebar');
        if (sidebar) {
            sidebar.classList.add('mobile-hidden');
        }
        if (chatArea) {
            chatArea.classList.add('active');
        }
    }

    const chatAvatar = document.getElementById('messages-chat-avatar');
    const chatUsername = document.getElementById('messages-chat-username');
    
    chatAvatar.innerHTML = avatarUrl 
        ? `<img src="${avatarUrl}" alt="${nickname}">` 
        : `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>`;
    chatUsername.textContent = nickname;
    
    // 프로필로 이동하는 클릭 이벤트 추가
    chatUsername.style.cursor = 'pointer';
    chatUsername.onclick = () => {
        if (window.selectUserById) {
            window.selectUserById(userId);
        }
    };

    await loadChatMessages(userId);
}
window.selectConversation = (userId, nickname, avatarUrl, eventElement) => {
    selectConversation(userId, nickname, avatarUrl, eventElement);
};

// 대화 메시지 로드
async function loadChatMessages(otherUserId) {
    const user = window._supabase.auth.getUser ? (await window._supabase.auth.getUser()).data.user : null;
    if (!user) return;

    const chatMessages = document.getElementById('messages-chat-messages');
    chatMessages.innerHTML = `
        <div class="messages-loading">
            <div class="messages-loading-spinner"></div>
        </div>
    `;

    try {
        const { data: messages, error } = await window._supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (!messages || messages.length === 0) {
            chatMessages.innerHTML = `
                <div class="messages-empty">
                    <p>대화를 시작해보세요</p>
                </div>
            `;
            return;
        }

        chatMessages.innerHTML = messages.map(msg => {
            const isSent = msg.sender_id === user.id;
            return `
                <div class="message-bubble ${isSent ? 'sent' : 'received'}" data-message-id="${msg.id}">
                    <div class="message-bubble-content">
                        <div class="message-bubble-text">${escapeHtml(msg.content)}</div>
                        <div class="message-bubble-time">${formatDate(msg.created_at)}</div>
                    </div>
                </div>
            `;
        }).join('');

        chatMessages.scrollTop = chatMessages.scrollHeight;

        // 받은 메시지 읽음 처리
        const unreadMessages = messages.filter(msg => msg.receiver_id === user.id && !msg.is_read);
        for (const msg of unreadMessages) {
            await markMessageAsRead(msg.id);
        }

    } catch (error) {
        console.error('대화 내용 로드 실패:', error);
        chatMessages.innerHTML = `
            <div class="messages-empty">
                <p style="color: #ff3b30;">대화 내용을 불러오는데 실패했습니다</p>
            </div>
        `;
    }
}

// 메시지 전송
async function sendMessageFromChat() {
    const user = window._supabase.auth.getUser ? (await window._supabase.auth.getUser()).data.user : null;
    if (!user) {
        showLoginRequiredModal();
        return;
    }

    const input = document.getElementById('messages-chat-input');
    const sendBtn = document.querySelector('.messages-chat-send-btn');
    const content = input.value.trim();
    const receiverId = window._messageState.currentConversationUserId;

    if (!content) return;
    if (!receiverId) {
        showError('대화 상대가 선택되지 않았습니다.');
        return;
    }

    if (window._messageState.sendingMessage) {
        return;
    }

    window._messageState.sendingMessage = true;
    if (sendBtn) sendBtn.disabled = true;

    const originalContent = content;
    input.value = '';
    input.style.height = 'auto';

    try {
        const { data: newMessage, error } = await window._supabase
            .from('messages')
            .insert({
                sender_id: user.id,
                receiver_id: receiverId,
                content: originalContent,
                is_read: false
            })
            .select()
            .single();

        if (error) throw error;

        console.log('메시지 전송 성공:', newMessage.id);

        // 즉시 UI에 추가
        await addMessageToChat(newMessage);

        // 대화 목록 업데이트
        await loadConversations();

    } catch (error) {
        console.error('메시지 전송 실패:', error);
        showError('메시지 전송에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
        input.value = originalContent;
    } finally {
        if (sendBtn) sendBtn.disabled = false;
        window._messageState.sendingMessage = false;
    }
}
window.sendMessageFromChat = sendMessageFromChat;

// 프로필에서 쪽지 보내기
export function openMessageModal(userId, nickname) {
    if (window.switchToTab) {
        window.switchToTab('messages');
    }

    setTimeout(async () => {
        const conversation = window._messageState.conversations.find(c => c.userId === userId);
        
        if (conversation) {
            const conversationItem = document.querySelector(`.conversation-item[onclick*="${userId}"]`);
            await selectConversation(userId, nickname, conversation.avatarUrl || '', conversationItem);
        } else {
            // 새로운 대화 시작 - 프로필 이미지 가져오기
            let avatarUrl = '';
            try {
                const { data: profile } = await window._supabase
                    .from('profiles')
                    .select('avatar_url')
                    .eq('user_id', userId)
                    .single();
                
                if (profile?.avatar_url) {
                    avatarUrl = profile.avatar_url;
                }
            } catch (error) {
                console.log('프로필 이미지 로드 실패:', error);
            }
            
            window._messageState.currentConversationUserId = userId;
            window._messageState.currentConversationNickname = nickname;
            window._messageState.currentConversationAvatar = avatarUrl;

            const chatEmpty = document.getElementById('messages-chat-empty');
            const chatContent = document.getElementById('messages-chat-content');
            const chatArea = document.querySelector('.messages-chat-area');
            
            if (chatEmpty) chatEmpty.style.display = 'none';
            if (chatContent) chatContent.style.display = 'flex';

            // 모바일 환경에서 채팅 영역 활성화 및 사이드바 숨기기
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                const sidebar = document.querySelector('.messages-sidebar');
                if (sidebar) {
                    sidebar.classList.add('mobile-hidden');
                }
                if (chatArea) {
                    chatArea.classList.add('active');
                }
            }

            const chatAvatar = document.getElementById('messages-chat-avatar');
            const chatUsername = document.getElementById('messages-chat-username');
            
            chatAvatar.innerHTML = avatarUrl
                ? `<img src="${avatarUrl}" alt="${nickname}">`
                : `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>`;
            chatUsername.textContent = nickname;
            
            // 프로필로 이동하는 클릭 이벤트 추가
            chatUsername.style.cursor = 'pointer';
            chatUsername.onclick = () => {
                if (window.selectUserById) {
                    window.selectUserById(userId);
                }
            };

            const chatMessages = document.getElementById('messages-chat-messages');
            chatMessages.innerHTML = `
                <div class="messages-empty">
                    <p>대화를 시작해보세요</p>
                </div>
            `;

            document.getElementById('messages-chat-input').focus();
        }
    }, 300);
}

// 쪽지 읽음 처리
async function markMessageAsRead(messageId) {
    try {
        const { error } = await window._supabase
            .from('messages')
            .update({ is_read: true })
            .eq('id', messageId);

        if (error) throw error;

    } catch (error) {
        console.error('읽음 처리 실패:', error);
    }
}

// 읽지 않은 쪽지 개수 업데이트
export async function updateUnreadCount() {
    const user = window._supabase.auth.getUser ? (await window._supabase.auth.getUser()).data.user : null;
    if (!user) return;

    try {
        const { count, error } = await window._supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', user.id)
            .eq('is_read', false);

        if (error) throw error;

        const messagesTab = document.querySelector('[data-tab="messages"]');
        if (messagesTab) {
            const existingBadge = messagesTab.querySelector('.unread-badge');
            if (existingBadge) {
                existingBadge.remove();
            }

            if (count > 0) {
                const badge = document.createElement('span');
                badge.className = 'unread-badge';
                badge.textContent = count > 99 ? '99+' : count;
                messagesTab.querySelector('span').appendChild(badge);
            }
        }

    } catch (error) {
        console.error('읽지 않은 쪽지 개수 조회 실패:', error);
    }
}

// 프로필에서 쪽지 보내기 핸들러
export async function handleSendMessageFromProfile() {
    const profileUserId = window.getCurrentViewingUserId ? window.getCurrentViewingUserId() : null;
    const profileNickname = document.getElementById('profile-username')?.textContent;

    if (!profileUserId || !profileNickname) {
        showError('사용자 정보를 불러올 수 없습니다.');
        return;
    }

    openMessageModal(profileUserId, profileNickname);
}

// 텍스트 영역 설정
function setupChatInput() {
    const input = document.getElementById('messages-chat-input');
    if (!input) return;

    input.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });

    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessageFromChat();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupChatInput();
    setupMobileBackButton();
});

// 모바일 뒤로가기 버튼 설정
function setupMobileBackButton() {
    const chatHeader = document.querySelector('.messages-chat-header');
    if (!chatHeader) return;

    chatHeader.addEventListener('click', (e) => {
        // 뒤로가기 영역 클릭 감지 (::before 영역)
        const rect = chatHeader.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        
        // 왼쪽 50px 이내 클릭 시 뒤로가기
        if (clickX < 50 && window.innerWidth <= 768) {
            goBackToConversationList();
        }
    });
}

// 대화 목록으로 돌아가기
function goBackToConversationList() {
    const sidebar = document.querySelector('.messages-sidebar');
    const chatContent = document.getElementById('messages-chat-content');
    const chatEmpty = document.getElementById('messages-chat-empty');
    const chatArea = document.querySelector('.messages-chat-area');
    
    if (sidebar) {
        sidebar.classList.remove('mobile-hidden');
    }
    
    if (chatContent) {
        chatContent.style.display = 'none';
    }
    
    if (chatEmpty) {
        chatEmpty.style.display = 'flex';
    }
    
    // 모바일에서 채팅 영역 비활성화
    if (chatArea && window.innerWidth <= 768) {
        chatArea.classList.remove('active');
    }
    
    // 현재 대화 상태 초기화
    window._messageState.currentConversationUserId = null;
    window._messageState.currentConversationNickname = null;
    window._messageState.currentConversationAvatar = null;
}
window.goBackToConversationList = goBackToConversationList;

// 페이지 떠날 때 정리
window.addEventListener('beforeunload', async () => {
    await cleanupMessageSystem();
});

// 화면 크기 변경 시 대응
window.addEventListener('resize', () => {
    const isMobile = window.innerWidth <= 768;
    const sidebar = document.querySelector('.messages-sidebar');
    const chatContent = document.getElementById('messages-chat-content');
    const chatArea = document.querySelector('.messages-chat-area');
    
    if (!isMobile) {
        // 데스크톱으로 전환 시
        if (sidebar) {
            sidebar.classList.remove('mobile-hidden');
        }
        if (chatArea) {
            chatArea.classList.remove('active');
        }
    } else if (isMobile && chatContent && chatContent.style.display === 'flex') {
        // 모바일에서 대화 중이면 사이드바 숨기고 채팅 영역 활성화
        if (sidebar) {
            sidebar.classList.add('mobile-hidden');
        }
        if (chatArea) {
            chatArea.classList.add('active');
        }
    }
});

// 대화 숨기기 (본인 UI에서만 제거)
async function hideConversation(userId, nickname) {
    if (!userId) {
        showError('숨길 대화가 없습니다.');
        return;
    }

    if (!confirm(`${nickname}님과의 대화를 숨기시겠습니까?\n\n대화 목록에서 제거되지만 상대방은 계속 볼 수 있습니다.`)) {
        return;
    }

    const user = window._supabase.auth.getUser ? (await window._supabase.auth.getUser()).data.user : null;
    if (!user) return;

    try {
        // DB 업데이트: 내가 보낸/받은 메시지 숨김 처리
        await Promise.all([
            window._supabase
                .from('messages')
                .update({ hidden_by_sender: true })
                .eq('sender_id', user.id)
                .eq('receiver_id', userId),
            window._supabase
                .from('messages')
                .update({ hidden_by_receiver: true })
                .eq('receiver_id', user.id)
                .eq('sender_id', userId)
        ]);

        // 대화 목록 새로고침 (쿼리 레벨에서 필터링됨)
        await loadConversations();

        // 현재 보고 있는 대화면 UI 초기화
        if (window._messageState.currentConversationUserId === userId) {
            window._messageState.currentConversationUserId = null;
            window._messageState.currentConversationNickname = null;
            window._messageState.currentConversationAvatar = null;

            document.getElementById('messages-chat-content').style.display = 'none';
            document.getElementById('messages-chat-empty').style.display = 'flex';
        }

        // 읽지 않은 메시지 개수 업데이트
        await updateUnreadCount();

    } catch (error) {
        console.error('대화 숨김 실패:', error);
        showError('대화 숨김에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
    }
}
window.hideConversation = hideConversation;

