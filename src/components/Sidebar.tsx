
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
  LayoutDashboard, // Ajout de l'icône pour le Dashboard
  ChevronRight // Pour les sous-menus
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

  const sidebarConfig = [
    {
      type: 'link',
      path: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      isDashboard: true,
    },
    {
      type: 'category',
      label: 'Ressources',
      items: [
        { path: '/', label: 'Projets', icon: <Folder className="h-5 w-5" /> },
        { path: '/reports', label: 'Rapports', icon: <Archive className="h-5 w-5" /> },
        { path: '/templates', label: 'Modèles de rapport', icon: <Book className="h-5 w-5" /> },
      ],
    },
    {
      type: 'category',
      label: 'Outils',
      items: [
        { path: '/chat-reports', label: 'Discuter avec les rapports', icon: <MessageSquare className="h-5 w-5" /> },
        { path: '/generate-content', label: 'Générer du contenu', icon: <FileText className="h-5 w-5" /> },
        { path: '/spell-checker', label: 'Correcteur', icon: <SpellCheck2 className="h-5 w-5" /> },
      ],
    },
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
            {sidebarConfig.map((section, sectionIndex) => {
              if (section.type === 'link') {
                return (
                  <li key={section.path}>
                    <NavLink
                      to={section.path}
                      className={({ isActive }) => {
                        const isDashboard = section.isDashboard;
                        return cn(
                          "sidebar-link flex items-center gap-3 px-4 py-3 rounded-md transition-colors",
                          {
                            // Styles pour le Dashboard
                            "bg-[#eb661a] text-white hover:bg-[#d35a17]": isDashboard && !isActive, // Orange vif par défaut
                            // Gérer l'état actif pour le dashboard et les autres liens
                            "active": (isDashboard && isActive) || (!isDashboard && isActive),
                            // Styles pour les autres liens non actifs
                            "hover:bg-neutral-100": !isDashboard && !isActive,
                            "justify-center": collapsed,
                          }
                        );
                      }}
                    >
                      {section.icon}
                      {!collapsed && <span>{section.label}</span>}
                    </NavLink>
                  </li>
                );
              }
              if (section.type === 'category') {
                return (
                  <li key={sectionIndex} className="pt-2">
                    {!collapsed && (
                      <div className="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        {section.label}
                      </div>
                    )}
                    {collapsed && (
                       <div className="flex justify-center py-2">
                         <ChevronRight className="h-4 w-4 text-neutral-400" />
                       </div>
                    )}
                    <ul className="space-y-1">
                      {section.items.map((item) => (
                        <li key={item.path}>
                          <NavLink
                            to={item.path}
                            className={({ isActive }) =>
                              cn(
                                "sidebar-link flex items-center gap-3 px-4 py-3 rounded-md transition-colors hover:bg-neutral-100",
                                isActive ? "active" : "",
                                { "justify-center": collapsed }
                              )
                            }
                          >
                            {item.icon}
                            {!collapsed && <span>{item.label}</span>}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              }
              return null;
            })}
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
