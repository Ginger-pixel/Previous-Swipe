// Previous Swipe 확장프로그램
// SillyTavern용 이전 메시지 스와이프 탐색 도구

(function() {
    'use strict';

    console.log('🔄 Previous Swipe: 스크립트 로드 시작!');

    let isInitialized = false;
    let unlockedMessages = new Set(); // 언락된 메시지들을 추적

    // **강화된 DOM 준비 상태 확인 함수**
    function isDOMReady() {
        const chat = document.querySelector('#chat');
        const extensionsSettings = document.querySelector('#extensions_settings2');
        const sendTextarea = document.querySelector('#send_textarea');
        
        // 모든 핵심 요소가 존재하고 DOM에 연결되어 있는지 확인
        const allElementsExist = !!(chat && extensionsSettings && sendTextarea);
        const allElementsConnected = !!(
            chat && chat.isConnected &&
            extensionsSettings && extensionsSettings.isConnected &&
            sendTextarea && sendTextarea.isConnected
        );
        
        const isReady = allElementsExist && allElementsConnected;
        
        if (!isReady) {
            console.log('🔄 Previous Swipe: DOM 준비 상태 체크 실패:', {
                chat: !!chat,
                extensionsSettings: !!extensionsSettings,
                sendTextarea: !!sendTextarea,
                allElementsConnected
            });
        }
        
        return isReady;
    }

    // **레이아웃 안정화까지 기다리는 함수**
    function waitForLayoutStabilization() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 30; // 최대 30번 시도 (15초)
            
            const checkStability = () => {
                attempts++;
                
                if (isDOMReady()) {
                    // 추가로 300ms 더 기다려서 레이아웃이 완전히 안정되도록 함
                    setTimeout(() => {
                        if (isDOMReady()) {
                            console.log(`🔄 Previous Swipe: DOM 안정화 완료 (${attempts}번째 시도)`);
                            resolve(true);
                        } else {
                            if (attempts < maxAttempts) {
                                setTimeout(checkStability, 500);
                            } else {
                                console.warn('🔄 Previous Swipe: DOM 안정화 타임아웃');
                                resolve(false);
                            }
                        }
                    }, 300);
                } else {
                    if (attempts < maxAttempts) {
                        setTimeout(checkStability, 500);
                    } else {
                        console.warn('🔄 Previous Swipe: DOM 안정화 실패 - 타임아웃');
                        resolve(false);
                    }
                }
            };
            
            checkStability();
        });
    }

    // 확장 초기화
    async function initialize() {
        if (isInitialized) return;
        
        console.log('🔄 Previous Swipe: 초기화 시작...');
        
        // DOM이 안정화될 때까지 기다림
        const isStabilized = await waitForLayoutStabilization();
        
        if (!isStabilized) {
            console.warn('🔄 Previous Swipe: DOM 안정화 실패, 초기화 건너뜀');
            return;
        }
        
        console.log('🔄 Previous Swipe: DOM 안정화 확인됨, 초기화 진행');
        
        // 메시지 관찰자 설정
        setupMessageObserver();
        
        // 기존 메시지들에 아이콘 추가
        addIconsToExistingMessages();
        
        isInitialized = true;
        console.log('🔄 Previous Swipe: ✅ 초기화 완료!');
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

    // 메시지에 아이콘 추가 (개선된 버전)
    function addIconToMessage(messageElement) {
        try {
            // messageElement가 실제 메시지 요소인지 확인
            let actualMessage = messageElement;
            if (!messageElement.classList.contains('mes')) {
                actualMessage = messageElement.querySelector('.mes');
                if (!actualMessage) {
                    return;
                }
            }

            // 이미 아이콘이 있는지 확인
            if (actualMessage.querySelector('.previous-swipe-icon')) {
                return;
            }

            // 사용자 메시지는 제외 (is_user 또는 user_mes 클래스 확인)
            if (actualMessage.classList.contains('user_mes') || 
                actualMessage.hasAttribute('is_user') ||
                actualMessage.querySelector('.user_mes')) {
                return;
            }

            // 메시지 헤더 찾기 (여러 선택자 시도)
            let messageHeader = actualMessage.querySelector('.mes_header') || 
                               actualMessage.querySelector('.message_header') ||
                               actualMessage.querySelector('.name_text')?.parentElement;
            
            if (!messageHeader) {
                console.log('🔄 Previous Swipe: 메시지 헤더를 찾을 수 없음', actualMessage);
                return;
            }

            // 아이콘 컨테이너 생성
            const iconContainer = document.createElement('div');
            iconContainer.className = 'previous-swipe-icon-container';
            iconContainer.style.cssText = `
                display: inline-flex;
                align-items: center;
                margin-left: 8px;
                position: absolute;
                right: 8px;
                top: 50%;
                transform: translateY(-50%);
                z-index: 100;
            `;
            
            // FontAwesome 아이콘 생성 (대체 방법 포함)
            const icon = document.createElement('i');
            icon.className = 'previous-swipe-icon fa-solid fa-lock';
            icon.title = '이전 메시지 스와이프 탐색 활성화';
            
            // FontAwesome이 로드되지 않은 경우 대체 텍스트 사용
            setTimeout(() => {
                const iconStyle = window.getComputedStyle(icon, '::before');
                if (!iconStyle.content || iconStyle.content === 'none' || iconStyle.content === '') {
                    console.log('🔄 Previous Swipe: FontAwesome 미감지, 텍스트 아이콘 사용');
                    icon.textContent = '🔒';
                    icon.style.fontFamily = 'Arial, sans-serif';
                }
            }, 100);
            
            icon.style.cssText = `
                cursor: pointer;
                font-size: 14px;
                color: #dc3545;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.2s ease;
                user-select: none;
                min-width: 20px;
                text-align: center;
                display: inline-block;
            `;
            
            iconContainer.appendChild(icon);
            
            // 클릭 이벤트 추가
            icon.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleIconClick(actualMessage, icon);
            });
            
            // 호버 효과 추가
            icon.addEventListener('mouseenter', () => {
                icon.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
                icon.style.transform = 'scale(1.1)';
            });
            
            icon.addEventListener('mouseleave', () => {
                icon.style.backgroundColor = '';
                icon.style.transform = 'scale(1)';
            });
            
            // 메시지 헤더를 상대 위치로 설정
            messageHeader.style.position = 'relative';
            
            // 메시지 헤더에 아이콘 추가
            messageHeader.appendChild(iconContainer);
            
            console.log('🔄 Previous Swipe: 아이콘 추가 완료', actualMessage);
            
        } catch (error) {
            console.error('🔄 Previous Swipe: 아이콘 추가 실패', error);
        }
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
        // 아이콘 변경 (FontAwesome + 대체 텍스트)
        icon.className = 'previous-swipe-icon fa-solid fa-unlock';
        icon.title = '이전 메시지 스와이프 탐색 비활성화';
        icon.style.color = '#28a745';
        
        // FontAwesome이 없는 경우 대체 텍스트
        setTimeout(() => {
            const iconStyle = window.getComputedStyle(icon, '::before');
            if (!iconStyle.content || iconStyle.content === 'none' || iconStyle.content === '' || icon.textContent) {
                icon.textContent = '🔓';
            }
        }, 50);
        
        // 언락된 메시지로 추가
        unlockedMessages.add(messageId);
        
        // 스와이프 네비게이터 추가
        addSwipeNavigator(messageElement);
        
        showToast('스와이프 탐색이 활성화되었습니다.');
    }

    // 메시지 락
    function lockMessage(messageElement, icon, messageId) {
        // 아이콘 변경 (FontAwesome + 대체 텍스트)
        icon.className = 'previous-swipe-icon fa-solid fa-lock';
        icon.title = '이전 메시지 스와이프 탐색 활성화';
        icon.style.color = '#dc3545';
        
        // FontAwesome이 없는 경우 대체 텍스트
        setTimeout(() => {
            const iconStyle = window.getComputedStyle(icon, '::before');
            if (!iconStyle.content || iconStyle.content === 'none' || iconStyle.content === '' || icon.textContent) {
                icon.textContent = '🔒';
            }
        }, 50);
        
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

    // **강화된 초기화 시스템** (참고용 스크립트 방식 적용)
    $(document).ready(function() {
        console.log('🔄 Previous Swipe: DOM 준비 완료');
        setTimeout(initialize, 1000);
        
        // SillyTavern 특화 이벤트 리스너 추가
        $(document).on('characterSelected chat_render_complete CHAT_CHANGED', () => {
            setTimeout(() => { 
                if (!isInitialized) {
                    console.log('🔄 Previous Swipe: 이벤트 기반 초기화 시도');
                    initialize(); 
                }
                // 기존 메시지들에 아이콘 다시 추가
                addIconsToExistingMessages();
            }, 500);
        });
        
        // 캐릭터 선택 변경 시
        $(document).on('change', '#character_select', () => {
            setTimeout(() => { 
                console.log('🔄 Previous Swipe: 캐릭터 변경 감지');
                if (!isInitialized) initialize(); 
                addIconsToExistingMessages();
            }, 200);
        });
        
        // 확장 탭 클릭 시
        $(document).on('click', '[data-i18n="Extensions"]', () => {
            setTimeout(() => { 
                console.log('🔄 Previous Swipe: 확장 탭 클릭 감지');
                if (!isInitialized) initialize(); 
            }, 500);
        });
        
        // 채팅 메시지 변화 감지
        $(document).on('DOMNodeInserted', '#chat', function(e) {
            if (e.target && e.target.classList && e.target.classList.contains('mes')) {
                setTimeout(() => {
                    console.log('🔄 Previous Swipe: 새 메시지 감지');
                    addIconToMessage(e.target);
                }, 100);
            }
        });
        
        // 백업 강제 초기화 (5초 후)
        setTimeout(() => {
            if (!isInitialized) {
                console.log('🔄 Previous Swipe: 타이머 강제 초기화 실행');
                initialize();
            }
        }, 5000);
        
        // 추가 백업 초기화 (10초 후)
        setTimeout(() => {
            if (!isInitialized) {
                console.log('🔄 Previous Swipe: 최종 백업 초기화 실행');
                waitForSillyTavern();
            }
        }, 10000);
    });

    // 기존 방식도 유지 (jQuery가 없을 경우 대비)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForSillyTavern);
    } else {
        waitForSillyTavern();
    }

    console.log('🔄 Previous Swipe: 스크립트 로드 완료');
})(); 