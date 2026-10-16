"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Dumbbell,
  Flame,
  LayoutDashboard,
  Menu,
  Minus,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Target,
  Trash2,
  Utensils,
  UserRound,
  X
} from "lucide-react";
import {
  defaultSets,
  exercises,
  initialHistory,
  schedule,
  type NavLabel,
  type SessionEntry,
  type SetEntry
} from "../lib/static-data";
import { foodDatabase, type FoodItem, type FoodLogEntry } from "../lib/foods";
import { usePersistentState } from "../lib/usePersistentState";

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

type Account = { name: string; email: string; password: string };
type RemoteFood = FoodLogEntry & { id: string };

const navItems: Array<{ label: NavLabel; icon: React.ComponentType<{ size?: number }> }> = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Workouts", icon: Dumbbell },
  { label: "Progress", icon: BarChart3 },
  { label: "Exercise library", icon: BookOpen },
  { label: "Nutrition", icon: Utensils }
];

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

const toDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateLabel = (value: string): string => {
  if (!value) {
    return "Today";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T12:00:00`));
};

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "green" | "orange" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export default function Home() {
  const [activeNav, setActiveNav] = useState<NavLabel>("Overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedDay, setSelectedDay] = usePersistentState("forge-selected-day", "Push");
  const [workoutStarted, setWorkoutStarted] = usePersistentState("forge-workout-started", false);
  const [query, setQuery] = usePersistentState("forge-exercise-query", "");
  const [showAllExercises, setShowAllExercises] = usePersistentState("forge-show-all", false);
  const [sets, setSets] = usePersistentState<SetEntry[]>("forge-sets", defaultSets);
  const [sessionHistory, setSessionHistory] = usePersistentState<SessionEntry[]>("forge-history", initialHistory);
  const [mealsLogged, setMealsLogged] = usePersistentState<FoodLogEntry[]>("forge-meals", []);
  const [foodQuery, setFoodQuery] = useState("");
  const [customExerciseName, setCustomExerciseName] = useState("");
  const [customExerciseMuscle, setCustomExerciseMuscle] = useState("Chest");
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showAddFood, setShowAddFood] = useState(false);
  const [customExercises, setCustomExercises] = usePersistentState<typeof exercises[0][]>("forge-custom-exercises", []);
  const [focus, setFocus] = usePersistentState("forge-focus", "Strength");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string>("");
  const [statusTone, setStatusTone] = useState<"ok" | "warn">("ok");
  const [isSaving, setIsSaving] = useState(false);
  const [calendarDate, setCalendarDate] = useState("");
  const calendarInputRef = useRef<HTMLInputElement>(null);
  const [account, setAccount] = usePersistentState<Account | null>("forge-account", null);
  const [authMode, setAuthMode] = useState<"signin" | "register" | null>(null);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [remoteFoods, setRemoteFoods] = useState<RemoteFood[]>([]);
  const [foodSearchPending, setFoodSearchPending] = useState(false);
  const [customFoodCalories, setCustomFoodCalories] = useState("");

  useEffect(() => {
    setCalendarDate(toDateInputValue(new Date()));
  }, []);

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

  const completedSets = sets.filter((set) => set.done).length;
  const totalVolume = sets.reduce((sum, set) => {
    const weight = Number.parseFloat(set.weight || "0");
    const reps = Number.parseFloat(set.reps || "0");
    return sum + (Number.isFinite(weight) && Number.isFinite(reps) ? weight * reps : 0);
  }, 0);

  const calorieGoal = 2400;
  const caloriesConsumed = Math.min(
    mealsLogged.reduce((sum, meal) => sum + meal.calories, 0),
    calorieGoal
  );
  const macroPercent = Math.min((caloriesConsumed / calorieGoal) * 100, 100);

  const filteredExercises = useMemo(
    () =>
        [...exercises, ...customExercises].filter((exercise) =>
        `${exercise.name} ${exercise.muscle} ${exercise.equipment}`.toLowerCase().includes(query.toLowerCase())
      ),
      [query, customExercises]
  );

  const visibleSchedule = useMemo(() => {
    const anchor = new Date(`${calendarDate || toDateInputValue(new Date())}T12:00:00`);
    const monday = new Date(anchor);
    const daysSinceMonday = (anchor.getDay() + 6) % 7;
    monday.setDate(anchor.getDate() - daysSinceMonday);

    return schedule.map((item, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return { ...item, date: String(date.getDate()) };
    });
  }, [calendarDate]);

  const toggleSet = (id: number) => {
    setSets((current) => current.map((set) => (set.id === id ? { ...set, done: !set.done } : set)));
  };

  const updateSetValue = (id: number, field: "weight" | "reps", value: string) => {
    setSets((current) => current.map((set) => (set.id === id ? { ...set, [field]: value } : set)));
  };

  const addSet = () => {
    setSets((current) => [
      ...current,
      { id: Math.max(0, ...current.map((set) => set.id)) + 1, weight: "60", reps: "8", done: false }
    ]);
  };

  const removeLastSet = () => {
    setSets((current) => (current.length > 1 ? current.slice(0, -1) : current));
    setStatusText("Removed the last set.");
    setStatusTone("ok");
  };

  const addExercise = () => {
      if (!customExerciseName.trim()) {
        setStatusText("Enter an exercise name first.");
        setStatusTone("warn");
        return;
      }
      const newEx = {
        name: customExerciseName,
        muscle: customExerciseMuscle,
        equipment: "Custom",
        last: "—"
      };
      setCustomExercises((current) => [...current, newEx]);
      setCustomExerciseName("");
      setShowAddExercise(false);
      setStatusText(`${customExerciseName} added to your library.`);
      setStatusTone("ok");
    };

  const searchFoods = async (value: string) => {
    setFoodQuery(value);
    if (value.trim().length < 2) {
      setRemoteFoods([]);
      return;
    }

    setFoodSearchPending(true);
    try {
      const response = await fetch(`/api/foods/search?q=${encodeURIComponent(value.trim())}`);
      const data = (await response.json()) as { foods?: RemoteFood[]; error?: string };
      if (!response.ok) {
        setStatusText(data.error ?? "Food search is unavailable.");
        setStatusTone("warn");
        setRemoteFoods([]);
        return;
      }
      setRemoteFoods(data.foods ?? []);
    } catch {
      setStatusText("Food search could not connect.");
      setStatusTone("warn");
    } finally {
      setFoodSearchPending(false);
    }
  };

  const addMeal = (food: FoodItem | FoodLogEntry) => {
    setMealsLogged((current) => {
      const existing = current.find((meal) => meal.name === food.name);
      if (existing) {
        return current.map((meal) => meal.name === food.name
          ? { ...meal, servings: meal.servings + 1, calories: meal.calories + food.calories }
          : meal);
      }
      return [...current, {
        ...food,
        id: "id" in food ? food.id : Math.random().toString(36).slice(2),
        servings: "servings" in food ? food.servings : 1
      }];
    });
    setFoodQuery("");
    setRemoteFoods([]);
    setShowAddFood(false);
    setStatusText(`${food.name} added to today’s nutrition.`);
    setStatusTone("ok");
  };

  const addCustomFood = () => {
    const calories = Number(customFoodCalories);
    if (!foodQuery.trim() || !Number.isFinite(calories) || calories < 0) {
      setStatusText("Enter a food name and valid calories.");
      setStatusTone("warn");
      return;
    }
    addMeal({ id: "", name: foodQuery.trim(), serving: "1 serving", servings: 1, calories, protein: 0, carbs: 0, fats: 0 });
    setCustomFoodCalories("");
  };

  const submitAuth = () => {
    const email = authEmail.trim().toLowerCase();
    if (!email || authPassword.length < 6 || (authMode === "register" && !authName.trim())) {
      setStatusText("Enter all fields. Passwords must be at least 6 characters.");
      setStatusTone("warn");
      return;
    }
    const users = JSON.parse(window.localStorage.getItem("forge-users") ?? "[]") as Account[];
    if (authMode === "register") {
      if (users.some((user) => user.email === email)) {
        setStatusText("An account with that email already exists.");
        setStatusTone("warn");
        return;
      }
      const next = { name: authName.trim(), email, password: authPassword };
      window.localStorage.setItem("forge-users", JSON.stringify([...users, next]));
      setAccount(next);
      setStatusText("Account created. You’re signed in.");
    } else {
      const found = users.find((user) => user.email === email && user.password === authPassword);
      if (!found) {
        setStatusText("Email or password is incorrect.");
        setStatusTone("warn");
        return;
      }
      setAccount(found);
      setStatusText(`Welcome back, ${found.name}.`);
    }
    setStatusTone("ok");
    setAuthMode(null);
    setAuthName("");
    setAuthEmail("");
    setAuthPassword("");
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

  const deleteSession = async (sessionId: string) => {
    setSessionHistory((current) => current.filter((session) => session.id !== sessionId));

    if (editingSessionId === sessionId) {
      resetEditor();
    }

    try {
      const response = await fetch(`/api/workouts/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
      if (!response.ok) {
        setStatusText("Deleted locally; server delete failed.");
        setStatusTone("warn");
        return;
      }
      setStatusText("Session deleted.");
      setStatusTone("ok");
    } catch {
      setStatusText("Deleted locally; network issue.");
      setStatusTone("warn");
    }
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

    const applySavedSession = (session: SessionEntry) => {
      setSessionHistory((current) => {
        const withoutOld = editingSessionId ? current.filter((item) => item.id !== editingSessionId) : current;
        return [session, ...withoutOld];
      });
    };

    setIsSaving(true);

    try {
      const response = await fetch(
        editingSessionId ? `/api/workouts/${encodeURIComponent(editingSessionId)}` : "/api/workouts",
        {
          method: editingSessionId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      if (response.ok) {
        const data = await response.json();
        const session = data?.workout ? mapApiWorkout(data.workout as ApiWorkout) : fallbackEntry;
        applySavedSession(session);
        setStatusText(editingSessionId ? "Session updated." : "Session saved.");
        setStatusTone("ok");
      } else {
        applySavedSession(fallbackEntry);
        setStatusText("Saved locally because API update failed.");
        setStatusTone("warn");
      }
    } catch {
      applySavedSession(fallbackEntry);
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
        {visibleSchedule.map((item) => (
          <button
            key={item.day}
            className={`day-card ${selectedDay === item.title ? "selected" : ""} ${item.color}`}
            onClick={() => {
              setSelectedDay(item.title);
              setCalendarDate(() => {
                const anchor = new Date(`${calendarDate || toDateInputValue(new Date())}T12:00:00`);
                const monday = new Date(anchor);
                monday.setDate(anchor.getDate() - ((anchor.getDay() + 6) % 7));
                const dayIndex = visibleSchedule.findIndex((day) => day.day === item.day);
                monday.setDate(monday.getDate() + dayIndex);
                return toDateInputValue(monday);
              });
              setActiveNav("Workouts");
            }}
          >
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
        <div className="section-heading"><div><p className="eyebrow">Stay consistent</p><h2>Training</h2></div><button className="period-button" onClick={() => setActiveNav("Progress")}>View progress <ChevronRight size={14} /></button></div>
        <div className="chart-wrap">
          <div className="empty-state">
            <p>No volume chart yet — log workouts to start tracking.</p>
          </div>
        </div>
      </div>
    );

  const renderNutritionCard = () => (
    <div className="section-block card nutrition-card">
        <div className="section-heading"><div><p className="eyebrow">Fuel the work</p><h2>Nutrition</h2></div><button className="icon-button small" onClick={() => setShowAddFood(!showAddFood)}><Plus size={16} /></button></div>
      <div className="calorie-total"><strong>{caloriesConsumed}</strong><span>/ {calorieGoal} kcal</span></div>
      <div className="calorie-bar"><span style={{ width: `${macroPercent}%` }} /></div>
      <div className="macro-list">
          <div><span className="macro-dot protein" /><span>Protein</span><strong>{mealsLogged.reduce((sum, m) => sum + m.protein, 0)}g</strong></div>
          <div><span className="macro-dot carbs" /><span>Carbs</span><strong>{mealsLogged.reduce((sum, m) => sum + m.carbs, 0)}g</strong></div>
          <div><span className="macro-dot fats" /><span>Fats</span><strong>{mealsLogged.reduce((sum, m) => sum + m.fats, 0)}g</strong></div>
      </div>
        <button className="outline-button" onClick={() => setShowAddFood(!showAddFood)}>Log a meal <Plus size={15} /></button>
        {showAddFood && (
          <div className="add-food-form">
            <input
              value={foodQuery}
              onChange={(event) => void searchFoods(event.target.value)}
              placeholder="Search FatSecret foods..."
              style={{ width: "100%", marginBottom: 8, padding: 6, borderRadius: 5, border: "1px solid #ddd" }}
            />
            <div>
              {foodSearchPending && <p className="form-help">Searching FatSecret...</p>}
              {!foodSearchPending && remoteFoods.length === 0 && foodQuery.length < 2 && (
                <p className="form-help">Type at least 2 characters to search the full food database.</p>
              )}
              {(remoteFoods.length ? remoteFoods : foodDatabase
                .filter((food) => food.name.toLowerCase().includes(foodQuery.toLowerCase()))
                .slice(0, 5)).map((food) => (
                  <button
                    key={food.name}
                    className="add-food-option"
                    onClick={() => addMeal(food)}
                  >
                    <span>{food.name}</span> · {food.serving} · {food.calories} kcal
                  </button>
                ))}
            </div>
            <input
              value={customFoodCalories}
              onChange={(event) => setCustomFoodCalories(event.target.value)}
              placeholder="Custom calories"
              type="number"
              style={{ width: "100%", marginTop: 8, padding: 6, borderRadius: 5, border: "1px solid #ddd" }}
            />
            <button className="add-custom-food" onClick={addCustomFood}>Add custom food</button>
          </div>
        )}
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
            {showAllExercises ? null : (
              <button type="button" className="exercise-row" style={{ borderBottom: 0, marginTop: 8 }} onClick={() => setShowAddExercise((open) => !open)}>
                <div className="exercise-thumb"><Plus size={17} /></div>
                <div className="exercise-info">
                  <strong>Add custom exercise</strong>
                  <span>({customExerciseMuscle})</span>
                </div>
              </button>
            )}
          </div>
        </div>
        {showAddExercise && (
          <div className="add-exercise-form">
            <input
              value={customExerciseName}
              onChange={(event) => setCustomExerciseName(event.target.value)}
              placeholder="Exercise name"
              style={{ width: "100%", marginBottom: 8, padding: 6, borderRadius: 5, border: "1px solid #ddd" }}
            />
            <select
              value={customExerciseMuscle}
              onChange={(event) => setCustomExerciseMuscle(event.target.value)}
              style={{ width: "100%", marginTop: 8, padding: 6, borderRadius: 5, border: "1px solid #ddd" }}
            >
              <option value="Chest">Chest</option>
              <option value="Back">Back</option>
              <option value="Legs">Legs</option>
              <option value="Shoulders">Shoulders</option>
              <option value="Arms">Arms</option>
              <option value="Abs">Abs</option>
            </select>
            <button
              className="add-exercise-submit"
              onClick={addExercise}
              style={{ width: "100%", marginTop: 8, padding: 6, background: "#f26b5d", color: "white", border: "none", borderRadius: 5 }}
            >
              Add
            </button>
          </div>
        )}
      </div>
    );

  const renderActiveCard = () => (
    <div className="section-block">
      <div className="section-heading"><div><p className="eyebrow">In the moment</p><h2>{workoutStarted ? "Active workout" : "Next up"}</h2></div><button className="icon-button small" onClick={removeLastSet} aria-label="Remove last set" title="Remove last set"><Minus size={16} /></button></div>
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
              <button className="set-number" onClick={() => toggleSet(set.id)}>{set.done ? "✓" : index + 1}</button>
              <input value={set.weight} onChange={(event) => updateSetValue(set.id, "weight", event.target.value)} />
              <span>kg</span>
              <input value={set.reps} onChange={(event) => updateSetValue(set.id, "reps", event.target.value)} />
              <span className="reps-label">reps</span>
              <button className="more-button" onClick={() => toggleSet(set.id)} aria-label={set.done ? "Mark incomplete" : "Mark complete"}><Check size={15} /></button>
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
        <div className="metric-card card"><div className="metric-icon coral"><Activity size={18} /></div><span className="metric-label">Weekly volume</span><strong>{(totalVolume + 12000).toLocaleString()} <small>kg</small></strong><span className="metric-change up">↑ 8.4% <em>vs last week</em></span></div>
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
          <div><strong>{account?.name ?? "Guest"}</strong><span>{account ? "Member · 3 day split" : "Guest · 3 day split"}</span></div>
          <button className="icon-button small" style={{border:0,background:"none"}} onClick={() => setAuthMode(account ? "signin" : "register")} aria-label="Account options"><MoreHorizontal size={18} className="muted-icon" /></button>
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
          <button className="nav-item" onClick={() => { setStatusText("Settings are saved automatically on this device."); setStatusTone("ok"); }}><Settings size={18} /><span>Settings</span></button>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
          <div>
            <p className="eyebrow">{formatDateLabel(calendarDate)}</p>
            <h1>Good morning, {account?.name ?? "Guest"} <span className="wave">👋</span></h1>
            <p className="workspace-subtitle">Workspace: {activeNav}</p>
          </div>
          <div className="top-actions">
            <button
              className="icon-button"
              onClick={() => {
                const input = calendarInputRef.current;
                if (!input) return;
                if (typeof input.showPicker === "function") {
                  input.showPicker();
                } else {
                  input.click();
                }
              }}
              aria-label="Choose calendar date"
              title="Choose calendar date"
            >
              <CalendarDays size={18} />
            </button>
            <input
              ref={calendarInputRef}
              className="calendar-input"
              type="date"
              value={calendarDate}
              onChange={(event) => {
                setCalendarDate(event.target.value);
                setStatusText(`Viewing ${formatDateLabel(event.target.value)}.`);
                setStatusTone("ok");
              }}
              aria-label="Choose calendar date"
            />
            <button className="top-avatar" onClick={() => setAuthMode(account ? "signin" : "register")} aria-label="Account">
              {account ? account.name.slice(0, 2).toUpperCase() : <UserRound size={16} />}
            </button>
          </div>
        </header>

        {statusText && <div className={`status-banner ${statusTone}`}>{statusText}</div>}

        <div className="dashboard-grid">
          {renderWorkspace()}
        </div>
      </section>
      {authMode && (
        <div className="modal-backdrop" role="presentation" onClick={() => setAuthMode(null)}>
          <section className="auth-modal card" role="dialog" aria-modal="true" aria-labelledby="auth-title" onClick={(event) => event.stopPropagation()}>
            <div className="section-heading">
              <div><p className="eyebrow">Your account</p><h2 id="auth-title">{account ? "Account" : authMode === "register" ? "Create your account" : "Sign in"}</h2></div>
              <button className="icon-button small" onClick={() => setAuthMode(null)} aria-label="Close account dialog"><X size={16} /></button>
            </div>
            {account ? (
              <div className="auth-content">
                <p>Signed in as <strong>{account.email}</strong>. Your local guest data stays on this device.</p>
                <button className="outline-button auth-action" onClick={() => { setAccount(null); setAuthMode(null); setStatusText("Signed out. You are now using Forge as a guest."); }}>Sign out</button>
              </div>
            ) : (
              <>
                {authMode === "register" && <input className="auth-input" value={authName} onChange={(event) => setAuthName(event.target.value)} placeholder="Name" autoComplete="name" />}
                <input className="auth-input" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="Email" type="email" autoComplete="email" />
                <input className="auth-input" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="Password (6+ characters)" type="password" autoComplete={authMode === "register" ? "new-password" : "current-password"} />
                <button className="primary-button auth-action" onClick={submitAuth}>{authMode === "register" ? "Register" : "Sign in"}</button>
                <button className="text-button auth-switch" onClick={() => setAuthMode(authMode === "register" ? "signin" : "register")}>
                  {authMode === "register" ? "Already have an account? Sign in" : "New here? Register"}
                </button>
                <p className="form-help">You can continue as a guest. Accounts currently stay on this browser until a server auth provider is connected.</p>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
