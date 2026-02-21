import { GoogleGenAI, Type } from "@google/genai";
import { LearnerData } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `당신은 한국어 수능/EBS 문제지를 디지털 인터랙티브 HTML로 변환하는 전문가입니다.
제공된 파일을 분석하여 다음 지침에 따라 데이터를 추출하세요.

[추출 지침]
1. 지문 정보
   - 문항 범위 표시 (예: "[01~04] 다음 글을 읽고 물음에 답하시오.")
   - 출전 및 제목 (있으면)
   - 본문 단락: 들여쓰기와 줄바꿈을 최대한 보존하세요.
   - 밑줄 조건: ㉠㉡㉢㉣㉤ 등으로 표시된 구절은 <u class="ul-mark">내용</u> 태그로 감싸세요.
   - 괄호 구간: [A], [B] 등은 <span class="bracket">내용</span> 태그로 감싸세요.
   - 각주: ※ 기호로 시작하는 설명을 포함하세요.
   - 그림/표/도식: HTML/CSS로 최대한 재현 가능한 텍스트 또는 태그로 추출하세요.

2. 문항 구조 (문항마다 반복 추출)
   - 문항 번호 (1, 2, 3...)
   - 문항 코드 (예: [26002-0172])
   - 발문 (질문 본문)
   - <보기> 내용: 있는 경우 별도로 추출하세요.
   - 선택지 ①②③④⑤와 각 텍스트를 배열로 추출하세요.
   - 정답 번호(1~5)를 반드시 확인하여 올바르게 설정하세요.
   - 정답 해설: 왜 맞는지 1~2문장으로 요약하세요.
   - 오답 안내: 틀렸을 때 보여줄 메시지를 작성하세요.

응답은 오직 JSON 형식으로만 출력하세요. 마크다운(\`\`\`json) 등은 제외하고 순수 JSON 텍스트만 출력하세요. 형식을 엄격하게 지키세요.`;

export async function extractWeeklyContent(
  categories: { schedule: File[], reading: File[], literature: File[], explanation: File[] },
  fullPackageName: string
): Promise<Partial<LearnerData>[]> {
  const model = "gemini-2.0-flash";
  const parts: any[] = [{ text: SYSTEM_INSTRUCTION }];

  const addFilesToParts = async (files: File[], label: string) => {
    if (files.length === 0) return;
    parts.push({ text: `\n--- [${label} 데이터] ---` });
    for (const file of files) {
      const base64 = await fileToBase64(file);
      parts.push({ text: `\n파일명: ${file.name}` });
      parts.push({
        inlineData: { data: base64, mimeType: file.type }
      });
    }
  };

  await addFilesToParts(categories.schedule, "스케줄표");
  await addFilesToParts(categories.reading, "독서");
  await addFilesToParts(categories.literature, "문학");
  await addFilesToParts(categories.explanation, "해설");

  parts.push({ text: `\n${fullPackageName} 패키지를 생성하세요. 스케줄표에 명시된 Day 1~5의 모든 지문을 JSON 배열 구조로 반환하세요.` });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
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
                        wrong: { type: Type.STRING }
                      },
                      required: ["correct", "wrong"]
                    }
                  },
                  required: ["num", "text", "options", "answer", "explanation"]
                }
              }
            },
            required: ["dayNumber", "title", "passage", "questions"]
          }
        }
      }
    });

    let text = response.text;
    if (!text) throw new Error("AI 분석 결과가 비어있습니다.");

    // Clean up markdown ticks if present
    text = text.replace(/^```json/g, '').replace(/```$/g, '').trim();

    return JSON.parse(text);
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    throw new Error(`AI 분석 중 오류가 발생했습니다: ${err.message}`);
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });
}
