import React, { useState, useRef } from 'react';
import { Camera, Type, Upload, Loader2, Plus, X } from 'lucide-react';
import { scanImageForWords, enrichWords } from '../services/geminiService';
import { WordItem } from '../types';

interface WordInputProps {
  onWordsAdded: (words: WordItem[]) => void;
  onCancel: () => void;
}

const WordInput: React.FC<WordInputProps> = ({ onWordsAdded, onCancel }) => {
  const [mode, setMode] = useState<'select' | 'camera' | 'manual'>('select');
  const [manualText, setManualText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setLoadingMessage('Scanning image for words...');

    try {
      const base64 = await fileToBase64(file);
      const extractedWords = await scanImageForWords(base64);
      
      if (extractedWords.length === 0) {
        alert("No words found in image.");
        setIsLoading(false);
        return;
      }

      setLoadingMessage(`Found ${extractedWords.length} words. Generating definitions...`);
      const enriched = await enrichWords(extractedWords);
      onWordsAdded(enriched);
    } catch (error) {
      alert("Error processing image.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualText.trim()) return;
    
    setIsLoading(true);
    setLoadingMessage('Looking up definitions...');
    
    const words = manualText.split(/[\n,]+/).map(w => w.trim()).filter(w => w.length > 0);
    
    try {
      const enriched = await enrichWords(words);
      onWordsAdded(enriched);
    } catch (error) {
      alert("Error finding words.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 animate-in fade-in">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-600 font-medium text-center">{loadingMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Add New Words</h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      {mode === 'select' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
          >
            <Camera className="w-10 h-10 text-slate-400 group-hover:text-indigo-600 mb-3" />
            <span className="font-semibold text-slate-700 group-hover:text-indigo-700">Scan via Camera/Image</span>
            <span className="text-xs text-slate-500 mt-1">AI auto-detects English words</span>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
          </button>

          <button
            onClick={() => setMode('manual')}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
          >
            <Type className="w-10 h-10 text-slate-400 group-hover:text-indigo-600 mb-3" />
            <span className="font-semibold text-slate-700 group-hover:text-indigo-700">Manual Entry</span>
            <span className="text-xs text-slate-500 mt-1">Type or paste a list of words</span>
          </button>
        </div>
      )}

      {mode === 'manual' && (
        <div className="space-y-4">
          <textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Type words separated by commas or new lines (e.g. apple, banana, cherry)..."
            className="w-full h-40 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none text-slate-700"
          />
          <div className="flex justify-end space-x-3">
            <button 
              onClick={() => setMode('select')}
              className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleManualSubmit}
              disabled={!manualText.trim()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Words
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordInput;
