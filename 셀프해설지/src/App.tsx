import React, { useState } from 'react';
import { Circle, Triangle, X, Copy, ExternalLink, CheckCircle2, ChevronRight, ChevronLeft, BookOpen, PenTool, BrainCircuit, Plus, Trash2, Clock, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Passage = {
  name: string;
  from: number;
  to: number;
};

type ExamData = {
  examName: string;
  paperLink: string;
  answerLink: string;
  answers: string[];
  passages: Passage[];
};

type StudentAnswer = {
  qNum: number;
  myAnswer: string;
  time: string;
  reason: string;
  difficulty: 'O' | 'T' | 'X' | '';
};

type PassageNote = {
  time: string;
  notes: string;
};

export default function App() {
  const [examData, setExamData] = React.useState<ExamData | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get('d');
    if (dataParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(dataParam)));
        if (!decoded.passages) decoded.passages = [];
        setExamData(decoded);
      } catch (e) {
        console.error('Invalid data in URL');
      }
    }
  }, []);

  if (examData) return <StudentApp examData={examData} />;
  return <TeacherApp />;
}

// ─── Teacher App ─────────────────────────────────────────────────────────────

function TeacherApp() {
  const [examName, setExamName] = useState('');
  const [paperLink, setPaperLink] = useState('');
  const [answerLink, setAnswerLink] = useState('');
  const [correctAnswersStr, setCorrectAnswersStr] = useState('');
  const [passages, setPassages] = useState<Passage[]>([]);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const totalQ = correctAnswersStr.split(',').map(s => s.trim()).filter(s => s).length;

  const handleGenerate = () => {
    const answers = correctAnswersStr.split(',').map(s => s.trim()).filter(s => s);
    if (!examName || answers.length === 0) {
      alert('시험명과 정답은 필수입니다.');
      return;
    }
    const validPassages = passages.filter(p => p.name.trim());
    const data: ExamData = { examName, paperLink, answerLink, answers, passages: validPassages };
    const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
    const url = `${window.location.origin}${window.location.pathname}?d=${encoded}`;
    setGeneratedLink(url);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addPassage = () => {
    const lastTo = passages.length > 0 ? passages[passages.length - 1].to : 0;
    const newFrom = Math.min(lastTo + 1, totalQ || 34);
    setPassages([...passages, { name: '', from: newFrom, to: Math.min(newFrom + 2, totalQ || 34) }]);
  };

  const removePassage = (index: number) => setPassages(passages.filter((_, i) => i !== index));

  const updatePassage = (index: number, field: keyof Passage, value: string) => {
    const newPassages = [...passages];
    newPassages[index] = {
      ...newPassages[index],
      [field]: field === 'name' ? value : Number(value),
    };
    setPassages(newPassages);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">셀프해설지 생성기</h1>
          <p className="mt-2 text-slate-500 font-medium">학생들에게 공유할 모의고사 셀프해설지 링크를 만듭니다.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
          {/* 기본 정보 */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">시험명 *</label>
            <input
              type="text"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              placeholder="예: 2025년 3월 고3 국어 모의고사"
              value={examName}
              onChange={e => setExamName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">시험지 링크</label>
              <input
                type="text"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                placeholder="https://..."
                value={paperLink}
                onChange={e => setPaperLink(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">정답 및 해설 링크</label>
              <input
                type="text"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                placeholder="https://..."
                value={answerLink}
                onChange={e => setAnswerLink(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              정답 입력 (쉼표로 구분) *
            </label>
            <textarea
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none h-28 resize-none"
              placeholder="예: 4, 3, 1, 3, 5, 3, 5, 1, 5, 2, 3, 1, 3, 2, 2, 2, 3, 5, 2, 3, 1, 4, 5, 4, 4, 1, 5, 1, 2, 4, 5, 4, 2, 4"
              value={correctAnswersStr}
              onChange={e => setCorrectAnswersStr(e.target.value)}
            />
            {totalQ > 0 && (
              <p className="mt-1.5 text-xs text-indigo-600 font-bold">총 {totalQ}문항 입력됨</p>
            )}
          </div>

          {/* 지문 구성 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-slate-700">지문 구성 설정</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  지문별로 소요시간·전략·반성을 작성하게 합니다.
                </p>
              </div>
              <button
                onClick={addPassage}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold transition-colors"
              >
                <Plus size={15} />
                지문 추가
              </button>
            </div>

            {passages.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-400 text-sm">
                <FileText size={24} className="mx-auto mb-2 opacity-40" />
                <p className="font-medium">지문 추가 버튼으로 지문을 구성하세요</p>
                <p className="text-xs mt-0.5">(설정하지 않으면 문항별 입력만 제공됩니다)</p>
              </div>
            ) : (
              <div className="space-y-3">
                {passages.map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          placeholder="지문명 (예: 독서론, (가)(나) 사회, 기술 지문, 고전소설)"
                          className="w-full p-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                          value={p.name}
                          onChange={e => updatePassage(i, 'name', e.target.value)}
                        />
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-slate-500 font-medium whitespace-nowrap text-xs">문항 범위</span>
                          <input
                            type="number"
                            min="1"
                            className="w-16 p-2 text-center bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                            value={p.from}
                            onChange={e => updatePassage(i, 'from', e.target.value)}
                          />
                          <span className="text-slate-400">~</span>
                          <input
                            type="number"
                            min="1"
                            className="w-16 p-2 text-center bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                            value={p.to}
                            onChange={e => updatePassage(i, 'to', e.target.value)}
                          />
                          <span className="text-slate-400 text-xs">번</span>
                          {p.from <= p.to && (
                            <span className="text-xs text-indigo-500 font-medium ml-1">
                              ({p.to - p.from + 1}문항)
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removePassage(i)}
                        className="p-2 mt-0.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleGenerate}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm text-lg"
          >
            학생용 링크 생성하기
          </button>

          {generatedLink && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-indigo-50 border border-indigo-100 rounded-xl"
            >
              <p className="text-sm font-bold text-indigo-900 mb-2">생성된 링크:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="flex-1 p-3 bg-white border border-indigo-200 rounded-lg text-sm text-slate-600 outline-none font-mono"
                />
                <button
                  onClick={copyLink}
                  className={`px-5 py-3 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold whitespace-nowrap ${copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                >
                  <Copy size={18} />
                  {copied ? '복사됨!' : '복사'}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Student App ──────────────────────────────────────────────────────────────

function StudentApp({ examData }: { examData: ExamData }) {
  const [step, setStep] = useState(1);
  const [studentName, setStudentName] = useState('');
  const [academyName, setAcademyName] = useState('');
  const [preNotes, setPreNotes] = useState('');
  const [midNotes, setMidNotes] = useState('');
  const [postNotes, setPostNotes] = useState('');

  const [studentAnswers, setStudentAnswers] = useState<StudentAnswer[]>(
    examData.answers.map((_, i) => ({
      qNum: i + 1,
      myAnswer: '',
      time: '',
      reason: '',
      difficulty: '',
    }))
  );

  const [passageNotes, setPassageNotes] = useState<PassageNote[]>(
    (examData.passages || []).map(() => ({ time: '', notes: '' }))
  );

  const hasPassages = examData.passages && examData.passages.length > 0;

  const updateAnswer = (index: number, field: keyof StudentAnswer, value: string) => {
    const newAnswers = [...studentAnswers];
    newAnswers[index] = { ...newAnswers[index], [field]: value };
    setStudentAnswers(newAnswers);
  };

  const toggleDifficulty = (index: number, val: 'O' | 'T' | 'X') => {
    const current = studentAnswers[index].difficulty;
    updateAnswer(index, 'difficulty', current === val ? '' : val);
  };

  const updatePassageNote = (index: number, field: keyof PassageNote, value: string) => {
    const newNotes = [...passageNotes];
    newNotes[index] = { ...newNotes[index], [field]: value };
    setPassageNotes(newNotes);
  };

  // ── Score calculation ────────────────────────────────────────────────────
  const getResults = () => {
    let correctCount = 0;
    const results = studentAnswers.map((ans, i) => {
      const correctAns = examData.answers[i];
      const isCorrect = ans.myAnswer.toString().trim() === correctAns.toString().trim();
      if (isCorrect) correctCount++;
      return { ...ans, correctAns, isCorrect };
    });
    return { results, correctCount };
  };

  // ── Report text ──────────────────────────────────────────────────────────
  const generateReport = () => {
    const { results, correctCount } = getResults();
    const score = Math.round((correctCount / examData.answers.length) * 100);
    let r = `[셀프해설지 제출]\n시험명: ${examData.examName}\n이름: ${studentName}`;
    if (academyName) r += `\n학원명: ${academyName}`;
    r += `\n\n■ 시험 전 특이사항과 전략\n${preNotes || '없음'}`;
    if (midNotes) r += `\n\n■ 시험 진행 중 특이사항\n${midNotes}`;
    r += `\n\n■ 점수: ${score}점 (${correctCount}/${examData.answers.length})\n`;

    const diffStr = (d: string) =>
      d === 'O' ? '◯' : d === 'T' ? '△' : d === 'X' ? '✕' : '-';

    if (hasPassages) {
      r += `\n■ 지문별 분석\n`;
      const assignedNums = new Set(
        examData.passages.flatMap(p => Array.from({ length: p.to - p.from + 1 }, (_, k) => p.from + k))
      );

      examData.passages.forEach((p, pi) => {
        const pn = passageNotes[pi];
        r += `\n*[${p.name}] (${p.from}~${p.to}번)`;
        if (pn.time) r += ` — ${pn.time}`;
        r += '\n';
        if (pn.notes) r += `${pn.notes}\n`;
        results
          .filter(res => res.qNum >= p.from && res.qNum <= p.to)
          .forEach(res => {
            const ox = res.isCorrect ? 'O' : 'X';
            r += `  ${res.qNum}번 | ${ox} | 내답: ${res.myAnswer || '-'} / 정답: ${res.correctAns} | 난도: ${diffStr(res.difficulty)}`;
            if (res.reason) r += ` | ${res.reason}`;
            r += '\n';
          });
      });

      const unassigned = results.filter(res => !assignedNums.has(res.qNum));
      if (unassigned.length > 0) {
        r += `\n*[기타 문항]\n`;
        unassigned.forEach(res => {
          const ox = res.isCorrect ? 'O' : 'X';
          r += `  ${res.qNum}번 | ${ox} | 내답: ${res.myAnswer || '-'} / 정답: ${res.correctAns} | 난도: ${diffStr(res.difficulty)}`;
          if (res.reason) r += ` | ${res.reason}`;
          r += '\n';
        });
      }
    } else {
      r += `\n■ 문항별 분석\n`;
      results.forEach(res => {
        const ox = res.isCorrect ? 'O' : 'X';
        r += `${res.qNum}번 | ${ox} | 내답: ${res.myAnswer || '-'} / 정답: ${res.correctAns} | 난도: ${diffStr(res.difficulty)}`;
        if (res.time) r += ` | 시간: ${res.time}`;
        if (res.reason) r += ` | ${res.reason}`;
        r += '\n';
      });
    }

    if (postNotes) r += `\n■ 시험 후 반성 및 해결 방안\n${postNotes}`;
    return r;
  };

  const copyReport = () => {
    navigator.clipboard.writeText(generateReport());
    alert('카카오톡에 붙여넣기 할 수 있도록 복사되었습니다.');
  };

  // ── Difficulty button component ──────────────────────────────────────────
  const DiffButtons = ({ index, difficulty }: { index: number; difficulty: string }) => (
    <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
      <button
        onClick={() => toggleDifficulty(index, 'O')}
        className={`p-1.5 rounded-md transition-colors ${difficulty === 'O' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400 hover:bg-slate-100'}`}
        title="쉬움 (◯)"
      >
        <Circle size={15} strokeWidth={3} />
      </button>
      <button
        onClick={() => toggleDifficulty(index, 'T')}
        className={`p-1.5 rounded-md transition-colors ${difficulty === 'T' ? 'bg-amber-100 text-amber-600' : 'text-slate-400 hover:bg-slate-100'}`}
        title="애매함 (△)"
      >
        <Triangle size={15} strokeWidth={3} />
      </button>
      <button
        onClick={() => toggleDifficulty(index, 'X')}
        className={`p-1.5 rounded-md transition-colors ${difficulty === 'X' ? 'bg-rose-100 text-rose-600' : 'text-slate-400 hover:bg-slate-100'}`}
        title="모름/시간초과 (✕)"
      >
        <X size={15} strokeWidth={3} />
      </button>
    </div>
  );

  // ── Question card ────────────────────────────────────────────────────────
  const QuestionCard = ({ ans }: { ans: StudentAnswer }) => {
    const idx = ans.qNum - 1;
    return (
      <div className="flex flex-col gap-2.5 p-4 bg-slate-50 rounded-xl border border-slate-200/70">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="font-black text-slate-700 w-10 text-sm">{ans.qNum}번</span>
          <DiffButtons index={idx} difficulty={ans.difficulty} />
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs font-bold text-slate-500">내 답</span>
            <input
              type="text"
              className="w-14 p-2 text-center bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-black text-slate-700 text-base shadow-sm"
              value={ans.myAnswer}
              onChange={e => updateAnswer(idx, 'myAnswer', e.target.value)}
            />
          </div>
        </div>
        <input
          type="text"
          placeholder="선택 이유 / 틀린 이유 / 헷갈린 점"
          className="w-full p-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          value={ans.reason}
          onChange={e => updateAnswer(idx, 'reason', e.target.value)}
        />
      </div>
    );
  };

  // ── Step 1: 기본 정보 ──────────────────────────────────────────────────
  const renderStep1 = () => (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <BookOpen className="text-indigo-500" size={22} />
          기본 정보
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">이름 *</label>
            <input
              type="text"
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              placeholder="홍길동"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">학원명</label>
            <input
              type="text"
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={academyName}
              onChange={e => setAcademyName(e.target.value)}
              placeholder="에듀학원"
            />
          </div>
        </div>
        {examData.paperLink && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <a
              href={examData.paperLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold bg-indigo-50 px-4 py-2.5 rounded-lg transition-colors"
            >
              <ExternalLink size={16} />
              시험지 보기 (새 창)
            </a>
          </div>
        )}
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <BrainCircuit className="text-indigo-500" size={22} />
          시험 전 특이사항과 전략
        </h2>
        <p className="text-sm text-slate-500 mb-4 font-medium">
          컨디션, 풀이 순서, 시간 배분 계획, 다짐 등을 자유롭게 적어보세요.
        </p>
        <textarea
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-36 resize-none transition-all text-sm"
          value={preNotes}
          onChange={e => setPreNotes(e.target.value)}
          placeholder={`예) 컨디션: 보통\n풀이 순서: 비문학 → 문학 → 언매\n예상 시간: 독서(25분) 문학(20분) 언매(15분) 검토(20분)\n다짐: 헷갈리면 과감하게 넘어가자`}
        />
      </div>

      <button
        onClick={() => setStep(2)}
        disabled={!studentName}
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl transition-colors shadow-sm flex justify-center items-center gap-2 text-lg"
      >
        답안 입력하기
        <ChevronRight size={20} />
      </button>
    </motion.div>
  );

  // ── Step 2: 지문별 답안 입력 ───────────────────────────────────────────
  const renderStep2 = () => {
    const assignedNums = new Set(
      (examData.passages || []).flatMap(p =>
        Array.from({ length: p.to - p.from + 1 }, (_, k) => p.from + k)
      )
    );
    const unassigned = studentAnswers.filter(a => !assignedNums.has(a.qNum));

    return (
      <motion.div
        key="step2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-5"
      >
        {/* 시험 진행 중 특이사항 */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
            <PenTool className="text-indigo-500" size={18} />
            시험 진행 중 특이사항 <span className="text-xs font-normal text-slate-400">(선택)</span>
          </h2>
          <textarea
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none text-sm"
            value={midNotes}
            onChange={e => setMidNotes(e.target.value)}
            placeholder="예) 15번에서 시간을 너무 많이 썼다. 기술 지문에서 멘탈이 흔들렸다."
          />
        </div>

        {/* 지문별 섹션 */}
        {hasPassages ? (
          <>
            {examData.passages.map((passage, pi) => {
              const pAnswers = studentAnswers.filter(a => a.qNum >= passage.from && a.qNum <= passage.to);
              const pNote = passageNotes[pi];

              return (
                <motion.div
                  key={pi}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: pi * 0.04 }}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                >
                  {/* 지문 헤더 */}
                  <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-black text-lg leading-tight">{passage.name}</h3>
                      <p className="text-indigo-200 text-xs font-medium mt-0.5">
                        {passage.from}번 ~ {passage.to}번 · {passage.to - passage.from + 1}문항
                      </p>
                    </div>
                    <FileText className="text-indigo-300" size={22} />
                  </div>

                  <div className="p-5 space-y-4">
                    {/* 지문 반성 */}
                    <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                      <h4 className="text-sm font-bold text-indigo-800 mb-3 flex items-center gap-1.5">
                        <Clock size={14} />
                        지문 풀이 기록
                      </h4>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="sm:w-36 shrink-0">
                          <label className="block text-xs font-bold text-indigo-700 mb-1.5">소요 시간</label>
                          <input
                            type="text"
                            placeholder="예: 7분 30초"
                            className="w-full p-2.5 text-sm bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={pNote.time}
                            onChange={e => updatePassageNote(pi, 'time', e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-indigo-700 mb-1.5">
                            풀이 전략 / 특이사항 / 반성
                          </label>
                          <textarea
                            placeholder={`예) 전형적인 통독 지문. 큰 무리 없이 풀었음.\n7번에서 ③④ 사이에서 10초 고민 후 넘어감 → 결국 정답.`}
                            className="w-full p-2.5 text-sm bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-20"
                            value={pNote.notes}
                            onChange={e => updatePassageNote(pi, 'notes', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 문항별 답안 */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5">
                        문항별 답안
                      </h4>
                      <div className="space-y-2.5">
                        {pAnswers.map(ans => (
                          <QuestionCard key={ans.qNum} ans={ans} />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* 지문 미배정 문항 */}
            {unassigned.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-500 px-6 py-4">
                  <h3 className="text-white font-black">기타 문항</h3>
                </div>
                <div className="p-5 space-y-2.5">
                  {unassigned.map(ans => (
                    <QuestionCard key={ans.qNum} ans={ans} />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* 지문 미설정 - 기존 방식 */
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-5">문항별 답안 및 분석</h2>
            <div className="space-y-3">
              {studentAnswers.map(ans => (
                <div key={ans.qNum} className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-black text-slate-700 w-12 text-lg">{ans.qNum}번</span>
                    <DiffButtons index={ans.qNum - 1} difficulty={ans.difficulty} />
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <span className="text-sm font-bold text-slate-500">내 답</span>
                      <input
                        type="text"
                        className="w-16 p-2.5 text-center bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-black text-slate-700 text-lg shadow-sm"
                        value={ans.myAnswer}
                        onChange={e => updateAnswer(ans.qNum - 1, 'myAnswer', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="소요 시간 (예: 2분)"
                      className="w-full sm:w-1/3 p-3 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={ans.time}
                      onChange={e => updateAnswer(ans.qNum - 1, 'time', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="선택 이유를 적어주세요"
                      className="w-full sm:w-2/3 p-3 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={ans.reason}
                      onChange={e => updateAnswer(ans.qNum - 1, 'reason', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => setStep(1)}
            className="px-6 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors shadow-sm flex items-center"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => {
              if (window.confirm('결과를 확인하면 답안을 수정할 수 없습니다. 계속하시겠습니까?')) {
                setStep(3);
              }
            }}
            className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm flex justify-center items-center gap-2 text-lg"
          >
            채점 및 결과 보기
            <ChevronRight size={20} />
          </button>
        </div>
      </motion.div>
    );
  };

  // ── Step 3: 결과 & 반성 ───────────────────────────────────────────────
  const renderStep3 = () => {
    const { results, correctCount } = getResults();
    const score = Math.round((correctCount / examData.answers.length) * 100);

    const DiffIcon = ({ d }: { d: string }) =>
      d === 'O' ? (
        <Circle size={15} strokeWidth={3} className="text-emerald-500 mx-auto" />
      ) : d === 'T' ? (
        <Triangle size={15} strokeWidth={3} className="text-amber-500 mx-auto" />
      ) : d === 'X' ? (
        <X size={15} strokeWidth={3} className="text-rose-500 mx-auto" />
      ) : (
        <span className="text-slate-400">-</span>
      );

    const ResultTable = ({ rows }: { rows: typeof results }) => (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-3 py-3 font-bold">번호</th>
              <th className="px-3 py-3 text-center font-bold">결과</th>
              <th className="px-3 py-3 text-center font-bold">내 답</th>
              <th className="px-3 py-3 text-center font-bold">정답</th>
              <th className="px-3 py-3 text-center font-bold">난도</th>
              <th className="px-3 py-3 font-bold">메모</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                <td className="px-3 py-3 font-black text-slate-700">{r.qNum}</td>
                <td className="px-3 py-3 text-center">
                  {r.isCorrect ? (
                    <span className="text-emerald-500 font-black">O</span>
                  ) : (
                    <span className="text-rose-500 font-black">X</span>
                  )}
                </td>
                <td className={`px-3 py-3 text-center font-bold ${r.isCorrect ? 'text-slate-700' : 'text-rose-600'}`}>
                  {r.myAnswer || '-'}
                </td>
                <td className="px-3 py-3 text-center font-black text-indigo-600">{r.correctAns}</td>
                <td className="px-3 py-3 text-center">
                  <DiffIcon d={r.difficulty} />
                </td>
                <td className="px-3 py-3 text-slate-500 text-xs max-w-[180px]">{r.reason || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    const assignedNums = new Set(
      (examData.passages || []).flatMap(p =>
        Array.from({ length: p.to - p.from + 1 }, (_, k) => p.from + k)
      )
    );

    return (
      <motion.div
        key="step3"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-5"
      >
        {/* 점수 */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
          <p className="text-sm font-bold text-slate-500 mb-2">나의 점수</p>
          <div className="text-6xl font-black text-indigo-600 mb-2">
            {score}
            <span className="text-3xl text-slate-400 font-bold"> / 100</span>
          </div>
          <p className="text-slate-500 font-bold text-sm">
            {examData.answers.length}문제 중 {correctCount}문제 정답
          </p>
          {examData.answerLink && (
            <div className="mt-6 pt-5 border-t border-slate-100 flex justify-center">
              <a
                href={examData.answerLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors text-sm"
              >
                <ExternalLink size={16} />
                정답 및 해설 보기 (새 창)
              </a>
            </div>
          )}
        </div>

        {/* 지문별 결과 */}
        {hasPassages ? (
          <>
            {examData.passages.map((passage, pi) => {
              const passageResults = results.filter(r => r.qNum >= passage.from && r.qNum <= passage.to);
              const pCorrect = passageResults.filter(r => r.isCorrect).length;
              const pNote = passageNotes[pi];
              return (
                <div key={pi} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-indigo-600 px-5 py-3 flex items-center justify-between">
                    <div>
                      <span className="text-white font-black">{passage.name}</span>
                      {pNote.time && (
                        <span className="text-indigo-200 text-xs ml-2">· {pNote.time}</span>
                      )}
                    </div>
                    <span className="text-indigo-200 text-sm font-bold">
                      {pCorrect}/{passageResults.length} 정답
                    </span>
                  </div>
                  {pNote.notes && (
                    <div className="px-5 py-3 bg-indigo-50 border-b border-indigo-100 text-sm text-indigo-800 whitespace-pre-wrap">
                      {pNote.notes}
                    </div>
                  )}
                  <div className="p-4">
                    <ResultTable rows={passageResults} />
                  </div>
                </div>
              );
            })}

            {/* 기타 */}
            {results.filter(r => !assignedNums.has(r.qNum)).length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-500 px-5 py-3">
                  <span className="text-white font-black">기타 문항</span>
                </div>
                <div className="p-4">
                  <ResultTable rows={results.filter(r => !assignedNums.has(r.qNum))} />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-5">채점 결과</h2>
            <ResultTable rows={results} />
          </div>
        )}

        {/* 시험 후 반성 */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
            <CheckCircle2 className="text-indigo-500" size={22} />
            시험 후 반성 및 해결 방안
          </h2>
          <p className="text-sm text-slate-500 mb-4 font-medium">
            전반적인 반성, 개선해야 할 점, 앞으로의 학습 계획을 적어보세요.
          </p>
          <textarea
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-40 resize-none transition-all text-sm"
            value={postNotes}
            onChange={e => setPostNotes(e.target.value)}
            placeholder={`예) *개선해야할 점\n- 헷갈리는 문제에 집착하지 말고 과감하게 넘어가기\n- 기술 지문은 선지를 먼저 보고 지문을 읽는 전략 시도해볼 것\n\n*앞으로의 계획\n- 매일 비문학 2지문씩 시간 재고 풀기`}
          />
        </div>

        <button
          onClick={() => setStep(4)}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm flex justify-center items-center gap-2 text-lg"
        >
          최종 완료 및 제출
          <ChevronRight size={20} />
        </button>
      </motion.div>
    );
  };

  // ── Step 4: 제출 ──────────────────────────────────────────────────────
  const renderStep4 = () => (
    <motion.div
      key="step4"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-200 text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} strokeWidth={2.5} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-3">셀프해설지 작성 완료!</h2>
        <p className="text-slate-500 mb-8 font-medium">
          아래 텍스트를 복사하여 선생님께 카카오톡으로 제출해주세요.
        </p>

        <div className="text-left bg-slate-50 p-5 rounded-xl border border-slate-200 h-72 overflow-y-auto mb-8 text-sm text-slate-700 whitespace-pre-wrap font-mono shadow-inner">
          {generateReport()}
        </div>

        <button
          onClick={copyReport}
          className="w-full py-4 bg-[#FEE500] hover:bg-[#FDD800] text-[#000000] font-black rounded-xl transition-colors shadow-sm flex justify-center items-center gap-2 text-lg"
        >
          <Copy size={22} />
          카카오톡 제출용 복사하기
        </button>
      </div>
    </motion.div>
  );

  // ── Layout ────────────────────────────────────────────────────────────
  const stepLabels = ['기본 정보', hasPassages ? '지문별 답안' : '답안 입력', '결과 및 반성', '제출'];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">셀프해설지</h1>
          <p className="text-slate-500 mt-1.5 font-bold">{examData.examName}</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-xs font-bold text-slate-400 mb-2.5 px-1">
            {stepLabels.map((label, i) => (
              <span key={i} className={step >= i + 1 ? 'text-indigo-600' : ''}>
                {label}
              </span>
            ))}
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-600"
              initial={{ width: '25%' }}
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </AnimatePresence>
      </div>
    </div>
  );
}
