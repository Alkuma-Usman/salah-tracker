import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  Heart,
  LayoutDashboard,
  MapPin,
  Moon,
  Settings as SettingsIcon,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  X,
  Navigation,
  Download,
  CalendarDays,
  ArrowUpRight,
} from "lucide-react";
import {
  count,
  dateKey,
  defaults,
  nextPrayer,
  prayers,
  readStored,
  shiftDate,
  streak,
  timesFor,
  validHistory,
  validSettings,
  type History,
  type Settings,
} from "./model";
const icons = [Sunrise, Sun, Sun, Sunset, Moon];
const descriptions = [
  "Begin with intention",
  "Pause. Breathe. Reconnect.",
  "Find peace in the afternoon",
  "Gratitude as the sun sets",
  "End your day with peace",
];
const formatTime = (date: Date) =>
  Number.isFinite(date.getTime())
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Unavailable";
export default function App() {
  const [history, setHistory] = useState<History>(() => {
    const h = readStored<unknown>("salah-history", {});
    return validHistory(h) ? h : {};
  });
  const [settings, setSettings] = useState<Settings>(() => {
    const s = readStored<unknown>("salah-settings", defaults);
    return validSettings(s) ? s : defaults;
  });
  const [now, setNow] = useState(new Date());
  const [selected, setSelected] = useState(dateKey(new Date()));
  const [modal, setModal] = useState(false);
  const [draft, setDraft] = useState(settings);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const notified = useRef(new Set<string>());
  const weeklyRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const trap = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModal(false);
        return;
      }
      if (event.key !== "Tab") return;
      const elements = dialogRef.current?.querySelectorAll<HTMLElement>(
        "button:not(:disabled),input,select",
      );
      if (!elements?.length) return;
      const first = elements[0],
        last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [modal]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("salah-history", JSON.stringify(history));
      localStorage.setItem("salah-settings", JSON.stringify(settings));
    } catch {
      setMessage(
        "Browser storage is unavailable. Changes will only last for this session.",
      );
    }
  }, [history, settings]);
  useEffect(() => {
    if (!settings.reminders) return;
    const times = timesFor(now, settings);
    times.forEach((time, i) => {
      const key = dateKey(now) + prayers[i];
      const diff = now.getTime() - time.getTime();
      if (diff >= 0 && diff < 60000 && !notified.current.has(key)) {
        notified.current.add(key);
        setMessage(`It’s time for ${prayers[i]}. Take a moment to reconnect.`);
        if ("Notification" in window && Notification.permission === "granted")
          new Notification(`Time for ${prayers[i]}`, {
            body: "Your moment of peace is here.",
          });
      }
    });
  }, [now, settings]);
  const date = new Date(selected + "T12:00:00");
  const today = dateKey(now);
  const completed = count(history, date);
  const next = nextPrayer(now, settings);
  const times = timesFor(date, settings);
  const week = Array.from({ length: 7 }, (_, i) => shiftDate(now, i - 6));
  const weekTotal = week.reduce((sum, d) => sum + count(history, d), 0);
  const remaining = next
    ? Math.max(0, Math.ceil((next.time.getTime() - now.getTime()) / 1000))
    : 0;
  const countdown = `${String(Math.floor(remaining / 3600)).padStart(2, "0")}:${String(Math.floor((remaining % 3600) / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  const hijri = new Intl.DateTimeFormat("en-GB-u-ca-islamic", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  function openSettings() {
    setDraft(settings);
    setError("");
    setModal(true);
  }
  async function reminders() {
    if (!("Notification" in window)) {
      setMessage(
        "Notifications are not supported in this browser. In-app reminders remain available.",
      );
      setSettings((s) => ({ ...s, reminders: true }));
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setSettings((s) => ({ ...s, reminders: true }));
      setMessage(
        permission === "granted"
          ? "Reminders enabled while this app is open."
          : "In-app reminders enabled. Browser notifications are blocked in your browser settings.",
      );
    } catch {
      setMessage("Unable to enable browser notifications.");
    }
  }
  function locate() {
    if (!navigator.geolocation) {
      setError("Geolocation is unavailable. Enter coordinates manually.");
      return;
    }
    setError("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDraft((s) => ({
          ...s,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          city: "My location",
        }));
        setError("Location found. Name your location and save.");
      },
      () =>
        setError("Location access failed. Enter your coordinates manually."),
      { timeout: 10000 },
    );
  }
  function exportData() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ history, settings }, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `salah-tracker-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#">
          <span className="brand-icon">
            <Moon size={24} />
          </span>
          <span>
            salah<span className="brand-dot">.</span>
            <small>MAKE TIME FOR PEACE</small>
          </span>
        </a>
        <div className="workspace-label">YOUR SPACE</div>
        <nav>
          <button
            className="nav-item active"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <LayoutDashboard size={19} />
            Overview
            <span className="active-dot" />
          </button>
          <button
            className="nav-item"
            onClick={() =>
              weeklyRef.current?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <CalendarDays size={19} />
            My progress
          </button>
          <button className="nav-item" onClick={openSettings}>
            <SettingsIcon size={19} />
            Settings
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="verse">
            <Sparkles size={22} />
            <p>“Indeed, in the remembrance of Allah do hearts find rest.”</p>
            <span>QUR’AN 13:28</span>
          </div>
          <div className="profile">
            <div className="avatar">S</div>
            <div>
              Your salah journey<small>One prayer at a time</small>
            </div>
            <Heart size={17} />
          </div>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <span>
            My dashboard <span className="header-slash">/</span>{" "}
            <strong>Overview</strong>
          </span>
          <div>
            <span className="today-label">
              {now.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            <button
              className="icon-button"
              aria-label="Enable prayer reminders"
              onClick={reminders}
            >
              <Bell size={20} />
              {settings.reminders && <i />}
            </button>
            <button
              className="avatar small"
              aria-label="Open settings"
              onClick={openSettings}
            >
              S
            </button>
          </div>
        </header>
        <div className="content">
          <section className="greeting">
            <div className="eyebrow">
              <span /> A LITTLE CONSISTENCY, A LIFETIME OF PEACE
            </div>
            <div className="greeting-line">
              <div>
                <h1>
                  Assalamu Alaikum <span className="wave">☀</span>
                </h1>
                <p>
                  Every prayer is a fresh start. Let’s make today meaningful.
                </p>
              </div>
              <button className="location" onClick={openSettings}>
                <MapPin size={16} />
                {settings.city}
                <ChevronRight size={14} />
              </button>
            </div>
          </section>
          {message && (
            <div className="notice" role="status">
              {message}
              <button
                aria-label="Dismiss message"
                onClick={() => setMessage("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          <section className="hero">
            <div className="hero-content">
              <span className="hero-label">
                <span className="live-dot" /> YOUR NEXT MOMENT OF PEACE
              </span>
              <h2>
                {next?.name ?? "Prayer times unavailable"}{" "}
                <span>{next ? formatTime(next.time) : "Check settings"}</span>
              </h2>
              <p>
                {next
                  ? "A moment to pause the world and reconnect."
                  : "Try another calculation method for your location."}
              </p>
              <div className="countdown">
                <span>{countdown}</span>
                <small>TIME REMAINING</small>
              </div>
              <button className="hero-button" onClick={reminders}>
                <Bell size={15} />
                {settings.reminders ? "Reminders enabled" : "Remind me"}
                <ArrowUpRight size={16} />
              </button>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <span className="star star-one">✦</span>
              <span className="star star-two">✧</span>
              <span className="star star-three">✦</span>
              <div className="crescent" />
              <div className="mosque">
                <div className="minaret left" />
                <div className="dome" />
                <div className="mosque-body">
                  <i />
                  <i />
                  <i />
                </div>
                <div className="minaret right" />
              </div>
              <div className="art-floor" />
            </div>
          </section>
          <section className="stats" aria-label="Your prayer statistics">
            <div className="stat">
              <div className="stat-icon mint">
                <Check size={21} />
              </div>
              <div>
                <span>Prayers today</span>
                <strong>
                  {count(history, now)}
                  <small> / 5</small>
                </strong>
              </div>
              <span className="stat-tag">Keep going</span>
            </div>
            <div className="stat">
              <div className="stat-icon peach">
                <Flame size={22} />
              </div>
              <div>
                <span>Current streak</span>
                <strong>
                  {streak(history, now)}
                  <small> days</small>
                </strong>
              </div>
              <span className="mini-spark">✧</span>
            </div>
            <div className="stat">
              <div className="stat-icon lavender">
                <CalendarDays size={21} />
              </div>
              <div>
                <span>This week</span>
                <strong>
                  {Math.round((weekTotal / 35) * 100)}
                  <small>% complete</small>
                </strong>
              </div>
              <div className="tiny-bars">
                {week.map((d) => (
                  <i
                    key={dateKey(d)}
                    style={{ height: 8 + count(history, d) * 5 }}
                  />
                ))}
              </div>
            </div>
          </section>
          <section className="prayer-section">
            <div className="section-heading">
              <div>
                <h2>
                  Your daily prayers{" "}
                  <span className="pill">{completed} of 5</span>
                </h2>
                <p>
                  {hijri} · {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </p>
              </div>
              <div className="date-switch">
                <button
                  aria-label="Previous day"
                  onClick={() => setSelected(dateKey(shiftDate(date, -1)))}
                >
                  <ChevronLeft size={17} />
                </button>
                <button
                  className="date-text"
                  onClick={() => setSelected(today)}
                >
                  <CalendarDays size={15} />
                  {selected === today
                    ? "Today"
                    : date.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                </button>
                <button
                  aria-label="Next day"
                  disabled={selected >= today}
                  onClick={() => setSelected(dateKey(shiftDate(date, 1)))}
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
            <div className="prayer-grid">
              {prayers.map((prayer, i) => {
                const Icon = icons[i];
                const done = !!history[selected]?.[prayer];
                const upcoming = selected === today && next?.name === prayer;
                return (
                  <article
                    className={`prayer-card prayer-${i} ${done ? "is-done" : ""} ${upcoming ? "is-next" : ""}`}
                    key={prayer}
                  >
                    <div className="prayer-card-top">
                      <span className="prayer-icon">
                        <Icon size={25} />
                      </span>
                      {done ? (
                        <span className="done-label">
                          <Check size={12} />
                          Completed
                        </span>
                      ) : upcoming ? (
                        <span className="next-label">UP NEXT</span>
                      ) : null}
                    </div>
                    <h3>{prayer}</h3>
                    <div className="prayer-time">{formatTime(times[i])}</div>
                    <p>{descriptions[i]}</p>
                    <button
                      className={
                        done ? "prayer-button checked" : "prayer-button"
                      }
                      aria-pressed={done}
                      onClick={() =>
                        setHistory((h) => ({
                          ...h,
                          [selected]: { ...h[selected], [prayer]: !done },
                        }))
                      }
                    >
                      {done ? (
                        <>
                          <Check size={16} />
                          Prayed
                        </>
                      ) : (
                        <>
                          <span className="empty-check" />
                          Mark as prayed
                        </>
                      )}
                    </button>
                  </article>
                );
              })}
            </div>
            <div className="daily-progress">
              <span>
                {completed === 5
                  ? "Alhamdulillah! All five prayers completed."
                  : "Little by little, a beautiful habit grows."}
              </span>
              <div className="progress-track">
                <div style={{ width: `${completed * 20}%` }} />
              </div>
              <strong>{completed * 20}%</strong>
            </div>
          </section>
          <div className="bottom-grid">
            <section className="weekly panel" ref={weeklyRef}>
              <div className="section-heading">
                <div>
                  <h2>A week of connection</h2>
                  <p>Every step forward counts.</p>
                </div>
                <span className="week-total">
                  {weekTotal}
                  <small> / 35 prayers</small>
                </span>
              </div>
              <div className="chart">
                {week.map((d) => {
                  const n = count(history, d);
                  const key = dateKey(d);
                  return (
                    <button
                      key={key}
                      className={`chart-day ${key === today ? "current" : ""}`}
                      aria-label={`${d.toLocaleDateString()}, ${n} of 5 prayers`}
                      onClick={() => setSelected(key)}
                    >
                      <span className="chart-value">{n}</span>
                      <div className="chart-bar">
                        <div style={{ height: `${n * 20}%` }} />
                      </div>
                      <span>
                        {d.toLocaleDateString("en-GB", { weekday: "short" })}
                      </span>
                      <i />
                    </button>
                  );
                })}
              </div>
              <div className="chart-footer">
                <span>
                  <i /> Prayers completed
                </span>
                <span>Last 7 days</span>
              </div>
            </section>
            <section className="reflection panel">
              <div className="reflection-heading">
                <span>
                  <Heart size={16} /> A MOMENT TO REFLECT
                </span>
                <Sparkles size={22} />
              </div>
              <blockquote>
                “So remember Me;
                <br />I will remember you.”
              </blockquote>
              <p>QUR’AN · 2:152</p>
              <div className="reflection-divider" />
              <span className="reflection-note">
                Make space for what brings
                <br />
                your heart closer to Him.
              </span>
              <span className="flower" aria-hidden="true">
                ✳
              </span>
            </section>
          </div>
          <footer>
            <span>Made for a more mindful you.</span>
            <span>
              Your journey, your pace. <Heart size={12} />
            </span>
          </footer>
        </div>
      </main>
      {modal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(false);
          }}
        >
          <section
            ref={dialogRef}
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            onKeyDown={(e) => {
              if (e.key === "Escape") setModal(false);
            }}
          >
            <div className="section-heading">
              <h2 id="settings-title">Make it yours</h2>
              <button
                className="icon-button"
                aria-label="Close settings"
                onClick={() => setModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <p className="settings-note">
              Prayer times are calculated locally. Displayed times use your
              device’s timezone (
              {Intl.DateTimeFormat().resolvedOptions().timeZone}). Check times
              with your local mosque.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!validSettings(draft)) {
                  setError("Enter a location name and valid coordinates.");
                  return;
                }
                setSettings({ ...draft, city: draft.city.trim() });
                setModal(false);
                setMessage("Your prayer settings have been saved.");
              }}
            >
              <label>
                Location name
                <input
                  autoFocus
                  required
                  value={draft.city}
                  onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                />
              </label>
              <div className="coordinate-fields">
                <label>
                  Latitude
                  <input
                    required
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    value={draft.latitude}
                    onChange={(e) =>
                      setDraft({ ...draft, latitude: e.target.valueAsNumber })
                    }
                  />
                </label>
                <label>
                  Longitude
                  <input
                    required
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    value={draft.longitude}
                    onChange={(e) =>
                      setDraft({ ...draft, longitude: e.target.valueAsNumber })
                    }
                  />
                </label>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={locate}
              >
                <Navigation size={15} />
                Use my current location
              </button>
              <label>
                Calculation method
                <select
                  value={draft.method}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      method: e.target.value as Settings["method"],
                    })
                  }
                >
                  <option value="MuslimWorldLeague">Muslim World League</option>
                  <option value="NorthAmerica">ISNA / North America</option>
                  <option value="UmmAlQura">Umm al-Qura, Makkah</option>
                  <option value="Karachi">
                    University of Islamic Sciences, Karachi
                  </option>
                  <option value="Egyptian">Egyptian General Authority</option>
                </select>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={draft.hanafi}
                  onChange={(e) =>
                    setDraft({ ...draft, hanafi: e.target.checked })
                  }
                />
                Hanafi Asr calculation
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={draft.reminders}
                  onChange={(e) =>
                    setDraft({ ...draft, reminders: e.target.checked })
                  }
                />
                In-app prayer reminders
              </label>
              <p className="settings-note">
                Reminders require the app to remain open. Use the bell to allow
                browser notifications. History is stored on this device only.
              </p>
              {error && (
                <p role="status" className="form-message">
                  {error}
                </p>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={exportData}
                >
                  <Download size={15} />
                  Export history
                </button>
                <button className="save-button" type="submit">
                  Save settings
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
