import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Search, GitBranch, Users, ShieldAlert, Sparkles, FileText, ArrowRight, Filter, ArrowUpDown, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { useGlobalSearch } from '../hooks/useSearch';
import type { SearchEntityType, SortDirection, SearchResultItem } from '../lib/types';
import './SearchPage.css';

const CATEGORIES: { label: string; value: SearchEntityType }[] = [
  { label: 'All Categories', value: 'ALL' },
  { label: 'Repositories', value: 'REPOSITORY' },
  { label: 'Developers', value: 'DEVELOPER' },
  { label: 'Hotspots', value: 'HOTSPOT' },
  { label: 'Insights', value: 'INSIGHT' },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialQuery = searchParams.get('q') || '';
  const initialType = (searchParams.get('type') as SearchEntityType) || 'ALL';

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<SearchEntityType>(initialType);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortDirection>('desc');

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const t = (searchParams.get('type') as SearchEntityType) || 'ALL';
    setQuery(q);
    setCategory(t);
  }, [searchParams]);

  const { data, isLoading } = useGlobalSearch(query, category, page, 15, sortBy, sortOrder);
  const results = data?.results || [];
  const pagination = data?.pagination;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchParams({ q: query, type: category });
  };

  const handleSelect = (item: SearchResultItem) => {
    if (item.type === 'REPOSITORY') {
      navigate(`/repositories/${item.id}`);
    } else if (item.type === 'DEVELOPER') {
      setQuery(item.title);
      setCategory('DEVELOPER');
    } else if (item.type === 'HOTSPOT') {
      navigate(`/repositories/${item.metadata?.repositoryId || ''}`);
    } else {
      // Do nothing or navigate
    }
  };

  const getIcon = (type: SearchEntityType) => {
    switch (type) {
      case 'REPOSITORY': return <GitBranch className="w-5 h-5 text-[var(--healthy)]" />;
      case 'DEVELOPER': return <Users className="w-5 h-5 text-[#38bdf8]" />;
      case 'HOTSPOT': return <ShieldAlert className="w-5 h-5 text-[var(--risk)]" />;
      case 'INSIGHT': return <Sparkles className="w-5 h-5 text-[#a855f7]" />;
      default: return <FileText className="w-5 h-5 text-muted" />;
    }
  };

  return (
    <div className="search-page flex flex-col min-h-[calc(100vh-65px)] bg-[var(--bg)] font-body">
      
      {/* Top Header */}
      <div className="px-6 py-8 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="font-display font-bold text-2xl md:text-3xl text-[var(--text)]">Global Intelligence Search</h1>
            <p className="text-sm text-muted">Search across tracked repositories, author domains, file hotspots, and AI reports.</p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center bg-[var(--bg)] border border-[var(--border)] rounded-2xl px-4 py-2 focus-within:border-[var(--healthy)] transition-colors shadow-inner">
              <Search className="w-5 h-5 text-muted mr-3 shrink-0" />
              <input
                type="text"
                placeholder="Search by repository name, developer email, file path..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent border-none font-body text-base text-[var(--text)] placeholder:text-muted focus:outline-none"
              />
              {query && (
                <button type="button" onClick={() => { setQuery(''); setPage(1); }} className="text-xs text-muted hover:text-[var(--text)] ml-2">
                  Clear
                </button>
              )}
            </div>
            <Button type="submit" variant="primary" size="lg" className="rounded-2xl px-8 justify-center">
              Search
            </Button>
          </form>

          {/* Filters & Sorting Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-4 pt-2 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-muted flex items-center gap-1 mr-2"><Filter className="w-3.5 h-3.5" /> Category:</span>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => {
                    setCategory(cat.value);
                    setPage(1);
                    setSearchParams({ q: query, type: cat.value });
                  }}
                  className={`text-xs font-medium px-3 py-1.5 rounded-xl transition-all ${
                    category === cat.value
                      ? 'bg-[var(--text)] text-[var(--bg)] font-semibold shadow-sm'
                      : 'bg-[var(--bg)] text-muted hover:text-[var(--text)] border border-[var(--border-subtle)]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-muted flex items-center gap-1"><ArrowUpDown className="w-3.5 h-3.5" /> Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="bg-[var(--bg)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1 text-[var(--text)] focus:outline-none cursor-pointer"
              >
                <option value="updatedAt">Recently Updated</option>
                <option value="name">Title (Alphabetical)</option>
                <option value="score">Risk Score / Relevance</option>
              </select>
              <button
                onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                className="p-1 rounded-lg bg-[var(--bg)] border border-[var(--border-subtle)] text-muted hover:text-[var(--text)] uppercase font-mono text-[10px]"
              >
                {sortOrder}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Results Area */}
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full flex flex-col gap-6">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-muted gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--healthy)]" />
            <span className="text-sm font-medium">Querying unified engineering index...</span>
          </div>
        ) : results.length === 0 ? (
          <Card className="py-20 text-center flex flex-col items-center justify-center text-muted border-dashed">
            <Search className="w-10 h-10 text-muted/30 mb-3" />
            <h3 className="font-display text-lg font-semibold text-[var(--text)] mb-1">No intelligence results matched</h3>
            <p className="text-xs text-muted max-w-md">
              We couldn&apos;t find anything matching &ldquo;{query}&rdquo; in category &ldquo;{category}&rdquo;. Try broadening your search or verifying your spelling.
            </p>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs font-mono text-muted">
              <span>Showing {results.length} of {pagination?.totalItems || 0} results</span>
              <span>Execution: {data?.executionTimeMs || 12}ms</span>
            </div>

            <div className="flex flex-col gap-3">
              {results.map((item) => (
                <Card
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="p-4 hover:border-[var(--healthy)] transition-all cursor-pointer flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border-subtle)] shrink-0 group-hover:scale-105 transition-transform">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex flex-col min-w-0 gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-semibold text-base text-[var(--text)] group-hover:text-[var(--healthy)] transition-colors truncate">
                          {item.title}
                        </span>
                        {item.badge && (
                          <Badge variant={item.badge.toLowerCase().includes('critical') ? 'critical' : 'neutral'}>
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted font-mono truncate">{item.subtitle}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono text-muted/60 hidden sm:inline-block">View Details</span>
                    <ArrowRight className="w-5 h-5 text-muted/40 group-hover:text-[var(--healthy)] group-hover:translate-x-1 transition-all" />
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-[var(--border-subtle)]">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPreviousPage}
                >
                  Previous
                </Button>
                <span className="text-xs font-mono text-muted">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
