'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { analyzeImportedPlan } from '@/ai/flows/analyze-imported-plan';
import { collection, writeBatch, query, where, getDocs, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Loader2, Upload } from 'lucide-react';
import { addDays } from 'date-fns';

export default function ImportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [planName, setPlanName] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file || !planName || !user) {
      toast({ title: 'Error', description: 'Por favor, dale un nombre al plan y seleccioná un archivo.', variant: 'destructive' });
      return;
    }
    setIsImporting(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const dataUri = reader.result as string;
        
        try {
            const analysis = await analyzeImportedPlan({ xlsxDataUri: dataUri });

            const batch = writeBatch(db);

            const plansRef = collection(db, 'plans');
            const q = query(plansRef, where('userId', '==', user.uid), where('isActive', '==', true));
            const oldPlansSnapshot = await getDocs(q);
            oldPlansSnapshot.forEach(doc => {
                batch.update(doc.ref, { isActive: false });
            });

            const newPlanRef = doc(collection(db, 'plans'));
            const newPlan = {
                userId: user.uid,
                name: planName,
                isActive: true,
                startDate: new Date(),
                endDate: addDays(new Date(), 60), // Plan duration of 2 months
                exercisesByDay: analysis.exercisesByDay,
                numberOfDays: analysis.numberOfTrainingDays
            };
            batch.set(newPlanRef, newPlan);
            
            await batch.commit();

            toast({ title: 'Éxito', description: '¡Nuevo plan de entrenamiento importado con éxito!' });
            router.push('/dashboard');
        } catch(e) {
            console.error(e);
            toast({ title: 'Falló la importación', description: 'La IA no pudo procesar tu archivo. Por favor, revisá el formato e intentá de nuevo.', variant: 'destructive' });
            setIsImporting(false);
        }
      };
      reader.onerror = (error) => {
        console.error('Error de lectura de archivo:', error);
        toast({ title: 'Error de archivo', description: 'No se pudo leer el archivo seleccionado.', variant: 'destructive' });
        setIsImporting(false);
      }
    } catch (error) {
      console.error('Error de importación:', error);
      toast({ title: 'Falló la importación', description: 'Ocurrió un error durante la importación.', variant: 'destructive' });
      setIsImporting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold font-headline">Importar nuevo plan</h1>
      <Card>
        <CardHeader>
          <CardTitle>Subí tu archivo XLSX</CardTitle>
          <CardDescription>
            Importá tu nuevo programa de entrenamiento. Esto archivará tu plan anterior, pero conservará todo tu historial de progreso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="plan-name">Nombre del plan</Label>
            <Input id="plan-name" placeholder="Ej: 'Verano a tope 2024'" value={planName} onChange={e => setPlanName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan-file">Archivo XLSX</Label>
            <div className="relative">
              <Input id="plan-file" type="file" accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleFileChange} className="pl-10"/>
              <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          <Button onClick={handleImport} disabled={isImporting || !file || !planName} size="lg" className="w-full">
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Importando...
              </>
            ) : (
              'Importar y empezar plan'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
