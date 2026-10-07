'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Wrench, 
  AlertTriangle, 
  ClipboardList, 
  BookOpen, 
  History, 
  Settings as SettingsIcon, 
  LogOut, 
  Bell,
  Scale
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SessionUser } from '@/lib/auth';

interface LayoutProps {
  children: ReactNode;
  user: SessionUser | null;
}

export default function MainLayout({ children, user }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'TECHNICIAN', 'VIEWER'] },
    { name: 'Equipment', href: '/equipment', icon: Wrench, roles: ['ADMIN', 'TECHNICIAN', 'VIEWER'] },
    { name: 'Issues', href: '/issues', icon: AlertTriangle, roles: ['ADMIN', 'TECHNICIAN', 'VIEWER'] },
    { name: 'Work Orders', href: '/work-orders', icon: ClipboardList, roles: ['ADMIN', 'TECHNICIAN'] },
    { name: 'Maintenance History', href: '/history', icon: History, roles: ['ADMIN', 'TECHNICIAN', 'VIEWER'] },
    { name: 'Knowledge Base', href: '/knowledge', icon: BookOpen, roles: ['ADMIN'] },
    { name: 'Rules', href: '/rules', icon: Scale, roles: ['ADMIN'] },
    { name: 'Settings', href: '/settings', icon: SettingsIcon, roles: ['ADMIN'] },
  ].filter(item => user?.role && item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0f1e35] text-slate-300 flex flex-col shrink-0 transition-all duration-300">
        <div className="h-16 flex items-center px-6 bg-[#0a1424] border-b border-white/5">
          <Wrench className="w-6 h-6 text-orange-500 mr-3" />
          <span className="text-white font-bold text-lg tracking-tight">MAINTAIN<span className="text-orange-500">AI</span></span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative',
                  isActive 
                    ? 'bg-orange-600/10 text-orange-500' 
                    : 'hover:bg-white/5 hover:text-white'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-orange-500 rounded-r-full" />
                )}
                <item.icon className={cn('w-5 h-5 mr-3 flex-shrink-0', isActive ? 'text-orange-500' : 'text-slate-400 group-hover:text-slate-300')} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 bg-[#0a1424] border-t border-white/5">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user?.role?.toLowerCase() || 'Role'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-400 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
          <div className="flex-1 max-w-2xl flex items-center">
            {/* Global Search Placeholder */}
            <div className="relative w-full max-w-md">
              <input 
                type="text" 
                placeholder="Search equipment, issues, work orders..." 
                className="w-full bg-slate-100 border-none rounded-lg pl-4 pr-10 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <kbd className="hidden sm:inline-block border border-slate-300 rounded px-1.5 text-xs text-slate-500 bg-white">⌘K</kbd>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#f8f9fc] p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
