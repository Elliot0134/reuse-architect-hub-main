import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";

// Définition de l'interface pour un rapport
// Un rapport est un document avec des informations de projet associées
export interface Report {
  id: string; // ID du document
  title: string; // Titre du document (rapport)
  projectId: string;
  projectName: string;
  clientName: string;
  date: string; // Date de création/dépôt du document
  url?: string; // URL du document si disponible
}

// Initialisation du client Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const useReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [projectFilter, setProjectFilter] = useState<string>('all'); // Pour filtrer par projet
  const [clientFilter, setClientFilter] = useState<string>('all'); // Pour filtrer par client
  const [sortOrder, setSortOrder] = useState<string>('newest'); // 'newest', 'oldest'
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Récupérer tous les documents qui sont des rapports
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('id, title, project_id, created_at, url')
        .eq('rapport', true);

      if (documentsError) throw documentsError;

      if (!documentsData || documentsData.length === 0) {
        setReports([]);
        setFilteredReports([]);
        setIsLoading(false);
        return;
      }

      // 2. Pour chaque rapport, récupérer les informations du projet associé
      const projectIds = documentsData.map(doc => doc.project_id).filter(id => id);
      
      let projectsData: any[] = [];
      if (projectIds.length > 0) {
        const { data: projectsResult, error: projectsError } = await supabase
          .from('projects')
          .select('id, title, client_name')
          .in('id', projectIds);
        
        if (projectsError) throw projectsError;
        projectsData = projectsResult || [];
      }
      
      const projectsMap = new Map(projectsData.map(p => [p.id, p]));

      const formattedReports: Report[] = documentsData.map((doc: any) => {
        const project = projectsMap.get(doc.project_id);
        return {
          id: doc.id,
          title: doc.title || 'Rapport sans titre',
          projectId: doc.project_id,
          projectName: project ? project.title : 'Projet non spécifié',
          clientName: project ? project.client_name : 'Client non spécifié',
          date: new Date(doc.created_at).toLocaleDateString('fr-FR'),
          url: doc.url,
        };
      });
      
      setReports(formattedReports);

    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les rapports.",
        variant: "destructive",
      });
      setReports([]); // S'assurer que reports est vide en cas d'erreur
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const applyFiltersAndSort = useCallback(() => {
    let result = [...reports];

    // Appliquer le filtre de projet
    if (projectFilter !== 'all') {
      result = result.filter(report => report.projectId === projectFilter);
    }

    // Appliquer le filtre de client (si les noms de clients sont disponibles et uniques)
    // Pour l'instant, on suppose que clientFilter pourrait être un ID ou un nom exact.
    // Une amélioration serait de filtrer par nom de client de manière plus flexible.
    if (clientFilter !== 'all') {
      result = result.filter(report => report.clientName === clientFilter);
    }

    // Appliquer le tri
    if (sortOrder === 'newest') {
      result.sort((a, b) => new Date(b.date.split('/').reverse().join('-')).getTime() -
                           new Date(a.date.split('/').reverse().join('-')).getTime());
    } else if (sortOrder === 'oldest') {
      result.sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() -
                           new Date(b.date.split('/').reverse().join('-')).getTime());
    }
    // Ajouter d'autres tris si nécessaire (par nom de projet, par client)

    setFilteredReports(result);
  }, [reports, projectFilter, clientFilter, sortOrder]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [reports, projectFilter, clientFilter, sortOrder, applyFiltersAndSort]);

  // Fonctions pour ajouter, supprimer, lier/délier des rapports (à implémenter)
  // Exemple:
  // const addReport = async (newReportData) => { ... supabase.insert ... ; fetchReports(); }
  // const deleteReport = async (reportId) => { ... supabase.delete ... ; fetchReports(); }
  // const linkReportToProject = async (reportId, projectId) => { ... supabase.update ... ; fetchReports(); }

  const addReport = async (reportData: { title: string; reportFile: File; projectId?: string }) => {
    setIsLoading(true); // Indiquer le chargement pendant l'upload et l'insertion
    try {
      const { title, reportFile, projectId } = reportData;

      // 1. Uploader le fichier vers /documents/save
      const formDataApi = new FormData();
      formDataApi.append('file', reportFile);

      const docResponse = await fetch('https://api.ia2s.app/webhook/raedificare/documents/save', {
        method: 'POST',
        body: formDataApi,
      });

      if (!docResponse.ok) {
        const errorData = await docResponse.json().catch(() => ({ message: 'Erreur inconnue lors de l\'upload du fichier rapport.' }));
        throw new Error(`Erreur HTTP ${docResponse.status} lors de l'upload du fichier ${reportFile.name}: ${errorData.message || docResponse.statusText}`);
      }

      const docResult = await docResponse.json();
      if (!docResult.document_url) {
        throw new Error(`URL manquante pour le fichier rapport ${reportFile.name} après upload.`);
      }
      const documentUrl = docResult.document_url;

      // 2. Appeler l'API pour ajouter le rapport
      const apiReportResponse = await fetch('https://api.ia2s.app/webhook/raedificare/rapport/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ document_url: documentUrl }),
      });

      if (!apiReportResponse.ok) {
        const errorData = await apiReportResponse.json().catch(() => ({ message: 'Erreur inconnue lors de l\'ajout du rapport via API.' }));
        throw new Error(`Erreur HTTP ${apiReportResponse.status} lors de l'ajout du rapport via API: ${errorData.message || apiReportResponse.statusText}`);
      }

      // Optionnel: traiter la réponse de l'API si nécessaire
      // const apiReportResult = await apiReportResponse.json();

      toast({
        title: "Succès",
        description: "Rapport ajouté avec succès via l'API.",
      });
      fetchReports(); // Rafraîchir la liste (si fetchReports est toujours pertinent)
    } catch (error: any) {
      console.error("Erreur lors de l'ajout du rapport:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter le rapport via l'API.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false); // Arrêter l'indicateur de chargement
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Rapport supprimé avec succès.",
      });
      fetchReports();
    } catch (error) {
      console.error("Erreur lors de la suppression du rapport:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le rapport.",
        variant: "destructive",
      });
    }
  };

  const linkReportToProject = async (reportId: string, projectId: string | null) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ project_id: projectId })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Rapport ${projectId ? 'lié au' : 'délié du'} projet avec succès.`,
      });
      fetchReports();
    } catch (error) {
      console.error("Erreur lors de la liaison du rapport au projet:", error);
      toast({
        title: "Erreur",
        description: "Impossible de lier le rapport au projet.",
        variant: "destructive",
      });
    }
  };

  return {
    reports, // Tous les rapports bruts (avant filtrage/tri)
    filteredReports, // Rapports filtrés et triés, prêts à être affichés
    projectFilter,
    setProjectFilter,
    clientFilter,
    setClientFilter,
    sortOrder,
    setSortOrder,
    isLoading,
    fetchReports, // Pour rafraîchir manuellement si besoin
    addReport,
    deleteReport,
    linkReportToProject,
  };
};
