/**
 * 🎮 GAMIFICATION ENGINE - Sistema de Gamificación Profesional
 * Basado en patrones de: Habitica, Duolingo, Fitocracy (MIT)
 * 
 * Características:
 * - Sistema de niveles y XP
 * - Logros y badges desbloqueables
 * - Rachas y streaks
 * - Tablas de clasificación
 * - Recompensas y misiones
 * - Progresión visual
 */

export interface UserProgress {
  userId: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  longestStreak: number;
  totalWorkouts: number;
  totalCaloriesBurned: number;
  achievements: Achievement[];
  badges: Badge[];
  rank: number;
  coins: number;
  gems: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'workout' | 'nutrition' | 'consistency' | 'social' | 'milestone';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockedAt?: Date;
  progress: number;
  target: number;
  xpReward: number;
  coinReward: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  earnedAt?: Date;
  requirement: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'lifetime';
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  objective: {
    type: 'workouts' | 'calories' | 'minutes' | 'distance' | 'consistency';
    target: number;
    current: number;
  };
  rewards: {
    xp: number;
    coins: number;
    gems?: number;
    badge?: string;
  };
  expiresAt?: Date;
  completed: boolean;
  claimed: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  level: number;
  xp: number;
  trophies: number;
  isCurrentUser: boolean;
}

const GAMIFICATION_STORAGE_PREFIX = 'kinetixfitt:gamification:';

function canUseBrowserStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export class GamificationEngine {
  private static instance: GamificationEngine;
  private progressCache: Map<string, UserProgress> = new Map();
  
  // Configuración de niveles
  private levelCurve: number[] = [];
  
  // Base de datos de logros
  private achievementsDB: Achievement[] = [
    // Workout Achievements
    {
      id: 'first_workout',
      name: 'Primer Paso',
      description: 'Completa tu primer entrenamiento',
      icon: '🏋️',
      category: 'workout',
      rarity: 'common',
      unlocked: false,
      progress: 0,
      target: 1,
      xpReward: 50,
      coinReward: 10
    },
    {
      id: 'workout_warrior',
      name: 'Guerrero del Fitness',
      description: 'Completa 50 entrenamientos',
      icon: '⚔️',
      category: 'workout',
      rarity: 'uncommon',
      unlocked: false,
      progress: 0,
      target: 50,
      xpReward: 500,
      coinReward: 100
    },
    {
      id: 'fitness_legend',
      name: 'Leyenda del Fitness',
      description: 'Completa 500 entrenamientos',
      icon: '👑',
      category: 'workout',
      rarity: 'legendary',
      unlocked: false,
      progress: 0,
      target: 500,
      xpReward: 5000,
      coinReward: 1000
    },
    // Consistency Achievements
    {
      id: 'seven_day_streak',
      name: 'Semana Dedicada',
      description: 'Mantén una racha de 7 días',
      icon: '🔥',
      category: 'consistency',
      rarity: 'uncommon',
      unlocked: false,
      progress: 0,
      target: 7,
      xpReward: 200,
      coinReward: 50
    },
    {
      id: 'thirty_day_streak',
      name: 'Mes Imparable',
      description: 'Mantén una racha de 30 días',
      icon: '💪',
      category: 'consistency',
      rarity: 'rare',
      unlocked: false,
      progress: 0,
      target: 30,
      xpReward: 1000,
      coinReward: 250
    },
    {
      id: 'year_master',
      name: 'Maestro del Año',
      description: 'Entrena todos los días durante un año',
      icon: '🏆',
      category: 'consistency',
      rarity: 'legendary',
      unlocked: false,
      progress: 0,
      target: 365,
      xpReward: 10000,
      coinReward: 2500
    },
    // Calorie Achievements
    {
      id: 'calorie_burner',
      name: 'Quemador de Calorías',
      description: 'Quema 10,000 calorías totales',
      icon: '🔥',
      category: 'workout',
      rarity: 'common',
      unlocked: false,
      progress: 0,
      target: 10000,
      xpReward: 300,
      coinReward: 75
    },
    {
      id: 'calorie_destroyer',
      name: 'Destructor de Calorías',
      description: 'Quema 100,000 calorías totales',
      icon: '☄️',
      category: 'workout',
      rarity: 'epic',
      unlocked: false,
      progress: 0,
      target: 100000,
      xpReward: 3000,
      coinReward: 750
    },
    // Milestone Achievements
    {
      id: 'level_10',
      name: 'Nivel 10 Alcanzado',
      description: 'Alcanza el nivel 10',
      icon: '📈',
      category: 'milestone',
      rarity: 'uncommon',
      unlocked: false,
      progress: 0,
      target: 10,
      xpReward: 500,
      coinReward: 100
    },
    {
      id: 'level_50',
      name: 'Nivel 50 Alcanzado',
      description: 'Alcanza el nivel 50',
      icon: '🚀',
      category: 'milestone',
      rarity: 'rare',
      unlocked: false,
      progress: 0,
      target: 50,
      xpReward: 2500,
      coinReward: 500
    },
    {
      id: 'level_100',
      name: 'Nivel 100 - Élite',
      description: 'Alcanza el nivel 100',
      icon: '💎',
      category: 'milestone',
      rarity: 'legendary',
      unlocked: false,
      progress: 0,
      target: 100,
      xpReward: 10000,
      coinReward: 2000
    }
  ];

  private badgesDB: Badge[] = [
    {
      id: 'early_adopter',
      name: 'Early Adopter',
      description: 'Únete en el primer mes de lanzamiento',
      icon: '🌟',
      tier: 'platinum',
      requirement: 'Registro antes de 2024-02-01'
    },
    {
      id: 'perfectionist',
      name: 'Perfeccionista',
      description: 'Completa 10 entrenamientos con 100% de efectividad',
      icon: '✨',
      tier: 'gold',
      requirement: '10 workouts perfectos'
    },
    {
      id: 'social_butterfly',
      name: 'Social Butterfly',
      description: 'Comparte 50 logros en redes sociales',
      icon: '🦋',
      tier: 'silver',
      requirement: '50 shares'
    },
    {
      id: 'marathon_master',
      name: 'Marathon Master',
      description: 'Completa un entrenamiento de más de 2 horas',
      icon: '🏃',
      tier: 'gold',
      requirement: 'Workout > 120 min'
    },
    {
      id: 'night_owl',
      name: 'Night Owl',
      description: 'Completa 20 entrenamientos después de las 10 PM',
      icon: '🦉',
      tier: 'bronze',
      requirement: '20 night workouts'
    },
    {
      id: 'early_bird',
      name: 'Early Bird',
      description: 'Completa 20 entrenamientos antes de las 6 AM',
      icon: '🐦',
      tier: 'bronze',
      requirement: '20 morning workouts'
    },
    {
      id: 'weekend_warrior',
      name: 'Weekend Warrior',
      description: 'Completa 50 entrenamientos en fines de semana',
      icon: '🛡️',
      tier: 'silver',
      requirement: '50 weekend workouts'
    },
    {
      id: 'transformation',
      name: 'Transformación Total',
      description: 'Pierde 10kg o gana 5kg de músculo',
      icon: '🔄',
      tier: 'diamond',
      requirement: 'Cambio corporal significativo'
    }
  ];

  private constructor() {
    this.generateLevelCurve();
  }

  private persistProgress(progress: UserProgress): void {
    this.progressCache.set(progress.userId, progress);
    if (!canUseBrowserStorage()) return;
    window.localStorage.setItem(
      `${GAMIFICATION_STORAGE_PREFIX}${progress.userId}`,
      JSON.stringify(progress),
    );
  }

  private restoreProgress(userId: string): UserProgress | null {
    if (this.progressCache.has(userId)) {
      return this.progressCache.get(userId) ?? null;
    }
    if (!canUseBrowserStorage()) return null;

    const raw = window.localStorage.getItem(`${GAMIFICATION_STORAGE_PREFIX}${userId}`);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as UserProgress;
      if (!parsed || parsed.userId !== userId || typeof parsed.xp !== 'number') {
        return null;
      }

      parsed.achievements = Array.isArray(parsed.achievements)
        ? parsed.achievements.map((achievement) => ({
            ...achievement,
            unlockedAt: achievement.unlockedAt
              ? new Date(achievement.unlockedAt)
              : undefined,
          }))
        : [];
      parsed.badges = Array.isArray(parsed.badges)
        ? parsed.badges.map((badge) => ({
            ...badge,
            earnedAt: badge.earnedAt ? new Date(badge.earnedAt) : undefined,
          }))
        : [];

      this.progressCache.set(userId, parsed);
      return parsed;
    } catch {
      window.localStorage.removeItem(`${GAMIFICATION_STORAGE_PREFIX}${userId}`);
      return null;
    }
  }

  public static getInstance(): GamificationEngine {
    if (!GamificationEngine.instance) {
      GamificationEngine.instance = new GamificationEngine();
    }
    return GamificationEngine.instance;
  }

  /**
   * Genera la curva de experiencia para los niveles
   * Fórmula: XP necesario = 100 * nivel^1.5
   */
  private generateLevelCurve(): void {
    this.levelCurve = [0]; // Nivel 0 requiere 0 XP
    for (let i = 1; i <= 200; i++) {
      const xpNeeded = Math.floor(100 * Math.pow(i, 1.5));
      this.levelCurve.push(xpNeeded);
    }
  }

  /**
   * Calcula el nivel actual basado en el XP total
   */
  public calculateLevel(totalXP: number): number {
    const safeXP = Number.isFinite(totalXP) ? Math.max(0, totalXP) : 0;
    for (let i = this.levelCurve.length - 1; i >= 1; i--) {
      if (safeXP >= this.levelCurve[i]) {
        return i;
      }
    }
    return 1;
  }

  /**
   * Calcula el XP necesario para el siguiente nivel
   */
  public getXPToNextLevel(currentLevel: number): number {
    if (currentLevel >= this.levelCurve.length - 1) {
      return Infinity;
    }
    return this.levelCurve[currentLevel + 1];
  }

  /**
   * Crea un nuevo usuario con progreso inicial
   */
  public createNewUser(userId: string): UserProgress {
    const existing = this.restoreProgress(userId);
    if (existing) return existing;

    const progress: UserProgress = {
      userId,
      level: 1,
      xp: 0,
      xpToNextLevel: this.levelCurve[2],
      streak: 0,
      longestStreak: 0,
      totalWorkouts: 0,
      totalCaloriesBurned: 0,
      achievements: [],
      badges: [],
      rank: 0,
      coins: 100, // Bonus de bienvenida
      gems: 10 // Bonus de bienvenida
    };
    
    this.persistProgress(progress);
    return progress;
  }

  /**
   * Agrega experiencia al usuario
   */
  public addXP(userId: string, amount: number, source?: string): { 
    newLevel: number; 
    leveledUp: boolean;
    xpGained: number;
  } {
    const progress = this.restoreProgress(userId);
    if (!progress) {
      throw new Error(`Usuario ${userId} no encontrado`);
    }
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error('La cantidad de XP debe ser un número finito no negativo.');
    }

    const oldLevel = progress.level;
    progress.xp += amount;
    
    // Verificar si subió de nivel
    let newLevel = this.calculateLevel(progress.xp);
    let leveledUp = newLevel > oldLevel;
    
    if (leveledUp) {
      progress.level = newLevel;
      progress.xpToNextLevel = this.getXPToNextLevel(newLevel);
      
      // Bonus por subir de nivel
      const levelBonus = newLevel * 10;
      progress.coins += levelBonus;
      
      // Notificar evento de level up
      this.onLevelUp(userId, oldLevel, newLevel);
    }

    this.persistProgress(progress);

    return {
      newLevel: progress.level,
      leveledUp,
      xpGained: amount
    };
  }

  /**
   * Registra un workout completado
   */
  public completeWorkout(
    userId: string, 
    caloriesBurned: number,
    durationMinutes: number,
    effectiveness: number = 1
  ): { xpEarned: number; coinsEarned: number; newAchievements: Achievement[] } {
    const progress = this.restoreProgress(userId);
    if (!progress) {
      throw new Error(`Usuario ${userId} no encontrado`);
    }
    if (!Number.isFinite(caloriesBurned) || caloriesBurned < 0) {
      throw new Error('Las calorías deben ser un número finito no negativo.');
    }
    if (!Number.isFinite(durationMinutes) || durationMinutes < 0) {
      throw new Error('La duración debe ser un número finito no negativo.');
    }
    if (!Number.isFinite(effectiveness) || effectiveness < 0 || effectiveness > 1) {
      throw new Error('La efectividad debe estar entre 0 y 1.');
    }

    // Actualizar estadísticas
    progress.totalWorkouts += 1;
    progress.totalCaloriesBurned += caloriesBurned;

    // Calcular recompensas base
    const baseXP = Math.floor(caloriesBurned * 0.5);
    const durationBonus = Math.floor(durationMinutes * 2);
    const effectivenessMultiplier = 0.5 + (effectiveness * 0.5); // 0.5x a 1x
    
    const totalXP = Math.floor((baseXP + durationBonus) * effectivenessMultiplier);
    const coinsEarned = Math.floor(totalXP * 0.1);

    // Agregar XP y monedas de la sesión.
    this.addXP(userId, totalXP, 'workout');
    progress.coins += coinsEarned;

    // Actualizar racha
    this.updateStreak(userId);

    // Verificar logros
    const newAchievements = this.checkAchievements(userId, progress);

    return {
      xpEarned: totalXP,
      coinsEarned,
      newAchievements
    };
  }

  /**
   * Actualiza la racha de días consecutivos
   */
  private updateStreak(userId: string): void {
    const progress = this.restoreProgress(userId);
    if (!progress) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!canUseBrowserStorage()) {
      this.persistProgress(progress);
      return;
    }

    const lastWorkoutKey = `last_workout_${userId}`;
    const lastWorkoutDate = window.localStorage.getItem(lastWorkoutKey);
    
    if (lastWorkoutDate) {
      const lastDate = new Date(lastWorkoutDate);
      lastDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Racha continúa
        progress.streak += 1;
      } else if (diffDays > 1) {
        // Racha rota
        progress.streak = 1;
      }
      // diffDays === 0 significa que ya entrenó hoy
    } else {
      // Primer workout
      progress.streak = 1;
    }

    progress.longestStreak = Math.max(progress.longestStreak, progress.streak);
    window.localStorage.setItem(lastWorkoutKey, today.toISOString());
    
    this.persistProgress(progress);
  }

  /**
   * Verifica y desbloquea logros
   */
  private checkAchievements(userId: string, progress: UserProgress): Achievement[] {
    const newAchievements: Achievement[] = [];
    const unlockedIds = new Set(progress.achievements.map((achievement) => achievement.id));

    for (const definition of this.achievementsDB) {
      if (unlockedIds.has(definition.id)) continue;

      let shouldUnlock = false;
      let currentProgress = 0;

      switch (definition.id) {
        case 'first_workout':
        case 'workout_warrior':
        case 'fitness_legend':
          currentProgress = progress.totalWorkouts;
          shouldUnlock = currentProgress >= definition.target;
          break;
        case 'seven_day_streak':
        case 'thirty_day_streak':
        case 'year_master':
          currentProgress = progress.streak;
          shouldUnlock = currentProgress >= definition.target;
          break;
        case 'calorie_burner':
        case 'calorie_destroyer':
          currentProgress = progress.totalCaloriesBurned;
          shouldUnlock = currentProgress >= definition.target;
          break;
        case 'level_10':
        case 'level_50':
        case 'level_100':
          currentProgress = progress.level;
          shouldUnlock = currentProgress >= definition.target;
          break;
      }

      if (!shouldUnlock) continue;

      const unlockedAchievement: Achievement = {
        ...definition,
        unlocked: true,
        unlockedAt: new Date(),
        progress: definition.target,
      };

      progress.achievements.push(unlockedAchievement);
      unlockedIds.add(definition.id);

      this.addXP(userId, definition.xpReward, `achievement:${definition.id}`);
      progress.coins += definition.coinReward;
      newAchievements.push(unlockedAchievement);
    }

    this.persistProgress(progress);
    return newAchievements;
  }

  /**
   * Genera misiones diarias/semanales
   */
  public generateMissions(userId: string, type: 'daily' | 'weekly' | 'monthly'): Mission[] {
    const missions: Mission[] = [];
    const progress = this.restoreProgress(userId);
    
    if (!progress) {
      throw new Error(`Usuario ${userId} no encontrado`);
    }

    const now = new Date();
    
    if (type === 'daily') {
      // Misión diaria fácil
      missions.push({
        id: `daily_${now.toDateString()}_1`,
        title: 'Calentamiento Matutino',
        description: 'Completa un workout de 15 minutos',
        type: 'daily',
        difficulty: 'easy',
        objective: {
          type: 'minutes',
          target: 15,
          current: 0
        },
        rewards: {
          xp: 100,
          coins: 25
        },
        expiresAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        completed: false,
        claimed: false
      });

      // Misión diaria media
      missions.push({
        id: `daily_${now.toDateString()}_2`,
        title: 'Quema Intensa',
        description: 'Quema 300 calorías hoy',
        type: 'daily',
        difficulty: 'medium',
        objective: {
          type: 'calories',
          target: 300,
          current: 0
        },
        rewards: {
          xp: 200,
          coins: 50
        },
        expiresAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        completed: false,
        claimed: false
      });
    } else if (type === 'weekly') {
      // Misión semanal
      missions.push({
        id: `weekly_${this.getWeekNumber(now)}`,
        title: 'Semana Productiva',
        description: 'Completa 5 entrenamientos esta semana',
        type: 'weekly',
        difficulty: 'hard',
        objective: {
          type: 'workouts',
          target: 5,
          current: 0
        },
        rewards: {
          xp: 500,
          coins: 150,
          gems: 5
        },
        expiresAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - now.getDay())),
        completed: false,
        claimed: false
      });
    }

    return missions;
  }

  /**
   * Obtiene tabla de clasificación global
   */
  public async getLeaderboard(limit: number = 10, userId?: string): Promise<LeaderboardEntry[]> {
    // No inventar posiciones globales. Hasta disponer de una fuente persistente
    // y aislada por usuario, solo devolvemos la posición local conocida.
    if (!userId) return [];

    const progress = this.restoreProgress(userId);
    if (!progress) return [];

    return [{
      rank: progress.rank || 0,
      userId,
      username: 'Tú',
      level: progress.level,
      xp: progress.xp,
      trophies: progress.achievements.length,
      isCurrentUser: true,
    }].slice(0, Math.max(0, limit));
  }

  /**
   * Evento cuando un usuario sube de nivel
   */
  private onLevelUp(userId: string, oldLevel: number, newLevel: number): void {
    console.log(`🎉 ¡${userId} subió del nivel ${oldLevel} al ${newLevel}!`);
    
    // Disparar efectos visuales/sonoros aquí
    // this.audioEngine.play('level_up');
    // this.visualEffects.showConfetti();
  }

  /**
   * Obtiene el número de semana del año
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  /**
   * Obtiene el progreso de un usuario
   */
  public getUserProgress(userId: string): UserProgress | null {
    return this.restoreProgress(userId);
  }

  /**
   * Canjea monedas por recompensas
   */
  public redeemRewards(userId: string, rewardType: string, cost: number): boolean {
    const progress = this.restoreProgress(userId);
    if (!progress) return false;

    if (progress.coins >= cost) {
      progress.coins -= cost;
      console.log(`✅ ${userId} canjeó ${rewardType} por ${cost} monedas`);
      this.persistProgress(progress);
      return true;
    }

    return false;
  }

  /**
   * Exporta todo el estado de gamificación
   */
  public exportState(): object {
    return {
      users: Array.from(this.progressCache.entries()),
      achievements: this.achievementsDB,
      badges: this.badgesDB,
      levelCurve: this.levelCurve
    };
  }

  /**
   * Importa estado de gamificación
   */
  public importState(state: any): void {
    if (!state || !Array.isArray(state.users)) return;
    this.progressCache = new Map(state.users);
    for (const [, progress] of this.progressCache) {
      this.persistProgress(progress);
    }
  }
}

// Hook personalizado para React
export const useGamification = (userId: string) => {
  const engine = GamificationEngine.getInstance();
  const [progress, setProgress] = React.useState<UserProgress | null>(null);

  React.useEffect(() => {
    const userProgress = engine.getUserProgress(userId);
    if (userProgress) {
      setProgress(userProgress);
    } else {
      const newProgress = engine.createNewUser(userId);
      setProgress(newProgress);
    }
  }, [userId]);

  const addXP = (amount: number) => {
    const result = engine.addXP(userId, amount);
    setProgress(engine.getUserProgress(userId));
    return result;
  };

  const completeWorkout = (calories: number, duration: number, effectiveness?: number) => {
    const result = engine.completeWorkout(userId, calories, duration, effectiveness);
    setProgress(engine.getUserProgress(userId));
    return result;
  };

  return {
    progress,
    addXP,
    completeWorkout,
    getMissions: () => engine.generateMissions(userId, 'daily'),
    getLeaderboard: (limit?: number) => engine.getLeaderboard(limit, userId)
  };
};

// Para compatibilidad con React
import React from 'react';

export default GamificationEngine;
