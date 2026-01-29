import React, { useState, useEffect } from 'react';
import { WordItem, AppView, QuizMode } from './types';
import Dashboard from './components/Dashboard';
import WordInput from './components/WordInput';
import QuizSession from './components/QuizSession';
import { Brain, Sparkles, BookA } from 'lucide-react';

const STORAGE_KEY = 'lexilens_data';

interface AppData {
  history: Record<string, WordItem[]>;
}

const getTodayDate = () => new Date().toISOString().split('T')[0];

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  const [history, setHistory] = useState<Record<string, WordItem[]>>({});
  const [quizMode, setQuizMode] = useState<QuizMode | null>(null);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: AppData = JSON.parse(saved);
        setHistory(parsed.history || {});
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    const data: AppData = { history };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [history]);

  const today = getTodayDate();
  const todayWords = history[today] || [];

  const handleAddWords = (newWords: WordItem[]) => {
    setHistory(prev => ({
      ...prev,
      [today]: [...(prev[today] || []), ...newWords]
    }));
    setView(AppView.DASHBOARD);
  };

  const handleDeleteWord = (id: string) => {
    setHistory(prev => ({
      ...prev,
      [today]: prev[today].filter(w => w.id !== id)
    }));
  };

  const startQuiz = (mode: QuizMode) => {
    setQuizMode(mode);
    setView(AppView.QUIZ_RUN);
  };

  const currentQuizWords = selectedDate === today ? todayWords : (history[selectedDate] || []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center space-x-2 cursor-pointer" 
            onClick={() => {
              setView(AppView.DASHBOARD);
              setSelectedDate(today);
            }}
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Brain className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">LexiLens</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Powered
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {view === AppView.DASHBOARD && (
          <Dashboard 
            words={todayWords} 
            history={history}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onNavigate={setView}
            onDeleteWord={handleDeleteWord}
          />
        )}

        {view === AppView.INPUT && (
          <div className="max-w-2xl mx-auto">
            <WordInput 
              onWordsAdded={handleAddWords} 
              onCancel={() => setView(AppView.DASHBOARD)} 
            />
          </div>
        )}

        {view === AppView.QUIZ_SETUP && (
          <div className="max-w-md mx-auto mt-10">
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-8">Choose Practice Mode</h2>
            <div className="grid gap-4">
              <button 
                onClick={() => startQuiz(QuizMode.RECALL)}
                className="group relative bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-start">
                  <div className="p-3 bg-blue-50 rounded-xl mr-4 group-hover:bg-indigo-600 transition-colors">
                    <BookA className="w-6 h-6 text-indigo-600 group-hover:text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 group-hover:text-indigo-600">Recall Meaning</h3>
                    <p className="text-slate-500 text-sm mt-1">See the word, guess the definition. Great for quick reviews.</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => startQuiz(QuizMode.SPELLING)}
                className="group relative bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-start">
                   <div className="p-3 bg-purple-50 rounded-xl mr-4 group-hover:bg-purple-600 transition-colors">
                    <Brain className="w-6 h-6 text-purple-600 group-hover:text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 group-hover:text-purple-600">Spelling Challenge</h3>
                    <p className="text-slate-500 text-sm mt-1">See the definition, type the word. Tests active memory.</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => setView(AppView.DASHBOARD)}
                className="mt-4 text-slate-400 hover:text-slate-600 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {view === AppView.QUIZ_RUN && quizMode && (
          <QuizSession 
            words={currentQuizWords} 
            mode={quizMode}
            onExit={() => setView(AppView.DASHBOARD)}
            onComplete={() => {
              alert("Session Complete! Great job.");
              setView(AppView.DASHBOARD);
            }}
          />
        )}
      </main>

    </div>
  );
};

export default App;
