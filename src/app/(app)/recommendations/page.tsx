'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase/config';
import { generatePersonalizedRecommendations } from '@/ai/flows/generate-personalized-recommendations';
import type { ExerciseLog } from '@/lib/types';

export default function RecommendationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerateRecommendations = async () => {
    if (!user) {
      toast({ title: 'Error de autenticación', description: 'Tenés que iniciar sesión para obtener recomendaciones.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setRecommendations([]);

    try {
      const db = getFirebaseDb();
      const logsRef = collection(db, 'training_logs');
      const q = query(
        logsRef,
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const logs = querySnapshot.docs.map(doc => {
        const data = doc.data() as ExerciseLog;
        const date = (data.date as Timestamp).toDate();
        return { 
            ...data,
            date: date.toISOString(), // Serialize date for AI
            id: doc.id,
            planId: data.planId,
            userId: data.userId
         };
      });

      if (logs.length < 5) {
        toast({ title: 'Datos insuficientes', description: 'Por favor, registrá al menos 5 ejercicios para recibir recomendaciones personalizadas.', variant: 'destructive' });
        setLoading(false);
        return;
      }
      
      const logsJson = JSON.stringify(logs);

      const result = await generatePersonalizedRecommendations({
        progressData: logsJson,
        consistencyData: logsJson,
        trainingPatterns: logsJson,
      });

      if (result?.recommendations?.length) {
        setRecommendations(result.recommendations);
        setHasGenerated(true);
      } else {
        toast({ title: 'Análisis completo', description: "La IA no encontró ninguna recomendación específica en este momento. ¡Seguí así!", });
        setHasGenerated(true);
      }

    } catch (error) {
      console.error("Error al generar recomendaciones:", error);
      toast({ title: 'Error de IA', description: 'Ocurrió un error inesperado al generar las recomendaciones.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl">
      <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold font-headline">Coach IA</h1>
        <Button onClick={handleGenerateRecommendations} disabled={loading} size="lg" className="w-full sm:w-auto">
          {loading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <BrainCircuit className="mr-2 h-5 w-5" />
          )}
          {loading ? 'Analizando tu progreso...' : hasGenerated ? 'Volver a generar' : 'Generar recomendaciones'}
        </Button>
      </div>

      {recommendations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <Sparkles className="text-accent" /> 
                Tus recomendaciones personalizadas
            </CardTitle>
            <CardDescription>Basado en tu rendimiento reciente, acá tenés algunos consejos para mejorar tu entrenamiento.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {recommendations.map((rec, index) => (
                <li 
                  key={index} 
                  className="flex items-start gap-4 p-4 rounded-lg bg-background border animate-in fade-in-50" 
                  style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
                >
                  <div className="flex-shrink-0 mt-1 h-6 w-6 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-sm">
                    {index + 1}
                  </div>
                  <p className="flex-1 text-card-foreground/90">{rec}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center overflow-hidden">
            <CardContent className="flex flex-col items-center gap-4 p-8">
                <div className="p-6 bg-accent/10 rounded-full">
                    <BrainCircuit className="h-16 w-16 text-accent" />
                </div>
                <CardTitle className="font-headline text-2xl mt-4">¿Listo para tu análisis?</CardTitle>
                <p className="max-w-md text-muted-foreground">
                    {hasGenerated ? "No hay nuevas recomendaciones por ahora. ¡Seguí registrando tus entrenamientos!" : "Hacé clic en 'Generar recomendaciones' para obtener consejos de la IA sobre tu entrenamiento. ¡Asegurate de haber registrado algunos entrenamientos primero!"}
                </p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
