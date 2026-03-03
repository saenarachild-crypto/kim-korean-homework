import React, { useState, useEffect, useRef } from 'react';
import {
  MoreHorizontal,
  Calendar,
  Clock,
  Zap,
  PlusCircle,
  Circle,
  Triangle,
  X,
  Save,
  Home,
  FileText,
  BarChart2,
  User,
  Share2,
  Trash2,
  CheckCircle2,
  Download,
  Settings,
  Target,
  Lock,
  Eye,
  Filter,
  BookOpen,
  TrendingUp,
  Award,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type PassageMode = 'single' | 'multiple';
type Tab = 'home' | 'note' | 'stats' | 'profile';

interface Paragraph {
  id: string;
  method: string;
  keyword: string;
  point: string;
}

interface Question {
  id: string;
  number: string;
  status: 'correct' | 'uncertain' | 'wrong';
  analysis: string;
}

interface Concept {
  id: string;
  term: string;
  definition: string;
}

interface Word {
  id: string;
  term: string;
  meaning: string;
}

interface PassageData {
  id: string;
  studentName: string;
  mode: PassageMode;
  title: string;
  page: string;
  date: string;
  targetTime: string;
  actualTime: string;
  flowSummary: string;
  paragraphs: Paragraph[];
  questions: Question[];
  concepts: Concept[];
  words: Word[];
  feedback: string;
  createdAt?: string;
}

interface AppSettings {
  weekStart: string;
  targetAmount: number;
  teacherMessage: string;
  teacherPin: string;
}

const LOGO_URL =
  'https://storage.googleapis.com/static.run.app/v1/projects/ais-dev-fuzhsbwwctarhrqxe7mief/images/67c5496464f899002c9a9616/1741007204481-김현석국어_로고.png';

export default function App() {
  // ── Form state ──────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('note');
  const [studentName, setStudentName] = useState('');
  const [mode, setMode] = useState<PassageMode>('single');
  const [title, setTitle] = useState('');
  const [page, setPage] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetTime, setTargetTime] = useState('');
  const [actualTime, setActualTime] = useState('');
  const [flowSummary, setFlowSummary] = useState('');
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([
    { id: '1', method: '정독', keyword: '', point: '' },
  ]);
  const [questions, setQuestions] = useState<Question[]>([
    { id: '1', number: '01', status: 'correct', analysis: '' },
  ]);
  const [concepts, setConcepts] = useState<Concept[]>([
    { id: '1', term: '', definition: '' },
  ]);
  const [words, setWords] = useState<Word[]>([
    { id: '1', term: '', meaning: '' },
  ]);
  const [feedback, setFeedback] = useState('');

  // ── App state ────────────────────────────────────────────
  const [savedPassages, setSavedPassages] = useState<PassageData[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    weekStart: new Date().toISOString().split('T')[0],
    targetAmount: 10,
    teacherMessage: '이번 주도 깨달음에서 감동까지!',
    teacherPin: '0000',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // ── Teacher mode (PIN-protected) ─────────────────────────
  const [isTeacherMode, setIsTeacherMode] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pendingPin, setPendingPin] = useState('');

  // ── Read-only (share link) ───────────────────────────────
  const [isReadOnly, setIsReadOnly] = useState(false);

  // ── Home tab filter ──────────────────────────────────────
  const [studentFilter, setStudentFilter] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // ── Profile tab ──────────────────────────────────────────
  const [profileName, setProfileName] = useState('');

  const pdfRef = useRef<HTMLDivElement>(null);

  // ── Init ─────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const readonly = params.get('readonly');

    if (id) {
      if (readonly === '1') setIsReadOnly(true);
      fetch(`/api/passages/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) {
            loadPassageIntoForm(data);
            setActiveTab('note');
          }
        });
    }

    const saved = localStorage.getItem('profileName');
    if (saved) {
      setProfileName(saved);
      setStudentName(saved);
    }

    fetchPassages();
    fetchSettings();
  }, []);

  const fetchPassages = async () => {
    try {
      const res = await fetch('/api/passages');
      const data = await res.json();
      setSavedPassages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.error(err);
    }
  };

  // ── Form helpers ─────────────────────────────────────────
  const loadPassageIntoForm = (data: PassageData) => {
    setStudentName(data.studentName || '');
    setMode(data.mode || 'single');
    setTitle(data.title);
    setPage(data.page);
    setDate(data.date);
    setTargetTime(data.targetTime);
    setActualTime(data.actualTime);
    setFlowSummary(data.flowSummary);
    setParagraphs(data.paragraphs);
    setQuestions(data.questions);
    setConcepts(data.concepts);
    setWords(data.words);
    setFeedback(data.feedback);
  };

  const resetForm = () => {
    setIsReadOnly(false);
    setMode('single');
    setTitle('');
    setPage('');
    setDate(new Date().toISOString().split('T')[0]);
    setTargetTime('');
    setActualTime('');
    setFlowSummary('');
    setParagraphs([{ id: '1', method: '정독', keyword: '', point: '' }]);
    setQuestions([{ id: '1', number: '01', status: 'correct', analysis: '' }]);
    setConcepts([{ id: '1', term: '', definition: '' }]);
    setWords([{ id: '1', term: '', meaning: '' }]);
    setFeedback('');
    window.history.pushState({}, '', '/');
  };

  // ── API actions ──────────────────────────────────────────
  const handleSave = async () => {
    if (isReadOnly) return;
    if (!studentName) { alert('학생 이름을 입력해주세요!'); return; }
    if (!title) { alert('지문 제목을 입력해주세요!'); return; }

    setIsSaving(true);
    const passageId =
      new URLSearchParams(window.location.search).get('id') ||
      Date.now().toString();

    const data: PassageData = {
      id: passageId, studentName, mode, title, page, date,
      targetTime, actualTime, flowSummary, paragraphs,
      questions, concepts, words, feedback,
    };

    try {
      const res = await fetch('/api/passages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        window.history.pushState({}, '', `/?id=${passageId}`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        fetchPassages();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = (id: string) => {
    const shareUrl = `${window.location.origin}/?id=${id}&readonly=1`;
    navigator.clipboard.writeText(shareUrl);
    alert('공유 링크가 복사되었습니다!\n링크를 받은 분은 읽기 전용으로 확인할 수 있습니다.');
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/passages/${id}`, { method: 'DELETE' });
      fetchPassages();
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error(err);
    }
  };

  const updateSettings = async (patch: Partial<AppSettings>) => {
    const updated = { ...settings, ...patch };
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      setSettings(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const downloadPDF = async () => {
    if (!pdfRef.current) return;
    const canvas = await html2canvas(pdfRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${studentName}_${title}_분석노트.pdf`);
  };

  // ── Teacher PIN ──────────────────────────────────────────
  const handleTeacherClick = () => {
    if (isTeacherMode) {
      setIsTeacherMode(false);
    } else {
      setPinInput('');
      setPinError(false);
      setShowPinModal(true);
    }
  };

  const handlePinSubmit = () => {
    if (pinInput === settings.teacherPin) {
      setIsTeacherMode(true);
      setShowPinModal(false);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  // ── Item helpers ─────────────────────────────────────────
  const addParagraph = () =>
    setParagraphs([...paragraphs, { id: Date.now().toString(), method: '정독', keyword: '', point: '' }]);

  const addQuestion = () => {
    const nextNum = (questions.length + 1).toString().padStart(2, '0');
    setQuestions([...questions, { id: Date.now().toString(), number: nextNum, status: 'correct', analysis: '' }]);
  };

  const addConcept = () =>
    setConcepts([...concepts, { id: Date.now().toString(), term: '', definition: '' }]);

  const addWord = () =>
    setWords([...words, { id: Date.now().toString(), term: '', meaning: '' }]);

  // ── Derived data ─────────────────────────────────────────
  const currentWeekPassages = savedPassages.filter((p) => {
    if (!settings.weekStart) return false;
    const pDate = new Date(p.date);
    const weekStart = new Date(settings.weekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return pDate >= weekStart && pDate < weekEnd;
  });

  const progress = Math.min(
    100,
    (currentWeekPassages.length / (settings.targetAmount || 1)) * 100
  );

  const filteredPassages = studentFilter
    ? savedPassages.filter((p) =>
        p.studentName.toLowerCase().includes(studentFilter.toLowerCase())
      )
    : savedPassages;

  const allQuestions = savedPassages.flatMap((p) => p.questions);
  const correctCount = allQuestions.filter((q) => q.status === 'correct').length;
  const uncertainCount = allQuestions.filter((q) => q.status === 'uncertain').length;
  const wrongCount = allQuestions.filter((q) => q.status === 'wrong').length;

  const uniqueStudents = [...new Set(savedPassages.map((p) => p.studentName))].filter(Boolean);

  const studentStats = profileName
    ? savedPassages.filter((p) => p.studentName === profileName)
    : [];

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 pb-32 max-w-md mx-auto shadow-xl relative overflow-x-hidden font-sans">

      {/* ── Toast ── */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] bg-brand-black text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-xl"
          >
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium">노트가 저장되었습니다!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PIN Modal ── */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-6"
            onClick={() => setShowPinModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-5 h-5 text-brand-red" />
                <h3 className="font-bold text-slate-900">선생님 인증</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">PIN 번호를 입력하세요 (기본값: 0000)</p>
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                autoFocus
                className={`ios-input text-center text-xl tracking-widest mb-2 ${pinError ? 'border-red-400 ring-2 ring-red-400/20' : ''}`}
                placeholder="••••"
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
                onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
              />
              {pinError && (
                <p className="text-xs text-red-500 text-center mb-3">PIN이 올바르지 않습니다.</p>
              )}
              <button onClick={handlePinSubmit} className="btn-primary w-full mt-1">확인</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm Modal ── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-6"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-slate-900 mb-2">노트를 삭제할까요?</h3>
              <p className="text-xs text-slate-500 mb-5">삭제한 노트는 복구할 수 없습니다.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600"
                >취소</button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold"
                >삭제</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200/60">
        <div className="flex items-center justify-between px-4 h-20">
          <div className="flex items-center gap-3">
            <img
              src={LOGO_URL}
              alt="Logo"
              className="h-10 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col">
              <h1 className="text-sm font-black text-brand-black leading-tight tracking-tight">수능특강 셀프분석</h1>
              <span className="text-[9px] font-bold text-brand-red uppercase tracking-widest">Self-Analysis Note</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isReadOnly && (
              <span className="text-[10px] font-bold text-brand-red bg-brand-red/10 px-2 py-1 rounded-full flex items-center gap-1">
                <Eye className="w-3 h-3" /> 읽기전용
              </span>
            )}
            <button
              onClick={handleTeacherClick}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              title={isTeacherMode ? '선생님 모드 끄기' : '선생님 모드'}
            >
              <Settings className={`w-5 h-5 ${isTeacherMode ? 'text-brand-red' : 'text-slate-400'}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 pt-4 space-y-6">

        {/* ── Weekly Progress ── */}
        <section className="section-card border-brand-red/10 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-red" />
              <h2 className="text-sm font-bold text-slate-900">이번 주 학습 목표</h2>
            </div>
            <span className="text-xs font-bold text-brand-red">
              {currentWeekPassages.length} / {settings.targetAmount} 지문
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-brand-red"
            />
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed italic">
            " {settings.teacherMessage} "
          </p>
        </section>

        {/* ── Teacher Settings Panel ── */}
        {isTeacherMode && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="section-card bg-slate-900 text-white overflow-hidden"
          >
            <h3 className="text-xs font-bold mb-4 flex items-center gap-2">
              <Settings className="w-3 h-3 text-brand-red" /> 선생님 설정
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">주간 목표 지문 수</label>
                  <input
                    type="number"
                    className="w-full bg-slate-800 border-none rounded-lg p-2 text-sm text-white"
                    value={settings.targetAmount}
                    onChange={(e) => updateSettings({ targetAmount: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">주간 시작일</label>
                  <input
                    type="date"
                    className="w-full bg-slate-800 border-none rounded-lg p-2 text-sm text-white"
                    value={settings.weekStart}
                    onChange={(e) => updateSettings({ weekStart: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">학생들에게 전하는 메시지</label>
                <textarea
                  className="w-full bg-slate-800 border-none rounded-lg p-2 text-sm text-white resize-none"
                  rows={2}
                  value={settings.teacherMessage}
                  onChange={(e) => updateSettings({ teacherMessage: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">PIN 번호 변경</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    className="flex-1 bg-slate-800 border-none rounded-lg p-2 text-sm text-white tracking-widest"
                    placeholder="새 PIN (4자리 이상)"
                    value={pendingPin}
                    onChange={(e) => setPendingPin(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      if (pendingPin.length >= 4) {
                        updateSettings({ teacherPin: pendingPin });
                        setPendingPin('');
                        alert('PIN이 변경되었습니다.');
                      } else {
                        alert('4자리 이상 입력해주세요.');
                      }
                    }}
                    className="px-3 py-2 bg-brand-red rounded-lg text-xs font-bold"
                  >저장</button>
                </div>
              </div>
              <div className="border-t border-slate-700 pt-3">
                <p className="text-[10px] text-slate-400 mb-2">참여 학생 ({uniqueStudents.length}명)</p>
                <div className="flex flex-wrap gap-1">
                  {uniqueStudents.map((s) => (
                    <span key={s} className="text-[10px] bg-slate-700 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                  {uniqueStudents.length === 0 && (
                    <span className="text-[10px] text-slate-500">아직 저장된 학생이 없습니다</span>
                  )}
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* ═══════════════════════════════════════════════════
            HOME TAB — 분석 히스토리
        ═══════════════════════════════════════════════════ */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">분석 히스토리</h2>
              <button
                onClick={() => { resetForm(); setActiveTab('note'); }}
                className="text-sm font-bold text-brand-red flex items-center gap-1"
              >
                <PlusCircle className="w-4 h-4" /> 새 노트
              </button>
            </div>

            {/* Student filter */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  placeholder="학생 이름으로 필터"
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                />
              </div>
              {studentFilter && (
                <button
                  onClick={() => setStudentFilter('')}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-brand-red"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {filteredPassages.length === 0 && (
              <div className="text-center py-14 text-slate-400">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">저장된 노트가 없습니다</p>
              </div>
            )}

            {filteredPassages.map((p) => (
              <div
                key={p.id}
                className="section-card !mb-0 hover:border-brand-red/30 transition-all cursor-pointer group"
                onClick={() => {
                  loadPassageIntoForm(p);
                  setIsReadOnly(false);
                  window.history.pushState({}, '', `/?id=${p.id}`);
                  setActiveTab('note');
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[10px] font-bold text-brand-red uppercase mb-1 block">{p.studentName}</span>
                    <h3 className="font-bold text-slate-900 group-hover:text-brand-red transition-colors">{p.title}</h3>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleShare(p.id); }}
                      className="p-2 rounded-full bg-slate-50 text-slate-400 hover:text-brand-red transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    {isTeacherMode && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(p.id); }}
                        className="p-2 rounded-full bg-slate-50 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {p.date}</span>
                  <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> P.{p.page}</span>
                  <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 bg-slate-100 rounded-md">
                    {p.mode === 'multiple' ? '복합지문' : '단일지문'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            STATS TAB — 학습 통계
        ═══════════════════════════════════════════════════ */}
        {activeTab === 'stats' && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900">학습 통계</h2>

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-brand-red" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">전체 지문</span>
                </div>
                <p className="text-3xl font-black text-brand-black">{savedPassages.length}</p>
                <p className="text-[10px] text-slate-400">개 분석 완료</p>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-brand-red" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">참여 학생</span>
                </div>
                <p className="text-3xl font-black text-brand-black">{uniqueStudents.length}</p>
                <p className="text-[10px] text-slate-400">명</p>
              </div>
            </div>

            {/* Question accuracy */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-brand-red" />
                <h3 className="text-sm font-bold text-slate-900">전체 문항 분석</h3>
                <span className="ml-auto text-[10px] text-slate-400">{allQuestions.length}문항</span>
              </div>
              {allQuestions.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">데이터가 없습니다</p>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: '정답 (○)', count: correctCount, color: 'bg-green-500', textColor: 'text-green-600' },
                    { label: '헷갈림 (△)', count: uncertainCount, color: 'bg-yellow-400', textColor: 'text-yellow-600' },
                    { label: '오답 (✕)', count: wrongCount, color: 'bg-brand-red', textColor: 'text-brand-red' },
                  ].map(({ label, count, color, textColor }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-700">{label}</span>
                        <span className={`font-bold ${textColor}`}>
                          {count}개 ({Math.round((count / allQuestions.length) * 100)}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / allQuestions.length) * 100}%` }}
                          className={`h-full ${color} rounded-full`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Per-student (teacher only) */}
            {isTeacherMode && uniqueStudents.length > 0 && (
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-4 h-4 text-brand-red" />
                  <h3 className="text-sm font-bold text-slate-900">학생별 현황</h3>
                </div>
                <div className="space-y-3">
                  {uniqueStudents.map((name) => {
                    const sp = savedPassages.filter((p) => p.studentName === name);
                    const wk = currentWeekPassages.filter((p) => p.studentName === name).length;
                    const sq = sp.flatMap((p) => p.questions);
                    const acc = sq.length > 0
                      ? Math.round((sq.filter((q) => q.status === 'correct').length / sq.length) * 100)
                      : 0;
                    return (
                      <div key={name} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{name}</p>
                          <p className="text-[10px] text-slate-400">
                            이번 주 {wk}지문 · 전체 {sp.length}지문
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-black text-brand-red">{acc}%</p>
                          <p className="text-[9px] text-slate-400">정답률</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* This week's list */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-brand-red" />
                <h3 className="text-sm font-bold text-slate-900">이번 주 분석 목록</h3>
                <span className="ml-auto text-[10px] font-bold text-brand-red">
                  {currentWeekPassages.length}/{settings.targetAmount}
                </span>
              </div>
              {currentWeekPassages.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">이번 주 분석한 지문이 없습니다</p>
              ) : (
                <div className="space-y-2">
                  {currentWeekPassages.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-xs py-1">
                      <span className="font-medium text-slate-700 truncate flex-1">{p.title}</span>
                      <span className="text-slate-400 ml-2 shrink-0">{p.studentName} · {p.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            PROFILE TAB — 내 프로필
        ═══════════════════════════════════════════════════ */}
        {activeTab === 'profile' && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900">내 프로필</h2>

            {/* Name setting */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">내 이름 설정</label>
              <div className="flex gap-2">
                <input
                  className="ios-input flex-1"
                  placeholder="학생 이름 입력"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
                <button
                  onClick={() => {
                    localStorage.setItem('profileName', profileName);
                    setStudentName(profileName);
                    alert('저장되었습니다! 이제 새 노트에 이름이 자동 입력됩니다.');
                  }}
                  className="btn-primary !px-4 !py-2 text-sm whitespace-nowrap"
                >저장</button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">저장 시 새 노트 작성에서 이름이 자동 입력됩니다.</p>
            </div>

            {profileName && (
              <>
                {/* My stats cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-1 mb-2">
                      <BookOpen className="w-4 h-4 text-brand-red" />
                      <span className="text-[10px] font-bold text-slate-400">전체 지문</span>
                    </div>
                    <p className="text-3xl font-black text-brand-black">{studentStats.length}</p>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-1 mb-2">
                      <Target className="w-4 h-4 text-brand-red" />
                      <span className="text-[10px] font-bold text-slate-400">이번 주</span>
                    </div>
                    <p className="text-3xl font-black text-brand-black">
                      {currentWeekPassages.filter((p) => p.studentName === profileName).length}
                    </p>
                  </div>
                </div>

                {/* My accuracy */}
                {(() => {
                  const myQs = studentStats.flatMap((p) => p.questions);
                  if (myQs.length === 0) return null;
                  const myCorrect = myQs.filter((q) => q.status === 'correct').length;
                  const myAccuracy = Math.round((myCorrect / myQs.length) * 100);
                  return (
                    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <Award className="w-4 h-4 text-brand-red" />
                        <h3 className="text-sm font-bold text-slate-900">나의 정답률</h3>
                      </div>
                      <div className="flex items-end gap-2 mb-3">
                        <p className="text-4xl font-black text-brand-red">{myAccuracy}%</p>
                        <p className="text-xs text-slate-400 mb-1">{myQs.length}문항 중 {myCorrect}개 정답</p>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${myAccuracy}%` }}
                          className="h-full bg-brand-red rounded-full"
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* My passages list */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">내 분석 목록</h3>
                  {studentStats.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">아직 분석한 지문이 없습니다</p>
                  ) : (
                    <div className="space-y-1">
                      {studentStats.slice(0, 15).map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between text-xs py-2 border-b border-slate-50 last:border-0 cursor-pointer hover:text-brand-red transition-colors"
                          onClick={() => {
                            loadPassageIntoForm(p);
                            setIsReadOnly(false);
                            window.history.pushState({}, '', `/?id=${p.id}`);
                            setActiveTab('note');
                          }}
                        >
                          <span className="font-medium truncate flex-1">{p.title}</span>
                          <span className="text-slate-400 ml-2 shrink-0">{p.date}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            NOTE TAB — 분석 노트
        ═══════════════════════════════════════════════════ */}
        {activeTab === 'note' && (
          <div ref={pdfRef} className="space-y-6 bg-slate-50 p-1">

            {/* Read-only banner */}
            {isReadOnly && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-amber-700">읽기 전용 모드입니다</span>
                </div>
                <button
                  onClick={() => { resetForm(); setActiveTab('note'); }}
                  className="text-xs font-bold text-brand-red"
                >내 노트 작성 →</button>
              </div>
            )}

            {/* Student Info */}
            <section className="section-card border-l-4 border-l-brand-red">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-[10px] font-bold text-slate-400 uppercase">학생 이름</label>
                  <input
                    className="ios-input !py-2 disabled:bg-slate-50 disabled:text-slate-600"
                    placeholder="이름 입력"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-[10px] font-bold text-slate-400 uppercase">학습 날짜</label>
                  <input
                    className="ios-input !py-2 disabled:bg-slate-50"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </section>

            {/* Passage Info */}
            <section className="section-card">
              <div className="space-y-4">
                {/* Mode toggle */}
                <div>
                  <label className="block mb-2 text-[10px] font-bold text-slate-400 uppercase">지문 유형</label>
                  <div className="flex gap-2">
                    {([['single', '단일 지문'], ['multiple', '복합 지문']] as const).map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => !isReadOnly && setMode(val)}
                        disabled={isReadOnly}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border disabled:cursor-default ${
                          mode === val
                            ? 'bg-brand-red text-white border-brand-red'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-brand-red/50'
                        }`}
                      >{label}</button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-[3]">
                    <label className="block mb-1 text-[10px] font-bold text-slate-400 uppercase">지문 제목</label>
                    <input
                      className="ios-input !py-2 disabled:bg-slate-50"
                      placeholder="지문 제목"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="flex-[1]">
                    <label className="block mb-1 text-[10px] font-bold text-slate-400 uppercase">페이지</label>
                    <input
                      className="ios-input !py-2 text-center disabled:bg-slate-50"
                      placeholder="P."
                      value={page}
                      onChange={(e) => setPage(e.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <span className="text-[9px] font-bold text-slate-400 mb-1 block">목표 시간</span>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Clock className="w-3 h-3 shrink-0" />
                      <input
                        className="bg-transparent border-none p-0 w-full focus:ring-0 disabled:text-slate-600"
                        placeholder="00:00"
                        value={targetTime}
                        onChange={(e) => setTargetTime(e.target.value)}
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>
                  <div className="bg-brand-red/5 p-3 rounded-xl">
                    <span className="text-[9px] font-bold text-brand-red mb-1 block">소요 시간</span>
                    <div className="flex items-center gap-2 text-sm font-bold text-brand-red">
                      <Zap className="w-3 h-3 shrink-0" />
                      <input
                        className="bg-transparent border-none p-0 w-full focus:ring-0 disabled:text-brand-red/70"
                        placeholder="00:00"
                        value={actualTime}
                        onChange={(e) => setActualTime(e.target.value)}
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Content sections */}
            <div className="space-y-8">

              {/* 1. 지문의 흐름 */}
              <section>
                <h3 className="text-sm font-bold text-brand-black mb-3 border-l-4 border-brand-red pl-2">
                  1. 지문의 흐름 정리
                </h3>
                <div className="section-card !p-0 overflow-hidden">
                  <textarea
                    className="w-full border-none p-4 text-sm leading-relaxed focus:ring-0 min-h-[100px] resize-none disabled:bg-slate-50 disabled:text-slate-700"
                    placeholder="지문의 핵심 흐름을 요약하세요."
                    value={flowSummary}
                    onChange={(e) => setFlowSummary(e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
              </section>

              {/* 2. 단락별 독해법 */}
              <section>
                <h3 className="text-sm font-bold text-brand-black mb-3 border-l-4 border-brand-red pl-2">
                  2. 단락별 독해법
                </h3>
                <div className="space-y-4">
                  {paragraphs.map((para, idx) => (
                    <div key={para.id} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-brand-red bg-brand-red/10 px-2 py-0.5 rounded">
                          PARA {idx + 1}
                        </span>
                        <select
                          className="text-[10px] font-bold border-none bg-slate-50 rounded-lg py-1 px-2 focus:ring-0 disabled:opacity-60"
                          disabled={isReadOnly}
                          value={para.method}
                          onChange={(e) => {
                            const n = [...paragraphs];
                            n[idx].method = e.target.value;
                            setParagraphs(n);
                          }}
                        >
                          <option>정독</option>
                          <option>속독</option>
                          <option>발췌독</option>
                        </select>
                      </div>
                      <input
                        className="w-full text-xs font-bold border-b border-slate-100 py-2 mb-2 focus:outline-none focus:border-brand-red disabled:bg-transparent disabled:text-slate-700"
                        disabled={isReadOnly}
                        placeholder="단락 핵심어"
                        value={para.keyword}
                        onChange={(e) => {
                          const n = [...paragraphs];
                          n[idx].keyword = e.target.value;
                          setParagraphs(n);
                        }}
                      />
                      <textarea
                        className="w-full text-xs text-slate-600 bg-slate-50/50 rounded-lg p-2 focus:outline-none min-h-[50px] resize-none disabled:opacity-80"
                        disabled={isReadOnly}
                        placeholder="독해 포인트"
                        value={para.point}
                        onChange={(e) => {
                          const n = [...paragraphs];
                          n[idx].point = e.target.value;
                          setParagraphs(n);
                        }}
                      />
                    </div>
                  ))}
                  {!isReadOnly && (
                    <button
                      onClick={addParagraph}
                      className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-bold text-slate-400 hover:text-brand-red hover:border-brand-red transition-all flex items-center justify-center gap-1"
                    >
                      <PlusCircle className="w-4 h-4" /> 단락 추가
                    </button>
                  )}
                </div>
              </section>

              {/* 3. 문제 분석 */}
              <section>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-brand-black border-l-4 border-brand-red pl-2">3. 문제 분석</h3>
                  {!isReadOnly && (
                    <button onClick={addQuestion} className="text-[10px] font-bold text-brand-red flex items-center gap-1">
                      <PlusCircle className="w-3 h-3" /> 문항 추가
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="section-card !p-0 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 bg-slate-50/50 border-b border-slate-100">
                        <span className="text-[10px] font-bold text-slate-500">{q.number}번</span>
                        <div className="flex gap-2">
                          {(['correct', 'uncertain', 'wrong'] as const).map((s) => (
                            <button
                              key={s}
                              disabled={isReadOnly}
                              onClick={() => {
                                const n = [...questions];
                                n[idx].status = s;
                                setQuestions(n);
                              }}
                              className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all disabled:cursor-default ${
                                q.status === s
                                  ? 'bg-brand-red border-brand-red text-white'
                                  : 'border-slate-200 text-slate-300'
                              }`}
                            >
                              {s === 'correct' ? <Circle className="w-3 h-3" /> : s === 'uncertain' ? <Triangle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        className="w-full p-4 text-xs focus:ring-0 resize-none disabled:bg-slate-50 disabled:text-slate-600"
                        disabled={isReadOnly}
                        placeholder="오답 분석 및 핵심 발문"
                        value={q.analysis}
                        onChange={(e) => {
                          const n = [...questions];
                          n[idx].analysis = e.target.value;
                          setQuestions(n);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* 4. 핵심 개념 */}
              <section>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-brand-black border-l-4 border-brand-red pl-2">4. 핵심 개념 정리</h3>
                  {!isReadOnly && (
                    <button onClick={addConcept} className="text-[10px] font-bold text-brand-red flex items-center gap-1">
                      <PlusCircle className="w-3 h-3" /> 추가
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {concepts.map((c, idx) => (
                    <div key={c.id} className="flex gap-2">
                      <input
                        className="ios-input !py-1 flex-1 text-xs disabled:bg-slate-50 disabled:text-slate-700"
                        disabled={isReadOnly}
                        placeholder="개념어"
                        value={c.term}
                        onChange={(e) => {
                          const n = [...concepts];
                          n[idx].term = e.target.value;
                          setConcepts(n);
                        }}
                      />
                      <input
                        className="ios-input !py-1 flex-[2] text-xs disabled:bg-slate-50 disabled:text-slate-700"
                        disabled={isReadOnly}
                        placeholder="설명"
                        value={c.definition}
                        onChange={(e) => {
                          const n = [...concepts];
                          n[idx].definition = e.target.value;
                          setConcepts(n);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* 5. 어휘 정리 */}
              <section>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-brand-black border-l-4 border-brand-red pl-2">5. 어휘 정리</h3>
                  {!isReadOnly && (
                    <button onClick={addWord} className="text-[10px] font-bold text-brand-red flex items-center gap-1">
                      <PlusCircle className="w-3 h-3" /> 추가
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {words.map((w, idx) => (
                    <div key={w.id} className="flex gap-2">
                      <input
                        className="ios-input !py-1 flex-1 text-xs disabled:bg-slate-50 disabled:text-slate-700"
                        disabled={isReadOnly}
                        placeholder="어휘"
                        value={w.term}
                        onChange={(e) => {
                          const n = [...words];
                          n[idx].term = e.target.value;
                          setWords(n);
                        }}
                      />
                      <input
                        className="ios-input !py-1 flex-[2] text-xs disabled:bg-slate-50 disabled:text-slate-700"
                        disabled={isReadOnly}
                        placeholder="뜻풀이"
                        value={w.meaning}
                        onChange={(e) => {
                          const n = [...words];
                          n[idx].meaning = e.target.value;
                          setWords(n);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* 6. 피드백 */}
              <section className="pb-10">
                <h3 className="text-sm font-bold text-brand-black mb-3 border-l-4 border-brand-red pl-2">6. 피드백 및 복습</h3>
                <div className="section-card !p-0 overflow-hidden">
                  <textarea
                    className="w-full border-none p-4 text-sm leading-relaxed focus:ring-0 min-h-[120px] resize-none disabled:bg-slate-50 disabled:text-slate-700"
                    disabled={isReadOnly}
                    placeholder="오늘의 학습 성찰"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* ── Floating Action Buttons (note tab, edit mode only) ── */}
      {activeTab === 'note' && !isReadOnly && (
        <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={downloadPDF}
            className="w-12 h-12 bg-white border border-slate-200 text-slate-600 rounded-full shadow-lg flex items-center justify-center"
            title="PDF 다운로드"
          >
            <Download className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              const id = new URLSearchParams(window.location.search).get('id');
              if (id) handleShare(id);
              else alert('먼저 저장해 주세요!');
            }}
            className="w-12 h-12 bg-white border border-slate-200 text-slate-600 rounded-full shadow-lg flex items-center justify-center"
            title="공유 링크 복사"
          >
            <Share2 className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSave}
            disabled={isSaving}
            className="w-14 h-14 bg-brand-red text-white rounded-full shadow-2xl flex items-center justify-center shadow-brand-red/40 disabled:opacity-50"
            title="저장"
          >
            <Save className="w-6 h-6" />
          </motion.button>
        </div>
      )}

      {/* ── Bottom Navigation ── */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-xl border-t border-slate-200 flex justify-around items-center pt-2 pb-8 px-6 z-40">
        {[
          { id: 'home', icon: Home, label: '히스토리' },
          { id: 'note', icon: FileText, label: '분석노트' },
          { id: 'stats', icon: BarChart2, label: '학습통계' },
          { id: 'profile', icon: User, label: '프로필' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as Tab)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === t.id ? 'text-brand-red' : 'text-slate-400'
            }`}
          >
            <t.icon className="w-6 h-6" />
            <span className="text-[10px] font-bold">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
