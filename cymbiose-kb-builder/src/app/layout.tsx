'use client';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, createContext, useContext } from 'react';
import { OnboardingTour } from '@/components/OnboardingTour';

const inter = Inter({ subsets: ['latin'] });

// Sidebar Context
const SidebarContext = createContext({ collapsed: false, toggle: () => { } });

// SVG Icon Components
const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

const CatalogIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <line x1="8" y1="7" x2="16" y2="7" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const ScraperIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const AddIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const ExportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const ChevronIcon = ({ direction }: { direction: 'left' | 'right' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    {direction === 'left' ? (
      <polyline points="15 18 9 12 15 6" />
    ) : (
      <polyline points="9 18 15 12 9 6" />
    )}
  </svg>
);

const BatchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const SeedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const DataExplorerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </svg>
);

const CrawlerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

const navItems = [
  { href: '/', icon: <DashboardIcon />, label: 'Dashboard', tourId: 'dashboard' },
  { href: '/catalog', icon: <CatalogIcon />, label: 'KB Catalog', tourId: 'catalog' },
  { href: '/data-explorer', icon: <DataExplorerIcon />, label: 'Data Explorer', tourId: 'data-explorer' },
  { href: '/crawler-dashboard', icon: <CrawlerIcon />, label: 'Auto-Crawler', tourId: 'crawler' },
  { href: '/scraper', icon: <ScraperIcon />, label: 'URL Scraper', tourId: 'scraper' },
  { href: '/batch-import', icon: <BatchIcon />, label: 'Batch Import', tourId: 'batch-import' },
  { href: '/seed-urls', icon: <SeedIcon />, label: 'Seed URLs', tourId: 'seed-urls' },
  { href: '/add-entry', icon: <AddIcon />, label: 'Add Entry', tourId: 'add-entry' },
  { href: '/export', icon: <ExportIcon />, label: 'Export', tourId: 'export' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <html lang="en">
      <body className={inter.className}>
        <SidebarContext.Provider value={{ collapsed, toggle: () => setCollapsed(!collapsed) }}>
          <div className="min-h-screen flex bg-[#0f172a]">
            {/* Collapsible Sidebar */}
            <nav
              data-tour="sidebar"
              className={`sidebar relative flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}
            >
              {/* Toggle Button */}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="sidebar-toggle"
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <ChevronIcon direction={collapsed ? 'right' : 'left'} />
              </button>

              {/* Logo */}
              <div className={`p-5 border-b border-white/10 ${collapsed ? 'px-3' : ''}`}>
                <h1 className={`text-lg font-semibold text-white tracking-tight ${collapsed ? 'hidden' : ''}`}>
                  Cymbiose KB
                </h1>
                <h1 className={`text-lg font-semibold text-white ${collapsed ? 'text-center' : 'hidden'}`}>
                  C
                </h1>
                <p className={`text-xs text-slate-400 mt-1 ${collapsed ? 'hidden' : ''}`}>
                  Clinical Knowledge Builder
                </p>
              </div>

              {/* Navigation */}
              <div className="flex-1 py-6 px-3 space-y-1">
                {navItems.map(item => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    collapsed={collapsed}
                    tourId={item.tourId}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>

              {/* Footer */}
              <div className={`p-4 border-t border-white/10 ${collapsed ? 'px-2' : ''}`}>
                <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className={`text-xs text-slate-400 ${collapsed ? 'hidden' : ''}`}>
                    Database Connected
                  </span>
                </div>
                <p className={`text-xs text-slate-500 mt-2 ${collapsed ? 'hidden' : ''}`}>v1.0.0</p>
              </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>

          {/* Onboarding Tour */}
          <OnboardingTour />
        </SidebarContext.Provider>
      </body>
    </html>
  );
}

function NavLink({
  href,
  icon,
  children,
  collapsed,
  tourId
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  collapsed: boolean;
  tourId: string;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <Link
      href={href}
      data-tour={tourId}
      className={`sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
      title={collapsed ? String(children) : undefined}
    >
      {icon}
      <span className={collapsed ? 'hidden' : ''}>{children}</span>
    </Link>
  );
}
