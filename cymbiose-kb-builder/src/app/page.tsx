'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  totalEntries: number;
  totalChunks: number;
  sourceTypes: { type: string; count: number }[];
  ragStatuses: { status: string; count: number }[];
  tagCoverage: { withModality: number; withCultural: number; total: number };
  qualityStats?: {
    distribution: { score: number | null; count: number }[];
    average: number;
  };
  recentEntries: {
    id: string;
    kbId: string;
    title: string;
    sourceType: string;
    ragInclusionStatus: string;
    dateAdded: string;
  }[];
}

// Icon Components
const EntriesIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
    <path d="M7 7h10M7 12h10M7 17h6" />
  </svg>
);

const ChunksIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const ApprovedIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const PendingIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const ExportIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="space-y-6">
          <div className="skeleton h-8 w-48"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton h-28 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton h-48 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="card p-6 border-amber-200 bg-amber-50">
          <h3 className="font-semibold text-amber-800">Database Connection Required</h3>
          <p className="text-sm text-amber-600 mt-2">
            Run <code className="bg-amber-100 px-2 py-1 rounded text-xs font-mono">npx prisma db push</code> to initialize the database.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-100">Dashboard</h1>
        <p className="text-slate-400 mt-1">Clinical Knowledge Base Overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Entries"
          value={stats?.totalEntries || 0}
          icon={<EntriesIcon />}
          color="teal"
        />
        <StatCard
          title="Total Chunks"
          value={stats?.totalChunks || 0}
          icon={<ChunksIcon />}
          color="indigo"
        />
        <StatCard
          title="Approved"
          value={stats?.ragStatuses.find(r => r.status === 'APPROVED')?.count || 0}
          icon={<ApprovedIcon />}
          color="emerald"
        />
        <StatCard
          title="Pending"
          value={stats?.ragStatuses.find(r => r.status === 'PENDING')?.count || 0}
          icon={<PendingIcon />}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Source Type Breakdown */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-200 mb-4">Source Types</h3>
          <div className="space-y-3">
            {stats?.sourceTypes.map(s => (
              <div key={s.type} className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{formatSourceType(s.type)}</span>
                <span className="text-sm font-semibold text-slate-200">{s.count}</span>
              </div>
            ))}
            {(!stats?.sourceTypes || stats.sourceTypes.length === 0) && (
              <p className="text-sm text-slate-500">No entries yet</p>
            )}
          </div>
        </div>

        {/* Tag Coverage */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-200 mb-4">Tag Coverage</h3>
          <div className="space-y-4">
            <ProgressBar
              label="Modality Tags"
              value={stats?.tagCoverage.withModality || 0}
              total={stats?.tagCoverage.total || 1}
              color="teal"
            />
            <ProgressBar
              label="Cultural Tags"
              value={stats?.tagCoverage.withCultural || 0}
              total={stats?.tagCoverage.total || 1}
              color="amber"
            />
          </div>
        </div>

        {/* Quality Distribution */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-200 mb-4">Quality Distribution</h3>
          {stats?.qualityStats?.distribution && stats.qualityStats.distribution.length > 0 ? (
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(score => {
                const item = stats.qualityStats?.distribution.find(d => d.score === score);
                const count = item?.count || 0;
                const maxCount = Math.max(...stats.qualityStats!.distribution.map(d => d.count), 1);
                const width = (count / maxCount) * 100;
                return (
                  <div key={score} className="flex items-center gap-2">
                    <span className="text-amber-400 text-sm w-20">{'★'.repeat(score)}</span>
                    <div className="flex-1 bg-slate-700 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-400 w-8 text-right">{count}</span>
                  </div>
                );
              })}
              <div className="mt-4 pt-3 border-t border-slate-700">
                <span className="text-sm text-slate-400">Average: </span>
                <span className="text-amber-400 font-semibold">{stats.qualityStats.average.toFixed(1)} ★</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No quality scores yet</p>
          )}
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="mt-6 card p-6">
        <h3 className="font-semibold text-slate-200 mb-4">Quick Actions</h3>
        <div className="flex gap-3">
          <Link href="/add-entry" className="btn-primary">
            <PlusIcon />
            Add New Entry
          </Link>
          <Link href="/scraper" className="btn-secondary">
            <GlobeIcon />
            Scrape URL
          </Link>
          <Link href="/batch-import" className="btn-secondary">
            <PlusIcon />
            Batch Import
          </Link>
          <Link href="/export" className="btn-secondary">
            <ExportIcon />
            Export KB
          </Link>
        </div>
      </div>

      {/* Recent Entries */}
      <div className="mt-8 card p-6">
        <h3 className="font-semibold text-slate-200 mb-4">Recent Entries</h3>
        {stats?.recentEntries && stats.recentEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-700">
                  <th className="pb-3 font-medium">KB ID</th>
                  <th className="pb-3 font-medium">Title</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Added</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentEntries.map(entry => (
                  <tr key={entry.id} className="table-row">
                    <td className="py-3 font-mono text-xs text-slate-500">{entry.kbId}</td>
                    <td className="py-3 max-w-[200px] truncate font-medium text-slate-200">{entry.title}</td>
                    <td className="py-3 text-slate-400">{formatSourceType(entry.sourceType)}</td>
                    <td className="py-3">
                      <StatusBadge status={entry.ragInclusionStatus} />
                    </td>
                    <td className="py-3 text-slate-400">
                      {new Date(entry.dateAdded).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400">No entries yet. Add your first entry to get started.</p>
        )}
      </div>
    </div>
  );
}

function formatSourceType(type: string): string {
  const labels: Record<string, string> = {
    RESEARCH: 'Research',
    CLINICAL_GUIDELINE: 'Clinical Guideline',
    BLOG: 'Blog',
    BOOK: 'Book',
    VIDEO_TRANSCRIPT: 'Video',
    WORKSHEET: 'Worksheet',
    OTHER: 'Other'
  };
  return labels[type] || type;
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  const colorClasses: Record<string, { bg: string; icon: string }> = {
    teal: { bg: 'bg-teal-50', icon: 'text-teal-600' },
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600' }
  };

  const styles = colorClasses[color] || colorClasses.teal;

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-value">{value}</p>
          <p className="stat-label">{title}</p>
        </div>
        <div className={`p-2 rounded-lg ${styles.bg}`}>
          <span className={styles.icon}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  const barColor = color === 'amber' ? 'bg-amber-500' : 'bg-teal-500';

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-900 font-medium">{percentage}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-slate-400 mt-1">{value} of {total} entries</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'badge-warning',
    APPROVED: 'badge-success',
    EXCLUDED: 'bg-slate-100 text-slate-600',
    REVIEW_NEEDED: 'badge-error'
  };

  const labels: Record<string, string> = {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    EXCLUDED: 'Excluded',
    REVIEW_NEEDED: 'Review'
  };

  return (
    <span className={`badge ${styles[status] || styles.PENDING}`}>
      {labels[status] || status}
    </span>
  );
}
