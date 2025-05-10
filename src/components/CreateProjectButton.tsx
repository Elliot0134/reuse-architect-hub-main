import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Project } from './ProjectCard';
// import { useProjects } from '@/hooks/useProjects'; // Ne plus utiliser le hook ici

interface CreateProjectButtonProps {
  // onProjectCreate?: (project: Project) => void; // Ancienne prop
  performProjectInsert: (projectData: Omit<Project, 'id' | 'date' | 'status'> & { status?: Project['status'] }) => Promise<Project | null>;
  onProjectCreationSuccess: () => Promise<void>;
}

const CreateProjectButton: React.FC<CreateProjectButtonProps> = ({ performProjectInsert, onProjectCreationSuccess }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Garder isLoading local pour le dialogue
  const [uploadProgress, setUploadProgress] = useState(0); // Ajout de l'état pour la progression
  const [formData, setFormData] = useState({
    title: '',
    client: '',
    description: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();
  // Les fonctions insertProjectIntoSupabaseOnly et fetchProjects sont maintenant passées en props
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles([...e.target.files]);
    }
  };
  
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setSelectedFiles([...e.dataTransfer.files]);
    }
  };
  
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast({
        title: "Erreur",
        description: "Le nom du projet est requis",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setUploadProgress(0); 
    
    try {
      // 1. Créer le projet dans Supabase
      const projectToCreate = {
        title: formData.title,
        client: formData.client,
        description: formData.description,
        // status: 'draft', // La fonction d'insertion mettra 'draft' par défaut
      };
      // Utiliser la fonction passée en props
      const createdProject = await performProjectInsert(projectToCreate);

      if (!createdProject) {
        throw new Error("L'insertion du projet a échoué.");
      }
      const projectId = createdProject.id;

      // 2. Uploader les fichiers vers /documents/save
      const uploadedDocumentUrls: string[] = [];
      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const fileFormData = new FormData();
          fileFormData.append('file', file);
          
          const docSaveResponse = await fetch('https://api.ia2s.app/webhook/raedificare/documents/save', {
            method: 'POST',
            body: fileFormData,
          });
          
          if (!docSaveResponse.ok) {
            const errorData = await docSaveResponse.json().catch(() => ({ message: 'Erreur inconnue lors de l\'upload du fichier.' }));
            throw new Error(`Erreur HTTP ${docSaveResponse.status} lors de l'upload du fichier ${file.name}: ${errorData.message || docSaveResponse.statusText}`);
          }
          
          const docSaveResult = await docSaveResponse.json();
          if (docSaveResult.document_url) {
            uploadedDocumentUrls.push(docSaveResult.document_url);
          } else {
            console.warn(`URL manquante pour le fichier ${file.name} après upload.`);
            // Peut-être gérer cette erreur plus formellement
          }
          setUploadProgress(((i + 1) / selectedFiles.length) * 50); // Progression jusqu'à 50% pour l'upload
        }
      } else {
         setUploadProgress(50); // Si pas de fichiers, on est à mi-chemin
      }

      // 3. Lier les documents au projet via /project/documents/add
      if (uploadedDocumentUrls.length > 0) {
        const documentsAddResponse = await fetch('https://api.ia2s.app/webhook/raedificare/project/documents/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: projectId,
            document_urls: uploadedDocumentUrls,
          }),
        });

        if (!documentsAddResponse.ok) {
          const errorData = await documentsAddResponse.json().catch(() => ({ message: 'Erreur inconnue lors de la liaison des documents.' }));
          throw new Error(`Erreur HTTP ${documentsAddResponse.status} lors de la liaison des documents: ${errorData.message || documentsAddResponse.statusText}`);
        }
        // const documentsAddResult = await documentsAddResponse.json();
        // console.log("Documents liés:", documentsAddResult);
      }
      setUploadProgress(100); // Fin de la progression

      // Mettre à jour l'UI (si onProjectCreate est toujours utilisé, sinon useProjects devrait le faire)
      // }
      
      // Appeler la fonction de succès passée en props
      await onProjectCreationSuccess();

      setFormData({
        title: '',
        client: '',
        description: '',
      });
      setSelectedFiles([]);
      setIsDialogOpen(false);
      
      toast({
        title: "Projet créé",
        description: `Le projet "${formData.title}" a été créé avec succès.`,
      });
    } catch (error) {
      console.error('Erreur lors de la création du projet:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le projet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(0); // Réinitialiser la progression à la fin
    }
  };
  
  return (
    <>
      <Button 
        className="flex items-center gap-2" 
        onClick={() => setIsDialogOpen(true)}
        style={{ backgroundColor: '#eb661a' }}
      >
        <Plus className="h-4 w-4" />
        <span>Créer un projet</span>
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Créer un nouveau projet</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Nom du projet</Label>
              <Input
                id="title"
                name="title"
                placeholder="Rénovation Immeuble Haussmannien"
                value={formData.title}
                onChange={handleChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="client">Nom du client</Label>
              <Input
                id="client"
                name="client"
                placeholder="ABC Construction"
                value={formData.client}
                onChange={handleChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Description du projet..."
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Documents</Label>
              <div
                className="border-2 border-dashed border-neutral-300 rounded-md p-6 text-center"
                onDrop={handleFileDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <input
                  id="files"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label 
                  htmlFor="files"
                  className="flex flex-col items-center cursor-pointer"
                >
                  <Plus className="h-8 w-8 text-neutral-400 mb-2" />
                  <span className="text-sm text-neutral-600 mb-1">
                    Glissez-déposez vos fichiers ici
                  </span>
                  <span className="text-xs text-neutral-500">
                    ou cliquez pour parcourir
                  </span>
                </label>
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-neutral-600 mb-1">
                    {selectedFiles.length} fichier(s) sélectionné(s)
                  </p>
                  <ul className="text-xs text-neutral-500 space-y-1">
                    {selectedFiles.map((file, index) => (
                      <li key={index} className="flex justify-between items-center">
                        <span>{file.name}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveFile(index)}
                          className="h-6 w-6 p-0"
                        >
                          <span className="sr-only">Supprimer</span>
                          <span aria-hidden="true">×</span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                  {isLoading && selectedFiles.length > 0 && (
                    <div className="mt-2">
                      <Progress value={uploadProgress} className="w-full h-2" />
                      <p className="text-xs text-neutral-500 mt-1 text-center">
                        Upload en cours: {Math.round(uploadProgress)}%
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading}
              style={{ backgroundColor: '#eb661a' }}
            >
              {isLoading ? 'Création en cours...' : 'Créer le projet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateProjectButton;
