export type FoodItem = {
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export type FoodLogEntry = {
  id: string;
  name: string;
  serving: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export const foodDatabase: FoodItem[] = [
  { name: "Chicken Breast", serving: "100 g", calories: 165, protein: 31, carbs: 0, fats: 3.6 },
  { name: "White Rice", serving: "1 cup cooked", calories: 205, protein: 4.3, carbs: 45, fats: 0.4 },
  { name: "Brown Rice", serving: "1 cup cooked", calories: 216, protein: 5, carbs: 45, fats: 1.8 },
  { name: "Oats", serving: "1/2 cup dry", calories: 150, protein: 5, carbs: 27, fats: 3 },
  { name: "Whole Egg", serving: "1 egg", calories: 78, protein: 6, carbs: 0.6, fats: 5 },
  { name: "Egg White", serving: "1 white", calories: 17, protein: 3.6, carbs: 0.2, fats: 0.1 },
  { name: "Salmon", serving: "100 g", calories: 208, protein: 20, carbs: 0, fats: 13 },
  { name: "Tuna", serving: "100 g", calories: 132, protein: 28, carbs: 0, fats: 1 },
  { name: "Greek Yogurt", serving: "170 g", calories: 100, protein: 17, carbs: 6, fats: 0.7 },
  { name: "Banana", serving: "1 medium", calories: 105, protein: 1.3, carbs: 27, fats: 0.4 },
  { name: "Apple", serving: "1 medium", calories: 95, protein: 0.5, carbs: 25, fats: 0.3 },
  { name: "Broccoli", serving: "1 cup", calories: 55, protein: 3.7, carbs: 11, fats: 0.6 },
  { name: "Sweet Potato", serving: "1 medium", calories: 112, protein: 2, carbs: 26, fats: 0.1 },
  { name: "Whole Wheat Bread", serving: "1 slice", calories: 81, protein: 4, carbs: 14, fats: 1.1 },
  { name: "Peanut Butter", serving: "2 tbsp", calories: 188, protein: 8, carbs: 6, fats: 16 },
  { name: "Almonds", serving: "28 g", calories: 164, protein: 6, carbs: 6, fats: 14 },
  { name: "Lean Beef", serving: "100 g", calories: 250, protein: 26, carbs: 0, fats: 15 },
  { name: "Pasta", serving: "1 cup cooked", calories: 220, protein: 8, carbs: 43, fats: 1.3 },
  { name: "Avocado", serving: "1/2 fruit", calories: 120, protein: 1.5, carbs: 6, fats: 11 },
  { name: "Protein Shake", serving: "1 scoop", calories: 120, protein: 24, carbs: 3, fats: 1 },
  { name: "Milk", serving: "1 cup", calories: 103, protein: 8, carbs: 12, fats: 2.4 },
  { name: "Cottage Cheese", serving: "1/2 cup", calories: 90, protein: 12, carbs: 5, fats: 2.5 },
  { name: "Tofu", serving: "100 g", calories: 76, protein: 8, carbs: 1.9, fats: 4.8 },
  { name: "Quinoa", serving: "1 cup cooked", calories: 222, protein: 8, carbs: 39, fats: 3.6 }
];
