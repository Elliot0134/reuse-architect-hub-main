
import React from 'react';
import MainLayout from '../layouts/MainLayout';
import ProjectGrid from '../components/ProjectGrid';
import CreateProjectButton from '../components/CreateProjectButton';
import ProjectsFilters from '../components/projects/ProjectsFilters';
import ProjectsLoading from '../components/projects/ProjectsLoading';
import ProjectsEmpty from '../components/projects/ProjectsEmpty';
import { useProjects } from '../hooks/useProjects';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ProjectStatus } from '@/components/ProjectCard';

// Définir les statuts possibles pour les projets, ordonnés comme souhaité pour l'affichage
const PROJECT_STATUSES_ORDERED: ProjectStatus[] = ['draft', 'in_progress', 'pending', 'completed', 'archived'];


const Index: React.FC = () => {
  console.log('[Index.tsx] Component rendering/mounting');
  const {
    filteredProjects,
    statusFilter,
    setStatusFilter,
    sortOrder,
    setSortOrder,
    searchTerm, // Ajout de searchTerm
    setSearchTerm, // Ajout de setSearchTerm
    isLoading,
    // addProject, // Cette prop n'est plus utilisée de cette manière
    fetchProjects, // Fonction pour rafraîchir la liste
    insertProjectIntoSupabaseOnly, // Fonction pour insérer le projet
    projectStatusCounts 
  } = useProjects();

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="page-title">Mes Projets</h1>
        <CreateProjectButton 
          performProjectInsert={insertProjectIntoSupabaseOnly}
          onProjectCreationSuccess={fetchProjects}
        />
      </div>

      {projectStatusCounts && !isLoading && (
        <div className="mb-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {PROJECT_STATUSES_ORDERED.map((status) => (
            <Card key={status} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium capitalize">
                  {status.replace('_', ' ')}
                </CardTitle>
                {/* Icône optionnelle ici */}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projectStatusCounts[status]}
                </div>
                <p className="text-xs text-neutral-500">
                  Projet(s)
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <ProjectsFilters 
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        searchTerm={searchTerm} // Ajout de searchTerm
        setSearchTerm={setSearchTerm} // Ajout de setSearchTerm
        projectCount={filteredProjects.length}
      />
      
      {isLoading ? (
        <ProjectsLoading />
      ) : filteredProjects.length === 0 ? (
        // Si ProjectsEmpty contient un bouton pour créer un projet, 
        // il faudrait lui passer les mêmes props ou qu'il ouvre le dialogue principal.
        // Pour l'instant, nous nous concentrons sur le CreateProjectButton principal.
        <ProjectsEmpty 
          statusFilter={statusFilter} 
          performProjectInsert={insertProjectIntoSupabaseOnly}
          onProjectCreationSuccess={fetchProjects}
        />
      ) : (
        <ProjectGrid projects={filteredProjects} />
      )}
    </MainLayout>
  );
};

export default Index;
