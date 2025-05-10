
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input"; // Ajout de l'Input
import { Search } from 'lucide-react'; // Ajout de l'icône Search

interface ProjectsFiltersProps {
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  sortOrder: string;
  setSortOrder: (value: string) => void;
  searchTerm: string; // Ajout de searchTerm
  setSearchTerm: (value: string) => void; // Ajout de setSearchTerm
  projectCount: number;
}

const ProjectsFilters: React.FC<ProjectsFiltersProps> = ({
  statusFilter,
  setStatusFilter,
  sortOrder,
  setSortOrder,
  searchTerm, // Ajout de searchTerm
  setSearchTerm, // Ajout de setSearchTerm
  projectCount
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6"> {/* Changé items-center à items-start pour un meilleur alignement avec le champ de recherche plus haut */}
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"> {/* Ajout de w-full sm:w-auto pour que les filtres prennent la largeur nécessaire */}
        {/* Champ de recherche */}
        <div className="relative flex-grow sm:flex-grow-0 sm:w-64"> {/* Ajustement de la largeur */}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="completed">Terminé</SelectItem>
              <SelectItem value="archived">Archivé</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full sm:w-48">
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger>
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Plus récents</SelectItem>
              <SelectItem value="oldest">Plus anciens</SelectItem>
              <SelectItem value="alpha-asc">Titre (A-Z)</SelectItem>
              <SelectItem value="alpha-desc">Titre (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="text-sm text-neutral-500 mt-2 sm:mt-0 self-end sm:self-center"> {/* Ajustement du margin et de l'alignement */}
        {projectCount} projet{projectCount !== 1 ? 's' : ''} trouvé{projectCount !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default ProjectsFilters;
