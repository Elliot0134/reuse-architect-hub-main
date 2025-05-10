
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button"; // Ajout de buttonVariants
import { Trash2 } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';

export type ProjectStatus = 'draft' | 'in_progress' | 'completed' | 'pending' | 'archived';

export interface Project {
  id: string;
  title: string;
  client: string;
  description: string;
  status: ProjectStatus;
  date: string;
}

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const navigate = useNavigate();
  const { updateProjectStatus, deleteProject } = useProjects();
  const [currentStatus, setCurrentStatus] = useState<ProjectStatus>(project.status);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setCurrentStatus(project.status);
  }, [project.status]);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-neutral-200 text-neutral-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'archived':
        return 'bg-neutral-100 text-neutral-500';
      default:
        return 'bg-neutral-200 text-neutral-700';
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Brouillon';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminé';
      case 'pending':
        return 'En attente';
      case 'archived':
        return 'Archivé';
      default:
        return 'Inconnu';
    }
  };
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Empêche la navigation si le clic provient du sélecteur de statut ou de l'icône de suppression
    if (
      (e.target as HTMLElement).closest('[data-radix-select-trigger]') ||
      (e.target as HTMLElement).closest('.delete-project-button')
    ) {
      return;
    }
    navigate(`/project/${project.id}`);
  };

  const handleStatusChange = (newStatus: ProjectStatus) => {
    setCurrentStatus(newStatus); // Met à jour l'UI immédiatement
    updateProjectStatus(project.id, newStatus);
  };
  
  const statusOptions: { value: ProjectStatus; label: string }[] = [
    { value: 'draft', label: 'Brouillon' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'completed', label: 'Terminé' },
    { value: 'pending', label: 'En attente' },
    { value: 'archived', label: 'Archivé' },
  ];

  return (
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <Card 
        className="shadow-sm hover:shadow-md transition-all duration-300 ease-in-out hover:scale-102 flex flex-col justify-between h-full cursor-pointer" // Assure que le footer est en bas + animation et curseur
        onClick={handleClick}
      >
        <CardContent className="p-6 pb-4"> {/* Réduire le padding bottom pour faire de la place */}
          <div className="flex justify-between items-start mb-2">
            <h3 
              className="font-medium text-lg" // cursor-pointer retiré car géré par la Card
              onClick={(e) => { e.stopPropagation(); navigate(`/project/${project.id}`);}}
            >
              {project.title}
            </h3>
          </div>
          <p 
              className="text-neutral-500 text-sm mb-3" // cursor-pointer retiré
              onClick={(e) => { e.stopPropagation(); navigate(`/project/${project.id}`);}}
          >
              {project.client}
          </p>
          <p 
              className="text-neutral-700 mb-3 text-sm" // cursor-pointer retiré et taille de texte réduite pour la description
              onClick={(e) => { e.stopPropagation(); navigate(`/project/${project.id}`);}}
          >
              {project.description}
          </p>
          <div onClick={(e) => e.stopPropagation()} className="mt-4">
            <Select
              value={currentStatus}
              onValueChange={(value) => handleStatusChange(value as ProjectStatus)}
            >
              <SelectTrigger className={`w-full h-8 text-xs ${getStatusColor(currentStatus)}`}> {/* w-full pour prendre la largeur */}
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value} className="text-xs">
                     <Badge className={`${getStatusColor(option.value)} mr-2`}>
                      {option.label}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="px-6 py-3 bg-neutral-50 text-xs text-neutral-500 flex justify-between items-center">
          <span>Dernière mise à jour: {project.date}</span>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="delete-project-button text-neutral-500 hover:text-red-500 h-6 w-6"
              onClick={(e) => e.stopPropagation()} // Empêche la navigation
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
        </CardFooter>
      </Card>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ce projet ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible et supprimera définitivement le projet "{project.title}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Non</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.stopPropagation();
              deleteProject(project.id);
              setIsDeleteDialogOpen(false); // Fermer la modale après action
            }}
            className={buttonVariants({ variant: "destructive" })}
          >
            Oui
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ProjectCard;
