export interface Profile {
  id: string;
  user_id: string;
  weight: number;
  height: number;
  age: number;
  sex: string;
  activity_level: string;
  goal: string;
  target_weight: number;
  target_weeks: number;
  tmb: number;
  tdee: number;
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fat: number;
}

export interface ProfileRequest {
  weight: number;
  height: number;
  age: number;
  sex: string;
  activity_level: string;
  goal: string;
  target_weight?: number;
  target_weeks?: number;
}
