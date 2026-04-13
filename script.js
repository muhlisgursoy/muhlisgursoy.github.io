/* Kelime Bilgisi — Word Guessing Game */

(function () {
    'use strict';

    /* ===== Turkish keyboard layout (Q) ===== */
    const KEYBOARD_ROWS = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Ğ', 'Ü'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ş', 'İ'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Ö', 'Ç']
    ];

    const VALID_LETTERS = new Set(KEYBOARD_ROWS.flat());

    /* ===== Level thresholds ===== */
    const LEVELS = [
        { min: 0, label: 'Çırak' },
        { min: 500, label: 'Kalfa' },
        { min: 1500, label: 'Usta' },
        { min: 3000, label: 'Üstat' },
        { min: 6000, label: 'Bilge' }
    ];

    /* ===== State ===== */
    let dictionary = [];
    let currentWord = '';
    let currentDefinition = '';
    let hintsRemaining = 3;
    let hintsUsed = 0;
    let wrongGuesses = 0;
    let score = 0;
    let streak = 0;
    let bestStreak = 0;
    let activeIndex = 0;
    let lockedIndices = new Set();
    let isProcessing = false;

    /* DOM refs */
    const $definitionText = document.getElementById('definition-text');
    const $wordGrid = document.getElementById('word-grid');
    const $keyboard = document.getElementById('keyboard');
    const $btnGuess = document.getElementById('btn-guess');
    const $btnHint = document.getElementById('btn-hint');
    const $hintCount = document.getElementById('hint-count');
    const $scoreText = document.getElementById('score-text');
    const $streakText = document.getElementById('streak-text');
    const $levelText = document.getElementById('level-text');
    const $bestStreakText = document.getElementById('best-streak-text');
    const $toast = document.getElementById('toast');

    /* ===== LocalStorage helpers ===== */
    function loadState() {
        try {
            score = parseInt(localStorage.getItem('kb_score'), 10) || 0;
            bestStreak = parseInt(localStorage.getItem('kb_bestStreak'), 10) || 0;
        } catch (_) { /* private mode fallback */ }
    }

    function saveState() {
        try {
            localStorage.setItem('kb_score', score);
            localStorage.setItem('kb_bestStreak', bestStreak);
        } catch (_) { /* ignore */ }
    }

    /* ===== Level helper ===== */
    function getLevel(pts) {
        let level = LEVELS[0].label;
        for (const l of LEVELS) {
            if (pts >= l.min) level = l.label;
        }
        return level;
    }

    /* ===== UI updates ===== */
    function updateUI() {
        $scoreText.textContent = score;
        $streakText.textContent = streak > 0 ? streak : '0';
        $levelText.textContent = getLevel(score);
        $bestStreakText.textContent = bestStreak;
        $hintCount.textContent = 'Kalan Hak: ' + hintsRemaining;
        $btnHint.disabled = hintsRemaining <= 0;
    }

    function showToast(message, duration) {
        duration = duration || 2000;
        $toast.textContent = message;
        $toast.classList.add('show');
        setTimeout(function () {
            $toast.classList.remove('show');
        }, duration);
    }

    /* ===== Confetti ===== */
    function createConfetti() {
        var colors = ['#38bdf8', '#22c55e', '#fb923c', '#f472b6', '#a78bfa', '#facc15'];
        var count = 60;
        for (var i = 0; i < count; i++) {
            var el = document.createElement('div');
            el.className = 'confetti';
            el.style.left = Math.random() * 100 + '%';
            el.style.top = '-12px';
            el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            el.style.width = (Math.random() * 8 + 6) + 'px';
            el.style.height = (Math.random() * 8 + 6) + 'px';
            document.body.appendChild(el);

            var anim = el.animate([
                { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
                { transform: 'translateY(' + (window.innerHeight + 30) + 'px) rotate(' + (Math.random() * 720) + 'deg)', opacity: 0 }
            ], {
                duration: Math.random() * 1500 + 2000,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });
            anim.onfinish = (function (element) {
                return function () { element.remove(); };
            })(el);
        }
    }

    /* ===== Word Grid ===== */
    function buildGrid() {
        $wordGrid.innerHTML = '';
        lockedIndices = new Set();
        activeIndex = 0;

        for (var i = 0; i < currentWord.length; i++) {
            var cell = document.createElement('input');
            cell.type = 'text';
            cell.className = 'letter-cell';
            cell.maxLength = 1;
            cell.setAttribute('data-index', i);
            cell.setAttribute('autocomplete', 'off');
            cell.setAttribute('autocapitalize', 'characters');
            cell.setAttribute('inputmode', 'none');
            cell.readOnly = true;
            $wordGrid.appendChild(cell);
        }

        focusCell(0);
    }

    function getCells() {
        return $wordGrid.querySelectorAll('.letter-cell');
    }

    function focusCell(index) {
        var cells = getCells();
        if (index < 0) index = 0;
        if (index >= cells.length) index = cells.length - 1;

        /* Skip locked cells going forward */
        while (index < cells.length && lockedIndices.has(index)) {
            index++;
        }
        if (index >= cells.length) {
            /* Try backward */
            index = cells.length - 1;
            while (index >= 0 && lockedIndices.has(index)) {
                index--;
            }
        }
        if (index >= 0 && index < cells.length) {
            activeIndex = index;
            cells[index].focus();
        }
    }

    /* ===== Keyboard ===== */
    function buildKeyboard() {
        $keyboard.innerHTML = '';
        KEYBOARD_ROWS.forEach(function (row, rowIndex) {
            var rowDiv = document.createElement('div');
            rowDiv.className = 'keyboard-row';

            if (rowIndex === 2) {
                var backKey = document.createElement('button');
                backKey.className = 'key wide';
                backKey.textContent = '⌫ SİL';
                backKey.setAttribute('data-action', 'backspace');
                backKey.type = 'button';
                rowDiv.appendChild(backKey);
            }

            row.forEach(function (letter) {
                var key = document.createElement('button');
                key.className = 'key';
                key.textContent = letter;
                key.setAttribute('data-letter', letter);
                key.type = 'button';
                rowDiv.appendChild(key);
            });

            if (rowIndex === 2) {
                var enterKey = document.createElement('button');
                enterKey.className = 'key wide';
                enterKey.textContent = 'ENTER';
                enterKey.setAttribute('data-action', 'enter');
                enterKey.type = 'button';
                rowDiv.appendChild(enterKey);
            }

            $keyboard.appendChild(rowDiv);
        });
    }

    /* ===== Input handling ===== */
    function handleLetter(letter) {
        if (isProcessing) return;
        letter = turkishUpper(letter);
        if (!VALID_LETTERS.has(letter)) return;

        var cells = getCells();
        if (activeIndex >= cells.length) return;
        if (lockedIndices.has(activeIndex)) return;

        cells[activeIndex].value = letter;
        cells[activeIndex].classList.remove('wrong');

        /* Move to next unlocked cell */
        var next = activeIndex + 1;
        while (next < cells.length && lockedIndices.has(next)) {
            next++;
        }
        if (next < cells.length) {
            activeIndex = next;
            cells[next].focus();
        }
    }

    function handleBackspace() {
        if (isProcessing) return;
        var cells = getCells();

        /* If current cell is empty, go back */
        if (cells[activeIndex] && cells[activeIndex].value === '' && !lockedIndices.has(activeIndex)) {
            var prev = activeIndex - 1;
            while (prev >= 0 && lockedIndices.has(prev)) {
                prev--;
            }
            if (prev >= 0) {
                activeIndex = prev;
                cells[prev].value = '';
                cells[prev].classList.remove('wrong');
                cells[prev].focus();
                return;
            }
        }

        /* Clear current cell */
        if (cells[activeIndex] && !lockedIndices.has(activeIndex)) {
            cells[activeIndex].value = '';
            cells[activeIndex].classList.remove('wrong');
            cells[activeIndex].focus();
        }
    }

    /* ===== Turkish uppercase helper ===== */
    function turkishUpper(str) {
        return str
            .replace(/i/g, 'İ')
            .replace(/ı/g, 'I')
            .toUpperCase();
    }

    /* ===== Guess ===== */
    function handleGuess() {
        if (isProcessing) return;
        var cells = getCells();
        var guess = '';

        for (var i = 0; i < cells.length; i++) {
            var val = turkishUpper(cells[i].value.trim());
            if (!val) {
                showToast('Lütfen tüm harfleri doldurun!');
                focusCell(i);
                return;
            }
            guess += val;
        }

        if (guess === currentWord) {
            handleCorrectGuess(cells);
        } else {
            handleWrongGuess(cells);
        }
    }

    function handleCorrectGuess(cells) {
        isProcessing = true;

        /* Mark all correct */
        for (var i = 0; i < cells.length; i++) {
            (function (idx) {
                setTimeout(function () {
                    cells[idx].classList.add('correct');
                }, idx * 80);
            })(i);
        }

        /* Scoring */
        var basePoints = currentWord.length * 100;
        var penalty = hintsUsed * 50;
        var earned = Math.max(basePoints - penalty, 0);
        score += earned;

        /* Streak */
        if (hintsUsed === 0 && wrongGuesses === 0) {
            streak++;
        } else {
            streak = 0;
        }
        if (streak > bestStreak) bestStreak = streak;

        saveState();

        /* Celebrate */
        setTimeout(function () {
            createConfetti();
            $scoreText.classList.add('score-pop');
            setTimeout(function () { $scoreText.classList.remove('score-pop'); }, 500);
            showToast('🎉 Doğru! +' + earned + ' puan', 2000);
            updateUI();
        }, cells.length * 80 + 200);

        /* Next word after delay */
        setTimeout(function () {
            startNewRound();
        }, 2500);
    }

    function handleWrongGuess(cells) {
        isProcessing = true;
        wrongGuesses++;

        /* Red shake */
        for (var i = 0; i < cells.length; i++) {
            if (!lockedIndices.has(i)) {
                cells[i].classList.add('wrong');
            }
        }

        showToast('❌ Yanlış tahmin! Tekrar deneyin.');

        setTimeout(function () {
            /* Clear non-locked cells */
            for (var i = 0; i < cells.length; i++) {
                if (!lockedIndices.has(i)) {
                    cells[i].value = '';
                    cells[i].classList.remove('wrong');
                }
            }
            focusCell(0);
            isProcessing = false;
        }, 800);
    }

    /* ===== Hint ===== */
    function handleHint() {
        if (isProcessing) return;
        if (hintsRemaining <= 0) return;

        var cells = getCells();
        var emptyIndices = [];

        for (var i = 0; i < cells.length; i++) {
            if (!lockedIndices.has(i) && cells[i].value.trim() === '') {
                emptyIndices.push(i);
            }
        }

        /* Also consider cells with wrong user input */
        if (emptyIndices.length === 0) {
            for (var j = 0; j < cells.length; j++) {
                if (!lockedIndices.has(j)) {
                    emptyIndices.push(j);
                }
            }
        }

        if (emptyIndices.length === 0) return;

        var randIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];

        cells[randIdx].value = currentWord[randIdx];
        cells[randIdx].classList.add('locked');
        cells[randIdx].classList.remove('wrong');
        lockedIndices.add(randIdx);

        hintsRemaining--;
        hintsUsed++;
        updateUI();

        /* Move focus to next empty cell */
        focusCell(activeIndex);
    }

    /* ===== Random word ===== */
    function pickRandomWord() {
        if (dictionary.length === 0) return;
        var entry = dictionary[Math.floor(Math.random() * dictionary.length)];
        currentWord = turkishUpper(entry.word);
        currentDefinition = entry.definition;
    }

    /* ===== New round ===== */
    function startNewRound() {
        pickRandomWord();
        hintsRemaining = 3;
        hintsUsed = 0;
        wrongGuesses = 0;
        isProcessing = false;

        $definitionText.textContent = currentDefinition;
        buildGrid();
        updateUI();
    }

    /* ===== Physical keyboard ===== */
    function onKeyDown(e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        var key = e.key;

        if (key === 'Enter') {
            e.preventDefault();
            handleGuess();
            return;
        }
        if (key === 'Backspace') {
            e.preventDefault();
            handleBackspace();
            return;
        }
        if (key.length === 1) {
            var upper = turkishUpper(key);
            if (VALID_LETTERS.has(upper)) {
                e.preventDefault();
                handleLetter(upper);

                /* Visual feedback on virtual keyboard */
                var vk = $keyboard.querySelector('[data-letter="' + upper + '"]');
                if (vk) {
                    vk.classList.add('pressed');
                    setTimeout(function () { vk.classList.remove('pressed'); }, 150);
                }
            }
        }
    }

    /* ===== Virtual keyboard click ===== */
    function onKeyboardClick(e) {
        var target = e.target;
        if (!target.classList.contains('key')) return;

        var letter = target.getAttribute('data-letter');
        var action = target.getAttribute('data-action');

        if (letter) {
            handleLetter(letter);
        } else if (action === 'backspace') {
            handleBackspace();
        } else if (action === 'enter') {
            handleGuess();
        }
    }

    /* ===== Word grid click ===== */
    function onGridClick(e) {
        var target = e.target;
        if (!target.classList.contains('letter-cell')) return;
        var idx = parseInt(target.getAttribute('data-index'), 10);
        if (!lockedIndices.has(idx)) {
            activeIndex = idx;
        }
    }

    /* ===== Init ===== */
    function init() {
        loadState();
        buildKeyboard();
        updateUI();

        /* Event listeners */
        document.addEventListener('keydown', onKeyDown);
        $keyboard.addEventListener('click', onKeyboardClick);
        $wordGrid.addEventListener('click', onGridClick);
        $btnGuess.addEventListener('click', handleGuess);
        $btnHint.addEventListener('click', handleHint);

        /* Load dictionary */
        fetch('sozluk.json')
            .then(function (res) {
                if (!res.ok) throw new Error('Sözlük yüklenemedi');
                return res.json();
            })
            .then(function (data) {
                dictionary = data;
                startNewRound();
            })
            .catch(function (err) {
                $definitionText.textContent = 'Sözlük yüklenirken hata oluştu. Lütfen sayfayı yenileyin.';
                console.error(err);
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
