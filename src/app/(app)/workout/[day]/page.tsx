'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getActivePlan, getExercisesForDay, logExercise, getCompletedExercisesThisWeek, getMaxWeightsForExercises } from '@/lib/firebase/firestore';
import type { TrainingPlan } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

type ExerciseState = {
  name: string;
  weight: string;
  reps: string;
  isCompleted: boolean;
  maxWeight?: number;
};

export default function WorkoutPage({ params }: { params: Promise<{ day: string }> }) {
  const { day } = use(params);
  const { user } = useAuth();
  const { toast } = useToast();
  const [exercises, setExercises] = useState<ExerciseState[]>([]);
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorkout() {
      if (!user) return;
      try {
        const activePlan = await getActivePlan(user.uid);
        if (activePlan) {
          setPlan(activePlan);
          const exerciseList = await getExercisesForDay(activePlan.id, day);
          if (exerciseList && Array.isArray(exerciseList)) {
            // Get completed exercises this week
            const completedThisWeek = await getCompletedExercisesThisWeek(user.uid, activePlan.id, day);
            // Get max weights for all exercises
            const maxWeights = await getMaxWeightsForExercises(user.uid, exerciseList);
            setExercises(exerciseList.map(name => ({
              name,
              weight: '',
              reps: '',
              isCompleted: completedThisWeek.has(name),
              maxWeight: maxWeights[name]
            })));
          }
        }
      } catch (error) {
        console.error("Error al buscar el entrenamiento:", error);
        toast({ title: "Error", description: "No se pudo cargar tu entrenamiento.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    fetchWorkout();
  }, [user, day, toast]);
  
  const handleInputChange = (index: number, field: 'weight' | 'reps', value: string) => {
    const newExercises = [...exercises];
    newExercises[index][field] = value;
    setExercises(newExercises);
  };

  const handleComplete = async (index: number) => {
    if (!user || !plan) return;
    
    const exercise = exercises[index];
    if (!exercise.weight || !exercise.reps) {
        toast({ title: "Datos incompletos", description: "Por favor, ingresá el peso y las repeticiones.", variant: "destructive"});
        return;
    }

    try {
        await logExercise({
            userId: user.uid,
            planId: plan.id,
            day: day,
            exerciseName: exercise.name,
            weight: parseFloat(exercise.weight),
            reps: parseInt(exercise.reps)
        });

        const newExercises = [...exercises];
        newExercises[index].isCompleted = true;
        setExercises(newExercises);

        toast({ title: "¡Éxito!", description: `${exercise.name} registrado.` });
    } catch (error) {
        toast({ title: "Error", description: "No se pudo registrar el ejercicio.", variant: "destructive"});
    }
  };

  if (loading) return <WorkoutLoadingSkeleton />;
  if (!plan) return <div className="text-center text-muted-foreground">No se pudo encontrar tu plan activo.</div>;
  if (exercises.length === 0) return <div className="text-center text-muted-foreground">No se encontraron ejercicios para este día.</div>

  const pendingExercises = exercises.filter(e => !e.isCompleted);
  const completedExercises = exercises.filter(e => e.isCompleted);
  const dayTitle = day.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="container mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold font-headline">{dayTitle}</h1>
      <div className="space-y-6">
        {pendingExercises.map((exercise, idx) => {
            const originalIndex = exercises.findIndex(e => e.name === exercise.name);
            return (
                <ExerciseCard key={exercise.name} exercise={exercise} index={originalIndex} onComplete={handleComplete} onInputChange={handleInputChange} />
            )
        })}

        {completedExercises.length > 0 && (
          <div>
            <h2 className="my-8 text-xl font-semibold text-center text-accent">Completados</h2>
            <div className="space-y-6">
                {completedExercises.map((exercise, idx) => {
                    const originalIndex = exercises.findIndex(e => e.name === exercise.name);
                    return (
                        <ExerciseCard key={exercise.name} exercise={exercise} index={originalIndex} onComplete={handleComplete} onInputChange={handleInputChange} />
                    )
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ExerciseCard({ exercise, index, onComplete, onInputChange }: { exercise: ExerciseState, index: number, onComplete: (index: number) => Promise<void>, onInputChange: (index: number, field: 'weight' | 'reps', value: string) => void }) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handlePressComplete = async () => {
        setIsSubmitting(true);
        await onComplete(index);
        // No need to set isSubmitting to false, as the component will re-render as completed.
    }

    return (
        <Card className={exercise.isCompleted ? 'border-2 border-accent bg-accent/10' : ''}>
            <CardHeader>
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-headline text-2xl">{exercise.name}</CardTitle>
                    {exercise.maxWeight && (
                        <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
                            <Trophy className="h-3 w-3" />
                            {exercise.maxWeight} kg
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor={`weight-${index}`} className="text-base">Peso (kg)</Label>
                        <Input id={`weight-${index}`} type="number" value={exercise.weight} onChange={e => onInputChange(index, 'weight', e.target.value)} className="h-16 text-center text-3xl font-bold" disabled={exercise.isCompleted || isSubmitting} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`reps-${index}`} className="text-base">Reps</Label>
                        <Input id={`reps-${index}`} type="number" value={exercise.reps} onChange={e => onInputChange(index, 'reps', e.target.value)} className="h-16 text-center text-3xl font-bold" disabled={exercise.isCompleted || isSubmitting} />
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                {!exercise.isCompleted ? (
                    <Button onClick={handlePressComplete} size="lg" className="w-full py-7 text-lg" disabled={isSubmitting}>
                         {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        Marcar como completado
                    </Button>
                ) : (
                    <div className="flex w-full items-center justify-center gap-2 py-4 text-accent font-semibold">
                        <CheckCircle className="h-6 w-6"/>
                        <span className="text-lg">Completado</span>
                    </div>
                )}
            </CardFooter>
        </Card>
    )
}

function WorkoutLoadingSkeleton() {
    return (
        <div className="container mx-auto max-w-2xl">
            <Skeleton className="mb-6 h-9 w-1/3" />
            <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-8 w-3/4" />
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-20" />
                                    <Skeleton className="h-16 w-full" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-16" />
                                    <Skeleton className="h-16 w-full" />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                           <Skeleton className="h-14 w-full" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
