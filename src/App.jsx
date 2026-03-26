import { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";
import { signOut } from "./lib/auth";
import Auth from "./components/Auth";
import { useTopics } from "./hooks/useTopics";
import { useLogs } from "./hooks/useLogs";
import { useSettings } from "./hooks/useSettings";
import { useNotifications } from "./hooks/useNotifications";
import { useReflections } from "./hooks/useReflections";

// ── Helpers ───────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];
const addDays = (dateStr, n) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};
const fmtDate = (ds) => {
  const d = new Date(ds + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};
const daysDiff = (ds) => {
  const diff = new Date(ds) - new Date(today() + "T00:00:00");
  return Math.round(diff / 86400000);
};
const uid = () => Math.random().toString(36).slice(2, 9);

const SUBJECTS = ["History", "Geography", "Polity", "Economy", "Environment", "Science & Tech", "Current Affairs", "Ethics", "Art & Culture", "Other"];

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 16 }) => {
  const icons = {
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    clock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    book: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
    chart: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
    target: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    alert: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    fire: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c0 1.381-1.119 2.5-2.5 2.5S6 18.381 6 17c0-3.5 4-7 4-7s-3 3.5 1 6"/><path d="M12 2c0 7-6 10-6 15a6 6 0 0 0 12 0c0-5-6-8-6-15z"/></svg>,
    list: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    edit: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    question: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    home: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    logout: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  };
  return icons[name] || null;
};

// ── STYLES ────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0a0c0f; --surface: #111418; --surface2: #181c22;
    --border: #1e2430; --border2: #252d3a;
    --accent: #e8c14a; --accent2: #c8a030;
    --green: #3ddc84; --red: #ff5c5c; --orange: #ff9248; --blue: #5b9cf6;
    --text: #e8ecf0; --text2: #8a95a3; --text3: #5a6070;
    --font: 'Syne', sans-serif; --mono: 'JetBrains Mono', monospace;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--font); min-height: 100vh; }
  .app { display: flex; height: 100vh; overflow: hidden; }
  .sidebar { width: 220px; min-width: 220px; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; }
  .sidebar-logo { padding: 20px 18px 16px; border-bottom: 1px solid var(--border); }
  .logo-mark { font-size: 11px; font-weight: 700; letter-spacing: 3px; color: var(--accent); text-transform: uppercase; font-family: var(--mono); }
  .logo-title { font-size: 15px; font-weight: 800; color: var(--text); margin-top: 4px; }
  .user-email { font-size: 11px; color: var(--text3); font-family: var(--mono); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sidebar-nav { flex: 1; padding: 12px 10px; display: flex; flex-direction: column; gap: 2px; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; color: var(--text2); transition: all 0.15s; border: none; background: transparent; width: 100%; text-align: left; }
  .nav-item:hover { background: var(--surface2); color: var(--text); }
  .nav-item.active { background: var(--accent); color: #0a0c0f; }
  .nav-item .badge { margin-left: auto; background: var(--red); color: #fff; font-size: 10px; font-family: var(--mono); padding: 1px 6px; border-radius: 99px; font-weight: 600; }
  .nav-item.active .badge { background: rgba(0,0,0,0.2); color: #000; }
  .sidebar-footer { padding: 12px 10px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 8px; }
  .streak-card { background: var(--surface2); border-radius: 8px; padding: 12px; border: 1px solid var(--border2); }
  .streak-num { font-size: 26px; font-weight: 800; color: var(--orange); font-family: var(--mono); }
  .streak-label { font-size: 11px; color: var(--text3); font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-top: 2px; }
  .main { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
  .topbar { padding: 16px 28px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; background: var(--surface); position: sticky; top: 0; z-index: 5; }
  .topbar-title { font-size: 18px; font-weight: 800; color: var(--text); }
  .topbar-date { font-size: 12px; font-family: var(--mono); color: var(--text3); margin-top: 2px; }
  .btn { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; border-radius: 7px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; transition: all 0.15s; font-family: var(--font); }
  .btn-primary { background: var(--accent); color: #0a0c0f; }
  .btn-primary:hover { background: var(--accent2); }
  .btn-ghost { background: var(--surface2); color: var(--text2); border: 1px solid var(--border2); }
  .btn-ghost:hover { color: var(--text); border-color: var(--text3); }
  .btn-danger { background: transparent; color: var(--red); border: 1px solid transparent; padding: 4px 6px; border-radius: 5px; }
  .btn-danger:hover { background: rgba(255,92,92,0.12); border-color: var(--red); }
  .btn-sm { padding: 5px 10px; font-size: 12px; }
  .page { padding: 24px 28px; flex: 1; }
  .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
  .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 18px; position: relative; overflow: hidden; }
  .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--accent-color, var(--accent)); }
  .stat-value { font-size: 30px; font-weight: 800; font-family: var(--mono); color: var(--text); }
  .stat-label { font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; }
  .stat-sub { font-size: 12px; color: var(--text2); margin-top: 6px; font-family: var(--mono); }
  .progress-wrap { background: var(--surface2); border-radius: 99px; height: 6px; margin-top: 10px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 99px; background: var(--accent); transition: width 0.4s; }
  .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .section-title { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: var(--text3); }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .rev-list { display: flex; flex-direction: column; gap: 8px; }
  .rev-item { background: var(--surface); border: 1px solid var(--border); border-radius: 9px; padding: 12px 14px; display: flex; align-items: center; gap: 12px; transition: border-color 0.15s; }
  .rev-item:hover { border-color: var(--border2); }
  .rev-item.overdue { border-color: rgba(255,92,92,0.3); background: rgba(255,92,92,0.04); }
  .rev-item.done { opacity: 0.5; }
  .rev-badge { font-size: 10px; font-weight: 700; font-family: var(--mono); padding: 3px 8px; border-radius: 5px; white-space: nowrap; }
  .d1 { background: rgba(91,156,246,0.15); color: var(--blue); border: 1px solid rgba(91,156,246,0.2); }
  .d3 { background: rgba(255,146,72,0.15); color: var(--orange); border: 1px solid rgba(255,146,72,0.2); }
  .d7 { background: rgba(61,220,132,0.15); color: var(--green); border: 1px solid rgba(61,220,132,0.2); }
  .rev-topic { font-size: 14px; font-weight: 600; flex: 1; }
  .rev-subject { font-size: 11px; color: var(--text3); font-family: var(--mono); }
  .rev-check { width: 24px; height: 24px; border-radius: 6px; border: 1.5px solid var(--border2); display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; background: transparent; color: transparent; transition: all 0.15s; }
  .rev-check:hover { border-color: var(--green); }
  .rev-check.checked { background: var(--green); border-color: var(--green); color: #000; }
  .form-group { display: flex; flex-direction: column; gap: 5px; }
  .form-label { font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 1px; }
  .form-input, .form-select { background: var(--surface2); border: 1px solid var(--border2); border-radius: 7px; color: var(--text); font-size: 13px; padding: 8px 12px; font-family: var(--font); outline: none; transition: border-color 0.15s; width: 100%; }
  .form-input:focus, .form-select:focus { border-color: var(--accent); }
  .form-select option { background: var(--surface); }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; animation: fadeIn 0.15s; }
  @keyframes fadeIn { from { opacity: 0; } }
  .modal { background: var(--surface); border: 1px solid var(--border2); border-radius: 14px; padding: 28px; width: 100%; max-width: 480px; animation: slideUp 0.2s; }
  @keyframes slideUp { from { transform: translateY(10px); opacity: 0; } }
  .modal-title { font-size: 18px; font-weight: 800; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; }
  .form-stack { display: flex; flex-direction: column; gap: 14px; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
  .topics-table { width: 100%; border-collapse: collapse; }
  .topics-table th { text-align: left; font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 1.5px; padding: 10px 14px; border-bottom: 1px solid var(--border); }
  .topics-table td { padding: 12px 14px; border-bottom: 1px solid var(--border); font-size: 13px; vertical-align: middle; }
  .topics-table tr:last-child td { border-bottom: none; }
  .topics-table tr:hover td { background: rgba(255,255,255,0.02); }
  .chip { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; font-family: var(--mono); }
  .chip-done { background: rgba(61,220,132,0.12); color: var(--green); }
  .chip-pending { background: rgba(232,193,74,0.12); color: var(--accent); }
  .chip-overdue { background: rgba(255,92,92,0.12); color: var(--red); }
  .chip-na { background: rgba(90,96,112,0.2); color: var(--text3); }
  .empty { text-align: center; padding: 48px 20px; color: var(--text3); }
  .empty-icon { font-size: 36px; margin-bottom: 12px; }
  .empty h3 { font-size: 15px; color: var(--text2); font-weight: 700; margin-bottom: 6px; }
  .empty p { font-size: 13px; }
  .chart-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 20px; }
  .chart-bar-row { display: flex; align-items: flex-end; gap: 6px; height: 120px; }
  .chart-bar-col { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
  .chart-bar { width: 100%; border-radius: 4px 4px 0 0; background: var(--accent); opacity: 0.8; transition: opacity 0.2s; min-height: 2px; }
  .chart-bar:hover { opacity: 1; }
  .chart-bar-label { font-size: 9px; color: var(--text3); font-family: var(--mono); text-align: center; line-height: 1.2; white-space: pre; }
  .chart-bar-val { font-size: 10px; color: var(--text2); font-family: var(--mono); }
  .pyq-list { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
  .pyq-item { display: flex; align-items: center; gap: 10px; background: var(--surface2); border: 1px solid var(--border); border-radius: 7px; padding: 8px 12px; }
  .pyq-text { flex: 1; font-size: 13px; }
  .pyq-status { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; font-family: var(--mono); cursor: pointer; border: 1px solid transparent; }
  .pyq-not { background: rgba(90,96,112,0.2); color: var(--text3); }
  .pyq-attempted { background: rgba(232,193,74,0.12); color: var(--accent); }
  .pyq-done { background: rgba(61,220,132,0.12); color: var(--green); }
  .alert-banner { background: rgba(255,92,92,0.08); border: 1px solid rgba(255,92,92,0.2); border-radius: 8px; padding: 10px 14px; display: flex; align-items: center; gap: 10px; margin-bottom: 16px; font-size: 13px; color: var(--red); }
  .inline-input { background: var(--surface2); border: 1px solid var(--border2); border-radius: 6px; color: var(--text); font-size: 13px; padding: 6px 10px; font-family: var(--font); outline: none; }
  .inline-input:focus { border-color: var(--accent); }
  .divider { height: 1px; background: var(--border); margin: 20px 0; }
  .loading { display: flex; align-items: center; justify-content: center; height: 100vh; font-size: 14px; color: var(--text3); font-family: var(--mono); }
  .reflection-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 16px; margin-top: 4px; }
  .reflection-label { font-size: 11px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
  .reflection-text { font-size: 13px; color: var(--text2); line-height: 1.6; }
  .reflection-divider { height: 1px; background: var(--border); margin: 10px 0; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }
`;

const SUBJ_COLORS = ["#e8c14a","#5b9cf6","#3ddc84","#ff9248","#c77dff","#ff5c5c","#00bcd4","#f06292","#aed581","#ff7043"];
const subjColor = (s) => SUBJ_COLORS[SUBJECTS.indexOf(s) % SUBJ_COLORS.length] || "#8a95a3";

// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [showLogTime, setShowLogTime] = useState(false);
  const [showPYQ, setShowPYQ] = useState(null);
  const [showReflection, setShowReflection] = useState(false);

  const { topics, addTopic, updateTopic, deleteTopic } = useTopics(user?.id);
  const { logs, addLog } = useLogs(user?.id);
  const { dailyTarget, setDailyTarget } = useSettings(user?.id);
  // ✅ FIXED: Hook is now correctly called inside the component
  const { reflections, addReflection } = useReflections(user?.id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const getRevisionTasks = useCallback(() => {
    const tasks = [];
    topics.forEach(t => {
      [1, 3, 7].forEach(day => {
        const due = addDays(t.day0, day);
        const status = (t.revisions || {})[day] || "pending";
        tasks.push({ topicId: t.id, topicName: t.name, subject: t.subject, day, due, status });
      });
    });
    return tasks;
  }, [topics]);

  const allTasks = getRevisionTasks();
  const todayTasks = allTasks.filter(t => t.due === today());
  const overdueTasks = allTasks.filter(t => t.due < today() && t.status !== "done");

  const todayLogs = logs.filter(l => l.date === today());
  const todayHours = todayLogs.reduce((s, l) => s + Number(l.hours), 0);
  const todayProgress = Math.min(100, (todayHours / dailyTarget) * 100);

  useNotifications(todayTasks, todayHours, dailyTarget);

  const streak = (() => {
    let s = 0; const d = new Date(today());
    while (true) {
      const ds = d.toISOString().split("T")[0];
      const hasLog = logs.some(l => l.date === ds && l.hours > 0);
      if (!hasLog) break;
      s++;
      d.setDate(d.getDate() - 1);
    }
    return s;
  })();

  const markRevision = async (topicId, day, status) => {
    const topic = topics.find(t => t.id === topicId);
    const newRevisions = { ...(topic.revisions || {}), [day]: status };
    await updateTopic(topicId, { revisions: newRevisions });
  };

  const handleAddTopic = async (data) => {
    await addTopic({ ...data, day0: today(), revisions: {}, pyqs: [] });
    setShowAddTopic(false);
  };

  const handleLogTime = async (data) => {
    await addLog({ ...data, date: today() });
    setShowLogTime(false);
  };

  const handleAddPYQ = async (topicId, question) => {
    const topic = topics.find(t => t.id === topicId);
    const newPYQs = [...(topic.pyqs || []), { id: uid(), q: question, status: "not" }];
    await updateTopic(topicId, { pyqs: newPYQs });
  };

  const handleCyclePYQ = async (topicId, pyqId) => {
    const order = ["not", "attempted", "done"];
    const topic = topics.find(t => t.id === topicId);
    const newPYQs = (topic.pyqs || []).map(p =>
      p.id === pyqId ? { ...p, status: order[(order.indexOf(p.status) + 1) % 3] } : p
    );
    await updateTopic(topicId, { pyqs: newPYQs });
  };

  const handleDeletePYQ = async (topicId, pyqId) => {
    const topic = topics.find(t => t.id === topicId);
    const newPYQs = (topic.pyqs || []).filter(p => p.id !== pyqId);
    await updateTopic(topicId, { pyqs: newPYQs });
  };

  // ✅ NEW: Save reflection using the hook
  const handleSaveReflection = async (r) => {
    await addReflection(r, user.id);
    setShowReflection(false);
  };

  const navItems = [
    { id: "dashboard", label: "Today", icon: "home", badge: (todayTasks.filter(t => t.status !== "done").length + overdueTasks.length) || null },
    { id: "topics", label: "Topics", icon: "book" },
    { id: "analytics", label: "Analytics", icon: "chart" },
    { id: "target", label: "Target", icon: "target" },
  ];

  if (authLoading) return <><style>{css}</style><div className="loading">Loading...</div></>;
  if (!user) return <><style>{css}</style><Auth /></>;

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-mark">UPSC</div>
            <div className="logo-title">Study Tracker</div>
            <div className="user-email">{user.email}</div>
          </div>
          <nav className="sidebar-nav">
            {navItems.map(n => (
              <button key={n.id} className={`nav-item${tab === n.id ? " active" : ""}`} onClick={() => setTab(n.id)}>
                <Icon name={n.icon} size={15} />{n.label}
                {n.badge ? <span className="badge">{n.badge}</span> : null}
              </button>
            ))}
          </nav>
          <div className="sidebar-footer">
            <div className="streak-card">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="fire" size={14} />
                <span className="streak-num">{streak}</span>
              </div>
              <div className="streak-label">Day Streak</div>
            </div>
            <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={() => signOut()}>
              <Icon name="logout" size={14} />Sign Out
            </button>
          </div>
        </aside>

        <main className="main">
          {/* ✅ FIXED: reflections now passed as prop to DashboardPage */}
          {tab === "dashboard" && (
            <DashboardPage
              todayTasks={todayTasks} overdueTasks={overdueTasks}
              todayHours={todayHours} todayProgress={todayProgress}
              dailyTarget={dailyTarget} todayLogs={todayLogs}
              topics={topics} markRevision={markRevision}
              onAddTopic={() => setShowAddTopic(true)}
              onLogTime={() => setShowLogTime(true)}
              onReflect={() => setShowReflection(true)}
              reflections={reflections}
            />
          )}
          {tab === "topics" && <TopicsPage topics={topics} deleteTopic={deleteTopic} onAddTopic={() => setShowAddTopic(true)} onPYQ={(id) => setShowPYQ(id)} />}
          {tab === "analytics" && <AnalyticsPage logs={logs} topics={topics} />}
          {tab === "target" && <TargetPage dailyTarget={dailyTarget} setDailyTarget={setDailyTarget} todayHours={todayHours} todayProgress={todayProgress} logs={logs} onLogTime={() => setShowLogTime(true)} />}
        </main>
      </div>

      {showAddTopic && <AddTopicModal onClose={() => setShowAddTopic(false)} onSave={handleAddTopic} />}
      {showLogTime && <LogTimeModal onClose={() => setShowLogTime(false)} onSave={handleLogTime} />}
      {showPYQ && <PYQModal topic={topics.find(t => t.id === showPYQ)} onClose={() => setShowPYQ(null)} onAdd={handleAddPYQ} onCycle={handleCyclePYQ} onDelete={handleDeletePYQ} />}
      {/* ✅ FIXED: now uses handleSaveReflection via hook instead of raw supabase call */}
      {showReflection && <ReflectionModal onClose={() => setShowReflection(false)} onSave={handleSaveReflection} />}
    </>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
// ✅ ADDED: reflections prop received and today's reflection shown at bottom
function DashboardPage({ todayTasks, overdueTasks, todayHours, todayProgress, dailyTarget, todayLogs, topics, markRevision, onAddTopic, onLogTime, onReflect, reflections }) {
  const pendingToday = todayTasks.filter(t => t.status !== "done");
  const doneToday = todayTasks.filter(t => t.status === "done");
  const dateLabel = new Date(today() + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // ✅ Find today's reflection if it exists
  const todayReflection = (reflections || []).find(r => r.date === today());

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Today's Command Center</div>
          <div className="topbar-date">{dateLabel}</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={onReflect}><Icon name="edit" size={14} />Reflect</button>
          <button className="btn btn-ghost" onClick={onLogTime}><Icon name="clock" size={14} />Log Time</button>
          <button className="btn btn-primary" onClick={onAddTopic}><Icon name="plus" size={14} />Add Topic</button>
        </div>
      </div>
      <div className="page">
        <div className="stats-row">
          <div className="stat-card" style={{ "--accent-color": "var(--accent)" }}>
            <div className="stat-value">{todayHours.toFixed(1)}<span style={{ fontSize: 16, color: "var(--text3)" }}>h</span></div>
            <div className="stat-label">Studied Today</div>
            <div className="progress-wrap"><div className="progress-fill" style={{ width: `${todayProgress}%` }} /></div>
            <div className="stat-sub">{dailyTarget}h target · {Math.max(0, dailyTarget - todayHours).toFixed(1)}h left</div>
          </div>
          <div className="stat-card" style={{ "--accent-color": "var(--blue)" }}>
            <div className="stat-value">{pendingToday.length}</div>
            <div className="stat-label">Revisions Due</div>
            <div className="stat-sub">{doneToday.length} completed today</div>
          </div>
          <div className="stat-card" style={{ "--accent-color": overdueTasks.length > 0 ? "var(--red)" : "var(--green)" }}>
            <div className="stat-value" style={{ color: overdueTasks.length > 0 ? "var(--red)" : "var(--green)" }}>{overdueTasks.length}</div>
            <div className="stat-label">Overdue</div>
            <div className="stat-sub">{overdueTasks.length > 0 ? "Needs attention" : "All clear!"}</div>
          </div>
          <div className="stat-card" style={{ "--accent-color": "var(--green)" }}>
            <div className="stat-value">{topics.length}</div>
            <div className="stat-label">Topics Tracked</div>
            <div className="stat-sub">across {[...new Set(topics.map(t => t.subject))].length} subjects</div>
          </div>
        </div>

        {overdueTasks.length > 0 && (
          <div className="alert-banner">
            <Icon name="alert" size={16} />
            <strong>{overdueTasks.length} overdue revision{overdueTasks.length > 1 ? "s" : ""}</strong> — please complete to maintain your revision cycle
          </div>
        )}

        <div className="two-col">
          <div>
            <div className="section-header">
              <div className="section-title">Due Today</div>
              <span style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--text3)" }}>{pendingToday.length} pending</span>
            </div>
            {todayTasks.length === 0
              ? <div className="empty"><div className="empty-icon">📭</div><h3>No revisions today</h3><p>Add topics to get started</p></div>
              : <div className="rev-list">{[...pendingToday, ...doneToday].map(task => <RevItem key={`${task.topicId}-${task.day}`} task={task} markRevision={markRevision} />)}</div>
            }
          </div>
          <div>
            {overdueTasks.length > 0 && (
              <>
                <div className="section-header"><div className="section-title" style={{ color: "var(--red)" }}>Overdue</div></div>
                <div className="rev-list" style={{ marginBottom: 20 }}>
                  {overdueTasks.slice(0, 5).map(task => <RevItem key={`${task.topicId}-${task.day}-ov`} task={task} markRevision={markRevision} overdue />)}
                </div>
              </>
            )}
            <div className="section-header"><div className="section-title">Time Logged Today</div></div>
            {todayLogs.length === 0
              ? <div className="empty" style={{ padding: "24px 0" }}><div className="empty-icon">⏱️</div><h3>No time logged</h3><p>Click "Log Time" to add sessions</p></div>
              : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {todayLogs.map(l => (
                    <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px" }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: subjColor(l.subject), flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{l.subject}</span>
                      <span style={{ fontSize: 13, color: "var(--accent)", fontFamily: "var(--mono)" }}>{l.hours}h</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", fontSize: 12, color: "var(--text3)", fontFamily: "var(--mono)" }}>
                    <span>Total</span>
                    <span style={{ color: "var(--accent)", fontWeight: 700 }}>{todayHours.toFixed(1)}h / {dailyTarget}h</span>
                  </div>
                </div>
            }
          </div>
        </div>

        {/* ✅ NEW: Today's Reflection Section */}
        <div className="divider" />
        <div className="section-header">
          <div className="section-title">Today's Reflection</div>
          <button className="btn btn-ghost btn-sm" onClick={onReflect}>
            <Icon name="edit" size={12} />{todayReflection ? "Edit" : "Add"}
          </button>
        </div>
        {!todayReflection ? (
          <div className="empty" style={{ padding: "20px 0" }}>
            <div className="empty-icon">📝</div>
            <h3>No reflection added today</h3>
            <p>Click "Add" to record what you learned and what could improve</p>
          </div>
        ) : (
          <div className="reflection-card">
            {todayReflection.learned && (
              <>
                <div className="reflection-label">✅ What I Learned</div>
                <div className="reflection-text">{todayReflection.learned}</div>
              </>
            )}
            {todayReflection.learned && todayReflection.issues && (
              <div className="reflection-divider" />
            )}
            {todayReflection.issues && (
              <>
                <div className="reflection-label">⚠️ What Went Wrong</div>
                <div className="reflection-text">{todayReflection.issues}</div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function RevItem({ task, markRevision, overdue }) {
  const dayClass = { 1: "d1", 3: "d3", 7: "d7" }[task.day];
  const diff = daysDiff(task.due);
  const diffLabel = overdue ? `${Math.abs(diff)}d ago` : diff === 0 ? "Today" : `+${diff}d`;
  return (
    <div className={`rev-item${overdue ? " overdue" : ""}${task.status === "done" ? " done" : ""}`}>
      <div className={`rev-check${task.status === "done" ? " checked" : ""}`} onClick={() => markRevision(task.topicId, task.day, task.status === "done" ? "pending" : "done")}>
        {task.status === "done" && <Icon name="check" size={12} />}
      </div>
      <span className={`rev-badge ${dayClass}`}>D{task.day}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="rev-topic" style={{ textDecoration: task.status === "done" ? "line-through" : "" }}>{task.topicName}</div>
        <div className="rev-subject">{task.subject}</div>
      </div>
      <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: overdue ? "var(--red)" : "var(--text3)" }}>{diffLabel}</span>
    </div>
  );
}

// ── Topics Page ───────────────────────────────────────────────────────────────
function TopicsPage({ topics, deleteTopic, onAddTopic, onPYQ }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const shown = topics.filter(t => (filter === "All" || t.subject === filter) && (!search || t.name.toLowerCase().includes(search.toLowerCase())));

  const getChip = (t, day) => {
    const status = (t.revisions || {})[day];
    const due = addDays(t.day0, day);
    if (status === "done") return <span className="chip chip-done">Done</span>;
    if (due < today()) return <span className="chip chip-overdue">Overdue</span>;
    if (due === today()) return <span className="chip chip-pending">Today</span>;
    return <span className="chip chip-na">{fmtDate(due)}</span>;
  };

  return (
    <>
      <div className="topbar">
        <div><div className="topbar-title">All Topics</div><div className="topbar-date">{topics.length} topics tracked</div></div>
        <button className="btn btn-primary" onClick={onAddTopic}><Icon name="plus" size={14} />Add Topic</button>
      </div>
      <div className="page">
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <input className="inline-input" placeholder="Search topics..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
          <select className="form-select" style={{ width: "auto" }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option>All</option>
            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        {shown.length === 0
          ? <div className="empty"><div className="empty-icon">📚</div><h3>No topics yet</h3><p>Add your first topic to start tracking</p></div>
          : <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
              <table className="topics-table">
                <thead><tr><th>Topic</th><th>Subject</th><th>Added</th><th>Day 1</th><th>Day 3</th><th>Day 7</th><th>PYQs</th><th></th></tr></thead>
                <tbody>
                  {shown.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.name}</td>
                      <td><span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: subjColor(t.subject) }} /><span style={{ fontSize: 12, color: "var(--text2)" }}>{t.subject}</span></span></td>
                      <td style={{ fontSize: 12, color: "var(--text3)", fontFamily: "var(--mono)" }}>{fmtDate(t.day0)}</td>
                      <td>{getChip(t, 1)}</td><td>{getChip(t, 3)}</td><td>{getChip(t, 7)}</td>
                      <td><button className="btn btn-ghost btn-sm" onClick={() => onPYQ(t.id)}><Icon name="question" size={12} />{(t.pyqs || []).length}</button></td>
                      <td><button className="btn btn-danger btn" onClick={() => deleteTopic(t.id)}><Icon name="trash" size={13} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>
    </>
  );
}

// ── Analytics ─────────────────────────────────────────────────────────────────
function AnalyticsPage({ logs, topics }) {
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    const ds = d.toISOString().split("T")[0];
    const h = logs.filter(l => l.date === ds).reduce((s, l) => s + Number(l.hours), 0);
    return { date: ds, label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }).replace(" ", "\n"), hours: h };
  });
  const maxH = Math.max(...last14.map(d => d.hours), 1);

  const subjBreakdown = {};
  logs.forEach(l => { subjBreakdown[l.subject] = (subjBreakdown[l.subject] || 0) + Number(l.hours); });
  const subjArr = Object.entries(subjBreakdown).sort((a, b) => b[1] - a[1]);
  const totalH = subjArr.reduce((s, [, h]) => s + h, 0);

  const weekH = logs.filter(l => (new Date() - new Date(l.date)) / 86400000 <= 7).reduce((s, l) => s + Number(l.hours), 0);
  const prevWeekH = logs.filter(l => { const d = (new Date() - new Date(l.date)) / 86400000; return d > 7 && d <= 14; }).reduce((s, l) => s + Number(l.hours), 0);
  const weekTrend = prevWeekH > 0 ? ((weekH - prevWeekH) / prevWeekH * 100).toFixed(0) : null;

  const insights = [];
  if (subjArr.length > 0) insights.push(`You've spent the most time on ${subjArr[0][0]} (${subjArr[0][1].toFixed(1)}h total)`);
  const d1miss = topics.filter(t => addDays(t.day0, 1) < today() && (t.revisions || {})[1] !== "done").length;
  if (d1miss > 0) insights.push(`You've missed Day 1 revisions for ${d1miss} topic${d1miss > 1 ? "s" : ""} — these are critical!`);
  const avg7 = (logs.filter(l => (new Date() - new Date(l.date)) / 86400000 <= 7).reduce((s, l) => s + Number(l.hours), 0) / 7).toFixed(1);
  insights.push(`Your 7-day daily average is ${avg7}h`);

  return (
    <>
      <div className="topbar"><div><div className="topbar-title">Analytics</div><div className="topbar-date">Performance overview</div></div></div>
      <div className="page">
        <div className="stats-row" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
          <div className="stat-card" style={{ "--accent-color": "var(--blue)" }}><div className="stat-value">{weekH.toFixed(1)}<span style={{ fontSize: 16, color: "var(--text3)" }}>h</span></div><div className="stat-label">This Week</div><div className="stat-sub">{weekTrend !== null ? `${weekTrend > 0 ? "↑" : "↓"} ${Math.abs(weekTrend)}% vs last week` : "First week!"}</div></div>
          <div className="stat-card" style={{ "--accent-color": "var(--accent)" }}><div className="stat-value">{totalH.toFixed(1)}<span style={{ fontSize: 16, color: "var(--text3)" }}>h</span></div><div className="stat-label">Total Hours</div><div className="stat-sub">across all subjects</div></div>
          <div className="stat-card" style={{ "--accent-color": "var(--green)" }}><div className="stat-value">{topics.filter(t => [1,3,7].every(d => (t.revisions||{})[d] === "done")).length}</div><div className="stat-label">Fully Revised</div><div className="stat-sub">of {topics.length} total topics</div></div>
        </div>
        <div className="two-col">
          <div>
            <div className="section-header"><div className="section-title">Daily Study Hours (14 Days)</div></div>
            <div className="chart-wrap">
              <div className="chart-bar-row">
                {last14.map((d, i) => (
                  <div key={i} className="chart-bar-col">
                    <span className="chart-bar-val">{d.hours > 0 ? d.hours.toFixed(1) : ""}</span>
                    <div className="chart-bar" style={{ height: `${(d.hours / maxH) * 100}%`, background: d.date === today() ? "var(--accent)" : "var(--blue)", opacity: d.date === today() ? 1 : 0.6 }} />
                    <span className="chart-bar-label">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="section-header"><div className="section-title">Subject Breakdown</div></div>
            <div className="chart-wrap">
              {subjArr.length === 0
                ? <div className="empty" style={{ padding: "20px 0" }}><p>No data yet</p></div>
                : <>
                    <SubjectPieChart data={subjArr} total={totalH} />
                    <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                      {subjArr.map(([s, h]) => (
                        <div key={s} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: subjColor(s), flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: 12 }}>{s}</span>
                          <div className="progress-wrap" style={{ flex: 2 }}><div className="progress-fill" style={{ width: `${(h / totalH) * 100}%`, background: subjColor(s) }} /></div>
                          <span style={{ fontSize: 12, color: "var(--text2)", fontFamily: "var(--mono)", width: 40, textAlign: "right" }}>{h.toFixed(1)}h</span>
                        </div>
                      ))}
                    </div>
                  </>
              }
            </div>
          </div>
        </div>
        {insights.length > 0 && (
          <>
            <div className="divider" />
            <div className="section-header"><div className="section-title">Smart Insights</div></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {insights.map((ins, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px" }}>
                  <span style={{ fontSize: 16 }}>💡</span>
                  <span style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.5 }}>{ins}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function SubjectPieChart({ data, total }) {
  const size = 100; const cx = 50; const cy = 50; const r = 38;
  let startAngle = -Math.PI / 2;
  const slices = data.map(([s, h]) => {
    const angle = (h / total) * Math.PI * 2;
    const x1 = cx + r * Math.cos(startAngle); const y1 = cy + r * Math.sin(startAngle);
    startAngle += angle;
    const x2 = cx + r * Math.cos(startAngle); const y2 = cy + r * Math.sin(startAngle);
    return { s, path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${angle > Math.PI ? 1 : 0} 1 ${x2} ${y2} Z`, color: subjColor(s) };
  });
  return (
    <svg viewBox="0 0 100 100" width="120" height="120" style={{ margin: "0 auto", display: "block" }}>
      {slices.map((sl, i) => <path key={i} d={sl.path} fill={sl.color} opacity="0.85" />)}
      <circle cx={cx} cy={cy} r={22} fill="var(--surface)" />
      <text x={cx} y={cy + 4} textAnchor="middle" fill="var(--text)" fontSize="10" fontFamily="var(--mono)" fontWeight="700">{total.toFixed(0)}h</text>
    </svg>
  );
}

// ── Target Page ───────────────────────────────────────────────────────────────
function TargetPage({ dailyTarget, setDailyTarget, todayHours, todayProgress, logs, onLogTime }) {
  const [editTarget, setEditTarget] = useState(false);
  const [tmpTarget, setTmpTarget] = useState(dailyTarget);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    const h = logs.filter(l => l.date === ds).reduce((s, l) => s + Number(l.hours), 0);
    return { date: ds, label: d.toLocaleDateString("en-IN", { weekday: "short" }), hours: h, met: h >= dailyTarget };
  }).reverse();

  return (
    <>
      <div className="topbar">
        <div><div className="topbar-title">Daily Target</div><div className="topbar-date">Track your daily goals</div></div>
        <button className="btn btn-ghost" onClick={onLogTime}><Icon name="plus" size={14} />Log Time</button>
      </div>
      <div className="page">
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 28, marginBottom: 24, display: "flex", alignItems: "center", gap: 32 }}>
          <div style={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
            <svg viewBox="0 0 140 140" width="140" height="140">
              <circle cx="70" cy="70" r="58" fill="none" stroke="var(--border2)" strokeWidth="10" />
              <circle cx="70" cy="70" r="58" fill="none" stroke="var(--accent)" strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 58}`}
                strokeDashoffset={`${2 * Math.PI * 58 * (1 - todayProgress / 100)}`}
                strokeLinecap="round" transform="rotate(-90 70 70)"
                style={{ transition: "stroke-dashoffset 0.5s" }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--mono)", color: "var(--accent)" }}>{Math.round(todayProgress)}%</span>
              <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600 }}>of goal</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Today's Progress</div>
            <div style={{ fontSize: 40, fontWeight: 800, fontFamily: "var(--mono)", marginTop: 8 }}>
              {todayHours.toFixed(1)}<span style={{ fontSize: 20, color: "var(--text3)" }}>h</span>
              <span style={{ fontSize: 18, color: "var(--text3)", fontWeight: 400 }}> / {dailyTarget}h</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 8 }}>
              {todayHours >= dailyTarget ? <span style={{ color: "var(--green)" }}>🎯 Daily target achieved!</span> : <span>{Math.max(0, dailyTarget - todayHours).toFixed(1)}h remaining</span>}
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
              {editTarget
                ? <>
                    <input type="number" className="inline-input" value={tmpTarget} min={1} max={16} step={0.5} onChange={e => setTmpTarget(parseFloat(e.target.value))} style={{ width: 80 }} />
                    <button className="btn btn-primary btn-sm" onClick={() => { setDailyTarget(tmpTarget); setEditTarget(false); }}>Save</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditTarget(false)}>Cancel</button>
                  </>
                : <button className="btn btn-ghost btn-sm" onClick={() => { setTmpTarget(dailyTarget); setEditTarget(true); }}><Icon name="edit" size={12} />Change Target ({dailyTarget}h)</button>
              }
            </div>
          </div>
        </div>
        <div className="section-header"><div className="section-title">This Week</div></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 10 }}>
          {weekDays.map(d => (
            <div key={d.date} style={{ background: "var(--surface)", border: `1px solid ${d.date === today() ? "var(--accent)" : "var(--border)"}`, borderRadius: 10, padding: "14px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase" }}>{d.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--mono)", marginTop: 8, color: d.met ? "var(--green)" : d.hours > 0 ? "var(--orange)" : "var(--text3)" }}>{d.hours.toFixed(1)}</div>
              <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)", marginTop: 2 }}>hours</div>
              <div style={{ marginTop: 8, fontSize: 14 }}>{d.met ? "✅" : d.hours > 0 ? "🔸" : "⬜"}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Modals ────────────────────────────────────────────────────────────────────
function AddTopicModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [note, setNote] = useState("");
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Add New Topic <button className="btn btn-danger" onClick={onClose}><Icon name="x" size={16} /></button></div>
        <div className="form-stack">
          <div className="form-group"><label className="form-label">Topic Name *</label><input className="form-input" placeholder="e.g. Causes of 1857 Revolt" value={name} onChange={e => setName(e.target.value)} autoFocus /></div>
          <div className="form-group"><label className="form-label">Subject *</label><select className="form-select" value={subject} onChange={e => setSubject(e.target.value)}>{SUBJECTS.map(s => <option key={s}>{s}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Note (optional)</label><input className="form-input" placeholder="Source, chapter, etc." value={note} onChange={e => setNote(e.target.value)} /></div>
          <div style={{ background: "var(--surface2)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--text2)" }}>Auto-creates Day 1, Day 3, Day 7 revision schedule</div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => name.trim() && onSave({ name: name.trim(), subject, note })} disabled={!name.trim()}>Add Topic</button>
        </div>
      </div>
    </div>
  );
}

function LogTimeModal({ onClose, onSave }) {
  const [hours, setHours] = useState(1);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [note, setNote] = useState("");
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Log Study Time <button className="btn btn-danger" onClick={onClose}><Icon name="x" size={16} /></button></div>
        <div className="form-stack">
          <div className="form-row">
            <div className="form-group"><label className="form-label">Hours *</label><input type="number" className="form-input" min={0.25} max={16} step={0.25} value={hours} onChange={e => setHours(parseFloat(e.target.value))} autoFocus /></div>
            <div className="form-group"><label className="form-label">Subject *</label><select className="form-select" value={subject} onChange={e => setSubject(e.target.value)}>{SUBJECTS.map(s => <option key={s}>{s}</option>)}</select></div>
          </div>
          <div className="form-group"><label className="form-label">Note (optional)</label><input className="form-input" placeholder="What did you study?" value={note} onChange={e => setNote(e.target.value)} /></div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => hours > 0 && onSave({ hours, subject, note })}>Log Time</button>
        </div>
      </div>
    </div>
  );
}

function PYQModal({ topic, onClose, onAdd, onCycle, onDelete }) {
  const [q, setQ] = useState("");
  if (!topic) return null;
  const pyqs = topic.pyqs || [];
  const statusLabel = { not: "Not Attempted", attempted: "Attempted", done: "Completed" };
  const statusClass = { not: "pyq-not", attempted: "pyq-attempted", done: "pyq-done" };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 540 }}>
        <div className="modal-title">PYQs — {topic.name} <button className="btn btn-danger" onClick={onClose}><Icon name="x" size={16} /></button></div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input className="form-input" placeholder="Add a question..." value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && q.trim()) { onAdd(topic.id, q.trim()); setQ(""); } }} style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={() => { if (q.trim()) { onAdd(topic.id, q.trim()); setQ(""); } }}>Add</button>
        </div>
        {pyqs.length === 0
          ? <div className="empty" style={{ padding: "20px 0" }}><div className="empty-icon">❓</div><h3>No PYQs yet</h3><p>Type a question and press Enter</p></div>
          : <div className="pyq-list">
              {pyqs.map(p => (
                <div key={p.id} className="pyq-item">
                  <span className="pyq-text">{p.q}</span>
                  <button className={`pyq-status ${statusClass[p.status]}`} onClick={() => onCycle(topic.id, p.id)}>{statusLabel[p.status]}</button>
                  <button className="btn btn-danger" style={{ padding: "2px 4px" }} onClick={() => onDelete(topic.id, p.id)}><Icon name="trash" size={11} /></button>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}

function ReflectionModal({ onClose, onSave }) {
  const [learned, setLearned] = useState("");
  const [issues, setIssues] = useState("");
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Daily Reflection <button className="btn btn-danger" onClick={onClose}><Icon name="x" size={16} /></button></div>
        <div className="form-stack">
          <div className="form-group"><label className="form-label">What did you learn today?</label><textarea className="form-input" rows={3} placeholder="Topics covered, key concepts..." value={learned} onChange={e => setLearned(e.target.value)} style={{ resize: "vertical" }} /></div>
          <div className="form-group"><label className="form-label">What went wrong / could improve?</label><textarea className="form-input" rows={2} placeholder="Distractions, gaps..." value={issues} onChange={e => setIssues(e.target.value)} style={{ resize: "vertical" }} /></div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave({ date: today(), learned, issues, id: uid() })}>Save</button>
        </div>
      </div>
    </div>
  );
}