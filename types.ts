export interface WordItem {
  id: string;
  text: string;
  definition: string; // English definition
  translation: string; // Chinese translation (implied by context of "reciting")
  example: string;
  dateAdded: string; // ISO Date string YYYY-MM-DD
  masteryLevel: number; // 0-5
}

export interface QuizResult {
  wordId: string;
  correct: boolean;
  mode: 'recall' | 'spelling';
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  INPUT = 'INPUT',
  QUIZ_SETUP = 'QUIZ_SETUP',
  QUIZ_RUN = 'QUIZ_RUN',
  HISTORY = 'HISTORY'
}

export enum QuizMode {
  RECALL = 'RECALL', // Show word, guess meaning
  SPELLING = 'SPELLING' // Show meaning, spell word
}
