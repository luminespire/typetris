document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const wordGrid = document.getElementById('word-grid');
    const playerInput = document.getElementById('player-input');
    const scoreEl = document.getElementById('score');
    const comboEl = document.getElementById('combo');
    const gridHeightEl = document.getElementById('grid-height');

    // --- GAME STATE ---
    const allPossibleWords = ["the", "be", "of", "and", "a", "to", "in", "he", "have", "it", "that", "for", "they", "with", "as", "not", "on", "she", "at", "by", "this", "we", "you", "do", "but", "from", "or", "which", "one", "would", "all", "will", "there", "say", "who", "make", "when", "can", "more", "if", "no", "man", "out", "other", "so", "what", "time", "up", "go", "about", "than", "into", "could", "state", "only", "new", "year", "some", "take", "come", "these", "know", "see", "use", "get", "like", "then", "first", "any", "work", "now", "may", "such", "give", "over", "think", "most", "even", "find", "day", "also", "after", "way", "many", "must", "look", "before", "great", "back", "through", "long", "where", "much", "should", "well", "people", "down", "own", "just", "because", "good", "each", "those", "feel", "seem", "how", "high", "too", "place", "little", "world", "very", "still", "nation", "hand", "old", "life", "tell", "write", "become", "here", "show", "house", "both", "between", "need", "mean", "call", "develop", "under", "last", "right", "move", "thing", "general", "school", "never", "same", "another", "begin", "while", "number", "part", "turn", "real", "leave", "might", "want", "point", "form", "off", "child", "few", "small", "since", "against", "ask", "late", "home", "interest", "large", "person", "end", "open", "public", "follow", "during", "present", "without", "again", "hold", "govern", "around", "possible", "head", "consider", "word", "program", "problem", "however", "lead", "system", "set", "order", "eye", "plan", "run", "keep", "face", "fact", "group", "play", "stand", "increase", "early", "course", "change", "help", "line"];
    let wordBank = [];
    let score = 0;
    let combo = 0;
    let correctPrefix = ""; // Keeps track of the correctly typed words string
    const GRID_COLS = 5;
    const MAX_ROWS = 8; // Game over when grid height exceeds this.

    // --- GAME LOGIC FUNCTIONS ---
    // Generates a new random word
    const getRandomWord = () => allPossibleWords[Math.floor(Math.random() * allPossibleWords.length)];

    // Renders the entire word grid based on the current wordBank
    const renderGrid = (currentTyped = '') => {
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

                if (globalIndex === 0) { // The target word (disappearing)
                    cell.classList.add('target-word');
                    const remainingText = word.substring(currentTyped.length);
                    cell.textContent = remainingText;
                } else if (globalIndex === (wordBank.length - 1)) { // The last word in the bank (appearing)
                    // This word appears as the target word is typed.
                    cell.textContent = word.substring(0, currentTyped.length);
                } else {
                    // A normal, static word
                    cell.textContent = word;
                }
                row.appendChild(cell);
            });
            wordGrid.appendChild(row);
        }

        // The status should reflect the "settled" grid height, not the render height
        updateStatus();
    };

    // Updates the score, combo, and grid height display
    const updateStatus = () => {
        scoreEl.textContent = score;
        comboEl.textContent = combo;
        gridHeightEl.textContent = Math.ceil(wordBank.length / GRID_COLS);
    };

    const handleSuccess = () => {
        // --- 1. IMMEDIATE LOGIC UPDATE ---
        score += wordBank[0].length;
        combo++;
        wordBank.shift(); // The completed word is removed
        wordBank.push(getRandomWord()); // A new word is added to the end to "appear"

        // --- 2. IMMEDIATE VISUAL UPDATE ---
        // A full re-render resets the grid to a clean state for the next word.
        // This results in an instant "jump" of the words, which feels very responsive.
        renderGrid();
    };

    const handleMistake = () => {
        combo = 0;
        score -= 5;
        for (let i = 0; i < GRID_COLS; i++) {
            wordBank.push(getRandomWord());
        }
        // On mistake, perform an immediate, hard reset of the visuals.
        renderGrid();
    };

    const endGame = () => {
        playerInput.disabled = true;
        correctPrefix = "";
        playerInput.value = "GAME OVER - CAPPED OUT!";
    };

    // --- EVENT LISTENERS ---
    playerInput.addEventListener('input', () => {
        const typedValue = playerInput.value;
        const targetWord = wordBank[0];
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
            handleSuccess();
            return;
        }

        // Mistake condition: the active part is not a prefix of the target word
        if (!targetWord.startsWith(activeTyping)) {
            handleMistake();
            // Reset the user's input to the last known good state
            playerInput.value = correctPrefix;
        } else {
            // Correct typing in progress: re-render the grid with char-by-char effects.
            // This provides the "letter by letter" feel on every keystroke.
            renderGrid(activeTyping);
        }
    });

    // --- INITIALIZE GAME ---
    const startGame = () => {
        wordBank = Array.from({ length: 4 * GRID_COLS }, getRandomWord); // Start with 4 rows
        score = 0;
        combo = 0;
        correctPrefix = "";
        playerInput.disabled = false;
        playerInput.value = '';
        renderGrid();
        playerInput.focus();
    };

    startGame();
});