import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useReports, Report } from '../hooks/useReports';
import { Button } from '../components/ui/button'; // Ajustement du chemin
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'; // Ajustement du chemin
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'; // Ajustement du chemin
import { MoreHorizontal, PlusCircle, Trash2, Link as LinkIcon, FileText, Plus } from 'lucide-react'; // Ajout de FileText et Plus
// Importer Dialog pour les modales d'ajout/liaison
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '../components/ui/dialog'; // Ajustement du chemin
import { Input } from '../components/ui/input'; // Ajustement du chemin
import { Label } from '../components/ui/label'; // Ajustement du chemin
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu'; // Ajustement du chemin
import { useProjects } from '../hooks/useProjects'; // Pour lister les projets dans le formulaire de liaison

const ReportsPage: React.FC = () => {
  const {
    filteredReports,
    projectFilter,
    setProjectFilter,
    clientFilter, // Ajouté pour la cohérence, même si non utilisé dans les filtres UI pour l'instant
    setClientFilter, // Ajouté pour la cohérence
    sortOrder,
    setSortOrder,
    isLoading,
    fetchReports, // Pour rafraîchir après une action
    addReport,
    deleteReport,
    linkReportToProject,
  } = useReports();

  const { projects: allProjects } = useProjects(); // Pour la sélection de projet lors de la liaison

  const [isAddReportDialogOpen, setIsAddReportDialogOpen] = useState(false);
  const [isLinkReportDialogOpen, setIsLinkReportDialogOpen] = useState(false);
  const [selectedReportToLink, setSelectedReportToLink] = useState<Report | null>(null);
  const [selectedProjectIdToLink, setSelectedProjectIdToLink] = useState<string>('');
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reportTitle, setReportTitle] = useState<string>('');


  const handleAddReport = async () => {
    if (!reportTitle || !reportFile) {
      // Idéalement, utiliser useToast ici si disponible globalement ou passé en prop
      alert("Le titre et le fichier du rapport sont requis.");
      return;
    }
    await addReport({ title: reportTitle, reportFile: reportFile, projectId: selectedProjectIdToLink || undefined });
    setIsAddReportDialogOpen(false);
    setReportFile(null);
    setReportTitle('');
    setSelectedProjectIdToLink('');
    // fetchReports() est déjà appelé dans addReport après succès
  };

  const handleDeleteReport = async (reportId: string) => {
    await deleteReport(reportId);
    // fetchReports() est déjà appelé dans deleteReport après succès
  };

  const handleLinkReport = async () => {
    if (selectedReportToLink && selectedProjectIdToLink) {
      await linkReportToProject(selectedReportToLink.id, selectedProjectIdToLink);
      setIsLinkReportDialogOpen(false);
      setSelectedReportToLink(null);
      setSelectedProjectIdToLink('');
      // fetchReports() est déjà appelé dans linkReportToProject après succès
    }
  };
  
  // Récupérer la liste des projets uniques pour le filtre
  const uniqueProjects = Array.from(new Set(filteredReports.map(r => r.projectId)))
    .map(id => ({
      id: id,
      name: filteredReports.find(r => r.projectId === id)?.projectName || 'Projet Inconnu'
    }));

  // Récupérer la liste des clients uniques pour le filtre
  const uniqueClients = Array.from(new Set(filteredReports.map(r => r.clientName)))
    .map(name => ({ name: name }));


  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <p>Chargement des rapports...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="page-title">Mes Rapports</h1>
        <Dialog open={isAddReportDialogOpen} onOpenChange={setIsAddReportDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Ajouter un rapport
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau rapport</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="reportTitleInput">Titre du rapport</Label>
                <Input 
                  id="reportTitleInput" 
                  placeholder="Ex: Rapport de diagnostic PEMD..." 
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="reportFile">Fichier du rapport</Label>
                <div
                  className="border-2 border-dashed border-neutral-300 rounded-md p-6 text-center"
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      setReportFile(e.dataTransfer.files[0]);
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <input
                    id="reportFile"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" // Spécifier les types de fichiers acceptés
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setReportFile(e.target.files[0]);
                      }
                    }}
                  />
                  <label 
                    htmlFor="reportFile"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <Plus className="h-8 w-8 text-neutral-400 mb-2" />
                    <span className="text-sm text-neutral-600 mb-1">
                      {reportFile ? reportFile.name : "Glissez-déposez votre fichier ici"}
                    </span>
                    {!reportFile && (
                      <span className="text-xs text-neutral-500">
                        ou cliquez pour parcourir
                      </span>
                    )}
                  </label>
                </div>
                {reportFile && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setReportFile(null)}
                    className="text-xs text-red-500 self-start"
                  >
                    Supprimer le fichier
                  </Button>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="reportProjectSelect">Projet associé (Optionnel)</Label>
                {allProjects && allProjects.length > 0 ? (
                  <Select value={selectedProjectIdToLink} onValueChange={setSelectedProjectIdToLink}>
                    <SelectTrigger id="reportProjectSelect">
                    <SelectValue placeholder="Sélectionner un projet" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* <SelectItem value="">Aucun projet</SelectItem>  Retiré car cause une erreur Radix UI */}
                    {allProjects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title} ({project.client || 'Client non spécifié'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-neutral-500">Chargement des projets...</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsAddReportDialogOpen(false);
                setReportFile(null);
                setReportTitle('');
                setSelectedProjectIdToLink('');
              }}>Annuler</Button>
              <Button onClick={handleAddReport} disabled={!reportFile || !reportTitle}>Ajouter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtres */}
      <div className="flex gap-4 mb-6">
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par projet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les projets</SelectItem>
            {uniqueProjects.map(project => (
              <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les clients</SelectItem>
            {uniqueClients.map(client => (
              <SelectItem key={client.name} value={client.name}>{client.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Plus récents</SelectItem>
            <SelectItem value="oldest">Plus anciens</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto text-sm text-neutral-500">
          {filteredReports.length} rapport{filteredReports.length > 1 ? 's' : ''} trouvé{filteredReports.length > 1 ? 's' : ''}
        </div>
      </div>

      {filteredReports.length === 0 && !isLoading ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-neutral-400" />
          <h3 className="mt-2 text-sm font-medium text-neutral-900">Aucun rapport trouvé</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Commencez par ajouter un nouveau rapport.
          </p>
          {/* On pourrait réutiliser le DialogTrigger ici si besoin */}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre du Rapport</TableHead>
              <TableHead>Projet Associé</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date de dépôt</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-medium">{report.title}</TableCell>
                <TableCell>{report.projectName}</TableCell>
                <TableCell>{report.clientName}</TableCell>
                <TableCell>{report.date}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Ouvrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => window.open(report.url, '_blank')} disabled={!report.url}>
                        Voir le document
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSelectedReportToLink(report);
                        setIsLinkReportDialogOpen(true);
                      }}>
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Lier/Modifier Projet
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteReport(report.id)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Dialog de liaison de rapport à un projet */}
      <Dialog open={isLinkReportDialogOpen} onOpenChange={setIsLinkReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lier le rapport "{selectedReportToLink?.title}" à un projet</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="linkProject">Sélectionner un projet</Label>
              {allProjects && allProjects.length > 0 ? (
                <Select 
                  defaultValue={selectedReportToLink?.projectId}
                  onValueChange={setSelectedProjectIdToLink}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un projet" />
                  </SelectTrigger>
                  <SelectContent>
                    {allProjects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title} ({project.client || 'Client non spécifié'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-neutral-500">Chargement des projets...</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkReportDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleLinkReport}>Lier le rapport</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </MainLayout>
  );
};

export default ReportsPage;
