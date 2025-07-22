(function() {
    'use strict';

    const MODULE_NAME = 'swipe-lock';
    
    // 확장 프로그램 기본 설정
    const defaultSettings = {
        enabled: true
    };

    let context;
    let lockedMessages = new Set(); // 잠긴 메시지 ID들을 저장

    // 확장 프로그램 초기화
    async function init() {
        context = SillyTavern.getContext();
        
        // 설정 초기화
        initSettings();
        
        // 메시지가 렌더링될 때마다 자물쇠 아이콘 추가
        context.eventSource.on('MESSAGE_RENDERED', onMessageRendered);
        
        // 채팅이 변경될 때 잠금 상태 초기화
        context.eventSource.on('CHAT_CHANGED', onChatChanged);
        
        console.log('스와이프 잠금 확장 프로그램이 로드되었습니다.');
    }

    // 설정 초기화
    function initSettings() {
        if (!context.extensionSettings[MODULE_NAME]) {
            context.extensionSettings[MODULE_NAME] = structuredClone(defaultSettings);
        }
        
        // 기본 키 확인
        for (const key in defaultSettings) {
            if (context.extensionSettings[MODULE_NAME][key] === undefined) {
                context.extensionSettings[MODULE_NAME][key] = defaultSettings[key];
            }
        }
    }

    // 메시지 렌더링 이벤트 핸들러
    function onMessageRendered(messageId) {
        addLockIconToMessage(messageId);
    }

    // 채팅 변경 이벤트 핸들러
    function onChatChanged() {
        lockedMessages.clear();
        updateAllMessageLocks();
    }

    // 메시지에 자물쇠 아이콘 추가
    function addLockIconToMessage(messageId) {
        const messageElement = document.querySelector(`[data-mesid="${messageId}"]`);
        if (!messageElement) return;

        // 이미 자물쇠 아이콘이 있는지 확인
        if (messageElement.querySelector('.swipe-lock-icon')) return;

        // 메시지 메뉴 찾기
        const messageMenu = messageElement.querySelector('.mes_buttons');
        if (!messageMenu) return;

        // 자물쇠 아이콘 생성
        const lockIcon = document.createElement('div');
        lockIcon.className = 'swipe-lock-icon mes_button';
        lockIcon.title = '스와이프 잠금 토글';
        
        // 초기 상태는 잠김 (자물쇠 닫힘)
        updateLockIcon(lockIcon, true);
        
        // 클릭 이벤트 추가
        lockIcon.addEventListener('click', () => {
            toggleMessageLock(messageId, lockIcon);
        });

        // 메뉴에 아이콘 추가 (첫 번째 위치에)
        messageMenu.insertBefore(lockIcon, messageMenu.firstChild);
        
        // 초기 상태에서 스와이프 내비게이터 숨기기
        hideSwipeNavigator(messageElement);
    }

    // 자물쇠 아이콘 상태 업데이트
    function updateLockIcon(iconElement, isLocked) {
        if (isLocked) {
            iconElement.innerHTML = '<i class="fa-solid fa-lock" style="color: #ff6b6b;"></i>';
            iconElement.title = '스와이프 잠금 해제하기';
        } else {
            iconElement.innerHTML = '<i class="fa-solid fa-unlock" style="color: #51cf66;"></i>';
            iconElement.title = '스와이프 잠그기';
        }
    }

    // 메시지 잠금 상태 토글
    function toggleMessageLock(messageId, iconElement) {
        const messageElement = document.querySelector(`[data-mesid="${messageId}"]`);
        if (!messageElement) return;

        const isCurrentlyLocked = lockedMessages.has(messageId);
        
        if (isCurrentlyLocked) {
            // 잠금 해제
            lockedMessages.delete(messageId);
            updateLockIcon(iconElement, false);
            showSwipeNavigator(messageElement);
        } else {
            // 잠금
            lockedMessages.add(messageId);
            updateLockIcon(iconElement, true);
            hideSwipeNavigator(messageElement);
        }
    }

    // 스와이프 내비게이터 숨기기
    function hideSwipeNavigator(messageElement) {
        const swipeLeft = messageElement.querySelector('.swipe_left');
        const swipeRight = messageElement.querySelector('.swipe_right');
        
        if (swipeLeft) {
            swipeLeft.style.display = 'none';
        }
        if (swipeRight) {
            swipeRight.style.display = 'none';
        }
    }

    // 스와이프 내비게이터 보이기
    function showSwipeNavigator(messageElement) {
        const swipeLeft = messageElement.querySelector('.swipe_left');
        const swipeRight = messageElement.querySelector('.swipe_right');
        
        // 해당 메시지에 스와이프가 가능한지 확인
        const mesId = messageElement.getAttribute('data-mesid');
        const chatItem = context.chat[mesId];
        
        if (chatItem && chatItem.swipes && chatItem.swipes.length > 1) {
            if (swipeLeft) {
                swipeLeft.style.display = '';
            }
            if (swipeRight) {
                swipeRight.style.display = '';
            }
        }
    }

    // 모든 메시지의 잠금 상태 업데이트
    function updateAllMessageLocks() {
        const allMessages = document.querySelectorAll('[data-mesid]');
        allMessages.forEach(messageElement => {
            const messageId = messageElement.getAttribute('data-mesid');
            const lockIcon = messageElement.querySelector('.swipe-lock-icon');
            
            if (lockIcon) {
                const isLocked = lockedMessages.has(messageId);
                updateLockIcon(lockIcon, isLocked);
                
                if (isLocked) {
                    hideSwipeNavigator(messageElement);
                } else {
                    showSwipeNavigator(messageElement);
                }
            }
        });
    }

    // SillyTavern이 로드된 후 초기화
    jQuery(document).ready(() => {
        // SillyTavern이 완전히 로드되기를 기다림
        if (typeof SillyTavern !== 'undefined') {
            init();
        } else {
            // SillyTavern이 아직 로드되지 않은 경우 잠시 기다림
            setTimeout(() => {
                if (typeof SillyTavern !== 'undefined') {
                    init();
                }
            }, 1000);
        }
    });
})(); 