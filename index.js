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
        
        // 채팅이 변경될 때 잠금 상태 초기화
        context.eventSource.on('CHAT_CHANGED', onChatChanged);

        // 메시지 버튼 설정
        setupSwipeLockButtons();
        
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

    // 스와이프 잠금 버튼 설정 (text-to-image-converter 방식 참고)
    function setupSwipeLockButtons() {
        function createSwipeLockButton($mesBlock) {
            const $button = $("<div>")
                .addClass("swipe-lock-icon mes_button fa-solid fa-lock interactable")
                .attr({
                    title: "스와이프 잠금 해제하기",
                    "data-i18n": "[title]스와이프 잠금 해제하기",
                    tabindex: "0",
                })
                .on("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const messageId = $mesBlock.attr('data-mesid');
                    if (messageId) {
                        toggleMessageLock(messageId, $button[0]);
                    }
                });

            // 초기 상태는 잠김
            $button.addClass('locked');
            const messageElement = $mesBlock[0];
            hideSwipeNavigator(messageElement);

            $mesBlock.find(".extraMesButtons").append($button);
        }

        // 기존 메시지들에 버튼 추가
        $("#chat .mes:not(:has(.swipe-lock-icon))").each(function () {
            createSwipeLockButton($(this));
        });

        // 새로운 메시지가 추가될 때마다 버튼 추가 (MutationObserver 사용)
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                const $newMes = $(mutation.addedNodes).filter(".mes:not(:has(.swipe-lock-icon))");
                $newMes.each(function () {
                    createSwipeLockButton($(this));
                });
            });
        });

        // chat 컨테이너가 존재할 때까지 기다림
        const waitForChat = setInterval(() => {
            const chatElement = $("#chat")[0];
            if (chatElement) {
                clearInterval(waitForChat);
                observer.observe(chatElement, {childList: true, subtree: true});
            }
        }, 100);
    }



    // 메시지 잠금 상태 토글
    function toggleMessageLock(messageId, iconElement) {
        const messageElement = document.querySelector(`[data-mesid="${messageId}"]`);
        if (!messageElement) return;

        const $icon = $(iconElement);
        const isCurrentlyLocked = lockedMessages.has(messageId);
        
        if (isCurrentlyLocked) {
            // 잠금 해제
            lockedMessages.delete(messageId);
            $icon.removeClass('fa-lock locked').addClass('fa-unlock unlocked');
            $icon.attr('title', '스와이프 잠그기');
            $icon.attr('data-i18n', '[title]스와이프 잠그기');
            showSwipeNavigator(messageElement);
        } else {
            // 잠금
            lockedMessages.add(messageId);
            $icon.removeClass('fa-unlock unlocked').addClass('fa-lock locked');
            $icon.attr('title', '스와이프 잠금 해제하기');
            $icon.attr('data-i18n', '[title]스와이프 잠금 해제하기');
            hideSwipeNavigator(messageElement);
        }
    }

    // 채팅 변경 이벤트 핸들러
    function onChatChanged() {
        lockedMessages.clear();
        // 모든 메시지 잠금 상태 초기화
        $('.swipe-lock-icon').each(function() {
            const $icon = $(this);
            $icon.removeClass('fa-unlock unlocked').addClass('fa-lock locked');
            $icon.attr('title', '스와이프 잠금 해제하기');
            $icon.attr('data-i18n', '[title]스와이프 잠금 해제하기');
            
            const messageElement = $icon.closest('.mes')[0];
            if (messageElement) {
                hideSwipeNavigator(messageElement);
            }
        });
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



    // SillyTavern이 로드된 후 초기화
    jQuery(document).ready(() => {
        // SillyTavern이 완전히 로드될 때까지 기다림
        const waitForSillyTavern = setInterval(() => {
            if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
                clearInterval(waitForSillyTavern);
                init();
            }
        }, 100);
    });
})(); 