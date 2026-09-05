import type { WorkoutSession } from '../models';
import {
  computePersonalRecords,
  computeStreaks,
  computeVolumeSummary,
  pickBestSet,
  setPerformanceScore,
} from './progress-stats';
import { formatSetResult, summarizeSession } from './session-stats';

export const XP_PER_LEVEL = 150;

export type XpBreakdown = {
  base: number;
  sets: number;
  volume: number;
  completion: number;
  streak: number;
  personalRecords: number;
  total: number;
};

export type LevelProgress = {
  level: number;
  totalXp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
};

export type NewPersonalRecord = {
  exerciseId: string;
  label: string;
  previousLabel: string | null;
};

export type MilestoneDefinition = {
  id: string;
  title: string;
  description: string;
  stars: number;
};

export type MilestoneStatus = MilestoneDefinition & {
  unlocked: boolean;
};

export type GamificationSnapshot = {
  level: LevelProgress;
  stars: number;
  streak: number;
  longestStreak: number;
  workoutCount: number;
  milestones: MilestoneStatus[];
  unlockedCount: number;
};

export type SessionCelebration = {
  xp: XpBreakdown;
  levelBefore: LevelProgress;
  levelAfter: LevelProgress;
  leveledUp: boolean;
  newPersonalRecords: NewPersonalRecord[];
  newlyUnlocked: MilestoneStatus[];
  streak: number;
  stars: number;
};

export const MILESTONES: MilestoneDefinition[] = [
  {
    id: 'first_workout',
    title: 'First sweat',
    description: 'Complete your first workout',
    stars: 1,
  },
  {
    id: 'workouts_5',
    title: 'Getting started',
    description: 'Complete 5 workouts',
    stars: 1,
  },
  {
    id: 'workouts_10',
    title: 'Consistent',
    description: 'Complete 10 workouts',
    stars: 2,
  },
  {
    id: 'workouts_25',
    title: 'Dedicated',
    description: 'Complete 25 workouts',
    stars: 3,
  },
  {
    id: 'streak_3',
    title: 'On a roll',
    description: 'Reach a 3-day streak',
    stars: 1,
  },
  {
    id: 'streak_7',
    title: 'Week warrior',
    description: 'Reach a 7-day streak',
    stars: 2,
  },
  {
    id: 'streak_14',
    title: 'Unstoppable',
    description: 'Reach a 14-day streak',
    stars: 3,
  },
  {
    id: 'volume_5k',
    title: 'Volume hunter',
    description: 'Lift 5,000 kg total volume',
    stars: 1,
  },
  {
    id: 'volume_25k',
    title: 'Iron stack',
    description: 'Lift 25,000 kg total volume',
    stars: 2,
  },
  {
    id: 'first_pr',
    title: 'New heights',
    description: 'Set your first personal record',
    stars: 1,
  },
  {
    id: 'prs_5',
    title: 'Record breaker',
    description: 'Hold 5 personal records',
    stars: 2,
  },
];

export function levelFromXp(totalXp: number): LevelProgress {
  const safeXp = Math.max(0, Math.floor(totalXp));
  const level = 1 + Math.floor(safeXp / XP_PER_LEVEL);
  const xpIntoLevel = safeXp % XP_PER_LEVEL;
  return {
    level,
    totalXp: safeXp,
    xpIntoLevel,
    xpForNextLevel: XP_PER_LEVEL,
    progressPercent: Math.round((xpIntoLevel / XP_PER_LEVEL) * 100),
  };
}

export function computeSessionXp(
  session: WorkoutSession,
  options: { streak: number; newPrCount: number },
): XpBreakdown {
  const stats = summarizeSession(session);
  const base = 50;
  const sets = stats.completedSets * 5;
  const volume = Math.min(40, Math.floor(stats.volumeKg / 100) * 2);
  const completion = stats.totalSets > 0 && stats.completedSets === stats.totalSets ? 25 : 0;
  const streak = Math.min(7, Math.max(0, options.streak)) * 5;
  const personalRecords = Math.max(0, options.newPrCount) * 30;
  const total = base + sets + volume + completion + streak + personalRecords;

  return { base, sets, volume, completion, streak, personalRecords, total };
}

export function totalXpFromSessions(
  sessions: WorkoutSession[],
  today = new Date(),
): number {
  if (sessions.length === 0) {
    return 0;
  }

  // Chronological so streak/PR context matches earning history
  const ordered = [...sessions].sort(
    (a, b) =>
      new Date(a.completedAt ?? a.startedAt).getTime() -
      new Date(b.completedAt ?? b.startedAt).getTime(),
  );

  let total = 0;
  const prior: WorkoutSession[] = [];

  for (const session of ordered) {
    const streak = computeStreaks([...prior, session], sessionAsToday(session, today)).current;
    const newPrCount = detectNewPersonalRecords(session, prior).length;
    total += computeSessionXp(session, { streak, newPrCount }).total;
    prior.push(session);
  }

  return total;
}

export function detectNewPersonalRecords(
  session: WorkoutSession,
  priorSessions: WorkoutSession[],
): NewPersonalRecord[] {
  const previousBest = new Map(
    computePersonalRecords(priorSessions).map((record) => [record.exerciseId, record]),
  );
  const results: NewPersonalRecord[] = [];

  for (const exercise of session.exercises) {
    const best = pickBestSet(exercise.sets);
    if (!best) continue;

    const score = setPerformanceScore(best);
    if (score <= 0) continue;

    const prior = previousBest.get(exercise.exerciseId);
    if (!prior || score > prior.score) {
      results.push({
        exerciseId: exercise.exerciseId,
        label: formatSetResult(best),
        previousLabel: prior?.label ?? null,
      });
    }
  }

  return results;
}

export function evaluateMilestones(input: {
  workoutCount: number;
  longestStreak: number;
  totalVolumeKg: number;
  personalRecordCount: number;
}): MilestoneStatus[] {
  const checks: Record<string, boolean> = {
    first_workout: input.workoutCount >= 1,
    workouts_5: input.workoutCount >= 5,
    workouts_10: input.workoutCount >= 10,
    workouts_25: input.workoutCount >= 25,
    streak_3: input.longestStreak >= 3,
    streak_7: input.longestStreak >= 7,
    streak_14: input.longestStreak >= 14,
    volume_5k: input.totalVolumeKg >= 5000,
    volume_25k: input.totalVolumeKg >= 25000,
    first_pr: input.personalRecordCount >= 1,
    prs_5: input.personalRecordCount >= 5,
  };

  return MILESTONES.map((milestone) => ({
    ...milestone,
    unlocked: checks[milestone.id] ?? false,
  }));
}

export function buildGamificationSnapshot(
  sessions: WorkoutSession[],
  today = new Date(),
): GamificationSnapshot {
  const streaks = computeStreaks(sessions, today);
  const volume = computeVolumeSummary(sessions, today);
  const prs = computePersonalRecords(sessions);
  const milestones = evaluateMilestones({
    workoutCount: volume.workoutCount,
    longestStreak: streaks.longest,
    totalVolumeKg: volume.totalKg,
    personalRecordCount: prs.length,
  });
  const unlocked = milestones.filter((item) => item.unlocked);
  const totalXp = totalXpFromSessions(sessions, today);

  return {
    level: levelFromXp(totalXp),
    stars: unlocked.reduce((sum, item) => sum + item.stars, 0),
    streak: streaks.current,
    longestStreak: streaks.longest,
    workoutCount: volume.workoutCount,
    milestones,
    unlockedCount: unlocked.length,
  };
}

export function buildSessionCelebration(
  session: WorkoutSession,
  priorSessions: WorkoutSession[],
  today = new Date(),
): SessionCelebration {
  const allAfter = [...priorSessions, session];
  const before = buildGamificationSnapshot(priorSessions, today);
  const after = buildGamificationSnapshot(allAfter, today);
  const newPersonalRecords = detectNewPersonalRecords(session, priorSessions);
  const streak = computeStreaks(allAfter, sessionAsToday(session, today)).current;
  const xp = computeSessionXp(session, {
    streak,
    newPrCount: newPersonalRecords.length,
  });

  const newlyUnlocked = after.milestones.filter((milestone) => {
    if (!milestone.unlocked) return false;
    const previous = before.milestones.find((item) => item.id === milestone.id);
    return !previous?.unlocked;
  });

  return {
    xp,
    levelBefore: before.level,
    levelAfter: after.level,
    leveledUp: after.level.level > before.level.level,
    newPersonalRecords,
    newlyUnlocked,
    streak,
    stars: after.stars,
  };
}

/** Use session completion day as "today" when replaying XP history */
function sessionAsToday(session: WorkoutSession, fallback: Date): Date {
  const completed = session.completedAt ?? session.startedAt;
  return completed ? new Date(completed) : fallback;
}
