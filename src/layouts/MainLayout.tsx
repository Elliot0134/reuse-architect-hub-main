
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar collapsed={sidebarCollapsed} toggleCollapse={() => setSidebarCollapsed(prev => !prev)} />
      <div className={cn(
        "flex flex-col flex-1 transition-all duration-300",
        sidebarCollapsed ? "ml-16" : "ml-0 md:ml-64"
      )}>
        <Header toggleSidebar={() => setSidebarCollapsed(prev => !prev)} />
        <main className="flex-1 p-6">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
