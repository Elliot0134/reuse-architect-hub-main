import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FilePlus, FileText, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator'; // Ajouté
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { createClient } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { Project } from '@/components/ProjectCard'; // Importer l'interface Project
import ReactMarkdown from 'react-markdown'; // Ré-ajouté
import remarkGfm from 'remark-gfm'; // Ajouté
// import { marked } from 'marked'; // Supprimé
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'; // Ajouté pour les sources

// Initialisation du client Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Document {
  id: string; // Corresponds à 'id' de la table Supabase 'documents'
  name: string; // Corresponds à 'title' de la table Supabase 'documents'
  type: string | null; // Corresponds à 'document_type'
  date: string; // Corresponds à 'created_at'
  url?: string | null; // Corresponds à 'url'
  cover_url?: string | null; // Corresponds à 'cover_url'
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  sourceDocuments?: { id: string; title: string }[];
}

interface Template {
  id: string;
  title: string;
}

interface TemplateSection {
  id: string;
  title: string;
  instructions: string;
}

const ProjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('documents');
  const [chatMessage, setChatMessage] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templateSections, setTemplateSections] = useState<TemplateSection[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [customInstructions, setCustomInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [projectDetails, setProjectDetails] = useState<Omit<Project, 'date' | 'status'> & { date?: string, status?: string } | null>(null);
  const [isBotReplying, setIsBotReplying] = useState(false);
  
  useEffect(() => {
    fetchProjectDetails(); // Renommé pour plus de clarté
    fetchTemplates();
  }, [id]);

  const fetchProjectDetails = async () => {
    setIsLoading(true);
    if (!id) {
      toast({ title: "Erreur", description: "ID de projet manquant.", variant: "destructive" });
      setIsLoading(false);
      return;
    }
    try {
      // Récupérer les détails du projet
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, title, client_name, description, status, last_update, created_at')
        .eq('id', id)
        .single();

      if (projectError) throw projectError;
      if (!projectData) throw new Error("Projet non trouvé.");

      setProjectDetails({
        id: projectData.id,
        title: projectData.title,
        client: projectData.client_name,
        description: projectData.description,
        status: projectData.status,
        date: new Date(projectData.last_update || projectData.created_at).toLocaleDateString('fr-FR'),
      });

      // Récupérer les documents du projet
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('id, title, document_type, created_at, url, cover_url')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      if (documentsError) throw documentsError;

      const formattedDocuments: Document[] = documentsData.map(doc => ({
        id: doc.id,
        name: doc.title,
        type: doc.document_type,
        date: new Date(doc.created_at).toLocaleDateString('fr-FR'),
        url: doc.url,
        cover_url: doc.cover_url,
      }));
      setDocuments(formattedDocuments);

      // Initialiser les messages de chat à un tableau vide
      setChatMessages([]);

    } catch (error) {
      console.error('Erreur lors du chargement des données du projet:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du projet",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates_rapports')
        .select('id, title');
      
      if (error) throw error;
      setTemplates(data);
    } catch (error) {
      console.error('Erreur lors du chargement des templates:', error);
      // Templates de secours
      setTemplates([
        { id: 't1', title: 'Rapport de diagnostic standard' },
        { id: 't2', title: 'Rapport express' },
        { id: 't3', title: 'Rapport détaillé bâtiment historique' },
      ]);
    }
  };
  
  const fetchTemplateSections = async (templateId: string) => {
    if (!templateId) return;
    
    try {
      const { data, error } = await supabase
        .from('templates_rapports_parts')
        .select('id, title, instructions')
        .eq('template_rapport_id', templateId)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      setTemplateSections(data);
    } catch (error) {
      console.error('Erreur lors du chargement des sections:', error);
      // Sections de secours
      setTemplateSections([
        { id: 's1', title: 'Introduction', instructions: 'Présenter le contexte du projet' },
        { id: 's2', title: 'Méthodologie', instructions: 'Décrire l\'approche utilisée' },
        { id: 's3', title: 'Analyse des matériaux', instructions: 'Détailler les matériaux identifiés' },
        { id: 's4', title: 'Conclusion', instructions: 'Synthèse et recommandations' },
      ]);
    }
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    const newUserMessage = {
      id: `m${Date.now()}`,
      sender: 'user' as const,
      text: chatMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setChatMessages(prev => [...prev, newUserMessage]);
    const currentMessageText = chatMessage; // Sauvegarder le message avant de le vider
    setChatMessage('');
    setIsBotReplying(true); // Activer l'indicateur de chargement
    
    try {
      // Récupérer les IDs des sources (documents) pour le webhook
      const sourceIds = documents.map(doc => doc.id);
      
      // Appel au webhook de chat
      const response = await fetch('https://api.ia2s.app/webhook/raedificare/project/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: id,
          query: currentMessageText, // Utiliser le message sauvegardé
          response: '', // Sera rempli par le serveur
          source_ids: sourceIds,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
      let sourceDocs: { id: string; title: string }[] = [];
      if (result.document_ids && result.document_ids.length > 0) {
        const { data: docsData, error: docsError } = await supabase
          .from('documents')
          .select('id, title')
          .in('id', result.document_ids);

        if (docsError) {
          console.error("Erreur lors de la récupération des titres des documents sources:", docsError);
        } else if (docsData) {
          sourceDocs = docsData.map(doc => ({ id: doc.id, title: doc.title || 'Titre inconnu' }));
        }
      }
      
      // Ajouter la réponse du bot
      const botResponse: ChatMessage = {
        id: `m${Date.now() + 1}`,
        sender: 'bot' as const,
        text: result.response || "Je n'ai pas pu générer de réponse pour cette question.", // On stocke le texte brut
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sourceDocuments: sourceDocs.length > 0 ? sourceDocs : undefined,
      };
      
      setChatMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      
      // Message d'erreur du bot
      const errorMessage = {
        id: `m${Date.now() + 1}`,
        sender: 'bot' as const,
        text: "Désolé, une erreur est survenue lors du traitement de votre message.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      });
    } finally {
      setIsBotReplying(false); // Désactiver l'indicateur de chargement
    }
  };
  
  const handleTemplateChange = async (templateId: string) => {
    setSelectedTemplate(templateId);
    setSelectedSections([]);
    await fetchTemplateSections(templateId);
  };
  
  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };
  
  const handleUploadDocuments = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un fichier",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (!id) {
        toast({
          title: "Erreur",
          description: "ID de projet manquant pour l'upload.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      const uploadedDocumentUrls: string[] = [];

      for (const file of selectedFiles) {
        const formDataApi = new FormData();
        formDataApi.append('file', file);

        const docResponse = await fetch('https://api.ia2s.app/webhook/raedificare/documents/save', {
          method: 'POST',
          body: formDataApi,
        });

        if (!docResponse.ok) {
          const errorData = await docResponse.json().catch(() => ({ message: 'Erreur inconnue lors de l\'upload du fichier.' }));
          throw new Error(`Erreur HTTP ${docResponse.status} lors de l'upload du fichier ${file.name}: ${errorData.message || docResponse.statusText}`);
        }

        const docResult = await docResponse.json();
        if (docResult.document_url) {
          uploadedDocumentUrls.push(docResult.document_url);
        } else {
          console.warn(`URL manquante pour le fichier ${file.name} après upload.`);
          // Optionnel: Gérer le cas où une URL n'est pas retournée, peut-être en ne l'ajoutant pas ou en loggant une erreur plus sévère
        }
      }
      
      // Appel au webhook d'ajout de documents avec les URLs obtenues de /documents/save
      const response = await fetch('https://api.ia2s.app/webhook/raedificare/project/documents/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: id,
          document_urls: uploadedDocumentUrls,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue lors de l\'appel au webhook' }));
        throw new Error(`Erreur HTTP: ${response.status} - ${errorData.message || response.statusText}`);
      }
      
      await fetchProjectDetails(); // Corrigé: fetchProjectDetails au lieu de fetchProjectData
      setSelectedFiles([]);
      setIsDocumentDialogOpen(false);
      
      toast({
        title: "Succès",
        description: `${selectedFiles.length} document(s) importé(s) avec succès.`,
      });

    } catch (error: any) {
      console.error('Erreur lors de l\'upload des documents:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'importer les documents",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleGenerateReport = async () => {
    if (selectedSections.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins une section",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Appel au webhook de génération de rapport
      const response = await fetch('https://api.ia2s.app/webhook/raedificare/rapport/part/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: id,
          part_ids: selectedSections,
          instructions: customInstructions || undefined,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
      setIsGenerateDialogOpen(false);
      setSelectedTemplate('');
      setSelectedSections([]);
      setCustomInstructions('');
      
      toast({
        title: "Succès",
        description: "Les sections ont été générées avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer les sections du rapport",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteDocument = async (docId: string) => {
    try {
      // Appel au webhook de suppression de document
      const response = await fetch('https://api.ia2s.app/webhook/raedificare/projects/documents/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: docId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      await fetchProjectDetails(); // Rafraîchir la liste des documents et les détails du projet
      
      toast({
        title: "Succès",
        description: "Document supprimé avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du document:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le document",
        variant: "destructive"
      });
    }
  };
  
  return (
    <MainLayout>
      {projectDetails ? (
        <>
          <div className="flex items-center gap-3 mb-6">
            <a href="/" className="p-2 rounded-md hover:bg-neutral-100 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </a>
            <div>
              <h1 className="text-2xl font-semibold text-neutral-800">{projectDetails.title}</h1>
              <p className="text-neutral-500">{projectDetails.client}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex flex-col md:flex-row gap-2 mb-4">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 w-full"
                onClick={() => setIsDocumentDialogOpen(true)}
              >
                <FilePlus className="h-4 w-4" />
                <span>Importer document</span>
              </Button>
              <Button 
                className="flex items-center gap-2 w-full"
                style={{ backgroundColor: '#eb661a' }}
                onClick={() => setIsGenerateDialogOpen(true)}
              >
                <FileText className="h-4 w-4" />
                <span>Générer un rapport</span>
              </Button>
            </div>
            <p className="text-neutral-600">{projectDetails.description}</p>
          </div>
        </>
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-pulse text-neutral-500">Chargement du projet...</div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-red-500">Impossible de charger les détails du projet.</p>
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="documents">Documents importés</TabsTrigger>
          <TabsTrigger value="chat">Discussion</TabsTrigger>
          <TabsTrigger value="report">Générer une partie du rapport</TabsTrigger>
        </TabsList>
        
        <TabsContent value="documents">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-pulse text-neutral-500">Chargement des documents...</div>
            </div>
          ) : documents.length === 0 ? (
            <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
              <h3 className="text-lg font-medium mb-2">Aucun document</h3>
              <p className="text-neutral-500 mb-6">
                Importez des documents pour commencer à travailler sur ce projet.
              </p>
              <Button 
                onClick={() => setIsDocumentDialogOpen(true)}
                style={{ backgroundColor: '#eb661a' }}
              >
                <FilePlus className="h-4 w-4 mr-2" />
                Importer un document
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-white p-4 rounded-lg border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-blue-50 text-blue-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-800">{doc.name}</p>
                        <p className="text-xs text-neutral-500">Ajouté le {doc.date}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="h-8 w-8 text-neutral-500 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="chat">
          <div className="bg-white rounded-lg border border-neutral-200 h-[500px] flex flex-col">
            <div className="flex-1 p-4 overflow-y-auto">
              {chatMessages.length === 0 && !isBotReplying ? (
                <div className="flex-1 flex flex-col justify-center items-center h-full">
                  <Button 
                    variant="outline"
                    onClick={() => document.getElementById('chat-input')?.focus()}
                    className="mb-4"
                    style={{ borderColor: '#eb661a', color: '#eb661a' }}
                  >
                    Commencer à chatter avec mon projet
                  </Button>
                  <p className="text-sm text-neutral-500">Posez une question pour démarrer la conversation.</p>
                </div>
              ) : (
                <>
                  {chatMessages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-3/4 p-3 rounded-lg ${
                          message.sender === 'user' 
                            ? 'bg-[#eb661a] text-white rounded-tr-none' 
                            : 'bg-neutral-100 text-neutral-800 rounded-tl-none'
                        }`}
                      >
                        {message.sender === 'bot' ? (
                          <>
                            <h3 className="font-semibold mb-1 text-2xl">Réponse</h3>
                            <div className="prose prose-sm max-w-none break-words mb-3">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.text}
                              </ReactMarkdown>
                            </div>
                            {message.sourceDocuments && message.sourceDocuments.length > 0 && (
                              <>
                                <Separator className="my-2 bg-neutral-300" />
                                <h3 className="font-semibold mb-2 text-2xl">Sources</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {message.sourceDocuments.map(doc => (
                                    <Card key={doc.id} className="bg-neutral-50 shadow-none border-neutral-200 overflow-hidden">
                                      <CardContent className="p-2 text-xs">
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                                          <span className="text-neutral-700 truncate" title={doc.title}>
                                            {doc.title}
                                          </span>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </>
                            )}
                          </>
                        ) : (
                          <div className="prose prose-sm max-w-none break-words">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.text}
                            </ReactMarkdown>
                          </div>
                        )}
                        <span className={`text-xs block mt-2 ${message.sender === 'user' ? 'text-[#ffffff80]' : 'text-neutral-500'}`}>
                          {message.time}
                        </span>
                      </div>
                    </div>
                  ))}
                  {isBotReplying && (
                    <div className="mb-4 flex justify-start">
                      <div className="max-w-3/4 p-3 rounded-lg bg-neutral-100 text-neutral-800 rounded-tl-none">
                        <p className="animate-pulse">...</p> 
                        <span className="text-xs block mt-1 text-neutral-500">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <form onSubmit={handleSendMessage} className="border-t border-neutral-200 p-4 flex gap-2">
              <Input
                id="chat-input" // Ajout d'un ID pour le focus
                placeholder="Posez une question sur ce projet..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="flex-1"
                disabled={isBotReplying} // Désactiver l'input pendant la réponse
              />
              <Button 
                type="submit"
                style={{ backgroundColor: '#eb661a' }}
                disabled={isBotReplying || !chatMessage.trim()} // Désactiver le bouton pendant la réponse ou si vide
              >
                {isBotReplying ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="ml-2">{isBotReplying ? 'Envoi...' : 'Envoyer'}</span>
              </Button>
            </form>
          </div>
        </TabsContent>
        
        <TabsContent value="report">
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h3 className="text-lg font-medium mb-4">Générer une section du rapport</h3>
            <p className="text-neutral-600 mb-4">
              Sélectionnez le template et les sections que vous souhaitez générer pour ce projet.
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="template-select">Template de rapport</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Sélectionner un template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {templateSections.length > 0 && (
                <div>
                  <Label className="mb-2 block">Sections à générer</Label>
                  <div className="grid md:grid-cols-2 gap-4">
                    {templateSections.map((section) => (
                      <div 
                        key={section.id}
                        className={`border rounded-md p-4 cursor-pointer transition-colors ${
                          selectedSections.includes(section.id) 
                            ? 'border-[#eb661a] bg-orange-50' 
                            : 'border-neutral-200 hover:border-[#eb661a]'
                        }`}
                        onClick={() => handleSectionToggle(section.id)}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">{section.title}</h4>
                          <input 
                            type="checkbox"
                            checked={selectedSections.includes(section.id)}
                            onChange={() => {}} // Géré par le onClick du parent
                            className="h-4 w-4 text-[#eb661a]"
                          />
                        </div>
                        <p className="text-sm text-neutral-600">{section.instructions}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="instructions">Instructions complémentaires (optionnel)</Label>
                <Textarea
                  id="instructions"
                  placeholder="Ajoutez des instructions spécifiques pour la génération..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                disabled={!selectedTemplate || selectedSections.length === 0}
                onClick={handleGenerateReport}
                style={{ backgroundColor: '#eb661a' }}
              >
                Générer les sections
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Dialog d'importation de documents */}
      <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Importer des documents</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Fichiers</Label>
                <div
                  className="border-2 border-dashed border-neutral-300 rounded-md p-6 text-center"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files) {
                      setSelectedFiles(Array.from(e.dataTransfer.files));
                    }
                  }}
                >
                  <input
                    id="document-files"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <label 
                    htmlFor="document-files"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <FilePlus className="h-8 w-8 text-neutral-400 mb-2" />
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
                            onClick={() => {
                              const newFiles = [...selectedFiles];
                              newFiles.splice(index, 1);
                              setSelectedFiles(newFiles);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <span className="sr-only">Supprimer</span>
                            <span aria-hidden="true">×</span>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDocumentDialogOpen(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button 
              onClick={handleUploadDocuments} 
              disabled={selectedFiles.length === 0 || isSubmitting}
              style={{ backgroundColor: '#eb661a' }}
            >
              {isSubmitting ? 'Importation...' : 'Importer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de génération de rapport */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Générer un rapport</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="report-template">Template de rapport</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger className="w-full mt-1" id="report-template">
                  <SelectValue placeholder="Sélectionner un template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {templateSections.length > 0 && (
              <div>
                <Label className="mb-2 block">Sections à générer</Label>
                <div className="max-h-[200px] overflow-y-auto space-y-2 border rounded-md p-2">
                  {templateSections.map((section) => (
                    <div 
                      key={section.id}
                      className="flex items-center space-x-2"
                    >
                      <input 
                        type="checkbox"
                        id={`section-${section.id}`}
                        checked={selectedSections.includes(section.id)}
                        onChange={() => handleSectionToggle(section.id)}
                        className="h-4 w-4 text-[#eb661a] rounded"
                      />
                      <Label htmlFor={`section-${section.id}`} className="cursor-pointer">
                        {section.title}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="report-instructions">Instructions spécifiques (optionnel)</Label>
              <Textarea
                id="report-instructions"
                placeholder="Ajoutez des instructions spécifiques pour la génération..."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button 
              onClick={handleGenerateReport} 
              disabled={!selectedTemplate || selectedSections.length === 0 || isSubmitting}
              style={{ backgroundColor: '#eb661a' }}
            >
              {isSubmitting ? 'Génération...' : 'Générer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default ProjectPage;
