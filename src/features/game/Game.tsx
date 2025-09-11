"use client";

import { useEffect, useState } from "react";
import Flashcard from "./Flashcard";
import Scoreboard from "./Scoreboard";
import { MOCK_QUESTIONS, Question, TOTAL_QUESTIONS, MAX_SCORE } from "@/data/questions";
import { useSocket } from "@/hooks/useSocket";

interface GameProps {
  matchId: string;
  userId: string;
}

interface GameMessage {
  userId: string;
  message: string;
  timestamp: number;
}

interface PlayerScore {
  [userId: string]: {
    score: number;
    name: string;
    answers: { [questionId: string]: boolean };
  };
}

export default function Game({ matchId, userId }: GameProps) {
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [scores, setScores] = useState<PlayerScore>({});
  const [announcement, setAnnouncement] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [playerNames, setPlayerNames] = useState<{ [userId: string]: string }>({});
  
  // Use unified socket
  const { socket, connected, joinMatch, sendAnswer: socketSendAnswer, leaveMatch, cleanupMatches } = useSocket(
    userId, 
    `Player ${userId.slice(0, 8)}`
  );

  useEffect(() => {
    if (socket && connected) {
      console.log('🎮 Joining match room:', matchId);
      joinMatch(matchId);
      
      // Initialize current user's score
      setScores(prev => {
        const currentUserName = `Player ${userId.slice(0, 8)}`;
        return {
          ...prev,
          [userId]: {
            score: 0,
            name: currentUserName,
            answers: {}
          }
        };
      });
    }
  }, [socket, connected, matchId, joinMatch, userId]);

  // Cleanup when component unmounts or user leaves
  useEffect(() => {
    return () => {
      if (socket && connected) {
        console.log('🧹 Cleaning up match on unmount');
        leaveMatch(matchId);
        cleanupMatches();
      }
    };
  }, [socket, connected, matchId, leaveMatch, cleanupMatches]);

  useEffect(() => {
    if (!socket) return;

    const handlePlayerJoined = ({ userId: joinedUserId, matchId: roomId }: any) => {
      console.log(`👤 Player ${joinedUserId} joined match ${roomId}`);
      const newMessage = {
        userId: joinedUserId,
        message: 'joined the match',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, newMessage]);
      setAnnouncement(`Player ${joinedUserId} joined the match`);
      
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
      
      // Also initialize score for current user if not already present
      setScores(prev => {
        const currentUserName = `Player ${userId.slice(0, 8)}`;
        return {
          ...prev,
          [userId]: {
            score: 0,
            name: currentUserName,
            answers: {}
          }
        };
      });
    };

    const handlePlayerAnswered = ({ userId: answerUserId, answer, questionId, timestamp }: any) => {
      console.log(`📝 Player ${answerUserId} answered: ${answer} for question ${questionId}`);
      console.log(`📝 Current question index: ${currentQuestionIndex}`);
      console.log(`📝 Current question:`, MOCK_QUESTIONS[currentQuestionIndex]);
      
      const currentQuestion = MOCK_QUESTIONS[currentQuestionIndex];
      const isCorrect = currentQuestion && answer.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim();
      
      console.log(`📝 Answer correct: ${isCorrect}`);
      
      const newMessage = {
        userId: answerUserId,
        message: `answered: ${answer} ${isCorrect ? '✓' : '✗'}`,
        timestamp
      };
      setMessages(prev => [...prev, newMessage]);

      // Update scores with proper logic
      setScores(prev => {
        console.log(`📊 Updating scores for player ${answerUserId}`);
        console.log(`📊 Previous scores:`, prev);
        
        const playerName = playerNames[answerUserId] || `Player ${answerUserId.slice(0, 8)}`;
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
            setAnnouncement(`${playerName} answered correctly! +${currentQuestion.points} points. New score: ${newScore}`);
          } else {
            setAnnouncement(`${playerName} answered incorrectly. Score remains: ${currentPlayerScore.score}`);
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
          
          setAnnouncement(`${playerName} ran out of time. No points awarded.`);
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
  }, [socket, currentQuestionIndex, playerNames]);

  const sendAnswer = (answer: string) => {
    if (socket && connected && !gameCompleted) {
      const questionId = MOCK_QUESTIONS[currentQuestionIndex].id;
      const question = MOCK_QUESTIONS[currentQuestionIndex];
      console.log(`📤 Sending answer: ${answer} for question ${questionId}`);
      console.log(`📤 Question: ${question.question}`);
      console.log(`📤 Correct answer: ${question.answer}`);
      console.log(`📤 Points: ${question.points}`);
      console.log(`📤 Current user: ${userId}`);
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
      setAnnouncement(`Question ${currentQuestionIndex + 2} of ${TOTAL_QUESTIONS}`);
    } else {
      // Game completed
      setGameCompleted(true);
      determineWinner();
      setAnnouncement("Quiz completed! Final scores are in.");
    }
  };

  const determineWinner = () => {
    const playerEntries = Object.entries(scores);
    console.log('🏆 Determining winner from scores:', scores);
    console.log('🏆 Current user ID:', userId);
    
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
    setMessages([]);
    setAnnouncement("New game started!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => {
                leaveMatch(matchId);
                cleanupMatches();
                window.location.href = '/lobby';
              }}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Exit Match</span>
            </button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Flashcard Frenzy
          </h1>
            <div></div> {/* Spacer for centering */}
          </div>
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-600 dark:text-gray-400">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600 dark:text-gray-400">Match: {matchId}</span>
          </div>
          
          {/* Game Progress */}
          {!gameCompleted && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg max-w-md mx-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Question {currentQuestionIndex + 1} of {TOTAL_QUESTIONS}
                </span>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {MOCK_QUESTIONS[currentQuestionIndex]?.points} points
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / TOTAL_QUESTIONS) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Game Content */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {!gameCompleted ? (
              <Flashcard 
                question={MOCK_QUESTIONS[currentQuestionIndex]?.question || "Loading..."}
                onAnswer={sendAnswer}
                disabled={!connected}
                onNextQuestion={nextQuestion}
                showNextButton={true}
                timeLimit={25}
                onTimeUp={nextQuestion}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Quiz Completed!</h2>
                  <p className="text-gray-600 dark:text-gray-400">Final scores are in</p>
                </div>
                
                {/* Final Scores */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Final Results</h3>
                  
                  {/* Debug info */}
                  <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                    <div>Debug: Current User ID: {userId}</div>
                    <div>Debug: Scores Object: {JSON.stringify(scores, null, 2)}</div>
                    <div>Debug: Winner: {winner}</div>
                  </div>
                  
                  <div className="space-y-4">
                    {Object.entries(scores)
                      .sort((a, b) => b[1].score - a[1].score) // Sort by score (highest first)
                      .map(([playerId, playerScore], index) => {
                        const isCurrentUser = playerId === userId;
                        const isWinner = winner === playerId;
                        
                        console.log('🎯 Rendering player:', playerId, 'isCurrentUser:', isCurrentUser, 'isWinner:', isWinner);
                        
                        return (
                          <div key={playerId} className={`relative overflow-hidden rounded-xl p-6 ${
                            isWinner 
                              ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg transform scale-105' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
                          }`}>
                            {/* Winner badge */}
                            {isWinner && (
                              <div className="absolute top-2 right-2">
                                <span className="bg-white text-yellow-600 px-2 py-1 rounded-full text-xs font-bold">
                                  WINNER
                                </span>
                              </div>
                            )}
                            
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-4">
                                {/* Rank indicator */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                  isWinner 
                                    ? 'bg-white text-yellow-600' 
                                    : index === 1 
                                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                      : 'bg-gray-200 dark:bg-gray-500 text-gray-600 dark:text-gray-400'
                                }`}>
                                  {index + 1}
                                </div>
                                
                                {/* Player info */}
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-lg">
                                      {isCurrentUser ? 'You:' : 'Opponent:'}
                                    </span>
                                    <span className="text-sm opacity-80">
                                      {playerScore.name}
                                    </span>
                                  </div>
                                  <div className="text-sm opacity-75 mt-1">
                                    {Object.values(playerScore.answers).filter(Boolean).length} correct answers
                                  </div>
                                </div>
                              </div>
                              
                              {/* Score */}
                              <div className="text-right">
                                <div className="text-3xl font-bold">
                                  {playerScore.score}
                                </div>
                                <div className="text-sm opacity-75">
                                  points
                                </div>
                              </div>
                            </div>
                    </div>
                        );
                      })}
                  </div>
                </div>
                
                <div className="flex space-x-4 justify-center">
                <button
                  onClick={resetGame}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                >
                  Play Again
                </button>
                  <button
                    onClick={() => {
                      leaveMatch(matchId);
                      cleanupMatches();
                      window.location.href = '/lobby';
                    }}
                    className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                  >
                    Back to Lobby
                  </button>
                </div>
              </div>
            )}
            
            {/* Game Messages */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Game Activity
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No activity yet...
                  </p>
                ) : (
                  messages.map((msg, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {msg.userId}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 ml-2">
                        {msg.message}
                      </span>
                      <span className="text-gray-400 ml-2 text-xs">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Scoreboard scores={scores} />
            
            {/* Match Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Match Info
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Match ID:</span>
                  <span className="font-mono text-gray-900 dark:text-white">{matchId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Your ID:</span>
                  <span className="font-mono text-gray-900 dark:text-white">{userId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={`font-medium ${connected ? 'text-green-600' : 'text-red-600'}`}>
                    {connected ? 'Active' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Screen Reader Announcements */}
        <div 
          aria-live="polite" 
          aria-atomic="true"
          className="sr-only"
          role="status"
          aria-label="Game announcements"
        >
          {announcement}
        </div>
      </div>
    </div>
  );
}
