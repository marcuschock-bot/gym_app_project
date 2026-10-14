import { NextResponse } from "next/server";

type SetPayload = {
  id: string;
  weight: number;
  reps: number;
  done: boolean;
  order: number;
};

const normalizeSets = (setsInput: unknown): SetPayload[] => {
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

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const payload = (await request.json()) as Record<string, unknown>;
  const sets = normalizeSets(payload.sets);
  const totalSets = sets.length;
  const completedSets = sets.filter((set) => set.done).length;
  const volume = sets.reduce((sum, set) => sum + set.weight * set.reps, 0);

  return NextResponse.json({
    workout: {
      id,
      date: new Date().toISOString(),
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

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return NextResponse.json({ ok: true, id, storage: "local" });
}
