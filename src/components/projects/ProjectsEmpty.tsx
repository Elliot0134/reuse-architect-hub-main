
import React from 'react';
import { Button } from '@/components/ui/button';
import CreateProjectButton from '../CreateProjectButton';
import { Project } from '../ProjectCard'; // Project n'est plus directement utilisé pour onProjectCreate

interface ProjectsEmptyProps {
  statusFilter: string;
  // onProjectCreate: (project: Project) => void; // Ancienne prop
  performProjectInsert: (projectData: Omit<Project, 'id' | 'date' | 'status'> & { status?: Project['status'] }) => Promise<Project | null>;
  onProjectCreationSuccess: () => Promise<void>;
}

const ProjectsEmpty: React.FC<ProjectsEmptyProps> = ({ statusFilter, performProjectInsert, onProjectCreationSuccess }) => {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
      <h3 className="text-lg font-medium mb-2">Aucun projet trouvé</h3>
      <p className="text-neutral-500 mb-6">
        {statusFilter !== 'all' 
          ? `Aucun projet avec le statut "${statusFilter}" n'a été trouvé.`
          : "Commencez par créer votre premier projet."}
      </p>
      {statusFilter === 'all' && (
        <CreateProjectButton 
          performProjectInsert={performProjectInsert}
          onProjectCreationSuccess={onProjectCreationSuccess}
        />
      )}
    </div>
  );
};

export default ProjectsEmpty;
