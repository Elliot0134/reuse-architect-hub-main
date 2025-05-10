
import React from 'react';
import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(segment => segment !== '');
  
  // Map path segments to human-readable names
  const pathNames: Record<string, string> = {
    '': 'Projets',
    'generate-content': 'Générer du contenu',
    'templates': 'Templates rapports',
    'chat-reports': 'Discuter avec les rapports',
  };
  
  return (
    <header className="h-16 bg-white border-b border-neutral-200 px-6 flex items-center justify-between">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="mr-4 md:hidden p-2 rounded-md hover:bg-neutral-100 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <div className="breadcrumb">
          {pathSegments.length === 0 ? (
            <span>Projets</span>
          ) : (
            <>
              <a href="/" className="hover:text-primary">Projets</a>
              <span>/</span>
              {pathSegments.map((segment, index) => {
                const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
                const isLast = index === pathSegments.length - 1;
                
                return (
                  <span key={path}>
                    {isLast ? (
                      <span className={cn(isLast && 'font-medium text-neutral-800')}>
                        {pathNames[segment] || segment}
                      </span>
                    ) : (
                      <>
                        <a href={path} className="hover:text-primary">
                          {pathNames[segment] || segment}
                        </a>
                        <span>/</span>
                      </>
                    )}
                  </span>
                );
              })}
            </>
          )}
        </div>
      </div>
      
      {/* User info removed from here */}
    </header>
  );
};

export default Header;
