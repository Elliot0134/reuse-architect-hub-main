
import React from 'react';

const ProjectsLoading: React.FC = () => {
  return (
    <div className="flex justify-center py-12">
      <div className="animate-pulse text-neutral-500">Chargement des projets...</div>
    </div>
  );
};

export default ProjectsLoading;
