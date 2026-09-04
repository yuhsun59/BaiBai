/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, CalendarPlus, Trash2, Plus, RotateCcw, 
  ChevronDown, ChevronUp, Info, AlertCircle
} from 'lucide-react';
import { DEFAULT_FESTIVALS, FestivalDef, OfferingItem, Target } from './data';
import { calculateFestivalDate, formatDate, generateICS, CalculatedDate } from './utils';
import clsx from 'clsx';

const STORAGE_KEY = 'yilan-baibai-state';

const sanitizeText = (input: string): string => {
  if (!input) return '';
  const el = document.createElement('div');
  el.textContent = input;
  return el.innerHTML.trim();
};

export default function App() {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  
  // offerings state: festivalId -> target -> items
  const [offerings, setOfferings] = useState<Record<string, Record<string, OfferingItem[]>>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.offerings) return parsed.offerings;
      }
    } catch (e) {
      console.error('Failed to load state', e);
    }
    
    // Initialize with defaults
    const initial: Record<string, Record<string, OfferingItem[]>> = {};
    DEFAULT_FESTIVALS.forEach(f => {
      initial[f.id] = {};
      f.targets.forEach(t => {
        initial[f.id][t.target] = JSON.parse(JSON.stringify(t.items));
      });
    });
    return initial;
  });

  const [customDates, setCustomDates] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.customDates) return parsed.customDates;
      }
    } catch (e) {}
    return {};
  });

  const [notes, setNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.notes) return parsed.notes;
      }
    } catch (e) {}
    return {};
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ offerings, customDates, notes }));
  }, [offerings, customDates, notes]);

  const toggleItem = (festivalId: string, target: Target, itemId: string) => {
    setOfferings(prev => {
      const next = { ...prev };
      const items = next[festivalId][target].map(item => 
        item.id === itemId ? { ...item, checked: !item.checked } : item
      );
      next[festivalId] = { ...next[festivalId], [target]: items };
      return next;
    });
  };

  const addItem = (festivalId: string, target: Target, name: string) => {
    const cleanName = sanitizeText(name);
    if (!cleanName) return;
    setOfferings(prev => {
      const next = { ...prev };
      const newItem: OfferingItem = {
        id: Math.random().toString(36).substring(2, 9),
        name: cleanName,
        checked: false
      };
      next[festivalId] = { ...next[festivalId], [target]: [...next[festivalId][target], newItem] };
      return next;
    });
  };

  const removeItem = (festivalId: string, target: Target, itemId: string) => {
    setOfferings(prev => {
      const next = { ...prev };
      next[festivalId] = { 
        ...next[festivalId], 
        [target]: next[festivalId][target].filter(i => i.id !== itemId) 
      };
      return next;
    });
  };

  const resetFestival = (festivalId: string) => {
    if (!window.confirm('確定要重設為預設供品嗎？這將會清除您所有的自訂項目與勾選狀態。')) return;
    
    setOfferings(prev => {
      const next = { ...prev };
      const def = DEFAULT_FESTIVALS.find(f => f.id === festivalId);
      if (def) {
        next[festivalId] = {};
        def.targets.forEach(t => {
          next[festivalId][t.target] = JSON.parse(JSON.stringify(t.items));
        });
      }
      return next;
    });
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExportJSON = () => {
    const data = { offerings, customDates, notes };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `baibai_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.offerings) setOfferings(parsed.offerings);
        if (parsed.customDates) setCustomDates(parsed.customDates);
        if (parsed.notes) setNotes(parsed.notes);
        alert("匯入成功！");
      } catch (err) {
        alert("檔案格式錯誤，無法匯入");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#2D2926] font-serif pb-24">
      {/* Header */}
      <header className="bg-[#FDFCF8] border-b border-[#A63D40]/20 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-6 py-6 flex items-end justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center w-12 h-12 shrink-0">
              {/* Diamond Background */}
              <div className="absolute inset-0 bg-[#A63D40] rounded-sm shadow-sm transform rotate-45">
                <div className="absolute inset-1 border border-[#FDFCF8]/30 rounded-[1px]"></div>
              </div>
              {/* Folded Hands Icon */}
              <div className="relative z-10 text-[#FDFCF8]">
                <svg className="w-6 h-6 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21V11.5C9 8 11.5 4.5 12 3c.5 1.5 3 5 3 8.5V21" />
                  <line x1="12" y1="3" x2="12" y2="21" />
                  <path d="M9 18l-2 3 M15 18l2 3" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-[1.1rem] sm:text-xl font-bold tracking-tighter text-[#A63D40] whitespace-nowrap">BaiBai｜祭祀日程及供奉指南</h1>
              <p className="text-[10px] uppercase tracking-widest mt-1 text-[#48594E] font-sans hidden sm:block">BaiBai Schedule & Offering Guide</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-sans text-gray-400 uppercase tracking-widest mb-1">Year</div>
            <select 
              value={year} 
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-transparent text-[#2D2926] border-b border-gray-300 rounded-none px-1 py-1 text-sm font-sans focus:outline-none focus:border-[#A63D40] appearance-none text-right font-bold cursor-pointer"
            >
              {[year - 1, year, year + 1, year + 2].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="bg-[#F9F7F2] border border-[#A63D40]/10 text-[#48594E] rounded-sm p-4 flex gap-3 text-sm leading-relaxed font-sans shadow-sm">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            系統會自動為您計算 <strong>{year}</strong> 年的節日國曆日期。若非連假且落在平日，會自動建議前一個週末返鄉祭拜。
          </p>
        </div>

        <div className="space-y-4">
          {DEFAULT_FESTIVALS.map(def => (
            <FestivalCard 
              key={def.id}
              def={def}
              year={year}
              targetsData={offerings[def.id] || {}}
              customDate={customDates[`${year}_${def.id}`]}
              note={notes[def.id]}
              onToggle={(t, id) => toggleItem(def.id, t, id)}
              onAdd={(t, name) => addItem(def.id, t, name)}
              onRemove={(t, id) => removeItem(def.id, t, id)}
              onReset={() => resetFestival(def.id)}
              onCustomDateChange={(dateStr) => setCustomDates(prev => ({...prev, [`${year}_${def.id}`]: dateStr}))}
              onNoteChange={(note) => setNotes(prev => ({...prev, [def.id]: sanitizeText(note)}))}
            />
          ))}
        </div>

        {/* Backup / Export UI */}
        <div className="pt-8 pb-4 border-t border-[#A63D40]/10 flex flex-col items-center gap-3">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-sans">Data Backup</p>
          <div className="flex gap-3 w-full">
            <button 
              onClick={handleExportJSON}
              className="flex-1 bg-white border border-gray-200 text-[#48594E] hover:bg-[#F9F7F2] py-2.5 rounded-sm font-sans text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
            >
              匯出備份 (.json)
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-white border border-gray-200 text-[#48594E] hover:bg-[#F9F7F2] py-2.5 rounded-sm font-sans text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
            >
              匯入備份
            </button>
            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef} 
              onChange={handleImportJSON} 
              className="hidden" 
            />
          </div>
        </div>
      </main>
    </div>
  );
}

interface FestivalCardProps {
  key?: React.Key;
  def: FestivalDef;
  year: number;
  targetsData: Record<string, OfferingItem[]>;
  customDate?: string;
  note?: string;
  onToggle: (t: Target, id: string) => void;
  onAdd: (t: Target, name: string) => void;
  onRemove: (t: Target, id: string) => void;
  onReset: () => void;
  onCustomDateChange: (date: string) => void;
  onNoteChange: (note: string) => void;
}

function FestivalCard({ 
  def, year, targetsData, customDate, note,
  onToggle, onAdd, onRemove, onReset, onCustomDateChange, onNoteChange
}: FestivalCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [activeTarget, setActiveTarget] = useState<Target>(def.targets[0].target);

  const dateInfo = useMemo(() => calculateFestivalDate(year, def), [year, def]);
  
  const defaultTargetDate = dateInfo.suggestedDate || dateInfo.solarDate;
  let actualTargetDate = defaultTargetDate;
  if (customDate) {
    const parsed = new Date(customDate);
    if (!isNaN(parsed.getTime())) {
      actualTargetDate = parsed;
    }
  }

  const getLocalDateString = (d: Date) => {
    const offset = d.getTimezoneOffset();
    const d2 = new Date(d.getTime() - (offset * 60 * 1000));
    return d2.toISOString().split('T')[0];
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetTime = new Date(actualTargetDate);
  targetTime.setHours(0, 0, 0, 0);
  const diffTime = targetTime.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isPast = daysLeft < 0;

  const handleExportICS = (e: React.MouseEvent) => {
    e.stopPropagation();
    const targetDate = actualTargetDate;
    const isWeekendRange = targetDate.getDay() === 0 || targetDate.getDay() === 6;
    
    let desc = `節慶：${def.name}\n農曆正日：${dateInfo.lunarStr} (${formatDate(dateInfo.solarDate)})\n\n【採買與準備清單】\n`;
    
    Object.entries(targetsData).forEach(([t, items]) => {
      desc += `\n[${t}]\n`;
      items.forEach(item => {
        desc += `- ${item.name} ${item.checked ? '(已準備)' : '(未準備)'}\n`;
      });
    });

    if (note) {
      desc += `\n【備註】\n${note}\n`;
    }

    generateICS(`${def.name}拜拜`, desc, targetDate, isWeekendRange);
  };

  const isTargetActive = (t: Target) => activeTarget === t;

  return (
    <div className={clsx(
      "bg-white rounded-sm shadow-sm border overflow-hidden transition-all",
      isPast ? "border-gray-100 opacity-60 grayscale" : "border-[#A63D40]/10 hover:border-[#A63D40]/30"
    )}>
      {/* Card Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-5 flex flex-col gap-3 text-left focus:outline-none cursor-pointer"
      >
        <div className="flex justify-between items-start w-full">
          <div>
            <h2 className="text-2xl font-bold text-[#2D2926] font-serif">{def.name}</h2>
            <div className="text-xs text-gray-400 mt-2 flex items-center gap-1.5 font-sans uppercase tracking-widest">
              <Calendar className="w-3.5 h-3.5" />
              <span>正日：{formatDate(dateInfo.solarDate)} ({dateInfo.lunarStr})</span>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            {!isOpen ? <ChevronDown className="w-5 h-5 text-gray-300" /> : <ChevronUp className="w-5 h-5 text-gray-300" />}
          </div>
        </div>

        {/* Suggestion Box / Custom Date */}
        <div className="border-l-2 border-[#48594E] pl-3 py-1 my-2 w-full font-sans text-left" onClick={e => e.stopPropagation()}>
          <div className="text-[10px] text-gray-400 uppercase tracking-tighter mb-1">
            實際祭拜日 (可修改)
          </div>
          <div className="flex items-center">
            <input 
              type="date" 
              value={customDate || getLocalDateString(defaultTargetDate)} 
              onChange={(e) => onCustomDateChange(e.target.value)}
              className="text-lg font-bold text-[#48594E] bg-transparent focus:outline-none focus:border-b focus:border-[#A63D40] cursor-pointer"
            />
          </div>
        </div>
        
        {/* Days Left Badge */}
        {!isOpen && (
          <div className="flex justify-between items-center w-full mt-2">
            <span className={clsx(
              "text-[10px] font-sans font-semibold px-2.5 py-1 rounded-sm uppercase tracking-widest",
              isPast ? "bg-gray-100 text-gray-500" : 
              daysLeft === 0 ? "bg-[#A63D40]/10 text-[#A63D40]" :
              daysLeft <= 7 ? "bg-amber-100 text-amber-700" : "bg-[#48594E]/10 text-[#48594E]"
            )}>
              {isPast ? '已結束' : daysLeft === 0 ? '就是今天！' : `還有 ${daysLeft} 天`}
            </span>
            
            <button 
              onClick={(e) => { e.stopPropagation(); handleExportICS(e); }}
              className="text-[#48594E] hover:bg-[#F9F7F2] px-2 py-1.5 rounded-sm flex items-center gap-1.5 text-xs font-sans font-medium transition-colors border border-gray-200"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              加到行事曆
            </button>
          </div>
        )}
      </div>

      {/* Card Body */}
      {isOpen && (
        <div className="border-t border-[#A63D40]/10 bg-white">
          
          <div className="px-5 pt-4 flex items-center justify-between">
            <span className={clsx(
                "text-[10px] font-sans font-semibold px-2.5 py-1 rounded-sm uppercase tracking-widest",
                isPast ? "bg-gray-100 text-gray-500" : 
                daysLeft === 0 ? "bg-[#A63D40]/10 text-[#A63D40]" :
                daysLeft <= 7 ? "bg-amber-100 text-amber-700" : "bg-[#48594E]/10 text-[#48594E]"
              )}>
                {isPast ? '已結束' : daysLeft === 0 ? '就是今天！' : `還有 ${daysLeft} 天`}
            </span>
            <button 
              onClick={handleExportICS}
              className="text-white bg-[#48594E] shadow-sm hover:bg-[#3a473e] px-3 py-1.5 rounded-sm flex items-center gap-1.5 text-xs font-sans tracking-widest transition-colors"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              加到行事曆
            </button>
          </div>

          {/* Notes Field */}
          <div className="px-5 pt-4">
            <div className="text-[10px] font-sans font-bold text-[#48594E] mb-1.5 uppercase tracking-widest">備註 Memo</div>
            <textarea 
              value={note || ''}
              onChange={e => onNoteChange(e.target.value)}
              placeholder="新增備註 (例如：指定購買的店家、特殊準備事項...)"
              className="w-full bg-[#F9F7F2] border border-gray-200 rounded-sm p-3 text-sm font-sans focus:outline-none focus:border-[#A63D40] min-h-[70px] resize-y"
            />
          </div>

          {/* Tabs */}
          <div className="px-5 mt-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {def.targets.map(t => (
              <button
                key={t.target}
                onClick={() => setActiveTarget(t.target)}
                className={clsx(
                  "px-4 py-2 rounded-sm text-xs font-sans font-bold whitespace-nowrap transition-colors tracking-widest",
                  isTargetActive(t.target) 
                    ? "bg-[#A63D40] text-white" 
                    : "bg-[#F9F7F2] text-gray-500 border border-gray-200 hover:bg-gray-100"
                )}
              >
                拜{t.target}
              </button>
            ))}
          </div>

          {/* Checklist */}
          <div className="p-5 pt-3">
            <div className="bg-[#F9F7F2] rounded-sm font-sans text-sm">
              <div className="flex flex-col">
                {(targetsData[activeTarget] || []).map(item => (
                  <label 
                    key={item.id} 
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#A63D40]/5 cursor-pointer transition-colors group border-b border-[#48594E]/10 last:border-0"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => {
                        // native checkbox handling, wrapped in onToggle
                        onToggle(activeTarget, item.id);
                      }}
                      className="w-4 h-4 accent-[#A63D40] rounded-sm border-gray-300 cursor-pointer"
                    />
                    <span className={clsx(
                      "flex-grow select-none transition-all",
                      item.checked ? "text-gray-400 line-through" : "text-[#2D2926]"
                    )}>
                      {item.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        onRemove(activeTarget, item.id);
                      }}
                      className="text-gray-300 hover:text-[#A63D40] p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </label>
                ))}
              </div>

              {/* Add Item Input */}
              <div className="p-3 bg-white border-t border-[#48594E]/10 flex gap-2">
                <input
                  type="text"
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  placeholder="新增自訂供品..."
                  className="flex-grow bg-white border border-gray-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#A63D40] font-sans"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      onAdd(activeTarget, newItemName);
                      setNewItemName('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    onAdd(activeTarget, newItemName);
                    setNewItemName('');
                  }}
                  disabled={!newItemName.trim()}
                  className="bg-[#48594E] text-white px-3 py-1 rounded-sm disabled:opacity-50 hover:bg-[#3a473e] transition-colors flex items-center justify-center font-sans tracking-widest text-[10px] uppercase"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  新增
                </button>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={onReset}
                className="flex items-center gap-1.5 text-[10px] font-sans tracking-widest text-gray-400 hover:text-[#A63D40] uppercase transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                重設回預設供品
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

