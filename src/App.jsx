import { useState, useEffect, useCallback } from "react";

// ─── Persistent Storage Helpers ────────────────────────────────────────────
const KEYS = {
  engineers: "iksana:engineers",
  projects: "iksana:projects",
  tasks: "iksana:tasks",
  productivity: "iksana:productivity",
  attendance: "iksana:attendance",
  leaves: "iksana:leaves",
  dismissed: "iksana:dismissed",
};

// ─── Seed Attendance ─────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().slice(0, 10);
const daysBack = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };

const SEED_ATTENDANCE = [
  // last 5 working days, all 8 engineers
  ...["e1","e2","e3","e4","e5","e6","e7","e8"].flatMap(eid =>
    [0,1,2,3,4].map(n => ({
      id: `a-${eid}-${n}`,
      engineerId: eid,
      date: daysBack(n),
      checkIn: n === 0 ? "09:10" : ["09:00","09:15","08:55","09:30","09:05"][n % 5],
      checkOut: n === 0 ? null : ["18:00","18:15","17:45","18:30","18:00"][n % 5],
      type: "present",
      notes: "",
    }))
  ),
];

const SEED_LEAVES = [
  { id: "l1", engineerId: "e4", startDate: daysBack(-3), endDate: daysBack(-5), type: "casual", reason: "Personal work", status: "approved" },
  { id: "l2", engineerId: "e7", startDate: daysBack(-2), endDate: daysBack(-2), type: "sick", reason: "Fever", status: "approved" },
  { id: "l3", engineerId: "e2", startDate: daysBack(-8), endDate: daysBack(-10), type: "annual", reason: "Family visit", status: "approved" },
];

const LEAVE_TYPES = ["casual", "sick", "annual", "compensatory", "unpaid"];
const LEAVE_COLORS = { casual: "#6366f1", sick: "#ef4444", annual: "#10b981", compensatory: "#f59e0b", unpaid: "#64748b" };

async function load(key, fallback) {
  try {
    const r = await window.storage.get(key);
    return r ? JSON.parse(r.value) : fallback;
  } catch { return fallback; }
}
async function save(key, val) {
  try { await window.storage.set(key, JSON.stringify(val)); } catch {}
}

// ─── Seed Data ──────────────────────────────────────────────────────────────
const SEED_ENGINEERS = [
  { id: "e1", name: "Arun Kumar", role: "BIM Manager", location: "office", rate: 850, active: true },
  { id: "e2", name: "Priya Nair", role: "Senior Architect", location: "office", rate: 750, active: true },
  { id: "e3", name: "Rahul Sharma", role: "BIM Coordinator", location: "remote", rate: 650, active: true },
  { id: "e4", name: "Divya Menon", role: "Interior Designer", location: "remote", rate: 600, active: true },
  { id: "e5", name: "Kiran Reddy", role: "Revit Modeller", location: "office", rate: 500, active: true },
  { id: "e6", name: "Ananya Singh", role: "QS Estimator", location: "remote", rate: 580, active: true },
  { id: "e7", name: "Vijay Thomas", role: "Revit Modeller", location: "office", rate: 500, active: true },
  { id: "e8", name: "Meera Pillai", role: "Drafting Engineer", location: "remote", rate: 450, active: true },
];

const SEED_PROJECTS = [
  { id: "p1", name: "NEOM Residential Block C", client: "NEOM", region: "KSA", status: "active", budget: 420000, startDate: "2025-01-15", endDate: "2025-08-30" },
  { id: "p2", name: "Dubai Marina Interiors", client: "Emaar", region: "UAE", status: "active", budget: 180000, startDate: "2025-03-01", endDate: "2025-07-31" },
  { id: "p3", name: "Abu Dhabi Villa FF&E", client: "Private", region: "UAE", status: "active", budget: 95000, startDate: "2025-02-01", endDate: "2025-06-15" },
  { id: "p4", name: "Aramco Office Fit-Out", client: "Saudi Aramco", region: "KSA", status: "active", budget: 320000, startDate: "2024-11-01", endDate: "2025-09-30" },
  { id: "p5", name: "Riyadh Retail Interiors", client: "Al Futtaim", region: "KSA", status: "completed", budget: 140000, startDate: "2024-08-01", endDate: "2025-01-31" },
];

const SEED_TASKS = [
  { id: "t1", projectId: "p1", title: "NEOM BIM Execution Plan", assignee: "e1", status: "completed", priority: "high", estimatedHours: 24, loggedHours: 22, dueDate: "2025-02-01", createdAt: "2025-01-15", discipline: "BIM" },
  { id: "t2", projectId: "p1", title: "Level 1–5 Revit Modelling", assignee: "e3", status: "in-progress", priority: "high", estimatedHours: 120, loggedHours: 74, dueDate: "2025-05-30", createdAt: "2025-02-01", discipline: "Architecture" },
  { id: "t3", projectId: "p1", title: "FF&E Schedule Generation", assignee: "e4", status: "in-progress", priority: "medium", estimatedHours: 40, loggedHours: 18, dueDate: "2025-06-15", createdAt: "2025-03-01", discipline: "Interior" },
  { id: "t4", projectId: "p2", title: "Interior Elevations – All Units", assignee: "e2", status: "in-progress", priority: "high", estimatedHours: 80, loggedHours: 55, dueDate: "2025-05-20", createdAt: "2025-03-01", discipline: "Interior" },
  { id: "t5", projectId: "p2", title: "BOQ – Finishes & Fixtures", assignee: "e6", status: "in-progress", priority: "medium", estimatedHours: 32, loggedHours: 20, dueDate: "2025-06-01", createdAt: "2025-03-15", discipline: "QS" },
  { id: "t6", projectId: "p3", title: "Villa FF&E Families", assignee: "e5", status: "completed", priority: "medium", estimatedHours: 48, loggedHours: 50, dueDate: "2025-03-31", createdAt: "2025-02-01", discipline: "BIM" },
  { id: "t7", projectId: "p4", title: "Aramco Compliance Checklist", assignee: "e1", status: "in-progress", priority: "high", estimatedHours: 16, loggedHours: 10, dueDate: "2025-05-10", createdAt: "2025-04-01", discipline: "BIM" },
  { id: "t8", projectId: "p4", title: "Office Layout Revit Model", assignee: "e7", status: "in-progress", priority: "high", estimatedHours: 96, loggedHours: 40, dueDate: "2025-07-01", createdAt: "2025-03-01", discipline: "Architecture" },
  { id: "t9", projectId: "p4", title: "4D Schedule Navisworks", assignee: "e3", status: "not-started", priority: "medium", estimatedHours: 28, loggedHours: 0, dueDate: "2025-07-15", createdAt: "2025-04-10", discipline: "4D" },
  { id: "t10", projectId: "p2", title: "Trade Drawing Package", assignee: "e8", status: "in-progress", priority: "low", estimatedHours: 60, loggedHours: 25, dueDate: "2025-06-30", createdAt: "2025-03-20", discipline: "Drafting" },
];

const SEED_PRODUCTIVITY = {
  "BIM": { unit: "drawings/day", rate: 3 },
  "Architecture": { unit: "sqm modelled/day", rate: 120 },
  "Interior": { unit: "rooms/day", rate: 4 },
  "QS": { unit: "BOQ items/day", rate: 25 },
  "4D": { unit: "activities linked/day", rate: 30 },
  "Drafting": { unit: "sheets/day", rate: 5 },
};

// ─── Utilities ───────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const fmt = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
const pct = (a, b) => b === 0 ? 0 : Math.round((a / b) * 100);
const STATUS_COLOR = { "not-started": "#64748b", "in-progress": "#f59e0b", "completed": "#10b981", "on-hold": "#ef4444" };
const PRIORITY_COLOR = { high: "#ef4444", medium: "#f59e0b", low: "#64748b" };
const DISCIPLINES = ["BIM", "Architecture", "Interior", "QS", "4D", "Drafting"];

// ─── App ─────────────────────────────────────────────────────────────────────
export default function IksanaApp() {
  const [tab, setTab] = useState("dashboard");
  const [engineers, setEngineers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [productivity, setProductivity] = useState({});
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [dismissed, setDismissed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [notifPanel, setNotifPanel] = useState(false);

  useEffect(() => {
    (async () => {
      const [eng, proj, tsk, prod, att, lvs, dis] = await Promise.all([
        load(KEYS.engineers, SEED_ENGINEERS),
        load(KEYS.projects, SEED_PROJECTS),
        load(KEYS.tasks, SEED_TASKS),
        load(KEYS.productivity, SEED_PRODUCTIVITY),
        load(KEYS.attendance, SEED_ATTENDANCE),
        load(KEYS.leaves, SEED_LEAVES),
        load(KEYS.dismissed, []),
      ]);
      setEngineers(eng); setProjects(proj); setTasks(tsk); setProductivity(prod);
      setAttendance(att); setLeaves(lvs); setDismissed(dis);
      setLoading(false);
    })();
  }, []);

  const persist = useCallback(async (key, setter, val) => {
    setter(val);
    await save(key, val);
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0f1117", color: "#e2e8f0", fontFamily: "Sora, sans-serif", fontSize: 18 }}>
      Loading Iksana Studio…
    </div>
  );

  return (
    <div style={{ fontFamily: "'Sora', 'DM Sans', sans-serif", background: "#0c0e14", minHeight: "100vh", color: "#e2e8f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #1a1d27; } ::-webkit-scrollbar-thumb { background: #2d3148; border-radius: 3px; }
        input, select, textarea { background: #1a1d27 !important; border: 1px solid #2d3148 !important; color: #e2e8f0 !important; border-radius: 8px; padding: 8px 12px; font-family: inherit; font-size: 13px; outline: none; width: 100%; }
        input:focus, select:focus, textarea:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
        label { font-size: 12px; color: #94a3b8; margin-bottom: 4px; display: block; font-weight: 500; }
        .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; font-family: inherit; transition: all 0.15s; }
        .btn-primary { background: #6366f1; color: white; } .btn-primary:hover { background: #4f46e5; }
        .btn-danger { background: #ef4444; color: white; } .btn-danger:hover { background: #dc2626; }
        .btn-ghost { background: transparent; color: #94a3b8; border: 1px solid #2d3148 !important; } .btn-ghost:hover { background: #1a1d27; color: #e2e8f0; }
        .card { background: #13151f; border: 1px solid #1e2133; border-radius: 12px; padding: 20px; }
        .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .progress-bar { height: 6px; background: #1e2133; border-radius: 3px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
        table { width: 100%; border-collapse: collapse; }
        th { font-size: 11px; color: #64748b; font-weight: 600; padding: 10px 12px; text-align: left; border-bottom: 1px solid #1e2133; text-transform: uppercase; letter-spacing: 0.05em; }
        td { font-size: 13px; padding: 10px 12px; border-bottom: 1px solid #1a1d27; vertical-align: middle; }
        tr:hover td { background: #13151f; }
        .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .modal { background: #13151f; border: 1px solid #2d3148; border-radius: 16px; padding: 28px; width: 480px; max-width: 95vw; max-height: 90vh; overflow-y: auto; }
        .form-row { margin-bottom: 14px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .stat-card { background: linear-gradient(135deg, #13151f 0%, #1a1d2e 100%); border: 1px solid #1e2133; border-radius: 12px; padding: 20px; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; color: #64748b; transition: all 0.15s; white-space: nowrap; }
        .nav-item:hover { background: #1a1d27; color: #e2e8f0; }
        .nav-item.active { background: rgba(99,102,241,0.15); color: #818cf8; }
        .badge { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; font-size: 10px; font-weight: 700; background: #6366f1; color: white; margin-left: auto; }
      `}</style>

      {/* Sidebar */}
      <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 220, background: "#0c0e14", borderRight: "1px solid #1e2133", display: "flex", flexDirection: "column", zIndex: 50 }}>
        <div style={{ padding: "20px 16px 12px" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.02em" }}>iksana</div>
          <div style={{ fontSize: 11, color: "#4a5568", marginTop: 2 }}>Studio Management</div>
        </div>
        <div style={{ flex: 1, padding: "8px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { id: "dashboard", icon: "⬡", label: "Dashboard" },
            { id: "tasks", icon: "◈", label: "Tasks", badge: tasks.filter(t => t.status === "in-progress").length },
            { id: "engineers", icon: "◉", label: "Engineers" },
            { id: "projects", icon: "◫", label: "Projects" },
            { id: "allocation", icon: "⊞", label: "Allocation" },
            { id: "attendance", icon: "◷", label: "Attendance" },
            { id: "productivity", icon: "◎", label: "Productivity" },
            { id: "reports", icon: "◳", label: "Reports" },
            { id: "notifications", icon: "◐", label: "Alerts", badge: computeAlerts(tasks, projects, engineers, leaves, dismissed).filter(a => a.severity === "critical").length },
            { id: "export", icon: "◧", label: "Export" },
          ].map(item => (
            <div key={item.id} className={`nav-item ${tab === item.id ? "active" : ""}`} onClick={() => setTab(item.id)}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
              {item.badge > 0 && <span className="badge" style={{ background: item.id === "notifications" ? "#ef4444" : "#6366f1" }}>{item.badge}</span>}
            </div>
          ))}
        </div>
        <div style={{ padding: 16, borderTop: "1px solid #1e2133" }}>
          <div style={{ fontSize: 11, color: "#374151" }}>v2.3 · ISO 19650</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft: 220, minHeight: "100vh" }}>
        <div style={{ padding: "24px 28px", maxWidth: 1400 }}>
          {tab === "dashboard" && <Dashboard engineers={engineers} projects={projects} tasks={tasks} setTab={setTab} />}
          {tab === "tasks" && <Tasks tasks={tasks} engineers={engineers} projects={projects} setTasks={v => persist(KEYS.tasks, setTasks, v)} showToast={showToast} />}
          {tab === "engineers" && <Engineers engineers={engineers} tasks={tasks} setEngineers={v => persist(KEYS.engineers, setEngineers, v)} showToast={showToast} />}
          {tab === "projects" && <Projects projects={projects} tasks={tasks} engineers={engineers} setProjects={v => persist(KEYS.projects, setProjects, v)} showToast={showToast} />}
          {tab === "allocation" && <Allocation engineers={engineers} tasks={tasks} projects={projects} />}
          {tab === "attendance" && <Attendance engineers={engineers} attendance={attendance} leaves={leaves} setAttendance={v => persist(KEYS.attendance, setAttendance, v)} setLeaves={v => persist(KEYS.leaves, setLeaves, v)} showToast={showToast} />}
          {tab === "productivity" && <Productivity productivity={productivity} tasks={tasks} engineers={engineers} projects={projects} setProductivity={v => persist(KEYS.productivity, setProductivity, v)} showToast={showToast} />}
          {tab === "reports" && <Reports engineers={engineers} projects={projects} tasks={tasks} attendance={attendance} leaves={leaves} />}
          {tab === "notifications" && <Notifications tasks={tasks} projects={projects} engineers={engineers} leaves={leaves} dismissed={dismissed} setDismissed={v => persist(KEYS.dismissed, setDismissed, v)} setTab={setTab} />}
          {tab === "export" && <Export tasks={tasks} projects={projects} engineers={engineers} attendance={attendance} leaves={leaves} />}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: toast.type === "success" ? "#10b981" : "#ef4444", color: "white", padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 200, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function Dashboard({ engineers, projects, tasks, setTab }) {
  const activeProjects = projects.filter(p => p.status === "active");
  const inProgressTasks = tasks.filter(t => t.status === "in-progress");
  const completedTasks = tasks.filter(t => t.status === "completed");
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const costToDate = tasks.reduce((s, t) => {
    const eng = engineers.find(e => e.id === t.assignee);
    return s + (eng ? (t.loggedHours * (eng.rate / 8)) : 0);
  }, 0);
  const overdueTasks = tasks.filter(t => t.status !== "completed" && new Date(t.dueDate) < new Date());

  const byDiscipline = DISCIPLINES.map(d => ({
    d,
    total: tasks.filter(t => t.discipline === d).length,
    done: tasks.filter(t => t.discipline === d && t.status === "completed").length,
  }));

  return (
    <div>
      <PageHeader title="Dashboard" sub={`${new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`} />

      {/* Stat row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Active Projects", value: activeProjects.length, sub: `${projects.length} total`, accent: "#6366f1" },
          { label: "Tasks In Progress", value: inProgressTasks.length, sub: `${overdueTasks.length} overdue`, accent: "#f59e0b" },
          { label: "Engineers Active", value: engineers.filter(e => e.active).length, sub: `${engineers.filter(e => e.location === "remote" && e.active).length} remote`, accent: "#10b981" },
          { label: "Cost to Date", value: `₹${(costToDate / 100000).toFixed(1)}L`, sub: `of ₹${(totalBudget / 100000).toFixed(0)}L budget`, accent: "#ec4899" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.accent, letterSpacing: "-0.03em" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#4a5568", marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Active Projects */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>Active Projects</div>
            <button className="btn btn-ghost" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => setTab("projects")}>View all</button>
          </div>
          {activeProjects.map(p => {
            const ptasks = tasks.filter(t => t.projectId === p.id);
            const done = ptasks.filter(t => t.status === "completed").length;
            const progress = pct(done, ptasks.length);
            return (
              <div key={p.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{progress}%</div>
                </div>
                <div style={{ fontSize: 11, color: "#4a5568", marginBottom: 6 }}>{p.client} · {p.region}</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%`, background: progress > 75 ? "#10b981" : progress > 40 ? "#6366f1" : "#f59e0b" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Discipline breakdown */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 16 }}>Tasks by Discipline</div>
          {byDiscipline.filter(d => d.total > 0).map(d => (
            <div key={d.d} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 80, fontSize: 12, color: "#94a3b8" }}>{d.d}</div>
              <div style={{ flex: 1 }}>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct(d.done, d.total)}%`, background: "#6366f1" }} />
                </div>
              </div>
              <div style={{ width: 60, fontSize: 12, color: "#64748b", textAlign: "right" }}>{d.done}/{d.total}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent tasks */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>Recent In-Progress Tasks</div>
          <button className="btn btn-ghost" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => setTab("tasks")}>All tasks</button>
        </div>
        <table>
          <thead><tr><th>Task</th><th>Project</th><th>Assignee</th><th>Progress</th><th>Due</th></tr></thead>
          <tbody>
            {inProgressTasks.slice(0, 5).map(t => {
              const eng = engineers.find(e => e.id === t.assignee);
              const proj = projects.find(p => p.id === t.projectId);
              const progress = pct(t.loggedHours, t.estimatedHours);
              return (
                <tr key={t.id}>
                  <td><div style={{ fontWeight: 500 }}>{t.title}</div><span className="tag" style={{ background: `${PRIORITY_COLOR[t.priority]}22`, color: PRIORITY_COLOR[t.priority] }}>{t.priority}</span></td>
                  <td style={{ color: "#94a3b8" }}>{proj?.name?.split(" ").slice(0, 3).join(" ")}</td>
                  <td style={{ color: "#94a3b8" }}>{eng?.name}</td>
                  <td style={{ width: 120 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="progress-bar" style={{ flex: 1 }}><div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%`, background: progress > 100 ? "#ef4444" : "#6366f1" }} /></div>
                      <span style={{ fontSize: 11, color: "#64748b", width: 30 }}>{progress}%</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: new Date(t.dueDate) < new Date() ? "#ef4444" : "#64748b" }}>{t.dueDate}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tasks ───────────────────────────────────────────────────────────────────
function Tasks({ tasks, engineers, projects, setTasks, showToast }) {
  const [filter, setFilter] = useState({ status: "all", project: "all", engineer: "all", discipline: "all" });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [logHours, setLogHours] = useState(null); // { taskId, hours }

  const filtered = tasks.filter(t =>
    (filter.status === "all" || t.status === filter.status) &&
    (filter.project === "all" || t.projectId === filter.project) &&
    (filter.engineer === "all" || t.assignee === filter.engineer) &&
    (filter.discipline === "all" || t.discipline === filter.discipline)
  );

  const handleSave = (data) => {
    if (editing) {
      setTasks(tasks.map(t => t.id === editing.id ? { ...editing, ...data } : t));
      showToast("Task updated");
    } else {
      setTasks([...tasks, { id: "t" + uid(), ...data, loggedHours: 0, createdAt: new Date().toISOString().slice(0, 10) }]);
      showToast("Task created");
    }
    setShowForm(false); setEditing(null);
  };

  const handleDelete = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
    showToast("Task deleted", "error");
  };

  const handleLogHours = () => {
    if (!logHours || isNaN(logHours.hours)) return;
    setTasks(tasks.map(t => t.id === logHours.taskId ? { ...t, loggedHours: t.loggedHours + Number(logHours.hours) } : t));
    showToast(`${logHours.hours}h logged`);
    setLogHours(null);
  };

  return (
    <div>
      <PageHeader title="Tasks" sub={`${filtered.length} tasks`} action={<button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>+ New Task</button>} />

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { key: "status", label: "Status", options: ["all", "not-started", "in-progress", "completed", "on-hold"] },
          { key: "discipline", label: "Discipline", options: ["all", ...DISCIPLINES] },
          { key: "project", label: "Project", options: ["all", ...projects.map(p => p.id)], labels: { all: "All Projects", ...Object.fromEntries(projects.map(p => [p.id, p.name.split(" ").slice(0, 3).join(" ")])) } },
          { key: "engineer", label: "Engineer", options: ["all", ...engineers.map(e => e.id)], labels: { all: "All Engineers", ...Object.fromEntries(engineers.map(e => [e.id, e.name])) } },
        ].map(f => (
          <select key={f.key} value={filter[f.key]} onChange={e => setFilter({ ...filter, [f.key]: e.target.value })} style={{ width: "auto" }}>
            {f.options.map(o => <option key={o} value={o}>{f.labels ? f.labels[o] || o : o}</option>)}
          </select>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table>
          <thead><tr><th>Task</th><th>Project</th><th>Assignee</th><th>Discipline</th><th>Hours</th><th>Status</th><th>Due</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(t => {
              const eng = engineers.find(e => e.id === t.assignee);
              const proj = projects.find(p => p.id === t.projectId);
              const progress = pct(t.loggedHours, t.estimatedHours);
              return (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 500, marginBottom: 2 }}>{t.title}</div>
                    <span className="tag" style={{ background: `${PRIORITY_COLOR[t.priority]}22`, color: PRIORITY_COLOR[t.priority] }}>{t.priority}</span>
                  </td>
                  <td style={{ color: "#94a3b8", fontSize: 12 }}>{proj?.name?.split(" ").slice(0, 3).join(" ")}</td>
                  <td>
                    <div style={{ fontSize: 13 }}>{eng?.name}</div>
                    <div style={{ fontSize: 11, color: eng?.location === "remote" ? "#f59e0b" : "#10b981" }}>{eng?.location}</div>
                  </td>
                  <td><span className="tag" style={{ background: "#1e2133", color: "#818cf8" }}>{t.discipline}</span></td>
                  <td style={{ width: 120 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: "#64748b" }}>{t.loggedHours}h / {t.estimatedHours}h</span>
                    </div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%`, background: progress > 100 ? "#ef4444" : "#6366f1" }} /></div>
                  </td>
                  <td>
                    <select value={t.status} onChange={e => setTasks(tasks.map(x => x.id === t.id ? { ...x, status: e.target.value } : x))} style={{ width: "auto", fontSize: 12, color: STATUS_COLOR[t.status] }}>
                      {["not-started", "in-progress", "completed", "on-hold"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ fontSize: 12, color: new Date(t.dueDate) < new Date() && t.status !== "completed" ? "#ef4444" : "#64748b" }}>{t.dueDate}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => setLogHours({ taskId: t.id, hours: "" })}>+ hrs</button>
                      <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => { setEditing(t); setShowForm(true); }}>Edit</button>
                      <button className="btn btn-danger" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => handleDelete(t.id)}>✕</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && <TaskForm task={editing} engineers={engineers} projects={projects} onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null); }} />}

      {logHours && (
        <div className="modal-bg">
          <div className="modal" style={{ width: 320 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Log Hours</div>
            <div className="form-row">
              <label>Hours to add</label>
              <input type="number" min="0.5" step="0.5" value={logHours.hours} onChange={e => setLogHours({ ...logHours, hours: e.target.value })} placeholder="e.g. 4" />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" onClick={handleLogHours}>Log Hours</button>
              <button className="btn btn-ghost" onClick={() => setLogHours(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskForm({ task, engineers, projects, onSave, onClose }) {
  const [d, setD] = useState(task || { title: "", projectId: "", assignee: "", discipline: "BIM", priority: "medium", status: "not-started", estimatedHours: "", dueDate: "" });
  const set = (k, v) => setD(p => ({ ...p, [k]: v }));
  return (
    <div className="modal-bg">
      <div className="modal">
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>{task ? "Edit Task" : "New Task"}</div>
        <div className="form-row"><label>Task Title</label><input value={d.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Level 3 Revit Modelling" /></div>
        <div className="form-grid">
          <div className="form-row">
            <label>Project</label>
            <select value={d.projectId} onChange={e => set("projectId", e.target.value)}>
              <option value="">Select project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label>Assignee</label>
            <select value={d.assignee} onChange={e => set("assignee", e.target.value)}>
              <option value="">Select engineer</option>
              {engineers.filter(e => e.active).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label>Discipline</label>
            <select value={d.discipline} onChange={e => set("discipline", e.target.value)}>
              {DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label>Priority</label>
            <select value={d.priority} onChange={e => set("priority", e.target.value)}>
              {["high", "medium", "low"].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label>Status</label>
            <select value={d.status} onChange={e => set("status", e.target.value)}>
              {["not-started", "in-progress", "completed", "on-hold"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label>Estimated Hours</label>
            <input type="number" value={d.estimatedHours} onChange={e => set("estimatedHours", Number(e.target.value))} placeholder="40" />
          </div>
        </div>
        <div className="form-row"><label>Due Date</label><input type="date" value={d.dueDate} onChange={e => set("dueDate", e.target.value)} /></div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="btn btn-primary" onClick={() => onSave(d)}>Save Task</button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Engineers ───────────────────────────────────────────────────────────────
function Engineers({ engineers, tasks, setEngineers, showToast }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const handleSave = (d) => {
    if (editing) {
      setEngineers(engineers.map(e => e.id === editing.id ? { ...editing, ...d } : e));
      showToast("Engineer updated");
    } else {
      setEngineers([...engineers, { id: "e" + uid(), ...d, active: true }]);
      showToast("Engineer added");
    }
    setShowForm(false); setEditing(null);
  };

  return (
    <div>
      <PageHeader title="Engineers" sub={`${engineers.filter(e => e.active).length} active`} action={<button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>+ Add Engineer</button>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {engineers.map(eng => {
          const myTasks = tasks.filter(t => t.assignee === eng.id);
          const active = myTasks.filter(t => t.status === "in-progress").length;
          const totalHours = myTasks.reduce((s, t) => s + t.loggedHours, 0);
          return (
            <div key={eng.id} className="card" style={{ opacity: eng.active ? 1 : 0.5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: `hsl(${eng.name.charCodeAt(0) * 10}, 60%, 35%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                    {eng.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{eng.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{eng.role}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span className="tag" style={{ background: eng.location === "remote" ? "#f59e0b22" : "#10b98122", color: eng.location === "remote" ? "#f59e0b" : "#10b981" }}>{eng.location}</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[{ label: "Active", val: active }, { label: "Total Tasks", val: myTasks.length }, { label: "Hours", val: totalHours }].map(s => (
                  <div key={s.label} style={{ background: "#1a1d27", borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: "#4a5568" }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 12, color: "#64748b" }}>₹{eng.rate}/day</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => { setEditing(eng); setShowForm(true); }}>Edit</button>
                  <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => { setEngineers(engineers.map(e => e.id === eng.id ? { ...e, active: !e.active } : e)); }}>
                    {eng.active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="modal-bg">
          <div className="modal">
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>{editing ? "Edit Engineer" : "Add Engineer"}</div>
            <EngineerForm engineer={editing} onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null); }} />
          </div>
        </div>
      )}
    </div>
  );
}

function EngineerForm({ engineer, onSave, onClose }) {
  const [d, setD] = useState(engineer || { name: "", role: "", location: "office", rate: "" });
  const set = (k, v) => setD(p => ({ ...p, [k]: v }));
  const ROLES = ["BIM Manager", "Senior Architect", "BIM Coordinator", "Interior Designer", "Revit Modeller", "QS Estimator", "Drafting Engineer", "4D Planner"];
  return (
    <>
      <div className="form-row"><label>Full Name</label><input value={d.name} onChange={e => set("name", e.target.value)} /></div>
      <div className="form-grid">
        <div className="form-row"><label>Role</label><select value={d.role} onChange={e => set("role", e.target.value)}><option value="">Select role</option>{ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
        <div className="form-row"><label>Location</label><select value={d.location} onChange={e => set("location", e.target.value)}><option value="office">Office</option><option value="remote">Remote</option></select></div>
        <div className="form-row"><label>Day Rate (₹)</label><input type="number" value={d.rate} onChange={e => set("rate", Number(e.target.value))} /></div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary" onClick={() => onSave(d)}>Save</button>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      </div>
    </>
  );
}

// ─── Projects ────────────────────────────────────────────────────────────────
function Projects({ projects, tasks, engineers, setProjects, showToast }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const handleSave = (d) => {
    if (editing) {
      setProjects(projects.map(p => p.id === editing.id ? { ...editing, ...d } : p));
      showToast("Project updated");
    } else {
      setProjects([...projects, { id: "p" + uid(), ...d }]);
      showToast("Project created");
    }
    setShowForm(false); setEditing(null);
  };

  return (
    <div>
      <PageHeader title="Projects" sub={`${projects.length} projects`} action={<button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>+ New Project</button>} />
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>Project</th><th>Client</th><th>Region</th><th>Budget</th><th>Cost to Date</th><th>Tasks</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {projects.map(p => {
              const ptasks = tasks.filter(t => t.projectId === p.id);
              const done = ptasks.filter(t => t.status === "completed").length;
              const cost = ptasks.reduce((s, t) => {
                const eng = engineers.find(e => e.id === t.assignee);
                return s + (eng ? t.loggedHours * (eng.rate / 8) : 0);
              }, 0);
              return (
                <tr key={p.id}>
                  <td><div style={{ fontWeight: 500 }}>{p.name}</div><div style={{ fontSize: 11, color: "#4a5568" }}>{p.startDate} → {p.endDate}</div></td>
                  <td style={{ color: "#94a3b8" }}>{p.client}</td>
                  <td><span className="tag" style={{ background: p.region === "UAE" ? "#0ea5e922" : "#8b5cf622", color: p.region === "UAE" ? "#0ea5e9" : "#8b5cf6" }}>{p.region}</span></td>
                  <td style={{ fontFamily: "DM Mono, monospace", fontSize: 12 }}>{fmt(p.budget)}</td>
                  <td>
                    <div style={{ fontFamily: "DM Mono, monospace", fontSize: 12 }}>{fmt(cost)}</div>
                    <div style={{ fontSize: 10, color: pct(cost, p.budget) > 80 ? "#ef4444" : "#64748b" }}>{pct(cost, p.budget)}% used</div>
                  </td>
                  <td><div>{done}/{ptasks.length} done</div><div className="progress-bar" style={{ marginTop: 4 }}><div className="progress-fill" style={{ width: `${pct(done, ptasks.length)}%`, background: "#6366f1" }} /></div></td>
                  <td>
                    <select value={p.status} onChange={e => setProjects(projects.map(x => x.id === p.id ? { ...x, status: e.target.value } : x))} style={{ width: "auto", fontSize: 12, color: p.status === "active" ? "#10b981" : p.status === "completed" ? "#64748b" : "#f59e0b" }}>
                      {["active", "on-hold", "completed"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td><button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => { setEditing(p); setShowForm(true); }}>Edit</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-bg">
          <div className="modal">
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>{editing ? "Edit Project" : "New Project"}</div>
            <ProjectForm project={editing} onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null); }} />
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectForm({ project, onSave, onClose }) {
  const [d, setD] = useState(project || { name: "", client: "", region: "UAE", status: "active", budget: "", startDate: "", endDate: "" });
  const set = (k, v) => setD(p => ({ ...p, [k]: v }));
  return (
    <>
      <div className="form-row"><label>Project Name</label><input value={d.name} onChange={e => set("name", e.target.value)} /></div>
      <div className="form-grid">
        <div className="form-row"><label>Client</label><input value={d.client} onChange={e => set("client", e.target.value)} /></div>
        <div className="form-row"><label>Region</label><select value={d.region} onChange={e => set("region", e.target.value)}><option value="UAE">UAE</option><option value="KSA">KSA</option><option value="India">India</option></select></div>
        <div className="form-row"><label>Budget (₹)</label><input type="number" value={d.budget} onChange={e => set("budget", Number(e.target.value))} /></div>
        <div className="form-row"><label>Status</label><select value={d.status} onChange={e => set("status", e.target.value)}><option value="active">Active</option><option value="on-hold">On Hold</option><option value="completed">Completed</option></select></div>
        <div className="form-row"><label>Start Date</label><input type="date" value={d.startDate} onChange={e => set("startDate", e.target.value)} /></div>
        <div className="form-row"><label>End Date</label><input type="date" value={d.endDate} onChange={e => set("endDate", e.target.value)} /></div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary" onClick={() => onSave(d)}>Save</button>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      </div>
    </>
  );
}

// ─── Allocation ───────────────────────────────────────────────────────────────
function Allocation({ engineers, tasks, projects }) {
  const activeEngineers = engineers.filter(e => e.active);

  const getEngineerLoad = (eng) => {
    const myTasks = tasks.filter(t => t.assignee === eng.id && t.status === "in-progress");
    const totalEstimated = myTasks.reduce((s, t) => s + t.estimatedHours, 0);
    const totalLogged = myTasks.reduce((s, t) => s + t.loggedHours, 0);
    const remaining = myTasks.reduce((s, t) => s + Math.max(0, t.estimatedHours - t.loggedHours), 0);
    return { myTasks, totalEstimated, totalLogged, remaining, loadPct: Math.min(Math.round((remaining / 160) * 100), 100) };
  };

  return (
    <div>
      <PageHeader title="Work Allocation" sub="Engineer load overview" />

      {/* Load grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, marginBottom: 24 }}>
        {activeEngineers.map(eng => {
          const { myTasks, remaining, loadPct } = getEngineerLoad(eng);
          const loadColor = loadPct > 80 ? "#ef4444" : loadPct > 50 ? "#f59e0b" : "#10b981";
          return (
            <div key={eng.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{eng.name}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{eng.role}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: loadColor }}>{loadPct}%</div>
                  <div style={{ fontSize: 10, color: "#4a5568" }}>load</div>
                </div>
              </div>
              <div className="progress-bar" style={{ marginBottom: 10 }}>
                <div className="progress-fill" style={{ width: `${loadPct}%`, background: loadColor }} />
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>{remaining}h remaining · {myTasks.length} active tasks</div>
              {myTasks.slice(0, 3).map(t => {
                const proj = projects.find(p => p.id === t.projectId);
                return (
                  <div key={t.id} style={{ background: "#1a1d27", borderRadius: 6, padding: "6px 10px", marginBottom: 4, fontSize: 12 }}>
                    <div style={{ color: "#e2e8f0" }}>{t.title}</div>
                    <div style={{ color: "#4a5568", fontSize: 11 }}>{proj?.name?.split(" ").slice(0, 3).join(" ")}</div>
                  </div>
                );
              })}
              {myTasks.length > 3 && <div style={{ fontSize: 11, color: "#4a5568", marginTop: 4 }}>+{myTasks.length - 3} more tasks</div>}
            </div>
          );
        })}
      </div>

      {/* Allocation table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e2133", fontSize: 13, fontWeight: 600 }}>Detailed Allocation</div>
        <table>
          <thead><tr><th>Engineer</th><th>Location</th><th>Role</th><th>Active Tasks</th><th>Est. Hours</th><th>Logged Hours</th><th>Remaining</th><th>Load</th></tr></thead>
          <tbody>
            {activeEngineers.map(eng => {
              const { myTasks, totalEstimated, totalLogged, remaining, loadPct } = getEngineerLoad(eng);
              const loadColor = loadPct > 80 ? "#ef4444" : loadPct > 50 ? "#f59e0b" : "#10b981";
              return (
                <tr key={eng.id}>
                  <td style={{ fontWeight: 500 }}>{eng.name}</td>
                  <td><span className="tag" style={{ background: eng.location === "remote" ? "#f59e0b22" : "#10b98122", color: eng.location === "remote" ? "#f59e0b" : "#10b981" }}>{eng.location}</span></td>
                  <td style={{ color: "#94a3b8", fontSize: 12 }}>{eng.role}</td>
                  <td>{myTasks.length}</td>
                  <td style={{ fontFamily: "DM Mono", fontSize: 12 }}>{totalEstimated}h</td>
                  <td style={{ fontFamily: "DM Mono", fontSize: 12 }}>{totalLogged}h</td>
                  <td style={{ fontFamily: "DM Mono", fontSize: 12, color: remaining > 0 ? "#e2e8f0" : "#10b981" }}>{remaining}h</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="progress-bar" style={{ width: 80 }}><div className="progress-fill" style={{ width: `${loadPct}%`, background: loadColor }} /></div>
                      <span style={{ fontSize: 12, color: loadColor }}>{loadPct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Productivity ─────────────────────────────────────────────────────────────
function Productivity({ productivity, tasks, engineers, setProductivity, showToast }) {
  const [editing, setEditing] = useState(null);

  const getEngineerProductivity = (eng) => {
    const myTasks = tasks.filter(t => t.assignee === eng.id && t.status === "completed");
    const totalHours = myTasks.reduce((s, t) => s + t.loggedHours, 0);
    const totalDays = totalHours / 8;
    return { tasks: myTasks.length, hours: totalHours, days: totalDays.toFixed(1), cost: eng.rate * totalDays };
  };

  return (
    <div>
      <PageHeader title="Productivity & Cost" sub="Rates and performance tracking" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Productivity rates */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Agreed Productivity Rates</div>
          {Object.entries(productivity).map(([discipline, data]) => (
            <div key={discipline} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1a1d27" }}>
              {editing === discipline ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
                  <span style={{ width: 100, fontSize: 13, color: "#818cf8" }}>{discipline}</span>
                  <input type="number" defaultValue={data.rate} id={`rate-${discipline}`} style={{ width: 80 }} />
                  <input defaultValue={data.unit} id={`unit-${discipline}`} style={{ flex: 1 }} />
                  <button className="btn btn-primary" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => {
                    const rate = Number(document.getElementById(`rate-${discipline}`).value);
                    const unit = document.getElementById(`unit-${discipline}`).value;
                    setProductivity({ ...productivity, [discipline]: { rate, unit } });
                    setEditing(null); showToast("Rate updated");
                  }}>Save</button>
                </div>
              ) : (
                <>
                  <span className="tag" style={{ background: "#1e2133", color: "#818cf8", marginRight: 10 }}>{discipline}</span>
                  <span style={{ flex: 1, fontSize: 13, color: "#94a3b8" }}>{data.rate} {data.unit}</span>
                  <button className="btn btn-ghost" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => setEditing(discipline)}>Edit</button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Engineer cost summary */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Engineer Cost Summary</div>
          <table>
            <thead><tr><th>Engineer</th><th>Tasks Done</th><th>Days</th><th>Cost</th></tr></thead>
            <tbody>
              {engineers.filter(e => e.active).map(eng => {
                const { tasks: t, days, cost } = getEngineerProductivity(eng);
                return (
                  <tr key={eng.id}>
                    <td>{eng.name}</td>
                    <td>{t}</td>
                    <td style={{ fontFamily: "DM Mono", fontSize: 12 }}>{days}d</td>
                    <td style={{ fontFamily: "DM Mono", fontSize: 12 }}>{fmt(cost)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-project cost */}
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Cost per Project</div>
        <table>
          <thead><tr><th>Project</th><th>Region</th><th>Budget</th><th>Cost to Date</th><th>Remaining</th><th>Burn Rate</th></tr></thead>
          <tbody>
            {[...tasks].reduce((acc, t) => {
              const eng = engineers.find(e => e.id === t.assignee);
              if (!eng) return acc;
              const cost = t.loggedHours * (eng.rate / 8);
              acc[t.projectId] = (acc[t.projectId] || 0) + cost;
              return acc;
            }, {}) && null}
            {Object.entries(
              tasks.reduce((acc, t) => {
                const eng = engineers.find(e => e.id === t.assignee);
                if (!eng) return acc;
                const cost = t.loggedHours * (eng.rate / 8);
                acc[t.projectId] = (acc[t.projectId] || 0) + cost;
                return acc;
              }, {})
            ).map(([projectId, cost]) => {
              const proj = projects.find ? null : null;
              return null;
            })}
            {(() => {
              const costMap = tasks.reduce((acc, t) => {
                const eng = engineers.find(e => e.id === t.assignee);
                if (!eng) return acc;
                const cost = t.loggedHours * (eng.rate / 8);
                acc[t.projectId] = (acc[t.projectId] || 0) + cost;
                return acc;
              }, {});
              return Object.entries(costMap).map(([pid, cost]) => {
                const p = { id: pid, name: pid, budget: 0, region: "—" };
                return (
                  <tr key={pid}>
                    <td style={{ fontWeight: 500 }}>{pid}</td>
                    <td>—</td>
                    <td style={{ fontFamily: "DM Mono", fontSize: 12 }}>—</td>
                    <td style={{ fontFamily: "DM Mono", fontSize: 12 }}>{fmt(cost)}</td>
                    <td>—</td>
                    <td>—</td>
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Reports ──────────────────────────────────────────────────────────────────
function Reports({ engineers, projects, tasks, attendance = [], leaves = [] }) {
  const [period, setPeriod] = useState("weekly");
  const [aiSummary, setAiSummary] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  const now = new Date();
  const getDateFilter = () => {
    if (period === "weekly") { const d = new Date(now); d.setDate(d.getDate() - 7); return d; }
    if (period === "monthly") { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d; }
    const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d;
  };

  const cutoff = getDateFilter();
  const recentTasks = tasks.filter(t => new Date(t.createdAt || "2025-01-01") >= cutoff);

  const totalHours = tasks.reduce((s, t) => s + t.loggedHours, 0);
  const totalCost = tasks.reduce((s, t) => {
    const eng = engineers.find(e => e.id === t.assignee);
    return s + (eng ? t.loggedHours * (eng.rate / 8) : 0);
  }, 0);
  const completedCount = tasks.filter(t => t.status === "completed").length;
  const activeCount = tasks.filter(t => t.status === "in-progress").length;

  const generateAISummary = async () => {
    setLoadingAI(true);
    const statsPayload = {
      period,
      activeProjects: projects.filter(p => p.status === "active").length,
      totalEngineers: engineers.filter(e => e.active).length,
      tasksCompleted: completedCount,
      tasksInProgress: activeCount,
      totalHoursLogged: totalHours,
      totalCostToDate: Math.round(totalCost),
      projectBreakdown: projects.map(p => ({
        name: p.name,
        region: p.region,
        budget: p.budget,
        status: p.status,
        tasksCompleted: tasks.filter(t => t.projectId === p.id && t.status === "completed").length,
        totalTasks: tasks.filter(t => t.projectId === p.id).length,
      })),
      topEngineers: engineers.filter(e => e.active).map(e => ({
        name: e.name,
        role: e.role,
        hoursLogged: tasks.filter(t => t.assignee === e.id).reduce((s, t) => s + t.loggedHours, 0),
      })).sort((a, b) => b.hoursLogged - a.hoursLogged).slice(0, 5),
    };

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "You are a studio management AI for Iksana, an interior architecture BIM studio in India serving UAE and KSA clients. Write concise, professional management summaries. Use bullet points. Be direct about risks and highlights. Use INR for currency.",
          messages: [{ role: "user", content: `Generate a ${period} management summary for Iksana studio based on this data: ${JSON.stringify(statsPayload)}. Include: overall status, project highlights, team performance, financial summary, and 2-3 recommended actions.` }],
        }),
      });
      const data = await resp.json();
      setAiSummary(data.content?.[0]?.text || "Unable to generate summary.");
    } catch (e) {
      setAiSummary("Error generating summary. Please try again.");
    }
    setLoadingAI(false);
  };

  return (
    <div>
      <PageHeader title="Reports" sub="Studio performance overview" />

      {/* Period selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {["weekly", "monthly", "yearly"].map(p => (
          <button key={p} className={`btn ${period === p ? "btn-primary" : "btn-ghost"}`} onClick={() => setPeriod(p)} style={{ textTransform: "capitalize" }}>{p}</button>
        ))}
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Hours Logged", value: totalHours + "h", accent: "#6366f1" },
          { label: "Tasks Completed", value: completedCount, accent: "#10b981" },
          { label: "Tasks Active", value: activeCount, accent: "#f59e0b" },
          { label: "Total Cost", value: `₹${(totalCost / 100000).toFixed(1)}L`, accent: "#ec4899" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.accent }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* By-project summary */}
      <div className="card" style={{ marginBottom: 20, padding: 0 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e2133", fontSize: 13, fontWeight: 600 }}>Project Summary</div>
        <table>
          <thead><tr><th>Project</th><th>Region</th><th>Tasks Done</th><th>Progress</th><th>Cost (₹)</th><th>Budget (₹)</th><th>Budget Used</th></tr></thead>
          <tbody>
            {projects.map(p => {
              const ptasks = tasks.filter(t => t.projectId === p.id);
              const done = ptasks.filter(t => t.status === "completed").length;
              const cost = ptasks.reduce((s, t) => { const eng = engineers.find(e => e.id === t.assignee); return s + (eng ? t.loggedHours * (eng.rate / 8) : 0); }, 0);
              const budgetPct = pct(cost, p.budget);
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td><span className="tag" style={{ background: p.region === "UAE" ? "#0ea5e922" : "#8b5cf622", color: p.region === "UAE" ? "#0ea5e9" : "#8b5cf6" }}>{p.region}</span></td>
                  <td>{done}/{ptasks.length}</td>
                  <td style={{ width: 120 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div className="progress-bar" style={{ flex: 1 }}><div className="progress-fill" style={{ width: `${pct(done, ptasks.length)}%`, background: "#6366f1" }} /></div>
                      <span style={{ fontSize: 11, width: 28 }}>{pct(done, ptasks.length)}%</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: "DM Mono", fontSize: 12 }}>{fmt(cost)}</td>
                  <td style={{ fontFamily: "DM Mono", fontSize: 12 }}>{fmt(p.budget)}</td>
                  <td><span style={{ color: budgetPct > 80 ? "#ef4444" : "#10b981", fontFamily: "DM Mono", fontSize: 12 }}>{budgetPct}%</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* AI Summary */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>AI Management Summary</div>
            <div style={{ fontSize: 11, color: "#4a5568", marginTop: 2 }}>Powered by Claude · {period} view</div>
          </div>
          <button className="btn btn-primary" onClick={generateAISummary} disabled={loadingAI}>
            {loadingAI ? "Generating…" : "Generate Summary"}
          </button>
        </div>
        {aiSummary ? (
          <div style={{ background: "#1a1d27", borderRadius: 10, padding: 20, fontSize: 13, lineHeight: 1.7, color: "#cbd5e1", whiteSpace: "pre-wrap" }}>
            {aiSummary}
          </div>
        ) : (
          <div style={{ background: "#1a1d27", borderRadius: 10, padding: 20, textAlign: "center", color: "#374151", fontSize: 13 }}>
            Click "Generate Summary" to get an AI-powered {period} report for your studio
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Attendance ───────────────────────────────────────────────────────────────
function Attendance({ engineers, attendance, leaves, setAttendance, setLeaves, showToast }) {
  const [view, setView] = useState("today"); // today | monthly | leaves
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [selectedMonth, setSelectedMonth] = useState(TODAY.slice(0, 7));
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);

  const activeEng = engineers.filter(e => e.active);

  // ── Today's attendance helpers ──
  const getRecord = (engId, date) => attendance.find(a => a.engineerId === engId && a.date === date);

  const checkIn = (engId) => {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    const existing = getRecord(engId, selectedDate);
    if (existing) {
      setAttendance(attendance.map(a => a.id === existing.id ? { ...a, checkIn: timeStr, type: "present" } : a));
    } else {
      setAttendance([...attendance, { id: `a-${engId}-${uid()}`, engineerId: engId, date: selectedDate, checkIn: timeStr, checkOut: null, type: "present", notes: "" }]);
    }
    showToast("Checked in");
  };

  const checkOut = (engId) => {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    const existing = getRecord(engId, selectedDate);
    if (existing) {
      setAttendance(attendance.map(a => a.id === existing.id ? { ...a, checkOut: timeStr } : a));
      showToast("Checked out");
    }
  };

  const markAbsent = (engId) => {
    const existing = getRecord(engId, selectedDate);
    if (existing) {
      setAttendance(attendance.map(a => a.id === existing.id ? { ...a, type: "absent", checkIn: null, checkOut: null } : a));
    } else {
      setAttendance([...attendance, { id: `a-${engId}-${uid()}`, engineerId: engId, date: selectedDate, checkIn: null, checkOut: null, type: "absent", notes: "" }]);
    }
    showToast("Marked absent");
  };

  const calcHours = (rec) => {
    if (!rec?.checkIn || !rec?.checkOut) return 0;
    const [ih, im] = rec.checkIn.split(":").map(Number);
    const [oh, om] = rec.checkOut.split(":").map(Number);
    return ((oh * 60 + om) - (ih * 60 + im)) / 60;
  };

  // ── Monthly summary ──
  const getMonthlyData = (engId) => {
    const records = attendance.filter(a => a.engineerId === engId && a.date.startsWith(selectedMonth));
    const present = records.filter(a => a.type === "present").length;
    const absent = records.filter(a => a.type === "absent").length;
    const totalHours = records.reduce((s, a) => s + calcHours(a), 0);
    const engLeaves = leaves.filter(l => l.engineerId === engId && (l.startDate.startsWith(selectedMonth) || l.endDate.startsWith(selectedMonth)) && l.status === "approved");
    const leaveCount = engLeaves.reduce((s, l) => {
      const start = new Date(l.startDate), end = new Date(l.endDate);
      return s + Math.ceil((end - start) / 86400000) + 1;
    }, 0);
    return { present, absent, leaveCount, totalHours: totalHours.toFixed(1) };
  };

  // ── Leave management ──
  const handleLeafSave = (d) => {
    if (editingLeave) {
      setLeaves(leaves.map(l => l.id === editingLeave.id ? { ...editingLeave, ...d } : l));
      showToast("Leave updated");
    } else {
      setLeaves([...leaves, { id: "l" + uid(), ...d, status: "pending" }]);
      showToast("Leave request added");
    }
    setShowLeaveForm(false); setEditingLeave(null);
  };

  const toggleLeaveStatus = (id) => {
    setLeaves(leaves.map(l => l.id === id ? { ...l, status: l.status === "approved" ? "rejected" : "approved" } : l));
  };

  const todayPresent = activeEng.filter(e => getRecord(e.id, selectedDate)?.type === "present").length;
  const todayAbsent = activeEng.filter(e => getRecord(e.id, selectedDate)?.type === "absent").length;
  const todayUnmarked = activeEng.length - todayPresent - todayAbsent;

  return (
    <div>
      <PageHeader title="Attendance & Leave" sub="Daily check-in, timesheets and leave management" />

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[["today", "Daily Attendance"], ["monthly", "Monthly Summary"], ["leaves", "Leave Management"]].map(([id, label]) => (
          <button key={id} className={`btn ${view === id ? "btn-primary" : "btn-ghost"}`} onClick={() => setView(id)}>{label}</button>
        ))}
      </div>

      {/* ── TODAY ── */}
      {view === "today" && (
        <div>
          {/* Date picker + stats */}
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 20 }}>
            <div style={{ flex: "0 0 200px" }}>
              <label>Select Date</label>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 12, flex: 1 }}>
              {[
                { label: "Present", value: todayPresent, color: "#10b981" },
                { label: "Absent", value: todayAbsent, color: "#ef4444" },
                { label: "Unmarked", value: todayUnmarked, color: "#64748b" },
                { label: "Total", value: activeEng.length, color: "#6366f1" },
              ].map(s => (
                <div key={s.label} className="stat-card" style={{ flex: 1, padding: "14px 16px" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance table */}
          <div className="card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Engineer</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeEng.map(eng => {
                  const rec = getRecord(eng.id, selectedDate);
                  const hours = calcHours(rec);
                  const isOnLeave = leaves.some(l => l.engineerId === eng.id && l.status === "approved" && selectedDate >= l.startDate && selectedDate <= l.endDate);
                  const statusColor = isOnLeave ? "#f59e0b" : rec?.type === "present" ? "#10b981" : rec?.type === "absent" ? "#ef4444" : "#64748b";
                  const statusLabel = isOnLeave ? "on leave" : rec?.type || "unmarked";
                  return (
                    <tr key={eng.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{eng.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{eng.role}</div>
                      </td>
                      <td>
                        <span className="tag" style={{ background: eng.location === "remote" ? "#f59e0b22" : "#10b98122", color: eng.location === "remote" ? "#f59e0b" : "#10b981" }}>
                          {eng.location}
                        </span>
                      </td>
                      <td>
                        <span className="tag" style={{ background: `${statusColor}22`, color: statusColor, textTransform: "capitalize" }}>
                          {statusLabel}
                        </span>
                      </td>
                      <td style={{ fontFamily: "DM Mono", fontSize: 13, color: "#94a3b8" }}>
                        {rec?.checkIn ? (
                          <input type="time" value={rec.checkIn} onChange={e => setAttendance(attendance.map(a => a.id === rec.id ? { ...a, checkIn: e.target.value } : a))} style={{ width: 100, padding: "4px 8px" }} />
                        ) : "—"}
                      </td>
                      <td style={{ fontFamily: "DM Mono", fontSize: 13, color: "#94a3b8" }}>
                        {rec?.checkOut ? (
                          <input type="time" value={rec.checkOut} onChange={e => setAttendance(attendance.map(a => a.id === rec.id ? { ...a, checkOut: e.target.value } : a))} style={{ width: 100, padding: "4px 8px" }} />
                        ) : rec?.checkIn ? <span style={{ color: "#f59e0b" }}>In office</span> : "—"}
                      </td>
                      <td style={{ fontFamily: "DM Mono", fontSize: 13, color: hours >= 8 ? "#10b981" : hours > 0 ? "#f59e0b" : "#64748b" }}>
                        {hours > 0 ? `${hours.toFixed(1)}h` : "—"}
                      </td>
                      <td>
                        {!isOnLeave && (
                          <div style={{ display: "flex", gap: 4 }}>
                            {!rec?.checkIn && <button className="btn btn-primary" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => checkIn(eng.id)}>Check In</button>}
                            {rec?.checkIn && !rec?.checkOut && <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => checkOut(eng.id)}>Check Out</button>}
                            {rec?.type !== "absent" && <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 11, color: "#ef4444" }} onClick={() => markAbsent(eng.id)}>Absent</button>}
                          </div>
                        )}
                        {isOnLeave && <span style={{ fontSize: 12, color: "#f59e0b" }}>On approved leave</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MONTHLY ── */}
      {view === "monthly" && (
        <div>
          <div style={{ marginBottom: 20, maxWidth: 200 }}>
            <label>Select Month</label>
            <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
          </div>
          <div className="card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Engineer</th>
                  <th>Role</th>
                  <th>Location</th>
                  <th>Present Days</th>
                  <th>Absent Days</th>
                  <th>Leave Days</th>
                  <th>Total Hours</th>
                  <th>Attendance %</th>
                  <th>Est. Cost (₹)</th>
                </tr>
              </thead>
              <tbody>
                {activeEng.map(eng => {
                  const { present, absent, leaveCount, totalHours } = getMonthlyData(eng.id);
                  const workingDays = present + absent + leaveCount || 1;
                  const attPct = Math.round((present / workingDays) * 100);
                  const cost = present * eng.rate;
                  return (
                    <tr key={eng.id}>
                      <td style={{ fontWeight: 500 }}>{eng.name}</td>
                      <td style={{ fontSize: 12, color: "#64748b" }}>{eng.role}</td>
                      <td><span className="tag" style={{ background: eng.location === "remote" ? "#f59e0b22" : "#10b98122", color: eng.location === "remote" ? "#f59e0b" : "#10b981" }}>{eng.location}</span></td>
                      <td style={{ color: "#10b981", fontWeight: 600 }}>{present}</td>
                      <td style={{ color: absent > 3 ? "#ef4444" : "#94a3b8" }}>{absent}</td>
                      <td style={{ color: "#f59e0b" }}>{leaveCount}</td>
                      <td style={{ fontFamily: "DM Mono", fontSize: 12 }}>{totalHours}h</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="progress-bar" style={{ width: 60 }}>
                            <div className="progress-fill" style={{ width: `${attPct}%`, background: attPct >= 90 ? "#10b981" : attPct >= 75 ? "#f59e0b" : "#ef4444" }} />
                          </div>
                          <span style={{ fontSize: 12, color: attPct >= 90 ? "#10b981" : attPct >= 75 ? "#f59e0b" : "#ef4444" }}>{attPct}%</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: "DM Mono", fontSize: 12 }}>{fmt(cost)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── LEAVES ── */}
      {view === "leaves" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => { setEditingLeave(null); setShowLeaveForm(true); }}>+ Apply Leave</button>
          </div>

          {/* Leave balance summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginBottom: 24 }}>
            {LEAVE_TYPES.map(type => {
              const count = leaves.filter(l => l.type === type && l.status === "approved").length;
              return (
                <div key={type} className="stat-card" style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 12, color: "#64748b", textTransform: "capitalize", fontWeight: 600 }}>{type} Leave</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: LEAVE_COLORS[type] }}>{count}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "#374151", marginTop: 4 }}>approved requests</div>
                </div>
              );
            })}
          </div>

          {/* Leave requests table */}
          <div className="card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr><th>Engineer</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {[...leaves].sort((a, b) => b.startDate.localeCompare(a.startDate)).map(l => {
                  const eng = engineers.find(e => e.id === l.engineerId);
                  const days = Math.ceil((new Date(l.endDate) - new Date(l.startDate)) / 86400000) + 1;
                  return (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 500 }}>{eng?.name}</td>
                      <td><span className="tag" style={{ background: `${LEAVE_COLORS[l.type]}22`, color: LEAVE_COLORS[l.type], textTransform: "capitalize" }}>{l.type}</span></td>
                      <td style={{ fontSize: 12, color: "#94a3b8" }}>{l.startDate}</td>
                      <td style={{ fontSize: 12, color: "#94a3b8" }}>{l.endDate}</td>
                      <td style={{ fontWeight: 600 }}>{days}d</td>
                      <td style={{ fontSize: 12, color: "#64748b", maxWidth: 180 }}>{l.reason}</td>
                      <td>
                        <span className="tag" style={{ background: l.status === "approved" ? "#10b98122" : l.status === "rejected" ? "#ef444422" : "#f59e0b22", color: l.status === "approved" ? "#10b981" : l.status === "rejected" ? "#ef4444" : "#f59e0b", textTransform: "capitalize" }}>
                          {l.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="btn btn-ghost" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => toggleLeaveStatus(l.id)}>
                            {l.status === "approved" ? "Reject" : "Approve"}
                          </button>
                          <button className="btn btn-ghost" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => { setEditingLeave(l); setShowLeaveForm(true); }}>Edit</button>
                          <button className="btn btn-danger" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => { setLeaves(leaves.filter(x => x.id !== l.id)); showToast("Leave deleted", "error"); }}>✕</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {leaves.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: "center", color: "#374151", padding: 32 }}>No leave requests yet</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Leave form modal */}
          {showLeaveForm && (
            <div className="modal-bg">
              <div className="modal">
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>{editingLeave ? "Edit Leave" : "Apply Leave"}</div>
                <LeaveForm leave={editingLeave} engineers={engineers.filter(e => e.active)} onSave={handleLeafSave} onClose={() => { setShowLeaveForm(false); setEditingLeave(null); }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LeaveForm({ leave, engineers, onSave, onClose }) {
  const [d, setD] = useState(leave || { engineerId: "", type: "casual", startDate: "", endDate: "", reason: "" });
  const set = (k, v) => setD(p => ({ ...p, [k]: v }));
  return (
    <>
      <div className="form-row">
        <label>Engineer</label>
        <select value={d.engineerId} onChange={e => set("engineerId", e.target.value)}>
          <option value="">Select engineer</option>
          {engineers.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>
      <div className="form-row">
        <label>Leave Type</label>
        <select value={d.type} onChange={e => set("type", e.target.value)}>
          {LEAVE_TYPES.map(t => <option key={t} value={t} style={{ textTransform: "capitalize" }}>{t}</option>)}
        </select>
      </div>
      <div className="form-grid">
        <div className="form-row"><label>From Date</label><input type="date" value={d.startDate} onChange={e => set("startDate", e.target.value)} /></div>
        <div className="form-row"><label>To Date</label><input type="date" value={d.endDate} onChange={e => set("endDate", e.target.value)} /></div>
      </div>
      <div className="form-row"><label>Reason</label><textarea rows={3} value={d.reason} onChange={e => set("reason", e.target.value)} /></div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary" onClick={() => onSave(d)}>Save</button>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      </div>
    </>
  );
}

// ─── Alert Engine ─────────────────────────────────────────────────────────────
function computeAlerts(tasks, projects, engineers, leaves, dismissed = []) {
  const alerts = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Task alerts ──
  tasks.forEach(t => {
    if (t.status === "completed") return;
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((due - today) / 86400000);
    const eng = engineers.find(e => e.id === t.assignee);
    const proj = projects.find(p => p.id === t.projectId);
    const label = `${t.title} · ${proj?.name?.split(" ").slice(0, 3).join(" ") || ""}`;

    if (daysLeft < 0) {
      alerts.push({ id: `overdue-${t.id}`, severity: "critical", category: "deadline", icon: "⚠", title: "Task Overdue", body: `"${label}" is ${Math.abs(daysLeft)} day(s) overdue.`, assignee: eng?.name, link: "tasks", ts: t.dueDate });
    } else if (daysLeft <= 3) {
      alerts.push({ id: `due-soon-${t.id}`, severity: "warning", category: "deadline", icon: "◔", title: "Due in 3 Days", body: `"${label}" is due on ${t.dueDate}.`, assignee: eng?.name, link: "tasks", ts: t.dueDate });
    } else if (daysLeft <= 7) {
      alerts.push({ id: `due-week-${t.id}`, severity: "info", category: "deadline", icon: "◑", title: "Due This Week", body: `"${label}" is due on ${t.dueDate}.`, assignee: eng?.name, link: "tasks", ts: t.dueDate });
    }

    // Overrun hours
    if (t.loggedHours > t.estimatedHours * 1.1) {
      alerts.push({ id: `overrun-${t.id}`, severity: "warning", category: "budget", icon: "◈", title: "Hours Overrun", body: `"${t.title}" has logged ${t.loggedHours}h vs ${t.estimatedHours}h estimated (${Math.round((t.loggedHours / t.estimatedHours) * 100)}%).`, assignee: eng?.name, link: "tasks", ts: today.toISOString().slice(0, 10) });
    }
  });

  // ── Project budget alerts ──
  projects.forEach(p => {
    if (p.status !== "active") return;
    const ptasks = tasks.filter(t => t.projectId === p.id);
    const cost = ptasks.reduce((s, t) => {
      const eng = engineers.find(e => e.id === t.assignee);
      return s + (eng ? t.loggedHours * (eng.rate / 8) : 0);
    }, 0);
    const burnPct = p.budget > 0 ? (cost / p.budget) * 100 : 0;

    if (burnPct >= 90) {
      alerts.push({ id: `budget-critical-${p.id}`, severity: "critical", category: "budget", icon: "◉", title: "Budget Critical", body: `"${p.name}" has used ${burnPct.toFixed(0)}% of its budget (₹${Math.round(cost).toLocaleString("en-IN")} of ₹${p.budget.toLocaleString("en-IN")}).`, link: "projects", ts: today.toISOString().slice(0, 10) });
    } else if (burnPct >= 75) {
      alerts.push({ id: `budget-warn-${p.id}`, severity: "warning", category: "budget", icon: "◎", title: "Budget Warning", body: `"${p.name}" has used ${burnPct.toFixed(0)}% of its budget.`, link: "projects", ts: today.toISOString().slice(0, 10) });
    }

    // Project end date approaching
    const end = new Date(p.endDate);
    const daysToEnd = Math.ceil((end - today) / 86400000);
    if (daysToEnd >= 0 && daysToEnd <= 14) {
      alerts.push({ id: `proj-end-${p.id}`, severity: daysToEnd <= 7 ? "critical" : "warning", category: "deadline", icon: "◫", title: "Project Deadline Approaching", body: `"${p.name}" ends on ${p.endDate} — ${daysToEnd} day(s) remaining.`, link: "projects", ts: p.endDate });
    }
  });

  // ── Engineer workload alerts ──
  engineers.filter(e => e.active).forEach(eng => {
    const myTasks = tasks.filter(t => t.assignee === eng.id && t.status === "in-progress");
    const remaining = myTasks.reduce((s, t) => s + Math.max(0, t.estimatedHours - t.loggedHours), 0);
    const loadPct = Math.round((remaining / 160) * 100);
    if (loadPct > 90) {
      alerts.push({ id: `overload-${eng.id}`, severity: "warning", category: "workload", icon: "◐", title: "Engineer Overloaded", body: `${eng.name} is at ${loadPct}% capacity with ${remaining}h of remaining work.`, link: "allocation", ts: today.toISOString().slice(0, 10) });
    }
    if (myTasks.length === 0) {
      alerts.push({ id: `idle-${eng.id}`, severity: "info", category: "workload", icon: "◑", title: "Engineer Unassigned", body: `${eng.name} (${eng.role}) has no active tasks assigned.`, link: "allocation", ts: today.toISOString().slice(0, 10) });
    }
  });

  // ── Leave alerts ──
  leaves.filter(l => l.status === "pending").forEach(l => {
    const eng = engineers.find(e => e.id === l.engineerId);
    alerts.push({ id: `leave-pending-${l.id}`, severity: "info", category: "leave", icon: "◷", title: "Leave Pending Approval", body: `${eng?.name} has a ${l.type} leave request from ${l.startDate} to ${l.endDate} awaiting approval.`, link: "attendance", ts: l.startDate });
  });

  // Filter dismissed
  return alerts.filter(a => !dismissed.includes(a.id)).sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────
function Notifications({ tasks, projects, engineers, leaves, dismissed, setDismissed, setTab }) {
  const [filter, setFilter] = useState("all");
  const [showDismissed, setShowDismissed] = useState(false);
  const allAlerts = computeAlerts(tasks, projects, engineers, leaves, []);
  const activeAlerts = allAlerts.filter(a => !dismissed.includes(a.id));
  const dismissedAlerts = allAlerts.filter(a => dismissed.includes(a.id));

  const filtered = (showDismissed ? dismissedAlerts : activeAlerts).filter(a => filter === "all" || a.category === filter || a.severity === filter);

  const dismiss = (id) => setDismissed([...dismissed, id]);
  const dismissAll = () => setDismissed([...dismissed, ...activeAlerts.map(a => a.id)]);
  const restore = (id) => setDismissed(dismissed.filter(d => d !== id));
  const clearAllDismissed = () => setDismissed([]);

  const SEV_STYLE = {
    critical: { bg: "#ef444415", border: "#ef444440", dot: "#ef4444", label: "#ef4444" },
    warning:  { bg: "#f59e0b15", border: "#f59e0b40", dot: "#f59e0b", label: "#f59e0b" },
    info:     { bg: "#6366f115", border: "#6366f140", dot: "#6366f1", label: "#818cf8" },
  };

  const CAT_LABELS = { deadline: "Deadlines", budget: "Budget", workload: "Workload", leave: "Leave" };

  const critCount = activeAlerts.filter(a => a.severity === "critical").length;
  const warnCount = activeAlerts.filter(a => a.severity === "warning").length;
  const infoCount = activeAlerts.filter(a => a.severity === "info").length;

  return (
    <div>
      <PageHeader
        title="Alerts & Notifications"
        sub={`${activeAlerts.length} active · ${critCount} critical`}
        action={activeAlerts.length > 0 && !showDismissed && (
          <button className="btn btn-ghost" onClick={dismissAll}>Dismiss All</button>
        )}
      />

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Critical", count: critCount, color: "#ef4444", id: "critical" },
          { label: "Warnings", count: warnCount, color: "#f59e0b", id: "warning" },
          { label: "Info", count: infoCount, color: "#6366f1", id: "info" },
          { label: "Dismissed", count: dismissedAlerts.length, color: "#64748b", id: "dismissed" },
        ].map(s => (
          <div
            key={s.id}
            className="stat-card"
            onClick={() => { if (s.id === "dismissed") { setShowDismissed(true); setFilter("all"); } else { setShowDismissed(false); setFilter(s.id); } }}
            style={{ cursor: "pointer", borderColor: filter === s.id && !showDismissed ? s.color : "#1e2133", transition: "border-color 0.15s" }}
          >
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center" }}>
        {!showDismissed && ["all", "deadline", "budget", "workload", "leave"].map(f => (
          <button key={f} className={`btn ${filter === f ? "btn-primary" : "btn-ghost"}`} style={{ textTransform: "capitalize", padding: "6px 14px", fontSize: 12 }} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : CAT_LABELS[f]}
          </button>
        ))}
        {showDismissed && (
          <>
            <button className="btn btn-ghost" onClick={() => { setShowDismissed(false); setFilter("all"); }}>← Active Alerts</button>
            {dismissedAlerts.length > 0 && <button className="btn btn-danger" style={{ fontSize: 12, padding: "6px 14px" }} onClick={clearAllDismissed}>Clear History</button>}
          </>
        )}
        <div style={{ marginLeft: "auto", fontSize: 12, color: "#4a5568" }}>
          {filtered.length} alert{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Alert list */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0", marginBottom: 6 }}>
            {showDismissed ? "No dismissed alerts" : "All clear!"}
          </div>
          <div style={{ fontSize: 13, color: "#4a5568" }}>
            {showDismissed ? "Dismissed alerts will appear here." : "No active alerts matching this filter."}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(alert => {
            const sty = SEV_STYLE[alert.severity];
            return (
              <div
                key={alert.id}
                style={{ background: sty.bg, border: `1px solid ${sty.border}`, borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 16, opacity: showDismissed ? 0.6 : 1 }}
              >
                {/* Severity dot */}
                <div style={{ marginTop: 3, width: 10, height: 10, borderRadius: "50%", background: sty.dot, flexShrink: 0, boxShadow: `0 0 8px ${sty.dot}` }} />

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: sty.label }}>{alert.title}</span>
                    <span className="tag" style={{ background: "#1e2133", color: "#64748b", textTransform: "capitalize", fontSize: 10 }}>{alert.category}</span>
                    {alert.severity === "critical" && (
                      <span className="tag" style={{ background: "#ef444422", color: "#ef4444", fontSize: 10 }}>CRITICAL</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: alert.assignee ? 6 : 0 }}>{alert.body}</div>
                  {alert.assignee && (
                    <div style={{ fontSize: 11, color: "#4a5568" }}>Assignee: {alert.assignee}</div>
                  )}
                  <div style={{ fontSize: 11, color: "#374151", marginTop: 4 }}>{alert.ts}</div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {!showDismissed && (
                    <>
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: 11, padding: "4px 10px" }}
                        onClick={() => setTab(alert.link)}
                      >
                        View →
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: 11, padding: "4px 10px" }}
                        onClick={() => dismiss(alert.id)}
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                  {showDismissed && (
                    <button className="btn btn-ghost" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => restore(alert.id)}>
                      Restore
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tip about dismissed */}
      {!showDismissed && dismissedAlerts.length > 0 && (
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => { setShowDismissed(true); setFilter("all"); }}>
            View {dismissedAlerts.length} dismissed alert{dismissedAlerts.length !== 1 ? "s" : ""}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
function Export({ tasks, projects, engineers, attendance, leaves }) {
  const [exporting, setExporting] = useState(null);
  const [done, setDone] = useState(null);

  const stamp = () => new Date().toISOString().slice(0, 10);
  const calcCost = (t) => { const e = engineers.find(x => x.id === t.assignee); return e ? t.loggedHours * (e.rate / 8) : 0; };
  const flash = (label) => { setDone(label); setTimeout(() => setDone(null), 3000); };

  // ── SheetJS ──────────────────────────────────────────────────────────────
  const loadXLSX = () => new Promise((res, rej) => {
    if (window.XLSX) return res(window.XLSX);
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload = () => res(window.XLSX); s.onerror = rej;
    document.head.appendChild(s);
  });

  const xlsxDownload = async (sheets, filename) => {
    const XLSX = await loadXLSX();
    const wb = XLSX.utils.book_new();
    sheets.forEach(({ name, data, colWidths }) => {
      const ws = XLSX.utils.aoa_to_sheet(data);
      if (colWidths) ws["!cols"] = colWidths.map(w => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, ws, name);
    });
    XLSX.writeFile(wb, filename);
  };

  // ── jsPDF ────────────────────────────────────────────────────────────────
  const loadJsPDF = () => new Promise((res, rej) => {
    if (window.jspdf) return res(window.jspdf.jsPDF);
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = () => {
      const s2 = document.createElement("script");
      s2.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";
      s2.onload = () => res(window.jspdf.jsPDF); s2.onerror = rej;
      document.head.appendChild(s2);
    };
    s.onerror = rej; document.head.appendChild(s);
  });

  const pdfDownload = async ({ title, subtitle, columns, rows, filename, landscape }) => {
    const JsPDF = await loadJsPDF();
    const doc = new JsPDF({ orientation: landscape ? "landscape" : "portrait", unit: "mm", format: "a4" });
    const pw = doc.internal.pageSize.getWidth();
    doc.setFillColor(79, 70, 229); doc.rect(0, 0, pw, 22, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text("IKSANA Studio Management", 14, 10);
    doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text(title, 14, 17);
    doc.setTextColor(100, 116, 139); doc.setFontSize(8);
    doc.text(`${subtitle}  ·  Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`, 14, 28);
    doc.text("ISK-EXP · Confidential", pw - 14, 28, { align: "right" });
    doc.autoTable({
      startY: 32, head: [columns], body: rows, theme: "grid",
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold", fontSize: 8, halign: "center" },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      styles: { font: "helvetica", cellPadding: 3 },
      margin: { left: 14, right: 14 },
      didDrawPage: () => {
        const pg = doc.internal.getCurrentPageInfo().pageNumber;
        const total = doc.internal.getNumberOfPages();
        doc.setFontSize(7); doc.setTextColor(148, 163, 184);
        doc.text(`Page ${pg} of ${total}  ·  Iksana Interior Architecture Studio  ·  Internal Use Only`, pw / 2, doc.internal.pageSize.getHeight() - 6, { align: "center" });
      },
    });
    doc.save(filename);
  };

  // ── Export definitions ───────────────────────────────────────────────────
  const EXPORTS = [
    {
      id: "tasks", label: "Task Register", icon: "◈", color: "#6366f1",
      desc: "All tasks with assignee, hours, status, cost and due dates",
      xlsxFile: `iksana-tasks-${stamp()}.xlsx`,
      sheets: () => [{
        name: "Task Register",
        colWidths: [30, 28, 18, 12, 14, 12, 12, 14, 14, 12],
        data: [
          ["Task Title", "Project", "Assignee", "Discipline", "Status", "Priority", "Est. Hours", "Logged Hours", "Cost (INR)", "Due Date"],
          ...tasks.map(t => {
            const eng = engineers.find(e => e.id === t.assignee);
            const proj = projects.find(p => p.id === t.projectId);
            return [t.title, proj?.name || "—", eng?.name || "—", t.discipline, t.status, t.priority, t.estimatedHours, t.loggedHours, Math.round(calcCost(t)), t.dueDate];
          }),
          [], ["TOTALS", "", "", "", "", "",
            tasks.reduce((s, t) => s + t.estimatedHours, 0),
            tasks.reduce((s, t) => s + t.loggedHours, 0),
            Math.round(tasks.reduce((s, t) => s + calcCost(t), 0)), ""],
        ],
      }],
      pdf: () => ({
        title: "Task Register", subtitle: `${tasks.length} tasks`, landscape: true,
        columns: ["Task Title", "Project", "Assignee", "Discipline", "Status", "Est.Hrs", "Logged", "Cost (INR)", "Due Date"],
        rows: tasks.map(t => { const eng = engineers.find(e => e.id === t.assignee); const proj = projects.find(p => p.id === t.projectId); return [t.title.slice(0, 32), (proj?.name || "").slice(0, 22), eng?.name || "—", t.discipline, t.status, t.estimatedHours, t.loggedHours, Math.round(calcCost(t)).toLocaleString("en-IN"), t.dueDate]; }),
        filename: `iksana-tasks-${stamp()}.pdf`,
      }),
    },
    {
      id: "projects", label: "Project Cost Summary", icon: "◫", color: "#10b981",
      desc: "Budget vs cost-to-date per project with burn rate analysis",
      xlsxFile: `iksana-projects-${stamp()}.xlsx`,
      sheets: () => [{
        name: "Project Cost Summary",
        colWidths: [32, 18, 8, 10, 14, 14, 14, 10, 10, 10, 12, 12],
        data: [
          ["Project Name", "Client", "Region", "Status", "Budget (INR)", "Cost to Date (INR)", "Remaining (INR)", "Total Tasks", "Completed", "Progress %", "Start Date", "End Date"],
          ...projects.map(p => { const ptasks = tasks.filter(t => t.projectId === p.id); const cost = ptasks.reduce((s, t) => s + calcCost(t), 0); const done = ptasks.filter(t => t.status === "completed").length; return [p.name, p.client, p.region, p.status, p.budget, Math.round(cost), Math.round(p.budget - cost), ptasks.length, done, `${pct(done, ptasks.length)}%`, p.startDate, p.endDate]; }),
          [], ["TOTALS", "", "", "", projects.reduce((s, p) => s + p.budget, 0), Math.round(projects.reduce((s, p) => s + tasks.filter(t => t.projectId === p.id).reduce((x, t) => x + calcCost(t), 0), 0)), "", tasks.length, tasks.filter(t => t.status === "completed").length, "", "", ""],
        ],
      }],
      pdf: () => ({
        title: "Project Cost Summary", subtitle: `${projects.length} projects`, landscape: true,
        columns: ["Project", "Client", "Region", "Status", "Budget (INR)", "Cost (INR)", "Remaining", "Progress"],
        rows: projects.map(p => { const ptasks = tasks.filter(t => t.projectId === p.id); const cost = ptasks.reduce((s, t) => s + calcCost(t), 0); const done = ptasks.filter(t => t.status === "completed").length; return [p.name.slice(0, 28), p.client, p.region, p.status, p.budget.toLocaleString("en-IN"), Math.round(cost).toLocaleString("en-IN"), Math.round(p.budget - cost).toLocaleString("en-IN"), `${pct(done, ptasks.length)}%`]; }),
        filename: `iksana-projects-${stamp()}.pdf`,
      }),
    },
    {
      id: "engineers", label: "Engineer Summary", icon: "◉", color: "#f59e0b",
      desc: "Per-engineer hours, cost, tasks completed and current allocation",
      xlsxFile: `iksana-engineers-${stamp()}.xlsx`,
      sheets: () => [{
        name: "Engineer Summary",
        colWidths: [22, 20, 10, 14, 12, 12, 12, 14, 16, 14],
        data: [
          ["Name", "Role", "Location", "Day Rate (INR)", "Total Tasks", "Completed", "Active", "Hours Logged", "Total Cost (INR)", "Hours Remaining"],
          ...engineers.filter(e => e.active).map(eng => { const myTasks = tasks.filter(t => t.assignee === eng.id); const logged = myTasks.reduce((s, t) => s + t.loggedHours, 0); const active = myTasks.filter(t => t.status === "in-progress"); const remaining = active.reduce((s, t) => s + Math.max(0, t.estimatedHours - t.loggedHours), 0); return [eng.name, eng.role, eng.location, eng.rate, myTasks.length, myTasks.filter(t => t.status === "completed").length, active.length, logged, Math.round(logged * (eng.rate / 8)), remaining]; }),
        ],
      }],
      pdf: () => ({
        title: "Engineer Summary", subtitle: `${engineers.filter(e => e.active).length} active engineers`, landscape: true,
        columns: ["Name", "Role", "Location", "Tasks", "Done", "Active", "Hours", "Cost (INR)", "Remaining"],
        rows: engineers.filter(e => e.active).map(eng => { const myTasks = tasks.filter(t => t.assignee === eng.id); const logged = myTasks.reduce((s, t) => s + t.loggedHours, 0); const active = myTasks.filter(t => t.status === "in-progress"); const remaining = active.reduce((s, t) => s + Math.max(0, t.estimatedHours - t.loggedHours), 0); return [eng.name, eng.role, eng.location, myTasks.length, myTasks.filter(t => t.status === "completed").length, active.length, logged, Math.round(logged * (eng.rate / 8)).toLocaleString("en-IN"), remaining + "h"]; }),
        filename: `iksana-engineers-${stamp()}.pdf`,
      }),
    },
    {
      id: "attendance", label: "Attendance Report", icon: "◷", color: "#0ea5e9",
      desc: "Full attendance log with check-in/out times, leave register, and monthly summary",
      xlsxFile: `iksana-attendance-${stamp()}.xlsx`,
      sheets: () => {
        const calcH = (r) => { if (!r?.checkIn || !r?.checkOut) return 0; const [ih, im] = r.checkIn.split(":").map(Number); const [oh, om] = r.checkOut.split(":").map(Number); return ((oh * 60 + om) - (ih * 60 + im)) / 60; };
        const attRows = attendance.map(a => { const eng = engineers.find(e => e.id === a.engineerId); return [eng?.name || a.engineerId, eng?.role || "", eng?.location || "", a.date, a.type, a.checkIn || "—", a.checkOut || "—", calcH(a).toFixed(1)]; }).sort((a, b) => b[3].localeCompare(a[3]));
        const leaveRows = leaves.map(l => { const eng = engineers.find(e => e.id === l.engineerId); const days = Math.ceil((new Date(l.endDate) - new Date(l.startDate)) / 86400000) + 1; return [eng?.name || l.engineerId, l.type, l.startDate, l.endDate, days, l.reason, l.status]; });
        const months = [...new Set(attendance.map(a => a.date.slice(0, 7)))].sort().reverse();
        const summaryRows = engineers.filter(e => e.active).flatMap(eng => months.map(m => { const recs = attendance.filter(a => a.engineerId === eng.id && a.date.startsWith(m)); const present = recs.filter(a => a.type === "present").length; const absent = recs.filter(a => a.type === "absent").length; const hours = recs.reduce((s, a) => s + calcH(a), 0); return [m, eng.name, eng.role, eng.location, present, absent, hours.toFixed(1), Math.round(present * eng.rate)]; }));
        return [
          { name: "Daily Attendance", colWidths: [22, 18, 10, 12, 10, 10, 10, 10], data: [["Name", "Role", "Location", "Date", "Status", "Check In", "Check Out", "Hours"], ...attRows] },
          { name: "Leave Register", colWidths: [22, 12, 12, 12, 8, 28, 12], data: [["Name", "Leave Type", "From", "To", "Days", "Reason", "Status"], ...leaveRows] },
          { name: "Monthly Summary", colWidths: [10, 22, 18, 10, 12, 12, 12, 16], data: [["Month", "Name", "Role", "Location", "Present", "Absent", "Hours", "Cost (INR)"], ...summaryRows] },
        ];
      },
      pdf: () => {
        const calcH = (r) => { if (!r?.checkIn || !r?.checkOut) return 0; const [ih, im] = r.checkIn.split(":").map(Number); const [oh, om] = r.checkOut.split(":").map(Number); return ((oh * 60 + om) - (ih * 60 + im)) / 60; };
        return { title: "Attendance Report", subtitle: `${attendance.length} records`, landscape: true, columns: ["Name", "Role", "Date", "Status", "Check In", "Check Out", "Hours"], rows: attendance.slice(0, 200).sort((a, b) => b.date.localeCompare(a.date)).map(a => { const eng = engineers.find(e => e.id === a.engineerId); return [eng?.name || "—", eng?.role || "—", a.date, a.type, a.checkIn || "—", a.checkOut || "—", calcH(a).toFixed(1)]; }), filename: `iksana-attendance-${stamp()}.pdf` };
      },
    },
    {
      id: "studio", label: "Full Studio Report", icon: "⬡", color: "#ec4899", badge: "RECOMMENDED",
      desc: "Complete workbook — all data across 5 sheets in one Excel file",
      xlsxFile: `iksana-full-report-${stamp()}.xlsx`,
      pdfDisabled: true,
      sheets: () => {
        const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
        const totalCostAll = tasks.reduce((s, t) => s + calcCost(t), 0);
        return [
          { name: "Summary", colWidths: [36, 20, 36], data: [
            ["IKSANA STUDIO — MANAGEMENT REPORT", "", ""],
            [`Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`, "", ""],
            [],
            ["METRIC", "VALUE", "NOTES"],
            ["Active Projects", projects.filter(p => p.status === "active").length, ""],
            ["Total Projects", projects.length, ""],
            ["Active Engineers", engineers.filter(e => e.active).length, ""],
            ["Remote Engineers", engineers.filter(e => e.active && e.location === "remote").length, "50% remote workforce"],
            ["Tasks In Progress", tasks.filter(t => t.status === "in-progress").length, ""],
            ["Tasks Completed", tasks.filter(t => t.status === "completed").length, ""],
            ["Total Hours Logged", tasks.reduce((s, t) => s + t.loggedHours, 0), ""],
            ["Total Budget (INR)", totalBudget, "All projects"],
            ["Total Cost to Date (INR)", Math.round(totalCostAll), "Day rates × logged hours"],
            ["Budget Remaining (INR)", Math.round(totalBudget - totalCostAll), ""],
            ["Overall Budget Burn %", `${pct(totalCostAll, totalBudget)}%`, ""],
          ]},
          { name: "Tasks", colWidths: [30, 26, 18, 12, 14, 10, 10, 10, 14, 12], data: [
            ["Task Title", "Project", "Assignee", "Discipline", "Status", "Priority", "Est.Hrs", "Logged Hrs", "Cost (INR)", "Due Date"],
            ...tasks.map(t => { const eng = engineers.find(e => e.id === t.assignee); const proj = projects.find(p => p.id === t.projectId); return [t.title, proj?.name || "—", eng?.name || "—", t.discipline, t.status, t.priority, t.estimatedHours, t.loggedHours, Math.round(calcCost(t)), t.dueDate]; }),
          ]},
          { name: "Projects", colWidths: [30, 16, 8, 10, 16, 16, 16, 10, 12], data: [
            ["Project", "Client", "Region", "Status", "Budget (INR)", "Cost (INR)", "Remaining (INR)", "Progress %", "End Date"],
            ...projects.map(p => { const ptasks = tasks.filter(t => t.projectId === p.id); const cost = ptasks.reduce((s, t) => s + calcCost(t), 0); const done = ptasks.filter(t => t.status === "completed").length; return [p.name, p.client, p.region, p.status, p.budget, Math.round(cost), Math.round(p.budget - cost), `${pct(done, ptasks.length)}%`, p.endDate]; }),
          ]},
          { name: "Engineers", colWidths: [22, 20, 10, 14, 10, 8, 8, 8, 14], data: [
            ["Name", "Role", "Location", "Day Rate (INR)", "Tasks", "Done", "Active", "Hours", "Cost (INR)"],
            ...engineers.filter(e => e.active).map(eng => { const myTasks = tasks.filter(t => t.assignee === eng.id); const logged = myTasks.reduce((s, t) => s + t.loggedHours, 0); return [eng.name, eng.role, eng.location, eng.rate, myTasks.length, myTasks.filter(t => t.status === "completed").length, myTasks.filter(t => t.status === "in-progress").length, logged, Math.round(logged * (eng.rate / 8))]; }),
          ]},
          { name: "Leave Register", colWidths: [22, 12, 12, 12, 8, 30, 12], data: [
            ["Engineer", "Type", "From", "To", "Days", "Reason", "Status"],
            ...leaves.map(l => { const eng = engineers.find(e => e.id === l.engineerId); const days = Math.ceil((new Date(l.endDate) - new Date(l.startDate)) / 86400000) + 1; return [eng?.name || l.engineerId, l.type, l.startDate, l.endDate, days, l.reason, l.status]; }),
          ]},
        ];
      },
    },
  ];

  const handleExport = async (exp, format) => {
    const key = `${exp.id}-${format}`;
    setExporting(key);
    try {
      if (format === "xlsx") await xlsxDownload(exp.sheets(), exp.xlsxFile);
      else { const cfg = exp.pdf(); await pdfDownload(cfg); }
      flash(`${exp.label} · ${format.toUpperCase()}`);
    } catch (e) { console.error(e); flash("Error — see console"); }
    setExporting(null);
  };

  return (
    <div>
      <PageHeader title="Export" sub="Download reports as Excel or PDF" />

      {done && (
        <div style={{ background: "#10b98122", border: "1px solid #10b98144", borderRadius: 10, padding: "12px 18px", marginBottom: 20, fontSize: 13, color: "#10b981", fontWeight: 600 }}>
          ✓ Downloaded: {done}
        </div>
      )}

      <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Excel (.xlsx)", desc: "Multi-sheet workbook · editable · full data · works in Google Sheets", icon: "⊞", color: "#10b981" },
          { label: "PDF (.pdf)", desc: "A4 formatted report · Iksana branding · page numbers · print-ready", icon: "◧", color: "#ef4444" },
        ].map(f => (
          <div key={f.label} style={{ background: "#13151f", border: "1px solid #1e2133", borderRadius: 10, padding: "14px 18px", display: "flex", gap: 12, alignItems: "center", flex: 1 }}>
            <span style={{ fontSize: 22, color: f.color }}>{f.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{f.label}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {EXPORTS.map(exp => (
          <div key={exp.id} style={{ background: "#13151f", border: "1px solid #1e2133", borderRadius: 12, padding: "18px 22px", display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: `${exp.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: exp.color, flexShrink: 0 }}>{exp.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{exp.label}</span>
                {exp.badge && <span style={{ background: `${exp.color}22`, color: exp.color, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>{exp.badge}</span>}
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{exp.desc}</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button className="btn" style={{ background: "#10b98122", color: "#10b981", border: "1px solid #10b98144", padding: "8px 16px", fontSize: 12 }} disabled={!!exporting} onClick={() => handleExport(exp, "xlsx")}>
                {exporting === `${exp.id}-xlsx` ? "…" : "↓ Excel"}
              </button>
              {!exp.pdfDisabled ? (
                <button className="btn" style={{ background: "#ef444422", color: "#ef4444", border: "1px solid #ef444444", padding: "8px 16px", fontSize: 12 }} disabled={!!exporting} onClick={() => handleExport(exp, "pdf")}>
                  {exporting === `${exp.id}-pdf` ? "…" : "↓ PDF"}
                </button>
              ) : (
                <div style={{ fontSize: 11, color: "#374151", alignSelf: "center", width: 80, textAlign: "center" }}>Excel only</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, background: "#13151f", border: "1px solid #1e2133", borderRadius: 12, padding: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", marginBottom: 10 }}>Notes</div>
        {[
          "Files download directly to your browser's Downloads folder.",
          "The Full Studio Report is a 5-sheet Excel workbook — ideal for weekly management sharing.",
          "All costs are calculated from engineer day rates × logged hours, shown in INR.",
          "Excel files open in Microsoft Excel, Google Sheets, or LibreOffice Calc.",
          "Data is exported directly from your browser — nothing is sent to any server.",
        ].map((note, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <span style={{ color: "#6366f1", flexShrink: 0 }}>›</span>
            <span style={{ fontSize: 12, color: "#64748b" }}>{note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageHeader({ title, sub, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", color: "#f1f5f9" }}>{title}</h1>
        {sub && <div style={{ fontSize: 13, color: "#4a5568", marginTop: 2 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}
