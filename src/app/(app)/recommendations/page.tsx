'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
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
      toast({ title: 'Authentication Error', description: 'You must be logged in to get recommendations.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setRecommendations([]);

    try {
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
        toast({ title: 'Not Enough Data', description: 'Please log at least 5 exercises to receive personalized recommendations.', variant: 'destructive' });
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
        toast({ title: 'Analysis Complete', description: "The AI couldn't find any specific recommendations at this time. Keep up the good work!", });
        setHasGenerated(true);
      }

    } catch (error) {
      console.error("Error generating recommendations:", error);
      toast({ title: 'AI Error', description: 'An unexpected error occurred while generating recommendations.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl">
      <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold font-headline">AI Coach</h1>
        <Button onClick={handleGenerateRecommendations} disabled={loading} size="lg" className="w-full sm:w-auto">
          {loading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <BrainCircuit className="mr-2 h-5 w-5" />
          )}
          {loading ? 'Analyzing Your Progress...' : hasGenerated ? 'Regenerate Recommendations' : 'Generate Recommendations'}
        </Button>
      </div>

      {recommendations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <Sparkles className="text-accent" /> 
                Your Personalized Recommendations
            </CardTitle>
            <CardDescription>Based on your recent performance, here are some tips to improve your training.</CardDescription>
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
                <CardTitle className="font-headline text-2xl mt-4">Ready for your analysis?</CardTitle>
                <p className="max-w-md text-muted-foreground">
                    {hasGenerated ? "No new recommendations at this time. Keep logging your workouts!" : "Click 'Generate Recommendations' to get AI-powered insights on your training. Make sure you've logged some workouts first!"}
                </p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
