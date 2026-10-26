export type NavLabel = "Dashboard" | "Training" | "Progress" | "Library" | "Profile";

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
  category: "Push" | "Pull" | "Legs" | "Rest";
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
  { day: "Mon", date: "14", title: "Push", subtitle: "Chest · Shoulders · Triceps", color: "coral", exercises: 8, duration: "55 min" },
  { day: "Tue", date: "15", title: "Rest", subtitle: "Active recovery", color: "slate", exercises: 0, duration: "—" },
  { day: "Wed", date: "16", title: "Pull", subtitle: "Back · Biceps · Rear Delts", color: "violet", exercises: 8, duration: "50 min" },
  { day: "Thu", date: "17", title: "Rest", subtitle: "Mobility flow", color: "slate", exercises: 0, duration: "—" },
  { day: "Fri", date: "18", title: "Legs", subtitle: "Quads · Hamstrings · Calves · Glutes", color: "blue", exercises: 8, duration: "62 min" },
  { day: "Sat", date: "19", title: "Rest", subtitle: "Walk or light cardio", color: "slate", exercises: 0, duration: "—" },
  { day: "Sun", date: "20", title: "Rest", subtitle: "Reset for the week", color: "slate", exercises: 0, duration: "—" }
];

export const exercises: Exercise[] = [
  // Push — Chest · Shoulders · Triceps
  { name: "Barbell Bench Press", muscle: "Chest", equipment: "Barbell", last: "60 kg × 8", category: "Push" },
  { name: "Incline Dumbbell Press", muscle: "Chest", equipment: "Dumbbells", last: "24 kg × 10", category: "Push" },
  { name: "Cable Fly", muscle: "Chest", equipment: "Cable", last: "15 kg × 12", category: "Push" },
  { name: "Overhead Press", muscle: "Shoulders", equipment: "Barbell", last: "50 kg × 6", category: "Push" },
  { name: "Lateral Raises", muscle: "Shoulders", equipment: "Dumbbells", last: "12 kg × 15", category: "Push" },
  { name: "Cable Tricep Pushdown", muscle: "Triceps", equipment: "Cable", last: "27 kg × 12", category: "Push" },
  { name: "Skull Crushers", muscle: "Triceps", equipment: "Barbell", last: "30 kg × 10", category: "Push" },
  { name: "Dips", muscle: "Triceps", equipment: "Bodyweight", last: "BW × 12", category: "Push" },

  // Pull — Back · Biceps · Rear Delts
  { name: "Deadlift", muscle: "Back", equipment: "Barbell", last: "120 kg × 5", category: "Pull" },
  { name: "Bent-Over Row", muscle: "Back", equipment: "Barbell", last: "80 kg × 8", category: "Pull" },
  { name: "Lat Pulldown", muscle: "Back", equipment: "Cable", last: "52 kg × 10", category: "Pull" },
  { name: "Seated Cable Row", muscle: "Back", equipment: "Cable", last: "55 kg × 10", category: "Pull" },
  { name: "Pull-Ups", muscle: "Back", equipment: "Bodyweight", last: "BW × 8", category: "Pull" },
  { name: "Face Pulls", muscle: "Rear Delts", equipment: "Cable", last: "20 kg × 15", category: "Pull" },
  { name: "Barbell Curl", muscle: "Biceps", equipment: "Barbell", last: "30 kg × 10", category: "Pull" },
  { name: "Hammer Curl", muscle: "Biceps", equipment: "Dumbbells", last: "16 kg × 12", category: "Pull" },

  // Legs — Quads · Hamstrings · Calves · Glutes
  { name: "Barbell Squat", muscle: "Quads", equipment: "Barbell", last: "100 kg × 6", category: "Legs" },
  { name: "Romanian Deadlift", muscle: "Hamstrings", equipment: "Barbell", last: "80 kg × 8", category: "Legs" },
  { name: "Leg Press", muscle: "Quads", equipment: "Machine", last: "150 kg × 10", category: "Legs" },
  { name: "Bulgarian Split Squat", muscle: "Quads", equipment: "Dumbbells", last: "16 kg × 10", category: "Legs" },
  { name: "Leg Curl", muscle: "Hamstrings", equipment: "Machine", last: "50 kg × 12", category: "Legs" },
  { name: "Walking Lunges", muscle: "Glutes", equipment: "Dumbbells", last: "14 kg × 12", category: "Legs" },
  { name: "Standing Calf Raise", muscle: "Calves", equipment: "Machine", last: "70 kg × 15", category: "Legs" },
  { name: "Hip Thrust", muscle: "Glutes", equipment: "Barbell", last: "90 kg × 10", category: "Legs" }
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
