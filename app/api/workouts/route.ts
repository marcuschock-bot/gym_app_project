import { NextResponse } from "next/server";

import { getMongoClient } from "../../../lib/mongodb";
import { mockWorkouts } from "../../../lib/mock-data";

const databaseName = process.env.MONGODB_DB ?? "gym_app";
const collectionName = "workouts";

type WorkoutSet = {
  id: string;
  weight: number;
  reps: number;
  done: boolean;
  order: number;
};

type WorkoutDocument = {
  _id: { toString(): string };
  workoutType: string;
  focus?: string;
  notes?: string;
  totalSets: number;
  completedSets: number;
  volume: number;
  sets: WorkoutSet[];
  createdAt: Date;
  updatedAt: Date;
};

const mapWorkout = (workout: WorkoutDocument) => ({
  id: workout._id.toString(),
  date: workout.createdAt ? new Date(workout.createdAt).toISOString() : new Date().toISOString(),
  workoutType: workout.workoutType,
  focus: workout.focus ?? "Strength",
  totalSets: workout.totalSets,
  completedSets: workout.completedSets,
  volume: workout.volume,
  notes: workout.notes ?? null,
  sets: (workout.sets ?? []).map((set) => ({
    id: set.id,
    weight: Number(set.weight),
    reps: Number(set.reps),
    done: Boolean(set.done),
    order: Number(set.order ?? 0)
  }))
});

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
  try {
    const client = await getMongoClient();

    if (!client) {
      return NextResponse.json({ workouts: mockWorkouts });
    }

    const workouts = await client
      .db(databaseName)
      .collection<WorkoutDocument>(collectionName)
      .find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    return NextResponse.json({ workouts: workouts.map(mapWorkout) });
  } catch {
    return NextResponse.json({ workouts: mockWorkouts });
  }
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Record<string, unknown>;

  const sets = normalizeSets(payload.sets);
  const totalSets = sets.length;
  const completedSets = sets.filter((set) => set.done).length;
  const volume = sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
  const now = new Date();

  try {
    const client = await getMongoClient();

    if (!client) {
      return NextResponse.json({
        workout: {
          id: `mock-${Date.now()}`,
          date: now.toISOString(),
          workoutType: String(payload.workoutType ?? "Push"),
          focus: String(payload.focus ?? "Strength"),
          notes: payload.notes ? String(payload.notes) : null,
          totalSets,
          completedSets,
          volume,
          sets
        }
      });
    }

    const insert = await client.db(databaseName).collection(collectionName).insertOne({
      workoutType: String(payload.workoutType ?? "Push"),
      focus: String(payload.focus ?? "Strength"),
      notes: payload.notes ? String(payload.notes) : null,
      totalSets,
      completedSets,
      volume,
      sets,
      createdAt: now,
      updatedAt: now
    });

    return NextResponse.json({
      workout: {
        id: insert.insertedId.toString(),
        date: now.toISOString(),
        workoutType: String(payload.workoutType ?? "Push"),
        focus: String(payload.focus ?? "Strength"),
        notes: payload.notes ? String(payload.notes) : null,
        totalSets,
        completedSets,
        volume,
        sets
      }
    });
  } catch {
    return NextResponse.json({
      workout: {
        id: `mock-${Date.now()}`,
        date: now.toISOString(),
        workoutType: String(payload.workoutType ?? "Push"),
        focus: String(payload.focus ?? "Strength"),
        notes: payload.notes ? String(payload.notes) : null,
        totalSets,
        completedSets,
        volume,
        sets
      }
    });
  }
}
