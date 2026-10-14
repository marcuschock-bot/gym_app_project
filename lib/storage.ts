import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Workout } from "./workouts";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "workouts.json");

let cache: Workout[] | null = null;

const readStore = async (): Promise<Workout[]> => {
  if (cache) {
    return cache;
  }

  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    cache = Array.isArray(parsed) ? (parsed as Workout[]) : [];
  } catch {
    cache = [];
  }

  return cache;
};

const writeStore = async (workouts: Workout[]): Promise<void> => {
  cache = workouts;
  await mkdir(DATA_DIR, { recursive: true });
  const temp = `${DATA_FILE}.tmp`;
  await writeFile(temp, JSON.stringify(workouts, null, 2), "utf-8");
  await rename(temp, DATA_FILE);
};

export const listWorkouts = async (): Promise<Workout[]> => {
  const workouts = await readStore();
  return [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const findWorkout = async (id: string): Promise<Workout | null> => {
  const workouts = await readStore();
  return workouts.find((workout) => workout.id === id) ?? null;
};

export const insertWorkout = async (workout: Workout): Promise<Workout> => {
  const workouts = await readStore();
  const next = [workout, ...workouts];
  await writeStore(next);
  return workout;
};

export const replaceWorkout = async (id: string, updated: Workout): Promise<boolean> => {
  const workouts = await readStore();
  const index = workouts.findIndex((workout) => workout.id === id);
  if (index === -1) {
    return false;
  }
  const next = workouts.slice();
  next[index] = updated;
  await writeStore(next);
  return true;
};

export const removeWorkout = async (id: string): Promise<boolean> => {
  const workouts = await readStore();
  const next = workouts.filter((workout) => workout.id !== id);
  if (next.length === workouts.length) {
    return false;
  }
  await writeStore(next);
  return true;
};
