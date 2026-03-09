export interface Food {
  name: string;
  quantity: number;
  unit: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

export interface NutrientTotals {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

export interface Meal {
  id: string;
  date: string;
  description: string;
  foods: Food[];
  totals: NutrientTotals;
  created_at: string;
}

export interface DashboardResponse {
  date: string;
  goals: NutrientTotals;
  consumed: NutrientTotals;
  remaining: NutrientTotals;
  percentage: NutrientTotals;
  meals: Meal[];
}
