import { NextResponse } from "next/server";

import { mockWorkouts } from "../../../lib/mock-data";

type WorkoutSet = {
  id: string;
  weight: number;
  reps: number;
  done: boolean;
  order: number;
};

const normalizeSets = (setsInput: unknown): WorkoutSet[] => {
  if (!Array.isArray(setsInput)) {
    return [];
  }

  return setsInput.map((set, index) => {
    const candidate = typeof set === "object" && set !== null ? (set as Record<string, unknown>) : {};
    return {
      id: String(candidate.id ?? `${Date.now()}-${index}`),
      weight: Number(candidate.weight ?? 0),
      reps: Number(candidate.reps ?? 0),
      done: Boolean(candidate.done),
      order: Number(candidate.order ?? index)
    };
  });
};

export async function GET() {
  return NextResponse.json({ workouts: mockWorkouts, storage: "local" });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Record<string, unknown>;

  const sets = normalizeSets(payload.sets);
  const totalSets = sets.length;
  const completedSets = sets.filter((set) => set.done).length;
  const volume = sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
  const now = new Date();

  return NextResponse.json({
    workout: {
      id: `local-${Date.now()}`,
      date: now.toISOString(),
      workoutType: String(payload.workoutType ?? "Push"),
      focus: String(payload.focus ?? "Strength"),
      notes: payload.notes ? String(payload.notes) : null,
      totalSets,
      completedSets,
      volume,
      sets
    },
    storage: "local"
  });
}
