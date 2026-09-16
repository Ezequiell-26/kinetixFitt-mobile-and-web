/**
 * KinetixFit Nutrition Engine
 * Sistema completo de nutrición basado en patrones MIT (MyFitnessPal, Cronometer)
 * 
 * Características:
 * - Cálculo de macros personalizado (proteínas, carbohidratos, grasas)
 * - Planes de comida inteligentes
 * - Tracking de hidratación
 * - Base de datos de alimentos
 * - Recetas saludables
 * - Escaneo de códigos de barras (simulado)
 * - Análisis nutricional avanzado
 */

// ==================== TYPES & INTERFACES ====================

export interface MacroNutrients {
  calories: number;
  protein: number; // gramos
  carbohydrates: number; // gramos
  fats: number; // gramos
  fiber: number; // gramos
  sugar: number; // gramos
  sodium: number; // mg
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  servingSize: number; // gramos
  servingUnit: string;
  macros: MacroNutrients;
  micronutrients?: {
    vitaminA?: number;
    vitaminC?: number;
    vitaminD?: number;
    vitaminE?: number;
    vitaminK?: number;
    vitaminB6?: number;
    vitaminB12?: number;
    calcium?: number;
    iron?: number;
    potassium?: number;
    magnesium?: number;
    zinc?: number;
    folate?: number;
    choline?: number;
    omega3?: number;
    probiotics?: string;
  };
  category: 'protein' | 'carb' | 'fat' | 'vegetable' | 'fruit' | 'dairy' | 'grain' | 'other';
  barcode?: string;
  image?: string;
}

export interface MealPlan {
  id: string;
  name: string;
  goal: 'lose_weight' | 'maintain' | 'gain_muscle' | 'performance';
  duration: number; // días
  dailyCalories: number;
  macroDistribution: {
    protein: number; // porcentaje
    carbs: number; // porcentaje
    fats: number; // porcentaje
  };
  meals: Meal[];
  createdAt: Date;
}

export interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';
  foods: FoodEntry[];
  totalMacros: MacroNutrients;
  time?: string; // HH:mm
}

export interface FoodEntry {
  foodId: string;
  quantity: number;
  unit: string;
  macros: MacroNutrients;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  meals: {
    breakfast?: Meal;
    lunch?: Meal;
    dinner?: Meal;
    snacks: Meal[];
  };
  waterIntake: number; // ml
  totalMacros: MacroNutrients;
  calorieGoal: number;
  macroGoals: {
    protein: number;
    carbs: number;
    fats: number;
  };
  completion: number; // 0-100
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  prepTime: number; // minutos
  cookTime: number; // minutos
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: FoodEntry[];
  instructions: string[];
  macros: MacroNutrients;
  tags: string[];
  image?: string;
  rating?: number;
}

export interface HydrationLog {
  date: string;
  entries: {
    time: string;
    amount: number; // ml
    type: 'water' | 'sports_drink' | 'juice' | 'coffee' | 'tea' | 'other';
  }[];
  totalIntake: number;
  goal: number;
}

export interface NutritionGoal {
  userId: string;
  calorieGoal: number;
  macroGoals: {
    protein: number; // gramos o porcentaje
    carbs: number;
    fats: number;
  };
  waterGoal: number; // ml
  mealFrequency: number; // comidas por día
  dietaryRestrictions: string[];
  allergies: string[];
  preferences: string[];
}

// ==================== MOCK DATABASE ====================

const FOOD_DATABASE: FoodItem[] = [
  {
    id: 'food_001',
    name: 'Pechuga de Pollo',
    servingSize: 100,
    servingUnit: 'g',
    macros: { calories: 165, protein: 31, carbohydrates: 0, fats: 3.6, fiber: 0, sugar: 0, sodium: 74 },
    category: 'protein',
    image: '🍗'
  },
  {
    id: 'food_002',
    name: 'Arroz Integral',
    servingSize: 100,
    servingUnit: 'g',
    macros: { calories: 112, protein: 2.6, carbohydrates: 24, fats: 0.9, fiber: 1.8, sugar: 0.4, sodium: 1 },
    category: 'grain',
    image: '🍚'
  },
  {
    id: 'food_003',
    name: 'Brócoli',
    servingSize: 100,
    servingUnit: 'g',
    macros: { calories: 34, protein: 2.8, carbohydrates: 7, fats: 0.4, fiber: 2.6, sugar: 1.7, sodium: 33 },
    category: 'vegetable',
    micronutrients: { vitaminC: 89.2, vitaminK: 101.6, potassium: 316 },
    image: '🥦'
  },
  {
    id: 'food_004',
    name: 'Aguacate',
    servingSize: 100,
    servingUnit: 'g',
    macros: { calories: 160, protein: 2, carbohydrates: 9, fats: 15, fiber: 7, sugar: 0.7, sodium: 7 },
    category: 'fat',
    micronutrients: { potassium: 485, vitaminK: 21, folate: 81 },
    image: '🥑'
  },
  {
    id: 'food_005',
    name: 'Huevo',
    servingSize: 50,
    servingUnit: 'g',
    macros: { calories: 155, protein: 13, carbohydrates: 1.1, fats: 11, fiber: 0, sugar: 1.1, sodium: 124 },
    category: 'protein',
    micronutrients: { vitaminD: 87, vitaminB12: 1.1, choline: 251 },
    image: '🥚'
  },
  {
    id: 'food_006',
    name: 'Plátano',
    servingSize: 118,
    servingUnit: 'g',
    macros: { calories: 105, protein: 1.3, carbohydrates: 27, fats: 0.4, fiber: 3.1, sugar: 14, sodium: 1 },
    category: 'fruit',
    micronutrients: { potassium: 422, vitaminB6: 0.4, vitaminC: 10.3 },
    image: '🍌'
  },
  {
    id: 'food_007',
    name: 'Salmón',
    servingSize: 100,
    servingUnit: 'g',
    macros: { calories: 208, protein: 20, carbohydrates: 0, fats: 13, fiber: 0, sugar: 0, sodium: 59 },
    category: 'protein',
    micronutrients: { vitaminD: 526, vitaminB12: 3.2, omega3: 2260 },
    image: '🐟'
  },
  {
    id: 'food_008',
    name: 'Avena',
    servingSize: 80,
    servingUnit: 'g',
    macros: { calories: 307, protein: 10.7, carbohydrates: 55, fats: 5.3, fiber: 8, sugar: 0.8, sodium: 2 },
    category: 'grain',
    micronutrients: { iron: 3.4, magnesium: 112, zinc: 3 },
    image: '🥣'
  },
  {
    id: 'food_009',
    name: 'Almendras',
    servingSize: 28,
    servingUnit: 'g',
    macros: { calories: 164, protein: 6, carbohydrates: 6, fats: 14, fiber: 3.5, sugar: 1.2, sodium: 0 },
    category: 'fat',
    micronutrients: { vitaminE: 7.3, magnesium: 76, calcium: 76 },
    image: '🥜'
  },
  {
    id: 'food_010',
    name: 'Yogur Griego',
    servingSize: 170,
    servingUnit: 'g',
    macros: { calories: 100, protein: 17, carbohydrates: 6, fats: 0.7, fiber: 0, sugar: 6, sodium: 65 },
    category: 'dairy',
    micronutrients: { calcium: 187, vitaminB12: 1.3, probiotics: 'active' },
    image: '🥛'
  }
];

const RECIPE_DATABASE: Recipe[] = [
  {
    id: 'recipe_001',
    name: 'Bowl de Pollo y Quinoa',
    description: 'Bowl proteico perfecto para post-entreno',
    prepTime: 15,
    cookTime: 20,
    servings: 2,
    difficulty: 'easy',
    ingredients: [
      { foodId: 'food_001', quantity: 200, unit: 'g', macros: { calories: 330, protein: 62, carbohydrates: 0, fats: 7.2, fiber: 0, sugar: 0, sodium: 148 } },
      { foodId: 'food_002', quantity: 150, unit: 'g', macros: { calories: 168, protein: 3.9, carbohydrates: 36, fats: 1.35, fiber: 2.7, sugar: 0.6, sodium: 1.5 } },
      { foodId: 'food_003', quantity: 200, unit: 'g', macros: { calories: 68, protein: 5.6, carbohydrates: 14, fats: 0.8, fiber: 5.2, sugar: 3.4, sodium: 66 } },
      { foodId: 'food_004', quantity: 50, unit: 'g', macros: { calories: 80, protein: 1, carbohydrates: 4.5, fats: 7.5, fiber: 3.5, sugar: 0.35, sodium: 3.5 } }
    ],
    instructions: [
      'Cocinar la pechuga de pollo a la plancha con especias',
      'Preparar la quinoa según instrucciones del paquete',
      'Cocinar el brócoli al vapor por 5 minutos',
      'Cortar el aguacate en rodajas',
      'Armar el bowl con todos los ingredientes',
      'Añadir limón y aceite de oliva al gusto'
    ],
    macros: { calories: 646, protein: 72.5, carbohydrates: 54.5, fats: 16.85, fiber: 11.4, sugar: 4.35, sodium: 219 },
    tags: ['high-protein', 'post-workout', 'healthy', 'gluten-free'],
    rating: 4.8,
    image: '🥗'
  },
  {
    id: 'recipe_002',
    name: 'Omelette de Avena Proteico',
    description: 'Desayuno energético para empezar el día',
    prepTime: 5,
    cookTime: 10,
    servings: 1,
    difficulty: 'easy',
    ingredients: [
      { foodId: 'food_005', quantity: 100, unit: 'g', macros: { calories: 310, protein: 26, carbohydrates: 2.2, fats: 22, fiber: 0, sugar: 2.2, sodium: 248 } },
      { foodId: 'food_008', quantity: 40, unit: 'g', macros: { calories: 154, protein: 5.35, carbohydrates: 27.5, fats: 2.65, fiber: 4, sugar: 0.4, sodium: 1 } },
      { foodId: 'food_006', quantity: 60, unit: 'g', macros: { calories: 53, protein: 0.65, carbohydrates: 13.5, fats: 0.2, fiber: 1.55, sugar: 7, sodium: 0.5 } }
    ],
    instructions: [
      'Batir los huevos con la avena hasta integrar',
      'Añadir el plátano en rodajas pequeñas',
      'Calentar sartén antiadherente',
      'Verter la mezcla y cocinar 4-5 minutos',
      'Voltear y cocinar otros 3-4 minutos',
      'Servir caliente con canela'
    ],
    macros: { calories: 517, protein: 32, carbohydrates: 43.2, fats: 24.85, fiber: 5.55, sugar: 9.6, sodium: 249.5 },
    tags: ['breakfast', 'high-protein', 'energy', 'quick'],
    rating: 4.6,
    image: '🍳'
  }
];

// ==================== NUTRITION CALCULATOR ====================

export class NutritionCalculator {
  /**
   * Calcula TMB (Tasa Metabólica Basal) usando fórmula Mifflin-St Jeor
   */
  static calculateBMR(
    weight: number, // kg
    height: number, // cm
    age: number,
    gender: 'male' | 'female'
  ): number {
    const base = 10 * weight + 6.25 * height - 5 * age;
    return gender === 'male' ? base + 5 : base - 161;
  }

  /**
   * Calcula GET (Gasto Energético Total) según nivel de actividad
   */
  static calculateTDEE(bmr: number, activityLevel: number): number {
    const multipliers = {
      1: 1.2,  // Sedentario
      2: 1.375, // Ligera actividad
      3: 1.55,  // Moderada actividad
      4: 1.725, // Alta actividad
      5: 1.9    // Muy alta actividad
    };
    return bmr * (multipliers[activityLevel as keyof typeof multipliers] || 1.2);
  }

  /**
   * Calcula macros objetivos según goal
   */
  static calculateMacroGoals(
    tdee: number,
    goal: 'lose_weight' | 'maintain' | 'gain_muscle' | 'performance',
    weight: number
  ): { calories: number; protein: number; carbs: number; fats: number } {
    let calorieAdjustment = 0;
    let proteinPerKg = 1.6;
    let fatPercentage = 0.25;

    switch (goal) {
      case 'lose_weight':
        calorieAdjustment = -500;
        proteinPerKg = 2.0;
        fatPercentage = 0.25;
        break;
      case 'maintain':
        calorieAdjustment = 0;
        proteinPerKg = 1.6;
        fatPercentage = 0.25;
        break;
      case 'gain_muscle':
        calorieAdjustment = 300;
        proteinPerKg = 2.2;
        fatPercentage = 0.25;
        break;
      case 'performance':
        calorieAdjustment = 400;
        proteinPerKg = 1.8;
        fatPercentage = 0.20;
        break;
    }

    const targetCalories = Math.round(tdee + calorieAdjustment);
    const protein = Math.round(weight * proteinPerKg);
    const fatGrams = Math.round((targetCalories * fatPercentage) / 9);
    const carbs = Math.round((targetCalories - (protein * 4) - (fatGrams * 9)) / 4);

    return {
      calories: targetCalories,
      protein,
      carbs: Math.max(carbs, 100),
      fats: fatGrams
    };
  }

  /**
   * Calcula macros de una entrada de comida
   */
  static calculateFoodMacros(food: FoodItem, quantity: number, unit: string): MacroNutrients {
    const ratio = quantity / food.servingSize;
    
    return {
      calories: Math.round(food.macros.calories * ratio),
      protein: Math.round(food.macros.protein * ratio * 10) / 10,
      carbohydrates: Math.round(food.macros.carbohydrates * ratio * 10) / 10,
      fats: Math.round(food.macros.fats * ratio * 10) / 10,
      fiber: Math.round(food.macros.fiber * ratio * 10) / 10,
      sugar: Math.round(food.macros.sugar * ratio * 10) / 10,
      sodium: Math.round(food.macros.sodium * ratio)
    };
  }

  /**
   * Suma macros de múltiples alimentos
   */
  static sumMacros(macrosArray: MacroNutrients[]): MacroNutrients {
    return macrosArray.reduce((acc, macros) => ({
      calories: acc.calories + macros.calories,
      protein: Math.round((acc.protein + macros.protein) * 10) / 10,
      carbohydrates: Math.round((acc.carbohydrates + macros.carbohydrates) * 10) / 10,
      fats: Math.round((acc.fats + macros.fats) * 10) / 10,
      fiber: Math.round((acc.fiber + macros.fiber) * 10) / 10,
      sugar: Math.round((acc.sugar + macros.sugar) * 10) / 10,
      sodium: Math.round(acc.sodium + macros.sodium)
    }), {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fats: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    });
  }

  /**
   * Calcula porcentaje de completitud de macros
   */
  static calculateMacroCompletion(
    current: MacroNutrients,
    goals: { calories: number; protein: number; carbs: number; fats: number }
  ): {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    overall: number;
  } {
    const caloriesPct = Math.min(100, Math.round((current.calories / goals.calories) * 100));
    const proteinPct = Math.min(100, Math.round((current.protein / goals.protein) * 100));
    const carbsPct = Math.min(100, Math.round((current.carbohydrates / goals.carbs) * 100));
    const fatsPct = Math.min(100, Math.round((current.fats / goals.fats) * 100));
    
    const overall = Math.round((caloriesPct + proteinPct + carbsPct + fatsPct) / 4);

    return { calories: caloriesPct, protein: proteinPct, carbs: carbsPct, fats: fatsPct, overall };
  }
}

// ==================== MEAL PLANNER ====================

export class MealPlanner {
  /**
   * Genera un plan de comidas automático basado en objetivos
   */
  static generateMealPlan(
    goal: 'lose_weight' | 'maintain' | 'gain_muscle' | 'performance',
    dailyCalories: number,
    dietaryRestrictions: string[] = [],
    mealFrequency: number = 4
  ): MealPlan {
    const macroDistribution = this.getMacroDistribution(goal);
    const meals: Meal[] = [];
    
    const mealTypes: Array<'breakfast' | 'lunch' | 'dinner' | 'snack'> = 
      mealFrequency === 3 ? ['breakfast', 'lunch', 'dinner'] :
      mealFrequency === 4 ? ['breakfast', 'lunch', 'dinner', 'snack'] :
      ['breakfast', 'snack', 'lunch', 'snack', 'dinner'];

    const caloriesPerMeal = Math.round(dailyCalories / mealFrequency);

    mealTypes.forEach((type, index) => {
      const meal = this.generateMeal(type, caloriesPerMeal, macroDistribution, dietaryRestrictions);
      meals.push(meal);
    });

    return {
      id: `plan_${Date.now()}`,
      name: `Plan ${goal.replace('_', ' ')}`,
      goal,
      duration: 7,
      dailyCalories,
      macroDistribution,
      meals,
      createdAt: new Date()
    };
  }

  private static getMacroDistribution(goal: string): { protein: number; carbs: number; fats: number } {
    switch (goal) {
      case 'lose_weight':
        return { protein: 35, carbs: 35, fats: 30 };
      case 'gain_muscle':
        return { protein: 30, carbs: 45, fats: 25 };
      case 'performance':
        return { protein: 25, carbs: 50, fats: 25 };
      default:
        return { protein: 30, carbs: 40, fats: 30 };
    }
  }

  private static generateMeal(
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    targetCalories: number,
    distribution: { protein: number; carbs: number; fats: number },
    restrictions: string[]
  ): Meal {
    // Algoritmo simplificado de generación de comidas
    const availableFoods = FOOD_DATABASE.filter(f => !restrictions.includes(f.category));
    
    const proteinFood = availableFoods.find(f => f.category === 'protein') || availableFoods[0];
    const carbFood = availableFoods.find(f => f.category === 'grain' || f.category === 'fruit') || availableFoods[1];
    const vegFood = availableFoods.find(f => f.category === 'vegetable') || availableFoods[2];
    const fatFood = availableFoods.find(f => f.category === 'fat') || availableFoods[3];

    const proteinQty = type === 'breakfast' ? 100 : 150;
    const carbQty = type === 'snack' ? 50 : 100;
    const vegQty = 150;
    const fatQty = type === 'snack' ? 15 : 30;

    const foods: FoodEntry[] = [
      {
        foodId: proteinFood.id,
        quantity: proteinQty,
        unit: 'g',
        macros: NutritionCalculator.calculateFoodMacros(proteinFood, proteinQty, 'g')
      },
      {
        foodId: carbFood.id,
        quantity: carbQty,
        unit: 'g',
        macros: NutritionCalculator.calculateFoodMacros(carbFood, carbQty, 'g')
      },
      {
        foodId: vegFood.id,
        quantity: vegQty,
        unit: 'g',
        macros: NutritionCalculator.calculateFoodMacros(vegFood, vegQty, 'g')
      }
    ];

    if (fatFood && type !== 'snack') {
      foods.push({
        foodId: fatFood.id,
        quantity: fatQty,
        unit: 'g',
        macros: NutritionCalculator.calculateFoodMacros(fatFood, fatQty, 'g')
      });
    }

    const totalMacros = NutritionCalculator.sumMacros(foods.map(f => f.macros));

    return {
      id: `meal_${type}_${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Balanceado`,
      type,
      foods,
      totalMacros,
      time: this.getDefaultMealTime(type)
    };
  }

  private static getDefaultMealTime(type: string): string {
    const times: Record<string, string> = {
      breakfast: '08:00',
      lunch: '13:00',
      dinner: '20:00',
      snack: '16:00'
    };
    return times[type] || '12:00';
  }
}

// ==================== HYDRATION TRACKER ====================

export class HydrationTracker {
  private dailyGoal: number = 2500; // ml
  private intake: number = 0;
  private entries: { time: string; amount: number; type: string }[] = [];

  constructor(dailyGoal?: number) {
    if (dailyGoal) this.dailyGoal = dailyGoal;
  }

  addWater(amount: number, type: 'water' | 'sports_drink' | 'juice' | 'coffee' | 'tea' | 'other' = 'water'): void {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    this.entries.push({ time, amount, type });
    this.intake += amount;
  }

  getIntake(): number {
    return this.intake;
  }

  getGoal(): number {
    return this.dailyGoal;
  }

  getProgress(): number {
    return Math.min(100, Math.round((this.intake / this.dailyGoal) * 100));
  }

  getRemaining(): number {
    return Math.max(0, this.dailyGoal - this.intake);
  }

  getEntries(): { time: string; amount: number; type: string }[] {
    return this.entries;
  }

  reset(): void {
    this.intake = 0;
    this.entries = [];
  }

  /**
   * Calcula recomendación de hidratación basada en peso y actividad
   */
  static calculateHydrationGoal(
    weight: number, // kg
    activityMinutes: number,
    temperature: number // Celsius
  ): number {
    const base = weight * 35; // ml por kg
    const activityBonus = activityMinutes * 12; // ml adicionales por minuto de ejercicio
    const tempBonus = temperature > 25 ? (temperature - 25) * 100 : 0;
    
    return Math.round(base + activityBonus + tempBonus);
  }
}

// ==================== RECIPE MANAGER ====================

export class RecipeManager {
  private recipes: Recipe[] = [...RECIPE_DATABASE];

  getAllRecipes(): Recipe[] {
    return this.recipes;
  }

  getRecipeById(id: string): Recipe | undefined {
    return this.recipes.find(r => r.id === id);
  }

  searchRecipes(query: string, tags?: string[]): Recipe[] {
    const lowerQuery = query.toLowerCase();
    
    return this.recipes.filter(recipe => {
      const matchesQuery = 
        recipe.name.toLowerCase().includes(lowerQuery) ||
        recipe.description.toLowerCase().includes(lowerQuery) ||
        recipe.ingredients.some(i => {
          const food = FOOD_DATABASE.find(f => f.id === i.foodId);
          return food?.name.toLowerCase().includes(lowerQuery);
        });
      
      const matchesTags = !tags || tags.every(tag => recipe.tags.includes(tag));
      
      return matchesQuery && matchesTags;
    });
  }

  getRecipesByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Recipe[] {
    return this.recipes.filter(r => r.difficulty === difficulty);
  }

  getRecipesByMacroGoal(
    goal: 'high-protein' | 'low-carb' | 'balanced' | 'high-carb'
  ): Recipe[] {
    return this.recipes.filter(recipe => {
      const proteinPct = (recipe.macros.protein * 4 / recipe.macros.calories) * 100;
      const carbPct = (recipe.macros.carbohydrates * 4 / recipe.macros.calories) * 100;
      
      switch (goal) {
        case 'high-protein':
          return proteinPct >= 30;
        case 'low-carb':
          return carbPct <= 20;
        case 'high-carb':
          return carbPct >= 50;
        default:
          return proteinPct >= 25 && proteinPct <= 35 && carbPct >= 35 && carbPct <= 50;
      }
    });
  }

  scaleRecipe(recipe: Recipe, newServings: number): Recipe {
    const scaleFactor = newServings / recipe.servings;
    
    return {
      ...recipe,
      servings: newServings,
      ingredients: recipe.ingredients.map(ing => ({
        ...ing,
        quantity: ing.quantity * scaleFactor,
        macros: NutritionCalculator.calculateFoodMacros(
          FOOD_DATABASE.find(f => f.id === ing.foodId)!,
          ing.quantity * scaleFactor,
          ing.unit
        )
      })),
      macros: NutritionCalculator.sumMacros(
        recipe.ingredients.map(ing => ({
          ...ing.macros,
          calories: ing.macros.calories * scaleFactor,
          protein: ing.macros.protein * scaleFactor,
          carbohydrates: ing.macros.carbohydrates * scaleFactor,
          fats: ing.macros.fats * scaleFactor,
          fiber: ing.macros.fiber * scaleFactor,
          sugar: ing.macros.sugar * scaleFactor,
          sodium: ing.macros.sodium * scaleFactor
        }))
      )
    };
  }
}

// ==================== FOOD SEARCH ====================

export class FoodSearch {
  private database: FoodItem[] = [...FOOD_DATABASE];

  search(query: string, category?: string): FoodItem[] {
    const lowerQuery = query.toLowerCase();
    
    return this.database.filter(food => {
      const matchesQuery = 
        food.name.toLowerCase().includes(lowerQuery) ||
        food.brand?.toLowerCase().includes(lowerQuery);
      
      const matchesCategory = !category || food.category === category;
      
      return matchesQuery && matchesCategory;
    });
  }

  findByBarcode(barcode: string): FoodItem | undefined {
    return this.database.find(f => f.barcode === barcode);
  }

  getPopularFoods(): FoodItem[] {
    return this.database.slice(0, 5);
  }

  getFoodsByCategory(category: string): FoodItem[] {
    return this.database.filter(f => f.category === category);
  }
}

// ==================== REACT HOOKS ====================

import { useState, useEffect, useCallback } from 'react';

export function useNutritionCalculator(userId: string) {
  const [goals, setGoals] = useState<NutritionGoal | null>(null);
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos del usuario
    const loadUserData = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Datos mock
      setGoals({
        userId,
        calorieGoal: 2200,
        macroGoals: { protein: 165, carbs: 220, fats: 61 },
        waterGoal: 2500,
        mealFrequency: 4,
        dietaryRestrictions: [],
        allergies: [],
        preferences: ['high-protein']
      });

      setDailyLog({
        date: new Date().toISOString().split('T')[0],
        meals: { breakfast: undefined, lunch: undefined, dinner: undefined, snacks: [] },
        waterIntake: 1200,
        totalMacros: { calories: 850, protein: 65, carbohydrates: 95, fats: 28, fiber: 12, sugar: 18, sodium: 450 },
        calorieGoal: 2200,
        macroGoals: { protein: 165, carbs: 220, fats: 61 },
        completion: 39
      });

      setLoading(false);
    };

    loadUserData();
  }, [userId]);

  const addMeal = useCallback((meal: Meal) => {
    setDailyLog(prev => {
      if (!prev) return prev;
      
      const newTotal = NutritionCalculator.sumMacros([
        prev.totalMacros,
        meal.totalMacros
      ]);

      const completion = NutritionCalculator.calculateMacroCompletion(
        newTotal,
        { calories: prev.calorieGoal, ...prev.macroGoals }
      );

      return {
        ...prev,
        meals: {
          ...prev.meals,
          [meal.type]: meal
        },
        totalMacros: newTotal,
        completion: completion.overall
      };
    });
  }, []);

  const addWater = useCallback((amount: number) => {
    setDailyLog(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        waterIntake: prev.waterIntake + amount
      };
    });
  }, []);

  return {
    goals,
    dailyLog,
    loading,
    addMeal,
    addWater,
    completion: dailyLog?.completion || 0
  };
}

export function useMealPlanner(goal: 'lose_weight' | 'maintain' | 'gain_muscle' | 'performance') {
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const generatePlan = useCallback(async (
    dailyCalories: number,
    restrictions: string[] = [],
    frequency: number = 4
  ) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newPlan = MealPlanner.generateMealPlan(goal, dailyCalories, restrictions, frequency);
    setPlan(newPlan);
    setLoading(false);
    
    return newPlan;
  }, [goal]);

  return { plan, loading, generatePlan };
}

export function useHydrationTracker(dailyGoal: number = 2500) {
  const [intake, setIntake] = useState(0);
  const [entries, setEntries] = useState<{ time: string; amount: number; type: string }[]>([]);

  const addWater = useCallback((amount: number, type: string = 'water') => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    setEntries(prev => [...prev, { time, amount, type }]);
    setIntake(prev => prev + amount);
  }, []);

  const progress = Math.min(100, Math.round((intake / dailyGoal) * 100));
  const remaining = Math.max(0, dailyGoal - intake);

  const reset = useCallback(() => {
    setIntake(0);
    setEntries([]);
  }, []);

  return { intake, goal: dailyGoal, progress, remaining, entries, addWater, reset };
}

// ==================== EXPORTS ====================

export const NutritionEngine = {
  Calculator: NutritionCalculator,
  MealPlanner: MealPlanner,
  HydrationTracker,
  RecipeManager,
  FoodSearch
};

export default NutritionEngine;
