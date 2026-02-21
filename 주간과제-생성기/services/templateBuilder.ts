
import { WeeklyConfig } from "../types";

export function buildWeeklyLearnerHTML(config: WeeklyConfig): string {
  const safeData = JSON.stringify(config).replace(/<\/script>/gi, '<\\/script>');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.packageName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&family=Noto+Serif+KR:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #f5f0e8;          /* 크림색 배경 */
      --paper: #fefcf7;       /* 카드 배경 */
      --ink: #1a1612;         /* 본문 텍스트 */
      --ink-light: #4a4540;   /* 보조 텍스트 */
      --rule: #c8bfaa;        /* 구분선 */
      --accent: #2c4a7c;      /* 포인트 네이비 */
      --accent-light: #d4e0f0;
      --correct: #2d6a4f;     /* 정답 초록 */
      --correct-bg: #d8f3dc;
      --wrong: #9b2335;       /* 오답 빨강 */
      --wrong-bg: #fde8ea;
      --selected: #1a3560;    /* 선택됨 파랑 */
      --selected-bg: #dce8f7;
    }

    body {
      margin: 0;
      padding: 0;
      background-color: var(--bg);
      color: var(--ink);
      font-family: 'Noto Serif KR', serif;
      word-break: keep-all;
      line-height: 1.6;
    }

    header, .question-card header, .choice-btn, .final-score, .bogi-box, .result-bar, .reset-btn, .passage-range {
      font-family: 'Noto Sans KR', sans-serif;
    }

    header {
      position: sticky;
      top: 0;
      background-color: var(--paper);
      border-bottom: 2px solid var(--rule);
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 1000;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    }

    .header-title {
      font-weight: 700;
      font-size: 1.1rem;
      color: var(--ink);
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .score-display {
      font-weight: bold;
      color: var(--accent);
      font-size: 1.1rem;
    }

    .reset-btn {
      background: var(--paper);
      border: 1px solid var(--rule);
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background 0.2s;
      color: var(--ink);
    }

    .reset-btn:hover {
      background: var(--bg);
    }

    .container {
      max-width: 900px;
      margin: 20px auto;
      padding: 0 15px;
    }

    .dashboard { display: block; }
    .passage-view { display: none; }

    .day-section { margin-bottom: 40px; }
    .day-title { 
      font-size: 1.5rem; 
      font-weight: 900; 
      color: var(--accent); 
      margin-bottom: 15px; 
      border-bottom: 2px solid var(--accent);
      display: inline-block;
      padding-right: 20px;
    }
    .set-card {
      background: var(--paper);
      border: 1px solid var(--rule);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .set-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .set-card h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 4px; }
    .set-card p { font-size: 0.85rem; color: var(--ink-light); }

    .passage-box {
      background: var(--paper);
      border-left: 4px solid var(--accent);
      padding: 25px;
      margin-bottom: 25px;
      border-radius: 0 8px 8px 0;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }

    .passage-range {
      font-weight: bold;
      color: var(--accent);
      margin-bottom: 15px;
      font-size: 0.95rem;
    }

    .passage-title {
      font-size: 1.2rem;
      font-weight: bold;
      margin-bottom: 15px;
      text-align: center;
    }

    .passage-content p {
      text-indent: 15px;
      margin-bottom: 10px;
      text-align: justify;
    }

    .footnote {
      font-size: 0.85rem;
      color: var(--ink-light);
      margin-top: 20px;
      border-top: 1px dashed var(--rule);
      padding-top: 10px;
    }

    .question-card {
      background: var(--paper);
      margin-bottom: 25px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }

    .question-card header {
      background: var(--accent);
      color: white;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .q-badge {
      background: white;
      color: var(--accent);
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .q-text {
      flex: 1;
      font-size: 1.05rem;
      line-height: 1.4;
    }

    .q-code {
      font-size: 0.8rem;
      opacity: 0.8;
      margin-left: auto;
    }

    .status-icon {
      font-weight: bold;
      font-size: 1.2rem;
      text-align: center;
      width: 20px;
    }

    .card-body {
      padding: 20px;
    }

    .bogi-box {
      border: 1px solid var(--ink);
      padding: 15px 20px;
      margin-bottom: 20px;
      background: white;
      line-height: 1.6;
    }

    .bogi-title {
      font-weight: bold;
      margin-bottom: 10px;
      text-align: center;
    }

    .choices {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .choice-btn {
      text-align: left;
      padding: 12px 15px;
      border: 1px solid var(--rule);
      background: white;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      font-size: 1rem;
      color: var(--ink);
    }

    .choice-num {
      margin-right: 10px;
      font-weight: bold;
    }

    .choice-btn:hover:not(:disabled) {
      background: var(--accent-light);
    }

    .choice-btn.selected {
      background: var(--selected-bg);
      border-color: var(--selected);
      color: var(--selected);
    }

    .choice-btn.correct {
      background: var(--correct-bg) !important;
      border-color: var(--correct) !important;
      color: var(--correct);
      animation: flash-correct 0.5s ease;
    }

    .choice-btn.wrong {
      background: var(--wrong-bg) !important;
      border-color: var(--wrong) !important;
      color: var(--wrong);
      animation: shake 0.4s ease;
    }

    .choice-btn:disabled {
      cursor: default;
    }

    .result-bar {
      margin-top: 15px;
      padding: 15px;
      border-radius: 6px;
      display: none;
      animation: fadeIn 0.3s ease;
    }

    .result-bar.show {
      display: block;
    }

    .result-bar.correct-result {
      background: var(--correct-bg);
      color: var(--correct);
      border: 1px solid var(--correct);
    }

    .result-bar.wrong-result {
      background: var(--wrong-bg);
      color: var(--wrong);
      border: 1px solid var(--wrong);
    }

    .final-score {
      display: none;
      background: var(--paper);
      padding: 30px;
      text-align: center;
      border-radius: 8px;
      margin: 30px 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border-top: 5px solid var(--accent);
      animation: fadeIn 0.5s ease;
    }

    .final-score h2 {
      color: var(--accent);
      margin-top: 0;
      font-size: 1.5rem;
    }

    .final-score .score-big {
      font-size: 3rem;
      font-weight: bold;
      color: var(--ink);
      margin: 15px 0;
    }

    .progress-container {
      width: 100%;
      height: 10px;
      background: var(--rule);
      border-radius: 5px;
      overflow: hidden;
      margin: 20px 0;
    }

    .progress-bar {
      height: 100%;
      background: var(--accent);
      width: 0%;
      transition: width 0.5s ease;
    }

    .bracket-a, .bracket {
      border: 1px solid var(--ink);
      padding: 0 4px;
      margin: 0 2px;
      display: inline-block;
      line-height: 1.2;
    }

    u, u.ul-mark {
      text-decoration-color: var(--accent);
      text-decoration-thickness: 2px;
      text-underline-offset: 4px;
    }

    i {
      font-style: italic;
      font-family: 'Times New Roman', Times, serif;
    }

    .figure-box {
      width: 100%;
      max-width: 400px;
      margin: 20px auto;
      border: 1px solid var(--rule);
      padding: 20px;
      text-align: center;
      background: white;
    }

    @keyframes flash-correct {
      0% { transform: scale(1); }
      40% { transform: scale(1.02); }
      100% { transform: scale(1); }
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-6px); }
      60% { transform: translateX(6px); }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: none; }
    }

    @media (max-width: 600px) {
      header { padding: 10px; }
      .passage-box { padding: 15px; }
      .question-card header { padding: 10px 15px; }
      .card-body { padding: 15px; }
    }
  </style>
</head>
<body>

<header>
  <div class="header-title" id="header-title">${config.packageName}</div>
  <div class="header-controls">
    <div class="score-display">점수: <span id="current-score">0</span> / <span id="total-score">0</span></div>
    <button class="reset-btn" onclick="resetAll()">↺ 초기화</button>
  </div>
</header>

<div class="container">
  
  <div id="dashboard" class="dashboard">
    <div id="dashboard-content"></div>
  </div>

  <div id="passage-view" class="passage-view">
    <button onclick="showDashboard()" style="margin-bottom: 20px; background: none; border: 1px solid var(--accent); color: var(--accent); padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 700; font-family: 'Noto Sans KR', sans-serif;">← 목록으로</button>
    <div id="passage-content"></div>
    <div id="questions-content" class="question-list"></div>
    <div class="final-score" id="final-panel">
      <h2>시험 완료!</h2>
      <div class="score-big"><span id="final-score-val">0</span> / <span id="final-total-val">0</span></div>
      <div class="progress-container">
        <div class="progress-bar" id="score-progress"></div>
      </div>
      <div id="final-msg"></div>
      <button onclick="showDashboard()" class="reset-btn" style="padding: 12px 30px; font-size: 1rem; margin-top: 15px; background: var(--accent); color: white; border: none;">다른 지문 학습하기</button>
    </div>
  </div>

</div>

<script>
  const CONFIG = ${safeData};
  let EXPLANATIONS = {};

  const state = {
    activeSetId: null,
    answers: {},
    score: 0,
    total: 0
  };

  function init() {
    renderDashboard();
  }

  function renderDashboard() {
    const content = document.getElementById('dashboard-content');
    content.innerHTML = '';
    
    for (let d = 1; d <= 5; d++) {
      const sets = CONFIG.sets.filter(s => s.dayNumber === d);
      if (sets.length === 0) continue;
      
      const section = document.createElement('div');
      section.className = 'day-section';
      section.innerHTML = \`<div class="day-title" style="font-family: 'Noto Sans KR', sans-serif;">DAY \${d}</div>\`;
      
      sets.forEach(set => {
        const card = document.createElement('div');
        card.className = 'set-card';
        card.innerHTML = \`
          <h3 style="font-family: 'Noto Sans KR', sans-serif;">\${set.title}</h3>
          <p style="font-family: 'Noto Sans KR', sans-serif;">\${set.questions.length}문항</p>
        \`;
        card.onclick = () => loadPassage(set.setId);
        section.appendChild(card);
      });
      content.appendChild(section);
    }
  }

  function loadPassage(setId) {
    const set = CONFIG.sets.find(s => s.setId === setId);
    if (!set) return;
    
    state.activeSetId = setId;
    state.answers = {};
    state.score = 0;
    state.total = set.questions.length;
    
    EXPLANATIONS = {};
    set.questions.forEach(q => {
      EXPLANATIONS[q.num] = {
        correct: q.explanation.correct,
        wrong: (chosen) => \`오답입니다. \${q.answer}번이 정답입니다. \${q.explanation.wrong}\`
      }
    });
    
    document.getElementById('header-title').textContent = set.title;
    updateScoreUI();
    
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('passage-view').style.display = 'block';
    document.getElementById('final-panel').style.display = 'none';
    
    // Render Passage
    const pContent = document.getElementById('passage-content');
    // Title regex check to extract title and passage range
    const rawLines = set.passage.split('\\n');
    let passageRange = "";
    let cleanPassageLines = [];
    
    // Simple heuristic to find passage range
    for (const line of rawLines) {
        if (line.match(/^\\[\\d+~\\d+\\]/)) {
            passageRange = line.trim();
        } else {
            cleanPassageLines.push(line);
        }
    }

    const passageHTML = cleanPassageLines.map(p => {
        const t = p.trim();
        if(!t) return '';
        if(t.startsWith('※')) return \`<div class="footnote">\${t}</div>\`;
        if(t.startsWith('[도식') || t.startsWith('[그림') || t.startsWith('[표')) return \`<div class="figure-box">\${t}</div>\`;
        return \`<p>\${t}</p>\`;
    }).join('');

    pContent.innerHTML = \`
      <div class="passage-box">
        \${passageRange !== "" ? \`<div class="passage-range">\${passageRange}</div>\` : ''}
        <div class="passage-content">
          \${passageHTML}
        </div>
      </div>
    \`;
    
    // Render Questions
    const qContent = document.getElementById('questions-content');
    qContent.innerHTML = '';
    
    set.questions.forEach(q => {
      const card = document.createElement('div');
      card.className = 'question-card';
      card.id = \`q\${q.num}\`;
      
      let html = \`
        <header>
          <div class="q-badge">\${q.num}</div>
          <div class="q-text">\${q.text}</div>
          \${q.code ? \`<div class="q-code">[\${q.code}]</div>\` : ''}
          <div class="status-icon" id="status-\${q.num}">○</div>
        </header>
        <div class="card-body">
      \`;
      
      if (q.bogi) {
        html += \`
          <div class="bogi-box">
            <div class="bogi-title">&lt;보 기&gt;</div>
            \${q.bogi.replace(/\\n/g, '<br>')}
          </div>
        \`;
      }
      
      html += \`<div class="choices">\`;
      q.options.forEach((opt, idx) => {
        const n = idx + 1;
        html += \`
          <button class="choice-btn" id="opt-\${q.num}-\${n}" data-val="\${n}" onclick="answer(\${q.num}, \${n}, \${q.answer})">
            <span class="choice-num">\${['①','②','③','④','⑤'][idx]}</span> 
            <span>\${opt}</span>
          </button>
        \`;
      });
      html += \`</div>\`;
      
      html += \`
        <div class="result-bar" id="res-\${q.num}"></div>
        </div>
      \`;
      
      card.innerHTML = html;
      qContent.appendChild(card);
    });
    
    window.scrollTo(0, 0);
  }

  function answer(qId, chosen, correct) {
    if (state.answers[qId] !== undefined) return; 
    
    state.answers[qId] = chosen;
    const isCorrect = chosen === correct;
    
    if (isCorrect) state.score++;
    
    const card = document.getElementById('q' + qId);
    const buttons = card.querySelectorAll('.choice-btn');
    const resultBar = card.querySelector('.result-bar');
    const statusIcon = card.querySelector('.status-icon');
    
    buttons.forEach(btn => {
      btn.disabled = true;
      const btnVal = parseInt(btn.dataset.val);
      
      if (btnVal === chosen) {
        if (isCorrect) btn.classList.add('correct');
        else btn.classList.add('wrong');
      }
      
      // 오답 시 정답 위치 표시
      if (!isCorrect && btnVal === correct) {
        btn.classList.add('correct'); 
      }
    });
    
    // 피드백 UI 업데이트
    if (isCorrect) {
      resultBar.className = 'result-bar correct-result show';
      resultBar.innerHTML = \`<strong>🎉 정답입니다!</strong><br>\${EXPLANATIONS[qId].correct}\`;
      statusIcon.textContent = '✓';
      statusIcon.style.color = '#fff';
    } else {
      resultBar.className = 'result-bar wrong-result show';
      resultBar.innerHTML = \`<strong>❌ 오답입니다.</strong><br>\${EXPLANATIONS[qId].wrong(chosen)}\`;
      statusIcon.textContent = '✗';
      statusIcon.style.color = '#ffccd5';
    }
    
    updateScoreUI();
    
    if (Object.keys(state.answers).length === state.total) {
      setTimeout(showFinal, 600);
    }
  }

  function updateScoreUI() {
    document.getElementById('current-score').textContent = state.score;
    document.getElementById('total-score').textContent = state.total;
  }

  function showFinal() {
    const finalScore = document.getElementById('final-panel');
    finalScore.style.display = 'block';
    
    document.getElementById('final-score-val').textContent = state.score;
    document.getElementById('final-total-val').textContent = state.total;
    
    const percent = (state.score / state.total) * 100;
    document.getElementById('score-progress').style.width = percent + '%';
    
    const msgEl = document.getElementById('final-msg');
    if (state.score === state.total) {
      msgEl.innerHTML = '<strong style="font-size: 1.1rem">완벽합니다! 💯</strong><br>모든 문제를 정확하게 이해하고 있습니다.';
    } else if (state.score > 0) {
      msgEl.innerHTML = '<strong style="font-size: 1.1rem">수고하셨습니다 👏</strong><br>틀린 문항의 해설을 다시 한 번 확인해 보세요.';
    } else {
      msgEl.innerHTML = '<strong style="font-size: 1.1rem">조금 더 분발해 볼까요? 💪</strong><br>지문을 다시 천천히 읽어보면 충분히 해결할 수 있습니다!';
    }
    
    finalScore.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function showDashboard() {
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('passage-view').style.display = 'none';
    document.getElementById('header-title').textContent = CONFIG.packageName;
    document.getElementById('current-score').textContent = '0';
    document.getElementById('total-score').textContent = '0';
  }

  function resetAll() {
    if(!state.activeSetId) return;

    if (confirm('현재 지문의 학습 기록을 초기화하시겠습니까?')) {
        loadPassage(state.activeSetId);
    }
  }

  init();
</script>

</body>
</html>`;
}
