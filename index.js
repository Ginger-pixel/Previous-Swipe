// Previous Swipe 확장프로그램
// SillyTavern용 이전 메시지 스와이프 탐색 도구

(function() {
    'use strict';

    console.log('🔄 Previous Swipe: 스크립트 로드 시작!');

    let isInitialized = false;
    let unlockedMessages = new Set(); // 언락된 메시지들을 추적

    // 확장 초기화
    function initialize() {
        if (isInitialized) return;
        
        console.log('🔄 Previous Swipe: 초기화 시작');
        
        // 메시지 관찰자 설정
        setupMessageObserver();
        
        // 기존 메시지들에 아이콘 추가
        addIconsToExistingMessages();
        
        isInitialized = true;
        console.log('🔄 Previous Swipe: 초기화 완료');
    }

    // DOM이 로드된 후 초기화
    function waitForSillyTavern() {
        if (typeof window.SillyTavern !== 'undefined' || document.querySelector('#chat')) {
            console.log('🔄 Previous Swipe: SillyTavern 감지됨, 초기화 진행');
            setTimeout(initialize, 500);
        } else {
            console.log('🔄 Previous Swipe: SillyTavern 대기 중...');
            setTimeout(waitForSillyTavern, 1000);
        }
    }

    // 메시지 관찰자 설정
    function setupMessageObserver() {
        const chatContainer = document.querySelector('#chat');
        if (!chatContainer) {
            console.log('🔄 Previous Swipe: 채팅 컨테이너를 찾을 수 없음');
            return;
        }

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE && 
                            (node.classList.contains('mes') || node.querySelector('.mes'))) {
                            setTimeout(() => addIconToMessage(node), 100);
                        }
                    });
                }
            });
        });

        observer.observe(chatContainer, {
            childList: true,
            subtree: true
        });
    }

    // 기존 메시지들에 아이콘 추가
    function addIconsToExistingMessages() {
        const messages = document.querySelectorAll('.mes');
        messages.forEach((message, index) => {
            setTimeout(() => addIconToMessage(message), index * 50);
        });
    }

    // 메시지에 아이콘 추가
    function addIconToMessage(messageElement) {
        // 이미 아이콘이 있는지 확인
        if (messageElement.querySelector('.previous-swipe-icon')) {
            return;
        }

        // 사용자 메시지는 제외
        if (messageElement.classList.contains('user_mes')) {
            return;
        }

        // 메시지 헤더 찾기
        const messageHeader = messageElement.querySelector('.mes_header');
        if (!messageHeader) {
            return;
        }

        // 아이콘 생성
        const iconContainer = document.createElement('div');
        iconContainer.className = 'previous-swipe-icon-container';
        
        const icon = document.createElement('i');
        icon.className = 'previous-swipe-icon fa-solid fa-lock';
        icon.title = '이전 메시지 스와이프 탐색 활성화';
        
        iconContainer.appendChild(icon);
        
        // 클릭 이벤트 추가
        icon.addEventListener('click', () => handleIconClick(messageElement, icon));
        
        // 메시지 헤더에 아이콘 추가
        messageHeader.appendChild(iconContainer);
    }

    // 아이콘 클릭 핸들러
    function handleIconClick(messageElement, icon) {
        const messages = Array.from(document.querySelectorAll('.mes:not(.user_mes)'));
        const messageIndex = messages.indexOf(messageElement);
        const isLastMessage = messageIndex === messages.length - 1;

        if (isLastMessage) {
            // 마지막 메시지인 경우 토스트 메시지 표시
            showToast('마지막 메시지는 이미 스와이프 탐색이 가능합니다.');
            return;
        }

        // 메시지 ID 생성
        const messageId = getMessageId(messageElement);
        
        if (unlockedMessages.has(messageId)) {
            // 언락된 상태에서 다시 클릭하면 락 상태로 변경
            lockMessage(messageElement, icon, messageId);
        } else {
            // 락된 상태에서 클릭하면 언락 상태로 변경
            unlockMessage(messageElement, icon, messageId);
        }
    }

    // 메시지 언락
    function unlockMessage(messageElement, icon, messageId) {
        // 아이콘 변경
        icon.className = 'previous-swipe-icon fa-solid fa-unlock';
        icon.title = '이전 메시지 스와이프 탐색 비활성화';
        
        // 언락된 메시지로 추가
        unlockedMessages.add(messageId);
        
        // 스와이프 네비게이터 추가
        addSwipeNavigator(messageElement);
        
        showToast('스와이프 탐색이 활성화되었습니다.');
    }

    // 메시지 락
    function lockMessage(messageElement, icon, messageId) {
        // 아이콘 변경
        icon.className = 'previous-swipe-icon fa-solid fa-lock';
        icon.title = '이전 메시지 스와이프 탐색 활성화';
        
        // 언락된 메시지에서 제거
        unlockedMessages.delete(messageId);
        
        // 스와이프 네비게이터 제거
        removeSwipeNavigator(messageElement);
        
        showToast('스와이프 탐색이 비활성화되었습니다.');
    }

    // 메시지 ID 생성
    function getMessageId(messageElement) {
        // 메시지의 고유 식별자 생성 (인덱스 기반)
        const messages = Array.from(document.querySelectorAll('.mes:not(.user_mes)'));
        return `message_${messages.indexOf(messageElement)}`;
    }

    // 스와이프 네비게이터 추가
    function addSwipeNavigator(messageElement) {
        // 이미 네비게이터가 있는지 확인
        if (messageElement.querySelector('.previous-swipe-navigator')) {
            return;
        }

        // 메시지 텍스트 컨테이너 찾기
        const messageText = messageElement.querySelector('.mes_text');
        if (!messageText) {
            return;
        }

        // 네비게이터 생성
        const navigator = document.createElement('div');
        navigator.className = 'previous-swipe-navigator';
        
        const leftArrow = document.createElement('i');
        leftArrow.className = 'previous-swipe-nav fa-solid fa-chevron-left';
        leftArrow.title = '이전 스와이프';
        
        const swipeInfo = document.createElement('span');
        swipeInfo.className = 'previous-swipe-info';
        swipeInfo.textContent = '1 / 1'; // 임시값, 실제로는 동적으로 계산
        
        const rightArrow = document.createElement('i');
        rightArrow.className = 'previous-swipe-nav fa-solid fa-chevron-right';
        rightArrow.title = '다음 스와이프';
        
        navigator.appendChild(leftArrow);
        navigator.appendChild(swipeInfo);
        navigator.appendChild(rightArrow);
        
        // 클릭 이벤트 추가
        leftArrow.addEventListener('click', () => navigateSwipe(messageElement, -1));
        rightArrow.addEventListener('click', () => navigateSwipe(messageElement, 1));
        
        // 메시지 하단에 네비게이터 추가
        messageElement.appendChild(navigator);
        
        // 스와이프 정보 업데이트
        updateSwipeInfo(messageElement);
    }

    // 스와이프 네비게이터 제거
    function removeSwipeNavigator(messageElement) {
        const navigator = messageElement.querySelector('.previous-swipe-navigator');
        if (navigator) {
            navigator.remove();
        }
    }

    // 스와이프 탐색
    function navigateSwipe(messageElement, direction) {
        // 실제 스와이프 탐색 로직
        // SillyTavern의 내부 API를 사용해야 할 수 있음
        console.log(`스와이프 탐색: 방향 ${direction}`);
        
        // 임시 구현: 스와이프 정보만 업데이트
        updateSwipeInfo(messageElement);
        
        showToast(`스와이프 ${direction > 0 ? '다음' : '이전'}으로 이동`);
    }

    // 스와이프 정보 업데이트
    function updateSwipeInfo(messageElement) {
        const swipeInfo = messageElement.querySelector('.previous-swipe-info');
        if (swipeInfo) {
            // 임시값, 실제로는 SillyTavern API에서 가져와야 함
            swipeInfo.textContent = '1 / 3';
        }
    }

    // 토스트 메시지 표시
    function showToast(message) {
        // SillyTavern의 토스트 시스템 사용 시도
        if (typeof window.toastr !== 'undefined') {
            window.toastr.info(message);
            return;
        }
        
        // 커스텀 토스트 생성
        const toast = document.createElement('div');
        toast.className = 'previous-swipe-toast';
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // 애니메이션 및 자동 제거
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // 페이지 로드 완료 대기
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForSillyTavern);
    } else {
        waitForSillyTavern();
    }

    console.log('🔄 Previous Swipe: 스크립트 로드 완료');
})(); 