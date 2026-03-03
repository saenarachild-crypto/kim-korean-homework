import { GoogleGenAI, Type } from "@google/genai";
import { LearnerData } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const ai = new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_INSTRUCTION = `당신은 대한민국 수능·EBS·내신 국어 문제지를 완벽하게 디지털화하는 최고 수준의 전문가입니다.

━━━━━━━━━━━━━━━━━━━━━━━━
[최우선 원칙] 100% 원문 충실 추출
━━━━━━━━━━━━━━━━━━━━━━━━
- 지문(passage), 발문, 선택지, 보기 등 모든 텍스트를 원본 파일에서 글자 하나, 문장 부호 하나도 빠짐없이 그대로 복사(Verbatim)하세요.
- 절대로 요약, 재구성, 내용 변형, 창작하지 마세요. 원본에 없는 내용을 추가하거나 원본 내용을 줄이는 행위는 엄격히 금지됩니다.

━━━━━━━━━━━━━━━━━━━━━━━━
[1단계] 스케줄표 분석
━━━━━━━━━━━━━━━━━━━━━━━━
스케줄표를 먼저 읽고 Day 1~5에 어떤 지문이 배정되었는지 파악하세요.
각 지문의 dayNumber와 sourceFileId(해당 지문이 들어있는 파일명)를 정확히 매핑하세요.

━━━━━━━━━━━━━━━━━━━━━━━━
[2단계] 지문(passage) 추출 규칙
━━━━━━━━━━━━━━━━━━━━━━━━
▶ 공통
- passage 첫 줄: "[문항번호범위] 다음 글을 읽고 물음에 답하시오." 형식의 안내문 포함
- 출전/작가 표기: "- 작가, 《제목》-" 형식 그대로 포함
- 단락 구분: 원문의 줄바꿈과 들여쓰기를 \n으로 보존
- ㉠㉡㉢㉣㉤으로 표시된 구절: <u class="ul-mark">내용</u> 태그로 감쌀 것
- [A] [B] [C] 구간 표시: <span class="bracket">내용</span> 태그로 감쌀 것
- ※ 각주: 반드시 포함
- 그림·도식·표: [그림: 설명] 또는 HTML <table>로 재현

▶ 독서 지문
- 소제목이 있으면 <strong>소제목</strong> 태그 사용
- 수식이나 화학식은 원문 그대로 표현

▶ 문학 지문
- 현대시·고전시가: 연 구분은 빈 줄(\n\n), 행 구분은 \n
- 소설·수필: 단락 들여쓰기 유지, 대화문의 따옴표 보존
- 복수 작품 세트: (가) (나) (다) 구분 표시 유지

━━━━━━━━━━━━━━━━━━━━━━━━
[3단계] 문항 추출 규칙
━━━━━━━━━━━━━━━━━━━━━━━━
- 원칙: 발문·보기·선택지 모두 원본에서 토씨 하나 틀리지 않고 100% 동일하게 추출
- 문항 번호(num): 시험지에 표시된 번호 그대로
- 문항 코드(code): [26002-0172] 형식이면 그대로, 없으면 빈 문자열
- 발문(text): 질문 전체를 원본 그대로. 괄호 안 조건도 포함
- 보기(bogi): <보기>가 있으면 내용 전체를 원본 그대로. 없으면 null
- 선택지(options): ①②③④⑤ 기호를 제외한 텍스트만 5개 추출 (원본 100% 일치 필수)
- 정답(answer): 해설 파일에서 해당 문항의 정답 번호(1~5) 확인하여 설정

━━━━━━━━━━━━━━━━━━━━━━━━
[4단계] 해설 품질 기준
━━━━━━━━━━━━━━━━━━━━━━━━
- 정답 해설(explanation.correct): "~이므로 N번이 정답입니다." 형식, 2~3문장, 지문 근거 포함
- 오답 안내(explanation.wrong): "정답은 N번입니다." 로 시작, 이유 1문장

━━━━━━━━━━━━━━━━━━━━━━━━
[5단계] title 및 sourceFileId 설정
━━━━━━━━━━━━━━━━━━━━━━━━
- title: "DAY N | [장르] 지문 제목 또는 작품명" 형식
- sourceFileId: 해당 지문이 수록된 파일의 정확한 파일명 (확장자 포함)

━━━━━━━━━━━━━━━━━━━━━━━━
[세트(set) 구성 규칙] ★ 가장 중요 ★
━━━━━━━━━━━━━━━━━━━━━━━━
- 하나의 세트 = 스케줄표에서 같은 Day에 배정된 모든 지문 + 해당 문항 전체
- Day 1에 독서 2개 + 문학 1개가 있다면 → 하나의 세트에 모두 포함
- passage 필드: 해당 Day의 모든 지문을 순서대로 이어 붙임 (지문 사이 \\n\\n---\\n\\n 구분선)
- questions 배열: 해당 Day의 모든 문항을 번호 순으로 배열
- 절대로 지문 하나당 세트 하나로 분리하지 말 것
- 최종 출력: 반드시 Day 1~5에 해당하는 5개의 세트 배열

━━━━━━━━━━━━━━━━━━━━━━━━
[출력 규칙]
━━━━━━━━━━━━━━━━━━━━━━━━
- 순수 JSON 배열만 출력. 마크다운 코드블록 절대 금지.
- 모든 문자열 내 줄바꿈은 \\n으로 이스케이프`;

// ─── Gemini File API (크기 제한 없음) ───────────────────────────────

async function uploadFile(file: File): Promise<{ uri: string; name: string }> {
  if (!API_KEY) throw new Error("VITE_GEMINI_API_KEY가 설정되지 않았습니다.");

  const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=media&key=${API_KEY}`;
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": file.type || "application/pdf" },
    body: file,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`파일 업로드 실패 (${file.name}): ${res.status} ${err}`);
  }
  const data = await res.json();
  return { uri: data.file.uri, name: data.file.name };
}

async function deleteFile(name: string): Promise<void> {
  try {
    await fetch(`https://generativelanguage.googleapis.com/v1beta/${name}?key=${API_KEY}`, {
      method: "DELETE",
    });
  } catch {
    // 정리 실패는 무시
  }
}

// ─── 메인 함수 ──────────────────────────────────────────────────────

export async function extractWeeklyContent(
  categories: { schedule: File[]; reading: File[]; literature: File[]; explanation: File[] },
  fullPackageName: string,
  onLog?: (msg: string) => void
): Promise<Partial<LearnerData>[]> {
  const model = "gemini-2.5-flash";
  const uploadedFileNames: string[] = [];

  const config = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          dayNumber: { type: Type.INTEGER },
          title: { type: Type.STRING },
          passage: { type: Type.STRING },
          sourceFileId: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                num: { type: Type.INTEGER },
                code: { type: Type.STRING },
                text: { type: Type.STRING },
                bogi: { type: Type.STRING, nullable: true },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                answer: { type: Type.INTEGER },
                explanation: {
                  type: Type.OBJECT,
                  properties: {
                    correct: { type: Type.STRING },
                    wrong: { type: Type.STRING },
                  },
                  required: ["correct", "wrong"],
                },
              },
              required: ["num", "text", "options", "answer", "explanation"],
            },
          },
        },
        required: ["dayNumber", "title", "passage", "questions"],
      },
    },
  };

  // 파일 목록을 File API로 업로드하고 parts 배열에 추가
  const addFilesToParts = async (files: File[], label: string, targetParts: any[]) => {
    if (files.length === 0) return;
    targetParts.push({ text: `\n--- [${label} 데이터] ---` });

    onLog?.(`⬆️ ${label} 파일 업로드 중... (${files.length}개)`);
    const uploaded = await Promise.all(files.map((f) => uploadFile(f)));
    uploaded.forEach(({ uri, name }, i) => {
      uploadedFileNames.push(name);
      targetParts.push({ text: `\n파일명: ${files[i].name}` });
      targetParts.push({ fileData: { fileUri: uri, mimeType: files[i].type || "application/pdf" } });
    });
    onLog?.(`✅ ${label} 업로드 완료`);
  };

  try {
    // 스케줄표 + 해설은 공통 parts로 (독서/문학 양쪽 요청에 공유)
    const commonParts: any[] = [{ text: SYSTEM_INSTRUCTION }];
    await addFilesToParts(categories.schedule, "스케줄표", commonParts);
    await addFilesToParts(categories.explanation, "해설", commonParts);

    const results: Partial<LearnerData>[] = [];

    const processCategory = async (files: File[], label: string) => {
      if (files.length === 0) return;
      const batchParts = [...commonParts];
      await addFilesToParts(files, label, batchParts);
      batchParts.push({
        text: `\n위 파일들을 바탕으로 ${fullPackageName} 패키지를 생성하세요. 스케줄표에 명시된 Day 1~5 중 제공된 [${label} 데이터]에 해당하는 모든 지문을 JSON 배열 구조로 반환하세요.`,
      });

      onLog?.(`🤖 AI가 [${label}] 분석 중... (수 분 소요될 수 있습니다)`);
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: batchParts }],
        config,
      });

      let text = response.text || "[]";
      text = text.replace(/^```json/g, "").replace(/```$/g, "").trim();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        results.push(...parsed);
        onLog?.(`✅ [${label}] ${parsed.length}개 세트 추출 완료`);
      }
    };

    // 독서·문학 병렬 처리
    await Promise.all([
      processCategory(categories.reading, "독서"),
      processCategory(categories.literature, "문학"),
    ]);

    return results;
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    throw new Error(`AI 분석 중 오류가 발생했습니다: ${err.message}`);
  } finally {
    // 업로드된 임시 파일 정리
    await Promise.all(uploadedFileNames.map(deleteFile));
  }
}
