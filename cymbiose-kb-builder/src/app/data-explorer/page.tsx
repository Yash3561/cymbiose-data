'use client';

import { useState, useEffect } from 'react';

interface TableColumn {
    key: string;
    label: string;
    type: 'string' | 'number' | 'date' | 'json' | 'boolean';
}

interface TableData {
    columns: TableColumn[];
    rows: Record<string, unknown>[];
    totalCount: number;
}

// Icon Components
const TableIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
        <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
);

const ChevronIcon = ({ direction }: { direction: 'left' | 'right' }) => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {direction === 'left' ? (
            <polyline points="15 18 9 12 15 6" />
        ) : (
            <polyline points="9 18 15 12 9 6" />
        )}
    </svg>
);

const RefreshIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
);

const TABLES = [
    { id: 'entries', name: 'KB Entries', endpoint: '/api/data-explorer/entries' },
    { id: 'chunks', name: 'KB Chunks', endpoint: '/api/data-explorer/chunks' },
];

export default function DataExplorerPage() {
    const [selectedTable, setSelectedTable] = useState('entries');
    const [data, setData] = useState<TableData | null>(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(25);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        fetchData();
    }, [selectedTable, page, sortColumn, sortDirection]);

    async function fetchData() {
        setLoading(true);
        try {
            const table = TABLES.find(t => t.id === selectedTable);
            if (!table) return;

            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize.toString(),
            });
            if (sortColumn) {
                params.set('sortBy', sortColumn);
                params.set('sortDir', sortDirection);
            }

            const res = await fetch(`${table.endpoint}?${params}`);
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    }

    function handleSort(column: string) {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
        setPage(1);
    }

    function formatValue(value: unknown, type: string): string {
        if (value === null || value === undefined) return '—';
        if (type === 'date' && typeof value === 'string') {
            return new Date(value).toLocaleString();
        }
        if (type === 'json' || typeof value === 'object') {
            return JSON.stringify(value);
        }
        if (type === 'boolean') {
            return value ? '✓' : '✗';
        }
        return String(value);
    }

    const totalPages = data ? Math.ceil(data.totalCount / pageSize) : 0;

    return (
        <div className="p-8 fade-in">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Data Explorer</h1>
                    <p className="text-slate-400 mt-1">Browse raw database tables</p>
                </div>
                <button
                    onClick={() => fetchData()}
                    disabled={loading}
                    className="btn-secondary"
                >
                    <RefreshIcon />
                    Refresh
                </button>
            </div>

            {/* Table Selector */}
            <div className="flex gap-2 mb-6">
                {TABLES.map(table => (
                    <button
                        key={table.id}
                        onClick={() => { setSelectedTable(table.id); setPage(1); }}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${selectedTable === table.id
                                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50'
                                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                            }`}
                    >
                        <TableIcon />
                        {table.name}
                    </button>
                ))}
            </div>

            {/* Data Grid */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="skeleton h-8 w-48 mx-auto mb-4"></div>
                        <div className="skeleton h-4 w-32 mx-auto"></div>
                    </div>
                ) : data && data.rows.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-800/80 border-b border-slate-700 sticky top-0">
                                <tr>
                                    {data.columns.map(col => (
                                        <th
                                            key={col.key}
                                            onClick={() => handleSort(col.key)}
                                            className="px-4 py-3 text-left text-slate-400 font-medium cursor-pointer hover:text-slate-200 transition-colors whitespace-nowrap"
                                        >
                                            <div className="flex items-center gap-1">
                                                {col.label}
                                                {sortColumn === col.key && (
                                                    <span className="text-teal-400">
                                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-slate-600">{col.type}</span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.rows.map((row, i) => (
                                    <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                                        {data.columns.map(col => (
                                            <td
                                                key={col.key}
                                                className="px-4 py-3 text-slate-300 max-w-xs truncate"
                                                title={formatValue(row[col.key], col.type)}
                                            >
                                                {formatValue(row[col.key], col.type)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center text-slate-500">
                        No data found
                    </div>
                )}
            </div>

            {/* Pagination */}
            {data && data.totalCount > 0 && (
                <div className="flex justify-between items-center mt-4">
                    <span className="text-sm text-slate-500">
                        Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, data.totalCount)} of {data.totalCount} rows
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-50"
                        >
                            <ChevronIcon direction="left" />
                        </button>
                        <span className="px-4 py-1.5 bg-slate-800 rounded-lg text-sm text-slate-300">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-50"
                        >
                            <ChevronIcon direction="right" />
                        </button>
                    </div>
                </div>
            )}

            {/* Info Box */}
            <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-400">
                    <strong className="text-slate-200">Tip:</strong> Click column headers to sort.
                    This is a read-only view of your database tables.
                </p>
            </div>
        </div>
    );
}
