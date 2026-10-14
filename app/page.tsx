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
  name: string;
  totalSets: number;
  completedSets: number;
  volume: number;
  focus: string;
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
  { id: "s1", date: "Oct 11", name: "Push day", totalSets: 5, completedSets: 5, volume: 1850, focus: "Upper body" },
  { id: "s2", date: "Oct 09", name: "Legs day", totalSets: 6, completedSets: 5, volume: 2100, focus: "Strength" },
  { id: "s3", date: "Oct 07", name: "Pull day", totalSets: 4, completedSets: 4, volume: 1440, focus: "Back" }
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

const navItems = [
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

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "green" | "orange" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export default function Home() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(() => persist("forge-selected-day", "Push"));
  const [workoutStarted, setWorkoutStarted] = useState(() => persist("forge-workout-started", false));
  const [query, setQuery] = useState(() => persist("forge-exercise-query", ""));
  const [showAllExercises, setShowAllExercises] = useState(() => persist("forge-show-all", false));
  const [sets, setSets] = useState<SetEntry[]>(() => persist("forge-sets", defaultSets));
  const [sessionHistory, setSessionHistory] = useState<SessionEntry[]>(() => persist("forge-history", initialHistory));
  const [mealsLogged, setMealsLogged] = useState(() => persist("forge-meals", 2));
  const [focus, setFocus] = useState(() => persist("forge-focus", "Strength"));

  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        const response = await fetch("/api/workouts");
        if (!response.ok) return;
        const data = await response.json();
        const nextHistory = Array.isArray(data?.workouts) ? data.workouts : [];

        if (nextHistory.length > 0) {
          setSessionHistory(
            nextHistory.map((session: any) => ({
              id: session.id,
              date: new Date(session.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              name: session.workoutType ? `${session.workoutType} day` : "Workout",
              totalSets: session.totalSets ?? 0,
              completedSets: session.completedSets ?? 0,
              volume: session.volume ?? 0,
              focus: session.focus ?? "Strength"
            }))
          );
        }
      } catch {
        // Fall back to localStorage data if the DB-backed API is unavailable.
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

  const toggleSet = (id: number) =>
    setSets((current) => current.map((set) => (set.id === id ? { ...set, done: !set.done } : set)));

  const addSet = () =>
    setSets((current) => [...current, { id: Date.now(), weight: "60", reps: "8", done: false }]);

  const saveWorkout = async () => {
    const newEntry: SessionEntry = {
      id: `session-${Date.now()}`,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      name: `${selectedDay} day`,
      totalSets: sets.length,
      completedSets,
      volume: totalVolume,
      focus
    };

    try {
      const response = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutType: selectedDay === "Rest" ? "Recovery" : selectedDay,
          focus,
          notes: `${selectedDay} session`,
          sets: sets.map((set) => ({
            weight: Number.parseFloat(set.weight || "0"),
            reps: Number.parseInt(set.reps || "0", 10),
            done: set.done
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.workout) {
          setSessionHistory((current) => {
            const normalized = [{
              id: data.workout.id,
              date: new Date(data.workout.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              name: `${data.workout.workoutType} day`,
              totalSets: data.workout.totalSets ?? sets.length,
              completedSets: data.workout.completedSets ?? completedSets,
              volume: data.workout.volume ?? totalVolume,
              focus: data.workout.focus ?? focus
            }, ...current].slice(0, 4);
            return normalized;
          });
        }
      }
    } catch {
      setSessionHistory((current) => [newEntry, ...current].slice(0, 4));
    }

    setWorkoutStarted(false);
    setFocus(selectedDay === "Rest" ? "Recovery" : "Strength");
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
              {label === "Workouts" && <span className="nav-count">3</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="streak-card"><Flame size={18} fill="currentColor" /><div><strong>12 day streak</strong><span>Keep the momentum going</span></div></div>
          <button className="nav-item"><Settings size={18} /><span>Settings</span></button>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
          <div>
            <p className="eyebrow">Tuesday, October 15, 2024</p>
            <h1>Good morning, Marcus <span className="wave">✦</span></h1>
          </div>
          <div className="top-actions"><button className="icon-button"><CalendarDays size={18} /></button><button className="top-avatar">MC</button></div>
        </header>

        <div className="dashboard-grid">
          <section className="hero-card card">
            <div className="hero-copy">
              <Badge tone="orange"><span className="status-dot" /> Today&apos;s workout</Badge>
              <h2>{selectedDay === "Rest" ? "Recovery day" : `${selectedDay} day — let&apos;s work`}</h2>
              <p>{selectedDay === "Rest" ? "A little movement goes a long way." : `Focus: ${focus}. Small steps. Serious progress.`}</p>
              <div className="hero-actions">
                <button className="primary-button" onClick={() => setWorkoutStarted(true)}>{workoutStarted ? "Workout in progress" : "Start workout"} <ChevronRight size={17} /></button>
                <button className="secondary-button" onClick={saveWorkout}>Save session</button>
              </div>
            </div>
            <div className="hero-visual"><div className="ring ring-outer"><div className="ring ring-inner"><Dumbbell size={34} /></div></div><span>Week 08</span></div>
          </section>

          <section className="metric-row">
            <div className="metric-card card"><div className="metric-icon coral"><Activity size={18} /></div><span className="metric-label">Weekly volume</span><strong>{(totalVolume + 12000).toLocaleString()} <small>kg</small></strong><span className="metric-change up">↑ 8.4% <em>vs last week</em></span></div>
            <div className="metric-card card"><div className="metric-icon violet"><Target size={18} /></div><span className="metric-label">Workouts done</span><strong>18 <small>/ 20</small></strong><span className="metric-change up">↑ 2 <em>this month</em></span></div>
            <div className="metric-card card"><div className="metric-icon blue"><Flame size={18} /></div><span className="metric-label">Current streak</span><strong>12 <small>days</small></strong><span className="metric-change neutral">Best: 19 days</span></div>
          </section>

          <section className="section-block schedule-section">
            <div className="section-heading"><div><p className="eyebrow">Your rhythm</p><h2>This week</h2></div><button className="text-button">View calendar <ChevronRight size={15} /></button></div>
            <div className="schedule-grid">
              {schedule.map((item) => (
                <button key={item.day} className={`day-card ${selectedDay === item.title ? "selected" : ""} ${item.color}`} onClick={() => setSelectedDay(item.title)}>
                  <span className="day-name">{item.day}</span>
                  <span className="date-number">{item.date}</span>
                  <span className="day-title">{item.title}</span>
                  <span className="day-subtitle">{item.subtitle}</span>
                  {item.exercises > 0 && <span className="day-meta">{item.exercises} exercises · {item.duration}</span>}
                </button>
              ))}
            </div>
          </section>

          <section className="content-two-col">
            <div className="section-block card progress-card">
              <div className="section-heading"><div><p className="eyebrow">Stay consistent</p><h2>Training volume</h2></div><button className="period-button">Last 8 weeks <ChevronRight size={14} /></button></div>
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

            <div className="section-block card nutrition-card">
              <div className="section-heading"><div><p className="eyebrow">Fuel the work</p><h2>Nutrition</h2></div><button className="icon-button small" onClick={() => setMealsLogged((current) => current + 1)}><Plus size={16} /></button></div>
              <div className="calorie-total"><strong>{caloriesConsumed}</strong><span>/ {calorieGoal} kcal</span></div>
              <div className="calorie-bar"><span style={{ width: `${macroPercent}%` }} /></div>
              <div className="macro-list">
                <div><span className="macro-dot protein" /><span>Protein</span><strong>82g</strong></div>
                <div><span className="macro-dot carbs" /><span>Carbs</span><strong>130g</strong></div>
                <div><span className="macro-dot fats" /><span>Fats</span><strong>34g</strong></div>
              </div>
              <button className="outline-button" onClick={() => setMealsLogged((current) => current + 1)}>Log a meal <Plus size={15} /></button>
            </div>
          </section>

          <section className="content-two-col bottom-row">
            <div className="section-block">
              <div className="section-heading"><div><p className="eyebrow">Quick access</p><h2>Exercise library</h2></div><button className="text-button" onClick={() => setShowAllExercises(!showAllExercises)}>{showAllExercises ? "Show less" : "Browse all"} <ChevronRight size={15} /></button></div>
              <div className="library-card card">
                <div className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search exercises..." /></div>
                <div className="exercise-list">
                  {filteredExercises.slice(0, showAllExercises ? 6 : 4).map((exercise) => (
                    <div className="exercise-row" key={exercise.name}>
                      <div className="exercise-thumb"><Dumbbell size={17} /></div>
                      <div className="exercise-info"><strong>{exercise.name}</strong><span>{exercise.muscle} · {exercise.equipment}</span></div>
                      <span className="last-result">{exercise.last}</span>
                      <ChevronRight size={16} className="muted-icon" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="section-block">
              <div className="section-heading"><div><p className="eyebrow">In the moment</p><h2>{workoutStarted ? "Active workout" : "Next up"}</h2></div><button className="icon-button small"><MoreHorizontal size={16} /></button></div>
              <div className="active-card card">
                <div className="active-top">
                  <div className="active-icon"><Dumbbell size={20} /></div>
                  <div>
                    <strong>{selectedDay === "Rest" ? "Recovery" : `${selectedDay} day`}</strong>
                    <span>{selectedDay === "Rest" ? "Light movement and mobility" : "Chest · Shoulders · Triceps"}</span>
                  </div>
                  <Badge tone="green">{completedSets}/{sets.length} sets</Badge>
                </div>

                <div className="set-table">
                  <div className="set-head"><span>SET</span><span>WEIGHT</span><span>REPS</span><span /></div>
                  {sets.map((set, index) => (
                    <div className={`set-row ${set.done ? "complete" : ""}`} key={set.id}>
                      <button className="set-number" onClick={() => toggleSet(set.id)}>{set.done ? "✓" : index + 1}</button>
                      <input value={set.weight} onChange={(event) => setSets((current) => current.map((item) => item.id === set.id ? { ...item, weight: event.target.value } : item))} />
                      <span>kg</span>
                      <input value={set.reps} onChange={(event) => setSets((current) => current.map((item) => item.id === set.id ? { ...item, reps: event.target.value } : item))} />
                      <span className="reps-label">reps</span>
                      <button className="more-button"><MoreHorizontal size={15} /></button>
                    </div>
                  ))}
                </div>

                <div className="session-actions">
                  <button className="add-set-button" onClick={addSet}><Plus size={15} /> Add set</button>
                  <button className="primary-button compact" onClick={saveWorkout}>Finish workout</button>
                </div>

                <div className="history-panel">
                  <div className="section-heading mini-heading"><div><p className="eyebrow">Recent sessions</p><h2>Logbook</h2></div></div>
                  <div className="history-list">
                    {sessionHistory.map((session) => (
                      <div key={session.id} className="history-row">
                        <div className="history-date">{session.date}</div>
                        <div className="history-body">
                          <strong>{session.name}</strong>
                          <span>{session.completedSets}/{session.totalSets} sets · {session.focus}</span>
                        </div>
                        <div className="history-volume">{session.volume.toLocaleString()} kg</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
