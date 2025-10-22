'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase/config';
import type { ExerciseLog } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Legend } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type ExerciseData = {
  date: string;
  weight: number;
};

const chartConfig = {
  weight: {
    label: "Peso (kg)",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

export default function ProgressPage() {
  const { user } = useAuth();
  const [exerciseList, setExerciseList] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [exerciseData, setExerciseData] = useState<ExerciseData[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch list of all unique exercises logged by user
  useEffect(() => {
    async function fetchExercises() {
      if (!user) return;
      setLoading(true);
      const db = getFirebaseDb();
      const logsRef = collection(db, 'training_logs');
      const q = query(logsRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const uniqueExercises = new Set<string>();
      querySnapshot.forEach(doc => {
        uniqueExercises.add(doc.data().exerciseName);
      });
      const sortedExercises = Array.from(uniqueExercises).sort();
      setExerciseList(sortedExercises);
      if (sortedExercises.length > 0) {
        setSelectedExercise(sortedExercises[0]);
      }
      setLoading(false);
    }
    fetchExercises();
  }, [user]);

  // Fetch data for selected exercise
  useEffect(() => {
    async function fetchExerciseData() {
      if (!user || !selectedExercise) {
        setExerciseData([]);
        return;
      }

      try {
        const db = getFirebaseDb();
        const logsRef = collection(db, 'training_logs');
        // Removed orderBy to avoid requiring a composite index
        const q = query(
          logsRef,
          where('userId', '==', user.uid),
          where('exerciseName', '==', selectedExercise)
        );

        const querySnapshot = await getDocs(q);
        console.log(`Found ${querySnapshot.docs.length} logs for ${selectedExercise}`);

        // Map and sort data on client side
        const data = querySnapshot.docs
          .map(doc => {
            const log = doc.data();
            console.log('Log data:', log);

            // Validate that date exists and is a Timestamp
            if (!log.date || typeof log.date.toDate !== 'function') {
              console.error('Invalid date in log:', log);
              return null;
            }

            return {
              date: format(log.date.toDate(), 'd MMM', { locale: es }),
              weight: log.weight,
              timestamp: log.date.toDate().getTime(), // For sorting
            };
          })
          .filter((item): item is { date: string; weight: number; timestamp: number } => item !== null)
          .sort((a, b) => a.timestamp - b.timestamp) // Sort by timestamp
          .map(({ date, weight }) => ({ date, weight })); // Remove timestamp from final data

        console.log('Processed data:', data);
        setExerciseData(data);
      } catch (error) {
        console.error('Error fetching exercise data:', error);
        setExerciseData([]);
      }
    }
    fetchExerciseData();
  }, [user, selectedExercise]);
  
  return (
    <div className="container mx-auto">
      <h1 className="mb-6 text-3xl font-bold font-headline">Tu Progreso</h1>
      <Card>
        <CardHeader>
          <CardTitle>Progresión de Peso por Ejercicio</CardTitle>
          <CardDescription>Seguí cómo el peso que levantás en cada ejercicio evolucionó con el tiempo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select onValueChange={setSelectedExercise} value={selectedExercise} disabled={loading || exerciseList.length === 0}>
                <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Seleccioná un ejercicio" />
                </SelectTrigger>
                <SelectContent>
                    {exerciseList.map(ex => (
                        <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {exerciseData.length > 1 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {exerciseData.length} registros encontrados
                  </p>
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                      <LineChart data={exerciseData} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" />
                          <XAxis
                              dataKey="date"
                              tickLine={false}
                              axisLine={false}
                              tickMargin={8}
                          />
                          <YAxis
                              domain={['dataMin - 5', 'dataMax + 5']}
                              tickLine={false}
                              axisLine={false}
                              tickMargin={8}
                              tickFormatter={(value) => `${value} kg`}
                          />
                          <ChartTooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltipContent />} />
                          <Legend />
                          <Line
                              dataKey="weight"
                              type="monotone"
                              stroke="var(--color-weight)"
                              strokeWidth={3}
                              dot={{ fill: 'var(--color-weight)', r: 4 }}
                              activeDot={{ r: 8 }}
                          />
                      </LineChart>
                  </ChartContainer>
                </div>
            ) : (
                <div className="flex h-[300px] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-muted-foreground">
                    {loading ? (
                      <p>Cargando...</p>
                    ) : exerciseData.length === 0 ? (
                      <>
                        <p className="font-semibold">No hay datos registrados para este ejercicio</p>
                        <p className="text-sm">Registrá este ejercicio en tu entrenamiento para ver tu progreso</p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold">Solo hay 1 registro</p>
                        <p className="text-sm">Registrá este ejercicio al menos una vez más para ver el gráfico de progreso</p>
                      </>
                    )}
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
