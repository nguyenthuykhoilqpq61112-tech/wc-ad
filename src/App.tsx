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
  FileText,
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

type ActivePage = "Overview" | "Users" | "Deposits" | "Withdrawals" | "Risk Review" | "Bonus Controls" | "Audit Logs";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "https://2026wc.zeabur.app").replace(/\/+$/, "");
const STORAGE_KEY = "wwc_admin_session";

const navItems: Array<{label: ActivePage; Icon: typeof Activity}> = [
  {label: "Overview", Icon: Activity},
  {label: "Users", Icon: Users},
  {label: "Deposits", Icon: WalletCards},
  {label: "Withdrawals", Icon: Banknote},
  {label: "Risk Review", Icon: AlertTriangle},
  {label: "Bonus Controls", Icon: SlidersHorizontal},
  {label: "Audit Logs", Icon: Database},
];

const depositQueue = [
  {id: "DEP-8041", user: "Mason", chain: "USDT TRC20", tx: "TQ9a...7k2m", amount: 220, confirmations: "14/20", status: "Waiting chain confirm", age: "4m"},
  {id: "DEP-8039", user: "Hana", chain: "USDT TRC20", tx: "TR3x...91pa", amount: 75, confirmations: "20/20", status: "Manual review", age: "12m"},
  {id: "DEP-8035", user: "Carter", chain: "USDT ERC20", tx: "0x8e...a4bf", amount: 510, confirmations: "64/64", status: "Ready to credit", age: "19m"},
  {id: "DEP-8028", user: "Iris", chain: "USDT TRC20", tx: "TC2b...f9q1", amount: 1800, confirmations: "20/20", status: "Large deposit check", age: "31m"},
];

const withdrawalQueue = [
  {id: "WDR-1198", user: "Noah", amount: 340, risk: "Low", wallet: "TKh7...2pLx", note: "Customer service contact required"},
  {id: "WDR-1197", user: "Iris", amount: 1200, risk: "High", wallet: "0x31...9cfe", note: "Bonus turnover not complete"},
  {id: "WDR-1192", user: "Liam", amount: 88, risk: "Low", wallet: "TSn2...a81b", note: "Meets minimum withdrawal"},
  {id: "WDR-1189", user: "Carter", amount: 760, risk: "Medium", wallet: "TD4s...92Lm", note: "Review recent parlay exposure"},
];

const riskEvents = [
  {id: "RSK-501", severity: "High", user: "Iris", signal: "Multiple accounts from one device fingerprint", action: "Lock withdrawal until manual review"},
  {id: "RSK-498", severity: "Medium", user: "Mason", signal: "High-frequency in-play betting spike", action: "Limit live market stake"},
  {id: "RSK-493", severity: "Medium", user: "Hana", signal: "Deposit bonus claimed without settled wager", action: "Hold bonus credit"},
  {id: "RSK-488", severity: "Low", user: "Noah", signal: "Withdrawal requested before support note completed", action: "Request customer service transcript"},
];

const bonusRules = [
  {name: "Welcome bonus", value: "100% deposit match", limit: "$500 cap", status: "Active"},
  {name: "Daily World Cup boost", value: "8% extra credit", limit: "Once per day", status: "Active"},
  {name: "Season bonus", value: "$25 free bet", limit: "After $1,000 wagered", status: "Active"},
  {name: "Referral reward", value: "$15 credit", limit: "After referred user deposits", status: "Manual"},
  {name: "VIP loyalty", value: "1.5 points per $1", limit: "Redeem after 500 points", status: "Active"},
];

const auditLogs = [
  {time: "2026-07-12 21:44", actor: "admin", action: "Reviewed withdrawal WDR-1197", result: "Held"},
  {time: "2026-07-12 21:39", actor: "system", action: "Created admin summary snapshot", result: "OK"},
  {time: "2026-07-12 21:31", actor: "admin", action: "Opened deposit DEP-8035", result: "Pending credit"},
  {time: "2026-07-12 21:22", actor: "risk-engine", action: "Flagged multiple account fingerprint", result: "High"},
  {time: "2026-07-12 21:10", actor: "system", action: "Synced users from main API", result: "OK"},
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
  const [activePage, setActivePage] = useState<ActivePage>("Overview");
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

  const pageMeta = {
    Overview: ["Operations dashboard", "Account, wallet, and risk control"],
    Users: ["Users", "Player account management"],
    Deposits: ["Deposits", "USDT payment verification queue"],
    Withdrawals: ["Withdrawals", "Manual payout review and platform protection"],
    "Risk Review": ["Risk Review", "Signals, limits, and investigation notes"],
    "Bonus Controls": ["Bonus Controls", "Promotions, loyalty, and wagering rules"],
    "Audit Logs": ["Audit Logs", "Operator and system activity trail"],
  } satisfies Record<ActivePage, [string, string]>;

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
          {navItems.map(({label, Icon}) => (
            <button className={label === activePage ? "active" : ""} key={label} onClick={() => setActivePage(label)}>
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
            <p className="eyebrow">{pageMeta[activePage][0]}</p>
            <h1>{pageMeta[activePage][1]}</h1>
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

        {activePage === "Overview" && <OverviewPage summary={summary} filteredUsers={filteredUsers} />}
        {activePage === "Users" && <UsersPage summary={summary} filteredUsers={filteredUsers} />}
        {activePage === "Deposits" && <DepositsPage />}
        {activePage === "Withdrawals" && <WithdrawalsPage />}
        {activePage === "Risk Review" && <RiskReviewPage />}
        {activePage === "Bonus Controls" && <BonusControlsPage />}
        {activePage === "Audit Logs" && <AuditLogsPage summary={summary} />}
      </main>
    </div>
  );
}

function OverviewPage({summary, filteredUsers}: {summary: AdminSummary | null; filteredUsers: AdminSummary["users"]}) {
  return (
    <>
      <section className="metrics-grid">
        <Metric title="Registered users" value={summary?.users.length ?? 0} icon={<Users size={20} />} />
        <Metric title="Active sessions" value={summary?.sessions ?? 0} icon={<Activity size={20} />} />
        <Metric title="Saved game states" value={summary?.gameStates ?? 0} icon={<Database size={20} />} />
        <Metric title="Wallet ledger rows" value={summary?.walletLedgerCount ?? 0} icon={<CircleDollarSign size={20} />} />
        <Metric title="Bet audit rows" value={summary?.betAuditCount ?? 0} icon={<ShieldCheck size={20} />} />
      </section>
      <section className="split-grid">
        <UsersPanel users={filteredUsers} updatedAt={summary?.updatedAt} />
        <WithdrawalControlPanel />
      </section>
      <section className="triple-grid">
        <DepositQueuePanel />
        <RiskSignalsPanel />
        <BonusRulesPanel />
      </section>
    </>
  );
}

function UsersPage({summary, filteredUsers}: {summary: AdminSummary | null; filteredUsers: AdminSummary["users"]}) {
  return (
    <section className="page-grid">
      <Panel title="User Directory" meta={summary?.updatedAt ? `Updated ${new Date(summary.updatedAt).toLocaleString()}` : "Waiting for API data"}>
        <div className="data-table users-table">
          <div className="data-row data-head"><span>User ID</span><span>Username</span><span>Game saves</span><span>Session</span><span>Action</span></div>
          {filteredUsers.map((user, index) => (
            <div className="data-row" key={user.id}>
              <span>{user.id}</span>
              <strong>{user.username}</strong>
              <span>{index % 3 === 0 ? "Tournament + League" : "Tournament"}</span>
              <em><CheckCircle2 size={14} /> active</em>
              <button className="mini-btn">Open profile</button>
            </div>
          ))}
          {filteredUsers.length === 0 && <div className="empty">No matching users.</div>}
        </div>
      </Panel>
      <Panel title="Account Controls" meta="Operator actions">
        <div className="control-grid">
          {["Freeze account", "Reset password note", "Add KYC memo", "Export user activity"].map((item) => <button key={item}>{item}</button>)}
        </div>
      </Panel>
    </section>
  );
}

function DepositsPage() {
  return (
    <section className="page-grid">
      <Panel title="Deposit Verification" meta="Credit balance only after confirmed USDT receipt">
        <div className="data-table deposits-table">
          <div className="data-row data-head"><span>ID</span><span>User</span><span>Amount</span><span>Chain</span><span>TX</span><span>Confirmations</span><span>Status</span><span>Action</span></div>
          {depositQueue.map((item) => (
            <div className="data-row" key={item.id}>
              <strong>{item.id}</strong>
              <span>{item.user}</span>
              <b>${item.amount.toLocaleString()}</b>
              <span>{item.chain}</span>
              <span>{item.tx}</span>
              <span>{item.confirmations}</span>
              <em>{item.status}</em>
              <button className="mini-btn">Review</button>
            </div>
          ))}
        </div>
      </Panel>
      <section className="triple-grid">
        <Metric title="Pending deposits" value={depositQueue.length} icon={<WalletCards size={20} />} />
        <Metric title="Ready to credit" value={depositQueue.filter((item) => item.status.includes("Ready")).length} icon={<CheckCircle2 size={20} />} />
        <Metric title="Manual checks" value={depositQueue.filter((item) => item.status.includes("review") || item.status.includes("Large")).length} icon={<AlertTriangle size={20} />} />
      </section>
    </section>
  );
}

function WithdrawalsPage() {
  return (
    <section className="page-grid">
      <Panel title="Withdrawal Queue" meta="Withdrawals require customer service confirmation before payout">
        <div className="data-table withdrawals-table">
          <div className="data-row data-head"><span>ID</span><span>User</span><span>Amount</span><span>Wallet</span><span>Risk</span><span>Operator note</span><span>Action</span></div>
          {withdrawalQueue.map((item) => (
            <div className="data-row" key={item.id}>
              <strong>{item.id}</strong>
              <span>{item.user}</span>
              <b>${item.amount.toLocaleString()}</b>
              <span>{item.wallet}</span>
              <em className={item.risk === "High" ? "danger" : item.risk === "Medium" ? "warn" : ""}>{item.risk}</em>
              <span>{item.note}</span>
              <button className="mini-btn">Open case</button>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Payout Policy" meta="Configured platform protection">
        <div className="policy-list">
          <div><span>Minimum withdrawal</span><strong>$50 USDT</strong></div>
          <div><span>Manual support check</span><strong>Required</strong></div>
          <div><span>Bonus turnover</span><strong>Must be complete</strong></div>
          <div><span>High-risk delay</span><strong>24-72 hours</strong></div>
        </div>
      </Panel>
    </section>
  );
}

function RiskReviewPage() {
  return (
    <section className="page-grid">
      <Panel title="Risk Signals" meta="Prioritize high severity cases before approving wallet actions">
        <div className="data-table risk-table">
          <div className="data-row data-head"><span>Case</span><span>Severity</span><span>User</span><span>Signal</span><span>Required action</span><span>Action</span></div>
          {riskEvents.map((item) => (
            <div className="data-row" key={item.id}>
              <strong>{item.id}</strong>
              <em className={item.severity === "High" ? "danger" : "warn"}>{item.severity}</em>
              <span>{item.user}</span>
              <span>{item.signal}</span>
              <span>{item.action}</span>
              <button className="mini-btn">Investigate</button>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Risk Limits" meta="Current controls">
        <div className="control-grid">
          {["Live bet stake cap: $250", "Same device account limit: 2", "Withdrawal hold threshold: $1,000", "Bonus abuse score: 70+"].map((item) => <button key={item}>{item}</button>)}
        </div>
      </Panel>
    </section>
  );
}

function BonusControlsPage() {
  return (
    <section className="page-grid">
      <Panel title="Bonus Programs" meta="Rules shown here are operator-facing configuration records">
        <div className="data-table bonus-table">
          <div className="data-row data-head"><span>Program</span><span>Value</span><span>Limit</span><span>Status</span><span>Action</span></div>
          {bonusRules.map((item) => (
            <div className="data-row" key={item.name}>
              <strong>{item.name}</strong>
              <span>{item.value}</span>
              <span>{item.limit}</span>
              <em>{item.status}</em>
              <button className="mini-btn">Edit rule</button>
            </div>
          ))}
        </div>
      </Panel>
      <section className="triple-grid">
        <Metric title="Active promos" value={bonusRules.filter((item) => item.status === "Active").length} icon={<SlidersHorizontal size={20} />} />
        <Metric title="Manual promos" value={bonusRules.filter((item) => item.status === "Manual").length} icon={<FileText size={20} />} />
        <Metric title="Loyalty tiers" value={5} icon={<ShieldCheck size={20} />} />
      </section>
    </section>
  );
}

function AuditLogsPage({summary}: {summary: AdminSummary | null}) {
  return (
    <section className="page-grid">
      <Panel title="Audit Trail" meta={summary?.updatedAt ? `API snapshot ${new Date(summary.updatedAt).toLocaleString()}` : "Waiting for API data"}>
        <div className="data-table audit-table">
          <div className="data-row data-head"><span>Time</span><span>Actor</span><span>Action</span><span>Result</span></div>
          {auditLogs.map((item) => (
            <div className="data-row" key={`${item.time}-${item.action}`}>
              <span>{item.time}</span>
              <strong>{item.actor}</strong>
              <span>{item.action}</span>
              <em>{item.result}</em>
            </div>
          ))}
        </div>
      </Panel>
      <section className="metrics-grid compact-metrics">
        <Metric title="Bet audit rows" value={summary?.betAuditCount ?? 0} icon={<ShieldCheck size={20} />} />
        <Metric title="Wallet ledger rows" value={summary?.walletLedgerCount ?? 0} icon={<CircleDollarSign size={20} />} />
        <Metric title="Current sessions" value={summary?.sessions ?? 0} icon={<Activity size={20} />} />
      </section>
    </section>
  );
}

function UsersPanel({users, updatedAt}: {users: AdminSummary["users"]; updatedAt?: string}) {
  return (
    <Panel title="Users" meta={updatedAt ? `Updated ${new Date(updatedAt).toLocaleString()}` : "Waiting for data"}>
      <div className="table">
        <div className="table-row table-head"><span>User ID</span><span>Username</span><span>Status</span></div>
        {users.slice(0, 7).map((user) => (
          <div className="table-row" key={user.id}>
            <span>{user.id}</span>
            <strong>{user.username}</strong>
            <em><CheckCircle2 size={14} /> active</em>
          </div>
        ))}
        {users.length === 0 && <div className="empty">No matching users.</div>}
      </div>
    </Panel>
  );
}

function WithdrawalControlPanel() {
  return (
    <Panel title="Withdrawal Control" meta="Manual approval required">
      <div className="queue">
        {withdrawalQueue.slice(0, 3).map((item) => (
          <article key={item.id}>
            <div><strong>{item.id}</strong><span>{item.user}</span></div>
            <b>${item.amount.toLocaleString()}</b>
            <small className={item.risk === "High" ? "danger" : ""}>{item.risk} risk</small>
            <p>{item.note}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function DepositQueuePanel() {
  return (
    <Panel title="Deposit Queue" meta="Credit only after USDT receipt">
      <div className="compact-list">
        {depositQueue.slice(0, 3).map((item) => (
          <div key={item.id}>
            <span><Clock3 size={14} /> {item.age}</span>
            <strong>{item.user} · ${item.amount}</strong>
            <small>{item.chain} · {item.status}</small>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function RiskSignalsPanel() {
  return (
    <Panel title="Risk Signals" meta="Review before balance changes">
      <div className="compact-list">
        {riskEvents.slice(0, 3).map((item) => (
          <div key={item.id}>
            <span><AlertTriangle size={14} /> {item.severity}</span>
            <strong>{item.signal}</strong>
            <small>{item.action}</small>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function BonusRulesPanel() {
  return (
    <Panel title="Bonus Rules" meta="Current operating policy">
      <div className="policy-list">
        {bonusRules.slice(0, 4).map((item) => (
          <div key={item.name}><span>{item.name}</span><strong>{item.value}</strong></div>
        ))}
      </div>
    </Panel>
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
