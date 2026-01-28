'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  FolderKanban,
  Calculator,
  ArrowRightLeft,
  FileText,
  Settings,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Conversations', href: '/conversations', icon: MessageSquare },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Estimates', href: '/estimates', icon: Calculator },
  { name: 'Handoffs', href: '/handoffs', icon: ArrowRightLeft },
  { name: 'Cash Visualizer', href: '/tools/cash-visualizer', icon: TrendingUp },
  { name: 'Sales Report', href: '/sales-report/import', icon: FileSpreadsheet },
  { name: 'Print Forms', href: '/print', icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 flex-col justify-center border-b border-gray-800 px-4">
        <img
          src="/kartel-logo.png"
          alt="Kartel"
          className="h-5 w-auto"
        />
        <span className="text-xs font-medium tracking-wider text-gray-400 mt-1">SALES PROD</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }
              `}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-800 p-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
        <div className="mt-4 text-xs text-gray-500">
          Kartel AI &copy; 2026
        </div>
      </div>
    </div>
  );
}
