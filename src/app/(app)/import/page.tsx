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
      toast({ title: 'Error', description: 'Please provide a plan name and select a file.', variant: 'destructive' });
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

            toast({ title: 'Success', description: 'New training plan imported successfully!' });
            router.push('/dashboard');
        } catch(e) {
            console.error(e);
            toast({ title: 'Import Failed', description: 'The AI could not process your file. Please check the format and try again.', variant: 'destructive' });
            setIsImporting(false);
        }
      };
      reader.onerror = (error) => {
        console.error('File reading error:', error);
        toast({ title: 'File Error', description: 'Could not read the selected file.', variant: 'destructive' });
        setIsImporting(false);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({ title: 'Import Failed', description: 'An error occurred during import.', variant: 'destructive' });
      setIsImporting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold font-headline">Import New Plan</h1>
      <Card>
        <CardHeader>
          <CardTitle>Upload your XLSX file</CardTitle>
          <CardDescription>
            Import your new training program. This will archive your previous plan while keeping all your progress history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="plan-name">Plan Name</Label>
            <Input id="plan-name" placeholder="e.g., 'Summer Shred 2024'" value={planName} onChange={e => setPlanName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan-file">XLSX File</Label>
            <div className="relative">
              <Input id="plan-file" type="file" accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleFileChange} className="pl-10"/>
              <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          <Button onClick={handleImport} disabled={isImporting || !file || !planName} size="lg" className="w-full">
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Importing...
              </>
            ) : (
              'Import and Start Plan'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
