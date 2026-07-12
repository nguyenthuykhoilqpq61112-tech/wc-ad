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
  X,
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
type Detail = {
  title: string;
  kicker: string;
  fields: Array<[string, string]>;
  actions: string[];
  note?: string;
};

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
  const [detail, setDetail] = useState<Detail | null>(null);

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
            <button className="icon-btn" onClick={() => {
              loadSummary();
              setDetail({
                title: "Refresh requested",
                kicker: "Live API",
                fields: [["Endpoint", "/api/admin/summary"], ["Requested by", session.user.username]],
                actions: ["Reload summary metrics", "Refresh user directory", "Update audit counters"],
                note: "The dashboard requests the latest admin summary from the main sportsbook API.",
              });
            }} disabled={refreshing} title="Refresh">
              <RefreshCcw size={17} className={refreshing ? "spin" : ""} />
            </button>
            <button className="account" onClick={() => setDetail({
              title: "Admin session",
              kicker: "Authenticated operator",
              fields: [["Username", session.user.username], ["API host", API_BASE], ["Stored session", "Local browser storage"]],
              actions: ["Review active session", "Logout from this browser", "Rotate admin password in Zeabur"],
              note: "Use the logout action only when leaving the operations workstation.",
            })}>
              <UserRound size={17} />
              {session.user.username}
              <LogOut size={16} onClick={(event) => {
                event.stopPropagation();
                logout();
              }} />
            </button>
          </div>
        </header>

        {error && <div className="banner-error"><AlertTriangle size={18} />{error}</div>}

        {activePage === "Overview" && <OverviewPage summary={summary} filteredUsers={filteredUsers} openDetail={setDetail} />}
        {activePage === "Users" && <UsersPage summary={summary} filteredUsers={filteredUsers} openDetail={setDetail} />}
        {activePage === "Deposits" && <DepositsPage openDetail={setDetail} />}
        {activePage === "Withdrawals" && <WithdrawalsPage openDetail={setDetail} />}
        {activePage === "Risk Review" && <RiskReviewPage openDetail={setDetail} />}
        {activePage === "Bonus Controls" && <BonusControlsPage openDetail={setDetail} />}
        {activePage === "Audit Logs" && <AuditLogsPage summary={summary} openDetail={setDetail} />}
      </main>
      {detail && <DetailDrawer detail={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function OverviewPage({summary, filteredUsers, openDetail}: {summary: AdminSummary | null; filteredUsers: AdminSummary["users"]; openDetail: (detail: Detail) => void}) {
  return (
    <>
      <section className="metrics-grid">
        <Metric title="Registered users" value={summary?.users.length ?? 0} icon={<Users size={20} />} onClick={() => openDetail(metricDetail("Registered users", summary?.users.length ?? 0, "User records returned by the main admin API."))} />
        <Metric title="Active sessions" value={summary?.sessions ?? 0} icon={<Activity size={20} />} onClick={() => openDetail(metricDetail("Active sessions", summary?.sessions ?? 0, "Current authenticated sessions tracked in memory."))} />
        <Metric title="Saved game states" value={summary?.gameStates ?? 0} icon={<Database size={20} />} onClick={() => openDetail(metricDetail("Saved game states", summary?.gameStates ?? 0, "Tournament and league saves stored by account."))} />
        <Metric title="Wallet ledger rows" value={summary?.walletLedgerCount ?? 0} icon={<CircleDollarSign size={20} />} onClick={() => openDetail(metricDetail("Wallet ledger rows", summary?.walletLedgerCount ?? 0, "Wallet credit, debit, bet stake, and cash-out entries."))} />
        <Metric title="Bet audit rows" value={summary?.betAuditCount ?? 0} icon={<ShieldCheck size={20} />} onClick={() => openDetail(metricDetail("Bet audit rows", summary?.betAuditCount ?? 0, "Recorded betting actions from the sportsbook API."))} />
      </section>
      <section className="split-grid">
        <UsersPanel users={filteredUsers} updatedAt={summary?.updatedAt} openDetail={openDetail} />
        <WithdrawalControlPanel openDetail={openDetail} />
      </section>
      <section className="triple-grid">
        <DepositQueuePanel openDetail={openDetail} />
        <RiskSignalsPanel openDetail={openDetail} />
        <BonusRulesPanel openDetail={openDetail} />
      </section>
    </>
  );
}

function UsersPage({summary, filteredUsers, openDetail}: {summary: AdminSummary | null; filteredUsers: AdminSummary["users"]; openDetail: (detail: Detail) => void}) {
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
              <button className="mini-btn" onClick={() => openDetail(userDetail(user, index))}>Open profile</button>
            </div>
          ))}
          {filteredUsers.length === 0 && <div className="empty">No matching users.</div>}
        </div>
      </Panel>
      <Panel title="Account Controls" meta="Operator actions">
        <div className="control-grid">
          {["Freeze account", "Reset password note", "Add KYC memo", "Export user activity"].map((item) => (
            <button key={item} onClick={() => openDetail(controlDetail(item, "Users", "This opens the operator workflow for the selected user account after a profile is selected."))}>{item}</button>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function DepositsPage({openDetail}: {openDetail: (detail: Detail) => void}) {
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
              <button className="mini-btn" onClick={() => openDetail(depositDetail(item))}>Review</button>
            </div>
          ))}
        </div>
      </Panel>
      <section className="triple-grid">
        <Metric title="Pending deposits" value={depositQueue.length} icon={<WalletCards size={20} />} onClick={() => openDetail(metricDetail("Pending deposits", depositQueue.length, "All deposit requests waiting for operator review or chain confirmation."))} />
        <Metric title="Ready to credit" value={depositQueue.filter((item) => item.status.includes("Ready")).length} icon={<CheckCircle2 size={20} />} onClick={() => openDetail(metricDetail("Ready to credit", depositQueue.filter((item) => item.status.includes("Ready")).length, "Deposits with enough confirmations that can move to balance crediting."))} />
        <Metric title="Manual checks" value={depositQueue.filter((item) => item.status.includes("review") || item.status.includes("Large")).length} icon={<AlertTriangle size={20} />} onClick={() => openDetail(metricDetail("Manual checks", depositQueue.filter((item) => item.status.includes("review") || item.status.includes("Large")).length, "Deposits that require operator verification before any user balance changes."))} />
      </section>
    </section>
  );
}

function WithdrawalsPage({openDetail}: {openDetail: (detail: Detail) => void}) {
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
              <button className="mini-btn" onClick={() => openDetail(withdrawalDetail(item))}>Open case</button>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Payout Policy" meta="Configured platform protection">
        <div className="policy-list">
          <button onClick={() => openDetail(policyDetail("Minimum withdrawal", "$50 USDT"))}><span>Minimum withdrawal</span><strong>$50 USDT</strong></button>
          <button onClick={() => openDetail(policyDetail("Manual support check", "Required"))}><span>Manual support check</span><strong>Required</strong></button>
          <button onClick={() => openDetail(policyDetail("Bonus turnover", "Must be complete"))}><span>Bonus turnover</span><strong>Must be complete</strong></button>
          <button onClick={() => openDetail(policyDetail("High-risk delay", "24-72 hours"))}><span>High-risk delay</span><strong>24-72 hours</strong></button>
        </div>
      </Panel>
    </section>
  );
}

function RiskReviewPage({openDetail}: {openDetail: (detail: Detail) => void}) {
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
              <button className="mini-btn" onClick={() => openDetail(riskDetail(item))}>Investigate</button>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Risk Limits" meta="Current controls">
        <div className="control-grid">
          {["Live bet stake cap: $250", "Same device account limit: 2", "Withdrawal hold threshold: $1,000", "Bonus abuse score: 70+"].map((item) => (
            <button key={item} onClick={() => openDetail(controlDetail(item, "Risk limit", "This limit is shown to operators before approving sensitive account or wallet actions."))}>{item}</button>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function BonusControlsPage({openDetail}: {openDetail: (detail: Detail) => void}) {
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
              <button className="mini-btn" onClick={() => openDetail(bonusDetail(item))}>Edit rule</button>
            </div>
          ))}
        </div>
      </Panel>
      <section className="triple-grid">
        <Metric title="Active promos" value={bonusRules.filter((item) => item.status === "Active").length} icon={<SlidersHorizontal size={20} />} onClick={() => openDetail(metricDetail("Active promos", bonusRules.filter((item) => item.status === "Active").length, "Promotion rules currently enabled for the sportsbook."))} />
        <Metric title="Manual promos" value={bonusRules.filter((item) => item.status === "Manual").length} icon={<FileText size={20} />} onClick={() => openDetail(metricDetail("Manual promos", bonusRules.filter((item) => item.status === "Manual").length, "Promotion rules requiring operator confirmation."))} />
        <Metric title="Loyalty tiers" value={5} icon={<ShieldCheck size={20} />} onClick={() => openDetail(metricDetail("Loyalty tiers", 5, "VIP and loyalty tiers used for account rewards."))} />
      </section>
    </section>
  );
}

function AuditLogsPage({summary, openDetail}: {summary: AdminSummary | null; openDetail: (detail: Detail) => void}) {
  return (
    <section className="page-grid">
      <Panel title="Audit Trail" meta={summary?.updatedAt ? `API snapshot ${new Date(summary.updatedAt).toLocaleString()}` : "Waiting for API data"}>
        <div className="data-table audit-table">
          <div className="data-row data-head"><span>Time</span><span>Actor</span><span>Action</span><span>Result</span></div>
          {auditLogs.map((item) => (
            <button className="data-row clickable-row" key={`${item.time}-${item.action}`} onClick={() => openDetail(auditDetail(item))}>
              <span>{item.time}</span>
              <strong>{item.actor}</strong>
              <span>{item.action}</span>
              <em>{item.result}</em>
            </button>
          ))}
        </div>
      </Panel>
      <section className="metrics-grid compact-metrics">
        <Metric title="Bet audit rows" value={summary?.betAuditCount ?? 0} icon={<ShieldCheck size={20} />} onClick={() => openDetail(metricDetail("Bet audit rows", summary?.betAuditCount ?? 0, "Bet audit rows recorded by the sportsbook API."))} />
        <Metric title="Wallet ledger rows" value={summary?.walletLedgerCount ?? 0} icon={<CircleDollarSign size={20} />} onClick={() => openDetail(metricDetail("Wallet ledger rows", summary?.walletLedgerCount ?? 0, "Wallet ledger rows available for reconciliation."))} />
        <Metric title="Current sessions" value={summary?.sessions ?? 0} icon={<Activity size={20} />} onClick={() => openDetail(metricDetail("Current sessions", summary?.sessions ?? 0, "Current session count reported by the API."))} />
      </section>
    </section>
  );
}

function UsersPanel({users, updatedAt, openDetail}: {users: AdminSummary["users"]; updatedAt?: string; openDetail: (detail: Detail) => void}) {
  return (
    <Panel title="Users" meta={updatedAt ? `Updated ${new Date(updatedAt).toLocaleString()}` : "Waiting for data"}>
      <div className="table">
        <div className="table-row table-head"><span>User ID</span><span>Username</span><span>Status</span></div>
        {users.slice(0, 7).map((user, index) => (
          <button className="table-row clickable-row" key={user.id} onClick={() => openDetail(userDetail(user, index))}>
            <span>{user.id}</span>
            <strong>{user.username}</strong>
            <em><CheckCircle2 size={14} /> active</em>
          </button>
        ))}
        {users.length === 0 && <div className="empty">No matching users.</div>}
      </div>
    </Panel>
  );
}

function WithdrawalControlPanel({openDetail}: {openDetail: (detail: Detail) => void}) {
  return (
    <Panel title="Withdrawal Control" meta="Manual approval required">
      <div className="queue">
        {withdrawalQueue.slice(0, 3).map((item) => (
          <article key={item.id} onClick={() => openDetail(withdrawalDetail(item))} role="button" tabIndex={0}>
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

function DepositQueuePanel({openDetail}: {openDetail: (detail: Detail) => void}) {
  return (
    <Panel title="Deposit Queue" meta="Credit only after USDT receipt">
      <div className="compact-list">
        {depositQueue.slice(0, 3).map((item) => (
          <button key={item.id} onClick={() => openDetail(depositDetail(item))}>
            <span><Clock3 size={14} /> {item.age}</span>
            <strong>{item.user} · ${item.amount}</strong>
            <small>{item.chain} · {item.status}</small>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function RiskSignalsPanel({openDetail}: {openDetail: (detail: Detail) => void}) {
  return (
    <Panel title="Risk Signals" meta="Review before balance changes">
      <div className="compact-list">
        {riskEvents.slice(0, 3).map((item) => (
          <button key={item.id} onClick={() => openDetail(riskDetail(item))}>
            <span><AlertTriangle size={14} /> {item.severity}</span>
            <strong>{item.signal}</strong>
            <small>{item.action}</small>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function BonusRulesPanel({openDetail}: {openDetail: (detail: Detail) => void}) {
  return (
    <Panel title="Bonus Rules" meta="Current operating policy">
      <div className="policy-list">
        {bonusRules.slice(0, 4).map((item) => (
          <button key={item.name} onClick={() => openDetail(bonusDetail(item))}><span>{item.name}</span><strong>{item.value}</strong></button>
        ))}
      </div>
    </Panel>
  );
}

function Metric({title, value, icon, onClick}: {title: string; value: number; icon: React.ReactNode; onClick?: () => void}) {
  return (
    <button className="metric" onClick={onClick}>
      <div>{icon}</div>
      <span>{title}</span>
      <strong>{value.toLocaleString()}</strong>
      <small><ArrowUpRight size={13} /> live API</small>
    </button>
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

function DetailDrawer({detail, onClose}: {detail: Detail; onClose: () => void}) {
  const [selectedAction, setSelectedAction] = useState("");

  return (
    <aside className="detail-overlay" aria-label="Selected admin detail">
      <section className="detail-drawer">
        <header>
          <div>
            <p className="eyebrow">{detail.kicker}</p>
            <h2>{detail.title}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} title="Close detail"><X size={18} /></button>
        </header>
        <div className="detail-fields">
          {detail.fields.map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        {detail.note && <p className="detail-note">{detail.note}</p>}
        <div className="detail-actions">
          {detail.actions.map((action) => (
            <button key={action} onClick={() => setSelectedAction(action)}>{action}</button>
          ))}
        </div>
        {selectedAction && (
          <div className="action-result">
            <strong>{selectedAction}</strong>
            <span>Action selected. In production this would create an operator workflow item and write an audit log entry.</span>
          </div>
        )}
      </section>
    </aside>
  );
}

function metricDetail(title: string, value: number, note: string): Detail {
  return {
    title,
    kicker: "Dashboard metric",
    fields: [["Current value", value.toLocaleString()], ["Source", "Main sportsbook API"], ["Status", "Readable"]],
    actions: ["Open related page", "Export metric snapshot", "Add operator note"],
    note,
  };
}

function userDetail(user: {id: string; username: string}, index: number): Detail {
  return {
    title: `User profile · ${user.username}`,
    kicker: "Users",
    fields: [["User ID", user.id], ["Username", user.username], ["Session", "Active"], ["Game saves", index % 3 === 0 ? "Tournament + League" : "Tournament"], ["Risk status", index % 4 === 0 ? "Review recommended" : "Normal"]],
    actions: ["Freeze account", "Add KYC memo", "Export user activity", "Open wallet ledger"],
    note: "This panel is the operator view for account review. Balance-changing actions should only be enabled after persistent database workflows are connected.",
  };
}

function depositDetail(item: typeof depositQueue[number]): Detail {
  return {
    title: `Deposit review · ${item.id}`,
    kicker: "Deposits",
    fields: [["User", item.user], ["Amount", `$${item.amount.toLocaleString()}`], ["Chain", item.chain], ["Transaction", item.tx], ["Confirmations", item.confirmations], ["Status", item.status], ["Age", item.age]],
    actions: ["Mark as verified", "Request proof", "Hold for review", "Create audit note"],
    note: "Credit user balance only after the platform wallet has actually received the USDT transfer.",
  };
}

function withdrawalDetail(item: typeof withdrawalQueue[number]): Detail {
  return {
    title: `Withdrawal case · ${item.id}`,
    kicker: "Withdrawals",
    fields: [["User", item.user], ["Amount", `$${item.amount.toLocaleString()}`], ["Wallet", item.wallet], ["Risk", item.risk], ["Operator note", item.note], ["Minimum withdrawal", "$50 USDT"]],
    actions: ["Contact customer service", "Approve after review", "Hold payout", "Escalate to risk"],
    note: "Withdrawals are intentionally manual here: customer service confirmation and risk review protect platform funds before payout.",
  };
}

function riskDetail(item: typeof riskEvents[number]): Detail {
  return {
    title: `Risk case · ${item.id}`,
    kicker: "Risk Review",
    fields: [["Severity", item.severity], ["User", item.user], ["Signal", item.signal], ["Required action", item.action], ["Case owner", "Admin desk"]],
    actions: ["Open investigation", "Apply temporary limit", "Hold wallet actions", "Clear with note"],
    note: "Use this view to document the risk decision before changing account limits or wallet access.",
  };
}

function bonusDetail(item: typeof bonusRules[number]): Detail {
  return {
    title: `Bonus rule · ${item.name}`,
    kicker: "Bonus Controls",
    fields: [["Program", item.name], ["Value", item.value], ["Limit", item.limit], ["Status", item.status], ["Wagering check", "Required before withdrawal"]],
    actions: ["Edit rule", "Pause promotion", "Duplicate campaign", "View affected users"],
    note: "Bonus rules displayed here are operator-facing controls for promotions and loyalty programs.",
  };
}

function auditDetail(item: typeof auditLogs[number]): Detail {
  return {
    title: `Audit event · ${item.result}`,
    kicker: "Audit Logs",
    fields: [["Time", item.time], ["Actor", item.actor], ["Action", item.action], ["Result", item.result], ["Retention", "Operational log"]],
    actions: ["Copy audit entry", "Attach note", "Open related record"],
    note: "Audit rows provide a visible activity trail for operator and system actions.",
  };
}

function controlDetail(title: string, section: string, note: string): Detail {
  return {
    title,
    kicker: section,
    fields: [["Control", title], ["Scope", section], ["Mode", "Operator workflow"], ["Status", "Ready for review"]],
    actions: ["Open workflow", "Add internal note", "Create audit event"],
    note,
  };
}

function policyDetail(title: string, value: string): Detail {
  return {
    title,
    kicker: "Payout policy",
    fields: [["Policy", title], ["Current value", value], ["Applies to", "All withdrawal requests"], ["Review type", "Manual"]],
    actions: ["Edit policy", "View affected withdrawals", "Create audit note"],
    note: "This policy is shown to operators before payout decisions are made.",
  };
}
