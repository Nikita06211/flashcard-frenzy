export interface Question {
  id: string;
  question: string;
  answer: string;
  points: number;
}

export const MOCK_QUESTIONS: Question[] = [
  {
    id: "1",
    question: "What is 2 + 2?",
    answer: "4",
    points: 10
  },
  {
    id: "2", 
    question: "What is the capital of France?",
    answer: "Paris",
    points: 15
  },
  {
    id: "3",
    question: "What is 5 × 7?",
    answer: "35",
    points: 10
  },
  {
    id: "4",
    question: "What is the largest planet in our solar system?",
    answer: "Jupiter",
    points: 20
  }
];

export const TOTAL_QUESTIONS = MOCK_QUESTIONS.length;
export const MAX_SCORE = MOCK_QUESTIONS.reduce((total, q) => total + q.points, 0);

