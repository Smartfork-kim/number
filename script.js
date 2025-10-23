// 게임 상태 관리
let gameState = {
    isPlaying: false,
    selectedNumbers: [],
    minNumber: 1,
    maxNumber: 45,
    selectedNumberCount: 1
};

// DOM 요소들
const mainScreen = document.getElementById('mainScreen');
const numberSelectionScreen = document.getElementById('numberSelectionScreen');
const startButton = document.getElementById('startButton');
const numberScrollArea = document.getElementById('numberScrollArea');
const selectionButtonContainer = document.getElementById('selectionButtonContainer');
const selectionButton = document.getElementById('selectionButton');
const rollingSound = document.getElementById('rollingSound');

// 팝업 관련 DOM 요소
const numberCountPopup = document.getElementById('numberCountPopup');
const popupNumberScrollArea = document.getElementById('popupNumberScrollArea');
const popupConfirmButton = document.getElementById('popupConfirmButton');
const popupReselectButton = document.getElementById('popupReselectButton');

// 게임 플레이 화면 DOM 요소
const gamePlayScreen = document.getElementById('gamePlayScreen');
const gameNumberScrollArea = document.getElementById('gameNumberScrollArea');
const winningOverlay = document.getElementById('winningOverlay');
const winningNumberDisplay = document.getElementById('winningNumberDisplay');

// 현재 중앙에 있는 숫자 추적
let currentCenterNumber = null;

// 선택한 맞출 숫자 개수
let selectedNumberCount = 0;

// 팝업에서 현재 중앙에 있는 숫자 추적
let popupCurrentCenterNumber = null;

// 게임 스크롤 애니메이션 관련 변수
let targetWinningNumbers = [];
let currentWinningIndex = 0;

// 당첨 번호 표시 함수
function showWinningNumber(winningNumber) {
    // choose number 효과음 정지
    stopChooseNumberSound();
    
    // choose 효과음 재생
    playChooseSound();
    
    // 오버레이 표시
    winningOverlay.style.display = 'flex';
    
    // 당첨 번호 이미지 생성
    const winningImage = document.createElement('img');
    winningImage.src = `number_img/Frame ${winningNumber}.png`;
    winningImage.className = 'winning-number-image';
    winningImage.alt = `당첨 번호 ${winningNumber}`;
    
    // 기존 이미지 제거 후 새 이미지 추가
    winningNumberDisplay.innerHTML = '';
    winningNumberDisplay.appendChild(winningImage);
    
}

// 당첨 번호 오버레이 숨기기 함수
function hideWinningOverlay() {
    winningOverlay.style.display = 'none';
}

// 게임 시작 함수
function startGame() {
    playButtonSound(); // 버튼 효과음 재생
    
    // 메인 화면 숨기기
    mainScreen.style.display = 'none';
    
    // 숫자 선택 화면 보이기
    numberSelectionScreen.style.display = 'flex';
    
    // 게임 상태 업데이트
    gameState.isPlaying = true;
    gameState.selectedNumbers = [];
    
    // 숫자 선택 화면 초기화
    initializeNumberSelection();
}

// 숫자 선택 화면 초기화
function initializeNumberSelection() {
    // 기존 숫자들 제거
    numberScrollArea.innerHTML = '';
    
    // 선택 완료 버튼 숨기기
    selectionButtonContainer.style.display = 'none';
    
    // 왼쪽에 투명한 더미 숫자 추가 (숫자 1이 중앙에 오도록)
    const dummyItem = document.createElement('div');
    dummyItem.className = 'selection-number-item dummy';
    dummyItem.dataset.number = '0';
    dummyItem.style.opacity = '0';
    dummyItem.style.pointerEvents = 'none';
    numberScrollArea.appendChild(dummyItem);
    
    // 1부터 45까지 숫자 이미지 생성
    for (let i = 1; i <= 45; i++) {
        const numberItem = document.createElement('div');
        numberItem.className = 'selection-number-item';
        numberItem.dataset.number = i;
        
        const img = document.createElement('img');
        img.src = `number_img/Frame ${i}.png`;
        img.alt = `숫자 ${i}`;
        img.className = 'selection-number-image';
        
        numberItem.appendChild(img);
        
        // 클릭 이벤트
        numberItem.addEventListener('click', () => selectNumber(i, numberItem));
        
        numberScrollArea.appendChild(numberItem);
    }
    
    // 오른쪽에 투명한 더미 숫자 추가 (숫자 45까지 스크롤 가능하도록)
    const rightDummyItem = document.createElement('div');
    rightDummyItem.className = 'selection-number-item dummy';
    rightDummyItem.dataset.number = '0';
    rightDummyItem.style.opacity = '0';
    rightDummyItem.style.pointerEvents = 'none';
    numberScrollArea.appendChild(rightDummyItem);
    
    // 스크롤 이벤트로 숫자 크기 조정 (즉시 반응)
    numberScrollArea.addEventListener('scroll', updateNumberSizes);
    
    // 초기 스크롤 위치 설정 (숫자 1이 중앙에 오도록)
    setTimeout(() => {
        // 양쪽 더미 아이템이 있으므로 초기 위치는 0px
        numberScrollArea.scrollLeft = 0;
        updateNumberSizes();
        
        // 초기 상태에서 버튼 숨김 (숫자 1이 중앙에 있으므로)
        selectionButtonContainer.style.display = 'none';
    }, 100);
}

// 스크롤 위치에 따라 숫자 크기 조정
function updateNumberSizes() {
    const scrollArea = numberScrollArea;
    const scrollAreaWidth = scrollArea.clientWidth;
    const scrollLeft = scrollArea.scrollLeft;
    const centerX = scrollLeft + (scrollAreaWidth / 2);
    
    const items = scrollArea.querySelectorAll('.selection-number-item');
    
    items.forEach((item, index) => {
        const itemRect = item.getBoundingClientRect();
        const scrollAreaRect = scrollArea.getBoundingClientRect();
        const itemCenterX = itemRect.left + (itemRect.width / 2) - scrollAreaRect.left + scrollLeft;
        
        const distanceFromCenter = Math.abs(itemCenterX - centerX);
        const maxDistance = scrollAreaWidth / 2;
        
        const number = item.dataset.number;
        
        // 중앙에서 30% 이내 거리에 있으면 중앙 숫자로 처리
        if (distanceFromCenter <= maxDistance * 0.3) {
            item.classList.remove('side');
            item.classList.add('center');
            
            // 중앙 숫자가 바뀌었을 때만 음성 재생
            if (currentCenterNumber !== number && number !== '0') {
                currentCenterNumber = number;
                playRollingSound();
                
                // 선택 완료 버튼 표시/숨김 제어
                updateSelectionButtonVisibility();
            }
        } else {
            item.classList.remove('center');
            item.classList.add('side');
        }
    });
}

// 선택 완료 버튼 표시/숨김 제어
function updateSelectionButtonVisibility() {
    if (currentCenterNumber && parseInt(currentCenterNumber) >= 2) {
        // 숫자 2 이상일 때 버튼 표시
        selectionButtonContainer.style.display = 'flex';
    } else {
        // 숫자 1일 때 버튼 숨김
        selectionButtonContainer.style.display = 'none';
    }
}

// rolling 음성 재생 함수
function playRollingSound() {
    if (rollingSound) {
        rollingSound.currentTime = 0; // 처음부터 재생
        rollingSound.volume = 0.5; // 볼륨 설정
        rollingSound.play().catch(error => {
            // 음성 재생 실패 시 무시
        });
    }
}

// 버튼 효과음 재생 함수
function playButtonSound() {
    const buttonSound = document.getElementById('buttonSound');
    if (buttonSound) {
        buttonSound.currentTime = 0; // 처음부터 재생
        buttonSound.volume = 0.7; // 볼륨 설정
        buttonSound.play().catch(error => {
            // 음성 재생 실패 시 무시
        });
    }
}

// choose 효과음 재생 함수 (반복)
function playChooseSound() {
    const chooseSound = document.getElementById('chooseSound');
    if (chooseSound) {
        chooseSound.currentTime = 0; // 처음부터 재생
        chooseSound.volume = 0.6; // 볼륨 설정
        chooseSound.play().catch(error => {
            // 음성 재생 실패 시 무시
        });
    }
}

// choose 효과음 정지 함수
function stopChooseSound() {
    const chooseSound = document.getElementById('chooseSound');
    if (chooseSound) {
        chooseSound.pause();
        chooseSound.currentTime = 0;
    }
}

// choose number 효과음 재생 함수
function playChooseNumberSound() {
    const chooseNumberSound = document.getElementById('chooseNumberSound');
    if (chooseNumberSound) {
        chooseNumberSound.currentTime = 0; // 처음부터 재생
        chooseNumberSound.volume = 0.8; // 볼륨 설정
        chooseNumberSound.play().catch(error => {
            // 음성 재생 실패 시 무시
        });
    }
}

// choose number 효과음 정지 함수
function stopChooseNumberSound() {
    const chooseNumberSound = document.getElementById('chooseNumberSound');
    if (chooseNumberSound) {
        chooseNumberSound.pause();
        chooseNumberSound.currentTime = 0;
    }
}


// 선택 완료 함수
function completeSelection() {
    playButtonSound(); // 버튼 효과음 재생
    
    // 현재 중앙에 있는 숫자를 기준으로 팝업 표시
    if (!currentCenterNumber || currentCenterNumber === '0') {
        return;
    }
    
    // 현재 중앙 숫자를 최대값으로 설정 (범위: 1 ~ 현재숫자)
    const centerNum = parseInt(currentCenterNumber);
    gameState.selectedNumbers = [centerNum]; // 현재 숫자만 선택된 것으로 설정
    
    // 범위 설정: 최소값은 항상 1, 최대값은 현재 중앙 숫자
    gameState.minNumber = 1;
    gameState.maxNumber = centerNum;
    
    // 팝업 표시
    showNumberCountPopup();
}

// 맞출 숫자 개수 선택 팝업 표시
function showNumberCountPopup() {
    // 현재 중앙에 있는 숫자를 기준으로 계산
    const currentNumber = parseInt(currentCenterNumber);
    
    // 최대값: 6개 또는 현재 숫자 - 1 중 작은 값
    const maxCount = Math.min(6, currentNumber - 1);
    
    if (maxCount <= 0) {
        return;
    }
    
    // 스크롤 영역 초기화
    popupNumberScrollArea.innerHTML = '';
    
    // 왼쪽 더미 아이템 추가
    const leftDummyItem = document.createElement('div');
    leftDummyItem.className = 'popup-number-item dummy';
    leftDummyItem.dataset.number = '0';
    leftDummyItem.style.opacity = '0';
    leftDummyItem.style.pointerEvents = 'none';
    popupNumberScrollArea.appendChild(leftDummyItem);
    
    // 1부터 maxCount까지 숫자 이미지 생성
    for (let i = 1; i <= maxCount; i++) {
        const numberItem = document.createElement('div');
        numberItem.className = 'popup-number-item';
        numberItem.dataset.number = i;
        
        const numberImage = document.createElement('img');
        numberImage.className = 'popup-number-image';
        numberImage.src = `number_img/Frame ${i}.png`;
        numberImage.alt = `숫자 ${i}`;
        
        numberItem.appendChild(numberImage);
        popupNumberScrollArea.appendChild(numberItem);
    }
    
    // 오른쪽 더미 아이템 추가
    const rightDummyItem = document.createElement('div');
    rightDummyItem.className = 'popup-number-item dummy';
    rightDummyItem.dataset.number = '0';
    rightDummyItem.style.opacity = '0';
    rightDummyItem.style.pointerEvents = 'none';
    popupNumberScrollArea.appendChild(rightDummyItem);
    
    // 스크롤 이벤트 리스너 추가
    popupNumberScrollArea.addEventListener('scroll', updatePopupNumberSizes);
    
    // 초기 스크롤 위치 설정 (숫자 1이 중앙에 오도록)
    setTimeout(() => {
        popupNumberScrollArea.scrollLeft = 0;
        updatePopupNumberSizes();
    }, 100);
    
    // 팝업 표시
    numberCountPopup.style.display = 'flex';
}


// 팝업에서 숫자 크기 조정
function updatePopupNumberSizes() {
    const scrollArea = popupNumberScrollArea;
    const scrollAreaWidth = scrollArea.clientWidth;
    const scrollLeft = scrollArea.scrollLeft;
    const centerX = scrollLeft + (scrollAreaWidth / 2);
    
    const items = scrollArea.querySelectorAll('.popup-number-item');
    
    items.forEach((item, index) => {
        const itemRect = item.getBoundingClientRect();
        const scrollAreaRect = scrollArea.getBoundingClientRect();
        const itemCenterX = itemRect.left + (itemRect.width / 2) - scrollAreaRect.left + scrollLeft;
        
        const distanceFromCenter = Math.abs(itemCenterX - centerX);
        const maxDistance = scrollAreaWidth / 2;
        
        const number = item.dataset.number;
        
        // 중앙에서 30% 이내 거리에 있으면 중앙 숫자로 처리
        if (distanceFromCenter <= maxDistance * 0.3) {
            item.classList.remove('side');
            item.classList.add('center');
            
            // 중앙 숫자가 바뀌었을 때만 선택 업데이트 및 음성 재생
            if (popupCurrentCenterNumber !== number && number !== '0') {
                popupCurrentCenterNumber = number;
                selectedNumberCount = parseInt(number);
                playRollingSound();
            }
        } else {
            item.classList.remove('center');
            item.classList.add('side');
        }
    });
}

// 팝업 선택 완료
function confirmNumberCount() {
    playButtonSound(); // 버튼 효과음 재생
    
    if (selectedNumberCount === 0) {
        alert('맞출 숫자 개수를 선택해주세요!');
        return;
    }
    
    // 팝업 닫기
    numberCountPopup.style.display = 'none';
    
    // 게임 플레이 화면 표시
    gamePlayScreen.style.display = 'flex';
    
    // 게임 스크롤 애니메이션 시작
    startGameScrollAnimation();
}

// 팝업에서 숫자 다시 선택
function reselectNumbers() {
    playButtonSound(); // 버튼 효과음 재생
    
    // 팝업 닫기
    numberCountPopup.style.display = 'none';
    
    // 숫자 선택 화면으로 돌아가기
    numberSelectionScreen.style.display = 'flex';
}


// 게임 재시작 (기존 함수 - 숫자 선택 화면으로 돌아가기)
function restartGame() {
    playButtonSound(); // 버튼 효과음 재생
    
    // 최종 결과 팝업과 게임 플레이 화면 숨기기
    document.getElementById('finalResultScreen').style.display = 'none';
    document.getElementById('gamePlayScreen').style.display = 'none';
    
    // 숫자 선택 화면으로 돌아가기
    document.getElementById('numberSelectionScreen').style.display = 'flex';
    
    // 숫자 선택 화면 다시 초기화
    initializeNumberSelection();
    
    // 게임 상태 초기화
    gameState = {
        isPlaying: false,
        selectedNumbers: [],
        minNumber: 1,
        maxNumber: 45,
        selectedNumberCount: 1
    };
    
    // 애니메이션 상태 초기화
    window.animationStopped = false;
    currentWinningIndex = 0;
    targetWinningNumbers = [];
}

// 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', function() {
    // 게임 시작 버튼 클릭 이벤트
    startButton.addEventListener('click', startGame);
    
    // 선택 완료 버튼 클릭 이벤트
    selectionButton.addEventListener('click', completeSelection);
    
    // 팝업 확인 버튼 클릭 이벤트
    popupConfirmButton.addEventListener('click', confirmNumberCount);
    
    // 팝업 다시 선택 버튼 클릭 이벤트
    popupReselectButton.addEventListener('click', reselectNumbers);
    
});


// 게임 스크롤 애니메이션 시작
function startGameScrollAnimation() {
    // choose number 효과음 시작 (반복 재생)
    playChooseNumberSound();
    
    // 사용자가 선택한 범위 내에서 여러 개의 당첨 번호 생성
    const minRange = gameState.minNumber || 1;
    const maxRange = gameState.maxNumber || 45;
    
    // 중복되지 않는 당첨 번호들 생성
    targetWinningNumbers = [];
    const availableNumbers = [];
    for (let i = minRange; i <= maxRange; i++) {
        availableNumbers.push(i);
    }
    
    // 선택된 개수만큼 랜덤으로 당첨 번호 선택
    for (let i = 0; i < selectedNumberCount; i++) {
        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        const selectedNumber = availableNumbers.splice(randomIndex, 1)[0];
        targetWinningNumbers.push(selectedNumber);
    }
    
    // 당첨 번호들을 오름차순으로 정렬
    targetWinningNumbers.sort((a, b) => a - b);
    
    // 현재 표시할 당첨 번호 인덱스 초기화
    currentWinningIndex = 0;
    
    // 게임 숫자 스크롤 영역 초기화
    gameNumberScrollArea.innerHTML = '';
    
    // 왼쪽 더미 아이템 추가 (중앙 정렬을 위해)
    const leftDummyItem = document.createElement('div');
    leftDummyItem.className = 'game-number-item dummy';
    leftDummyItem.dataset.number = '0';
    leftDummyItem.style.opacity = '0';
    leftDummyItem.style.pointerEvents = 'none';
    gameNumberScrollArea.appendChild(leftDummyItem);
    
    // 무한 루프를 위해 충분한 수의 숫자 이미지 생성 (최대 3바퀴 = 135개)
    for (let i = 1; i <= 135; i++) {
        const numberItem = document.createElement('div');
        numberItem.className = 'game-number-item';
        const actualNumber = ((i - 1) % 45) + 1; // 1~45 반복
        numberItem.dataset.number = actualNumber;
        
        const img = document.createElement('img');
        img.src = `number_img/Frame ${actualNumber}.png`;
        img.alt = `숫자 ${actualNumber}`;
        img.className = 'game-number-image';
        
        numberItem.appendChild(img);
        gameNumberScrollArea.appendChild(numberItem);
    }
    
    // 오른쪽 더미 아이템 추가 (중앙 정렬을 위해)
    const rightDummyItem = document.createElement('div');
    rightDummyItem.className = 'game-number-item dummy';
    rightDummyItem.dataset.number = '0';
    rightDummyItem.style.opacity = '0';
    rightDummyItem.style.pointerEvents = 'none';
    gameNumberScrollArea.appendChild(rightDummyItem);
    
    // 초기 상태 설정
    updateGameNumberDisplay();
    
    // 스크롤 애니메이션 시작
    startScrolling();
}

// 스크롤 애니메이션 시작 (픽셀 기반 정확한 계산)
function startScrolling() {
    const currentTargetNumber = targetWinningNumbers[currentWinningIndex];
    const itemWidth = 150; // 아이템 너비
    const gap = 20; // 갭
    const totalItemWidth = itemWidth + gap; // 총 아이템 너비 (170px)
    
    // 1단계: 가속 구간 (1~5번)
    const accelerationDistance = totalItemWidth * 5; // 850px
    const accelerationSteps = 5;
    
    // 2단계: 최대 속도 구간 계산
    let maxSpeedDistance = 0;
    const decelerationStartNumber = currentTargetNumber - 10;
    
    if (currentTargetNumber >= 16) {
        // 1바퀴 후 감속: 6~45 + 1~(당첨번호-10)
        const firstRound = totalItemWidth * (45 - 5); // 6~45 (40개) = 6,800px
        const secondRound = totalItemWidth * Math.max(0, decelerationStartNumber); // 1~(당첨번호-10)
        maxSpeedDistance = firstRound + secondRound;
    } else {
        // 2바퀴 완주 후 3바퀴째에서 감속: 6~45 + 1~(당첨번호+35)
        const firstRound = totalItemWidth * (45 - 5); // 6~45 (40개) = 6,800px
        const secondRound = totalItemWidth * (currentTargetNumber + 35); // 1~(당첨번호+35)
        maxSpeedDistance = firstRound + secondRound;
    }
    
    // 3단계: 감속 구간 (무조건 10개 구간 고정)
    const decelerationDistance = totalItemWidth * 10; // 1,700px
    
    // 시간 기반 부드러운 애니메이션 변수
    const totalDistance = accelerationDistance + maxSpeedDistance + decelerationDistance;
    let currentPixel = 0;
    const maxSpeed = 100;
    let currentSpeed = 2;
    const accelerationDuration = 2000;
    const frameRate = 60;
    
    let animationStartTime = Date.now();
    
    window.animationStopped = false;
    window.currentPixel = currentPixel;
    window.currentSpeed = currentSpeed;
    
    
    function animateFrame() {
        // 애니메이션이 중단되었으면 더 이상 실행하지 않음
        if (window.animationStopped) {
            return;
        }
        
        // 픽셀 기반 속도 계산
        if (currentPixel <= accelerationDistance) {
            // 가속 구간
            const elapsedTime = Date.now() - animationStartTime;
            const timeProgress = Math.min(elapsedTime / accelerationDuration, 1);
            currentSpeed = 2 + (maxSpeed - 2) * Math.pow(timeProgress, 1.5);
        } else if (currentPixel <= accelerationDistance + maxSpeedDistance) {
            // 최대속도 구간
            currentSpeed = maxSpeed;
        } else {
            // 감속 구간
            const remainingPixels = totalDistance - currentPixel;
            
            if (remainingPixels <= 200) {
                currentSpeed = 0;
                
                // 당첨번호 팝업 표시
                window.animationStopped = true;
                
                // 당첨 번호 오버레이 표시
                showWinningNumber(currentTargetNumber);
                
                // 1초 후 다음 당첨 번호로 진행하거나 완료
                setTimeout(() => {
                    hideWinningOverlay();
                    currentWinningIndex++;
                    
                    if (currentWinningIndex < targetWinningNumbers.length) {
                        // 다음 당첨 번호 애니메이션 - choose number 효과음 다시 시작
                        playChooseNumberSound();
                        startScrolling();
                    } else {
                        // 모든 당첨 번호 완료
                        
                        // 마지막 팝업도 1초 후 최종 화면으로
                        setTimeout(() => {
                            hideWinningOverlay();
                            stopChooseNumberSound(); // choose number 효과음 정지
                            showFinalResult();
                        }, 1000);
                    }
                }, 1000);
                return;
            } else {
                const decelerationProgress = Math.max(0, (1700 - remainingPixels) / 1700);
                currentSpeed = maxSpeed * Math.pow(1 - decelerationProgress, 2);
            }
        }
        
        // 픽셀 이동
        currentPixel += currentSpeed;
        window.currentPixel = currentPixel;
        window.currentSpeed = currentSpeed;
        
        updateGameNumberDisplay();
        
        // 다음 프레임
        setTimeout(animateFrame, 1000 / frameRate);
    }
    
    // 애니메이션 시작
    animateFrame();
}

// 게임 숫자 표시 업데이트 (픽셀 기반 정확한 계산)
function updateGameNumberDisplay() {
    // 모든 숫자를 동일한 크기로 유지 (중앙/사이드 구분 없음)
    const items = gameNumberScrollArea.querySelectorAll('.game-number-item');
    items.forEach((item) => {
        item.classList.remove('center', 'side');
    });
    
    // 현재 픽셀 위치를 직접 사용
    const pixelOffset = window.currentPixel || 0;
    
    // 스크롤 위치 적용
    gameNumberScrollArea.style.transform = `translateX(-${pixelOffset}px)`;
    
}

// 최종 결과 화면 표시
function showFinalResult() {
    // 다른 화면들만 숨기기
    document.getElementById('numberSelectionScreen').style.display = 'none';
    document.getElementById('numberCountPopup').style.display = 'none';
    document.getElementById('mainScreen').style.display = 'none';
    
    // 최종 결과 화면 표시 (게임 플레이 화면 위에 팝업으로)
    const finalScreen = document.getElementById('finalResultScreen');
    finalScreen.style.display = 'flex';
    
    // 당첨 번호들 표시
    displayFinalWinningNumbers();
    
    // 다시 하기 버튼 이벤트 리스너 추가
    document.getElementById('restartButton').onclick = restartGame;
}

// 최종 당첨 번호들 표시
function displayFinalWinningNumbers() {
    const finalWinningNumbers = document.getElementById('finalWinningNumbers');
    finalWinningNumbers.innerHTML = '';
    
    // 당첨 번호들을 정렬해서 표시
    const sortedWinningNumbers = [...targetWinningNumbers].sort((a, b) => a - b);
    
    sortedWinningNumbers.forEach(number => {
        const numberDiv = document.createElement('div');
        numberDiv.className = 'final-winning-number';
        
        const img = document.createElement('img');
        img.src = `number_img/Frame ${number}.png`;
        img.alt = number;
        
        numberDiv.appendChild(img);
        finalWinningNumbers.appendChild(numberDiv);
    });
}


// 전역 함수로 등록
window.startGame = startGame;