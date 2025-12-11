// Database types matching Supabase schema

export interface Organization {
  id: string;
  slug: string;
  name: string;
  created_at: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  org_slug: string;
  created_at: string;
  updated_at?: string;
}

export interface Farm {
  id: string;
  org_slug: string;
  name: string;
  location?: string;
  created_at: string;
  updated_at?: string;
}

export interface House {
  id: string;
  farm_id: string;
  name: string;
  capacity?: number;
  created_at: string;
  updated_at?: string;
  farms?: Farm;
}

export interface Worker {
  id: string;
  org_slug: string;
  name: string;
  role?: string;
  phone?: string;
  created_at: string;
  updated_at?: string;
}

export interface Batch {
  id: string;
  org_id: string;
  name: string;
  initial_quantity: number;
  start_date: string;
  end_date?: string;
  status: 'active' | 'completed';
  created_at: string;
  updated_at?: string;
}

export interface FeedLog {
  id: string;
  batch_id: string;
  date: string;
  feed_type: string;
  quantity_kg: number;
  cost?: number;
  notes?: string;
  created_at: string;
}

export interface WeightLog {
  id: string;
  batch_id: string;
  date: string;
  avg_weight_kg: number;
  sample_size?: number;
  notes?: string;
  created_at: string;
}

export interface MortalityLog {
  id: string;
  batch_id: string;
  date: string;
  quantity: number;
  cause?: string;
  notes?: string;
  created_at: string;
}

export interface WaterLog {
  id: string;
  batch_id: string;
  date: string;
  liters: number;
  notes?: string;
  created_at: string;
}

export interface VaccinationLog {
  id: string;
  batch_id: string;
  date: string;
  vaccine_name: string;
  dosage?: string;
  notes?: string;
  created_at: string;
}

export interface ExpenseLog {
  id: string;
  batch_id: string;
  date?: string;
  category: 'chicks' | 'feed' | 'medicine' | 'labor' | 'utilities' | 'other';
  amount: number;
  description?: string;
  notes?: string;
  created_at: string;
}

export interface SalesLog {
  id: string;
  batch_id: string;
  date: string;
  quantity_birds: number;
  total_weight_kg?: number;
  price_per_kg?: number;
  total_revenue: number;
  total_amount?: number;
  quantity?: number;
  buyer?: string;
  notes?: string;
  created_at: string;
}

// Aggregate types for batch details
export interface BatchLogs {
  feed: FeedLog[];
  weight: WeightLog[];
  mortality: MortalityLog[];
  water: WaterLog[];
  vaccination: VaccinationLog[];
  expense: ExpenseLog[];
  sale: SalesLog[];
}

export interface BatchStats {
  id: string;
  name: string;
  revenue: number;
  expenses: number;
  chickCost: number;
  feedCost: number;
  otherCost: number;
  profit: number;
  costPerBird: number;
  costPerLb: number;
  birdsSold: number;
  weightLb: number;
}

export interface DashboardStats {
  batches: number;
  birds: number;
  feedLb: number;
  mortality: number;
  profit: number;
}

export interface FinanceStats {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  batchStats: BatchStats[];
}
