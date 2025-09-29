'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getActivePlan } from '@/lib/firebase/firestore';
import type { TrainingPlan } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Dumbbell, PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
    const { user } = useAuth();
    const [activePlan, setActivePlan] = useState<TrainingPlan | null | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const unsubscribe = async () => {
                const plan = await getActivePlan(user.uid);
                setActivePlan(plan);
                setLoading(false);
            };
            unsubscribe();
        }
    }, [user]);

    if (loading) {
        return <DashboardLoadingSkeleton />;
    }

    return (
        <div className="container mx-auto">
            <h1 className="mb-6 text-3xl font-bold font-headline">Panel de control</h1>
            {activePlan ? (
                <CurrentPlan plan={activePlan} />
            ) : (
                <NoPlan />
            )}
        </div>
    );
}

function CurrentPlan({ plan }: { plan: TrainingPlan }) {
    const days = Object.keys(plan.exercisesByDay).sort((a, b) => {
        const numA = parseInt(a.replace(/[^0-9]/g, ''));
        const numB = parseInt(b.replace(/[^0-9]/g, ''));
        return numA - numB;
    });
    return (
        <div>
            <h2 className="mb-4 text-2xl font-semibold font-headline">Tu plan actual: {plan.name}</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {days.map(day => (
                    <Link href={`/workout/${day.replace(/ /g, '-').toLowerCase()}`} key={day} passHref>
                        <Card className="flex h-48 transform flex-col items-center justify-center p-6 text-center transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-xl hover:border-primary">
                            <Dumbbell className="mb-4 h-12 w-12 text-primary" />
                            <CardTitle className="font-headline text-xl">{day}</CardTitle>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}

function NoPlan() {
    return (
        <Card className="text-center">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">No se encontró un plan activo</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 p-8">
                <p className="text-muted-foreground">Parece que todavía no tenés un plan de entrenamiento.</p>
                <Link href="/import" passHref>
                    <Button size="lg">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Importá tu primer plan
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}

function DashboardLoadingSkeleton() {
    return (
        <div className="container mx-auto">
            <Skeleton className="mb-6 h-9 w-1/3" />
            <Skeleton className="mb-4 h-8 w-1/2" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="flex h-48 flex-col items-center justify-center p-6">
                        <Skeleton className="mb-4 h-12 w-12 rounded-full" />
                        <Skeleton className="h-7 w-24" />
                    </Card>
                ))}
            </div>
        </div>
    );
}
