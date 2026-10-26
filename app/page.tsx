"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Dumbbell,
  Flame,
  LayoutDashboard,
  Minus,
  Plus,
  Search,
  Shield,
  Star,
  Trash2,
  TrendingUp,
  UserRound,
  X,
  Zap
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

// ─── Types ──────────────────────────────────────────────────────────────────

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

// ─── XP / Rank System ───────────────────────────────────────────────────────

const RANKS = ["E", "D", "C", "B", "A", "S", "National"] as const;
type Rank = typeof RANKS[number];

function getXPForRank(rankIndex: number): number {
  return Math.round(500 * Math.pow(1.2, rankIndex));
}

function getRankFromXP(xp: number): {
  rank: Rank;
  rankIndex: number;
  currentXP: number;
  neededXP: number;
  progress: number;
} {
  let totalXP = 0;
  for (let i = 0; i < RANKS.length - 1; i++) {
    const needed = getXPForRank(i);
    if (xp < totalXP + needed) {
      const currentXP = xp - totalXP;
      return {
        rank: RANKS[i],
        rankIndex: i,
        currentXP,
        neededXP: needed,
        progress: (currentXP / needed) * 100
      };
    }
    totalXP += needed;
  }
  return { rank: "National", rankIndex: RANKS.length - 1, currentXP: 0, neededXP: 1, progress: 100 };
}

// ─── Nav items ───────────────────────────────────────────────────────────────

const SL_NAV_ITEMS: Array<{ label: NavLabel; icon: React.ComponentType<{ size?: number }> }> = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Training", icon: Dumbbell },
  { label: "Progress", icon: BarChart3 },
  { label: "Library", icon: BookOpen },
  { label: "Profile", icon: UserRound }
];

// ─── Utility functions ───────────────────────────────────────────────────────

const mapApiWorkout = (session: ApiWorkout): SessionEntry => ({
  id: session.id,
  date: new Date(session.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  workoutType: session.workoutType ?? "Workout",
  focus: session.focus ?? "Strength",
  notes: session.notes ?? "",
  totalSets: session.totalSets ?? 0,
  completedSets: session.completedSets ?? 0,
  volume: session.volume ?? 0,
  sets: (Array.isArray(session?.sets) ? session.sets : []).map((set, index) => ({
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
  if (!value) return "Today";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T12:00:00`));
};

// ─── Small UI helpers ─────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: Rank }) {
  const cls = rank === "National" ? "rank-National" : `rank-${rank}`;
  return (
    <span className={`rank-badge ${cls}`}>
      <Shield size={10} />
      RANK {rank === "National" ? "NATIONAL LEVEL" : rank}
    </span>
  );
}

function WorkoutTypeChip({ type }: { type: string }) {
  if (type === "Push") return <span className="chip chip-push">⚡ Push</span>;
  if (type === "Pull") return <span className="chip chip-pull">🌀 Pull</span>;
  if (type === "Legs") return <span className="chip chip-legs">⚡ Legs</span>;
  return <span className="chip chip-rest">— Rest</span>;
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function Home() {
  // Nav
  const [activeNav, setActiveNav] = usePersistentState<NavLabel>("forge-sl-nav", "Dashboard");

  // Workout state
  const [selectedDay, setSelectedDay] = usePersistentState("forge-selected-day", "Push");
  const [workoutStarted, setWorkoutStarted] = usePersistentState("forge-workout-started", false);
  const [sets, setSets] = usePersistentState<SetEntry[]>("forge-sets", defaultSets);
  const [sessionHistory, setSessionHistory] = usePersistentState<SessionEntry[]>("forge-history", initialHistory);
  const [focus, setFocus] = usePersistentState("forge-focus", "Strength");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  // XP / Rank
  const [hunterXP, setHunterXP] = usePersistentState("forge-sl-xp", 0);
  const rankInfo = getRankFromXP(hunterXP);

  // Library
  const [libraryTab, setLibraryTab] = usePersistentState<"Push" | "Pull" | "Legs">("forge-lib-tab", "Push");
  const [query, setQuery] = usePersistentState("forge-exercise-query", "");
  const [customExercises, setCustomExercises] = usePersistentState<typeof exercises[0][]>("forge-custom-exercises", []);

  // Nutrition (kept for API compatibility)
  const [mealsLogged, setMealsLogged] = usePersistentState<FoodLogEntry[]>("forge-meals", []);
  const [foodQuery, setFoodQuery] = useState("");
  const [remoteFoods, setRemoteFoods] = useState<RemoteFood[]>([]);
  const [foodSearchPending, setFoodSearchPending] = useState(false);
  const [customFoodCalories, setCustomFoodCalories] = useState("");
  const [showAddFood, setShowAddFood] = useState(false);

  // Custom exercise form
  const [customExerciseName, setCustomExerciseName] = useState("");
  const [customExerciseMuscle, setCustomExerciseMuscle] = useState("Chest");

  // Status
  const [statusText, setStatusText] = useState<string>("");
  const [statusTone, setStatusTone] = useState<"ok" | "warn">("ok");
  const [isSaving, setIsSaving] = useState(false);

  // Calendar
  const [calendarDate, setCalendarDate] = useState("");
  const calendarInputRef = useRef<HTMLInputElement>(null);

  // Auth
  const [account, setAccount] = usePersistentState<Account | null>("forge-account", null);
  const [authMode, setAuthMode] = useState<"signin" | "register" | null>(null);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  // ─── Effects ───────────────────────────────────────────────────────────────

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
          setStatusText("Loaded your workout history.");
          setStatusTone("ok");
        }
      } catch {
        setStatusText("Could not load workout data. Showing local data.");
        setStatusTone("warn");
      }
    };
    void loadWorkouts();
  }, []);

  // ─── Derived state ─────────────────────────────────────────────────────────

  const safeSets = Array.isArray(sets) ? sets : defaultSets;
  const safeMeals = Array.isArray(mealsLogged) ? mealsLogged : [];
  const safeHistory = Array.isArray(sessionHistory) ? sessionHistory : initialHistory;
  const safeCustomExercises = Array.isArray(customExercises) ? customExercises : [];

  const completedSets = safeSets.filter((set) => set.done).length;
  const totalVolume = safeSets.reduce((sum, set) => {
    const weight = Number.parseFloat(set.weight || "0");
    const reps = Number.parseFloat(set.reps || "0");
    return sum + (Number.isFinite(weight) && Number.isFinite(reps) ? weight * reps : 0);
  }, 0);

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

  const allExercises = useMemo(
    () => [...exercises, ...safeCustomExercises],
    [safeCustomExercises]
  );

  const filteredLibraryExercises = useMemo(
    () =>
      allExercises.filter(
        (ex) =>
          ex.category === libraryTab &&
          `${ex.name} ${ex.muscle} ${ex.equipment}`.toLowerCase().includes((query || "").toLowerCase())
      ),
    [allExercises, libraryTab, query]
  );

  const todaysExercises = useMemo(
    () => allExercises.filter((ex) => ex.category === selectedDay),
    [allExercises, selectedDay]
  );

  const totalSessionsCount = safeHistory.length;
  const totalVolumeAll = safeHistory.reduce((sum, s) => sum + s.volume, 0);
  const streakCount = Math.min(totalSessionsCount, 12);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const toggleSet = (id: number) => {
    const current = Array.isArray(sets) ? sets : defaultSets;
    const target = current.find((s) => s.id === id);
    if (target && !target.done) {
      // Marking as done = +10 XP
      setHunterXP((prev) => prev + 10);
    }
    setSets((cur) => (Array.isArray(cur) ? cur : defaultSets).map((set) => (set.id === id ? { ...set, done: !set.done } : set)));
  };

  const updateSetValue = (id: number, field: "weight" | "reps", value: string) => {
    setSets((cur) => (Array.isArray(cur) ? cur : defaultSets).map((set) => (set.id === id ? { ...set, [field]: value } : set)));
  };

  const addSet = () => {
    setSets((cur) => {
      const list = Array.isArray(cur) ? cur : defaultSets;
      return [...list, { id: Math.max(0, ...list.map((s) => s.id)) + 1, weight: "60", reps: "8", done: false }];
    });
  };

  const removeLastSet = () => {
    setSets((cur) => {
      const list = Array.isArray(cur) ? cur : defaultSets;
      return list.length > 1 ? list.slice(0, -1) : list;
    });
    setStatusText("Removed the last set.");
    setStatusTone("ok");
  };

  const addExercise = () => {
    if (!customExerciseName.trim()) {
      setStatusText("Enter an exercise name first.");
      setStatusTone("warn");
      return;
    }
    const cat = ["Chest", "Shoulders", "Triceps"].includes(customExerciseMuscle)
      ? "Push"
      : ["Back", "Biceps", "Rear Delts"].includes(customExerciseMuscle)
      ? "Pull"
      : "Legs";
    const newEx = {
      name: customExerciseName,
      muscle: customExerciseMuscle,
      equipment: "Custom",
      last: "—",
      category: cat as "Push" | "Pull" | "Legs"
    };
    setCustomExercises((cur) => [...(Array.isArray(cur) ? cur : []), newEx]);
    setCustomExerciseName("");
    setStatusText(`${customExerciseName} added to library.`);
    setStatusTone("ok");
  };

  const searchFoods = async (value: string) => {
    setFoodQuery(value);
    if (value.trim().length < 2) { setRemoteFoods([]); return; }
    setFoodSearchPending(true);
    try {
      const response = await fetch(`/api/foods/search?q=${encodeURIComponent(value.trim())}`);
      const data = (await response.json()) as { foods?: RemoteFood[]; error?: string };
      if (!response.ok) { setRemoteFoods([]); return; }
      setRemoteFoods(data.foods ?? []);
    } catch {
      setStatusText("Food search could not connect.");
      setStatusTone("warn");
    } finally {
      setFoodSearchPending(false);
    }
  };

  const addMeal = (food: FoodItem | FoodLogEntry) => {
    setMealsLogged((cur) => {
      const list = Array.isArray(cur) ? cur : [];
      const existing = list.find((m) => m.name === food.name);
      if (existing) {
        return list.map((m) =>
          m.name === food.name ? { ...m, servings: m.servings + 1, calories: m.calories + food.calories } : m
        );
      }
      return [...list, { ...food, id: "id" in food ? food.id : Math.random().toString(36).slice(2), servings: "servings" in food ? food.servings : 1 }];
    });
    setFoodQuery("");
    setRemoteFoods([]);
    setShowAddFood(false);
    setStatusText(`${food.name} added.`);
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
      setStatusText("Enter all fields. Password must be 6+ characters.");
      setStatusTone("warn");
      return;
    }
    const users = JSON.parse(window.localStorage.getItem("forge-users") ?? "[]") as Account[];
    if (authMode === "register") {
      if (users.some((u) => u.email === email)) {
        setStatusText("An account with that email already exists.");
        setStatusTone("warn");
        return;
      }
      const next = { name: authName.trim(), email, password: authPassword };
      window.localStorage.setItem("forge-users", JSON.stringify([...users, next]));
      setAccount(next);
      setStatusText("Account created. Welcome, Hunter.");
    } else {
      const found = users.find((u) => u.email === email && u.password === authPassword);
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
      Array.isArray(session?.sets) && session.sets.length > 0
        ? session.sets.map((set, index) => ({ ...set, id: index + 1 }))
        : defaultSets
    );
    setWorkoutStarted(true);
    setActiveNav("Training");
    setStatusText(`Editing ${session.workoutType} session from ${session.date}.`);
    setStatusTone("ok");
  };

  const deleteSession = async (sessionId: string) => {
    setSessionHistory((cur) => (Array.isArray(cur) ? cur : initialHistory).filter((s) => s.id !== sessionId));
    if (editingSessionId === sessionId) resetEditor();
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
      sets: safeSets.map((set, index) => ({
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
      totalSets: safeSets.length,
      completedSets,
      volume: totalVolume,
      sets: safeSets
    };

    const applySavedSession = (session: SessionEntry) => {
      setSessionHistory((cur) => {
        const list = Array.isArray(cur) ? cur : initialHistory;
        const withoutOld = editingSessionId ? list.filter((item) => item.id !== editingSessionId) : list;
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
        setStatusText("Saved locally; API update failed.");
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
      // Finish workout bonus XP
      setHunterXP((prev) => prev + 50);
    }
  };

  // ─── Section renderers ─────────────────────────────────────────────────────

  const renderScheduleStrip = () => (
    <div className="schedule-strip">
      {visibleSchedule.map((item) => {
        const isActive = selectedDay === item.title;
        const chipType = item.title.toLowerCase() as "push" | "pull" | "legs" | "rest";
        const activeClass = isActive ? `active-${chipType}` : "";
        return (
          <button
            key={item.day}
            className={`day-chip ${activeClass}`}
            onClick={() => {
              setSelectedDay(item.title);
              const anchor = new Date(`${calendarDate || toDateInputValue(new Date())}T12:00:00`);
              const monday = new Date(anchor);
              monday.setDate(anchor.getDate() - ((anchor.getDay() + 6) % 7));
              const dayIndex = visibleSchedule.findIndex((d) => d.day === item.day);
              monday.setDate(monday.getDate() + dayIndex);
              setCalendarDate(toDateInputValue(monday));
              setActiveNav("Training");
            }}
          >
            <span className="day-chip-name">{item.day}</span>
            <span className="day-chip-num mono">{item.date}</span>
            <span className={`day-chip-type ${chipType}`}>{item.title}</span>
          </button>
        );
      })}
    </div>
  );

  const renderSetTracker = () => (
    <div className="sl-card mb-16">
      <div className="active-workout-header">
        <div className="active-icon">
          <Dumbbell size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <strong style={{ fontFamily: "var(--font-head)", fontSize: 16, color: "var(--text)" }}>
              {selectedDay === "Rest" ? "Recovery" : `${selectedDay} Day`}
            </strong>
            <WorkoutTypeChip type={selectedDay} />
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
            {completedSets}/{safeSets.length} sets completed
          </div>
        </div>
        <button
          className="sl-btn-ghost"
          onClick={removeLastSet}
          aria-label="Remove last set"
          style={{ padding: "6px 8px" }}
        >
          <Minus size={14} />
        </button>
      </div>

      <div style={{ padding: "0 14px" }}>
        <div className="set-table">
          <div className="set-head">
            <span>SET</span>
            <span>WEIGHT</span>
            <span>KG</span>
            <span>REPS</span>
            <span />
            <span />
          </div>
          {safeSets.map((set, index) => (
            <div className={`set-row ${set.done ? "complete" : ""}`} key={set.id}>
              <button className="set-number" onClick={() => toggleSet(set.id)}>
                {set.done ? <Check size={11} /> : index + 1}
              </button>
              <input
                value={set.weight}
                onChange={(e) => updateSetValue(set.id, "weight", e.target.value)}
                inputMode="decimal"
              />
              <span className="set-unit">kg</span>
              <input
                value={set.reps}
                onChange={(e) => updateSetValue(set.id, "reps", e.target.value)}
                inputMode="numeric"
              />
              <span className="set-unit">reps</span>
              <button
                className="check-btn"
                onClick={() => toggleSet(set.id)}
                aria-label={set.done ? "Mark incomplete" : "Mark complete"}
              >
                <Check size={13} />
              </button>
            </div>
          ))}
        </div>

        <div className="session-actions">
          <button className="add-set-btn" onClick={addSet}>
            <Plus size={15} /> Add set
          </button>
          <div className="session-actions-right">
            {editingSessionId && (
              <button className="sl-btn-ghost" onClick={resetEditor} style={{ fontSize: 11 }}>
                Cancel
              </button>
            )}
            <button
              className="sl-btn-primary"
              onClick={() => void saveWorkout()}
              disabled={isSaving}
              style={{ fontSize: 12, padding: "10px 16px" }}
            >
              <Zap size={14} />
              {isSaving ? "Saving..." : editingSessionId ? "Update" : "Finish +50 XP"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistoryList = (limit?: number) => {
    const items = limit ? safeHistory.slice(0, limit) : safeHistory;
    if (items.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--muted)" }}>
          <Dumbbell size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
          <p style={{ fontSize: 13 }}>No sessions logged yet. Complete a workout to begin.</p>
        </div>
      );
    }
    return (
      <div className="history-list">
        {items.map((session) => (
          <div key={session.id} className="history-row">
            <div className="history-date mono">
              {session.date.split(" ")[0]}
              <br />
              {session.date.split(" ")[1]}
            </div>
            <div className="history-body">
              <strong>{session.workoutType} Session</strong>
              <span>
                {session.completedSets}/{session.totalSets} sets · {session.focus}
              </span>
            </div>
            <div className="history-vol">{session.volume.toLocaleString()} kg</div>
            <div className="history-actions">
              <button
                className="sl-btn-ghost"
                onClick={() => editSession(session)}
                style={{ fontSize: 10, padding: "5px 8px" }}
              >
                Edit
              </button>
              <button className="sl-btn-danger" onClick={() => void deleteSession(session.id)}>
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ─── Dashboard ─────────────────────────────────────────────────────────────

  const renderDashboard = () => {
    const today = calendarDate ? new Date(`${calendarDate}T12:00:00`) : new Date();
    const todayDay = today.toLocaleDateString("en-US", { weekday: "long" });
    const todayEntry = visibleSchedule.find((d) =>
      d.day === today.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3)
    );
    const todayType = todayEntry?.title ?? "Rest";

    return (
      <>
        {/* Hero banner */}
        <div className="hero-banner mb-16">
          <div style={{ position: "relative", zIndex: 1 }}>
            <p className="sec-label" style={{ marginBottom: 6, color: "var(--primary)" }}>
              {todayDay.toUpperCase()} · {formatDateLabel(calendarDate).split(",")[0]}
            </p>
            <h1
              style={{
                fontFamily: "var(--font-head)",
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "0.04em",
                color: "var(--text)",
                marginBottom: 4
              }}
            >
              RISE, HUNTER
            </h1>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
              {selectedDay === "Rest"
                ? "Recovery day. Rest is part of the grind."
                : `Today is a ${selectedDay} day. Make every rep count.`}
            </p>
            <button
              className="sl-btn-primary"
              onClick={() => {
                setWorkoutStarted(true);
                setActiveNav("Training");
              }}
              style={{ fontSize: 12, padding: "10px 18px" }}
            >
              <Zap size={15} />
              {workoutStarted ? "Continue Training" : "Begin Training"}
            </button>
          </div>
          {/* decorative rank text */}
          <div
            style={{
              position: "absolute",
              top: 16,
              right: 20,
              fontFamily: "var(--font-head)",
              fontSize: 64,
              fontWeight: 700,
              opacity: 0.05,
              color: "var(--primary)",
              userSelect: "none",
              lineHeight: 1
            }}
          >
            {rankInfo.rank}
          </div>
        </div>

        {/* Hunter status */}
        <div className="glass-card mb-16" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <p className="sec-label" style={{ marginBottom: 4 }}>Hunter Status</p>
              <RankBadge rank={rankInfo.rank} />
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 500, color: "var(--primary)" }}>
                {hunterXP.toLocaleString()}
              </p>
              <p style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Total XP
              </p>
            </div>
          </div>
          <div className="xp-bar-track">
            <div className="xp-bar-fill" style={{ width: `${Math.min(rankInfo.progress, 100)}%` }} />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 6,
              fontSize: 10,
              color: "var(--muted)"
            }}
          >
            <span>
              {rankInfo.currentXP.toLocaleString()} / {rankInfo.neededXP.toLocaleString()} XP
            </span>
            {rankInfo.rank !== "National" && (
              <span style={{ color: "var(--primary)" }}>
                {(rankInfo.neededXP - rankInfo.currentXP).toLocaleString()} XP to rank up →
              </span>
            )}
          </div>
        </div>

        {/* Daily quest */}
        <div className="sl-card mb-16" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <p className="sec-label" style={{ marginBottom: 4 }}>Daily Quest</p>
              <WorkoutTypeChip type={todayType} />
            </div>
            <button
              className="sl-btn-secondary"
              onClick={() => {
                setSelectedDay(todayType !== "Rest" ? todayType : "Push");
                setActiveNav("Training");
              }}
              style={{ fontSize: 11, padding: "8px 14px" }}
            >
              Begin Training <ChevronRight size={14} />
            </button>
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)" }}>
            {todayType === "Rest"
              ? "Active recovery: stretch, walk, and breathe."
              : `${todayType} split — ${
                  todayType === "Push"
                    ? "Chest · Shoulders · Triceps"
                    : todayType === "Pull"
                    ? "Back · Biceps · Rear Delts"
                    : "Quads · Hamstrings · Calves · Glutes"
                }`}
          </p>
        </div>

        {/* Stat row */}
        <div className="stat-row mb-16">
          <div className="stat-card">
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <Flame size={14} style={{ color: "#FF7043" }} />
              <span className="stat-label">Streak</span>
            </div>
            <span className="stat-value">{streakCount}</span>
            <span style={{ fontSize: 9, color: "var(--muted)" }}>days</span>
          </div>
          <div className="stat-card">
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <TrendingUp size={14} style={{ color: "var(--primary)" }} />
              <span className="stat-label">Sessions</span>
            </div>
            <span className="stat-value">{totalSessionsCount}</span>
            <span style={{ fontSize: 9, color: "var(--muted)" }}>total</span>
          </div>
          <div className="stat-card">
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <Zap size={14} style={{ color: "#FFD600" }} />
              <span className="stat-label">Volume</span>
            </div>
            <span className="stat-value" style={{ fontSize: 16 }}>
              {(totalVolumeAll / 1000).toFixed(1)}k
            </span>
            <span style={{ fontSize: 9, color: "var(--muted)" }}>kg lifted</span>
          </div>
        </div>

        {/* Recent sessions */}
        <div className="mb-16">
          <div className="sec-row">
            <div>
              <p className="sec-label">Logbook</p>
              <h2 className="sec-title" style={{ fontSize: 18, marginBottom: 0 }}>
                Recent Sessions
              </h2>
            </div>
            <button
              className="sl-btn-ghost"
              onClick={() => setActiveNav("Progress")}
              style={{ fontSize: 10, padding: "6px 10px" }}
            >
              View all <ChevronRight size={12} />
            </button>
          </div>
          {renderHistoryList(3)}
        </div>
      </>
    );
  };

  // ─── Training ──────────────────────────────────────────────────────────────

  const renderTraining = () => (
    <>
      <div className="mb-16">
        <p className="sec-label" style={{ marginBottom: 8 }}>
          Weekly Schedule
        </p>
        {renderScheduleStrip()}
      </div>

      {/* Today's exercises for selected day */}
      {selectedDay !== "Rest" && (
        <div className="sl-card mb-16">
          <div style={{ padding: "14px 14px 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <p className="sec-label" style={{ marginBottom: 4 }}>
                  Today&apos;s Exercises
                </p>
                <WorkoutTypeChip type={selectedDay} />
              </div>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--muted)"
                }}
              >
                {todaysExercises.length} movements
              </span>
            </div>
          </div>
          <div>
            {todaysExercises.map((ex) => (
              <div key={ex.name} className="exercise-card">
                <div className={`ex-icon ${selectedDay === "Pull" ? "pull-icon" : selectedDay === "Legs" ? "legs-icon" : ""}`}>
                  <Dumbbell size={16} />
                </div>
                <div className="ex-info">
                  <span className="ex-name">{ex.name}</span>
                  <span className="ex-sub">
                    {ex.muscle} · {ex.equipment}
                  </span>
                </div>
                <span className="ex-last">{ex.last}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Set tracker */}
      <div className="mb-16">
        <p className="sec-label" style={{ marginBottom: 10 }}>
          Set Tracker
        </p>
        {renderSetTracker()}
      </div>

      {/* Recent sessions in training context */}
      <div className="mb-16">
        <div className="sec-row">
          <div>
            <p className="sec-label">Logbook</p>
            <h2 className="sec-title" style={{ fontSize: 18, marginBottom: 0 }}>
              Session History
            </h2>
          </div>
        </div>
        {renderHistoryList(5)}
      </div>
    </>
  );

  // ─── Progress ──────────────────────────────────────────────────────────────

  const renderProgress = () => {
    const completionRate =
      safeHistory.length > 0
        ? Math.round(
            (safeHistory.reduce((s, h) => s + (h.completedSets / Math.max(h.totalSets, 1)), 0) / safeHistory.length) *
              100
          )
        : 0;

    return (
      <>
        {/* Stats */}
        <div className="stat-row mb-16">
          <div className="stat-card">
            <span className="stat-label">Completion</span>
            <span className="stat-value">{completionRate}%</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Sessions</span>
            <span className="stat-value">{totalSessionsCount}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Volume</span>
            <span className="stat-value" style={{ fontSize: 16 }}>
              {(totalVolumeAll / 1000).toFixed(1)}k
            </span>
          </div>
        </div>

        {/* Rank progression */}
        <div className="sl-card mb-16">
          <div style={{ padding: "14px 14px 0" }}>
            <p className="sec-label" style={{ marginBottom: 4 }}>
              Hunter Rank Progression
            </p>
            <h2 className="sec-title" style={{ fontSize: 18, marginBottom: 0 }}>
              Rank Ladder
            </h2>
          </div>
          <div className="rank-track">
            {RANKS.map((r, idx) => {
              const isCurrent = r === rankInfo.rank;
              const isPast = idx < rankInfo.rankIndex;
              return (
                <div key={r}>
                  <div
                    className={`rank-track-item ${isCurrent ? "current" : ""} ${isPast ? "past" : ""}`}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 8,
                        border: `2px solid ${isCurrent ? "var(--primary)" : isPast ? "var(--success)" : "var(--border)"}`,
                        background: isCurrent
                          ? "rgba(79,195,247,0.12)"
                          : isPast
                          ? "rgba(0,230,118,0.08)"
                          : "transparent",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0
                      }}
                    >
                      {isPast ? (
                        <Check size={13} style={{ color: "var(--success)" }} />
                      ) : isCurrent ? (
                        <Star size={12} style={{ color: "var(--primary)" }} />
                      ) : (
                        <span style={{ fontSize: 9, color: "var(--muted)", fontWeight: 700 }}>{idx + 1}</span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <RankBadge rank={r} />
                        {isCurrent && (
                          <span style={{ fontSize: 10, color: "var(--primary)", fontWeight: 600 }}>← Current</span>
                        )}
                      </div>
                      {isCurrent && (
                        <div style={{ marginTop: 8 }}>
                          <div className="xp-bar-track">
                            <div
                              className="xp-bar-fill"
                              style={{ width: `${Math.min(rankInfo.progress, 100)}%` }}
                            />
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginTop: 4,
                              fontSize: 10,
                              color: "var(--muted)"
                            }}
                          >
                            <span>
                              {rankInfo.currentXP} / {rankInfo.neededXP} XP
                            </span>
                            <span style={{ color: "var(--primary)" }}>{Math.round(rankInfo.progress)}%</span>
                          </div>
                        </div>
                      )}
                      {!isCurrent && !isPast && (
                        <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
                          Requires {getXPForRank(idx).toLocaleString()} XP
                        </p>
                      )}
                    </div>
                  </div>
                  {idx < RANKS.length - 1 && (
                    <div
                      style={{
                        width: 2,
                        height: 18,
                        marginLeft: 11,
                        background: isPast ? "rgba(0,230,118,0.3)" : "var(--border)"
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Session history */}
        <div className="mb-16">
          <div className="sec-row">
            <div>
              <p className="sec-label">All Sessions</p>
              <h2 className="sec-title" style={{ fontSize: 18, marginBottom: 0 }}>
                Full Logbook
              </h2>
            </div>
          </div>
          {renderHistoryList()}
        </div>
      </>
    );
  };

  // ─── Library ───────────────────────────────────────────────────────────────

  const renderLibrary = () => (
    <>
      <div className="mb-16">
        <p className="sec-label" style={{ marginBottom: 8 }}>
          Exercise Library
        </p>
        <div className="search-box">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises..."
          />
        </div>
        <div className="tab-bar">
          {(["Push", "Pull", "Legs"] as const).map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${libraryTab === tab ? `active-${tab.toLowerCase()}` : ""}`}
              onClick={() => setLibraryTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="sl-card mb-16">
        {filteredLibraryExercises.length === 0 ? (
          <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            No exercises found.
          </div>
        ) : (
          filteredLibraryExercises.map((ex) => (
            <button
              type="button"
              key={ex.name}
              className="exercise-card"
              onClick={() => {
                setSelectedDay(ex.category !== "Rest" ? ex.category : "Push");
                setActiveNav("Training");
              }}
            >
              <div
                className={`ex-icon ${ex.category === "Pull" ? "pull-icon" : ex.category === "Legs" ? "legs-icon" : ""}`}
              >
                <Dumbbell size={16} />
              </div>
              <div className="ex-info">
                <span className="ex-name">{ex.name}</span>
                <span className="ex-sub">
                  {ex.muscle} · {ex.equipment}
                </span>
              </div>
              <span className="ex-last">{ex.last}</span>
              <ChevronRight size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
            </button>
          ))
        )}
      </div>

      {/* Add custom exercise */}
      <div className="sl-card mb-16" style={{ padding: 16 }}>
        <p className="sec-label" style={{ marginBottom: 10 }}>
          Add Custom Exercise
        </p>
        <input
          className="auth-input"
          value={customExerciseName}
          onChange={(e) => setCustomExerciseName(e.target.value)}
          placeholder="Exercise name"
          style={{ marginBottom: 8 }}
        />
        <select
          value={customExerciseMuscle}
          onChange={(e) => setCustomExerciseMuscle(e.target.value)}
          style={{
            width: "100%",
            background: "var(--card2)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "12px 14px",
            color: "var(--text)",
            fontSize: 13,
            marginBottom: 10
          }}
        >
          {["Chest", "Shoulders", "Triceps", "Back", "Biceps", "Rear Delts", "Quads", "Hamstrings", "Calves", "Glutes"].map(
            (m) => (
              <option key={m} value={m}>
                {m}
              </option>
            )
          )}
        </select>
        <button className="sl-btn-primary" onClick={addExercise} style={{ width: "100%", fontSize: 13 }}>
          <Plus size={15} /> Add to Library
        </button>
      </div>
    </>
  );

  // ─── Profile ───────────────────────────────────────────────────────────────

  const renderProfile = () => (
    <>
      {/* Hunter card */}
      <div className="hunter-card mb-16">
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="hunter-avatar">
            {account ? account.name.slice(0, 2).toUpperCase() : <UserRound size={24} />}
          </div>
          <h2
            style={{
              fontFamily: "var(--font-head)",
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 6
            }}
          >
            {account?.name ?? "Guest Hunter"}
          </h2>
          <RankBadge rank={rankInfo.rank} />
          <div style={{ marginTop: 16, display: "flex", gap: 16 }}>
            <div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 20, color: "var(--primary)", fontWeight: 500 }}>
                {hunterXP.toLocaleString()}
              </p>
              <p style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Total XP
              </p>
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 20, color: "var(--success)", fontWeight: 500 }}>
                {totalSessionsCount}
              </p>
              <p style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Sessions
              </p>
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 20, color: "#FF7043", fontWeight: 500 }}>
                {streakCount}
              </p>
              <p style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Day Streak
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* XP breakdown */}
      <div className="sl-card mb-16" style={{ padding: 16 }}>
        <p className="sec-label" style={{ marginBottom: 12 }}>
          XP Breakdown
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 12px",
              background: "var(--card2)",
              borderRadius: 10
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <Check size={14} style={{ color: "var(--success)" }} />
              Per completed set
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--primary)" }}>+10 XP</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 12px",
              background: "var(--card2)",
              borderRadius: 10
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <Zap size={14} style={{ color: "#FFD600" }} />
              Workout completion bonus
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#FFD600" }}>+50 XP</span>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Rank Progress</span>
            <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600 }}>
              {Math.round(rankInfo.progress)}%
            </span>
          </div>
          <div className="xp-bar-track">
            <div className="xp-bar-fill" style={{ width: `${Math.min(rankInfo.progress, 100)}%` }} />
          </div>
          {rankInfo.rank !== "National" && (
            <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 6 }}>
              {(rankInfo.neededXP - rankInfo.currentXP).toLocaleString()} XP until Rank {RANKS[rankInfo.rankIndex + 1]}
            </p>
          )}
        </div>
      </div>

      {/* Account section */}
      <div className="sl-card" style={{ padding: 16 }}>
        <p className="sec-label" style={{ marginBottom: 12 }}>
          Account
        </p>
        {account ? (
          <div>
            <p style={{ fontSize: 13, color: "var(--text)", marginBottom: 4 }}>
              Signed in as <strong>{account.email}</strong>
            </p>
            <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 16 }}>
              Your data is stored locally on this device.
            </p>
            <button
              className="sl-btn-ghost"
              style={{ width: "100%" }}
              onClick={() => {
                setAccount(null);
                setStatusText("Signed out.");
                setStatusTone("ok");
              }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
              You&apos;re using Shadow Forge as a guest.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="sl-btn-primary"
                style={{ flex: 1, fontSize: 12 }}
                onClick={() => setAuthMode("register")}
              >
                Register
              </button>
              <button
                className="sl-btn-secondary"
                style={{ flex: 1, fontSize: 12 }}
                onClick={() => setAuthMode("signin")}
              >
                Sign in
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );

  // ─── Router ────────────────────────────────────────────────────────────────

  const renderWorkspace = () => {
    switch (activeNav) {
      case "Training":
        return renderTraining();
      case "Progress":
        return renderProgress();
      case "Library":
        return renderLibrary();
      case "Profile":
        return renderProfile();
      default:
        return renderDashboard();
    }
  };

  // ─── Main render ───────────────────────────────────────────────────────────

  return (
    <main className="app-shell">
      {/* Desktop sidebar (hidden on mobile via CSS) */}
      <aside className="desktop-sidebar">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 28,
            fontFamily: "var(--font-head)",
            fontSize: 18,
            fontWeight: 700,
            color: "var(--primary)",
            letterSpacing: "0.06em"
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "var(--primary-dim)",
              border: "1px solid rgba(79,195,247,0.3)",
              display: "grid",
              placeItems: "center",
              color: "var(--primary)"
            }}
          >
            <Dumbbell size={16} />
          </div>
          SHADOW FORGE
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {SL_NAV_ITEMS.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`desktop-nav-item ${activeNav === label ? "active" : ""}`}
              onClick={() => setActiveNav(label)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div>
          <div
            style={{
              background: "var(--primary-dim)",
              border: "1px solid rgba(79,195,247,0.15)",
              borderRadius: 12,
              padding: "10px 12px",
              marginBottom: 12
            }}
          >
            <RankBadge rank={rankInfo.rank} />
            <div className="xp-bar-track" style={{ marginTop: 8 }}>
              <div className="xp-bar-fill" style={{ width: `${Math.min(rankInfo.progress, 100)}%` }} />
            </div>
            <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>
              {hunterXP.toLocaleString()} XP total
            </p>
          </div>
        </div>
      </aside>

      <section className="content">
        {/* Top bar */}
        <header className="topbar-mobile">
          <div className="topbar-brand">
            <div className="topbar-brand-dot" />
            SHADOW FORGE
          </div>
          <div className="topbar-right">
            <button
              className="cal-btn"
              onClick={() => {
                const input = calendarInputRef.current;
                if (!input) return;
                if (typeof input.showPicker === "function") {
                  input.showPicker();
                } else {
                  input.click();
                }
              }}
              aria-label="Choose date"
            >
              <CalendarDays size={16} />
            </button>
            <input
              ref={calendarInputRef}
              className="calendar-input"
              type="date"
              value={calendarDate}
              onChange={(e) => {
                setCalendarDate(e.target.value);
                setStatusText(`Viewing ${formatDateLabel(e.target.value)}.`);
                setStatusTone("ok");
              }}
              aria-label="Choose calendar date"
            />
            <button
              className="top-avatar"
              onClick={() => setAuthMode(account ? "signin" : "register")}
              aria-label="Account"
            >
              {account ? account.name.slice(0, 2).toUpperCase() : <UserRound size={16} />}
            </button>
          </div>
        </header>

        {/* Status banner */}
        {statusText && (
          <div className={`status-banner ${statusTone}`} role="status">
            {statusText}
          </div>
        )}

        <div className="page-content">{renderWorkspace()}</div>
      </section>

      {/* Bottom nav */}
      <nav className="bottom-nav">
        {SL_NAV_ITEMS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={`nav-btn ${activeNav === label ? "active" : ""}`}
            onClick={() => setActiveNav(label)}
          >
            <div className="nav-icon-wrap">
              <Icon size={20} />
            </div>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Auth modal */}
      {authMode && (
        <div className="modal-backdrop" role="presentation" onClick={() => setAuthMode(null)}>
          <section
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="auth-modal-top">
              <h2 id="auth-title" className="auth-title">
                {account
                  ? "Account"
                  : authMode === "register"
                  ? "Create Account"
                  : "Sign In"}
              </h2>
              <button
                onClick={() => setAuthMode(null)}
                style={{ color: "var(--muted)", padding: 4 }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {account ? (
              <div>
                <p style={{ fontSize: 13, color: "var(--text)", marginBottom: 4 }}>
                  Signed in as <strong>{account.email}</strong>
                </p>
                <p className="form-help">Your local data stays on this device.</p>
                <button
                  className="sl-btn-ghost"
                  style={{ width: "100%", marginTop: 12 }}
                  onClick={() => {
                    setAccount(null);
                    setAuthMode(null);
                    setStatusText("Signed out.");
                    setStatusTone("ok");
                  }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <>
                {authMode === "register" && (
                  <input
                    className="auth-input"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Hunter name"
                    autoComplete="name"
                  />
                )}
                <input
                  className="auth-input"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="Email"
                  type="email"
                  autoComplete="email"
                />
                <input
                  className="auth-input"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Password (6+ characters)"
                  type="password"
                  autoComplete={authMode === "register" ? "new-password" : "current-password"}
                />
                <button className="sl-btn-primary" onClick={submitAuth} style={{ width: "100%", marginTop: 4 }}>
                  {authMode === "register" ? "Register" : "Sign in"}
                </button>
                <button
                  className="auth-switch"
                  onClick={() => setAuthMode(authMode === "register" ? "signin" : "register")}
                >
                  {authMode === "register"
                    ? "Already have an account? Sign in"
                    : "New hunter? Register"}
                </button>
                <p className="form-help">
                  Accounts are currently stored locally. You can continue as a guest.
                </p>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
