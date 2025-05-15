import React, { useEffect, useState } from 'react';
// import { useParams } from 'react-router-dom'; // useParams n'est plus nécessaire ici
import { supabase } from '../lib/supabaseClient'; // Corrigé le chemin d'importation
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

// Définir le type pour les données de generated_rapport_parts
interface GeneratedReportPart {
  id: string;
  project_id: string;
  template_rapport_part_id: string;
  content: string;
  source_ids: string[] | null;
  created_at: string;
  // Potentiellement, récupérer le titre de la partie de template associée
  template_part_title?: string; 
}

interface GeneratedReportPartsViewerProps {
  projectId: string | undefined; // Accepter projectId comme prop
}

const GeneratedReportPartsViewer: React.FC<GeneratedReportPartsViewerProps> = ({ projectId }) => {
  const [parts, setParts] = useState<GeneratedReportPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchReportParts = async () => {
      if (!projectId) {
        setError("ID du projet non fourni.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: supabaseError } = await supabase
          .from('generated_rapport_parts')
          .select(`
            id,
            project_id,
            template_rapport_part_id,
            content,
            source_ids,
            created_at,
            templates_rapports_parts ( title ) 
          `)
          .eq('project_id', projectId)
          .order('created_at', { ascending: true }); // Ou par 'order_index' si pertinent

        if (supabaseError) {
          throw supabaseError;
        }

        if (data) {
          // Mapper les données pour inclure le titre de la partie de template
          const formattedData = data.map(part => ({
            ...part,
            template_part_title: (part.templates_rapports_parts as any)?.title || 'Partie sans titre'
          }));
          setParts(formattedData);
        } else {
          setParts([]);
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des parties de rapport générées:", err);
        setError("Impossible de charger les parties de rapport générées.");
      } finally {
        setLoading(false);
      }
    };

    fetchReportParts();
  }, [projectId]);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % parts.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + parts.length) % parts.length);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><p>Chargement des parties générées...</p></div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  if (parts.length === 0) {
    return <div className="text-center p-4">Aucune partie de rapport générée pour ce projet.</div>;
  }

  const currentPart = parts[currentIndex];

  return (
    <Card className="w-full max-w-2xl mx-auto my-8">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          Parties de Rapport Générées ({currentIndex + 1} / {parts.length})
        </CardTitle>
        <h3 className="text-lg text-gray-700">{currentPart.template_part_title}</h3>
      </CardHeader>
      <CardContent>
        <div className="prose max-w-none p-4 border rounded-md bg-gray-50 min-h-[200px]">
          <p>{currentPart.content}</p>
        </div>
        {currentPart.source_ids && currentPart.source_ids.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold">Sources:</h4>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {currentPart.source_ids.map(id => <li key={id}>{id}</li>)}
            </ul>
          </div>
        )}
        <div className="mt-6 flex justify-between items-center">
          <Button onClick={handlePrevious} disabled={parts.length <= 1} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Précédent
          </Button>
          <span className="text-sm text-gray-500">
            Créé le: {new Date(currentPart.created_at).toLocaleDateString()}
          </span>
          <Button onClick={handleNext} disabled={parts.length <= 1} variant="outline">
            Suivant <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneratedReportPartsViewer;
