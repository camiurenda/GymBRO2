import { collection, query, where, getDocs, limit, addDoc, serverTimestamp, getDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from './config';
import type { TrainingPlan, ExerciseLog } from '../types';

export async function getActivePlan(userId: string): Promise<TrainingPlan | null> {
  const plansCollection = collection(db, 'plans');
  const q = query(
    plansCollection,
    where('userId', '==', userId),
    where('isActive', '==', true),
    limit(1)
  );

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return null;
  }

  const planDoc = querySnapshot.docs[0];
  const data = planDoc.data();
  // Ensure dates are correctly handled if they are not Timestamps (e.g., from server actions)
  return { 
    id: planDoc.id,
    ...data,
    startDate: data.startDate,
    endDate: data.endDate,
   } as TrainingPlan;
}


export async function getExercisesForDay(planId: string, dayKey: string): Promise<string[] | null> {
    const planRef = doc(db, 'plans', planId);
    const planSnap = await getDoc(planRef);

    if (!planSnap.exists()) {
        return null;
    }
    const planData = planSnap.data() as TrainingPlan;
    const dayKeyNormalized = Object.keys(planData.exercisesByDay).find(k => k.replace(/ /g, '-').toLowerCase() === dayKey);

    return dayKeyNormalized ? planData.exercisesByDay[dayKeyNormalized] : [];
}

export async function logExercise(logData: Omit<ExerciseLog, 'id' | 'date' >) {
  const logsCollection = collection(db, 'training_logs');
  await addDoc(logsCollection, {
    ...logData,
    date: serverTimestamp()
  });
}
