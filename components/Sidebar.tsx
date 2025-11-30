'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Jobs', href: '/jobs', icon: '💼' },
  { name: 'Contacts', href: '/contacts', icon: '👥' },
  { name: 'Tasks', href: '/tasks', icon: '✓' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`relative bg-white shadow-lg transition-all duration-300 ease-in-out flex flex-col ${
        isExpanded ? 'w-64' : 'w-20'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Header */}
      <div className="flex-shrink-0">
        <div className={`p-6 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 h-0'}`}>
          {isExpanded && (
            <>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">GoodJob</h1>
              <p className="text-xs text-slate-500 mt-1">Job Search CRM</p>
            </>
          )}
        </div>
        {!isExpanded && (
          <div className="flex items-center justify-center py-6">
            <div className="text-2xl">💼</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-6 flex-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-all duration-300 group ${
                isActive
                  ? 'bg-gradient-to-r from-blue-50 to-transparent text-blue-600 border-r-4 border-blue-600'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
              title={!isExpanded ? item.name : ''}
            >
              <span className={`text-lg transition-all duration-300 ${
                isExpanded ? 'mr-3' : 'mx-auto'
              }`}>
                {item.icon}
              </span>
              <span className={`transition-all duration-300 whitespace-nowrap ${
                isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
              }`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
