document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const wordGrid = document.getElementById('word-grid');
    const playerInput = document.getElementById('player-input');
    const scoreEl = document.getElementById('score');
    const comboEl = document.getElementById('combo');
    const gridHeightEl = document.getElementById('grid-height');
    const capOutLine = document.getElementById('cap-out-line');

    // --- GAME STATE ---
    const allPossibleWords = ["python", "multiplayer", "attack", "opponent", "scroll", "permanent", "keyboard", "mistake", "grid", "combo", "network", "type", "code", "replit", "terminal", "display", "speed", "accuracy", "challenge", "victory", "server", "client", "packet", "latency", "queue"];
    let wordBank = [];
    let score = 0;
    let combo = 0;

    // --- GAME LOGIC FUNCTIONS ---

    // Generates a new random word
    const getRandomWord = () => allPossibleWords[Math.floor(Math.random() * allPossibleWords.length)];

    // Renders the entire word grid based on the current wordBank
    const renderGrid = () => {
        wordGrid.innerHTML = ''; // Clear existing grid
        wordGrid.style.transform = 'translateX(0)'; // Reset scroll position
        wordGrid.classList.remove('scrolling');

        // Check for game over
        const numRows = Math.ceil(wordBank.length / 5);
        const gridTop = wordGrid.offsetTop;
        if (gridTop <= capOutLine.offsetTop + capOutLine.offsetHeight) {
            endGame();
            return;
        }

        const targetWord = wordBank[0];
        const typedValue = playerInput.value;

        wordBank.forEach((word, index) => {
            const cell = document.createElement('div');
            cell.classList.add('word-cell');

            if (index === 0) {
                cell.classList.add('target-word');
                // Dynamic highlighting of the part the user is typing
                if (targetWord && targetWord.startsWith(typedValue)) {
                    cell.innerHTML = `<span class="typed-prefix">${typedValue}</span>${targetWord.substring(typedValue.length)}`;
                } else {
                    cell.textContent = word;
                }
            } else {
                cell.textContent = word;
            }
            wordGrid.appendChild(cell);
        });

        updateStatus();
    };

    // Updates the score, combo, and grid height display
    const updateStatus = () => {
        scoreEl.textContent = score;
        comboEl.textContent = combo;
        gridHeightEl.textContent = Math.ceil(wordBank.length / 5);
    };

    const handleSuccess = () => {
        score += wordBank[0].length;
        combo++;

        // Add the scrolling class to trigger the CSS animation
        wordGrid.classList.add('scrolling');

        // After the animation finishes, update the grid's data and re-render
        setTimeout(() => {
            wordBank.shift(); // Remove word from the front
            wordBank.push(getRandomWord()); // Add a new word to the end
            renderGrid();
        }, 200); // This duration must match the CSS transition time
    };

    const handleMistake = () => {
        combo = 0;
        score -= 5;
        // Add 5 new penalty words to the end of the bank
        for (let i = 0; i < 5; i++) {
            wordBank.push(getRandomWord());
        }
        renderGrid(); // Re-render to show the new, taller grid
    };

    const endGame = () => {
        playerInput.disabled = true;
        playerInput.value = "GAME OVER - CAPPED OUT!";
    };

    // --- EVENT LISTENERS ---
    playerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.code === 'Space') {
            e.preventDefault(); // Prevent space from typing a space
            const typedWord = playerInput.value;
            const targetWord = wordBank[0];

            if (typedWord === targetWord) {
                handleSuccess();
            } else {
                handleMistake();
            }
            playerInput.value = ''; // Clear input field
        }
    });

    // Live-update the highlighting as the user types
    playerInput.addEventListener('input', () => {
        const targetCell = wordGrid.querySelector('.target-word');
        if (targetCell) {
            const targetWord = wordBank[0];
            const typedValue = playerInput.value;
            if (targetWord.startsWith(typedValue)) {
                 targetCell.innerHTML = `<span class="typed-prefix">${typedValue}</span>${targetWord.substring(typedValue.length)}`;
            } else {
                // You could add a visual indicator for a typo here if you want
            }
        }
    });

    // --- INITIALIZE GAME ---
    const startGame = () => {
        wordBank = Array.from({ length: 20 }, getRandomWord);
        score = 0;
        combo = 0;
        playerInput.disabled = false;
        playerInput.value = '';
        renderGrid();
        playerInput.focus();
    };

    startGame();
});