"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Dumbbell,
  Flame,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Target,
  Trash2,
  Utensils,
  X
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type NavLabel = "Overview" | "Workouts" | "Progress" | "Exercise library" | "Nutrition";

type ScheduleDay = {
  day: string;
  date: string;
  title: string;
  subtitle: string;
  color: string;
  exercises: number;
  duration: string;
};

type Exercise = {
  name: string;
  muscle: string;
  equipment: string;
  last: string;
};

type SetEntry = {
  id: number;
  weight: string;
  reps: string;
  done: boolean;
};

type SessionEntry = {
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

type ApiWorkout = {
  id: string;
  date: string;
  workoutType: string;
  focus?: string;
  notes?: string | null;
  totalSets: number;
  completedSets: number;
  volume: number;
  sets?: Array<{ id?: string; weight: number; reps: number; done: boolean; order?: number }>;
};

const schedule: ScheduleDay[] = [
  { day: "Mon", date: "14", title: "Push", subtitle: "Chest · Shoulders · Triceps", color: "coral", exercises: 6, duration: "52 min" },
  { day: "Tue", date: "15", title: "Rest", subtitle: "Active recovery", color: "slate", exercises: 0, duration: "—" },
  { day: "Wed", date: "16", title: "Pull", subtitle: "Back · Biceps · Rear delts", color: "violet", exercises: 7, duration: "48 min" },
  { day: "Thu", date: "17", title: "Rest", subtitle: "Mobility flow", color: "slate", exercises: 0, duration: "—" },
  { day: "Fri", date: "18", title: "Legs", subtitle: "Quads · Hamstrings · Calves", color: "blue", exercises: 8, duration: "61 min" },
  { day: "Sat", date: "19", title: "Rest", subtitle: "Walk or light cardio", color: "slate", exercises: 0, duration: "—" },
  { day: "Sun", date: "20", title: "Rest", subtitle: "Reset for the week", color: "slate", exercises: 0, duration: "—" }
];

const exercises: Exercise[] = [
  { name: "Barbell Bench Press", muscle: "Chest", equipment: "Barbell", last: "60 kg × 8" },
  { name: "Lat Pulldown", muscle: "Back", equipment: "Cable", last: "52 kg × 10" },
  { name: "Romanian Deadlift", muscle: "Hamstrings", equipment: "Barbell", last: "80 kg × 8" },
  { name: "Dumbbell Shoulder Press", muscle: "Shoulders", equipment: "Dumbbells", last: "20 kg × 10" },
  { name: "Cable Tricep Pushdown", muscle: "Triceps", equipment: "Cable", last: "27 kg × 12" },
  { name: "Bulgarian Split Squat", muscle: "Quads", equipment: "Dumbbells", last: "16 kg × 10" }
];

const defaultSets: SetEntry[] = [
  { id: 1, weight: "60", reps: "8", done: true },
  { id: 2, weight: "60", reps: "8", done: true },
  { id: 3, weight: "60", reps: "7", done: false }
];

const initialHistory: SessionEntry[] = [
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

const progress = [
  { week: "W1", volume: 8200 },
  { week: "W2", volume: 9400 },
  { week: "W3", volume: 9100 },
  { week: "W4", volume: 10800 },
  { week: "W5", volume: 11600 },
  { week: "W6", volume: 12400 },
  { week: "W7", volume: 11900 },
  { week: "W8", volume: 13800 }
];

const navItems: Array<{ label: NavLabel; icon: React.ComponentType<{ size?: number }> }> = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Workouts", icon: Dumbbell },
  { label: "Progress", icon: BarChart3 },
  { label: "Exercise library", icon: BookOpen },
  { label: "Nutrition", icon: Utensils }
];

const persist = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

const mapApiWorkout = (session: ApiWorkout): SessionEntry => ({
  id: session.id,
  date: new Date(session.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  workoutType: session.workoutType ?? "Workout",
  focus: session.focus ?? "Strength",
  notes: session.notes ?? "",
  totalSets: session.totalSets ?? 0,
  completedSets: session.completedSets ?? 0,
  volume: session.volume ?? 0,
  sets: (session.sets ?? []).map((set, index) => ({
    id: index + 1,
    weight: String(set.weight ?? 0),
    reps: String(set.reps ?? 0),
    done: Boolean(set.done)
  }))
});

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "green" | "orange" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export default function Home() {
  const [activeNav, setActiveNav] = useState<NavLabel>("Overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(() => persist("forge-selected-day", "Push"));
  const [workoutStarted, setWorkoutStarted] = useState(() => persist("forge-workout-started", false));
  const [query, setQuery] = useState(() => persist("forge-exercise-query", ""));
  const [showAllExercises, setShowAllExercises] = useState(() => persist("forge-show-all", false));
  const [sets, setSets] = useState<SetEntry[]>(() => persist("forge-sets", defaultSets));
  const [sessionHistory, setSessionHistory] = useState<SessionEntry[]>(() => persist("forge-history", initialHistory));
  const [mealsLogged, setMealsLogged] = useState(() => persist("forge-meals", 2));
  const [focus, setFocus] = useState(() => persist("forge-focus", "Strength"));
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string>("");
  const [statusTone, setStatusTone] = useState<"ok" | "warn">("ok");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        const response = await fetch("/api/workouts");
        if (!response.ok) {
          setStatusText("Using local fallback data. Configure MongoDB to persist sessions.");
          setStatusTone("warn");
          return;
        }

        const data = await response.json();
        const nextHistory = Array.isArray(data?.workouts) ? (data.workouts as ApiWorkout[]) : [];
        if (nextHistory.length > 0) {
          setSessionHistory(nextHistory.map(mapApiWorkout));
          setStatusText("Loaded your local workout history.");
          setStatusTone("ok");
        }
      } catch {
        setStatusText("Could not load workout data. Showing your local data.");
        setStatusTone("warn");
      }
    };

    void loadWorkouts();
  }, []);

  useEffect(() => {
    window.localStorage.setItem("forge-selected-day", JSON.stringify(selectedDay));
  }, [selectedDay]);

  useEffect(() => {
    window.localStorage.setItem("forge-workout-started", JSON.stringify(workoutStarted));
  }, [workoutStarted]);

  useEffect(() => {
    window.localStorage.setItem("forge-exercise-query", JSON.stringify(query));
  }, [query]);

  useEffect(() => {
    window.localStorage.setItem("forge-show-all", JSON.stringify(showAllExercises));
  }, [showAllExercises]);

  useEffect(() => {
    window.localStorage.setItem("forge-sets", JSON.stringify(sets));
  }, [sets]);

  useEffect(() => {
    window.localStorage.setItem("forge-history", JSON.stringify(sessionHistory));
  }, [sessionHistory]);

  useEffect(() => {
    window.localStorage.setItem("forge-meals", JSON.stringify(mealsLogged));
  }, [mealsLogged]);

  useEffect(() => {
    window.localStorage.setItem("forge-focus", JSON.stringify(focus));
  }, [focus]);

  const completedSets = sets.filter((set) => set.done).length;
  const totalVolume = sets.reduce((sum, set) => {
    const weight = Number.parseFloat(set.weight || "0");
    const reps = Number.parseFloat(set.reps || "0");
    return sum + (Number.isFinite(weight) && Number.isFinite(reps) ? weight * reps : 0);
  }, 0);

  const calorieGoal = 2400;
  const caloriesConsumed = Math.min(1480 + mealsLogged * 220 + completedSets * 45, calorieGoal);
  const macroPercent = Math.min((caloriesConsumed / calorieGoal) * 100, 100);

  const filteredExercises = useMemo(
    () =>
      exercises.filter((exercise) =>
        `${exercise.name} ${exercise.muscle} ${exercise.equipment}`.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );

  const toggleSet = (id: number) => {
    setSets((current) => current.map((set) => (set.id === id ? { ...set, done: !set.done } : set)));
  };

  const updateSetValue = (id: number, field: "weight" | "reps", value: string) => {
    setSets((current) => current.map((set) => (set.id === id ? { ...set, [field]: value } : set)));
  };

  const addSet = () => {
    setSets((current) => [...current, { id: Date.now(), weight: "60", reps: "8", done: false }]);
  };

  const removeLastSet = () => {
    setSets((current) => (current.length > 1 ? current.slice(0, -1) : current));
  };

  const resetEditor = () => {
    setEditingSessionId(null);
    setWorkoutStarted(false);
    setSelectedDay("Push");
    setFocus("Strength");
    setSets(defaultSets);
  };

  const editSession = (session: SessionEntry) => {
    setEditingSessionId(session.id);
    setSelectedDay(session.workoutType);
    setFocus(session.focus);
    setSets(
      session.sets.length > 0
        ? session.sets.map((set, index) => ({ ...set, id: index + 1 }))
        : defaultSets
    );
    setWorkoutStarted(true);
    setActiveNav("Workouts");
    setStatusText(`Editing ${session.workoutType} session from ${session.date}.`);
    setStatusTone("ok");
  };

  const deleteSession = (sessionId: string) => {
    setSessionHistory((current) => current.filter((session) => session.id !== sessionId));

    if (editingSessionId === sessionId) {
      resetEditor();
    }
    setStatusText("Removed local session.");
    setStatusTone("ok");
  };

  const saveWorkout = async () => {
    const payload = {
      workoutType: selectedDay === "Rest" ? "Recovery" : selectedDay,
      focus,
      notes: `${selectedDay} session`,
      sets: sets.map((set, index) => ({
        id: String(index + 1),
        weight: Number.parseFloat(set.weight || "0"),
        reps: Number.parseInt(set.reps || "0", 10),
        done: set.done,
        order: index
      }))
    };

    const fallbackEntry: SessionEntry = {
      id: editingSessionId ?? `local-${Date.now()}`,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      workoutType: payload.workoutType,
      focus: payload.focus,
      notes: payload.notes,
      totalSets: sets.length,
      completedSets,
      volume: totalVolume,
      sets
    };

    setIsSaving(true);

    try {
      const response = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        const session = data?.workout ? mapApiWorkout(data.workout as ApiWorkout) : fallbackEntry;

        setSessionHistory((current) => {
          const withoutOld = editingSessionId ? current.filter((item) => item.id !== editingSessionId) : current;
          return [session, ...withoutOld].slice(0, 8);
        });

        setStatusText(editingSessionId ? "Session updated." : "Session saved.");
        setStatusTone("ok");
      } else {
        setSessionHistory((current) => {
          const withoutOld = editingSessionId ? current.filter((item) => item.id !== editingSessionId) : current;
          return [fallbackEntry, ...withoutOld].slice(0, 8);
        });
        setStatusText("Saved locally because API update failed.");
        setStatusTone("warn");
      }
    } catch {
      setSessionHistory((current) => {
        const withoutOld = editingSessionId ? current.filter((item) => item.id !== editingSessionId) : current;
        return [fallbackEntry, ...withoutOld].slice(0, 8);
      });
      setStatusText("Network issue. Session saved locally.");
      setStatusTone("warn");
    } finally {
      setIsSaving(false);
      setEditingSessionId(null);
      setWorkoutStarted(false);
      setFocus(selectedDay === "Rest" ? "Recovery" : "Strength");
    }
  };

  const renderSchedule = () => (
    <section className="section-block schedule-section">
      <div className="section-heading"><div><p className="eyebrow">Your rhythm</p><h2>This week</h2></div><button className="text-button" onClick={() => setActiveNav("Workouts")}>Open workouts <ChevronRight size={15} /></button></div>
      <div className="schedule-grid">
        {schedule.map((item) => (
          <button key={item.day} className={`day-card ${selectedDay === item.title ? "selected" : ""} ${item.color}`} onClick={() => { setSelectedDay(item.title); setActiveNav("Workouts"); }}>
            <span className="day-name">{item.day}</span>
            <span className="date-number">{item.date}</span>
            <span className="day-title">{item.title}</span>
            <span className="day-subtitle">{item.subtitle}</span>
            {item.exercises > 0 && <span className="day-meta">{item.exercises} exercises · {item.duration}</span>}
          </button>
        ))}
      </div>
    </section>
  );

  const renderProgressCard = () => (
    <div className="section-block card progress-card">
      <div className="section-heading"><div><p className="eyebrow">Stay consistent</p><h2>Training volume</h2></div><button className="period-button" onClick={() => setActiveNav("Progress")}>Last 8 weeks <ChevronRight size={14} /></button></div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={progress} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f26b5d" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f26b5d" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#ece9e6" />
            <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "#8b8986", fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#aaa7a3", fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #eee8e4", boxShadow: "0 8px 24px rgba(40,30,20,.08)" }} formatter={(v) => [`${Number(v).toLocaleString()} kg`, "Volume"]} />
            <Area type="monotone" dataKey="volume" stroke="#ef735f" strokeWidth={2.5} fill="url(#volumeFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderNutritionCard = () => (
    <div className="section-block card nutrition-card">
      <div className="section-heading"><div><p className="eyebrow">Fuel the work</p><h2>Nutrition</h2></div><button className="icon-button small" onClick={() => setMealsLogged((current) => current + 1)}><Plus size={16} /></button></div>
      <div className="calorie-total"><strong>{caloriesConsumed}</strong><span>/ {calorieGoal} kcal</span></div>
      <div className="calorie-bar"><span style={{ width: `${macroPercent}%` }} /></div>
      <div className="macro-list">
        <div><span className="macro-dot protein" /><span>Protein</span><strong>{80 + mealsLogged * 2}g</strong></div>
        <div><span className="macro-dot carbs" /><span>Carbs</span><strong>{128 + mealsLogged * 4}g</strong></div>
        <div><span className="macro-dot fats" /><span>Fats</span><strong>{33 + mealsLogged}g</strong></div>
      </div>
      <button className="outline-button" onClick={() => setMealsLogged((current) => current + 1)}>Log a meal <Plus size={15} /></button>
    </div>
  );

  const renderLibraryCard = () => (
    <div className="section-block">
      <div className="section-heading"><div><p className="eyebrow">Quick access</p><h2>Exercise library</h2></div><button className="text-button" onClick={() => setShowAllExercises(!showAllExercises)}>{showAllExercises ? "Show less" : "Browse all"} <ChevronRight size={15} /></button></div>
      <div className="library-card card">
        <div className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search exercises..." /></div>
        <div className="exercise-list">
          {filteredExercises.slice(0, showAllExercises ? 6 : 4).map((exercise) => (
            <button type="button" className="exercise-row" key={exercise.name} onClick={() => { setSelectedDay(exercise.muscle === "Chest" || exercise.muscle === "Shoulders" || exercise.muscle === "Triceps" ? "Push" : exercise.muscle === "Back" ? "Pull" : "Legs"); setActiveNav("Workouts"); }}>
              <div className="exercise-thumb"><Dumbbell size={17} /></div>
              <div className="exercise-info"><strong>{exercise.name}</strong><span>{exercise.muscle} · {exercise.equipment}</span></div>
              <span className="last-result">{exercise.last}</span>
              <ChevronRight size={16} className="muted-icon" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderActiveCard = () => (
    <div className="section-block">
      <div className="section-heading"><div><p className="eyebrow">In the moment</p><h2>{workoutStarted ? "Active workout" : "Next up"}</h2></div><button className="icon-button small" onClick={removeLastSet}><MoreHorizontal size={16} /></button></div>
      <div className="active-card card">
        <div className="active-top">
          <div className="active-icon"><Dumbbell size={20} /></div>
          <div>
            <strong>{selectedDay === "Rest" ? "Recovery" : `${selectedDay} day`}</strong>
            <span>{selectedDay === "Rest" ? "Light movement and mobility" : "Build strong, clean reps"}</span>
          </div>
          <Badge tone="green">{completedSets}/{sets.length} sets</Badge>
        </div>

        <div className="set-table">
          <div className="set-head"><span>SET</span><span>WEIGHT</span><span>REPS</span><span /></div>
          {sets.map((set, index) => (
            <div className={`set-row ${set.done ? "complete" : ""}`} key={set.id}>
              <button className="set-number" onClick={() => toggleSet(set.id)}>{set.done ? "?" : index + 1}</button>
              <input value={set.weight} onChange={(event) => updateSetValue(set.id, "weight", event.target.value)} />
              <span>kg</span>
              <input value={set.reps} onChange={(event) => updateSetValue(set.id, "reps", event.target.value)} />
              <span className="reps-label">reps</span>
              <button className="more-button" onClick={() => toggleSet(set.id)}><MoreHorizontal size={15} /></button>
            </div>
          ))}
        </div>

        <div className="session-actions">
          <button className="add-set-button" onClick={addSet}><Plus size={15} /> Add set</button>
          <div className="session-actions-right">
            {editingSessionId && <button className="subtle-button" onClick={resetEditor}>Cancel edit</button>}
            <button className="primary-button compact" onClick={() => void saveWorkout()} disabled={isSaving}>{isSaving ? "Saving..." : editingSessionId ? "Update workout" : "Finish workout"}</button>
          </div>
        </div>

        <div className="history-panel">
          <div className="section-heading mini-heading"><div><p className="eyebrow">Recent sessions</p><h2>Logbook</h2></div></div>
          <div className="history-list">
            {sessionHistory.map((session) => (
              <div key={session.id} className="history-row">
                <div className="history-date">{session.date}</div>
                <div className="history-body">
                  <strong>{session.workoutType} day</strong>
                  <span>{session.completedSets}/{session.totalSets} sets · {session.focus}</span>
                </div>
                <div className="history-volume">{session.volume.toLocaleString()} kg</div>
                <div className="history-actions">
                  <button className="subtle-button" onClick={() => editSession(session)}>Edit</button>
                  <button className="danger-button" onClick={() => void deleteSession(session.id)}><Trash2 size={12} /> Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <>
      <section className="hero-card card">
        <div className="hero-copy">
          <Badge tone="orange"><span className="status-dot" /> Today&apos;s workout</Badge>
          <h2>{selectedDay === "Rest" ? "Recovery day" : `${selectedDay} day — let&apos;s work`}</h2>
          <p>{selectedDay === "Rest" ? "A little movement goes a long way." : `Focus: ${focus}. Small steps. Serious progress.`}</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => { setWorkoutStarted(true); setActiveNav("Workouts"); }}>{workoutStarted ? "Workout in progress" : "Start workout"} <ChevronRight size={17} /></button>
            <button className="secondary-button" onClick={() => setActiveNav("Workouts")}>Open workspace</button>
          </div>
        </div>
        <div className="hero-visual"><div className="ring ring-outer"><div className="ring ring-inner"><Dumbbell size={34} /></div></div><span>Week 08</span></div>
      </section>

      <section className="metric-row">
        <div className="metric-card card"><div className="metric-icon coral"><Activity size={18} /></div><span className="metric-label">Weekly volume</span><strong>{(totalVolume + 12000).toLocaleString()} <small>kg</small></strong><span className="metric-change up">? 8.4% <em>vs last week</em></span></div>
        <div className="metric-card card"><div className="metric-icon violet"><Target size={18} /></div><span className="metric-label">Workouts done</span><strong>{sessionHistory.length} <small>sessions</small></strong><span className="metric-change up">Active this week</span></div>
        <div className="metric-card card"><div className="metric-icon blue"><Flame size={18} /></div><span className="metric-label">Current streak</span><strong>12 <small>days</small></strong><span className="metric-change neutral">Best: 19 days</span></div>
      </section>

      {renderSchedule()}

      <section className="content-two-col">
        {renderProgressCard()}
        {renderNutritionCard()}
      </section>

      <section className="content-two-col bottom-row">
        {renderLibraryCard()}
        {renderActiveCard()}
      </section>
    </>
  );

  const renderWorkouts = () => (
    <>
      {renderSchedule()}
      <section className="content-two-col single-col">
        {renderActiveCard()}
      </section>
    </>
  );

  const renderProgress = () => (
    <>
      <section className="metric-row">
        <div className="metric-card card"><div className="metric-icon coral"><Activity size={18} /></div><span className="metric-label">Latest session volume</span><strong>{sessionHistory[0]?.volume.toLocaleString() ?? 0} <small>kg</small></strong><span className="metric-change up">{sessionHistory[0]?.workoutType ?? "No data"}</span></div>
        <div className="metric-card card"><div className="metric-icon violet"><Target size={18} /></div><span className="metric-label">Completion rate</span><strong>{sets.length ? Math.round((completedSets / sets.length) * 100) : 0}%</strong><span className="metric-change up">Current workout</span></div>
        <div className="metric-card card"><div className="metric-icon blue"><BarChart3 size={18} /></div><span className="metric-label">Total sessions</span><strong>{sessionHistory.length}</strong><span className="metric-change neutral">Stored in logbook</span></div>
      </section>
      <section className="content-two-col">
        {renderProgressCard()}
        <div className="section-block card progress-card">
          <div className="section-heading"><div><p className="eyebrow">Session notes</p><h2>Recent highlights</h2></div></div>
          <div className="history-list">
            {sessionHistory.slice(0, 5).map((session) => (
              <div key={`progress-${session.id}`} className="history-row">
                <div className="history-date">{session.date}</div>
                <div className="history-body"><strong>{session.workoutType} day</strong><span>{session.notes || "No notes"}</span></div>
                <div className="history-volume">{session.volume.toLocaleString()} kg</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );

  const renderLibrary = () => (
    <section className="content-two-col single-col">
      {renderLibraryCard()}
    </section>
  );

  const renderNutrition = () => (
    <section className="content-two-col single-col">
      {renderNutritionCard()}
    </section>
  );

  const renderWorkspace = () => {
    switch (activeNav) {
      case "Workouts":
        return renderWorkouts();
      case "Progress":
        return renderProgress();
      case "Exercise library":
        return renderLibrary();
      case "Nutrition":
        return renderNutrition();
      default:
        return renderOverview();
    }
  };

  return (
    <main className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Dumbbell size={18} strokeWidth={2.5} /></div>
          <span>forge</span>
          <button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <div className="profile-card">
          <div className="avatar">MC</div>
          <div><strong>Marcus Chen</strong><span>Intermediate · 3 day split</span></div>
          <MoreHorizontal size={18} className="muted-icon" />
        </div>
        <nav className="nav-list">
          <p className="nav-label">Workspace</p>
          {navItems.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${activeNav === label ? "active" : ""}`} onClick={() => { setActiveNav(label); setMenuOpen(false); }}>
              <Icon size={18} /> <span>{label}</span>
              {label === "Workouts" && <span className="nav-count">{sessionHistory.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="streak-card"><Flame size={18} fill="currentColor" /><div><strong>12 day streak</strong><span>Keep the momentum going</span></div></div>
          <button className="nav-item" onClick={() => setStatusText("Settings panel is coming in the next iteration.")}><Settings size={18} /><span>Settings</span></button>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
          <div>
            <p className="eyebrow">Tuesday, October 15, 2024</p>
            <h1>Good morning, Marcus <span className="wave">?</span></h1>
            <p className="workspace-subtitle">Workspace: {activeNav}</p>
          </div>
          <div className="top-actions"><button className="icon-button"><CalendarDays size={18} /></button><button className="top-avatar">MC</button></div>
        </header>

        {statusText && <div className={`status-banner ${statusTone}`}>{statusText}</div>}

        <div className="dashboard-grid">
          {renderWorkspace()}
        </div>
      </section>
    </main>
  );
}
