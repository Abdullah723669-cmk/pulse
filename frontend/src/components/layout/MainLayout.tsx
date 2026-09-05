import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { RightBar } from './RightBar';
import { MobileHeader } from './MobileHeader';
import { MobileNav } from './MobileNav';

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const isChat = location.pathname.startsWith('/chat');

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col md:flex-row justify-center">
      {/* Mobile Top Header */}
      <MobileHeader />

      <div className="w-full max-w-7xl flex flex-1 min-w-0">
        {/* Left Navigation Sidebar (Desktop) */}
        <Sidebar />

        {/* Center Main Content Flow */}
        <main
          className={`flex-1 min-w-0 min-h-screen border-r border-slate-800/80 ${
            isChat ? 'pb-0' : 'pb-16 md:pb-0'
          }`}
        >
          <Outlet />
        </main>

        {/* Right Widget Sidebar */}
        <RightBar />
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav />
    </div>
  );
};

