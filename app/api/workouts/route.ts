import { NextResponse } from "next/server";

import { createWorkout, type WorkoutInput } from "../../../lib/workouts";
import { insertWorkout, listWorkouts } from "../../../lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const workouts = await listWorkouts();
  return NextResponse.json({ workouts, storage: "local" });
}

export async function POST(request: Request) {
  let payload: WorkoutInput;
  try {
    payload = (await request.json()) as WorkoutInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const workout = createWorkout(payload);
  const stored = await insertWorkout(workout);

  return NextResponse.json({ workout: stored, storage: "local" }, { status: 201 });
}
