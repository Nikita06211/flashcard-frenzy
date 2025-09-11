"use client";

import { useState, useEffect } from "react";

interface FlashcardProps {
  question: string;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
  onNextQuestion?: () => void;
  showNextButton?: boolean;
  timeLimit?: number; // in seconds
  onTimeUp?: () => void; // Callback when timer runs out
  onTimeUpdate?: (timeLeft: number) => void; // Callback when timer updates
}

export default function Flashcard({ question, onAnswer, disabled = false, onNextQuestion, showNextButton = false, timeLimit = 25, onTimeUp, onTimeUpdate }: FlashcardProps) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [timeUp, setTimeUp] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 Flashcard handleSubmit called:', { answer: answer.trim(), submitted, disabled });
    if (answer.trim() && !submitted && !disabled) {
      console.log('📝 Calling onAnswer with:', answer.trim());
      onAnswer(answer.trim());
      setSubmitted(true);
    } else {
      console.log('📝 Not submitting answer:', { hasAnswer: !!answer.trim(), submitted, disabled });
    }
  };

  const handleReset = () => {
    setAnswer("");
    setSubmitted(false);
    setTimeLeft(timeLimit);
    setTimeUp(false);
  };

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !submitted && !disabled) {
      const timer = setTimeout(() => {
        const newTimeLeft = timeLeft - 1;
        setTimeLeft(newTimeLeft);
        // Notify parent component of time update
        if (onTimeUpdate) {
          onTimeUpdate(newTimeLeft);
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !submitted && !disabled) {
      // Auto-submit when time runs out
      console.log('⏰ Time up! Auto-submitting empty answer');
      onAnswer("");
      setSubmitted(true);
      setTimeUp(true);
      // Call onTimeUp callback to go to next question
      if (onTimeUp) {
        setTimeout(() => {
          onTimeUp();
        }, 1000); // Small delay to show the submitted state
      }
    }
  }, [timeLeft, submitted, disabled, onAnswer, onTimeUp, onTimeUpdate]);

  // Reset timer when question changes
  useEffect(() => {
    setTimeLeft(timeLimit);
    setSubmitted(false);
    setAnswer("");
    setTimeUp(false);
  }, [question, timeLimit]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="text-center">
        {/* Question */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Question
            </h2>
            <div 
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                timeLeft > 10 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                timeLeft > 5 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}
              role="timer"
              aria-live="assertive"
              aria-label={`Time remaining: ${timeLeft} seconds`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold" aria-hidden="true">{timeLeft}s</span>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-6">
            <p className="text-xl text-gray-800 dark:text-white font-medium">
              {question}
            </p>
          </div>
        </div>

        {/* Answer Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="answer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Answer
            </label>
            <input
              id="answer"
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={disabled || submitted}
              placeholder="Enter your answer..."
              aria-describedby="answer-help"
              aria-required="true"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div id="answer-help" className="sr-only">
              Enter your answer to the question above. Press Enter or click Submit Answer when ready.
            </div>
          </div>

          <div className="flex space-x-4 justify-center">
            {!submitted ? (
              <>
                <button
                  type="submit"
                  disabled={!answer.trim() || disabled}
                  aria-describedby="submit-help"
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  Submit Answer
                </button>
                <div id="submit-help" className="sr-only">
                  Submit your answer to the question. You can only submit once per question.
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className={`flex items-center justify-center space-x-2 ${
                  timeUp ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-semibold">
                    {timeUp ? 'Time Up! Auto-advancing...' : 'Answer Submitted!'}
                  </span>
                </div>
                {showNextButton && onNextQuestion ? (
                  <button
                    type="button"
                    onClick={onNextQuestion}
                    disabled={disabled}
                    aria-label="Proceed to the next question"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed"
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={disabled}
                    aria-label="Clear current answer and try again"
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed"
                  >
                    New Answer
                  </button>
                )}
              </div>
            )}
          </div>
        </form>

        {/* Status Messages */}
        {disabled && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-yellow-600 dark:text-yellow-400 text-sm text-center">
              ⚠️ Waiting for connection...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
