'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { ExerciseLog } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Legend } from 'recharts';
import { format } from 'date-fns';

type ExerciseData = {
  date: string;
  weight: number;
};

const chartConfig = {
  weight: {
    label: "Weight (kg)",
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
      };
      const logsRef = collection(db, 'training_logs');
      const q = query(
        logsRef,
        where('userId', '==', user.uid),
        where('exerciseName', '==', selectedExercise),
        orderBy('date', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => {
        const log = doc.data() as ExerciseLog & { date: { toDate: () => Date } };
        return {
          date: format(log.date.toDate(), 'MMM d'),
          weight: log.weight,
        };
      });
      setExerciseData(data);
    }
    fetchExerciseData();
  }, [user, selectedExercise]);
  
  return (
    <div className="container mx-auto">
      <h1 className="mb-6 text-3xl font-bold font-headline">Your Progress</h1>
      <Card>
        <CardHeader>
          <CardTitle>Exercise Weight Progression</CardTitle>
          <CardDescription>Track how the weight you lift for each exercise has evolved over time.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select onValueChange={setSelectedExercise} value={selectedExercise} disabled={loading || exerciseList.length === 0}>
                <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Select an exercise" />
                </SelectTrigger>
                <SelectContent>
                    {exerciseList.map(ex => (
                        <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {exerciseData.length > 1 ? (
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
            ) : (
                <div className="flex h-[300px] w-full items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                    {loading ? "Loading..." : "Not enough data to display a chart. Log this exercise at least twice."}
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
