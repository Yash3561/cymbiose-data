import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Cymbiose KB Builder',
  description: 'Knowledge Base Builder & Data Acquisition Dashboard for Cymbiose RAG',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex">
          {/* Sidebar Navigation */}
          <nav className="w-64 bg-[#1e3a5f] text-white flex flex-col">
            <div className="p-4 border-b border-white/10">
              <h1 className="text-lg font-bold">Cymbiose KB Builder</h1>
              <p className="text-xs text-white/60 mt-1">Data Acquisition System</p>
            </div>

            <div className="flex-1 py-4">
              <NavLink href="/" icon="📊">Dashboard</NavLink>
              <NavLink href="/catalog" icon="📚">KB Catalog</NavLink>
              <NavLink href="/scraper" icon="🌐">URL Scraper</NavLink>
              <NavLink href="/add-entry" icon="➕">Add Entry</NavLink>
              <NavLink href="/export" icon="📤">Export KB</NavLink>
            </div>

            <div className="p-4 border-t border-white/10 text-xs text-white/40">
              <p>Version 1.0.0</p>
              <p>PostgreSQL Connected</p>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-slate-50">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

function NavLink({ href, icon, children }: { href: string; icon: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
    >
      <span>{icon}</span>
      {children}
    </Link>
  );
}
