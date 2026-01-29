import React, { useState, useEffect, useCallback } from 'react';
import { WordItem, QuizMode } from '../types';
import { ArrowRight, Check, Eye, Volume2 } from 'lucide-react';

interface QuizSessionProps {
  words: WordItem[];
  mode: QuizMode;
  onComplete: () => void;
  onExit: () => void;
}

const QuizSession: React.FC<QuizSessionProps> = ({ words, mode, onComplete, onExit }) => {
  const [queue, setQueue] = useState<WordItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false); // For Recall mode
  const [userSpelling, setUserSpelling] = useState(''); // For Spelling mode
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'incorrect'>('none');

  // Shuffle on mount
  useEffect(() => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
  }, [words]);

  // Audio Playback Helper
  const playAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Define callbacks BEFORE any early returns to satisfy Hook rules
  const handleNext = useCallback(() => {
    if (queue.length === 0) return;

    if (currentIndex < queue.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setUserSpelling('');
      setFeedback('none');
    } else {
      onComplete();
    }
  }, [currentIndex, queue, onComplete]); // Added queue as dependency

  const handleReveal = useCallback(() => {
    setIsFlipped(true);
  }, []);

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if user is typing in an input field (except for Enter which is handled by the input itself)
      const isInputActive = document.activeElement?.tagName === 'INPUT';
      
      if (e.code === 'ArrowRight') {
        // Right Arrow: Next
        if (mode === QuizMode.RECALL) {
             handleNext();
        } else if (mode === QuizMode.SPELLING && feedback !== 'none') {
             // In spelling mode, only go next if feedback is showing
             handleNext();
        }
      } else if (e.code === 'Space') {
        // Space: Reveal (Only in Recall mode and not typing)
        if (mode === QuizMode.RECALL && !isInputActive) {
          e.preventDefault(); // Prevent scrolling
          if (!isFlipped) {
            handleReveal();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, isFlipped, feedback, handleNext, handleReveal]);

  // Early return checks MUST happen after all Hooks are declared
  if (queue.length === 0) return null;

  const currentWord = queue[currentIndex];
  const progress = ((currentIndex) / queue.length) * 100;

  const handleSpellingCheck = () => {
    if (userSpelling.trim().toLowerCase() === currentWord.text.toLowerCase()) {
      setFeedback('correct');
      playAudio(currentWord.text); // Reward with audio
    } else {
      setFeedback('incorrect');
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2">
      {/* Header / Progress */}
      <div className="mb-6 flex items-center justify-between">
        <button onClick={onExit} className="text-sm text-slate-500 hover:text-slate-800">
          Exit Quiz
        </button>
        <div className="flex-1 mx-4 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-medium text-slate-600">
          {currentIndex + 1} / {queue.length}
        </span>
      </div>

      {/* Card Area */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden min-h-[400px] flex flex-col relative">
        
        {/* Card Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
          
          {mode === QuizMode.RECALL && (
            <>
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-bold text-slate-800">{currentWord.text}</h2>
                <button 
                  onClick={(e) => { e.stopPropagation(); playAudio(currentWord.text); }}
                  className="p-3 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                  title="Play Pronunciation"
                >
                  <Volume2 className="w-6 h-6" />
                </button>
              </div>

              <div className={`transition-all duration-500 ease-in-out overflow-hidden w-full ${isFlipped ? 'opacity-100 max-h-80' : 'opacity-0 max-h-0'}`}>
                <p className="text-xl text-indigo-600 font-medium mb-2">{currentWord.translation}</p>
                <p className="text-slate-600 italic mb-4 max-w-lg mx-auto">{currentWord.definition}</p>
                <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-500 max-w-lg mx-auto">
                  "{currentWord.example}"
                </div>
              </div>
            </>
          )}

          {mode === QuizMode.SPELLING && (
            <>
              <div className="mb-4 flex flex-col items-center">
                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm font-semibold tracking-wide uppercase mb-4">
                  Spell the word
                </span>
                <p className="text-xl text-slate-700 font-medium">{currentWord.translation}</p>
                <p className="text-slate-500 mt-2 max-w-md">{currentWord.definition}</p>
                
                {/* Hint Button for Spelling */}
                <button 
                  onClick={() => playAudio(currentWord.text)}
                  className="mt-4 text-xs flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <Volume2 className="w-3 h-3 mr-1" /> Listen hint
                </button>
              </div>

              {feedback === 'none' && (
                 <input
                  type="text"
                  autoFocus
                  value={userSpelling}
                  onChange={(e) => setUserSpelling(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSpellingCheck()}
                  className="text-3xl font-bold text-center border-b-2 border-slate-300 focus:border-indigo-600 outline-none py-2 w-full max-w-xs bg-transparent text-slate-800 placeholder:text-slate-200"
                  placeholder="type here..."
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                />
              )}

              {feedback !== 'none' && (
                <div className="animate-in zoom-in duration-300">
                  {feedback === 'correct' ? (
                     <div className="flex flex-col items-center text-green-600">
                       <Check className="w-12 h-12 mb-2" />
                       <div className="flex items-center gap-2">
                         <span className="text-2xl font-bold">{currentWord.text}</span>
                         <button onClick={() => playAudio(currentWord.text)} className="p-1 hover:bg-green-50 rounded-full">
                           <Volume2 className="w-5 h-5" />
                         </button>
                       </div>
                       <span className="text-sm">Correct!</span>
                     </div>
                  ) : (
                    <div className="flex flex-col items-center text-red-500">
                      <div className="text-3xl font-bold line-through mb-2 opacity-50">{userSpelling}</div>
                      <div className="flex items-center gap-2 text-slate-800">
                         <span className="text-2xl font-bold">{currentWord.text}</span>
                         <button onClick={() => playAudio(currentWord.text)} className="p-1 hover:bg-slate-100 rounded-full text-slate-600">
                           <Volume2 className="w-5 h-5" />
                         </button>
                      </div>
                      <span className="text-sm mt-1">Correct spelling</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </div>

        {/* Action Bar */}
        <div className="p-6 bg-slate-50 border-t border-slate-100">
          
          {/* Helper Text for shortcuts */}
          <div className="absolute top-4 right-6 hidden md:flex flex-col items-end gap-1 opacity-40 pointer-events-none">
             {mode === QuizMode.RECALL && (
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Space to Reveal</span>
             )}
             <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Right Arrow for Next</span>
          </div>

          {mode === QuizMode.RECALL && (
             !isFlipped ? (
               <button 
                onClick={handleReveal}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center"
               >
                 <Eye className="w-5 h-5 mr-2" /> Reveal Meaning
               </button>
             ) : (
               <div className="flex gap-4">
                 <button 
                  onClick={handleNext} 
                  className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 active:scale-[0.98] transition-all"
                 >
                   Forgot
                 </button>
                 <button 
                  onClick={handleNext} 
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center"
                 >
                   Next Word <ArrowRight className="w-5 h-5 ml-2" />
                 </button>
               </div>
             )
          )}

          {mode === QuizMode.SPELLING && (
            feedback === 'none' ? (
              <button 
                onClick={handleSpellingCheck}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center"
              >
                Check Answer
              </button>
            ) : (
              <button 
                onClick={handleNext}
                className="w-full py-4 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-900 active:scale-[0.98] transition-all flex items-center justify-center"
              >
                Continue <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            )
          )}
        </div>

      </div>
    </div>
  );
};

export default QuizSession;