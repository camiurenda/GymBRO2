import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-imported-plan.ts';
import '@/ai/flows/get-training-recommendations.ts';
import '@/ai/flows/process-imported-plan.ts';
import '@/ai/flows/generate-personalized-recommendations.ts';