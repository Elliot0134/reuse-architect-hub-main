import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; // Importer Badge
import { Briefcase, FileText, LayoutDashboard, LineChart as LucideLineChart, PieChartIcon, PlusCircle, Settings, Users, Loader2, FolderPlus, FileUp, LayoutTemplate, FolderKanban } from 'lucide-react'; // Ajout de FolderKanban, LineChart renommé en LucideLineChart
import { useProjects } from '@/hooks/useProjects';
import { useReports } from '@/hooks/useReports';
import { createClient } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import MainLayout from '@/layouts/MainLayout'; // Importer MainLayout

const projectStatusTranslations: { [key: string]: string } = {
  draft: "Brouillon",
  in_progress: "En cours",
  completed: "Terminé",
  pending: "En attente",
  archived: "Archivé",
};

const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'completed':
      return 'default'; // Vert (par défaut dans le thème, ou à styliser)
    case 'in_progress':
      return 'secondary'; // Bleu/gris
    case 'pending':
      return 'outline'; // Orange/jaune (avec bordure)
    case 'draft':
      return 'outline'; // Gris clair (avec bordure)
    case 'archived':
      return 'destructive'; // Rouge/gris foncé
    default:
      return 'outline';
  }
};

const DashboardPage: React.FC = () => {
  const { projects, isLoading: isLoadingProjects } = useProjects();
  const { reports, isLoading: isLoadingReports } = useReports();

  const kpiData = useMemo(() => {
    const totalProjects = projects.length;
    const projectsInProgress = projects.filter(p => p.status === 'in_progress').length;
    const totalReports = reports.length;
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const reportsThisMonth = reports.filter(r => {
      const dateParts = r.date.split('/');
      if (dateParts.length !== 3) return false; // Gérer les dates mal formatées
      const [day, month, year] = dateParts.map(Number);
      // Les mois dans JavaScript sont 0-indexés (0 pour Janvier, 11 pour Décembre)
      return month - 1 === currentMonth && year === currentYear;
    }).length;

    return [
      { title: 'Projets Totals', value: totalProjects.toString(), icon: FolderKanban, description: 'Nombre total de projets gérés', isLoading: isLoadingProjects },
      { title: 'Projets en Cours', value: projectsInProgress.toString(), icon: FolderKanban, description: 'Projets avec statut "en cours"', isLoading: isLoadingProjects },
      { title: 'Rapports Générés (Mois)', value: reportsThisMonth.toString(), icon: FileText, description: 'Rapports créés ce mois-ci', isLoading: isLoadingReports },
      { title: 'Nombre Total de Rapports', value: totalReports.toString(), icon: FileText, description: 'Total des rapports générés', isLoading: isLoadingReports },
    ];
  }, [projects, reports, isLoadingProjects, isLoadingReports]);

  const recentProjectsData = useMemo(() => {
    return [...projects]
      .sort((a, b) => {
        const dateA = new Date(a.date.split('/').reverse().join('-')).getTime();
        const dateB = new Date(b.date.split('/').reverse().join('-')).getTime();
        return dateB - dateA;
      })
      .slice(0, 3);
  }, [projects]);
  
  const projectStatusData = useMemo(() => {
    const counts: { [key: string]: number } = {
      draft: 0,
      in_progress: 0,
      completed: 0,
      pending: 0,
      archived: 0,
    };
    projects.forEach(p => {
      if (p.status && counts[p.status] !== undefined) {
        counts[p.status]++;
      } else if (p.status) { // Pour les statuts non prévus, on les ajoute dynamiquement
        counts[p.status] = 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [projects]);

  // Couleurs pour le PieChart, alignées thématiquement avec les badges de statut
  const STATUS_CHART_COLORS: { [key: string]: string } = {
    draft: '#b4b4b4',       // Gris moyen (neutral-400)
    in_progress: '#3B82F6', // Bleu vif (blue-500)
    completed: '#10B981',   // Vert vif (green-500)
    pending: '#F59E0B',     // Orange/Ambre vif (amber-500)
    archived: '#9a9a9a',    // Gris foncé (neutral-500)
    default: '#cccccc'      // Couleur par défaut si statut inconnu
  };

  interface ActivityItem {
    id: string;
    type: 'project' | 'report';
    title: string;
    date: string; // Format DD/MM/YYYY
    timestamp: number;
    actionText: string;
    link?: string;
  }

  const recentActivityData = useMemo(() => {
    const projectActivities: ActivityItem[] = projects.map(p => ({
      id: `proj-${p.id}`,
      type: 'project',
      title: p.title,
      date: p.date,
      timestamp: new Date(p.date.split('/').reverse().join('-')).getTime(),
      actionText: `Projet ${p.status === 'draft' ? 'créé' : 'mis à jour'}: `, // Simplification
      link: `/project/${p.id}`
    }));

    const reportActivities: ActivityItem[] = reports.map(r => ({
      id: `rep-${r.id}`,
      type: 'report',
      title: r.title,
      date: r.date,
      timestamp: new Date(r.date.split('/').reverse().join('-')).getTime(),
      actionText: 'Rapport généré: ',
      link: r.url // Ou lien vers une page de détail du rapport si elle existe
    }));

    return [...projectActivities, ...reportActivities]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
  }, [projects, reports]);

  const reportsByMonthData = useMemo(() => {
    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    const today = new Date();
    const data: { name: string; rapports: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = monthNames[date.getMonth()];
      const year = date.getFullYear();
      const monthKey = `${monthName} ${year}`;
      
      const count = reports.filter(r => {
        const reportDateParts = r.date.split('/');
        if (reportDateParts.length !== 3) return false;
        const reportDate = new Date(Number(reportDateParts[2]), Number(reportDateParts[1]) - 1, Number(reportDateParts[0]));
        return reportDate.getMonth() === date.getMonth() && reportDate.getFullYear() === date.getFullYear();
      }).length;

      data.push({ name: monthKey, rapports: count });
    }
    return data;
  }, [reports]);

  const recentReportsData = useMemo(() => {
    return [...reports]
    .sort((a, b) => {
      const dateA = new Date(a.date.split('/').reverse().join('-')).getTime();
      const dateB = new Date(b.date.split('/').reverse().join('-')).getTime();
      return dateB - dateA;
    })
    .slice(0, 3);
  }, [reports]);

  return (
    <MainLayout>
      <div className="container mx-auto p-0 space-y-8"> {/* Ajustement du padding car MainLayout en a déjà */}
        <div>
          {/* Le titre de la page est généralement géré par le Header dans MainLayout, 
              mais on peut garder un titre spécifique ici si besoin ou le remonter dans Header via une prop.
              Pour l'instant, on le garde simple.
          */}
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Tableau de Bord</h1>
        <p className="text-gray-600 dark:text-gray-400">Vue d'ensemble de votre activité et de vos projets.</p>
      </div>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Actions Rapides</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 mb-8"> {/* Ajout de mb-8 pour l'espacement */}
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white text-base py-6">
            <Link to="/"> 
              <FolderPlus className="mr-2 h-5 w-5" /> Créer un Nouveau Projet
            </Link>
          </Button>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white text-base py-6">
            <Link to="/templates">
              <LayoutTemplate className="mr-2 h-5 w-5" /> Créer une template
            </Link>
          </Button>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white text-base py-6">
            <Link to="/">
              <FileUp className="mr-2 h-5 w-5" /> Importer un Document
            </Link>
          </Button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Indicateurs Clés</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiData.map((kpi, index) => (
            <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary">{kpi.title}</CardTitle>
                {kpi.isLoading ? <Loader2 className="h-5 w-5 text-muted-foreground text-primary animate-spin" /> : <kpi.icon className="h-5 w-5 text-muted-foreground text-primary" />}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-800 dark:text-white">{kpi.isLoading ? '...' : kpi.value}</div>
                <p className="text-xs text-muted-foreground dark:text-gray-400">{kpi.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Projets Récents</h2>
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              {isLoadingProjects ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              ) : recentProjectsData.length > 0 ? (
                <ul className="space-y-3">
                  {recentProjectsData.map(project => (
                    <li key={project.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-neutral-800 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors">
                      <div className="flex-grow">
                        <p className="font-semibold text-primary">{project.title}</p>
                        <p className="text-xs text-muted-foreground">{project.date}</p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(project.status)} className="ml-auto mr-2 whitespace-nowrap">
                        {projectStatusTranslations[project.status] || project.status}
                      </Badge>
                      <Button asChild variant="outline" size="sm" className="text-primary border-primary hover:bg-primary hover:text-white">
                        <Link to={`/project/${project.id}`}>Voir</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">Aucun projet récent.</p>
              )}
              <Button asChild variant="link" className="mt-4 text-primary p-0">
                <Link to="/">Voir tous les projets →</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Répartition des Projets par Statut</h2>
          <Card className="shadow-lg">
            <CardContent className="pt-6 h-[300px]">
              {isLoadingProjects ? (
                 <div className="flex items-center justify-center h-full">
                   <Loader2 className="h-8 w-8 text-primary animate-spin" />
                 </div>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-neutral-800 rounded-md">
                  {projectStatusData.filter(d => d.value > 0).length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={projectStatusData.filter(d => d.value > 0)} 
                          dataKey="value" 
                          nameKey="name" 
                          cx="50%" 
                          cy="50%" 
                          outerRadius={80} 
                          labelLine={false} // On va dessiner notre propre ligne de label
                          label={(props) => {
                            const { cx, cy, midAngle, outerRadius, percent, index, name, value } = props;
                            const RADIAN = Math.PI / 180;
                            // Position de départ de la ligne (sur le bord du segment)
                            const sx = cx + (outerRadius - 10) * Math.cos(-midAngle * RADIAN);
                            const sy = cy + (outerRadius - 10) * Math.sin(-midAngle * RADIAN);
                            // Position de fin de la ligne (un peu plus loin)
                            const mx = cx + (outerRadius + 20) * Math.cos(-midAngle * RADIAN);
                            const my = cy + (outerRadius + 20) * Math.sin(-midAngle * RADIAN);
                            // Position du texte du label (encore un peu plus loin)
                            const ex = mx + (Math.cos(-midAngle * RADIAN) > 0 ? 1 : -1) * 12; // Ajuste l'espacement horizontal du texte
                            const ey = my;
                            const textAnchor = Math.cos(-midAngle * RADIAN) > 0 ? 'start' : 'end';
                            const translatedName = projectStatusTranslations[name] || name;
                            // Utiliser STATUS_CHART_COLORS pour la ligne et le point du label
                            const color = STATUS_CHART_COLORS[name] || STATUS_CHART_COLORS.default;

                            if (value === 0) return null; // Ne pas afficher de label pour les segments nuls

                            return (
                              <g>
                                <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={color} fill="none" strokeWidth={1.5}/>
                                <circle cx={sx} cy={sy} r={2} fill={color} stroke="none" />
                                <text x={ex + (Math.cos(-midAngle * RADIAN) > 0 ? 3 : -3)} y={ey} textAnchor={textAnchor} fill="#333" dominantBaseline="central" fontSize="11px" fontWeight="500">
                                  {`${translatedName} (${value})`}
                                </text>
                              </g>
                            );
                          }}
                        >
                          {projectStatusData.filter(d => d.value > 0).map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={STATUS_CHART_COLORS[entry.name] || STATUS_CHART_COLORS.default} strokeWidth={2} stroke="#FFFFFF"/>
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} (${projectStatusTranslations[name] || name})`]} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <PieChartIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                      <p className="ml-2 text-muted-foreground">Aucune donnée pour le graphique.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Activité Récente</h2>
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            {(isLoadingProjects || isLoadingReports) && !recentActivityData.length ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            ) : recentActivityData.length > 0 ? (
              <ul className="space-y-4">
                {recentActivityData.map(activity => (
                  <li key={activity.id} className="border-l-4 border-primary pl-4 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors rounded-r-md">
                    <p className="text-sm">
                      <span className="font-semibold">{activity.actionText}</span>
                      {activity.link && activity.type === 'project' ? (
                        <Link to={activity.link} className="text-primary hover:underline">{activity.title}</Link>
                      ) : activity.link && activity.type === 'report' && activity.link.startsWith('http') ? (
                        <a href={activity.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{activity.title}</a>
                      ) : (
                        <span className="text-primary">{activity.title}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">Le {activity.date}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">Aucune activité récente à afficher.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Derniers Rapports Générés</h2>
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              {isLoadingReports ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              ) : recentReportsData.length > 0 ? (
                <ul className="space-y-3">
                  {recentReportsData.map(report => (
                    <li key={report.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-neutral-800 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors">
                      <div>
                        <p className="font-semibold text-primary">{report.title}</p>
                        <p className="text-sm text-muted-foreground">Généré le: {report.date}</p>
                      </div>
                      {/* TODO: Déterminer l'action pour "Ouvrir" un rapport. Peut-être un lien vers le document si URL existe, ou vers une page de détail du rapport. */}
                      <Button variant="outline" size="sm" className="text-primary border-primary hover:bg-primary hover:text-white" onClick={() => report.url && window.open(report.url, '_blank')}>Ouvrir</Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">Aucun rapport récent.</p>
              )}
              <Button asChild variant="link" className="mt-4 text-primary p-0">
                <Link to="/reports">Voir tous les rapports →</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Suivi des Rapports</h2>
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              {/* Espace pour statistiques futures sur les rapports si besoin */}
              <div className="mt-6 h-[250px] bg-gray-50 dark:bg-neutral-800 rounded-md p-4">
                {isLoadingReports ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                ) : reportsByMonthData.some(d => d.rapports > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={reportsByMonthData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis allowDecimals={false} fontSize={12} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '14px' }} />
                      <Line type="monotone" dataKey="rapports" stroke="#eb661a" strokeWidth={2} activeDot={{ r: 6 }} name="Rapports créés" />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <LucideLineChart className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                    <p className="ml-2 text-muted-foreground">Pas de données pour le graphique d'évolution.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section Actions Rapides a été déplacée vers le haut */}
    </div>
    </MainLayout>
  );
};

export default DashboardPage;
