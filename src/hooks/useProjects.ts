import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Project, ProjectStatus } from '../components/ProjectCard'; // Importer ProjectStatus
import { useToast } from "@/hooks/use-toast";

// Initialisation du client Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('newest');
  const [searchTerm, setSearchTerm] = useState<string>(''); // Ajout du terme de recherche
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const projectStatusCounts = useMemo(() => {
    const counts: Record<ProjectStatus, number> = {
      draft: 0,
      in_progress: 0,
      completed: 0,
      pending: 0,
      archived: 0,
    };
    projects.forEach(p => {
      if (counts.hasOwnProperty(p.status)) {
        counts[p.status]++;
      }
    });
    return counts;
  }, [projects]);
  
  useEffect(() => {
    fetchProjects();
  }, []);
  
  useEffect(() => {
    applyFiltersAndSort();
  }, [projects, statusFilter, sortOrder, searchTerm]); // Ajout de searchTerm aux dépendances

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*');
      
      if (error) throw error;
      
      const formattedProjects: Project[] = data.map((project: any) => ({
        id: project.id,
        title: project.title,
        client: project.client_name,
        description: project.description,
        status: project.status || 'in_progress',
        date: new Date(project.last_update || project.created_at).toLocaleDateString('fr-FR'),
      }));
      
      setProjects(formattedProjects);
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les projets",
        variant: "destructive"
      });
      
      if (projects.length === 0) { // Ne définir les mocks que si la liste est vide (chargement initial échoué)
        setProjects([
          {
            id: '1',
          title: 'Rénovation Immeuble Haussmannien',
          client: 'ABC Construction',
          description: 'Diagnostic des matériaux réemployables dans un immeuble haussmannien du 9ème arrondissement avant rénovation complète.',
          status: 'in_progress',
          date: '12/05/2025',
        },
        {
          id: '2',
          title: 'Déconstruction Bâtiment Industriel',
          client: 'Groupe Vinci',
          description: 'Identification et valorisation des matériaux dans un ancien site industriel avant démolition complète.',
          status: 'completed',
          date: '08/05/2025',
        },
        {
          id: '3',
          title: 'Réhabilitation École Jules Ferry',
          client: 'Mairie de Paris',
          description: 'Étude des possibilités de réemploi dans le cadre de la réhabilitation d\'une école élémentaire.',
          status: 'pending',
          date: '05/05/2025',
        },
        {
          id: '4',
          title: 'Extension Centre Commercial',
          client: 'Carrefour Immobilier',
          description: 'Analyse des matériaux récupérables dans l\'ancien parking avant construction de l\'extension.',
          status: 'in_progress',
          date: '02/05/2025',
        },
        {
          id: '5',
          title: 'Renouvellement Campus Universitaire',
          client: 'Université Paris-Saclay',
          description: 'Diagnostic complet des bâtiments du campus avant rénovation énergétique et architecturale.',
          status: 'archived' as 'archived',
            date: '28/04/2025',
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const applyFiltersAndSort = () => {
    let result = [...projects];

    // Filtrage par terme de recherche
    if (searchTerm) {
      result = result.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.client && project.client.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Filtrage par statut
    if (statusFilter !== 'all') {
      result = result.filter(project => project.status === statusFilter);
    }
    
    // Tri
    if (sortOrder === 'newest') {
      result.sort((a, b) => new Date(b.date.split('/').reverse().join('-')).getTime() - 
                           new Date(a.date.split('/').reverse().join('-')).getTime());
    } else if (sortOrder === 'oldest') {
      result.sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - 
                           new Date(b.date.split('/').reverse().join('-')).getTime());
    } else if (sortOrder === 'alpha-asc') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOrder === 'alpha-desc') {
      result.sort((a, b) => b.title.localeCompare(a.title));
    }
    
    setFilteredProjects(result);
  };
  
  // Renommée pour clarifier qu'elle n'appelle plus fetchProjects directement.
  const insertProjectIntoSupabaseOnly = async (projectData: Omit<Project, 'id' | 'date' | 'status'> & { status?: Project['status'] }): Promise<Project | null> => {
    // setIsLoading(true); // Le setIsLoading sera géré par le composant appelant ou fetchProjects
    try {
      const newProjectData = {
        title: projectData.title,
        client_name: projectData.client,
        description: projectData.description,
        status: projectData.status || 'draft',
        created_at: new Date().toISOString(),
        last_update: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('projects')
        .insert([newProjectData])
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error("Aucune donnée retournée après l'insertion du projet.");

      const createdProject: Project = {
        id: data.id,
        title: data.title,
        client: data.client_name,
        description: data.description,
        status: data.status,
        date: new Date(data.last_update || data.created_at).toLocaleDateString('fr-FR'),
      };
      
      // Ne plus appeler fetchProjects() ici. Il sera appelé par le composant après toutes les opérations.
      // toast({ // Le toast sera géré par le composant appelant
      //   title: "Projet créé",
      //   description: `Le projet "${createdProject.title}" a été ajouté.`
      // });
      return createdProject;
    } catch (error) {
      console.error('Erreur lors de l\'insertion du projet dans Supabase:', error);
      toast({
        title: "Erreur Supabase",
        description: "Impossible d'insérer le projet dans Supabase.",
        variant: "destructive"
      });
      return null;
    } 
    // finally { // Le setIsLoading sera géré par le composant appelant ou fetchProjects
    //   setIsLoading(false);
    // }
  };

  const updateProjectStatus = async (projectId: string, newStatus: Project['status']) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus, last_update: new Date().toISOString() })
        .eq('id', projectId);

      if (error) throw error;

      await fetchProjects(); // Rafraîchir la liste des projets
      toast({
        title: "Statut mis à jour",
        description: `Le statut du projet a été mis à jour à "${newStatus}".`
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut du projet:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut du projet.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('https://api.ia2s.app/webhook/raedificare/project/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ project_id: projectId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue lors de la suppression via webhook.' }));
        throw new Error(`Erreur HTTP ${response.status} lors de la suppression du projet via webhook: ${errorData.message || response.statusText}`);
      }
      
      await fetchProjects(); // Rafraîchir la liste des projets
      toast({
        title: "Projet supprimé",
        description: "Le projet a été supprimé avec succès."
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du projet:', error);
      toast({
        title: "Erreur",
        description: `Impossible de supprimer le projet: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    projects,
    filteredProjects,
    statusFilter,
    setStatusFilter,
    sortOrder,
    setSortOrder,
    searchTerm, // Exporter searchTerm
    setSearchTerm, // Exporter setSearchTerm
    isLoading,
    fetchProjects, // Exporter fetchProjects pour un appel manuel
    insertProjectIntoSupabaseOnly, // Exporter la fonction renommée
    updateProjectStatus,
    deleteProject,
    projectStatusCounts, // Exporter les décomptes
  };
};
