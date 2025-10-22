import { collection, query, where, getDocs, limit, addDoc, serverTimestamp, getDoc, doc, writeBatch, Timestamp } from 'firebase/firestore';
import { getFirebaseDb } from './config';
import type { TrainingPlan, ExerciseLog } from '../types';
import { startOfWeek } from 'date-fns';

export async function getActivePlan(userId: string): Promise<TrainingPlan | null> {
  const db = getFirebaseDb();
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
    const db = getFirebaseDb();
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
  const db = getFirebaseDb();
  const logsCollection = collection(db, 'training_logs');
  await addDoc(logsCollection, {
    ...logData,
    date: serverTimestamp()
  });
}

export async function getCompletedExercisesThisWeek(userId: string, planId: string, day: string): Promise<Set<string>> {
  const db = getFirebaseDb();
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 }); // Domingo = 0
  const logsCollection = collection(db, 'training_logs');
  const q = query(
    logsCollection,
    where('userId', '==', userId),
    where('planId', '==', planId),
    where('day', '==', day),
    where('date', '>=', Timestamp.fromDate(weekStart))
  );

  const querySnapshot = await getDocs(q);
  const completedExercises = new Set<string>();
  querySnapshot.forEach(doc => {
    const data = doc.data();
    completedExercises.add(data.exerciseName);
  });

  return completedExercises;
}

export async function getMaxWeightsForExercises(userId: string, exerciseNames: string[]): Promise<Record<string, number>> {
  const db = getFirebaseDb();
  const logsCollection = collection(db, 'training_logs');
  const maxWeights: Record<string, number> = {};

  // Query all logs for this user
  const q = query(
    logsCollection,
    where('userId', '==', userId)
  );

  const querySnapshot = await getDocs(q);

  // Calculate max weight for each exercise
  querySnapshot.forEach(doc => {
    const data = doc.data();
    const exerciseName = data.exerciseName;
    const weight = data.weight;

    if (exerciseNames.includes(exerciseName)) {
      if (!maxWeights[exerciseName] || weight > maxWeights[exerciseName]) {
        maxWeights[exerciseName] = weight;
      }
    }
  });

  return maxWeights;
}
