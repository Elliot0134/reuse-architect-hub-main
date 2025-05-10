
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Folder, 
  FileText, 
  Book, 
  MessageSquare, 
  Menu, 
  X,
  User,
  ChevronDown,
  Archive,
  SpellCheck2,
  LogOut,
  LayoutDashboard // Ajout de l'icône pour le Dashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarProps {
  collapsed: boolean;
  toggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, toggleCollapse }) => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> }, // Ajout du lien Dashboard
    { path: '/', label: 'Projets', icon: <Folder className="h-5 w-5" /> },
    { path: '/generate-content', label: 'Générer du contenu', icon: <FileText className="h-5 w-5" /> },
    { path: '/templates', label: 'Templates rapports', icon: <Book className="h-5 w-5" /> },
    { path: '/reports', label: 'Rapports', icon: <Archive className="h-5 w-5" /> }, // Ajout du lien Rapports
    { path: '/chat-reports', label: 'Discuter avec les rapports', icon: <MessageSquare className="h-5 w-5" /> },
    { path: '/spell-checker', label: 'Correcteur', icon: <SpellCheck2 className="h-5 w-5" /> },
  ];

  const handleShowProfile = () => {
    alert('Affichage du profil (simulé)');
    // Logique future pour afficher la page de profil
  };

  const handleLogout = () => {
    alert('Déconnexion (simulée)');
    // Logique future pour la déconnexion réelle
  };
  
  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-full bg-white border-r border-neutral-200 transition-all duration-300 z-20 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div>
        <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200">
          {!collapsed && (
            <div className="font-semibold text-lg">RAEDIFICARE</div>
          )}
          <button
            onClick={toggleCollapse}
            className="p-2 rounded-md hover:bg-neutral-100 transition-colors"
          >
            {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </button>
        </div>
        
        <nav className="p-2">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => 
                    cn(
                      "sidebar-link",
                      isActive ? "active" : "",
                      "flex items-center gap-3 px-4 py-3 rounded-md transition-colors",
                      {
                        "justify-center": collapsed
                      }
                    )
                  }
                >
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-neutral-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "flex items-center w-full text-left p-2 rounded-md hover:bg-neutral-100 transition-colors",
              collapsed && "justify-center"
            )}>
              <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 text-sm font-medium">
                JD
              </div>
              {!collapsed && (
                <>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-neutral-800">Julien Dubois</div>
                    <div className="text-xs text-neutral-500">Compte Actuel</div>
                  </div>
                  <ChevronDown className="ml-auto h-4 w-4 text-neutral-500" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align={collapsed ? "center" : "start"} className="w-56 mb-2">
            <DropdownMenuItem onClick={handleShowProfile}>
              <User className="mr-2 h-4 w-4" />
              <span>Afficher le profil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Se déconnecter</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
};

export default Sidebar;
