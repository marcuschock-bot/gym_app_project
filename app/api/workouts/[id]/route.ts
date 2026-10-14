import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getMongoClient } from "../../../../lib/mongodb";

const databaseName = process.env.MONGODB_DB ?? "gym_app";
const collectionName = "workouts";

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
  try {
    const client = await getMongoClient();
    if (!client) {
      return NextResponse.json({ error: "MongoDB is not configured." }, { status: 503 });
    }

    const { id } = await context.params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid workout id." }, { status: 400 });
    }

    const payload = (await request.json()) as Record<string, unknown>;
    const sets = normalizeSets(payload.sets);
    const totalSets = sets.length;
    const completedSets = sets.filter((set) => set.done).length;
    const volume = sets.reduce((sum, set) => sum + set.weight * set.reps, 0);

    const updateData = {
      workoutType: String(payload.workoutType ?? "Push"),
      focus: String(payload.focus ?? "Strength"),
      notes: payload.notes ? String(payload.notes) : null,
      sets,
      totalSets,
      completedSets,
      volume,
      updatedAt: new Date()
    };

    const existing = await client
      .db(databaseName)
      .collection<Record<string, unknown>>(collectionName)
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: "after" }
      );

    if (!existing) {
      return NextResponse.json({ error: "Workout not found." }, { status: 404 });
    }

    return NextResponse.json({
      workout: {
        id,
        date: new Date((existing.createdAt as Date | undefined) ?? new Date()).toISOString(),
        workoutType: updateData.workoutType,
        focus: updateData.focus,
        notes: updateData.notes,
        totalSets,
        completedSets,
        volume,
        sets
      }
    });
  } catch {
    return NextResponse.json({ error: "MongoDB is unavailable." }, { status: 503 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const client = await getMongoClient();
    if (!client) {
      return NextResponse.json({ error: "MongoDB is not configured." }, { status: 503 });
    }

    const { id } = await context.params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid workout id." }, { status: 400 });
    }

    const result = await client
      .db(databaseName)
      .collection(collectionName)
      .deleteOne({ _id: new ObjectId(id) });

    if (!result.deletedCount) {
      return NextResponse.json({ error: "Workout not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "MongoDB is unavailable." }, { status: 503 });
  }
}

