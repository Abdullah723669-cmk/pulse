import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { RightBar } from './RightBar';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex justify-center">
      <div className="w-full max-w-7xl flex">
        {/* Left Navigation Sidebar */}
        <Sidebar />

        {/* Center Main Content Flow */}
        <main className="flex-1 min-w-0 min-h-screen border-r border-slate-800/80">
          <Outlet />
        </main>

        {/* Right Widget Sidebar */}
        <RightBar />
      </div>
    </div>
  );
};
