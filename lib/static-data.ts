export type NavLabel = "Overview" | "Workouts" | "Progress" | "Exercise library" | "Nutrition";

export type ScheduleDay = {
  day: string;
  date: string;
  title: string;
  subtitle: string;
  color: string;
  exercises: number;
  duration: string;
};

export type Exercise = {
  name: string;
  muscle: string;
  equipment: string;
  last: string;
};

export type ProgressPoint = {
  week: string;
  volume: number;
};

export type SetEntry = {
  id: number;
  weight: string;
  reps: string;
  done: boolean;
};

export type SessionEntry = {
  id: string;
  date: string;
  workoutType: string;
  focus: string;
  notes: string;
  totalSets: number;
  completedSets: number;
  volume: number;
  sets: SetEntry[];
};

export const schedule: ScheduleDay[] = [
  { day: "Mon", date: "14", title: "Push", subtitle: "Chest · Shoulders · Triceps", color: "coral", exercises: 6, duration: "52 min" },
  { day: "Tue", date: "15", title: "Rest", subtitle: "Active recovery", color: "slate", exercises: 0, duration: "—" },
  { day: "Wed", date: "16", title: "Pull", subtitle: "Back · Biceps · Rear delts", color: "violet", exercises: 7, duration: "48 min" },
  { day: "Thu", date: "17", title: "Rest", subtitle: "Mobility flow", color: "slate", exercises: 0, duration: "—" },
  { day: "Fri", date: "18", title: "Legs", subtitle: "Quads · Hamstrings · Calves", color: "blue", exercises: 8, duration: "61 min" },
  { day: "Sat", date: "19", title: "Rest", subtitle: "Walk or light cardio", color: "slate", exercises: 0, duration: "—" },
  { day: "Sun", date: "20", title: "Rest", subtitle: "Reset for the week", color: "slate", exercises: 0, duration: "—" }
];

export const exercises: Exercise[] = [
  { name: "Barbell Bench Press", muscle: "Chest", equipment: "Barbell", last: "60 kg × 8" },
  { name: "Lat Pulldown", muscle: "Back", equipment: "Cable", last: "52 kg × 10" },
  { name: "Romanian Deadlift", muscle: "Hamstrings", equipment: "Barbell", last: "80 kg × 8" },
  { name: "Dumbbell Shoulder Press", muscle: "Shoulders", equipment: "Dumbbells", last: "20 kg × 10" },
  { name: "Cable Tricep Pushdown", muscle: "Triceps", equipment: "Cable", last: "27 kg × 12" },
  { name: "Bulgarian Split Squat", muscle: "Quads", equipment: "Dumbbells", last: "16 kg × 10" }
];

export const defaultSets: SetEntry[] = [
  { id: 1, weight: "60", reps: "8", done: true },
  { id: 2, weight: "60", reps: "8", done: true },
  { id: 3, weight: "60", reps: "7", done: false }
];

export const initialHistory: SessionEntry[] = [
  {
    id: "s1",
    date: "Oct 11",
    workoutType: "Push",
    focus: "Upper body",
    notes: "Solid pressing volume",
    totalSets: 5,
    completedSets: 5,
    volume: 1850,
    sets: [
      { id: 1, weight: "60", reps: "8", done: true },
      { id: 2, weight: "60", reps: "8", done: true },
      { id: 3, weight: "70", reps: "6", done: true }
    ]
  },
  {
    id: "s2",
    date: "Oct 09",
    workoutType: "Legs",
    focus: "Strength",
    notes: "Kept tempo controlled",
    totalSets: 6,
    completedSets: 5,
    volume: 2100,
    sets: [
      { id: 1, weight: "80", reps: "6", done: true },
      { id: 2, weight: "75", reps: "8", done: true },
      { id: 3, weight: "100", reps: "5", done: true }
    ]
  },
  {
    id: "s3",
    date: "Oct 07",
    workoutType: "Pull",
    focus: "Back",
    notes: "Strong mind-muscle connection",
    totalSets: 4,
    completedSets: 4,
    volume: 1440,
    sets: [
      { id: 1, weight: "52", reps: "10", done: true },
      { id: 2, weight: "50", reps: "8", done: true },
      { id: 3, weight: "30", reps: "12", done: true }
    ]
  }
];

export const progress: ProgressPoint[] = [
  { week: "W1", volume: 8200 },
  { week: "W2", volume: 9400 },
  { week: "W3", volume: 9100 },
  { week: "W4", volume: 10800 },
  { week: "W5", volume: 11600 },
  { week: "W6", volume: 12400 },
  { week: "W7", volume: 11900 },
  { week: "W8", volume: 13800 }
];
