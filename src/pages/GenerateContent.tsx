import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Garder pour la navigation des résultats
import { Button } from '@/components/ui/button';
// import { Checkbox } from "@/components/ui/checkbox"; // Supprimé car remplacé par des cartes
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card'; // Ajout de Card et CardContent
import { Calendar } from "@/components/ui/calendar"; // Ajout de Calendar
import { Copy, RefreshCw, FileUp, Facebook, Instagram, Linkedin, Newspaper } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { createClient } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useProjects } from '@/hooks/useProjects'; // Importer le hook useProjects

// Initialisation du client Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Rapport {
  id: string;
  title: string;
  project_title: string;
}

interface GeneratedSuggestion {
  content_type: string;
  generated_content: string;
  generated_image_url?: string;
}

const contentTypesOptions = [
  { id: 'blog', label: 'Blog', icon: Newspaper },
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'facebook', label: 'Facebook', icon: Facebook },
];

const GenerateContent: React.FC = () => {
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>(['blog']); // Remplacer selectedType
  const [selectedRapport, setSelectedRapport] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [generatedSuggestions, setGeneratedSuggestions] = useState<GeneratedSuggestion[]>([]); // Remplacer generatedContent et imageUrl
  const [currentSuggestionTab, setCurrentSuggestionTab] = useState<string | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [rapportsList, setRapportsList] = useState<Rapport[]>([]); // Décommenté
  const [isRapportsLoading, setIsRapportsLoading] = useState(true); // Décommenté
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedProjectForUpload, setSelectedProjectForUpload] = useState(''); // Nouvel état pour le projet sélectionné
  const { toast } = useToast();
  const { projects, isLoading } = useProjects(); // Utiliser le hook useProjects
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date()); // État pour le calendrier
  
  useEffect(() => { // Décommenté
    fetchRapports();
  }, []);
  
  const fetchRapports = async () => { // Décommenté
    setIsRapportsLoading(true); 
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          title,
          projects (
            title
          )
        `) // Assurez-vous que la syntaxe du select est correcte
        .eq('rapport', true); 
      
      if (error) throw error;
      
      const formattedRapports: Rapport[] = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        project_title: item.projects?.title || 'Projet inconnu', // Gestion correcte ici
      }));
      
      setRapportsList(formattedRapports);
    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger la liste des rapports.",
        variant: "destructive",
      });
      setRapportsList([]); // Mettre une liste vide en cas d'erreur
    } finally {
      setIsRapportsLoading(false); 
    }
  };
  // const rapportsList = [ // Données statiques pour test - Supprimé
  //   { id: 'r1', title: 'Rapport Statique 1', project_title: 'Projet Test A' },
  //   { id: 'r2', title: 'Rapport Statique 2', project_title: 'Projet Test B' },
  //   { id: 'r3', title: 'Rapport Statique 3', project_title: 'Projet Test C' },
  // ];
  // const isRapportsLoading = false; // Simuler la fin du chargement - Supprimé
  
  const handleGenerate = async () => {
    if (!selectedRapport) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un rapport",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedContentTypes.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un type de contenu",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    setGeneratedSuggestions([]);
    setCurrentSuggestionTab(undefined);
    
    try {
      // Appel au webhook pour générer le contenu
      const response = await fetch('https://api.ia2s.app/webhook/raedificare/rapport/content/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rapport_id: selectedRapport,
          content_types: selectedContentTypes, // Utiliser selectedContentTypes
          instructions: customInstructions || undefined,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.suggestions && result.suggestions.length > 0) {
        setGeneratedSuggestions(result.suggestions);
        setCurrentSuggestionTab(result.suggestions[0].content_type);
      } else {
        setGeneratedSuggestions([]);
         toast({
          title: "Aucune suggestion",
          description: "Aucune suggestion n'a été générée pour cette sélection.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Erreur lors de la génération du contenu:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le contenu",
        variant: "destructive"
      });
      
      // Contenu de secours en cas d'erreur (peut être adapté ou supprimé si l'API gère bien les erreurs)
      setGeneratedSuggestions([{
        content_type: selectedContentTypes[0] || 'default',
        generated_content: `# Erreur de génération

Nous n'avons pas pu générer le contenu. Veuillez réessayer.

Si le problème persiste, contactez le support.`,
        generated_image_url: ''
      }]);
      if (selectedContentTypes.length > 0) {
        setCurrentSuggestionTab(selectedContentTypes[0]);
      }
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleCopyContent = () => {
    const currentSuggestion = generatedSuggestions.find(s => s.content_type === currentSuggestionTab);
    if (currentSuggestion) {
      navigator.clipboard.writeText(currentSuggestion.generated_content);
      toast({
        title: "Copié !",
        description: "Le contenu a été copié dans le presse-papier",
      });
    }
  };

  const handleContentTypeChange = (contentTypeId: string) => {
    setSelectedContentTypes(prev => 
      prev.includes(contentTypeId) 
        ? prev.filter(id => id !== contentTypeId) 
        : [...prev, contentTypeId]
    );
  };
  const handleUploadRapport = async () => {
    if (!selectedFile || !uploadTitle || !selectedProjectForUpload) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier, entrer un titre et sélectionner un projet",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // 1. Uploader le fichier vers Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `public/rapports/${fileName}`; // Chemin dans le bucket

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents') // Assurez-vous que 'documents' est le nom de votre bucket
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw uploadError;
      }

      // Obtenir l'URL publique du fichier uploadé
      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      if (!publicUrlData) {
        throw new Error("Impossible d'obtenir l'URL publique du fichier.");
      }

      const documentUrl = publicUrlData.publicUrl;

      // 2. Appeler l'endpoint API pour ajouter le rapport au projet
      const response = await fetch('https://api.ia2s.app/webhook/raedificare/project/rapport/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: selectedProjectForUpload,
          document_url: documentUrl,
          title: uploadTitle, // Ajouter le titre ici si l'API le supporte, sinon il faudra l'ajouter via Supabase après l'appel API
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      // L'API retourne l'ID du projet et l'URL du rapport, pas l'ID du document créé
      // Pour mettre à jour la liste locale, il faudrait soit refetch les rapports, soit insérer le document directement via Supabase après l'upload.
      // Pour l'instant, on va juste refetch les rapports pour simplifier.
      fetchRapports(); // Décommenté

      setSelectedFile(null);
      setUploadTitle('');
      setSelectedProjectForUpload('');
      setIsUploadDialogOpen(false);
      
      toast({
        title: "Succès",
        description: "Le rapport a été importé et lié au projet avec succès",
      });
    } catch (error: any) {
      console.error('Erreur lors de l\'upload ou de l\'ajout du rapport:', error);
      toast({
        title: "Erreur",
        description: `Impossible d'importer le rapport: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="page-title">Générer du contenu</h1>
        <Button 
          onClick={() => setIsUploadDialogOpen(true)}
          variant="outline" 
          className="flex items-center gap-2"
        >
          <FileUp className="h-4 w-4" />
          <span>Importer un rapport</span>
        </Button>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm">
          <h2 className="text-lg font-medium mb-4">Paramètres du contenu</h2>
          
          <div className="space-y-4">
            <div>
              <Label>Type de contenu (sélection multiple)</Label>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
                {contentTypesOptions.map((option) => (
                  <Card
                    key={option.id}
                    onClick={() => handleContentTypeChange(option.id)}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedContentTypes.includes(option.id)
                        ? 'ring-2 ring-primary border-primary bg-primary/10'
                        : 'border-neutral-200'
                    }`}
                  >
                    <CardContent className="p-4 flex flex-col items-center justify-center space-y-2">
                      <option.icon className={`h-6 w-6 ${selectedContentTypes.includes(option.id) ? 'text-primary' : 'text-neutral-500'}`} />
                      <span className={`text-sm font-medium ${selectedContentTypes.includes(option.id) ? 'text-primary' : 'text-neutral-700'}`}>
                        {option.label}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="rapport-select">Rapport source</Label>
              <Select value={selectedRapport} onValueChange={setSelectedRapport} disabled={isRapportsLoading}>
                <SelectTrigger className="w-full mt-1" id="rapport-select">
                  <SelectValue placeholder="Sélectionner un rapport" />
                </SelectTrigger>
                <SelectContent>
                  {rapportsList.map((rapport) => ( 
                    <SelectItem key={rapport.id} value={rapport.id}>
                      {rapport.title} ({rapport.project_title})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="instructions">Instructions personnalisées</Label>
              <Textarea
                id="instructions"
                placeholder="Instructions spécifiques pour la génération du contenu..."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div className="pt-2">
              <Button 
                onClick={handleGenerate} 
                disabled={!selectedRapport || isGenerating}
                className="w-full"
                style={{ backgroundColor: '#eb661a' }}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : 'Générer le contenu'}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Contenu généré</h2>
            {generatedSuggestions.length > 0 && currentSuggestionTab && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyContent}
                className="flex items-center gap-2"
              >
                <Copy className="h-3.5 w-3.5" />
                Copier
              </Button>
            )}
          </div>
          
          {isGenerating ? (
            <div className="min-h-[400px] bg-neutral-50 rounded-md p-4 border border-neutral-200 overflow-y-auto flex flex-col items-center justify-center text-neutral-500">
              <RefreshCw className="h-8 w-8 animate-spin mb-3" />
              <p>Génération de votre contenu...</p>
            </div>
          ) : generatedSuggestions.length > 0 && currentSuggestionTab ? (
            <Tabs value={currentSuggestionTab} onValueChange={setCurrentSuggestionTab} className="w-full">
              <TabsList className={`grid w-full grid-cols-${generatedSuggestions.length || 1}`}>
                {generatedSuggestions.map(suggestion => (
                  <TabsTrigger key={suggestion.content_type} value={suggestion.content_type}>
                    {contentTypesOptions.find(opt => opt.id === suggestion.content_type)?.label || suggestion.content_type}
                  </TabsTrigger>
                ))}
              </TabsList>
              {generatedSuggestions.map(suggestion => (
                <TabsContent key={suggestion.content_type} value={suggestion.content_type}>
                  <div className="min-h-[350px] bg-neutral-50 rounded-md p-4 border border-neutral-200 overflow-y-auto mt-2">
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap">{suggestion.generated_content}</div>
                      {suggestion.generated_image_url && (
                        <div className="mt-4">
                          <img 
                            src={suggestion.generated_image_url} 
                            alt={`Illustration pour ${suggestion.content_type}`}
                            className="max-w-full h-auto rounded-md" 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="min-h-[400px] bg-neutral-50 rounded-md p-4 border border-neutral-200 overflow-y-auto flex flex-col items-center justify-center text-neutral-500">
              <p>Le contenu généré apparaîtra ici</p>
            </div>
          )}
        </div>
      </div>

      {/* Divider avec texte */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-neutral-300" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-neutral-50 px-3 text-sm font-medium text-neutral-500">
            Fonctionnalités à venir
          </span>
        </div>
      </div>
      
      {/* Dialog d'importation de rapport */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Importer un rapport</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="upload-project-select">Projet</Label>
                <Select value={selectedProjectForUpload} onValueChange={setSelectedProjectForUpload} disabled={isLoading}>
                  <SelectTrigger className="w-full mt-1" id="upload-project-select">
                    <SelectValue placeholder="Sélectionner un projet" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="rapport-title">Titre du rapport</Label>
                <Input
                  id="rapport-title"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Rapport de diagnostic - Projet X"
                />
              </div>
              
              <div className="grid gap-2">
                <Label>Fichier du rapport</Label>
                <div
                  className="border-2 border-dashed border-neutral-300 rounded-md p-6 text-center"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      setSelectedFile(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  <input
                    id="rapport-file"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                  <label 
                    htmlFor="rapport-file"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <FileUp className="h-8 w-8 text-neutral-400 mb-2" />
                    <span className="text-sm text-neutral-600 mb-1">
                      Glissez-déposez votre fichier ici
                    </span>
                    <span className="text-xs text-neutral-500">
                      ou cliquez pour parcourir
                    </span>
                  </label>
                </div>
                
                {selectedFile && (
                  <div className="text-sm text-neutral-600 mt-1">
                    <span className="font-medium">Fichier sélectionné:</span> {selectedFile.name}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)} disabled={isUploading}>
              Annuler
            </Button>
            <Button 
              onClick={handleUploadRapport} 
              disabled={!selectedFile || !uploadTitle || !selectedProjectForUpload || isUploading} // Désactiver si aucun projet n'est sélectionné
              style={{ backgroundColor: '#eb661a' }}
            >
              {isUploading ? 'Importation...' : 'Importer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Section Historique et Calendrier de contenu */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Conteneur d'historique des contenus */}
        <div className="md:col-span-1 bg-white p-6 rounded-lg border border-neutral-200 shadow-sm">
          <h2 className="text-lg font-medium mb-4">Historique des contenus</h2>
          <div className="space-y-3">
            {/* Exemple d'élément d'historique - à remplacer par des données réelles */}
            {[
              { title: "Les 5 tendances du réemploi", date: "08/10/2025", type: "blog" },
              { title: "Photo avant/après chantier", date: "07/10/2025", type: "instagram" },
              { title: "Notre impact écologique", date: "05/10/2025", type: "linkedin" },
            ].map((item, index) => {
              const ContentIcon = contentTypesOptions.find(opt => opt.id === item.type)?.icon;
              return (
                <div key={index} className="p-3 bg-neutral-50 border border-neutral-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-neutral-700 truncate pr-2">{item.title}</p>
                    {ContentIcon && <ContentIcon className="h-5 w-5 text-neutral-500 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">{`Généré le ${item.date}`}</p>
                </div>
              );
            })}
            <p className="text-sm text-neutral-500 mt-4 text-center">
              Plus d'historique à venir...
            </p>
          </div>
        </div>

        {/* Section Calendrier de contenu - Style Trello */}
        <div className="md:col-span-2 bg-white p-6 rounded-lg border border-neutral-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Calendrier de contenu (Maquette)</h2>
            {/* Ici, on pourrait ajouter des contrôles comme "Mois/Semaine", "Précédent/Suivant" à l'avenir */}
            <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">Mois</Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <span className="text-neutral-500">{'<'}</span>
            </Button>
            <span className="text-sm font-medium">Octobre 2025</span>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <span className="text-neutral-500">{'>'}</span>
            </Button>
          </div>
        </div>

        {/* En-têtes des jours de la semaine */}
        <div className="grid grid-cols-7 gap-px border-t border-l border-neutral-200 bg-neutral-100">
          {['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'].map(day => (
            <div key={day} className="py-2 text-center text-xs font-medium text-neutral-500 border-r border-b border-neutral-200">
              {day}
            </div>
          ))}
        </div>

        {/* Grille des jours du mois (Exemple pour quelques jours) */}
        <div className="grid grid-cols-7 grid-rows-5 gap-px border-l border-neutral-200 bg-neutral-100 h-[600px] overflow-y-auto">
          {/* Remplacer par une logique de génération de calendrier dynamique plus tard */}
          {Array.from({ length: 35 }).map((_, index) => {
            const dayNumber = index - 2; // Simule un début de mois
            const isCurrentMonth = dayNumber > 0 && dayNumber <= 31; // Simule les jours du mois actuel

            // Données factices pour les posts
            let postsForDay: { title: string, contentTypes: string[] }[] = [];
            if (isCurrentMonth && dayNumber === 6) {
              postsForDay = [
                { title: "Comment structurer un calendrier éditorial", contentTypes: ['blog', 'linkedin'] },
              ];
            }
            if (isCurrentMonth && dayNumber === 8) {
              postsForDay = [
                { title: "Tout sur la responsabilité", contentTypes: ['linkedin'] },
              ];
            }
            if (isCurrentMonth && dayNumber === 12) {
                postsForDay = [
                  { title: "Structure de notre CSS", contentTypes: ['blog'] },
                ];
            }
             if (isCurrentMonth && dayNumber === 14) {
                postsForDay = [
                  { title: "Planification de mariage avec Raedificare", contentTypes: ['instagram', 'facebook'] },
                ];
            }
            if (isCurrentMonth && dayNumber === 20) {
              postsForDay = [
                { title: "Nouveau projet de réemploi à Lyon", contentTypes: ['linkedin', 'facebook'] },
                { title: "Les matériaux de demain", contentTypes: ['blog'] },
              ];
            }


            return (
              <div 
                key={index} 
                className="relative p-1.5 border-r border-b border-neutral-200 bg-white min-h-[120px] flex flex-col" // min-h pour la hauteur des cellules
              >
                {isCurrentMonth && (
                  <span className="text-xs font-medium self-start mb-1">{dayNumber}</span>
                )}
                {!isCurrentMonth && (
                   <span className="text-xs text-neutral-400 self-start mb-1">{dayNumber > 0 ? dayNumber : ""}</span>
                )}
                <div className="space-y-1 overflow-y-auto flex-grow">
                  {postsForDay.map((post, postIndex) => (
                    <div key={postIndex} className="bg-white p-1.5 rounded border border-neutral-300 shadow-sm text-xs">
                      <div className="flex space-x-1.5 mb-1">
                        {post.contentTypes.map(contentTypeId => {
                          const contentTypeOption = contentTypesOptions.find(opt => opt.id === contentTypeId);
                          if (!contentTypeOption) return null;
                          const IconComponent = contentTypeOption.icon;
                          return (
                            <IconComponent key={contentTypeId} className="h-3.5 w-3.5 text-neutral-500" aria-label={contentTypeOption.label}/>
                          );
                        })}
                      </div>
                      <p className="text-neutral-700 leading-tight">{post.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
         <p className="text-sm text-neutral-500 mt-4 text-center">
          Cette section affichera les posts programmés à venir. (Maquette visuelle, fonctionnalité en cours de développement)
        </p>
      </div>
      </div> {/* Balise div fermante manquante ajoutée ici */}
    </MainLayout>
  );
};

export default GenerateContent;
