import type { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  createdAt: Timestamp;
}

export interface TrainingPlan {
  id: string;
  userId: string;
  name: string;
  startDate: Timestamp;
  endDate: Timestamp;
  isActive: boolean;
  exercisesByDay: Record<string, string[]>;
  numberOfDays: number;
}

export interface ExerciseLog {
  id: string;
  userId: string;
  planId: string;
  day: string;
  exerciseName: string;
  weight: number;
  reps: number;
  date: Timestamp;
}

export interface ExtraActivity {
  id: string;
  userId: string;
  name: string;
  date: Timestamp;
}
