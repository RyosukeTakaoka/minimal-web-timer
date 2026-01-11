const timeDisplay = document.getElementById('time-display');
const timeInput = document.getElementById('time-input');
const mainActionBtn = document.getElementById('main-action');
const cancelActionBtn = document.getElementById('cancel-action');
const phaseContainer = document.getElementById('cycle-phases');
const addPhaseBtn = document.getElementById('add-phase');
const cycleSummary = document.getElementById('cycle-summary');
const soundToggle = document.getElementById('sound-toggle');
const loopToggle = document.getElementById('loop-toggle');
const phaseIndicator = document.getElementById('phase-indicator');
const recentItemsList = document.getElementById('recent-items');
const progressCircle = document.querySelector('.progress-ring__circle');
const timerSettings = document.getElementById('timer-settings');
const cycleSettings = document.getElementById('cycle-settings');
const timerModeBtn = document.getElementById('mode-timer');
const cycleModeBtn = document.getElementById('mode-cycle');

// 状態管理
let activeMode = 'timer'; // timer, cycle
let timeLeft = 0;
let totalTime = 0;
let timerId = null;
let state = 'idle'; // idle, running, paused, finished
let timerMinutes = 25; // タイマーモード用の保持設定
let phases = JSON.parse(localStorage.getItem('timer_phases_v3') || '[{"name": "作業", "minutes": 25}, {"name": "休憩", "minutes": 5}]');
let currentPhaseIndex = 0;
let history = JSON.parse(localStorage.getItem('timer_history_v3') || '[]');
let isSoundOn = true;
let isLoopOn = true;

// SVG周長
const radius = 45;
const circumference = 2 * Math.PI * radius;

// オーディオコンテキスト
let audioCtx = null;

function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playChime() {
    if (!isSoundOn) return;
    initAudio();

    const playBeep = (time, freq) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.1, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(time);
        osc.stop(time + 0.25);
    };

    const now = audioCtx.currentTime;
    playBeep(now, 880);
    playBeep(now + 0.3, 880);
    playBeep(now + 0.6, 880);
}

// UI更新
function updateDisplay() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    const formatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    timeDisplay.textContent = formatted;
    if (document.activeElement !== timeInput) {
        timeInput.value = formatted;
    }

    const offset = circumference - (timeLeft / (totalTime || 1)) * circumference;
    progressCircle.style.strokeDashoffset = isNaN(offset) ? 0 : offset;

    if (state === 'running' || state === 'paused') {
        phaseIndicator.textContent = activeMode === 'cycle' ? phases[currentPhaseIndex].name : 'タイマー実行中';
    } else {
        phaseIndicator.textContent = '待機中';
    }
}

function setState(s) {
    state = s;
    document.body.className = state;
    cancelActionBtn.style.display = (state === 'paused') ? 'block' : 'none';

    switch (state) {
        case 'idle':
            mainActionBtn.textContent = '開始';
            break;
        case 'running':
            mainActionBtn.textContent = '一時停止';
            break;
        case 'paused':
            mainActionBtn.textContent = '再開';
            break;
        case 'finished':
            mainActionBtn.textContent = 'リセット';
            break;
    }
}

// タイマー操作
function startTimer() {
    initAudio();
    if (state === 'idle') saveSessionToHistory();

    setState('running');
    timerId = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            timeLeft = 0;
            updateDisplay();
            clearInterval(timerId);
            playChime();
            if (activeMode === 'cycle') nextPhase();
            else setState('finished');
        } else {
            updateDisplay();
        }
    }, 1000);
}

function nextPhase() {
    currentPhaseIndex++;
    if (currentPhaseIndex >= phases.length) {
        if (isLoopOn) {
            currentPhaseIndex = 0;
            // 短いディレイを入れて音とUIの切り替わりを確実に
            setTimeout(() => {
                loadPhase(currentPhaseIndex);
                startTimer();
            }, 100);
        } else {
            setState('finished');
        }
    } else {
        setTimeout(() => {
            loadPhase(currentPhaseIndex);
            startTimer();
        }, 100);
    }
}

function loadPhase(index) {
    const phase = phases[index];
    totalTime = phase.minutes * 60;
    timeLeft = totalTime;
    updateDisplay();
}

function switchMode(mode) {
    if (state === 'running') return; // 実行中以外は切替可能にする

    // 既存のタイマーや状態をクリア
    clearInterval(timerId);
    activeMode = mode;
    timerModeBtn.classList.toggle('active', mode === 'timer');
    cycleModeBtn.classList.toggle('active', mode === 'cycle');
    timerSettings.style.display = mode === 'timer' ? 'flex' : 'none';
    cycleSettings.style.display = mode === 'cycle' ? 'flex' : 'none';

    if (mode === 'timer') {
        totalTime = timerMinutes * 60;
        timeLeft = totalTime;
    } else {
        currentPhaseIndex = 0;
        loadPhase(0);
    }
    setState('idle');
    updateDisplay();
}

function cancelTimer() {
    clearInterval(timerId);
    if (activeMode === 'timer') {
        totalTime = timerMinutes * 60;
        timeLeft = totalTime;
    } else {
        currentPhaseIndex = 0;
        loadPhase(0);
    }
    setState('idle');
    updateDisplay();
}

function resetTimer() {
    cancelTimer();
}

// 設定管理
function renderPhases() {
    phaseContainer.innerHTML = '';
    phases.forEach((p, i) => {
        const row = document.createElement('div');
        row.className = 'phase-row';
        row.innerHTML = `
            <input type="text" class="phase-name-input" value="${p.name}" data-index="${i}">
            <input type="number" class="phase-time-input" value="${p.minutes}" data-index="${i}" min="1">
            <span>分</span>
            ${phases.length > 1 ? `<button class="btn-remove-phase" data-index="${i}">✕</button>` : ''}
        `;
        phaseContainer.appendChild(row);
    });
    updateSummary();
    localStorage.setItem('timer_phases_v3', JSON.stringify(phases));
}

function updateSummary() {
    const total = phases.reduce((sum, p) => sum + parseInt(p.minutes || 0), 0);
    cycleSummary.textContent = `合計: ${total}分 (${phases.length}フェーズ)`;
}

// 履歴
function saveSessionToHistory() {
    const item = {
        id: Date.now(),
        mode: activeMode,
        totalMinutes: activeMode === 'timer' ? timerMinutes : phases.reduce((sum, p) => sum + parseInt(p.minutes || 0), 0),
        label: activeMode === 'timer' ? '単一タイマー' : phases[0].name,
        config: activeMode === 'timer' ? timerMinutes : JSON.parse(JSON.stringify(phases))
    };

    history = history.filter(h => JSON.stringify(h.config) !== JSON.stringify(item.config));
    history.unshift(item);
    if (history.length > 5) history.pop();
    localStorage.setItem('timer_history_v3', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    recentItemsList.innerHTML = '';
    history.forEach((h, i) => {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `
            <div class="history-thumb"><div class="history-thumb-inner"></div></div>
            <div class="history-info">
                <div class="history-time">${h.totalMinutes}分</div>
                <div class="history-label">${h.label}</div>
            </div>
            <div class="history-controls">
                <button class="btn-card-action btn-play" data-index="${i}">▶</button>
                <button class="btn-card-action btn-card-del" data-index="${i}">✕</button>
            </div>
        `;
        recentItemsList.appendChild(card);
    });
}

// イベント
mainActionBtn.addEventListener('click', () => {
    if (state === 'idle' || state === 'paused') startTimer();
    else if (state === 'running') { clearInterval(timerId); setState('paused'); }
    else if (state === 'finished') resetTimer();
});

cancelActionBtn.addEventListener('click', cancelTimer);

timerModeBtn.addEventListener('click', () => switchMode('timer'));
cycleModeBtn.addEventListener('click', () => switchMode('cycle'));

document.querySelectorAll('.btn-preset').forEach(btn => {
    btn.addEventListener('click', () => {
        timerMinutes = parseInt(btn.dataset.minutes);
        totalTime = timerMinutes * 60;
        timeLeft = totalTime;
        document.querySelectorAll('.btn-preset').forEach(b => b.classList.toggle('active', b === btn));
        updateDisplay();
    });
});

addPhaseBtn.addEventListener('click', () => { phases.push({ name: "休憩", minutes: 5 }); renderPhases(); });

phaseContainer.addEventListener('input', (e) => {
    const i = e.target.dataset.index;
    if (e.target.classList.contains('phase-name-input')) phases[i].name = e.target.value;
    else if (e.target.classList.contains('phase-time-input')) phases[i].minutes = parseInt(e.target.value) || 1;
    updateSummary();
    localStorage.setItem('timer_phases_v3', JSON.stringify(phases));
    if (state === 'idle' && activeMode === 'cycle') loadPhase(0);
});

phaseContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-remove-phase')) {
        phases.splice(e.target.dataset.index, 1);
        renderPhases();
        if (state === 'idle' && activeMode === 'cycle') loadPhase(0);
    }
});

soundToggle.addEventListener('click', () => { isSoundOn = !isSoundOn; soundToggle.textContent = `音: ${isSoundOn ? 'ON' : 'OFF'}`; soundToggle.classList.toggle('active', isSoundOn); });
loopToggle.addEventListener('click', () => { isLoopOn = !isLoopOn; loopToggle.textContent = `ループ: ${isLoopOn ? 'ON' : 'OFF'}`; loopToggle.classList.toggle('active', isLoopOn); });

recentItemsList.addEventListener('click', (e) => {
    const i = e.target.dataset.index;
    if (e.target.classList.contains('btn-play')) {
        const h = history[i];
        if (h.mode === 'timer') {
            timerMinutes = h.config;
            switchMode('timer');
        } else {
            phases = JSON.parse(JSON.stringify(h.config));
            renderPhases();
            switchMode('cycle');
        }
        startTimer();
    } else if (e.target.classList.contains('btn-card-del')) {
        history.splice(i, 1);
        localStorage.setItem('timer_history_v3', JSON.stringify(history));
        renderHistory();
    }
});

timeInput.addEventListener('blur', () => {
    const parts = timeInput.value.split(':');
    let seconds = 0;
    if (parts.length === 2) seconds = (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
    else seconds = (parseInt(parts[0]) || 0) * 60;

    if (seconds > 0) {
        totalTime = seconds;
        timeLeft = totalTime;
        if (activeMode === 'timer') timerMinutes = Math.floor(seconds / 60);
    }
    updateDisplay();
});

timeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') timeInput.blur(); });

// キーボード
window.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'INPUT') return;
    if (e.code === 'Space') { e.preventDefault(); mainActionBtn.click(); }
    else if (e.key.toLowerCase() === 'r') resetTimer();
    else if (e.key >= '1' && e.key <= '5') {
        const i = parseInt(e.key) - 1;
        if (history[i]) {
            const h = history[i];
            if (h.mode === 'timer') { timerMinutes = h.config; switchMode('timer'); }
            else { phases = JSON.parse(JSON.stringify(h.config)); renderPhases(); switchMode('cycle'); }
            startTimer();
        }
    }
});

// 初期化
renderPhases();
renderHistory();
switchMode('timer');
progressCircle.style.strokeDasharray = circumference;
progressCircle.style.strokeDashoffset = 0;
