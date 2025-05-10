
import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '../layouts/MainLayout';
import { Button, buttonVariants } from '@/components/ui/button';
import { FileText, Plus, X, ArrowUp, ArrowDown, Trash2, MoreHorizontal, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger, // AlertDialogTrigger n'est plus utilisé directement pour le bouton supprimer, mais gardons l'import au cas où.
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createClient } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Initialisation du client Supabase (à remplacer par vos vraies credentials)
// À l'idéal, ces valeurs devraient être dans des variables d'environnement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface TemplateSection {
  id: string;
  title: string;
  instructions: string;
  example?: string;
  order_index: number;
}

interface Template {
  id: string;
  title: string;
  description: string;
  last_updated: string;
  sections: number;
  template_sections?: TemplateSection[];
  createdAtDate: Date; // Ajout pour le tri
}

const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    description: '',
  });
  const [newSection, setNewSection] = useState({
    title: '',
    instructions: '',
    example: '',
  });
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'alpha-asc' | 'alpha-desc'>('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingSection, setIsAddingSection] = useState(false);


  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('templates_rapports')
        .select('*');
      
      if (error) {
        console.error('Erreur lors du chargement des templates:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les templates.",
          variant: "destructive"
        });
        setTemplates([]); // Assurer que templates est un array vide en cas d'erreur
        setIsLoading(false);
        return; // Sortir de la fonction si une erreur se produit
      }
      
      // Formater les données pour correspondre à l'interface Template
      const formattedTemplates = data ? data.map((template: any) => ({
        id: template.id,
        title: template.title,
        description: template.description || '', // Assurer que description est une chaîne
        last_updated: new Date(template.created_at).toLocaleDateString('fr-FR'), // Utiliser created_at pour last_updated pour l'instant
        sections: template.number_of_sections || 0,
        createdAtDate: new Date(template.created_at) // Garder la date pour le tri
      })) : [];
      
      setTemplates(formattedTemplates);
    } catch (error) { // Gérer les erreurs inattendues
      console.error('Erreur inattendue lors du chargement des templates:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue.",
        variant: "destructive"
      });
      setTemplates([]);
    }
    setIsLoading(false);
  };

  const filteredAndSortedTemplates = useMemo(() => {
    if (!Array.isArray(templates)) {
      return []; // Retourner un array vide si templates n'est pas un array
    }
    let processedTemplates = templates.filter(template =>
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    switch (sortOrder) {
      case 'newest':
        processedTemplates.sort((a, b) => b.createdAtDate.getTime() - a.createdAtDate.getTime());
        break;
      case 'oldest':
        processedTemplates.sort((a, b) => a.createdAtDate.getTime() - b.createdAtDate.getTime());
        break;
      case 'alpha-asc':
        processedTemplates.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'alpha-desc':
        processedTemplates.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }
    return processedTemplates;
  }, [templates, searchTerm, sortOrder]);

  const fetchTemplateSections = async (templateId: string) => {
    try {
      const { data, error } = await supabase
        .from('templates_rapports_parts')
        .select('*')
        .eq('template_rapport_id', templateId)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Erreur lors du chargement des sections:', error);
      return [];
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.title) return;
    
    try {
      const { data, error } = await supabase
        .from('templates_rapports')
        .insert([
          { 
            title: newTemplate.title, 
            description: newTemplate.description,
            number_of_sections: 0
          }
        ])
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Template créé avec succès"
      });
      
      setIsCreateDialogOpen(false);
      setNewTemplate({ title: '', description: '' });
      fetchTemplates();
    } catch (error) {
      console.error('Erreur lors de la création du template:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le template",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;

    try {
      const { error } = await supabase
        .from('templates_rapports')
        .delete()
        .eq('id', templateToDelete.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Le template "${templateToDelete.title}" a été supprimé.`,
      });
      setTemplates(templates.filter(t => t.id !== templateToDelete.id));
      setIsDeleteDialogOpen(false);
      setTemplateToDelete(null);
    } catch (error) {
      console.error('Erreur lors de la suppression du template:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le template.",
        variant: "destructive",
      });
    }
  };

  const handleEditTemplate = async (template: Template) => {
    // Afficher un indicateur de chargement ou désactiver les interactions pendant le chargement des sections si nécessaire
    // Pour l'instant, on charge les sections avant de définir currentTemplate et d'ouvrir la modale.
    const sections = await fetchTemplateSections(template.id);
    
    setCurrentTemplate({
      ...template, // Utilise le titre et la description du template original
      template_sections: sections,
    });
    
    setIsEditDialogOpen(true); // Ouvrir la modale seulement après que currentTemplate est complètement initialisé
  };

  const handleUpdateTemplateDetails = async () => {
    if (!currentTemplate) return;

    try {
      const { data, error } = await supabase
        .from('templates_rapports')
        .update({ 
          title: currentTemplate.title, 
          description: currentTemplate.description 
        })
        .eq('id', currentTemplate.id)
        .select();

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Les détails du template ont été mis à jour.",
      });
      fetchTemplates(); // Rafraîchir la liste des templates
      setIsEditDialogOpen(false); // Fermer la modale
      setIsAddingSection(false); // Réinitialiser l'état d'ajout de section
      setNewSection({ title: '', instructions: '', example: '' }); // Réinitialiser le formulaire de nouvelle section
    } catch (error) {
      console.error('Erreur lors de la mise à jour du template:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les détails du template.",
        variant: "destructive",
      });
    }
  };

  const handleAddSection = async () => {
    if (!currentTemplate || !newSection.title) return;
    
    try {
      // Trouver le prochain ordre
      const nextOrder = currentTemplate.template_sections ? 
        currentTemplate.template_sections.length : 0;
      
      const { data, error } = await supabase
        .from('templates_rapports_parts')
        .insert([
          { 
            template_rapport_id: currentTemplate.id, 
            title: newSection.title,
            instructions: newSection.instructions,
            example: newSection.example || null,
            order_index: nextOrder
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Mettre à jour le nombre de sections dans le template
      await supabase
        .from('templates_rapports')
        .update({ number_of_sections: nextOrder + 1 })
        .eq('id', currentTemplate.id);
      
      // Refresh des sections
      const sections = await fetchTemplateSections(currentTemplate.id);
      setCurrentTemplate(prev => prev ? ({ // Utiliser une fonction de mise à jour pour éviter les problèmes de stale closure
        ...prev,
        template_sections: sections,
        sections: sections.length
      }) : null);
      
      setNewSection({ title: '', instructions: '', example: '' });
      setIsAddingSection(false); // Cacher le formulaire après l'ajout
      
      toast({
        title: "Succès",
        description: "Section ajoutée avec succès"
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la section:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la section",
        variant: "destructive"
      });
    }
  };

  const handleMoveSection = async (sectionId: string, direction: 'up' | 'down') => {
    if (!currentTemplate || !currentTemplate.template_sections) return;
    
    const sections = [...currentTemplate.template_sections];
    const currentIndex = sections.findIndex(s => s.id === sectionId);
    
    if (direction === 'up' && currentIndex > 0) {
      // Échanger avec la section précédente
      const newOrder = sections[currentIndex - 1].order_index;
      sections[currentIndex - 1].order_index = sections[currentIndex].order_index;
      sections[currentIndex].order_index = newOrder;
      
      // Mettre à jour dans Supabase
      try {
        await supabase
          .from('templates_rapports_parts')
          .update({ order_index: sections[currentIndex].order_index })
          .eq('id', sections[currentIndex].id);
        
        await supabase
          .from('templates_rapports_parts')
          .update({ order_index: sections[currentIndex - 1].order_index })
          .eq('id', sections[currentIndex - 1].id);
        
        // Refresh des sections
        const updatedSections = await fetchTemplateSections(currentTemplate.id);
        setCurrentTemplate({
          ...currentTemplate,
          template_sections: updatedSections
        });
      } catch (error) {
        console.error('Erreur lors du déplacement de la section:', error);
      }
    } else if (direction === 'down' && currentIndex < sections.length - 1) {
      // Échanger avec la section suivante
      const newOrder = sections[currentIndex + 1].order_index;
      sections[currentIndex + 1].order_index = sections[currentIndex].order_index;
      sections[currentIndex].order_index = newOrder;
      
      // Mettre à jour dans Supabase
      try {
        await supabase
          .from('templates_rapports_parts')
          .update({ order_index: sections[currentIndex].order_index })
          .eq('id', sections[currentIndex].id);
        
        await supabase
          .from('templates_rapports_parts')
          .update({ order_index: sections[currentIndex + 1].order_index })
          .eq('id', sections[currentIndex + 1].id);
        
        // Refresh des sections
        const updatedSections = await fetchTemplateSections(currentTemplate.id);
        setCurrentTemplate({
          ...currentTemplate,
          template_sections: updatedSections
        });
      } catch (error) {
        console.error('Erreur lors du déplacement de la section:', error);
      }
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!currentTemplate) return;
    
    try {
      await supabase
        .from('templates_rapports_parts')
        .delete()
        .eq('id', sectionId);
      
      // Refresh des sections
      const sections = await fetchTemplateSections(currentTemplate.id);
      
      // Mettre à jour le nombre de sections dans le template
      await supabase
        .from('templates_rapports')
        .update({ number_of_sections: sections.length })
        .eq('id', currentTemplate.id);
      
      setCurrentTemplate({
        ...currentTemplate,
        template_sections: sections,
        sections: sections.length
      });
      
      toast({
        title: "Succès",
        description: "Section supprimée avec succès"
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la section:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la section",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <p>Chargement des templates...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">Templates de rapports</h1>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span>Créer un template</span>
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Rechercher par titre ou description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as typeof sortOrder)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Plus récents</SelectItem>
            <SelectItem value="oldest">Plus anciens</SelectItem>
            <SelectItem value="alpha-asc">Titre (A-Z)</SelectItem>
            <SelectItem value="alpha-desc">Titre (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mb-4 text-sm text-neutral-500">
        {filteredAndSortedTemplates.length} template{filteredAndSortedTemplates.length !== 1 ? 's' : ''} trouvé{filteredAndSortedTemplates.length !== 1 ? 's' : ''}
      </div>

      {filteredAndSortedTemplates.length === 0 && !isLoading ? (
        <div className="text-center py-12 border rounded-lg">
          <FileText className="mx-auto h-12 w-12 text-neutral-400" />
          <h3 className="mt-2 text-sm font-medium text-neutral-900">Aucun template trouvé</h3>
          <p className="mt-1 text-sm text-neutral-500">
            {searchTerm ? "Essayez de modifier vos filtres ou " : "Commencez par "}
            <Button variant="link" className="p-0 h-auto" onClick={() => setIsCreateDialogOpen(true)}>
              créer un nouveau template
            </Button>.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Titre</TableHead>
                <TableHead className="w-[40%]">Description</TableHead>
                <TableHead className="text-center">Sections</TableHead>
                <TableHead>Dernière MàJ</TableHead>
                <TableHead className="text-right w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium py-3">{template.title}</TableCell>
                  <TableCell className="text-neutral-600 text-sm py-3 truncate max-w-xs" title={template.description}>
                    {template.description || '-'}
                  </TableCell>
                  <TableCell className="text-center py-3">{template.sections}</TableCell>
                  <TableCell className="text-neutral-600 text-sm py-3">{template.last_updated}</TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-neutral-500 hover:text-red-600 w-8 h-8"
                        onClick={() => {
                          setTemplateToDelete(template);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Supprimer</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Dialog de création de template - Inchangé */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Créer un nouveau template</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={newTemplate.title}
                onChange={(e) => setNewTemplate({...newTemplate, title: e.target.value})}
                placeholder="Rapport de diagnostic standard"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                placeholder="Description du template de rapport..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateTemplate}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog d'édition de template */}
      <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
        setIsEditDialogOpen(isOpen);
        if (!isOpen) {
          setCurrentTemplate(null); // Reset current template on close
          setIsAddingSection(false); // S'assurer que le formulaire d'ajout est caché
          setNewSection({ title: '', instructions: '', example: '' }); // Réinitialiser le formulaire de nouvelle section
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le template: {currentTemplate?.title || ''}</DialogTitle> 
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            {/* Champs pour Titre et Description du Template */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="editTemplateTitle" className="text-sm font-medium">Titre du Template</Label>
                <Input
                  id="editTemplateTitle"
                  value={currentTemplate?.title || ''}
                  onChange={(e) => setCurrentTemplate(prev => prev ? {...prev, title: e.target.value} : null)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="editTemplateDescription" className="text-sm font-medium">Description du Template</Label>
                <Textarea
                  id="editTemplateDescription"
                  value={currentTemplate?.description || ''}
                  onChange={(e) => setCurrentTemplate(prev => prev ? {...prev, description: e.target.value} : null)}
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-6">
              <h3 className="font-medium mb-4 text-lg">Sections du rapport</h3>
              {/* Liste des sections existantes en mode Accordéon */}
            {currentTemplate?.template_sections && currentTemplate.template_sections.length > 0 ? (
              <Accordion type="multiple" className="w-full space-y-2 mb-6">
                {currentTemplate.template_sections
                  .sort((a, b) => a.order_index - b.order_index) // S'assurer que l'ordre est respecté
                  .map((section, index) => (
                  <AccordionItem value={section.id} key={section.id} className="border border-neutral-200 rounded-lg bg-white">
                    <AccordionTrigger className="p-4 hover:no-underline text-left">
                      <div className="flex justify-between items-center w-full">
                        <span className="font-medium flex-1 truncate pr-2">{section.title}</span>
                        <div className="flex gap-1 items-center" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-7 w-7"
                            disabled={index === 0}
                            onClick={() => handleMoveSection(section.id, 'up')}
                            title="Monter la section"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-7 w-7"
                            disabled={index === (currentTemplate?.template_sections?.length ?? 0) - 1}
                            onClick={() => handleMoveSection(section.id, 'down')}
                            title="Descendre la section"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-red-500 hover:text-red-600 h-7 w-7"
                            onClick={() => handleDeleteSection(section.id)}
                            title="Supprimer la section"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 pt-0 border-t border-neutral-200/60">
                      <div className="text-sm text-neutral-700 mb-2 mt-3">
                        <strong className="text-neutral-800">Instructions:</strong>
                        <p className="mt-1 whitespace-pre-wrap">{section.instructions}</p>
                      </div>
                      {section.example && (
                        <div className="text-sm text-neutral-700">
                          <strong className="text-neutral-800">Exemple:</strong>
                          <p className="mt-1 whitespace-pre-wrap bg-neutral-50 p-2 rounded-md border border-neutral-200">{section.example}</p>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center text-neutral-500 py-6 my-4 border border-dashed rounded-lg">
                Aucune section définie. Ajoutez votre première section ci-dessous.
              </div>
            )}
            
            {/* Formulaire d'ajout de section ou Bouton pour afficher le formulaire */}
            {isAddingSection ? (
              <div className="border-t border-neutral-200 pt-6 mt-6">
                <h3 className="font-medium mb-4 text-lg">Ajouter une nouvelle section</h3>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="sectionTitle">Titre de la section</Label>
                    <Input
                      id="sectionTitle"
                      value={newSection.title}
                      onChange={(e) => setNewSection({...newSection, title: e.target.value})}
                      placeholder="Introduction"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="instructions">Instructions</Label>
                    <Textarea
                      id="instructions"
                      value={newSection.instructions}
                      onChange={(e) => setNewSection({...newSection, instructions: e.target.value})}
                      placeholder="Instructions pour générer cette section..."
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="example">Exemple (optionnel)</Label>
                    <Textarea
                      id="example"
                      value={newSection.example}
                      onChange={(e) => setNewSection({...newSection, example: e.target.value})}
                      placeholder="Exemple de contenu pour cette section..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => {
                      setIsAddingSection(false);
                      setNewSection({ title: '', instructions: '', example: '' }); // Réinitialiser les champs
                    }}>
                      Annuler
                    </Button>
                    <Button onClick={handleAddSection}>
                      <Plus className="h-4 w-4 mr-2" />
                      Enregistrer la section
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 pt-6 border-t border-neutral-200">
                <Button 
                  onClick={() => setIsAddingSection(true)} 
                  className="w-full" // La variante par défaut utilisera la couleur primaire (orange)
                > 
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une section
                </Button>
              </div>
            )}
            </div> {/* Closes <div className="border-t border-neutral-200 pt-6"> started before h3 "Sections du rapport" */}
          </div> {/* Closes <div className="py-4 space-y-6"> */}
          
          <DialogFooter className="mt-4 pt-4 border-t border-neutral-200">
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              // Pour annuler les changements non sauvegardés du titre/description, 
              // il faudrait re-fetch le template ou garder une copie originale.
              // Pour l'instant, la fermeture simple sans sauvegarde ne réinitialise pas currentTemplate aux valeurs d'origine.
              // L'utilisateur devra cliquer sur "Enregistrer" pour persister.
              // Ou, on peut réinitialiser currentTemplate à sa valeur avant ouverture de la modale si on la stocke.
              // Pour l'instant, on ne fait que fermer.
              setIsAddingSection(false); 
              setNewSection({ title: '', instructions: '', example: '' }); 
            }}>
              Annuler
            </Button>
            <Button onClick={handleUpdateTemplateDetails}>
              Enregistrer les modifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ce template ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible et supprimera définitivement le template "{templateToDelete?.title}".
              Les sections associées seront également supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTemplateToDelete(null)}>Non</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTemplate}
              className={buttonVariants({ variant: "destructive" })}
            >
              Oui, supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Templates;
