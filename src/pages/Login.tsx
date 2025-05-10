
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Ici, on simulerait une connexion réelle avec Supabase
    try {
      // Simulation d'une attente d'API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // En production, on utiliserait Supabase ici
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', email);
      
      toast({
        title: "Connexion réussie",
        description: `Bienvenue, ${email}`,
      });
      
      navigate('/');
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: "Identifiants incorrects",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userEmail', 'demo@hackathon.fr');
    toast({
      title: "Mode démo activé",
      description: "Vous naviguez maintenant en mode démo",
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-800">RAEDIFICARE</h1>
          <p className="text-neutral-600 mt-2">Plateforme de diagnostic et gestion de matériaux de réemploi</p>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-md border border-neutral-200">
          <h2 className="text-2xl font-semibold mb-6 text-center">Connexion</h2>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              style={{ backgroundColor: '#eb661a' }}
            >
              {isLoading ? 'Connexion en cours...' : 'Se connecter'}
            </Button>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-neutral-500">ou</span>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full mt-4" 
              onClick={handleDemoLogin}
            >
              Démo Hackaton
            </Button>
          </div>
          
          <p className="text-center text-neutral-500 mt-6 text-sm">
            Besoin d'un compte? <a href="#" className="text-primary font-medium">S'inscrire</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
