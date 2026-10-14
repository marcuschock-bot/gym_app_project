export type SetEntry = {
  id: string;
  weight: number;
  reps: number;
  done: boolean;
  order: number;
};

export type Workout = {
  id: string;
  date: string;
  workoutType: string;
  focus: string;
  notes: string | null;
  totalSets: number;
  completedSets: number;
  volume: number;
  sets: SetEntry[];
};

export type WorkoutInput = {
  workoutType?: string;
  focus?: string;
  notes?: string;
  sets?: unknown;
};

const normalizeSets = (setsInput: unknown): SetEntry[] => {
  if (!Array.isArray(setsInput)) {
    return [];
  }

  return setsInput.map((set, index) => {
    const candidate = typeof set === "object" && set !== null ? (set as Record<string, unknown>) : {};
    const weight = Number(candidate.weight ?? 0);
    const reps = Number(candidate.reps ?? 0);
    return {
      id: String(candidate.id ?? `set-${Date.now()}-${index}`),
      weight: Number.isFinite(weight) ? weight : 0,
      reps: Number.isFinite(reps) ? reps : 0,
      done: Boolean(candidate.done),
      order: Number(candidate.order ?? index)
    };
  });
};

const calculateVolume = (sets: SetEntry[]): number =>
  sets.reduce((sum, set) => sum + set.weight * set.reps, 0);

const buildWorkout = (id: string, payload: WorkoutInput, existing?: Workout): Workout => {
  const sets = normalizeSets(payload.sets);
  return {
    id,
    date: existing?.date ?? new Date().toISOString(),
    workoutType: String(payload.workoutType ?? existing?.workoutType ?? "Push"),
    focus: String(payload.focus ?? existing?.focus ?? "Strength"),
    notes: payload.notes !== undefined ? String(payload.notes) : (existing?.notes ?? null),
    totalSets: sets.length,
    completedSets: sets.filter((set) => set.done).length,
    volume: calculateVolume(sets),
    sets
  };
};

export const createWorkout = (payload: WorkoutInput): Workout =>
  buildWorkout(`wo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, payload);

export const updateWorkout = (existing: Workout, payload: WorkoutInput): Workout =>
  buildWorkout(existing.id, payload, existing);

export const normalizeWorkoutInput = normalizeSets;
