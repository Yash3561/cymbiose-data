'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  totalEntries: number;
  totalChunks: number;
  sourceTypes: { type: string; count: number }[];
  ragStatuses: { status: string; count: number }[];
  tagCoverage: { withModality: number; withCultural: number; total: number };
  recentEntries: {
    id: string;
    kbId: string;
    title: string;
    sourceType: string;
    ragInclusionStatus: string;
    dateAdded: string;
  }[];
}

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
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-semibold text-amber-800">Database Not Connected</h3>
          <p className="text-sm text-amber-600 mt-1">
            Run <code className="bg-amber-100 px-1 rounded">npx prisma db push</code> to set up the database.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">KB Builder Dashboard</h1>
        <p className="text-slate-500 mt-1">Cymbiose Knowledge Base Data Acquisition</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Entries"
          value={stats?.totalEntries || 0}
          icon="📚"
          color="teal"
        />
        <StatCard
          title="Total Chunks"
          value={stats?.totalChunks || 0}
          icon="📄"
          color="blue"
        />
        <StatCard
          title="Approved for RAG"
          value={stats?.ragStatuses.find(r => r.status === 'APPROVED')?.count || 0}
          icon="✅"
          color="green"
        />
        <StatCard
          title="Pending Review"
          value={stats?.ragStatuses.find(r => r.status === 'PENDING')?.count || 0}
          icon="⏳"
          color="amber"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Source Type Breakdown */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Source Types</h3>
          <div className="space-y-2">
            {stats?.sourceTypes.map(s => (
              <div key={s.type} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{s.type}</span>
                <span className="text-sm font-semibold text-slate-800">{s.count}</span>
              </div>
            ))}
            {(!stats?.sourceTypes || stats.sourceTypes.length === 0) && (
              <p className="text-sm text-slate-400">No entries yet</p>
            )}
          </div>
        </div>

        {/* Tag Coverage */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Tag Coverage</h3>
          <div className="space-y-3">
            <ProgressBar
              label="Modality Tags"
              value={stats?.tagCoverage.withModality || 0}
              total={stats?.tagCoverage.total || 1}
            />
            <ProgressBar
              label="Cultural Tags"
              value={stats?.tagCoverage.withCultural || 0}
              total={stats?.tagCoverage.total || 1}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link
              href="/add-entry"
              className="block w-full px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 text-center"
            >
              ➕ Add New Entry
            </Link>
            <Link
              href="/scraper"
              className="block w-full px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 text-center"
            >
              🌐 Scrape URL
            </Link>
            <Link
              href="/export"
              className="block w-full px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 text-center"
            >
              📤 Export KB
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Entries */}
      <div className="mt-8 bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-700 mb-4">Recent Entries</h3>
        {stats?.recentEntries && stats.recentEntries.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="pb-2 font-medium">KB ID</th>
                <th className="pb-2 font-medium">Title</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Added</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentEntries.map(entry => (
                <tr key={entry.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 font-mono text-xs">{entry.kbId}</td>
                  <td className="py-2 max-w-[200px] truncate">{entry.title}</td>
                  <td className="py-2">{entry.sourceType}</td>
                  <td className="py-2">
                    <StatusBadge status={entry.ragInclusionStatus} />
                  </td>
                  <td className="py-2 text-slate-400">
                    {new Date(entry.dateAdded).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-slate-400">No entries yet. Add your first entry to get started!</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
  const colorClasses: Record<string, string> = {
    teal: 'bg-teal-50 border-teal-100',
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-green-50 border-green-100',
    amber: 'bg-amber-50 border-amber-100'
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          <p className="text-xs text-slate-500">{title}</p>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, total }: { label: string; value: number; total: number }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-500">{value}/{total}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal-500 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-green-100 text-green-700',
    EXCLUDED: 'bg-slate-100 text-slate-600',
    REVIEW_NEEDED: 'bg-red-100 text-red-700'
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || styles.PENDING}`}>
      {status}
    </span>
  );
}
