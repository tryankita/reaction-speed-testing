// DOM Elements
const startBtn = document.getElementById('startBtn');
const gameArea = document.getElementById('gameArea');
const gameMessage = document.getElementById('gameMessage');
const reactionTimeDisplay = document.getElementById('reactionTime');
const feedbackDisplay = document.getElementById('feedback');
const retryBtn = document.getElementById('retryBtn');
const bestScoreDisplay = document.getElementById('bestScore');
const attemptCountDisplay = document.getElementById('attemptCount');
const averageScoreDisplay = document.getElementById('averageScore');
const shareBtn = document.getElementById('shareBtn');
const leaderboardList = document.getElementById('leaderboardList');
const soundToggle = document.getElementById('soundToggle');
const comparisonContainer = document.getElementById('comparisonContainer');
const userMarker = document.getElementById('userMarker');
const statsBtn = document.getElementById('statsBtn');
const statsModal = document.getElementById('statsModal');
const closeModal = document.getElementById('closeModal');
const modalBest = document.getElementById('modalBest');
const modalAvg = document.getElementById('modalAvg');
const modalCount = document.getElementById('modalCount');
const statsChart = document.getElementById('statsChart');

// Game State
// Game State
let startTime = 0;
let bestScore = null;
let leaderboard = [];
let isMuted = false;

try {
    bestScore = localStorage.getItem('bestReactionTime');
    leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    isMuted = localStorage.getItem('isMuted') === 'true';
} catch (e) {
    console.warn('LocalStorage not available:', e);
}

let keyPressed = false; // Prevent multiple key presses
let gameState = 'idle'; // idle, waiting, ready, result
let attemptCount = 0;
let totalReactionTime = 0; // For calculating average
let history = []; // Session history for chart
let currentDifficulty = 'normal'; // easy, normal, hard

// Difficulty Selectors
const difficultyBtns = document.querySelectorAll('.btn-difficulty');

difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active state
        difficultyBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Set difficulty
        currentDifficulty = btn.getAttribute('data-mode');

        // Reset game if not idle
        if (gameState !== 'idle') {
            retryBtn.click();
        }
    });
});

// Apply initial mute state
if (isMuted) {
    soundToggle.textContent = '🔇';
    soundToggle.classList.add('muted');
}

// Sound Toggle Handler
soundToggle.addEventListener('click', function () {
    isMuted = !isMuted;
    try {
        localStorage.setItem('isMuted', isMuted);
    } catch (e) {
        // storage disabled, ignore
    }

    if (isMuted) {
        soundToggle.textContent = '🔇';
        soundToggle.classList.add('muted');
    } else {
        soundToggle.textContent = '🔊';
        soundToggle.classList.remove('muted');
    }
});

// Display best score on load
if (bestScore) {
    bestScoreDisplay.textContent = '🏆 Best: ' + bestScore + ' ms';
}

// Confetti Animation
function triggerConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti-container';

    for (let i = 0; i < 20; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        container.appendChild(confetti);
    }

    document.body.appendChild(container);

    // Remove after animation
    setTimeout(() => {
        container.remove();
    }, 3500);
}

// Leaderboard functions
function updateLeaderboard(score) {
    leaderboard.push(score);
    leaderboard.sort((a, b) => a - b); // Sort ascending (fastest first)
    leaderboard = leaderboard.slice(0, 5); // Keep only top 5
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    displayLeaderboard();
}

function displayLeaderboard() {
    leaderboardList.innerHTML = '';
    leaderboard.forEach((score, index) => {
        const li = document.createElement('li');
        li.textContent = score + ' ms';
        if (index === 0) li.style.color = '#ffd700'; // Gold for 1st
        if (index === 1) li.style.color = '#c0c0c0'; // Silver for 2nd
        if (index === 2) li.style.color = '#cd7f32'; // Bronze for 3rd
        leaderboardList.appendChild(li);
    });
}

// Display leaderboard on load
displayLeaderboard();

// Stats Functions
function updateStats() {
    // Basic Stats
    modalCount.textContent = attemptCount;
    modalAvg.textContent = (attemptCount > 0 ? Math.round(totalReactionTime / attemptCount) : '--') + ' ms';
    modalBest.textContent = (bestScore ? bestScore : '--') + ' ms';

    // Chart
    statsChart.innerHTML = '';
    const recentHistory = history.slice(-10); // Last 10

    if (recentHistory.length === 0) return;

    const maxTime = Math.max(...recentHistory); // For scaling

    recentHistory.forEach(time => {
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        // Calculate height (percentage of max, but kept reasonable)
        const height = (time / maxTime) * 100;
        bar.style.height = height + '%';
        bar.setAttribute('data-time', time);

        // Color coding based on speed
        if (time < 200) bar.style.background = '#ffd700'; // Gold
        else if (time < 300) bar.style.background = '#00ff88'; // Green
        else if (time < 400) bar.style.background = '#00d4ff'; // Blue
        else bar.style.background = '#ff6b6b'; // Red

        statsChart.appendChild(bar);
    });
}

// Stats Modal Event Listeners
statsBtn.addEventListener('click', () => {
    updateStats();
    statsModal.style.display = 'flex';
});

closeModal.addEventListener('click', () => {
    statsModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === statsModal) {
        statsModal.style.display = 'none';
    }
});

// Sound Effects using Web Audio API
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playBeep(frequency, duration) {
    if (isMuted) return; // Don't play if muted

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function playGoSound() {
    playBeep(880, 0.15); // High beep for GO
}

function playClickSound() {
    playBeep(440, 0.1); // Medium beep for click
}

// Start Button Click Handler
startBtn.addEventListener('click', function () {
    if (gameState !== 'idle') return; // Prevent multiple starts

    gameState = 'countdown';

    // Hide start button
    startBtn.style.display = 'none';

    // Countdown 3, 2, 1
    let count = 3;
    gameMessage.textContent = count;

    const countdownInterval = setInterval(function () {
        count--;
        if (count > 0) {
            gameMessage.textContent = count;
        } else {
            clearInterval(countdownInterval);

            // Start the actual game
            gameState = 'waiting';
            gameMessage.textContent = 'Wait for green...';
            gameArea.classList.add('waiting');

            // Difficulty-based delay
            let minDelay = 2000;
            let maxDelay = 5000;

            if (currentDifficulty === 'easy') {
                minDelay = 3000; // Slower, more predictable
                maxDelay = 6000;
            } else if (currentDifficulty === 'hard') {
                minDelay = 1000; // Faster, less predictable
                maxDelay = 4000;
            }

            // Random delay between min and max
            const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;

            setTimeout(function () {
                if (gameState !== 'waiting') return; // Game was reset

                gameState = 'ready';

                // Change to green (ready state)
                gameArea.classList.remove('waiting');
                gameArea.classList.add('ready');
                gameMessage.textContent = 'CLICK NOW!';

                // Hard mode: Make target smaller
                if (currentDifficulty === 'hard') {
                    gameArea.style.width = '200px';
                    gameArea.style.height = '200px';
                    gameArea.style.borderRadius = '50%'; // Circular target
                } else {
                    gameArea.style.width = '100%';
                    gameArea.style.height = '250px';
                    gameArea.style.borderRadius = '20px';
                }

                // Play GO sound
                playGoSound();

                // Record the time when green appears
                startTime = Date.now();
            }, randomDelay);
        }
    }, 1000);
});

// Game Area Click Handler
gameArea.addEventListener('click', function () {
    // Only calculate if game is in ready state
    if (gameState === 'ready') {
        gameState = 'result';

        // Play click sound
        playClickSound();

        // Calculate reaction time
        const endTime = Date.now();
        const reactionTime = endTime - startTime;

        // Display result
        reactionTimeDisplay.textContent = reactionTime + ' ms';
        gameMessage.textContent = 'Your reaction time:';

        // Increment attempt counter
        attemptCount++;
        attemptCountDisplay.textContent = 'Attempts: ' + attemptCount;

        // Calculate and display average
        totalReactionTime += reactionTime;
        const averageTime = Math.round(totalReactionTime / attemptCount);
        averageScoreDisplay.textContent = '📊 Average: ' + averageTime + ' ms';

        // Show feedback based on reaction time (F1 driver comparison)
        if (reactionTime < 150) {
            feedbackDisplay.textContent = '🏎️ F1 CHAMPION LEVEL!';
            feedbackDisplay.style.color = '#ffd700';
        } else if (reactionTime < 200) {
            feedbackDisplay.textContent = '🏎️ F1 Driver Level!';
            feedbackDisplay.style.color = '#00ff88';
        } else if (reactionTime < 250) {
            feedbackDisplay.textContent = '🏁 Professional Racer!';
            feedbackDisplay.style.color = '#00d4ff';
        } else if (reactionTime < 300) {
            feedbackDisplay.textContent = '🚗 Good Driver!';
            feedbackDisplay.style.color = '#88ccff';
        } else {
            feedbackDisplay.textContent = '🚶 Keep Practicing!';
            feedbackDisplay.style.color = '#ff6b6b';
        }

        // Add to history
        history.push(reactionTime);

        // Reset game area
        gameArea.classList.remove('ready');

        // Update best score
        if (!bestScore || reactionTime < bestScore) {
            bestScore = reactionTime;
            localStorage.setItem('bestReactionTime', bestScore);
            bestScoreDisplay.textContent = '🏆 NEW BEST: ' + bestScore + ' ms';
            bestScoreDisplay.style.color = '#ffd700';
            triggerConfetti(); // 🎉 Celebrate!
        } else {
            bestScoreDisplay.textContent = '🏆 Best: ' + bestScore + ' ms';
            bestScoreDisplay.style.color = '#888';
        }

        // Update leaderboard
        updateLeaderboard(reactionTime);

        // Show retry and share buttons
        retryBtn.style.display = 'inline-block';
        shareBtn.style.display = 'inline-block';

        // Show F1 Comparison
        comparisonContainer.style.display = 'block';
        // Calculate position (max 1000ms = 100%)
        let percentage = (reactionTime / 1000) * 100;
        if (percentage > 100) percentage = 100;
        userMarker.style.left = percentage + '%';
    }
    // Too early - clicked before green
    else if (gameState === 'waiting') {
        gameState = 'idle';

        gameMessage.textContent = '⚠️ Too early! Wait for green.';
        feedbackDisplay.textContent = '';
        reactionTimeDisplay.textContent = '';
        gameArea.classList.remove('waiting');

        // Show start button again
        startBtn.style.display = 'inline-block';
    }
});

// Retry Button Click Handler
retryBtn.addEventListener('click', function () {
    gameState = 'idle';

    // Hide retry and share buttons
    retryBtn.style.display = 'none';
    shareBtn.style.display = 'none';
    comparisonContainer.style.display = 'none';

    // Clear results
    reactionTimeDisplay.textContent = '';
    feedbackDisplay.textContent = '';
    gameMessage.textContent = 'Click "Start Game" to begin';

    // Show start button
    startBtn.style.display = 'inline-block';

    // Reset game area styles (for hard mode reset)
    gameArea.style.width = '100%';
    gameArea.style.height = '250px';
    gameArea.style.borderRadius = '20px';
    gameArea.classList.remove('ready');
    gameArea.classList.remove('waiting');
});

// Share Button Click Handler
shareBtn.addEventListener('click', function () {
    const avgTime = attemptCount > 0 ? Math.round(totalReactionTime / attemptCount) : 0;
    const shareText = `⚡ Reaction Speed Test Results:\n🏁 Last: ${reactionTimeDisplay.textContent}\n🏆 Best: ${bestScore} ms\n📊 Average: ${avgTime} ms\n🎯 Attempts: ${attemptCount}`;

    navigator.clipboard.writeText(shareText).then(function () {
        shareBtn.textContent = '✅ Copied!';
        setTimeout(function () {
            shareBtn.textContent = '📋 Share Score';
        }, 2000);
    });
});

// Spacebar Key Handler
document.addEventListener('keydown', function (event) {
    // Check if spacebar was pressed and not already pressing
    if ((event.code === 'Space' || event.key === ' ') && !keyPressed) {
        event.preventDefault(); // Prevent page scrolling
        keyPressed = true; // Mark as pressed

        // Handle based on game state
        if (gameState === 'idle') {
            startBtn.click();
        }
        else if (gameState === 'waiting' || gameState === 'ready') {
            gameArea.click();
        }
        else if (gameState === 'result') {
            retryBtn.click();
        }
    }
});

// Reset key on release
document.addEventListener('keyup', function (event) {
    if (event.code === 'Space' || event.key === ' ') {
        keyPressed = false;
    }
});

