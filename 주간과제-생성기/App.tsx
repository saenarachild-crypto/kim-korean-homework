
import React, { useState, useCallback } from 'react';
import { Step, WeeklyConfig, LearnerData, SourceFile } from './types';
import { extractWeeklyContent } from './services/geminiService';
import { buildWeeklyLearnerHTML } from './services/templateBuilder';

const App: React.FC = () => {
  const [step, setStep] = useState<Step>(Step.INPUT);
  const [month, setMonth] = useState('3');
  const [week, setWeek] = useState('1');
  const [assignmentTitle, setAssignmentTitle] = useState('주간 과제');
  const [announcement, setAnnouncement] = useState('');
  const [kakaoKey, setKakaoKey] = useState('844ef57e5edd5580a2290d70387bea79');

  const [scheduleFiles, setScheduleFiles] = useState<File[]>([]);
  const [readingFiles, setReadingFiles] = useState<File[]>([]);
  const [literatureFiles, setLiteratureFiles] = useState<File[]>([]);
  const [explanationFiles, setExplanationFiles] = useState<File[]>([]);

  const [logs, setLogs] = useState<string[]>([]);
  const [weeklySets, setWeeklySets] = useState<LearnerData[]>([]);
  const [sourceFiles, setSourceFiles] = useState<SourceFile[]>([]);
  const [editingSetIdx, setEditingSetIdx] = useState<number | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const addLog = (m: string) => setLogs(prev => [...prev, `> ${m}`]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
    });
  };

  const handleGenerate = async () => {
    if (scheduleFiles.length === 0 || readingFiles.length === 0 || literatureFiles.length === 0 || explanationFiles.length === 0) {
      alert("모든 영역에 파일을 업로드해주세요.");
      return;
    }

    setStep(Step.PROCESSING);
    setLogs([]);
    addLog('원본 파일 고해상도 임베딩 및 스케줄 분석 시작...');

    try {
      // 1. Capture All Source Files as Base64 for the Split-View
      const allFiles = [...scheduleFiles, ...readingFiles, ...literatureFiles];
      const encodedSourceFiles: SourceFile[] = await Promise.all(
        allFiles.map(async (f) => ({
          id: f.name,
          name: f.name,
          type: f.type,
          data: await fileToBase64(f)
        }))
      );
      setSourceFiles(encodedSourceFiles);
      addLog(`${encodedSourceFiles.length}개의 원본 파일이 듀얼 뷰어에 최적화되었습니다.`);

      // 2. Extract Content with AI
      const rawSets = await extractWeeklyContent(
        { schedule: scheduleFiles, reading: readingFiles, literature: literatureFiles, explanation: explanationFiles },
        `${month}월 ${week}주차 ${assignmentTitle}`
      );

      const now = new Date();
      const enrichedSets = rawSets.map((s, i) => {
        const d = new Date(now);
        const day = s.dayNumber || 1;
        d.setDate(d.getDate() + (day - 1));
        return {
          ...s,
          dayNumber: day,
          setId: `set_${i}_${Date.now()}`,
          releaseDate: d.toISOString().split('T')[0] + " 00:00",
          recommendedTime: s.recommendedTime || "20분"
        } as LearnerData;
      }).sort((a, b) => a.dayNumber - b.dayNumber);

      addLog(`완료: ${enrichedSets.length}개의 지문이 원본 뷰어와 연동되었습니다.`);
      setWeeklySets(enrichedSets);
      setStep(Step.SETTINGS);
      if (enrichedSets.length > 0) setEditingSetIdx(0);
    } catch (err: any) {
      alert(err.message);
      setStep(Step.INPUT);
    }
  };

  const finalize = () => {
    const config: WeeklyConfig = {
      packageName: `${month}월 ${week}주차 ${assignmentTitle}`,
      month, week, assignmentTitle, announcement, kakaoAppKey: kakaoKey,
      sets: weeklySets,
      sourceFiles: sourceFiles
    };
    const html = buildWeeklyLearnerHTML(config);
    const blob = new Blob([html], { type: 'text/html' });
    setGeneratedUrl(URL.createObjectURL(blob));
    setStep(Step.COMPLETE);
  };

  const FileDropZone = ({ title, icon, files, setFiles, color }: { title: string, icon: string, files: File[], setFiles: (f: File[]) => void, color: string }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) setFiles(Array.from(e.target.files)); };
    return (
      <div className={`relative flex-1 min-w-[150px] border-2 border-dashed rounded-[2rem] p-6 text-center transition-all duration-300 shadow-xl border-[#2e3448] bg-[#1a1e28] hover:border-gray-500`}>
        <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
        <div className={`text-4xl mb-4`}>{icon}</div>
        <p className={`text-[11px] font-black uppercase tracking-widest mb-3 text-gray-400`}>{title}</p>
        {files.length > 0 ? (
          <div className={`text-[10px] font-black text-white bg-${color}-600 px-4 py-2 rounded-full inline-block`}>{files.length}개 로드</div>
        ) : (
          <div className="text-[9px] text-gray-600 font-bold italic">클릭하여 업로드</div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0c0e13] text-gray-200 p-6 font-sans">
      <header className="max-w-6xl mx-auto mb-10 flex items-center justify-between">
        <h1 className="text-2xl font-black serif text-blue-400">Weekly <span className="text-white">Dual-View V6.5</span></h1>
        <div className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/30 px-4 py-2 rounded-full font-bold uppercase tracking-widest">High-Fidelity Mode</div>
      </header>

      <main className="max-w-6xl mx-auto bg-[#13161e] border border-[#2e3448] rounded-[3.5rem] p-8 md:p-14 shadow-2xl">
        {step === Step.INPUT && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold mb-8 serif text-white">1. 원본 기반 과제 생성</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 bg-black/30 p-8 rounded-[2.5rem] border border-[#2e3448]">
              <div><label className="text-[10px] font-bold text-gray-500 mb-2 block uppercase">월</label><input type="text" value={month} onChange={e => setMonth(e.target.value)} className="w-full bg-[#1a1e28] border border-[#2e3448] rounded-xl p-3 outline-none focus:border-blue-500" /></div>
              <div><label className="text-[10px] font-bold text-gray-500 mb-2 block uppercase">주차</label><input type="text" value={week} onChange={e => setWeek(e.target.value)} className="w-full bg-[#1a1e28] border border-[#2e3448] rounded-xl p-3 outline-none focus:border-blue-500" /></div>
              <div className="col-span-2"><label className="text-[10px] font-bold text-gray-500 mb-2 block uppercase">과제명</label><input type="text" value={assignmentTitle} onChange={e => setAssignmentTitle(e.target.value)} className="w-full bg-[#1a1e28] border border-[#2e3448] rounded-xl p-3 outline-none focus:border-blue-500" /></div>
            </div>

            <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5">
                <p className="text-[11px] text-blue-400 font-black mb-2">✓ 시각 자료 100% 보존 기술 (Dual-View)</p>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  업로드한 원본 파일이 학습기 좌측에 그대로 나타납니다. 그래프, 도식화, 수식이 깨지지 않고 수능 시험지 그대로의 형태를 유지합니다.
                </p>
              </div>
              <textarea value={announcement} onChange={e => setAnnouncement(e.target.value)} placeholder="학생 공지사항..." className="w-full bg-[#1a1e28] border border-[#2e3448] rounded-xl p-4 text-sm outline-none focus:border-blue-500 h-full min-h-[140px]" />
            </div>

            <div className="flex flex-row gap-4 mb-12 overflow-x-auto pb-6">
              <FileDropZone title="스케줄표" icon="📅" files={scheduleFiles} setFiles={setScheduleFiles} color="amber" />
              <FileDropZone title="독서 지문" icon="📚" files={readingFiles} setFiles={setReadingFiles} color="blue" />
              <FileDropZone title="문학 지문" icon="🎭" files={literatureFiles} setFiles={setLiteratureFiles} color="purple" />
              <FileDropZone title="정답/해설" icon="💡" files={explanationFiles} setFiles={setExplanationFiles} color="green" />
            </div>

            <button onClick={handleGenerate} className="w-full bg-blue-600 py-7 rounded-[2.5rem] font-black text-white text-xl hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/30">원본 뷰어 기반 5일치 학습기 생성 →</button>
          </div>
        )}

        {step === Step.PROCESSING && (
          <div className="text-center py-32">
            <div className="w-24 h-24 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-12 shadow-lg shadow-blue-500/20"></div>
            <h2 className="text-3xl font-bold mb-8 serif text-white">원본 기반 듀얼 뷰 학습기 구축 중...</h2>
            <div className="max-w-xl mx-auto bg-black/40 rounded-[2.5rem] p-10 text-left h-64 overflow-y-auto mono text-[11px] text-gray-500 border border-[#2e3448]">
              {logs.map((l, i) => <div key={i} className="mb-2 border-l-2 border-blue-500/40 pl-4">{l}</div>)}
            </div>
          </div>
        )}

        {step === Step.SETTINGS && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-bold mb-10 serif text-white">2. 생성 결과 검토 (듀얼 뷰 매핑 확인)</h2>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
              <div className="lg:col-span-1 space-y-6">
                {[1, 2, 3, 4, 5].map(day => (
                  <div key={day} className="space-y-2 bg-black/20 p-4 rounded-3xl border border-[#2e3448]">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-2 mb-3">DAY {day}</p>
                    {weeklySets.filter(s => s.dayNumber === day).map((set) => {
                      const originalIdx = weeklySets.findIndex(ws => ws.setId === set.setId);
                      return (
                        <div key={set.setId} onClick={() => setEditingSetIdx(originalIdx)} className={`relative w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${editingSetIdx === originalIdx ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-[#1a1e28] border-[#2e3448] text-gray-400'}`}>
                          <div className="text-xs font-bold truncate text-gray-200">{set.title}</div>
                          <div className="text-[8px] opacity-50 mt-1 font-mono">{set.sourceFileId}</div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="lg:col-span-3 bg-[#1a1e28]/40 rounded-[2.5rem] border border-[#2e3448] p-10">
                {editingSetIdx !== null ? (
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-white mb-2 serif">{weeklySets[editingSetIdx].title}</h3>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 text-[10px] text-blue-400">
                      연동된 원본 파일: <b>{weeklySets[editingSetIdx].sourceFileId}</b>
                    </div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">추출된 문제 미리보기</p>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4">
                      {weeklySets[editingSetIdx].questions.map(q => (
                        <div key={q.num} className="bg-black/20 p-6 rounded-2xl border border-[#2e3448]">
                          <div className="text-xs font-bold text-gray-200 mb-2">{q.num}. {q.text}</div>
                          <div className="flex flex-wrap gap-2">
                            {q.options.map((opt, i) => <div key={i} className="text-[9px] bg-[#1a1e28] px-2 py-1 rounded border border-[#2e3448]">{i + 1}. {opt}</div>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : <div className="text-center py-20 text-gray-600">지문을 선택하세요.</div>}
              </div>
            </div>
            <div className="flex justify-end gap-6 mt-16">
              <button onClick={finalize} className="px-20 py-6 bg-blue-600 rounded-3xl font-black text-white text-xl hover:bg-blue-500 shadow-2xl shadow-blue-600/30 transition-all">최종 학습기 파일 생성</button>
            </div>
          </div>
        )}

        {step === Step.COMPLETE && (
          <div className="text-center py-24">
            <h2 className="text-5xl font-black mb-6 serif text-white tracking-tighter">듀얼 뷰 학습기 완성!</h2>
            <p className="text-gray-400 text-lg mb-16 max-w-lg mx-auto">원본 지문과 시각 자료가 100% 보존된<br />고해상도 학습기가 생성되었습니다.</p>
            <button onClick={() => {
              if (!generatedUrl) return;
              const link = document.createElement('a');
              link.href = generatedUrl;
              link.download = `${assignmentTitle}.html`;
              link.click();
            }} className="w-full max-w-lg bg-blue-600 py-8 rounded-[2rem] font-black text-white text-2xl hover:bg-blue-500 mx-auto block">학습기 다운로드</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
