"use client";

import { useEffect, useState, useCallback } from "react";
import Flashcard from "./Flashcard";
import Scoreboard from "./Scoreboard";
import ScreenReaderAnnouncements from "@/components/ScreenReaderAnnouncements";
import AlternativeAnnouncements from "@/components/AlternativeAnnouncements";
import { MOCK_QUESTIONS, TOTAL_QUESTIONS } from "@/data/questions";
import { useSocket } from "@/hooks/useSocket";
import { useMatchHistory } from "@/hooks/useMatchHistory";
import { MatchHistory } from "@/types/matchHistory";

interface GameProps {
  matchId: string;
  userId: string;
}


interface PlayerScore {
  [userId: string]: {
    score: number;
    name: string;
    answers: { [questionId: string]: boolean };
  };
}

export default function Game({ matchId, userId }: GameProps) {
  const [scores, setScores] = useState<PlayerScore>({});
  const [announcement, setAnnouncement] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(25);
  const [criticalAlert, setCriticalAlert] = useState("");
  const [gameStartTime] = useState<number>(Date.now());
  const [playerAnswers, setPlayerAnswers] = useState<{ [questionId: string]: string }>({});
  const [opponentAnswers, setOpponentAnswers] = useState<{ [questionId: string]: string }>({});
  
  // Get the actual userId from localStorage to ensure consistency
  const [actualUserId, setActualUserId] = useState<string>(userId);
  
  useEffect(() => {
    // Ensure we're using the same userId as the history page
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId && storedUserId !== userId) {
      console.log('🔄 Game: Using stored userId instead of prop userId');
      console.log('🔄 Game: Prop userId:', userId);
      console.log('🔄 Game: Stored userId:', storedUserId);
      setActualUserId(storedUserId);
    }
  }, [userId]);
  
  // Match history hook - use the actual userId
  const { saveMatch } = useMatchHistory(actualUserId);
  
  // Function to create accessible announcements
  const createAnnouncement = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (priority === 'assertive') {
      setCriticalAlert(message);
    } else {
      setAnnouncement(message);
    }
  };

  // Function to save match history
  const saveMatchHistory = useCallback(async () => {
    try {
      console.log('💾 Attempting to save match history...');
      console.log('💾 Current scores:', scores);
      console.log('💾 Current user ID:', actualUserId);
      console.log('💾 Game completed:', gameCompleted);
      console.log('💾 Winner:', winner);
      
      const playerEntries = Object.entries(scores);
      console.log('💾 Player entries:', playerEntries);
      
      if (playerEntries.length < 2) {
        console.log('💾 Not enough players to save match history:', playerEntries.length);
        return; // Need at least 2 players
      }

      const currentPlayer = scores[actualUserId];
      const opponentEntry = playerEntries.find(([id]) => id !== actualUserId);
      
      console.log('💾 Current player:', currentPlayer);
      console.log('💾 Opponent entry:', opponentEntry);
      
      if (!currentPlayer || !opponentEntry) {
        console.log('💾 Missing player data - currentPlayer:', !!currentPlayer, 'opponentEntry:', !!opponentEntry);
        return;
      }

      const [opponentId, opponentData] = opponentEntry;
      const matchDuration = Math.floor((Date.now() - gameStartTime) / 1000);
      
      console.log('💾 Match duration:', matchDuration, 'seconds');
      console.log('💾 Player answers:', playerAnswers);
      console.log('💾 Opponent answers:', opponentAnswers);

      // Create questions array with answers
      const questions = MOCK_QUESTIONS.map((question) => {
        const questionId = question.id;
        const playerAnswer = playerAnswers[questionId] || '';
        const opponentAnswer = opponentAnswers[questionId] || '';
        const playerCorrect = currentPlayer.answers[questionId] || false;
        const opponentCorrect = opponentData.answers[questionId] || false;

        return {
          questionId,
          question: question.question,
          playerAnswer,
          opponentAnswer,
          correctAnswer: question.answer,
          playerCorrect,
          opponentCorrect,
          points: question.points,
        };
      });

      // Calculate correct answers properly
      const playerCorrectAnswers = Object.values(currentPlayer.answers).filter(Boolean).length;
      const opponentCorrectAnswers = Object.values(opponentData.answers).filter(Boolean).length;
      
      console.log('💾 Player correct answers:', playerCorrectAnswers);
      console.log('💾 Opponent correct answers:', opponentCorrectAnswers);

      const matchData: Omit<MatchHistory, 'id' | 'timestamp'> = {
        matchId,
        playerId: actualUserId,
        opponentId,
        playerName: currentPlayer.name,
        opponentName: opponentData.name,
        playerScore: currentPlayer.score,
        opponentScore: opponentData.score,
        winner: winner || '',
        totalQuestions: MOCK_QUESTIONS.length,
        playerCorrectAnswers,
        opponentCorrectAnswers,
        matchDuration,
        questions,
      };

      console.log('💾 Match data to save:', matchData);
      const result = await saveMatch(matchData);
      console.log('✅ Match history saved successfully:', result);
      
      // Show success message
      createAnnouncement("Match history saved successfully!", 'assertive');
    } catch (error) {
      console.error('❌ Error saving match history:', error);
    }
  }, [scores, actualUserId, gameCompleted, winner, gameStartTime, playerAnswers, opponentAnswers, matchId, saveMatch]);
  
  // Effect to handle critical time warnings
  useEffect(() => {
    if (timeLeft <= 5 && timeLeft > 0 && !gameCompleted) {
      createAnnouncement(`Warning! Only ${timeLeft} seconds remaining!`, 'assertive');
    }
  }, [timeLeft, gameCompleted]);

  // Effect to save match history when game is completed and data is ready
  useEffect(() => {
    if (gameCompleted && winner && Object.keys(scores).length >= 2) {
      console.log('🎯 Game completed with all data ready, saving match history...');
      console.log('🎯 Scores:', scores);
      console.log('🎯 Winner:', winner);
      
      // Add a small delay to ensure all state updates are complete
      const saveTimer = setTimeout(() => {
        saveMatchHistory();
      }, 500);
      
      return () => clearTimeout(saveTimer);
    }
  }, [gameCompleted, winner, scores, saveMatchHistory]);
  
  // Use unified socket
  const { socket, connected, joinMatch, sendAnswer: socketSendAnswer, leaveMatch, cleanupMatches } = useSocket(
    actualUserId, 
    `Player ${actualUserId.slice(0, 8)}`
  );

  useEffect(() => {
    if (socket && connected) {
      joinMatch(matchId);
      
      // Initialize current user's score if not already present
      setScores(prev => {
        if (prev[actualUserId]) return prev; // Already initialized
        
        const currentUserName = `Player ${actualUserId.slice(0, 8)}`;
        return {
          ...prev,
          [actualUserId]: {
            score: 0,
            name: currentUserName,
            answers: {}
          }
        };
      });
      
      // Announce game start
      createAnnouncement(`Welcome to Flashcard Frenzy! Question 1 of ${TOTAL_QUESTIONS}. You have 25 seconds to answer each question.`);
    }
  }, [socket, connected, matchId, joinMatch, actualUserId]);

  // Cleanup when component unmounts or user leaves
  useEffect(() => {
    return () => {
      if (socket && connected) {
        leaveMatch(matchId);
        cleanupMatches();
      }
    };
  }, [socket, connected, matchId, leaveMatch, cleanupMatches]);

  useEffect(() => {
    if (!socket) return;

    const handlePlayerJoined = ({ userId: joinedUserId }: { userId: string; matchId: string }) => {
      const playerName = `Player ${joinedUserId.slice(0, 8)}`;
      createAnnouncement(`${playerName} has joined the match. Game can now begin.`);
      
      // Initialize score for the joined player
      setScores(prev => {
        const playerName = `Player ${joinedUserId.slice(0, 8)}`;
        return {
          ...prev,
          [joinedUserId]: {
            score: 0,
            name: playerName,
            answers: {}
          }
        };
      });
    };

    const handlePlayerAnswered = ({ userId: answerUserId, answer, questionId }: { userId: string; answer: string; questionId: string; timestamp: number }) => {
      console.log(`📝 Player ${answerUserId} answered: ${answer} for question ${questionId}`);
      console.log(`📝 Current question index: ${currentQuestionIndex}`);
      console.log(`📝 Current question:`, MOCK_QUESTIONS[currentQuestionIndex]);
      
      const currentQuestion = MOCK_QUESTIONS[currentQuestionIndex];
      const isCorrect = currentQuestion && answer.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim();
      
      console.log(`📝 Answer correct: ${isCorrect}`);
      
      // Track opponent's answer if it's not the current user
      if (answerUserId !== actualUserId) {
        setOpponentAnswers(prev => ({
          ...prev,
          [questionId]: answer
        }));
      }
      

      // Update scores with proper logic
      setScores(prev => {
        console.log(`📊 Updating scores for player ${answerUserId}`);
        console.log(`📊 Previous scores:`, prev);
        
        const playerName = `Player ${answerUserId.slice(0, 8)}`;
        const currentPlayerScore = prev[answerUserId] || { score: 0, name: playerName, answers: {} };
        
        console.log(`📊 Current player score:`, currentPlayerScore);
        console.log(`📊 Already answered this question:`, !!currentPlayerScore.answers[questionId]);
        console.log(`📊 Answer is empty:`, answer.trim() === '');
        
        // Only award points if not already answered this question AND answer is not empty
        if (!currentPlayerScore.answers[questionId] && answer.trim() !== '') {
          const newScore = isCorrect ? currentPlayerScore.score + currentQuestion.points : currentPlayerScore.score;
          const newAnswers = { ...currentPlayerScore.answers, [questionId]: isCorrect };
          
          console.log(`📊 New score: ${newScore}, New answers:`, newAnswers);
          
          const newScores = {
            ...prev,
            [answerUserId]: {
              score: newScore,
              name: playerName,
              answers: newAnswers
            }
          };
          
          console.log(`📊 Updated scores:`, newScores);
          
          // Announce score update for accessibility
          if (isCorrect) {
            createAnnouncement(`${playerName} answered correctly! +${currentQuestion.points} points. New score: ${newScore}`);
          } else {
            createAnnouncement(`${playerName} answered incorrectly. Score remains: ${currentPlayerScore.score}`);
          }
          
          return newScores;
        } else if (!currentPlayerScore.answers[questionId] && answer.trim() === '') {
          // Mark as answered but no points for empty answer (time up)
          const newAnswers = { ...currentPlayerScore.answers, [questionId]: false };
          
          const newScores = {
            ...prev,
            [answerUserId]: {
              score: currentPlayerScore.score,
              name: playerName,
              answers: newAnswers
            }
          };
          
          createAnnouncement(`${playerName} ran out of time. No points awarded.`);
          return newScores;
        }
        
        console.log(`📊 No score update needed`);
        return prev;
      });
    };

    socket.on('player-joined', handlePlayerJoined);
    socket.on('player-answered', handlePlayerAnswered);

    return () => {
      socket.off('player-joined', handlePlayerJoined);
      socket.off('player-answered', handlePlayerAnswered);
    };
  }, [socket, currentQuestionIndex, actualUserId]);

  const sendAnswer = (answer: string) => {
    if (socket && connected && !gameCompleted) {
      const questionId = MOCK_QUESTIONS[currentQuestionIndex].id;
      const question = MOCK_QUESTIONS[currentQuestionIndex];
      console.log(`📤 Sending answer: ${answer} for question ${questionId}`);
      console.log(`📤 Question: ${question.question}`);
      console.log(`📤 Correct answer: ${question.answer}`);
      console.log(`📤 Points: ${question.points}`);
      console.log(`📤 Current user: ${actualUserId}`);
      
      // Track player's answer
      setPlayerAnswers(prev => ({
        ...prev,
        [questionId]: answer
      }));
      
      socketSendAnswer(matchId, answer, questionId);
    } else {
      console.warn('⚠️ Cannot send answer - socket not connected or game completed');
      console.warn('⚠️ Socket connected:', connected);
      console.warn('⚠️ Game completed:', gameCompleted);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < MOCK_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeLeft(25); // Reset timer for new question
      createAnnouncement(`Question ${currentQuestionIndex + 2} of ${TOTAL_QUESTIONS}. You have 25 seconds to answer.`);
    } else {
      // Game completed
      setGameCompleted(true);
      determineWinner();
      createAnnouncement("Quiz completed! Final scores are in. Check the results below.", 'assertive');
      
      // Save match history after a longer delay to ensure all data is ready
      setTimeout(() => {
        console.log('⏰ Game completed, attempting to save match history...');
        saveMatchHistory();
      }, 2000);
    }
  };

  const determineWinner = () => {
    const playerEntries = Object.entries(scores);
    console.log('🏆 Determining winner from scores:', scores);
    console.log('🏆 Current user ID:', actualUserId);
    
    if (playerEntries.length > 0) {
      const sortedPlayers = playerEntries.sort((a, b) => b[1].score - a[1].score);
      const winnerId = sortedPlayers[0][0];
      setWinner(winnerId);
      console.log('🏆 Winner determined:', winnerId, 'with score:', sortedPlayers[0][1].score);
    }
  };

  const resetGame = () => {
    setCurrentQuestionIndex(0);
    setGameCompleted(false);
    setWinner(null);
    setScores({});
    setTimeLeft(25);
    createAnnouncement("New game started! Question 1 of 4. You have 25 seconds to answer.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-4 sm:space-y-0">
            {/* Exit button - top on mobile, left on desktop */}
            <button
              onClick={() => {
                leaveMatch(matchId);
                cleanupMatches();
                window.location.href = '/lobby';
              }}
              aria-label="Exit current match and return to lobby"
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Exit Match</span>
            </button>
            
            {/* Title - centered */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Flashcard Frenzy
          </h1>
            
            {/* Spacer for desktop layout */}
            <div className="hidden sm:block w-24"></div>
          </div>
          {/* Connection status and match info - responsive layout */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4" role="status" aria-live="polite">
            <div className="flex items-center space-x-2">
            <div 
              className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
              aria-label={`Connection status: ${connected ? 'Connected' : 'Disconnected'}`}
            ></div>
              <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
            </div>
            <span className="text-gray-400 hidden sm:inline" aria-hidden="true">•</span>
            <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Match: {matchId.slice(0, 8)}...</span>
          </div>
          
          {/* Game Progress - responsive sizing */}
          {!gameCompleted && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-lg max-w-sm sm:max-w-md mx-auto" role="progressbar" aria-valuenow={currentQuestionIndex + 1} aria-valuemin={1} aria-valuemax={TOTAL_QUESTIONS} aria-label={`Question ${currentQuestionIndex + 1} of ${TOTAL_QUESTIONS}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                  Question {currentQuestionIndex + 1} of {TOTAL_QUESTIONS}
                </span>
                <span className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">
                  {MOCK_QUESTIONS[currentQuestionIndex]?.points} pts
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2" aria-hidden="true">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / TOTAL_QUESTIONS) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Game Content - responsive grid layout */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {!gameCompleted ? (
              <Flashcard 
                question={MOCK_QUESTIONS[currentQuestionIndex]?.question || "Loading..."}
                onAnswer={sendAnswer}
                disabled={!connected}
                onNextQuestion={nextQuestion}
                showNextButton={true}
                timeLimit={25}
                onTimeUp={nextQuestion}
                onTimeUpdate={setTimeLeft}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 text-center">
                <div className="mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Quiz Completed!</h2>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Final scores are in</p>
                </div>
                
                {/* Final Scores - responsive layout */}
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Final Results</h3>
                  
                  <div className="space-y-3 sm:space-y-4">
                    {Object.entries(scores)
                      .sort((a, b) => b[1].score - a[1].score) // Sort by score (highest first)
                      .map(([playerId, playerScore], index) => {
                        const isCurrentUser = playerId === actualUserId;
                        const isWinner = winner === playerId;
                        
                        console.log('🎯 Rendering player:', playerId, 'isCurrentUser:', isCurrentUser, 'isWinner:', isWinner);
                        
                        return (
                          <div key={playerId} className={`relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 ${
                            isWinner 
                              ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg transform scale-[1.02] sm:scale-105' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
                          }`}>
                            {/* Winner badge */}
                            {isWinner && (
                              <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
                                <span className="bg-white text-yellow-600 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-bold">
                                  WINNER
                                </span>
                              </div>
                            )}
                            
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-2 sm:space-x-4">
                                {/* Rank indicator */}
                                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
                                  isWinner 
                                    ? 'bg-white text-yellow-600' 
                                    : index === 1 
                                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                      : 'bg-gray-200 dark:bg-gray-500 text-gray-600 dark:text-gray-400'
                                }`}>
                                  {index + 1}
                                </div>
                                
                                {/* Player info */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                                    <span className="font-semibold text-sm sm:text-base">
                                      {isCurrentUser ? 'You:' : 'Opponent:'}
                                    </span>
                                    <span className="text-xs sm:text-sm opacity-80 truncate">
                                      {playerScore.name}
                                    </span>
                                  </div>
                                  <div className="text-xs sm:text-sm opacity-75 mt-1">
                                    {Object.values(playerScore.answers).filter(Boolean).length} correct
                                  </div>
                                </div>
                              </div>
                              
                              {/* Score */}
                              <div className="text-right">
                                <div className="text-xl sm:text-2xl lg:text-3xl font-bold">
                                  {playerScore.score}
                                </div>
                                <div className="text-xs sm:text-sm opacity-75">
                                  pts
                                </div>
                              </div>
                            </div>
                    </div>
                        );
                      })}
                  </div>
                </div>
                
                {/* Action buttons - responsive layout */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
                <button
                  onClick={resetGame}
                  aria-label="Start a new game with the same players"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 lg:px-8 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl text-sm sm:text-base"
                >
                  Play Again
                </button>
                <button
                  onClick={saveMatchHistory}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 lg:px-8 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl text-sm sm:text-base"
                >
                  Save Match
                </button>
                  <button
                    onClick={() => {
                      leaveMatch(matchId);
                      cleanupMatches();
                      window.location.href = '/lobby';
                    }}
                    aria-label="Leave current match and return to lobby"
                    className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 lg:px-8 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl text-sm sm:text-base"
                  >
                    Back to Lobby
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - responsive positioning */}
          <div className="lg:space-y-6 space-y-4">
            <Scoreboard scores={scores} />
          </div>
        </div>

        {/* Screen Reader Announcements */}
        <ScreenReaderAnnouncements 
          announcement={announcement}
          criticalAlert={timeLeft <= 5 && timeLeft > 0 && !gameCompleted ? `${timeLeft} seconds remaining!` : criticalAlert}
        />
        
        {/* Alternative Announcements (Fallback) */}
        <AlternativeAnnouncements 
          announcement={announcement}
          criticalAlert={timeLeft <= 5 && timeLeft > 0 && !gameCompleted ? `${timeLeft} seconds remaining!` : criticalAlert}
        />
      </div>
    </div>
  );
}
 