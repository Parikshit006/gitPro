import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Search, GitBranch, Users, ShieldAlert, Sparkles, FileText, ArrowRight, CornerDownLeft, Loader2 } from 'lucide-react';
import { useGlobalSearch } from '../hooks/useSearch';
import type { SearchEntityType, SearchResultItem } from '../lib/types';
import './CommandPalette.css';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: { label: string; value: SearchEntityType }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Repositories', value: 'REPOSITORY' },
  { label: 'Developers', value: 'DEVELOPER' },
  { label: 'Hotspots', value: 'HOTSPOT' },
  { label: 'Insights', value: 'INSIGHT' },
];

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchEntityType>('ALL');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data, isLoading } = useGlobalSearch(query, category, 1, 15);
  const results = data?.results || [];

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Parent handles opening usually, but if inside dialog handle close
        }
      }
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (results.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (results.length || 1)) % (results.length || 1));
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  const handleSelect = (item?: SearchResultItem) => {
    if (!item) return;
    onClose();
    if (item.type === 'REPOSITORY') {
      navigate(`/repositories/${item.id}`);
    } else if (item.type === 'DEVELOPER') {
      navigate(`/search?q=${encodeURIComponent(item.title)}&type=DEVELOPER`);
    } else if (item.type === 'HOTSPOT') {
      navigate(`/repositories/${item.metadata?.repositoryId || ''}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(item.title)}`);
    }
  };

  if (!isOpen) return null;

  const getIcon = (type: SearchEntityType) => {
    switch (type) {
      case 'REPOSITORY': return <GitBranch className="w-4 h-4 text-[var(--healthy)]" />;
      case 'DEVELOPER': return <Users className="w-4 h-4 text-[#38bdf8]" />;
      case 'HOTSPOT': return <ShieldAlert className="w-4 h-4 text-[var(--risk)]" />;
      case 'INSIGHT': return <Sparkles className="w-4 h-4 text-[#a855f7]" />;
      default: return <FileText className="w-4 h-4 text-muted" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col command-palette-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <Search className="w-5 h-5 text-muted mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search repositories, developers, files, hotspots... (Ctrl + K)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent border-none font-body text-base text-[var(--text)] placeholder:text-muted focus:outline-none"
          />
          {isLoading && <Loader2 className="w-4 h-4 text-muted animate-spin ml-2" />}
          <kbd className="hidden sm:inline-block font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-[var(--bg)] text-muted border border-[var(--border-subtle)] ml-2 shrink-0">
            ESC
          </kbd>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg)] overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => {
                setCategory(cat.value);
                setSelectedIndex(0);
              }}
              className={`text-xs font-medium px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                category === cat.value
                  ? 'bg-[var(--text)] text-[var(--bg)] font-semibold'
                  : 'text-muted hover:text-[var(--text)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 flex flex-col gap-1 divide-y divide-[var(--border-subtle)]">
          {results.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center text-muted">
              <Search className="w-8 h-8 text-muted/30 mb-2" />
              <span className="text-sm font-medium">No results found for &ldquo;{query}&rdquo;</span>
              <span className="text-xs text-muted/60 mt-0.5">Try searching for a developer email, repository name, or file path.</span>
            </div>
          ) : (
            results.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected ? 'bg-[var(--bg-hover)] border border-[rgba(255,255,255,0.1)]' : 'border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-[var(--bg)] border border-[var(--border-subtle)] shrink-0">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-[var(--text)] truncate">{item.title}</span>
                      <span className="text-xs text-muted font-mono truncate">{item.subtitle}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {item.badge && (
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[var(--bg)] text-muted border border-[var(--border-subtle)] uppercase">
                        {item.badge}
                      </span>
                    )}
                    {isSelected ? (
                      <CornerDownLeft className="w-4 h-4 text-[var(--healthy)]" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-muted/40" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[var(--border-subtle)] bg-[var(--bg)] flex items-center justify-between text-[11px] text-muted font-mono">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border)]">↑↓</kbd> to navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border)]">ENTER</kbd> to select</span>
          </div>
          <span>GitPro Intelligence Engine</span>
        </div>
      </div>
    </div>
  );
}
