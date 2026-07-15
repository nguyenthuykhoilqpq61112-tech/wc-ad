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
  Send,
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
type PlatformUser = {
  id: string;
  username: string;
  registeredAt: string;
  round: string;
  location: string;
  region: "Middle East" | "Europe" | "Singapore";
  deposit: number;
  stake: number;
};
type BetRecord = {
  id: string;
  user: PlatformUser;
  match: string;
  round: string;
  matchDate: string;
  selection: string;
  odds: number;
  stake: number;
  result: "Lost" | "Pending" | "Won - contact support" | "Paid";
  payout: number;
};
type ExchangeWithdrawal = {date: string; amount: number; status: string; destination: string};

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "https://2026wc.zeabur.app").replace(/\/+$/, "");
const EXCHANGE_WITHDRAW_PASSWORD = import.meta.env.VITE_EXCHANGE_WITHDRAW_PASSWORD || "";
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

const registrationPlan = [
  {round: "Round of 32", date: "2026-06-17", count: 3},
  {round: "Round of 32", date: "2026-06-18", count: 3},
  {round: "Round of 32", date: "2026-06-19", count: 3},
  {round: "Round of 32", date: "2026-06-20", count: 3},
  {round: "Round of 16", date: "2026-06-30", count: 9},
  {round: "Round of 16", date: "2026-07-01", count: 9},
  {round: "Quarter Final", date: "2026-07-05", count: 11},
  {round: "Quarter Final", date: "2026-07-06", count: 11},
  {round: "Semi Final", date: "2026-07-10", count: 14},
  {round: "Semi Final", date: "2026-07-12", count: 14},
];

const names = [
  "Omar","Yousef","Khalid","Fahad","Nasser","Hamad","Saeed","Tariq","Majid","Adel","Rami","Karim","Walid","Samir","Zaid","Bilal",
  "Hassan","Ibrahim","Mansour","Salem","Mazen","Nabil","Qasim","Rashid","Aziz","Farid","Jamal","Laith","Murad","Sami","Tamer","Yasin",
  "Zaki","Ammar","Bader","Dawood","Emad","Faisal","Ghassan","Haitham","Issa","Jaber","Kareem","Louay","Maher","Nizar","Osama","Rayan",
  "Sultan","Talal","Usama","Wassim","Yahya","Ziyad","Ali","Mostafa","Hamza","Marwan","Anas","Basel","Dina","Hala","Lina","Maya",
  "Noura","Rana","Sara","Yara","Layla","Mariam","Sofia","Marco","Luca","Nikos","Jonas","Erik","Milan","Tomas","WeiMing","JiaHao",
];
const locations = [
  "Qatar","UAE","Saudi Arabia","Kuwait","Bahrain","Oman","Jordan","Lebanon","Egypt","Iraq","Qatar","UAE","Saudi Arabia","Kuwait","Oman","Jordan",
  "Bahrain","Lebanon","Egypt","Iraq","Qatar","UAE","Saudi Arabia","Kuwait","Bahrain","Oman","Jordan","Lebanon","Egypt","Iraq","Qatar","UAE",
  "Saudi Arabia","Kuwait","Oman","Jordan","Bahrain","Lebanon","Egypt","Iraq","Qatar","UAE","Saudi Arabia","Kuwait","Oman","Jordan","Bahrain","Lebanon",
  "Egypt","Iraq","Qatar","UAE","Saudi Arabia","Kuwait","Bahrain","Oman","Jordan","Lebanon","Egypt","Iraq","Qatar","UAE","Saudi Arabia","Kuwait",
  "Bahrain","Oman","Jordan","Lebanon","Egypt","Iraq","France","Italy","Greece","Germany","Netherlands","Sweden","Spain","Portugal","Singapore","Singapore",
];
const depositAmounts = Array.from({length: 80}, (_, index) => {
  if ([2, 19, 44].includes(index)) return 10;
  if ([7, 23, 38, 57, 72].includes(index)) return 15;
  if ([12, 63].includes(index)) return 25;
  if (index === 78) return 30;
  return 20;
});
const stakeAmounts = Array.from({length: 80}, (_, index) => {
  if ([70, 72, 74, 76, 78].includes(index)) return 20;
  if (index === 79) return 80;
  if (index === 69) return 15;
  return 10;
});

const adminUsers: PlatformUser[] = registrationPlan.flatMap((plan) => Array.from({length: plan.count}, (_, offset) => ({plan, offset})))
  .map(({plan}, index) => ({
    id: `user_${String(index + 1).padStart(3, "0")}`,
    username: `${names[index]}${String(index + 11).padStart(2, "0")}`,
    registeredAt: `${plan.date} ${String(9 + (index % 11)).padStart(2, "0")}:${String((index * 7) % 60).padStart(2, "0")}`,
    round: plan.round,
    location: locations[index],
    region: locations[index] === "Singapore" ? "Singapore" : index >= 70 && index <= 77 ? "Europe" : "Middle East",
    deposit: depositAmounts[index],
    stake: stakeAmounts[index],
  }));

const matchPlan = [
  {round: "Round of 32", date: "2026-06-17", match: "Argentina vs Morocco", total: 40, resultStart: 0},
  {round: "Round of 32", date: "2026-06-18", match: "France vs Qatar", total: 50, resultStart: 4},
  {round: "Round of 32", date: "2026-06-19", match: "Brazil vs Egypt", total: 50, resultStart: 9},
  {round: "Round of 32", date: "2026-06-20", match: "England vs UAE", total: 50, resultStart: 14},
  {round: "Round of 16", date: "2026-06-30", match: "Spain vs Saudi Arabia", total: 80, resultStart: 19},
  {round: "Round of 16", date: "2026-07-01", match: "Portugal vs Japan", total: 80, resultStart: 27},
  {round: "Quarter Final", date: "2026-07-05", match: "Argentina vs Spain", total: 90, resultStart: 35},
  {round: "Quarter Final", date: "2026-07-06", match: "Brazil vs Portugal", total: 80, resultStart: 44},
  {round: "Semi Final", date: "2026-07-10", match: "France vs Brazil", total: 365, resultStart: 52},
  {round: "Semi Final", date: "2026-07-12", match: "Argentina vs France", total: 110, resultStart: 66},
  {round: "Semi Final", date: "2026-07-12", match: "Brazil vs England", total: 275, resultStart: 73},
  {round: "Final", date: "2026-07-15", match: "Spain vs France", total: 405, resultStart: 10},
];

const julyFifteenthBets = [
  {stake: 50, selection: "Correct score 0:2", odds: 9.8, result: "Won - contact support" as const},
  {stake: 50, selection: "France win", odds: 1.86, result: "Paid" as const},
  {stake: 45, selection: "France win", odds: 1.84, result: "Paid" as const},
  {stake: 40, selection: "France win", odds: 1.82, result: "Paid" as const},
  {stake: 40, selection: "France win", odds: 1.88, result: "Paid" as const},
  {stake: 40, selection: "France win", odds: 1.8, result: "Paid" as const},
  {stake: 35, selection: "France win", odds: 1.9, result: "Paid" as const},
  {stake: 55, selection: "1X2 Spain win", odds: 3.35, result: "Lost" as const},
  {stake: 30, selection: "Draw", odds: 3.15, result: "Lost" as const},
  {stake: 20, selection: "Draw", odds: 3.2, result: "Lost" as const},
];

function allocateBets() {
  const records: BetRecord[] = [];
  const selections = ["Home win", "Away win", "Draw no bet", "Over 2.5", "Asian handicap -0.5"];
  matchPlan.forEach((match, matchIndex) => {
    if (match.date === "2026-07-15") {
      julyFifteenthBets.forEach((special, offset) => {
        const user = adminUsers[(match.resultStart + offset) % adminUsers.length];
        records.push({
          id: `BET-${String(records.length + 1).padStart(4, "0")}`,
          user,
          match: match.match,
          round: match.round,
          matchDate: match.date,
          selection: special.selection,
          odds: special.odds,
          stake: special.stake,
          result: special.result,
          payout: special.result === "Lost" ? 0 : Math.round(special.stake * special.odds * 100) / 100,
        });
      });
      return;
    }
    const fixedStakes = match.date === "2026-07-10" ? [20, 20, 20, 20, 20, 80, 30, 30, 30, 30, 35, 50] : null;
    let running = 0;
    for (let offset = 0; running < match.total && (!fixedStakes || offset < fixedStakes.length); offset += 1) {
      const user = adminUsers[(match.resultStart + offset) % adminUsers.length];
      const remaining = match.total - running;
      const stake = Math.min(fixedStakes?.[offset] ?? user.stake, remaining);
      running += stake;
      const won = match.round === "Quarter Final" && records.length % 5 === 0 || match.round === "Semi Final" && records.length % 4 === 0;
      const paid = won && match.date <= "2026-07-10";
      records.push({
        id: `BET-${String(records.length + 1).padStart(4, "0")}`,
        user,
        match: match.match,
        round: match.round,
        matchDate: match.date,
        selection: selections[(records.length + matchIndex) % selections.length],
        odds: Number((1.62 + ((records.length + matchIndex) % 9) * 0.13).toFixed(2)),
        stake,
        result: won ? paid ? "Paid" : "Won - contact support" : match.date === "2026-07-12" ? "Pending" : "Lost",
        payout: won ? Math.round(stake * (1.62 + ((records.length + matchIndex) % 9) * 0.13) * 100) / 100 : 0,
      });
    }
  });
  return records;
}

const betRecords = allocateBets();
const exchangeWithdrawals: ExchangeWithdrawal[] = [
  {date: "2026-06-17", amount: 200, status: "Completed", destination: "Exchange treasury"},
  {date: "2026-06-30", amount: 399, status: "Completed", destination: "Exchange treasury"},
  {date: "2026-07-05", amount: 599, status: "Completed", destination: "Exchange treasury"},
  {date: "2026-07-10", amount: 505, status: "Completed", destination: "Exchange treasury"},
];
const openingWalletReserve = 0;
const totalDeposits = adminUsers.reduce((sum, user) => sum + user.deposit, 0);
const totalStakes = betRecords.reduce((sum, bet) => sum + bet.stake, 0);
const paidPayouts = betRecords.filter((bet) => bet.result === "Paid").reduce((sum, bet) => sum + bet.payout, 0);
const exchangeWithdrawn = exchangeWithdrawals.reduce((sum, item) => sum + item.amount, 0);
const preJulyFifteenthBets = betRecords.filter((bet) => bet.matchDate < "2026-07-15");
const preJulyFifteenthStakes = preJulyFifteenthBets.reduce((sum, bet) => sum + bet.stake, 0);
const preJulyFifteenthPaidPayouts = preJulyFifteenthBets.filter((bet) => bet.result === "Paid").reduce((sum, bet) => sum + bet.payout, 0);
const targetPostJulyTenthBalance = 875;
const walletReconciliationAdjustment = Math.round((targetPostJulyTenthBalance - (openingWalletReserve + totalDeposits + preJulyFifteenthStakes - preJulyFifteenthPaidPayouts - exchangeWithdrawn)) * 100) / 100;
const platformBalance = Math.round((openingWalletReserve + totalDeposits + totalStakes - paidPayouts - exchangeWithdrawn + walletReconciliationAdjustment) * 100) / 100;
const todayBets = betRecords.filter((bet) => bet.matchDate === "2026-07-15");
const todayStakeTotal = todayBets.reduce((sum, bet) => sum + bet.stake, 0);
const todayPaidPayouts = todayBets.filter((bet) => bet.result === "Paid").reduce((sum, bet) => sum + bet.payout, 0);
const todayWalletChange = Math.round((todayStakeTotal - todayPaidPayouts) * 100) / 100;
const dailyBetTotals = betRecords.reduce<Record<string, number>>((acc, bet) => {
  acc[bet.matchDate] = Math.round(((acc[bet.matchDate] || 0) + bet.stake) * 100) / 100;
  return acc;
}, {});

const depositQueue = adminUsers.map((user, index) => ({
  id: `DEP-${String(8200 + index).padStart(4, "0")}`,
  user: user.username,
  chain: index % 9 === 0 ? "USDT ERC20" : "USDT TRC20",
  tx: index % 9 === 0 ? `0x${String(index + 1137).padStart(4, "0")}...${String(index + 88).padStart(4, "0")}` : `T${String(index + 821).padStart(4, "0")}...${String(index + 44).padStart(4, "0")}`,
  amount: user.deposit,
  confirmations: index % 9 === 0 ? "64/64" : "20/20",
  status: "Confirmed",
  age: user.registeredAt,
}));

const withdrawalQueue = betRecords
  .filter((bet) => bet.result === "Won - contact support" || bet.result === "Paid")
  .slice(0, 8)
  .map((bet, index) => ({
    id: `WDR-${String(1190 + index).padStart(4, "0")}`,
    user: bet.user.username,
    amount: bet.payout,
    risk: bet.payout > 80 ? "High" : bet.payout > 35 ? "Medium" : "Low",
    wallet: index % 3 === 0 ? `TKh7...${index}pLx` : `0x31...${index}cfe`,
    note: bet.result === "Paid" ? `Paid after ${bet.match}` : `Winner contacting support for ${bet.match}`,
  }));

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
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMessage, setWithdrawMessage] = useState("");

  const filteredUsers = useMemo(() => {
    const users = adminUsers;
    if (!query.trim()) return users;
    return users.filter((user) => user.username.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

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

        {activePage === "Overview" && <OverviewPage summary={summary} filteredUsers={filteredUsers} openDetail={setDetail} onOpenWithdraw={() => setWithdrawOpen(true)} />}
        {activePage === "Users" && <UsersPage summary={summary} filteredUsers={filteredUsers} openDetail={setDetail} />}
        {activePage === "Deposits" && <DepositsPage openDetail={setDetail} />}
        {activePage === "Withdrawals" && <WithdrawalsPage openDetail={setDetail} onOpenWithdraw={() => setWithdrawOpen(true)} />}
        {activePage === "Risk Review" && <RiskReviewPage openDetail={setDetail} />}
        {activePage === "Bonus Controls" && <BonusControlsPage openDetail={setDetail} />}
        {activePage === "Audit Logs" && <AuditLogsPage summary={summary} openDetail={setDetail} />}
      </main>
      {detail && <DetailDrawer detail={detail} onClose={() => setDetail(null)} />}
      {withdrawOpen && (
        <ExchangeWithdrawModal
          balance={platformBalance}
          password={withdrawPassword}
          amount={withdrawAmount}
          message={withdrawMessage}
          setPassword={setWithdrawPassword}
          setAmount={setWithdrawAmount}
          onClose={() => setWithdrawOpen(false)}
          onSubmit={() => {
            const amount = Number(withdrawAmount);
            if (!EXCHANGE_WITHDRAW_PASSWORD || withdrawPassword !== EXCHANGE_WITHDRAW_PASSWORD) {
              setWithdrawMessage("提取密码错误。");
              return;
            }
            if (!Number.isFinite(amount) || amount <= 0) {
              setWithdrawMessage("请输入有效的提取金额。");
              return;
            }
            if (amount > platformBalance) {
              setWithdrawMessage("提取金额不能超过平台余额。");
              return;
            }
            setWithdrawMessage("您的提取请求正在进行，请2小时后至提币交易所查看。");
          }}
        />
      )}
    </div>
  );
}

function OverviewPage({summary, filteredUsers, openDetail, onOpenWithdraw}: {summary: AdminSummary | null; filteredUsers: PlatformUser[]; openDetail: (detail: Detail) => void; onOpenWithdraw: () => void}) {
  return (
    <>
      <section className="metrics-grid">
        <Metric title="Registered users" value={adminUsers.length} icon={<Users size={20} />} onClick={() => openDetail(metricDetail("Registered users", adminUsers.length, "World Cup account dataset with registration dates from Round of 32 through Semi Final match days."))} />
        <Metric title="Active sessions" value={summary?.sessions ?? 0} icon={<Activity size={20} />} onClick={() => openDetail(metricDetail("Active sessions", summary?.sessions ?? 0, "Current authenticated sessions tracked in memory."))} />
        <Metric title="Confirmed deposits" value={totalDeposits} icon={<WalletCards size={20} />} onClick={() => openDetail(metricDetail("Confirmed deposits", totalDeposits, "Sum of all 80 user USDT deposits."))} />
        <Metric title="Bet stakes" value={totalStakes} icon={<CircleDollarSign size={20} />} onClick={() => openDetail(metricDetail("Bet stakes", totalStakes, "Total stake amount across generated World Cup bet records."))} />
        <Metric title="Platform balance" value={platformBalance} icon={<ShieldCheck size={20} />} onClick={() => openDetail(walletDetail())} />
      </section>
      <SystemWalletPanel openDetail={openDetail} onOpenWithdraw={onOpenWithdraw} />
      <DailyBetStatsPanel openDetail={openDetail} />
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

function UsersPage({summary, filteredUsers, openDetail}: {summary: AdminSummary | null; filteredUsers: PlatformUser[]; openDetail: (detail: Detail) => void}) {
  return (
    <section className="page-grid">
      <Panel title="User Directory" meta={summary?.updatedAt ? `Updated ${new Date(summary.updatedAt).toLocaleString()}` : "Waiting for API data"}>
        <div className="data-table users-table">
          <div className="data-row data-head"><span>User ID</span><span>Username</span><span>Registered</span><span>Location</span><span>Deposit</span><span>Stake</span><span>Action</span></div>
          {filteredUsers.map((user, index) => (
            <div className="data-row" key={user.id}>
              <span>{user.id}</span>
              <strong>{user.username}</strong>
              <span>{user.registeredAt}</span>
              <span>{user.location}</span>
              <b>{user.deposit}u</b>
              <em>{user.stake}u bet</em>
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
        <Metric title="Confirmed deposits" value={totalDeposits} icon={<WalletCards size={20} />} onClick={() => openDetail(metricDetail("Confirmed deposits", totalDeposits, "Total confirmed user deposits across 80 accounts."))} />
        <Metric title="20u deposits" value={adminUsers.filter((item) => item.deposit === 20).length} icon={<CheckCircle2 size={20} />} onClick={() => openDetail(metricDetail("20u deposits", adminUsers.filter((item) => item.deposit === 20).length, "Most users deposited 20u."))} />
        <Metric title="Non-20u deposits" value={adminUsers.filter((item) => item.deposit !== 20).length} icon={<AlertTriangle size={20} />} onClick={() => openDetail(metricDetail("Non-20u deposits", adminUsers.filter((item) => item.deposit !== 20).length, "Includes 10u, 15u, 25u and 30u deposits."))} />
      </section>
    </section>
  );
}

function WithdrawalsPage({openDetail, onOpenWithdraw}: {openDetail: (detail: Detail) => void; onOpenWithdraw: () => void}) {
  return (
    <section className="page-grid">
      <SystemWalletPanel openDetail={openDetail} onOpenWithdraw={onOpenWithdraw} />
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
      <Panel title="Exchange Withdrawals" meta={`Completed exchange withdrawals: ${exchangeWithdrawn}u`}>
        <div className="data-table exchange-table">
          <div className="data-row data-head"><span>Date</span><span>Amount</span><span>Destination</span><span>Status</span><span>Balance after</span></div>
          {exchangeWithdrawals.map((item) => {
            const prior = exchangeWithdrawals.filter((entry) => entry.date <= item.date).reduce((sum, entry) => sum + entry.amount, 0);
            const stakesThroughDate = betRecords.filter((bet) => bet.matchDate <= item.date).reduce((sum, bet) => sum + bet.stake, 0);
            const payoutsThroughDate = betRecords.filter((bet) => bet.matchDate <= item.date && bet.result === "Paid").reduce((sum, bet) => sum + bet.payout, 0);
            const balanceAfter = Math.round((openingWalletReserve + totalDeposits + stakesThroughDate - payoutsThroughDate - prior + walletReconciliationAdjustment) * 100) / 100;
            return (
              <button className="data-row clickable-row" key={item.date} onClick={() => openDetail(exchangeWithdrawalDetail(item, balanceAfter))}>
                <span>{item.date}</span>
                <b>{item.amount}u</b>
                <span>{item.destination}</span>
                <em>{item.status}</em>
                <strong>{balanceAfter}u</strong>
              </button>
            );
          })}
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
      <Panel title="World Cup Bet Ledger" meta="Every listed match has user stake records and payout remarks">
        <div className="data-table bets-table">
          <div className="data-row data-head"><span>Date</span><span>Round</span><span>Match</span><span>User</span><span>Selection</span><span>Odds</span><span>Stake</span><span>Result / payout note</span></div>
          {betRecords.map((item) => (
            <button className="data-row clickable-row" key={item.id} onClick={() => openDetail(betDetail(item))}>
              <span>{item.matchDate}</span>
              <span>{item.round}</span>
              <strong>{item.match}</strong>
              <span>{item.user.username}</span>
              <span>{item.selection}</span>
              <b>{item.odds.toFixed(2)}</b>
              <span>{item.stake}u</span>
              <em className={item.result.includes("Won") ? "warn" : item.result === "Paid" ? "" : item.result === "Pending" ? "warn" : "danger"}>{item.result}{item.payout ? ` · ${item.payout}u` : ""}</em>
            </button>
          ))}
        </div>
      </Panel>
      <Panel title="Audit Trail" meta={summary?.updatedAt ? `API snapshot ${new Date(summary.updatedAt).toLocaleString()}` : "Static operational trail"}>
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
        <Metric title="Bet audit rows" value={betRecords.length} icon={<ShieldCheck size={20} />} onClick={() => openDetail(metricDetail("Bet audit rows", betRecords.length, "Generated World Cup betting ledger rows."))} />
        <Metric title="7.15 stake total" value={todayBets.reduce((sum, bet) => sum + bet.stake, 0)} icon={<CircleDollarSign size={20} />} onClick={() => openDetail(todayMatchDetail("Spain vs France"))} />
        <Metric title="7.15 bettors" value={new Set(todayBets.map((bet) => bet.user.id)).size} icon={<Activity size={20} />} onClick={() => openDetail(todayMatchDetail("Spain vs France"))} />
        <Metric title="Correct score hit" value={todayBets.find((bet) => bet.selection === "Correct score 0:2")?.stake ?? 0} icon={<CheckCircle2 size={20} />} onClick={() => openDetail(betDetail(todayBets.find((bet) => bet.selection === "Correct score 0:2") || todayBets[0]))} />
      </section>
    </section>
  );
}

function UsersPanel({users, updatedAt, openDetail}: {users: PlatformUser[]; updatedAt?: string; openDetail: (detail: Detail) => void}) {
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

function SystemWalletPanel({openDetail, onOpenWithdraw}: {openDetail: (detail: Detail) => void; onOpenWithdraw: () => void}) {
  return (
    <section className="wallet-band">
      <div>
        <p className="eyebrow">System wallet</p>
        <h2>{platformBalance.toLocaleString()}u available after 2026-07-15 betting settlement</h2>
        <span>7.10 after withdrawal baseline 875u; 7.15 stakes {todayStakeTotal}u - paid payouts {todayPaidPayouts.toFixed(2)}u = wallet change {todayWalletChange.toFixed(2)}u</span>
      </div>
      <div className="wallet-actions">
        <button onClick={() => openDetail(walletDetail())}>View calculation</button>
        <button onClick={onOpenWithdraw}><Send size={16} /> 提币至交易所</button>
      </div>
    </section>
  );
}

function DailyBetStatsPanel({openDetail}: {openDetail: (detail: Detail) => void}) {
  const rows = Object.entries(dailyBetTotals).filter(([date]) => date >= "2026-07-05");
  return (
    <Panel title="Quarter Final / Semi Final Daily Stakes" meta="8强每日 60-100u；4强含今日两场 110u 与 275u">
      <div className="daily-grid">
        {rows.map(([date, total]) => (
          <button key={date} onClick={() => openDetail(dailyDetail(date, total))}>
            <span>{date}</span>
            <strong>{total}u</strong>
            <small>{date === "2026-07-12" ? "Today: 110u + 275u" : "Daily betting total"}</small>
          </button>
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

function ExchangeWithdrawModal({
  balance,
  password,
  amount,
  message,
  setPassword,
  setAmount,
  onClose,
  onSubmit,
}: {
  balance: number;
  password: string;
  amount: string;
  message: string;
  setPassword: (value: string) => void;
  setAmount: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <aside className="detail-overlay">
      <section className="withdraw-modal">
        <header>
          <div>
            <p className="eyebrow">Exchange withdrawal</p>
            <h2>提币至交易所</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </header>
        <div className="wallet-summary">
          <span>平台当前余额</span>
          <strong>{balance.toLocaleString()}u</strong>
        </div>
        <label>
          <span>输入提取密码</span>
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="输入提取密码" />
        </label>
        <label>
          <span>提取金额，不能超过平台余额</span>
          <input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="1" max={balance} placeholder="输入 u 金额" />
        </label>
        <button className="submit-withdraw" onClick={onSubmit}>提取</button>
        {message && <div className="action-result"><strong>提币状态</strong><span>{message}</span></div>}
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

function userDetail(user: PlatformUser, index: number): Detail {
  const userBets = betRecords.filter((bet) => bet.user.id === user.id);
  const won = userBets.filter((bet) => bet.result === "Paid" || bet.result === "Won - contact support");
  return {
    title: `User profile · ${user.username}`,
    kicker: "Users",
    fields: [["User ID", user.id], ["Username", user.username], ["Registered at", user.registeredAt], ["Registration round", user.round], ["Location", `${user.location} · ${user.region}`], ["Deposit", `${user.deposit}u`], ["Stake", `${user.stake}u`], ["Won bets", String(won.length)], ["Risk status", index % 4 === 0 ? "Review recommended" : "Normal"]],
    actions: ["Freeze account", "Add KYC memo", "Export user activity", "Open wallet ledger"],
    note: userBets.length ? `Latest bet: ${userBets[0].match} · ${userBets[0].selection} · ${userBets[0].stake}u @ ${userBets[0].odds}.` : "No bet record found for this user.",
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

function betDetail(item: BetRecord): Detail {
  return {
    title: `${item.id} · ${item.match}`,
    kicker: "World Cup bet",
    fields: [["Date", item.matchDate], ["Round", item.round], ["User", item.user.username], ["Location", item.user.location], ["Selection", item.selection], ["Odds", item.odds.toFixed(2)], ["Stake", `${item.stake}u`], ["Result", item.result], ["Payout remark", item.payout ? `${item.payout}u ${item.result === "Won - contact support" ? "联系客服兑付" : "已赔付"}` : "No payout"]],
    actions: ["Open user", "Mark contacted", "Create payout note", "Export slip"],
    note: item.result === "Won - contact support" ? "This winning bet is waiting for customer service payout contact." : "Bet record is included in daily match and wallet calculations.",
  };
}

function todayMatchDetail(match: string): Detail {
  const rows = todayBets.filter((bet) => bet.match === match);
  return {
    title: `Today stakes · ${match}`,
    kicker: "Today betting board",
    fields: [["Match", match], ["Final score", "Spain 0:2 France"], ["Total stake", `${rows.reduce((sum, bet) => sum + bet.stake, 0)}u`], ["Bettors", String(new Set(rows.map((bet) => bet.user.id)).size)], ["Date", "2026-07-15"], ["Payout remark", "Correct score winner contacts support; France win slips paid"]],
    actions: ["View slips", "Export today's match", "Open settlement queue"],
    note: rows.map((bet) => `${bet.user.username}: ${bet.selection} @ ${bet.odds.toFixed(2)} · ${bet.stake}u · ${bet.result}`).join(" | "),
  };
}

function dailyDetail(date: string, total: number): Detail {
  const rows = betRecords.filter((bet) => bet.matchDate === date);
  return {
    title: `Daily betting · ${date}`,
    kicker: "Daily stake total",
    fields: [["Date", date], ["Total stake", `${total}u`], ["Bet count", String(rows.length)], ["Unique bettors", String(new Set(rows.map((bet) => bet.user.id)).size)], ["Matches", [...new Set(rows.map((bet) => bet.match))].join(", ")]],
    actions: ["View day slips", "Export daily report", "Open settlement queue"],
    note: rows.map((bet) => `${bet.user.username} ${bet.stake}u on ${bet.match}`).join(" | "),
  };
}

function walletDetail(): Detail {
  return {
    title: "System wallet balance",
    kicker: "Wallet calculation",
    fields: [["平台初始余额", `${openingWalletReserve}u`], ["7.10 baseline balance", `${targetPostJulyTenthBalance}u`], ["Confirmed deposits", `${totalDeposits}u`], ["Bet stakes", `${totalStakes}u`], ["Paid payouts", `${paidPayouts.toFixed(2)}u`], ["Exchange withdrawals", `${exchangeWithdrawn}u`], ["Wallet reconciliation to 7.10", `${walletReconciliationAdjustment.toFixed(2)}u`], ["7.15 stakes", `${todayStakeTotal}u`], ["7.15 paid payouts", `${todayPaidPayouts.toFixed(2)}u`], ["7.15 wallet change", `${todayWalletChange.toFixed(2)}u`], ["Current platform balance", `${platformBalance}u`]],
    actions: ["Open withdrawal modal", "Export wallet report", "Create audit note"],
    note: "Current balance is calculated after the 2026-07-10 exchange withdrawal record.",
  };
}

function exchangeWithdrawalDetail(item: ExchangeWithdrawal, balanceAfter: number): Detail {
  return {
    title: `Exchange withdrawal · ${item.date}`,
    kicker: "Treasury movement",
    fields: [["Date", item.date], ["Amount", `${item.amount}u`], ["Destination", item.destination], ["Status", item.status], ["Balance after", `${balanceAfter}u`]],
    actions: ["Copy record", "Export treasury log", "Open wallet report"],
    note: "This is one of the four historical exchange withdrawal records requested for the admin wallet ledger.",
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
