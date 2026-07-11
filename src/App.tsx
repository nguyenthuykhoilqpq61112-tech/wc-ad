import {FormEvent, useEffect, useMemo, useState} from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Database,
  Lock,
  LogOut,
  RefreshCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";

type AuthSession = {
  token: string;
  user: {id: string; username: string};
};

type AdminSummary = {
  users: Array<{id: string; username: string}>;
  sessions: number;
  gameStates: number;
  walletLedgerCount: number;
  betAuditCount: number;
  updatedAt: string;
};

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "https://2026wc.zeabur.app").replace(/\/+$/, "");
const STORAGE_KEY = "wwc_admin_session";

const depositQueue = [
  {id: "DEP-8041", user: "Mason", chain: "USDT TRC20", amount: 220, status: "Waiting chain confirm", age: "4m"},
  {id: "DEP-8039", user: "Hana", chain: "USDT TRC20", amount: 75, status: "Manual review", age: "12m"},
  {id: "DEP-8035", user: "Carter", chain: "USDT ERC20", amount: 510, status: "Ready to credit", age: "19m"},
];

const withdrawalQueue = [
  {id: "WDR-1198", user: "Noah", amount: 340, risk: "Low", note: "Customer service contact required"},
  {id: "WDR-1197", user: "Iris", amount: 1200, risk: "High", note: "Bonus turnover not complete"},
  {id: "WDR-1192", user: "Liam", amount: 88, risk: "Low", note: "Meets minimum withdrawal"},
];

const riskEvents = [
  "Multiple accounts from one device fingerprint",
  "High-frequency in-play betting spike",
  "Deposit bonus claimed without settled wager",
  "Withdrawal requested before KYC note completed",
];

function readStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as AuthSession : null;
  } catch {
    return null;
  }
}

async function api<T>(path: string, options: RequestInit = {}, token?: string) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(token ? {authorization: `Bearer ${token}`} : {}),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.error || `Request failed: ${response.status}`);
  return data as T;
}

export function App() {
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession());
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const filteredUsers = useMemo(() => {
    const users = summary?.users || [];
    if (!query.trim()) return users;
    return users.filter((user) => user.username.toLowerCase().includes(query.toLowerCase()));
  }, [summary, query]);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const next = await api<AuthSession>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({username, password}),
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSession(next);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    if (!session) return;
    setRefreshing(true);
    setError("");
    try {
      setSummary(await api<AdminSummary>("/api/admin/summary", {}, session.token));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [session?.token]);

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setSummary(null);
  };

  if (!session) {
    return (
      <main className="login-shell">
        <section className="login-panel">
          <div className="lockmark"><Lock size={22} /></div>
          <p className="eyebrow">Private operations domain</p>
          <h1>win-worldcup Admin</h1>
          <p className="muted">This console is separate from the public sportsbook. Sign in with the protected admin account to manage users, wallet reviews, risk queues, and bonus controls.</p>
          <form onSubmit={login} className="login-form">
            <label>
              <span>Admin username</span>
              <input value={username} onChange={(event) => setUsername(event.target.value)} minLength={3} required />
            </label>
            <label>
              <span>Password</span>
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={8} required />
            </label>
            {error && <div className="error">{error}</div>}
            <button disabled={loading}>{loading ? "Checking access..." : "Enter back office"}</button>
          </form>
          <div className="endpoint">API: {API_BASE}</div>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <ShieldCheck size={24} />
          <div>
            <strong>win-worldcup</strong>
            <span>Admin Back Office</span>
          </div>
        </div>
        <nav>
          {[
            {label: "Overview", Icon: Activity},
            {label: "Users", Icon: Users},
            {label: "Deposits", Icon: WalletCards},
            {label: "Withdrawals", Icon: Banknote},
            {label: "Risk Review", Icon: AlertTriangle},
            {label: "Bonus Controls", Icon: SlidersHorizontal},
            {label: "Audit Logs", Icon: Database},
          ].map(({label, Icon}) => (
            <button className={label === "Overview" ? "active" : ""} key={label}>
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span>Main API</span>
          <strong>{API_BASE.replace(/^https?:\/\//, "")}</strong>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Operations dashboard</p>
            <h1>Account, wallet, and risk control</h1>
          </div>
          <div className="top-actions">
            <label className="search">
              <Search size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users" />
            </label>
            <button className="icon-btn" onClick={loadSummary} disabled={refreshing} title="Refresh">
              <RefreshCcw size={17} className={refreshing ? "spin" : ""} />
            </button>
            <button className="account" onClick={logout}>
              <UserRound size={17} />
              {session.user.username}
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {error && <div className="banner-error"><AlertTriangle size={18} />{error}</div>}

        <section className="metrics-grid">
          <Metric title="Registered users" value={summary?.users.length ?? 0} icon={<Users size={20} />} />
          <Metric title="Active sessions" value={summary?.sessions ?? 0} icon={<Activity size={20} />} />
          <Metric title="Saved game states" value={summary?.gameStates ?? 0} icon={<Database size={20} />} />
          <Metric title="Wallet ledger rows" value={summary?.walletLedgerCount ?? 0} icon={<CircleDollarSign size={20} />} />
          <Metric title="Bet audit rows" value={summary?.betAuditCount ?? 0} icon={<ShieldCheck size={20} />} />
        </section>

        <section className="split-grid">
          <Panel title="Users" meta={summary?.updatedAt ? `Updated ${new Date(summary.updatedAt).toLocaleString()}` : "Waiting for data"}>
            <div className="table">
              <div className="table-row table-head"><span>User ID</span><span>Username</span><span>Status</span></div>
              {filteredUsers.map((user) => (
                <div className="table-row" key={user.id}>
                  <span>{user.id}</span>
                  <strong>{user.username}</strong>
                  <em><CheckCircle2 size={14} /> active</em>
                </div>
              ))}
              {filteredUsers.length === 0 && <div className="empty">No matching users.</div>}
            </div>
          </Panel>

          <Panel title="Withdrawal Control" meta="Manual approval required">
            <div className="queue">
              {withdrawalQueue.map((item) => (
                <article key={item.id}>
                  <div><strong>{item.id}</strong><span>{item.user}</span></div>
                  <b>${item.amount.toLocaleString()}</b>
                  <small className={item.risk === "High" ? "danger" : ""}>{item.risk} risk</small>
                  <p>{item.note}</p>
                </article>
              ))}
            </div>
          </Panel>
        </section>

        <section className="triple-grid">
          <Panel title="Deposit Queue" meta="Credit only after USDT receipt">
            <div className="compact-list">
              {depositQueue.map((item) => (
                <div key={item.id}>
                  <span><Clock3 size={14} /> {item.age}</span>
                  <strong>{item.user} · ${item.amount}</strong>
                  <small>{item.chain} · {item.status}</small>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Risk Signals" meta="Review before balance changes">
            <div className="compact-list">
              {riskEvents.map((item) => (
                <div key={item}>
                  <span><AlertTriangle size={14} /> Signal</span>
                  <strong>{item}</strong>
                  <small>Requires operator decision</small>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Bonus Rules" meta="Current operating policy">
            <div className="policy-list">
              <div><span>Welcome bonus</span><strong>100% deposit match</strong></div>
              <div><span>Minimum deposit</span><strong>$20 USDT</strong></div>
              <div><span>Minimum bet</span><strong>$1</strong></div>
              <div><span>Withdrawal floor</span><strong>$50 + manual support</strong></div>
            </div>
          </Panel>
        </section>
      </main>
    </div>
  );
}

function Metric({title, value, icon}: {title: string; value: number; icon: React.ReactNode}) {
  return (
    <article className="metric">
      <div>{icon}</div>
      <span>{title}</span>
      <strong>{value.toLocaleString()}</strong>
      <small><ArrowUpRight size={13} /> live API</small>
    </article>
  );
}

function Panel({title, meta, children}: {title: string; meta: string; children: React.ReactNode}) {
  return (
    <section className="panel">
      <header>
        <div>
          <h2>{title}</h2>
          <p>{meta}</p>
        </div>
      </header>
      {children}
    </section>
  );
}
