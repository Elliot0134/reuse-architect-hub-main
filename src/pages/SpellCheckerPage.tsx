import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import MainLayout from "@/layouts/MainLayout";
import { Copy } from "lucide-react"; // Importer l'icône Copy
import { useToast } from "@/hooks/use-toast"; // Importer useToast

const SpellCheckerPage: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [correctedText, setCorrectedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast(); // Initialiser toast

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(event.target.value);
  };

  const handleSubmit = async () => {
    if (!inputText.trim()) {
      setError("Veuillez entrer du texte à corriger.");
      setCorrectedText("");
      return;
    }
    setIsLoading(true);
    setError(null);
    setCorrectedText("");

    try {
      const response = await fetch("https://api.ia2s.app/webhook/raedificare/paragraph/correct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: inputText }), // Utilisation de 'text' ici
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Erreur inconnue du serveur" }));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      if (data.correction) {
        setCorrectedText(data.correction);
      } else {
        setError("La réponse de l'API ne contient pas de correction.");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Une erreur inattendue est survenue.");
      }
      console.error("Erreur lors de la correction:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="page-title">Correcteur d'orthographe</h1>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Section Texte à corriger */}
          <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm">
            <h2 className="text-lg font-medium mb-4">Texte à corriger</h2>
            <Textarea
              placeholder="Collez votre texte ici..."
              value={inputText}
              onChange={handleInputChange}
              rows={10}
              className="w-full p-2 border rounded" // Garder les styles existants ou ajuster
            />
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading} 
              className="mt-4 w-full"
              style={{ backgroundColor: '#eb661a' }} // Style du bouton comme dans GenerateContent
            >
              {isLoading ? "Correction en cours..." : "Valider"}
            </Button>
          </div>

          {/* Section Texte corrigé */}
          <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Texte corrigé</h2>
              {correctedText && !isLoading && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(correctedText);
                    toast({
                      title: "Copié !",
                      description: "Le texte corrigé a été copié dans le presse-papier.",
                    });
                  }}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copier
                </Button>
              )}
            </div>
            {error && <p className="text-red-500 mb-2">{error}</p>}
            <div
              className="p-4 border rounded bg-neutral-50 min-h-[240px] whitespace-pre-wrap overflow-y-auto"
            >
              {correctedText || (isLoading ? "" : "La correction apparaîtra ici.")}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SpellCheckerPage;
