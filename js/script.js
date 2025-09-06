document.addEventListener('DOMContentLoaded', () => {

    // --- OBshchie peremennye i sostoyanie igry ---
    const screens = document.querySelectorAll('.screen');
    const menuButtons = document.querySelectorAll('.menu-buttons button, .back-to-menu');
    
    let currentLevel = 1;
    let totalLevels = 7; // Planiruem 7 urovney
    let gameTimer;
    let levelStartTime;
    const levelTimes = [];

    // --- ZVUKOVYE EFFEKTY (ispol'zuem biblioteku Howler.js) ---
    const sounds = {
        click: new Howl({ src: ['audio/click.mp3'], volume: 0.5 }),
        correct: new Howl({ src: ['audio/correct.mp3'], volume: 0.5 }),
        wrong: new Howl({ src: ['audio/wrong.mp3'], volume: 0.5 }),
        win: new Howl({ src: ['audio/win.mp3'], volume: 0.5 }),
        flip: new Howl({ src: ['audio/flip.mp3'], volume: 0.5 }),
    };
    // P.S. Ne zabud'te sozdat' papku 'audio' i polozhit' tuda zvuki (click.mp3, correct.mp3 i t.d.)


    // --- NAVIGACIYA MEZHDU EKRANAMI ---
    const showScreen = (screenId) => {
        screens.forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    };

    menuButtons.forEach(button => {
        button.addEventListener('click', () => {
            sounds.click.play();
            const screenId = button.dataset.screen || 'main-menu';
            if (screenId === 'game-area') {
                startGame();
            }
            showScreen(screenId);
        });
    });

    // --- Oсновная функция zapuska igry ---
    const startGame = () => {
        currentLevel = 1;
        levelTimes.length = 0;
        document.getElementById('level-indicator').textContent = `Уровень ${currentLevel}/${totalLevels}`;
        startLevel(currentLevel);
    };
    
    // --- Oсновная функция perehoda na sleduyushchiy uroven' ---
    const nextLevel = () => {
        // Zapisyvaem vremya prohozhdeniya urovnya
        const levelEndTime = performance.now();
        const timeTaken = ((levelEndTime - levelStartTime) / 1000).toFixed(2);
        levelTimes.push(timeTaken);
        
        currentLevel++;
        if (currentLevel > totalLevels) {
            endGame();
        } else {
            document.getElementById('level-indicator').textContent = `Уровень ${currentLevel}/${totalLevels}`;
            startLevel(currentLevel);
        }
    };

    // --- Zapusk konkretnogo urovnya ---
    const startLevel = (level) => {
        // Skryvaem vse igrovye urovni
        document.querySelectorAll('.game-level').forEach(lvl => lvl.classList.remove('active'));
        // Pokazyvaem nuzhnyy
        const currentLevelElement = document.getElementById(`level-${level}`);
        if (currentLevelElement) {
            currentLevelElement.classList.add('active');
            levelStartTime = performance.now();
            startTimer();
            // Initsializiruem logiku dlya konkretnogo urovnya
            switch(level) {
                case 1: initLevel1(); break;
                case 2: initLevel2(); break;
                case 3: initLevel3(); break;
                case 4: initLevel4(); break;
                case 5: initLevel5(); break;
            }
        } else {
            console.error(`Uroven' ${level} ne nayden!`);
        }
    };
    
    // --- Logika таймера ---
    const stopTimer = () => clearInterval(gameTimer);
    const startTimer = () => {
        stopTimer();
        gameTimer = setInterval(() => {
            const elapsedTime = ((performance.now() - levelStartTime) / 1000).toFixed(2);
            document.getElementById('timer').textContent = `Время: ${elapsedTime}с`;
        }, 100);
    };

    // --- Logika konca igry ---
    const endGame = () => {
        stopTimer();
        sounds.win.play();
        const totalTime = levelTimes.reduce((acc, time) => acc + parseFloat(time), 0).toFixed(2);
        document.getElementById('final-time').textContent = `Ваше общее время: ${totalTime}с`;
        const timesList = document.getElementById('level-times-list');
        timesList.innerHTML = '';
        levelTimes.forEach((time, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>Уровень ${index + 1}</span> <span>${time}с</span>`;
            timesList.appendChild(li);
        });
        showScreen('results-screen');
    };


    // ==========================================================
    // --- UROVEN' 1: UGADAY CHISLO ---
    // ==========================================================
    let targetNumberLvl1;
    const sliderLvl1 = document.getElementById('guess-slider');
    const sliderValueLvl1 = document.getElementById('slider-value');
    const sliderEmojiLvl1 = document.getElementById('slider-emoji');
    const hintLvl1 = document.getElementById('guess-hint');
    const checkBtnLvl1 = document.getElementById('check-guess-btn');

    function initLevel1() {
        targetNumberLvl1 = Math.floor(Math.random() * 101);
        sliderLvl1.value = 50;
        sliderValueLvl1.textContent = '50';
        hintLvl1.textContent = 'Двигай смайлик, чтобы угадать число';
        updateEmojiPosition();
    }
    
    function updateEmojiPosition() {
        const percent = (sliderLvl1.value / 100);
        const offset = percent * sliderLvl1.offsetWidth - (sliderLvl1.offsetWidth * 0.02);
        sliderEmojiLvl1.style.left = `calc(${percent * 100}% - ${offset}px)`;
        sliderValueLvl1.textContent = sliderLvl1.value;
    }
    
    sliderLvl1.addEventListener('input', updateEmojiPosition);
    
    checkBtnLvl1.addEventListener('click', () => {
        const guess = parseInt(sliderLvl1.value);
        hintLvl1.style.animation = 'none';
        void hintLvl1.offsetWidth; // Trigger reflow
        hintLvl1.style.animation = 'hint-appear 0.5s forwards';

        if (guess === targetNumberLvl1) {
            sounds.correct.play();
            hintLvl1.textContent = `Верно! Это было число ${targetNumberLvl1}`;
            setTimeout(nextLevel, 1500);
        } else if (guess < targetNumberLvl1) {
            sounds.wrong.play();
            hintLvl1.textContent = 'Попробуй число БОЛЬШЕ';
        } else {
            sounds.wrong.play();
            hintLvl1.textContent = 'Попробуй число МЕНЬШЕ';
        }
    });

    // ==========================================================
    // --- UROVEN' 2: NAYDI PARU ---
    // ==========================================================
    const memoryBoard = document.getElementById('memory-board');
    let flippedCards = [];
    let matchedPairs = 0;
    let lockBoard = false;

    function initLevel2() {
        memoryBoard.innerHTML = '';
        flippedCards = [];
        matchedPairs = 0;
        lockBoard = false;

        const cardImages = ['card-1', 'card-2', 'card-3', 'card-4', 'card-5', 'card-6'];
        const gameCards = [...cardImages, ...cardImages]
            .sort(() => 0.5 - Math.random());
        
        gameCards.forEach(cardName => {
            const card = document.createElement('div');
            card.classList.add('memory-card');
            card.dataset.name = cardName;
            card.innerHTML = `
                <div class="card-face card-front"><img src="images/${cardName}.png" alt="Card"></div>
                <div class="card-face card-back"><img src="images/card-back.png" alt="Card Back"></div>
            `;
            card.addEventListener('click', flipCard);
            memoryBoard.appendChild(card);
        });
    }

    function flipCard() {
        if (lockBoard || this.classList.contains('is-flipped')) return;
        sounds.flip.play();
        this.classList.add('is-flipped');
        flippedCards.push(this);
        if (flippedCards.length === 2) {
            checkForMatch();
        }
    }
    
    function checkForMatch() {
        lockBoard = true;
        const [card1, card2] = flippedCards;
        if (card1.dataset.name === card2.dataset.name) {
            sounds.correct.play();
            matchedPairs++;
            card1.classList.add('is-matched');
            card2.classList.add('is-matched');
            resetFlipped();
            if (matchedPairs === 6) {
                setTimeout(nextLevel, 1000);
            }
        } else {
            setTimeout(() => {
                sounds.wrong.play();
                card1.classList.remove('is-flipped');
                card2.classList.remove('is-flipped');
                resetFlipped();
            }, 1000);
        }
    }
    
    function resetFlipped() {
        flippedCards = [];
        lockBoard = false;
    }


    // ==========================================================
    // --- UROVEN' 3: KAMEN'-NOZHNICY-BUMAGA ---
    // ==========================================================
    const rpsChoices = document.querySelectorAll('.rps-choices img');
    const playerChoiceDisplay = document.getElementById('player-choice-display');
    const computerChoiceDisplay = document.getElementById('computer-choice-display');
    const rpsMessage = document.getElementById('rps-message');
    const rpsScoreDisplay = document.getElementById('rps-score');
    let rpsWins = 0;
    const choices = ['rock', 'paper', 'scissors'];

    function initLevel3() {
        rpsWins = 0;
        rpsScoreDisplay.textContent = `Побед: ${rpsWins}/3`;
        playerChoiceDisplay.innerHTML = '';
        computerChoiceDisplay.innerHTML = '';
        rpsMessage.textContent = 'Сделай свой ход!';
    }
    
    rpsChoices.forEach(choice => choice.addEventListener('click', (e) => {
        sounds.click.play();
        const playerChoice = e.target.dataset.choice;
        playerChoiceDisplay.innerHTML = `<img src="images/${playerChoice}.png">`;

        const computerIndex = Math.floor(Math.random() * 3);
        const computerChoice = choices[computerIndex];
        
        // Animaciya vybora robota
        computerChoiceDisplay.classList.add('shaking');
        let shakeCount = 0;
        const shakeInterval = setInterval(() => {
            const randomImage = choices[Math.floor(Math.random() * 3)];
            computerChoiceDisplay.innerHTML = `<img src="images/${randomImage}.png">`;
            shakeCount++;
            if(shakeCount > 10) {
                clearInterval(shakeInterval);
                computerChoiceDisplay.classList.remove('shaking');
                computerChoiceDisplay.innerHTML = `<img src="images/${computerChoice}.png">`;
                determineWinner(playerChoice, computerChoice);
            }
        }, 100);
    }));

    function determineWinner(player, computer) {
        if (player === computer) {
            rpsMessage.textContent = "Ничья! Попробуй еще раз.";
        } else if (
            (player === 'rock' && computer === 'scissors') ||
            (player === 'paper' && computer === 'rock') ||
            (player === 'scissors' && computer === 'paper')
        ) {
            sounds.correct.play();
            rpsMessage.textContent = "Ты выиграл раунд!";
            rpsWins++;
            rpsScoreDisplay.textContent = `Побед: ${rpsWins}/3`;
            if (rpsWins === 3) {
                setTimeout(nextLevel, 1000);
            }
        } else {
            sounds.wrong.play();
            rpsMessage.textContent = "Робот выиграл раунд. Не сдавайся!";
        }
    }


    // ==========================================================
    // --- UROVEN' 4: VIKTORINA ---
    // ==========================================================
    const quizQuestionEl = document.getElementById('quiz-question');
    const quizOptionsEl = document.getElementById('quiz-options');
    const quizScoreEl = document.getElementById('quiz-score');
    let quizQuestions = [];
    let currentQuestionIndex = 0;
    let quizScore = 0;

    // !!! DOBAV'TE SVOI VOPROSY SYuDA !!!
    const allQuestions = [
        {
            question: "Дата релиза Brawl Stars?",
            options: ["2019 год", "2018 год", "2020 год", "2021 год"],
            answer: "2018 год"
        },
        {
            question: "Сколько всего карт в Clash Royale?",
            options: ["111", "129", "121", "132"],
            answer: "121"
        },
        // Dobav'te eshche 98 voprosov po analogii
        { question: "Какая столица Франции?", options: ["Берлин", "Мадрид", "Париж", "Рим"], answer: "Париж" },
        { question: "Сколько планет в Солнечной системе?", options: ["8", "9", "7", "10"], answer: "8" },
        // ... i tak dalee
    ];

    function initLevel4() {
        quizScore = 0;
        currentQuestionIndex = 0;
        quizScoreEl.textContent = `Правильных ответов: ${quizScore}/10`;
        // Vybiraem 10 sluchaynyh voprosov
        quizQuestions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 10);
        displayQuizQuestion();
    }

    function displayQuizQuestion() {
        const questionData = quizQuestions[currentQuestionIndex];
        quizQuestionEl.textContent = questionData.question;
        quizOptionsEl.innerHTML = '';
        questionData.options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.addEventListener('click', checkQuizAnswer);
            quizOptionsEl.appendChild(button);
        });
    }

    function checkQuizAnswer(e) {
        const selectedButton = e.target;
        const isCorrect = selectedButton.textContent === quizQuestions[currentQuestionIndex].answer;
        
        // Podsvechivaem vse knopki
        Array.from(quizOptionsEl.children).forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === quizQuestions[currentQuestionIndex].answer) {
                btn.classList.add('correct');
            } else {
                btn.classList.add('incorrect');
            }
        });
        
        if (isCorrect) {
            sounds.correct.play();
            quizScore++;
            quizScoreEl.textContent = `Правильных ответов: ${quizScore}/10`;
        } else {
            sounds.wrong.play();
        }

        setTimeout(() => {
            if (quizScore === 10) {
                nextLevel();
            } else {
                currentQuestionIndex++;
                if (currentQuestionIndex < quizQuestions.length) {
                    displayQuizQuestion();
                } else {
                    // Chto delat', esli 10 voprosov zakonchilis', a 10 pravil'nyh otvetov net?
                    // Mozhno nachat' zanovo ili sdelat' chto-to eshche. Pokazhem soobshchenie i nachnem zanovo uroven'.
                    alert("Вы не набрали 10 очков. Уровень начнется заново!");
                    initLevel4();
                }
            }
        }, 1500);
    }

    // ==========================================================
    // --- UROVEN' 5: 2D SBOR (na Canvas) ---
    // ==========================================================
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    let player, emeralds, bombs, gameLoopId, emeraldScore, keys = {};
    const emeraldScoreEl = document.getElementById('emerald-score');

    // Zagruzka izobrazheniy
    const playerImgIdle = new Image(); playerImgIdle.src = 'images/player-idle.png';
    const playerImgWalk1 = new Image(); playerImgWalk1.src = 'images/player-walk-1.png';
    const playerImgWalk2 = new Image(); playerImgWalk2.src = 'images/player-walk-2.png';
    const emeraldImg = new Image(); emeraldImg.src = 'images/emerald.png';
    const bombImg = new Image(); bombImg.src = 'images/bomb.png';
    
    function initLevel5() {
        emeraldScore = 0;
        emeraldScoreEl.textContent = `Собрано изумрудов: ${emeraldScore}/15`;
        keys = {};
        player = {
            x: canvas.width / 2 - 25, y: canvas.height - 60, width: 50, height: 50, speed: 5, frame: 0, frameCounter: 0
        };
        emeralds = [];
        bombs = [];

        if (gameLoopId) cancelAnimationFrame(gameLoopId);
        gameLoop();
    }

    function gameLoop() {
        updateGameState();
        drawGame();
        gameLoopId = requestAnimationFrame(gameLoop);
    }
    
    function updateGameState() {
        // Dvizhenie igroka
        if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
        if (keys['ArrowRight'] && player.x < canvas.width - player.width) player.x += player.speed;

        // Animaciya igroka
        if (keys['ArrowLeft'] || keys['ArrowRight']) {
            player.frameCounter++;
            if(player.frameCounter > 5) {
                player.frame = (player.frame + 1) % 2;
                player.frameCounter = 0;
            }
        }

        // Dobavlenie izumrudov i bomb
        if (Math.random() < 0.03) emeralds.push({ x: Math.random() * (canvas.width - 30), y: -30, width: 30, height: 30 });
        if (Math.random() < 0.02) bombs.push({ x: Math.random() * (canvas.width - 30), y: -30, width: 30, height: 30 });

        // Dvizhenie i proverka stolknoveniy
        emeralds.forEach((e, i) => {
            e.y += 3;
            if (e.y > canvas.height) emeralds.splice(i, 1);
            if (isColliding(player, e)) {
                sounds.correct.play();
                emeralds.splice(i, 1);
                emeraldScore++;
                emeraldScoreEl.textContent = `Собрано изумрудов: ${emeraldScore}/15`;
                if(emeraldScore >= 15) {
                    cancelAnimationFrame(gameLoopId);
                    setTimeout(nextLevel, 500);
                }
            }
        });
        bombs.forEach((b, i) => {
            b.y += 4;
            if (b.y > canvas.height) bombs.splice(i, 1);
            if (isColliding(player, b)) {
                sounds.wrong.play();
                alert("Вы проиграли! Уровень начнется заново.");
                cancelAnimationFrame(gameLoopId);
                initLevel5();
            }
        });
    }

    function drawGame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Risovka igroka
        let currentFrame;
        if (!keys['ArrowLeft'] && !keys['ArrowRight']) {
            currentFrame = playerImgIdle;
        } else {
            currentFrame = player.frame === 0 ? playerImgWalk1 : playerImgWalk2;
        }
        ctx.drawImage(currentFrame, player.x, player.y, player.width, player.height);
        // Risovka predmetov
        emeralds.forEach(e => ctx.drawImage(emeraldImg, e.x, e.y, e.width, e.height));
        bombs.forEach(b => ctx.drawImage(bombImg, b.x, b.y, b.width, b.height));
    }
    
    function isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    window.addEventListener('keydown', (e) => keys[e.key] = true);
    window.addEventListener('keyup', (e) => keys[e.key] = false);
    

    // ==========================================================
    // --- LOGIKA NASTROEK ---
    // ==========================================================
    const themeToggle = document.getElementById('theme-toggle');
    const volumeSlider = document.getElementById('volume-slider');

    themeToggle.addEventListener('change', () => {
        document.body.classList.toggle('light-theme', themeToggle.checked);
        document.body.classList.toggle('dark-theme', !themeToggle.checked);
    });
    
    volumeSlider.addEventListener('input', () => {
        const newVolume = parseFloat(volumeSlider.value);
        for (const sound in sounds) {
            sounds[sound].volume(newVolume);
        }
    });

});