import React from 'react';
import { WordItem, AppView } from '../types';
import { Calendar, Play, BookOpen, Clock, Trash2, PlusCircle, Volume2 } from 'lucide-react';

interface DashboardProps {
  words: WordItem[];
  history: Record<string, WordItem[]>;
  onNavigate: (view: AppView) => void;
  onSelectDate: (date: string) => void;
  selectedDate: string;
  onDeleteWord: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  words, 
  history, 
  onNavigate, 
  onSelectDate, 
  selectedDate,
  onDeleteWord 
}) => {
  
  const today = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === today;
  
  const displayWords = isToday ? words : (history[selectedDate] || []);
  const availableDates = Object.keys(history).sort((a, b) => b.localeCompare(a));

  // Stats
  const wordCount = displayWords.length;

  const playAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="animate-in fade-in">
      {/* Stats Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-indigo-600 mb-1">{wordCount}</span>
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Words Today</span>
        </div>
         <div 
           className="bg-indigo-600 p-4 rounded-2xl shadow-lg shadow-indigo-200 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-indigo-700 transition-colors group"
           onClick={() => onNavigate(AppView.INPUT)}
         >
          <PlusCircle className="w-8 h-8 text-white mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs text-indigo-100 uppercase tracking-wider font-semibold">Add New</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-indigo-600" />
              {isToday ? "Today's Vocabulary" : `Records for ${selectedDate}`}
            </h2>
            {displayWords.length > 0 && (
              <button
                onClick={() => onNavigate(AppView.QUIZ_SETUP)}
                className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 flex items-center shadow-md shadow-slate-200"
              >
                <Play className="w-4 h-4 mr-2" /> Start Practice
              </button>
            )}
          </div>

          {displayWords.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 border-dashed">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-700 mb-2">No words found</h3>
              <p className="text-slate-500 max-w-xs mx-auto mb-6">Start building your vocabulary by adding words via camera or text.</p>
              {isToday && (
                <button 
                  onClick={() => onNavigate(AppView.INPUT)}
                  className="px-6 py-2 bg-indigo-50 text-indigo-600 font-medium rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  Add Your First Word
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {displayWords.map(word => (
                <div key={word.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative pr-12">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-800">{word.text}</h3>
                      <button 
                        onClick={(e) => { e.stopPropagation(); playAudio(word.text); }}
                        className="p-1.5 rounded-full bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    {isToday && (
                       <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteWord(word.id); }}
                        className="absolute top-5 right-5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    )}
                  </div>
                  <div className="flex justify-between items-start mt-1">
                     <div>
                       <p className="text-indigo-600 text-sm font-medium">{word.translation}</p>
                       <p className="text-slate-500 text-sm mt-1 line-clamp-1">{word.definition}</p>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar / History */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
              <Clock className="w-4 h-4 mr-2" /> History
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => onSelectDate(today)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-between ${
                  isToday 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center"><Calendar className="w-4 h-4 mr-2 opacity-70"/> Today</span>
                {isToday && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
              </button>
              
              {availableDates.filter(d => d !== today).map(date => (
                <button
                  key={date}
                  onClick={() => onSelectDate(date)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-between ${
                    selectedDate === date
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{date}</span>
                </button>
              ))}
              
              {availableDates.length <= 1 && !isToday && (
                 <p className="text-slate-400 text-sm italic px-4">No history yet.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;