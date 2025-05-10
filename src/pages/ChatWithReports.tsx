
import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageSquare, RefreshCw, Search, X, FileText } from 'lucide-react'; // Importer Search, X et FileText
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { Separator } from '@/components/ui/separator'; // Ajouté
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription, // Ajouté pour le sous-titre
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { createClient } from '@supabase/supabase-js'; // Importer Supabase
import ReactMarkdown from 'react-markdown'; // Ré-ajouté
import remarkGfm from 'remark-gfm'; // Ajouté
import { Card, CardContent } from '@/components/ui/card'; // Ajouté pour les sources
// import { marked } from 'marked'; // Supprimé

// Initialisation du client Supabase (si ce n'est pas déjà fait globalement)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);


interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  sourceDocuments?: { id: string; title: string }[]; // Ajouté
}

interface ReportDocument {
  id: string;
  name: string; // title du document
  project_name?: string; // title du projet
  client_name?: string; // client_name du projet
}

const ChatWithReports: React.FC = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const { toast } = useToast();

  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [searchReportName, setSearchReportName] = useState('');
  const [searchClientName, setSearchClientName] = useState('');
  const [searchProjectName, setSearchProjectName] = useState('');
  const [searchResults, setSearchResults] = useState<ReportDocument[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedReportForChat, setSelectedReportForChat] = useState<ReportDocument | null>(null);


  useEffect(() => {
    setSessionId(uuidv4());
  }, []);
  
  const handleSearchReports = async () => {
    setIsSearching(true);
    setSearchResults([]);
    try {
      let query = supabase
        .from('documents')
        .select(`
          id, 
          title, 
          projects (
            title, 
            client_name
          )
        `)
        .eq('rapport', true); // On ne cherche que parmi les documents qui sont des rapports

      if (searchReportName) {
        query = query.ilike('title', `%${searchReportName}%`);
      }
      // Pour les filtres sur projet et client, on filtre sur les tables jointes
      if (searchProjectName) {
        query = query.ilike('projects.title', `%${searchProjectName}%`);
      }
      if (searchClientName) {
        query = query.ilike('projects.client_name', `%${searchClientName}%`);
      }
      
      const { data, error } = await query;

      if (error) throw error;

      const formattedResults: ReportDocument[] = data.map((doc: any) => ({
        id: doc.id,
        name: doc.title,
        project_name: doc.projects?.title,
        client_name: doc.projects?.client_name,
      }));
      setSearchResults(formattedResults);

      if (formattedResults.length === 0) {
        toast({ title: "Recherche", description: "Aucun rapport trouvé pour ces critères." });
      }

    } catch (error) {
      console.error("Erreur lors de la recherche de rapports:", error);
      toast({ title: "Erreur", description: "La recherche de rapports a échoué.", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectReportForChat = (report: ReportDocument) => {
    setSelectedReportForChat(report);
    setChatHistory([]); // Réinitialiser l'historique du chat
    setSessionId(uuidv4()); // Nouvel ID de session pour le nouveau contexte de chat
    setIsSearchDialogOpen(false); // Fermer le dialogue de recherche
    toast({ title: "Rapport sélectionné", description: `Vous discutez maintenant avec le rapport: ${report.name}` });
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;
    
    setIsSending(true);

    const newMessage: ChatMessage = {
      id: `msg${Date.now()}`,
      sender: 'user',
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setChatHistory(prev => [...prev, newMessage]);
    const currentMessage = message;
    setMessage('');
    
    try {
      const requestBody: any = {
        query: currentMessage,
        session_id: sessionId,
      };
      // Si un rapport spécifique est sélectionné, nous pourrions avoir besoin d'envoyer son ID.
      // Cependant, l'API /rapports/chat actuelle ne semble pas prendre d'ID de document spécifique.
      // Elle retourne une liste d'IDs de documents sources.
      // Pour l'instant, l'appel reste global. Si l'API évolue, on pourra ajouter document_id ici.
      // if (selectedReportForChat) {
      //   requestBody.document_id = selectedReportForChat.id; // Exemple si l'API le supportait
      // }

      const response = await fetch('https://api.ia2s.app/webhook/raedificare/rapports/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      
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
          sourceDocs = docsData.map((doc: any) => ({ id: doc.id, title: doc.title || 'Titre inconnu' }));
        }
      }
      
      const botResponse: ChatMessage = {
        id: `msg${Date.now()}-bot`,
        sender: 'bot',
        text: result.response || "Désolé, je n'ai pas pu générer de réponse.", // On stocke le texte brut
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sourceDocuments: sourceDocs.length > 0 ? sourceDocs : undefined,
      };
      setChatHistory(prev => [...prev, botResponse]);

    } catch (error) {
      console.error('Erreur lors de l\'envoi du message au chat:', error);
      toast({ title: "Erreur", description: "Impossible de communiquer avec l'assistant.", variant: "destructive" });
      const errorBotResponse: ChatMessage = {
        id: `msg${Date.now()}-error`,
        sender: 'bot',
        text: "Désolé, une erreur est survenue lors de la communication avec l'assistant.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatHistory(prev => [...prev, errorBotResponse]);
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-4">
        <h1 className="page-title">Discuter avec les rapports</h1>
        <Button variant="outline" onClick={() => setIsSearchDialogOpen(true)}>
          <Search className="h-4 w-4 mr-2" />
          Rechercher un rapport
        </Button>
      </div>

      {selectedReportForChat && (
        <div className="mb-4 p-3 bg-primary-50 border border-primary rounded-md text-sm text-primary-foreground flex justify-between items-center">
          <span>Discussion ciblée sur le rapport : <strong>{selectedReportForChat.name}</strong> (Projet: {selectedReportForChat.project_name || 'N/A'}, Client: {selectedReportForChat.client_name || 'N/A'})</span>
          <Button variant="ghost" size="sm" onClick={() => {
            setSelectedReportForChat(null);
            setChatHistory([]);
            setSessionId(uuidv4());
            toast({ title: "Chat global réactivé", description: "Vous discutez à nouveau avec tous les rapports." });
          }}>
            <X className="h-4 w-4 mr-1" /> Quitter le chat ciblé
          </Button>
        </div>
      )}
      
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm min-h-[600px] flex flex-col">
        <div className="bg-neutral-50 p-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary-50 text-primary">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-medium">
                {selectedReportForChat ? `Assistant RAEDIFICARE (Rapport: ${selectedReportForChat.name})` : "Assistant RAEDIFICARE"}
              </h2>
              <p className="text-sm text-neutral-500">
                {selectedReportForChat 
                  ? `Posez des questions spécifiques à ce rapport.`
                  : `Posez des questions sur l'ensemble de vos rapports et projets.`
                }
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          {chatHistory.length === 0 && !isSending && (
            <div className="text-center text-neutral-500 py-10">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
              <p>Commencez par poser une question.</p>
              {!selectedReportForChat && <p>Ou recherchez un rapport spécifique pour cibler la discussion.</p>}
            </div>
          )}
          {chatHistory.map((msg) => (
            <div 
              key={msg.id}
              className={`mb-6 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-3/4 p-4 rounded-lg ${
                  msg.sender === 'user' 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-neutral-100 text-neutral-800 rounded-tl-none'
                }`}
              >
                {msg.sender === 'bot' ? (
                  <>
                    <h3 className="font-semibold mb-1 text-2xl">Réponse</h3>
                    <div className="prose prose-sm max-w-none break-words mb-3">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                    {msg.sourceDocuments && msg.sourceDocuments.length > 0 && (
                      <>
                        <Separator className="my-2 bg-neutral-300" />
                        <h3 className="font-semibold mb-2 text-2xl">Sources</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.sourceDocuments.map(doc => (
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
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                )}
                <span className={`text-xs block mt-2 ${msg.sender === 'user' ? 'text-primary-50' : 'text-neutral-500'}`}>
                  {msg.time}
                </span>
              </div>
            </div>
          ))}
           {isSending && (
             <div className="mb-6 flex justify-start">
               <div className="max-w-3/4 p-4 rounded-lg bg-neutral-100 text-neutral-800 rounded-tl-none">
                 <div className="whitespace-pre-wrap">...</div>
               </div>
             </div>
           )}
        </div>
        
        <form onSubmit={handleSendMessage} className="border-t border-neutral-200 p-4">
          <div className="flex gap-2">
            <Input
              placeholder={selectedReportForChat ? `Question sur "${selectedReportForChat.name}"...` : "Posez une question sur vos rapports et projets..."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1"
              disabled={isSending}
            />
            <Button type="submit" disabled={!message.trim() || isSending}>
              {isSending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="ml-2">Envoyer</span>
            </Button>
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            {selectedReportForChat 
              ? `L'assistant se concentrera sur le rapport "${selectedReportForChat.name}".`
              : "L'assistant analysera l'ensemble de vos rapports pour vous fournir des informations pertinentes."
            }
          </p>
        </form>
      </div>

      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Rechercher un rapport</DialogTitle>
            <DialogDescription>
              Affinez votre recherche pour trouver un rapport spécifique.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="search-report-name" className="text-right">Nom Rapport</Label>
              <Input id="search-report-name" value={searchReportName} onChange={(e) => setSearchReportName(e.target.value)} className="col-span-3" placeholder="Nom du rapport..."/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="search-client-name" className="text-right">Client</Label>
              <Input id="search-client-name" value={searchClientName} onChange={(e) => setSearchClientName(e.target.value)} className="col-span-3" placeholder="Nom du client..."/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="search-project-name" className="text-right">Projet</Label>
              <Input id="search-project-name" value={searchProjectName} onChange={(e) => setSearchProjectName(e.target.value)} className="col-span-3" placeholder="Nom du projet..."/>
            </div>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-4 max-h-60 overflow-y-auto border rounded-md">
              <h3 className="text-sm font-medium p-2 bg-neutral-50 border-b">Résultats de la recherche:</h3>
              <ul>
                {searchResults.map(report => (
                  <li key={report.id} 
                      className="p-2 hover:bg-neutral-100 cursor-pointer border-b last:border-b-0"
                      onClick={() => handleSelectReportForChat(report)}>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-xs text-neutral-500">
                      Projet: {report.project_name || 'N/A'} - Client: {report.client_name || 'N/A'}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {searchResults.length === 0 && isSearching && (
             <p className="text-sm text-neutral-500 text-center mt-4">Recherche en cours...</p>
          )}
           {searchResults.length === 0 && !isSearching && (searchReportName || searchClientName || searchProjectName) && (
             <p className="text-sm text-neutral-500 text-center mt-4">Aucun résultat. Essayez d'autres critères.</p>
           )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSearchDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSearchReports} disabled={isSearching}>
              {isSearching ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Rechercher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default ChatWithReports;
