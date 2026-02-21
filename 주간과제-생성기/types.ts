
export interface Question {
  num: number;
  code?: string; // 문항 코드 (예: [26002-0172])
  text: string;
  bogi?: string | null;
  options: string[];
  answer: number;
  explanation: {
    correct: string;
    wrong: string;
  };
}

export interface LearnerData {
  setId: string;
  dayNumber: number;
  title: string;
  passage: string;
  questions: Question[];
  sourceFileId?: string;
}

export interface SourceFile {
  id: string;
  name: string;
  type: string;
  data: string; // Base64
}

export interface WeeklyConfig {
  packageName: string;
  month: string;
  week: string;
  assignmentTitle: string;
  announcement: string;
  kakaoAppKey: string;
  sets: LearnerData[];
  sourceFiles: SourceFile[]; // New field for dual-view rendering
}

export enum Step {
  INPUT = 1,
  SETTINGS = 2,
  PROCESSING = 3,
  COMPLETE = 4
}
