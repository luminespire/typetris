document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const wordGrid = document.getElementById('word-grid');
    const playerInput = document.getElementById('player-input');
    const caret = document.getElementById('caret');
    const scoreEl = document.getElementById('score');
    const comboEl = document.getElementById('combo');
    const gridHeightEl = document.getElementById('grid-height');

    // --- GAME STATE ---
    const allPossibleWords = ["the", "be", "of", "and", "a", "to", "in", "he", "have", "it", "that", "for", "they", "with", "as", "not", "on", "she", "at", "by", "this", "we", "you", "do", "but", "from", "or", "which", "one", "would", "all", "will", "there", "say", "who", "make", "when", "can", "more", "if", "no", "man", "out", "other", "so", "what", "time", "up", "go", "about", "than", "into", "could", "state", "only", "new", "year", "some", "take", "come", "these", "know", "see", "use", "get", "like", "then", "first", "any", "work", "now", "may", "such", "give", "over", "think", "most", "even", "find", "day", "also", "after", "way", "many", "must", "look", "before", "great", "back", "through", "long", "where", "much", "should", "well", "people", "down", "own", "just", "because", "good", "each", "those", "feel", "seem", "how", "high", "too", "place", "little", "world", "very", "still", "nation", "hand", "old", "life", "tell", "write", "become", "here", "show", "house", "both", "between", "need", "mean", "call", "develop", "under", "last", "right", "move", "thing", "general", "school", "never", "same", "another", "begin", "while", "number", "part", "turn", "real", "leave", "might", "want", "point", "form", "off", "child", "few", "small", "since", "against", "ask", "late", "home", "interest", "large", "person", "end", "open", "public", "follow", "during", "present", "without", "again", "hold", "govern", "around", "possible", "head", "consider", "word", "program", "problem", "however", "lead", "system", "set", "order", "eye", "plan", "run", "keep", "face", "fact", "group", "play", "stand", "increase", "early", "course", "change", "help", "line"];
    let wordBank = [];
    let score = 0;
    let combo = 0;
    let correctPrefix = ""; // Keeps track of the correctly typed words string
    let currentRowWordIndex = 0; // Tracks the index of the current word in the top row (0-4).
    let typingTimeout; // To manage caret blinking
    const GRID_COLS = 5;
    const MAX_ROWS = 8; // Game over when grid height exceeds this.

    // --- GAME LOGIC FUNCTIONS ---
    // Generates a new random word
    const getRandomWord = () => allPossibleWords[Math.floor(Math.random() * allPossibleWords.length)];

    // Renders the entire word grid based on the current wordBank
    const renderGrid = () => {
        wordGrid.innerHTML = ''; // Clear existing grid
        
        // The wordBank is the single source of truth for the grid's structure.
        const numTotalRows = Math.ceil(wordBank.length / GRID_COLS);

        // Check for game over (based on the settled wordBank height) before rendering
        if (numTotalRows > MAX_ROWS) {
            endGame();
            return;
        }

        for (let i = 0; i < numTotalRows; i++) {
            const row = document.createElement('div');
            row.classList.add('word-row');

            const rowWords = wordBank.slice(i * GRID_COLS, (i + 1) * GRID_COLS);

            rowWords.forEach((word, wordIndex) => {
                const cell = document.createElement('span'); // Use spans for more natural text flow
                cell.classList.add('word-cell');
                const globalIndex = i * GRID_COLS + wordIndex;
                
                // The target word is always on the first row.
                if (i === 0 && wordIndex === currentRowWordIndex) {
                    cell.classList.add('target-word');
                }
                // The input handler will now manage the inner content for highlighting.
                cell.textContent = word;
                row.appendChild(cell);
            });
            wordGrid.appendChild(row);
        }

        // The status should reflect the "settled" grid height, not the render height
        updateStatus();
    };

    const updateCaretPosition = () => {
        const targetCell = wordGrid.querySelector('.target-word');
        if (!targetCell) {
            caret.style.display = 'none';
            return;
        }
        caret.style.display = 'block';

        // The input handler creates a span for the typed part. We just measure it.
        const typedSpan = targetCell.querySelector('.typed-chars');
        const cellRect = targetCell.getBoundingClientRect();
        const containerRect = document.getElementById('game-container').getBoundingClientRect();

        const cellStyle = window.getComputedStyle(targetCell);
        const paddingLeft = parseFloat(cellStyle.paddingLeft);

        const leftOffset = cellRect.left - containerRect.left + paddingLeft + (typedSpan ? typedSpan.offsetWidth : 0) - 1;
        const topOffset = cellRect.top - containerRect.top + parseFloat(cellStyle.paddingTop);

        caret.style.left = `${leftOffset}px`;
        caret.style.top = `${topOffset}px`;
        caret.style.height = `${parseFloat(cellStyle.fontSize)}px`;
    };

    // Updates the score, combo, and grid height display
    const updateStatus = () => {
        scoreEl.textContent = score;
        comboEl.textContent = combo;
        gridHeightEl.textContent = Math.ceil(wordBank.length / GRID_COLS);
    };

    const handleRowCompletion = () => {
        // --- NON-BLOCKING ANIMATION (FLIP) ---
        // 1. FIRST: Get the starting positions of all rows and clone the first row.
        const startingPositions = new Map();
        const oldRows = Array.from(wordGrid.children);
        oldRows.forEach((row, index) => {
            startingPositions.set(index, row.getBoundingClientRect());
        });
        const firstRowClone = oldRows[0] ? oldRows[0].cloneNode(true) : null;

        // 2. LAST: Update game logic and render the final state INSTANTLY.
        // This is the non-blocking part. The user can start typing immediately.
        wordBank.splice(0, GRID_COLS); // Remove the first row of words
        for (let i = 0; i < GRID_COLS; i++) {
            wordBank.push(getRandomWord()); // Add a new row of words to the end
        }
        currentRowWordIndex = 0;
        correctPrefix = "";
        playerInput.value = "";
        renderGrid();
        updateCaretPosition();
        playerInput.focus();

        // 3. INVERT & PLAY: Animate the transition in the background.
        // Animate the cloned first row disappearing.
        if (firstRowClone) {
            const firstRowStartPos = startingPositions.get(0);
            const containerRect = document.getElementById('game-container').getBoundingClientRect();
            Object.assign(firstRowClone.style, {
                position: 'absolute',
                left: `${firstRowStartPos.left - containerRect.left}px`,
                top: `${firstRowStartPos.top - containerRect.top}px`,
                width: `${firstRowStartPos.width}px`,
                margin: '0',
                opacity: '1',
                transition: 'transform 0.3s ease-out, opacity 0.3s ease-out'
            });
            wordGrid.parentNode.insertBefore(firstRowClone, wordGrid);
            // Animate it out in the next frame
            requestAnimationFrame(() => {
                firstRowClone.style.transform = 'translateY(-100%)';
                firstRowClone.style.opacity = '0';
            });
            // Clean it up after the animation
            setTimeout(() => firstRowClone.remove(), 300);
        }

        // Animate the remaining rows moving up.
        const newRows = Array.from(wordGrid.children);
        newRows.forEach((row, index) => {
            const startPos = startingPositions.get(index + 1); // New row `i` corresponds to old row `i+1`
            if (!startPos) return; // This is a new row at the bottom, no animation needed.
            const newPos = row.getBoundingClientRect();
            const deltaY = startPos.top - newPos.top;

            if (Math.abs(deltaY) < 1) return; // Don't animate if it didn't move.

            // INVERT: Move the element to its old position instantly.
            row.style.transition = 'transform 0s';
            row.style.transform = `translateY(${deltaY}px)`;

            // PLAY: In the next frame, add the transition and animate to the new position.
            requestAnimationFrame(() => {
                row.style.transition = 'transform 0.3s ease-out';
                row.style.transform = ''; // Animate to default (new) position.
            });

            // Clean up styles after the animation.
            row.addEventListener('transitionend', () => {
                row.style.transition = '';
            }, { once: true });
        });
    };

    const handleMistake = () => {
        combo = 0;
        score -= 5;
        for (let i = 0; i < GRID_COLS; i++) {
            wordBank.push(getRandomWord());
        }
        // On mistake, perform an immediate, hard reset of the visuals.
        currentRowWordIndex = 0;
        correctPrefix = "";
        playerInput.value = "";
        renderGrid();
        updateCaretPosition();
    };

    const endGame = () => {
        playerInput.disabled = true;
        correctPrefix = "";
        playerInput.value = "GAME OVER - CAPPED OUT!";
        currentRowWordIndex = 0;
        caret.style.display = 'none';
    };

    // --- EVENT LISTENERS ---
    playerInput.addEventListener('input', () => {
        // Make the caret solid while typing, and resume blinking on pause.
        clearTimeout(typingTimeout);
        caret.classList.add('typing');
        typingTimeout = setTimeout(() => {
            caret.classList.remove('typing');
        }, 500); // 500ms delay before resuming blink

        const typedValue = playerInput.value;
        const targetWord = wordBank[currentRowWordIndex];
        if (!targetWord) return; // Game is over or not ready

        // Handle backspace into the already-correct part of the input
        if (!typedValue.startsWith(correctPrefix)) {
            handleMistake();
            playerInput.value = ""; // Hard reset on this kind of error
            correctPrefix = "";
            return;
        }

        // The part of the input the user is currently typing for the current word.
        const activeTyping = typedValue.substring(correctPrefix.length);

        // Success condition: the active part matches the target word plus a space
        if (activeTyping === targetWord + ' ') {
            correctPrefix = typedValue; // Lock in the new correct prefix
            score += targetWord.length;
            combo++;
            updateStatus();

            const allCells = wordGrid.querySelectorAll('.word-cell');
            const oldTargetCell = allCells[currentRowWordIndex];
            if (oldTargetCell) {
                oldTargetCell.classList.remove('target-word');
                // Visually "lock in" the completed word
                oldTargetCell.innerHTML = `<span class="typed-chars">${targetWord}</span>`;
            }

            currentRowWordIndex++;

            if (currentRowWordIndex >= GRID_COLS) {
                handleRowCompletion();
            } else {
                // Move to the next word in the same row
                const nextTargetCell = allCells[currentRowWordIndex];
                if (nextTargetCell) {
                    nextTargetCell.classList.add('target-word');
                }
                updateCaretPosition();
            }
            return;
        }

        // Mistake condition: the active part is not a prefix of the target word
        if (!targetWord.startsWith(activeTyping)) {
            handleMistake();
            // Reset the user's input to the last known good state
            playerInput.value = correctPrefix;
        } else {
            // Correct typing in progress.
            // NO re-render. Just update the target cell's HTML and move the caret.
            // This is much more performant.
            const targetCell = wordGrid.querySelector('.target-word');
            if (targetCell) {
                targetCell.innerHTML = `<span class="typed-chars">${activeTyping}</span>${targetWord.substring(activeTyping.length)}`;
            }
            updateCaretPosition();
        }
    });

    // --- INITIALIZE GAME ---
    const startGame = () => {
        wordBank = Array.from({ length: 4 * GRID_COLS }, getRandomWord); // Start with 4 rows
        score = 0;
        currentRowWordIndex = 0;
        combo = 0;
        correctPrefix = "";
        playerInput.disabled = false;
        playerInput.value = '';
        renderGrid();
        updateCaretPosition();
        playerInput.focus();
    };

    startGame();
});