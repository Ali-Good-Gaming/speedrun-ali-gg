// Основные переменные и состояние приложения
let currentScreen = 'main-menu';
let gameState = {
    currentLevel: 1,
    levelTimes: [],
    totalTime: 0,
    timerInterval: null
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    // Восстановление темы из localStorage
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('theme-switch').checked = (savedTheme === 'dark');
    
    // Восстановление громкости
    const savedVolume = localStorage.getItem('volume') || 80;
    document.getElementById('volume-slider').value = savedVolume;
    
    // Показ главного меню
    showScreen('main-menu');
    
    // Запуск таймера при начале игры
    // initTimer(); // Будет запускаться при начале игры
});

// Переключение между экранами
function showScreen(screenId) {
    // Скрыть все экраны
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Показать запрошенный экран
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;
    
    // Если переходим к игре, инициализируем уровень
    if (screenId === 'play') {
        initializeLevel(gameState.currentLevel);
        startTimer();
    }
}

// Инициализация уровня игры
function initializeLevel(levelNumber) {
    const levelContainer = document.querySelector('.level-container');
    levelContainer.innerHTML = ''; // Очистка контейнера
    
    switch(levelNumber) {
        case 1:
            initGuessNumberGame(levelContainer);
            break;
        case 2:
            initMemoryGame(levelContainer);
            break;
        case 3:
            initRockPaperScissors(levelContainer);
            break;
        case 4:
            initQuizGame(levelContainer);
            break;
        case 5:
            init2DGame(levelContainer);
            break;
        default:
            showResults();
    }
}

// Таймер игры
function startTimer() {
    clearInterval(gameState.timerInterval);
    const startTime = Date.now() - gameState.totalTime;
    
    gameState.timerInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        gameState.totalTime = elapsedTime;
        updateTimerDisplay(elapsedTime);
    }, 10);
}

function stopTimer() {
    clearInterval(gameState.timerInterval);
}

function updateTimerDisplay(time) {
    const hours = Math.floor(time / 3600000);
    const minutes = Math.floor((time % 3600000) / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const ms = Math.floor((time % 1000) / 10);
    
    document.getElementById('global-timer').textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

// Переход к следующему уровню
function nextLevel() {
    // Зафиксировать время прохождения текущего уровня
    const levelTime = gameState.totalTime - gameState.levelTimes.reduce((a, b) => a + b, 0);
    gameState.levelTimes.push(levelTime);
    
    // Перейти к следующему уровню или показать результаты
    gameState.currentLevel++;
    if (gameState.currentLevel <= 5) {
        initializeLevel(gameState.currentLevel);
    } else {
        showResults();
    }
}

// Показ результатов после прохождения всех уровней
function showResults() {
    stopTimer();
    
    const levelContainer = document.querySelector('.level-container');
    levelContainer.innerHTML = `
        <h2>Результаты</h2>
        <p>Общее время: ${formatTime(gameState.totalTime)}</p>
        <div class="level-results">
            ${gameState.levelTimes.map((time, index) => `
                <p>Уровень ${index + 1}: ${formatTime(time)}</p>
            `).join('')}
        </div>
        <button onclick="showScreen('main-menu')">В главное меню</button>
    `;
}

function formatTime(time) {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const ms = Math.floor((time % 1000) / 10);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

// Настройки темы
document.getElementById('theme-switch').addEventListener('change', function(e) {
    const theme = e.target.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
});

// Настройки громкости
document.getElementById('volume-slider').addEventListener('input', function(e) {
    localStorage.setItem('volume', e.target.value);
    // Здесь можно добавить логику изменения громкости аудио
});

// ===== РЕАЛИЗАЦИЯ КОНКРЕТНЫХ ИГР =====

// 1. Игра "Угадай число"
function initGuessNumberGame(container) {
    const secretNumber = Math.floor(Math.random() * 101);
    let attempts = 0;
    
    container.innerHTML = `
        <h2>Уровень 1: Угадай число</h2>
        <div class="slider-container">
            <input type="range" min="0" max="100" value="50" class="slider" id="number-slider">
            <div class="slider-value">Текущее значение: <span id="current-value">50</span></div>
        </div>
        <button id="guess-button">Проверить</button>
        <div id="hint" class="hint"></div>
    `;
    
    const slider = document.getElementById('number-slider');
    const currentValue = document.getElementById('current-value');
    const guessButton = document.getElementById('guess-button');
    const hint = document.getElementById('hint');
    
    slider.addEventListener('input', () => {
        currentValue.textContent = slider.value;
    });
    
    guessButton.addEventListener('click', () => {
        attempts++;
        const guess = parseInt(slider.value);
        
        if (guess === secretNumber) {
            hint.textContent = `Поздравляю! Вы угадали число ${secretNumber} за ${attempts} попыток.`;
            hint.style.color = 'var(--success-color)';
            
            // Автопереход через 2 секунды
            setTimeout(nextLevel, 2000);
        } else if (guess < secretNumber) {
            hint.textContent = 'Попробуйте число больше';
            hint.style.color = 'var(--error-color)';
            // Анимация появления подсказки
            hint.style.animation = 'fadeIn 0.5s';
            setTimeout(() => hint.style.animation = '', 500);
        } else {
            hint.textContent = 'Попробуйте число меньше';
            hint.style.animation = 'fadeIn 0.5s';
            setTimeout(() => hint.style.animation = '', 500);
        }
    });
}

// 2. Игра "Найди пару"
function initMemoryGame(container) {
    // Здесь будет реализация игры с карточками
    // Для краткости приведу псевдокод:
    // - Создать массив пар карточек (6 пар = 12 карточек)
    // - Перемешать массив
    // - Отобразить сетку 4x3 с карточками
    // - Реализовать логику переворота и проверки совпадений
    // - При нахождении всех пар вызвать nextLevel()
    
    container.innerHTML = `
        <h2>Уровень 2: Найди пару</h2>
        <div class="memory-game">
            <p>Реализация игры в процессе...</p>
        </div>
    `;
}

// 3. Игра "Камень-Ножницы-Бумага"
function initRockPaperScissors(container) {
    // Аналогично, реализация игры
    container.innerHTML = `
        <h2>Уровень 3: Камень-Ножницы-Бумага</h2>
        <div class="rps-game">
            <p>Реализация игры в процессе...</p>
        </div>
    `;
}

// 4. Викторина
function initQuizGame(container) {
    // Здесь будет реализация викторины
    container.innerHTML = `
        <h2>Уровень 4: Викторина</h2>
        <div class="quiz-game">
            <p>Реализация викторины в процессе...</p>
        </div>
    `;
}

// 5. 2D игра
function init2DGame(container) {
    // Здесь будет реализация 2D игры
    container.innerHTML = `
        <h2>Уровень 5: Сбор изумрудов</h2>
        <div class="game-2d">
            <p>Реализация 2D игры в процессе...</p>
        </div>
    `;
}

// Добавим CSS анимации в стили
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .hint {
        margin-top: 1rem;
        padding: 0.5rem;
        border-radius: 5px;
        text-align: center;
        font-weight: bold;
    }
`;
document.head.appendChild(style);
/* Добавьте это в конец styles.css */

/* Анимации для переходов между уровнями */
@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(-100%); opacity: 0; }
}

.level-container {
    animation: slideIn 0.5s forwards;
}

/* Анимации для карточек */
.memory-card {
    transition: transform 0.6s;
    transform-style: preserve-3d;
}

.memory-card.flipped {
    transform: rotateY(180deg);
}

/* Анимация сбора изумрудов */
.emerald {
    animation: fall linear infinite;
}

@keyframes fall {
    from { transform: translateY(-100px); }
    to { transform: translateY(100vh); }
}

/* Анимация взрыва */
@keyframes explode {
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(3); opacity: 0; }
}

.explosion {
    animation: explode 0.5s forwards;
}