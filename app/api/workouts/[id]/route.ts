import { NextResponse } from "next/server";

import { updateWorkout, type WorkoutInput } from "../../../../lib/workouts";
import { findWorkout, removeWorkout, replaceWorkout } from "../../../../lib/storage";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const existing = await findWorkout(id);

  if (!existing) {
    return NextResponse.json({ error: "Workout not found" }, { status: 404 });
  }

  let payload: WorkoutInput;
  try {
    payload = (await request.json()) as WorkoutInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updated = updateWorkout(existing, payload);
  await replaceWorkout(id, updated);

  return NextResponse.json({ workout: updated, storage: "local" });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const removed = await removeWorkout(id);

  if (!removed) {
    return NextResponse.json({ error: "Workout not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, id, storage: "local" });
}
