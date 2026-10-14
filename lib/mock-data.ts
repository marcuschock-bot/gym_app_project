export type MockWorkout = {
  id: string;
  date: string;
  workoutType: string;
  focus: string;
  totalSets: number;
  completedSets: number;
  volume: number;
  sets: Array<{ id: string; weight: number; reps: number; done: boolean; order: number }>;
};

export const mockWorkouts: MockWorkout[] = [
  {
    id: "mock-1",
    date: "2026-10-11T00:00:00.000Z",
    workoutType: "Push",
    focus: "Upper body",
    totalSets: 5,
    completedSets: 5,
    volume: 1850,
    sets: [
      { id: "m1-s1", weight: 60, reps: 8, done: true, order: 0 },
      { id: "m1-s2", weight: 60, reps: 8, done: true, order: 1 },
      { id: "m1-s3", weight: 70, reps: 6, done: true, order: 2 },
      { id: "m1-s4", weight: 20, reps: 10, done: true, order: 3 },
      { id: "m1-s5", weight: 16, reps: 12, done: true, order: 4 }
    ]
  },
  {
    id: "mock-2",
    date: "2026-10-09T00:00:00.000Z",
    workoutType: "Legs",
    focus: "Strength",
    totalSets: 6,
    completedSets: 5,
    volume: 2100,
    sets: [
      { id: "m2-s1", weight: 80, reps: 6, done: true, order: 0 },
      { id: "m2-s2", weight: 75, reps: 8, done: true, order: 1 },
      { id: "m2-s3", weight: 100, reps: 5, done: true, order: 2 },
      { id: "m2-s4", weight: 16, reps: 10, done: false, order: 3 },
      { id: "m2-s5", weight: 35, reps: 12, done: true, order: 4 },
      { id: "m2-s6", weight: 25, reps: 15, done: true, order: 5 }
    ]
  },
  {
    id: "mock-3",
    date: "2026-10-07T00:00:00.000Z",
    workoutType: "Pull",
    focus: "Back",
    totalSets: 4,
    completedSets: 4,
    volume: 1440,
    sets: [
      { id: "m3-s1", weight: 52, reps: 10, done: true, order: 0 },
      { id: "m3-s2", weight: 50, reps: 8, done: true, order: 1 },
      { id: "m3-s3", weight: 30, reps: 12, done: true, order: 2 },
      { id: "m3-s4", weight: 20, reps: 12, done: true, order: 3 }
    ]
  }
];
