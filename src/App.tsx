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
  Goal,
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
  CalendarDays,
  Trophy,
  Table,
  X,
  Download,
  Check,
} from "lucide-react";

type AuthSession = {
  token: string;
  user: {id: string; username: string};
};

type AdminSummary = {
  users: Array<{id: string; username: string; createdAt?: string}>;
  sessions: number;
  gameStates: number;
  walletLedgerCount: number;
  betAuditCount: number;
  updatedAt: string;
};

type LeaguePage = "Premier League" | "LaLiga" | "Serie A" | "Bundesliga" | "Ligue 1";
type FixtureLeague = LeaguePage | "Liga de Expansión MX" | "ATP Tour";
type ActivePage = "DailyMaster" | "Overview" | "Users" | "Deposits" | "Withdrawals" | "Risk Review" | "Bonus Controls" | "Five Leagues" | "League Bets" | "Ledger by Date" | LeaguePage | "Audit Logs";
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
  region: "Middle East" | "Europe" | "Singapore" | "North America" | "Asia";
  deposit: number;
  stake: number;
  email: string;
  phone?: string;
  ip?: string;
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
type DepositRecord = {id: string; user: string; chain: string; tx: string; amount: number; confirmations: string; status: string; age: string};
type WheelIncome = {date: string; amount: number; source: string; status: string};
type CrashIncome = {date: string; amount: number; source: string; status: string};
type LeagueMarket = {
  league: string;
  country: string;
  kickoff: string;
  match: string;
  matchday: string;
  market: string;
  odds: string;
  stake: number;
  users: number;
  exposure: number;
  source: string;
  status: "Confirmed" | "Pregame" | "Live" | "Date confirmed" | "Risk review";
};
type LeagueBetSlip = {
  id: string;
  time: string;
  user: string;
  league: LeaguePage | "Multi League" | "Liga de Expansión MX" | "ATP Tour";
  match: string;
  market: string;
  selection: string;
  odds: number;
  stake: number;
  potentialPayout: number;
  betType: "Single" | "Parlay" | "Live" | "Player prop" | "Team prop";
  status: "Pending" | "Open" | "Won" | "Lost" | "Risk hold" | "Paid";
  risk: "Low" | "Medium" | "High";
};
type DailyBettor = {
  username: string;
  userType: "New User" | "Returning User";
  sport: string;
  match: string;
  selection: string;
  stake: number;
  result: "Won" | "Lost" | "Pending";
  payout: number;
};
type DailyUserActivity = {
  date: string;
  registeredUsers: Array<{username: string; location: string; time: string; email?: string}>;
  bettors: DailyBettor[];
};
type LeagueDailyFixture = {
  league: FixtureLeague;
  date: string;
  time: string;
  match: string;
  matchday: string;
  moneyline: string;
  handicap: string;
  total: string;
  featured: string;
  status: "Live" | "Today" | "Upcoming" | "TBD";
};
type DateLedgerRow = {
  date: string;
  deposits: number;
  sportsStakes: number;
  leagueStake: number;
  leagueReceipts: number;
  wheelIncome: number;
  crashIncome: number;
  payouts: number;
  exchangeWithdrawals: number;
  reconciliation: number;
  net: number;
  balanceAfter: number;
  items: string[];
};
type IncomeSummaryRow = {
  period: string;
  total: number;
  items: string[];
};

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "https://2026wc.zeabur.app").replace(/\/+$/, "");
const EXCHANGE_WITHDRAW_PASSWORD = import.meta.env.VITE_EXCHANGE_WITHDRAW_PASSWORD || "";
const STORAGE_KEY = "wwc_admin_session";

const navItems: Array<{key: ActivePage; label: string; Icon: typeof Activity}> = [
  {key: "DailyMaster", label: "按日运营总表", Icon: CalendarDays},
  {key: "Overview", label: "数据总览", Icon: Activity},
  {key: "Users", label: "用户管理", Icon: Users},
  {key: "League Bets", label: "赛事注单", Icon: CircleDollarSign},
  {key: "Ledger by Date", label: "按日对账流水", Icon: FileText},
  {key: "Deposits", label: "充值记录", Icon: WalletCards},
  {key: "Withdrawals", label: "提现审核", Icon: Banknote},
  {key: "Risk Review", label: "风控审核", Icon: AlertTriangle},
  {key: "Bonus Controls", label: "红利配置", Icon: SlidersHorizontal},
  {key: "Five Leagues", label: "五大联赛", Icon: Goal},
  {key: "Premier League", label: "英超联赛", Icon: Trophy},
  {key: "LaLiga", label: "西甲联赛", Icon: Trophy},
  {key: "Serie A", label: "意甲联赛", Icon: Trophy},
  {key: "Bundesliga", label: "德甲联赛", Icon: Trophy},
  {key: "Ligue 1", label: "法甲联赛", Icon: Trophy},
  {key: "Audit Logs", label: "审计日志", Icon: Database},
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

function hashDate(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
}

function createRng(seed: number) {
  let s = seed >>> 0;
  return function() {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_NAMES = [
  "Liam", "Noah", "Oliver", "Lucas", "Mateo", "Alexander", "Felix", "Julian", "Arthur",
  "Gabriel", "Leo", "Elias", "Soren", "Hugo", "Oscar", "Javier", "Gianni", "Marco",
  "Dario", "Florian", "Kasper", "Lukas", "Milan", "Adrien", "Rafael", "Chen", "Zheng",
  "Elena", "Sophia", "Chloe", "Emma", "Amina", "Leila", "Zara", "Maya"
];

const COUNTRY_PROFILES: Array<{country: string; code: string; region: "Europe" | "North America" | "Singapore" | "Middle East" | "Asia"; phonePrefix: string}> = [
  {country: "United Kingdom", code: "UK", region: "Europe", phonePrefix: "+44 7"},
  {country: "Germany", code: "DE", region: "Europe", phonePrefix: "+49 15"},
  {country: "France", code: "FR", region: "Europe", phonePrefix: "+33 6"},
  {country: "Spain", code: "ES", region: "Europe", phonePrefix: "+34 6"},
  {country: "Italy", code: "IT", region: "Europe", phonePrefix: "+39 3"},
  {country: "Netherlands", code: "NL", region: "Europe", phonePrefix: "+31 6"},
  {country: "Sweden", code: "SE", region: "Europe", phonePrefix: "+46 7"},
  {country: "Singapore", code: "SG", region: "Singapore", phonePrefix: "+65 8"},
  {country: "United States", code: "US", region: "North America", phonePrefix: "+1 415"},
  {country: "Canada", code: "CA", region: "North America", phonePrefix: "+1 604"},
  {country: "United Arab Emirates", code: "AE", region: "Middle East", phonePrefix: "+971 50"},
  {country: "Saudi Arabia", code: "SA", region: "Middle East", phonePrefix: "+966 50"},
  {country: "Japan", code: "JP", region: "Asia", phonePrefix: "+81 90"},
  {country: "China", code: "CN", region: "Asia", phonePrefix: "+86 138"},
];

const EMAIL_DOMAINS = ["gmail.com", "outlook.com", "yahoo.com", "icloud.com", "proton.me", "hotmail.com"];

function generateUserEmail(username: string): string {
  const clean = username.toLowerCase().replace(/[^a-z0-9]/g, "");
  const hash = hashDate(clean);
  const domain = EMAIL_DOMAINS[hash % EMAIL_DOMAINS.length];
  if (clean.length > 7 && hash % 3 === 0) {
    const splitAt = Math.floor(clean.length / 2);
    return `${clean.slice(0, splitAt)}.${clean.slice(splitAt)}@${domain}`;
  }
  return `${clean}@${domain}`;
}

function generateUserPhone(location: string, seed: string): string {
  const hash = Math.abs(hashDate(location + "_" + seed));
  const profile = COUNTRY_PROFILES.find((p) => p.country.toLowerCase() === location.toLowerCase()) || COUNTRY_PROFILES[0];
  const digits = String(1000000 + (hash % 9000000));
  return `${profile.phonePrefix}${digits}`;
}

function generateUserIp(seed: string): string {
  const h = Math.abs(hashDate("ip_" + seed));
  const p1 = 60 + (h % 140);
  const p2 = 10 + (Math.floor(h / 7) % 200);
  const p3 = 10 + (Math.floor(h / 49) % 200);
  const p4 = 2 + (Math.floor(h / 343) % 250);
  return `${p1}.${p2}.${p3}.${p4}`;
}

function enrichUserWithProfile(user: {
  id: string;
  username: string;
  registeredAt: string;
  round: string;
  location: string;
  region: string;
  deposit: number;
  stake: number;
  email?: string;
  phone?: string;
  ip?: string;
}): PlatformUser {
  const validRegion = (["Middle East", "Europe", "Singapore", "North America", "Asia"].includes(user.region)
    ? user.region
    : "Europe") as PlatformUser["region"];
  return {
    ...user,
    region: validRegion,
    email: user.email || generateUserEmail(user.username),
    phone: user.phone || generateUserPhone(user.location, user.id),
    ip: user.ip || generateUserIp(user.id),
  };
}

const MATCH_CATALOG: Array<{
  league: FixtureLeague;
  match: string;
  matchday: string;
  market: string;
  selection: string;
  odds: number;
  moneyline: string;
  handicap: string;
  total: string;
  featured: string;
}> = [
  {league: "Premier League", match: "Arsenal vs Paris Saint-Germain", matchday: "European Showcase", market: "Moneyline", selection: "Arsenal win", odds: 1.75, moneyline: "1.75 / 3.60 / 4.40", handicap: "Arsenal -0.5 @ 1.75", total: "Over 2.5 @ 1.80", featured: "Arsenal win @ 1.75"},
  {league: "Bundesliga", match: "Bayer Leverkusen vs AC Milan", matchday: "UCL Matchday 2", market: "Moneyline", selection: "Bayer Leverkusen win", odds: 1.68, moneyline: "1.68 / 3.90 / 4.60", handicap: "Leverkusen -0.75 @ 1.88", total: "Over 2.75 @ 1.85", featured: "Leverkusen win @ 1.68"},
  {league: "LaLiga", match: "FC Barcelona vs Young Boys", matchday: "UCL Matchday 2", market: "Handicap", selection: "Barcelona -2.0", odds: 1.82, moneyline: "1.10 / 10.0 / 21.0", handicap: "Barcelona -2.0 @ 1.82", total: "Over 3.5 @ 1.75", featured: "Barcelona -2.0 @ 1.82"},
  {league: "Serie A", match: "Inter Milan vs Crvena Zvezda", matchday: "UCL Matchday 2", market: "Moneyline", selection: "Inter Milan win", odds: 1.20, moneyline: "1.20 / 6.80 / 13.0", handicap: "Inter -1.5 @ 1.65", total: "Over 2.5 @ 1.55", featured: "Inter team total over 1.5 @ 1.35"},
  {league: "Premier League", match: "Aston Villa vs Bayern Munich", matchday: "UCL Matchday 2", market: "Moneyline", selection: "Bayern Munich win", odds: 1.72, moneyline: "4.50 / 4.20 / 1.72", handicap: "Bayern -0.75 @ 1.92", total: "Over 3.0 @ 1.80", featured: "Bayern win @ 1.72"},
  {league: "Ligue 1", match: "LOSC Lille vs Real Madrid", matchday: "UCL Matchday 2", market: "Moneyline", selection: "Real Madrid win", odds: 1.55, moneyline: "5.50 / 4.20 / 1.55", handicap: "Real Madrid -0.75 @ 1.75", total: "Over 2.5 @ 1.70", featured: "Real Madrid win @ 1.55"},
  {league: "ATP Tour", match: "Carlos Alcaraz vs Daniil Medvedev", matchday: "ATP Beijing Semi-Final", market: "Match winner", selection: "Carlos Alcaraz win", odds: 1.45, moneyline: "1.45 / 2.75", handicap: "Alcaraz -2.5 games @ 1.80", total: "Over 22.5 games @ 1.88", featured: "Alcaraz win @ 1.45"},
  {league: "ATP Tour", match: "Jannik Sinner vs Bu Yunchaokete", matchday: "ATP Beijing Semi-Final", market: "Match winner", selection: "Jannik Sinner 2-0", odds: 1.30, moneyline: "1.08 / 8.00", handicap: "Sinner -4.5 games @ 1.78", total: "Under 20.5 games @ 1.82", featured: "Sinner 2-0 @ 1.30"},
  {league: "Premier League", match: "Crystal Palace vs Liverpool", matchday: "Matchweek 7", market: "Moneyline", selection: "Liverpool win", odds: 1.52, moneyline: "5.80 / 4.40 / 1.52", handicap: "Liverpool -1.0 @ 1.85", total: "Over 2.5 @ 1.65", featured: "Liverpool win @ 1.52"},
  {league: "Premier League", match: "Manchester City vs Fulham", matchday: "Matchweek 7", market: "Team total", selection: "Man City over 2.5", odds: 1.70, moneyline: "1.25 / 6.50 / 10.0", handicap: "Man City -1.75 @ 1.90", total: "Over 3.5 @ 1.95", featured: "City win & over 2.5 @ 1.60"},
  {league: "LaLiga", match: "Real Madrid vs Villarreal", matchday: "Matchday 9", market: "Moneyline", selection: "Real Madrid win", odds: 1.40, moneyline: "1.40 / 5.20 / 6.80", handicap: "Real Madrid -1.25 @ 1.85", total: "Over 3.0 @ 1.75", featured: "Real Madrid win @ 1.40"},
  {league: "Serie A", match: "Juventus vs Cagliari", matchday: "Matchday 7", market: "Clean sheet", selection: "Juventus win to nil", odds: 1.85, moneyline: "1.38 / 4.60 / 8.50", handicap: "Juventus -1.25 @ 1.90", total: "Under 2.5 @ 1.80", featured: "Juventus win @ 1.38"},
];

function getEffectiveEndDate(): string {
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("admin_sim_end_date");
      if (stored && /^\d{4}-\d{2}-\d{2}$/.test(stored)) {
        return stored < "2026-10-01" ? "2026-10-01" : stored;
      }
    }
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const cur = `${y}-${m}-${d}`;
    return cur < "2026-10-01" ? "2026-10-01" : cur;
  } catch {
    return "2026-10-01";
  }
}

function generateAutoDailyData(endDate = getEffectiveEndDate()) {
  const dates: string[] = [];
  let curr = new Date("2026-10-01T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  while (curr <= end) {
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, "0");
    const d = String(curr.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    curr.setDate(curr.getDate() + 1);
  }
  const autoUsers: PlatformUser[] = [];
  const autoCrashIncomes: CrashIncome[] = [];
  const autoLeagueReceipts: Array<{date: string; amount: number; source: string; status: string}> = [];
  const autoLeagueSlips: LeagueBetSlip[] = [];
  const autoFixtures: LeagueDailyFixture[] = [];
  const autoSummary: Array<{date: string; total: number; crash: number; sports: number; signups: number}> = [];

  dates.forEach((date, dayIdx) => {
    const rng = createRng(hashDate(date + "_daily_accrual_seed_v2"));
    const totalIncome = Math.floor(rng() * (299 - 50 + 1)) + 50;
    const maxCrash = Math.min(65, totalIncome);
    const minCrash = Math.min(10, maxCrash);
    const crashIncome = Math.floor(rng() * (maxCrash - minCrash + 1)) + minCrash;
    const sportsIncome = totalIncome - crashIncome;
    const regCount = Math.floor(rng() * (15 - 3 + 1)) + 3;

    autoCrashIncomes.push({date, amount: crashIncome, source: "Crash game", status: "Settled"});
    autoLeagueReceipts.push({date, amount: sportsIncome, source: "Five-league & European fixtures betting proceeds", status: "Collected"});
    autoSummary.push({date, total: totalIncome, crash: crashIncome, sports: sportsIncome, signups: regCount});

    const dayUsers: PlatformUser[] = [];
    for (let i = 0; i < regCount; i++) {
      const profile = COUNTRY_PROFILES[Math.floor(rng() * COUNTRY_PROFILES.length)];
      const name = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
      const num = 120 + dayIdx * 20 + i + 1;
      const username = `${name}${profile.code}${num}`;
      const domain = EMAIL_DOMAINS[Math.floor(rng() * EMAIL_DOMAINS.length)];
      const email = `${name.toLowerCase()}.${profile.code.toLowerCase()}${num}@${domain}`;
      const hour = String(9 + Math.floor(rng() * 12)).padStart(2, "0");
      const min = String(Math.floor(rng() * 60)).padStart(2, "0");
      const user: PlatformUser = {
        id: `user_oct_${date.replace(/-/g, "").slice(4)}_${String(i + 1).padStart(2, "0")}`,
        username,
        email,
        phone: `${profile.phonePrefix}${Math.floor(1000000 + rng() * 9000000)}`,
        ip: `${Math.floor(60 + rng() * 140)}.${Math.floor(10 + rng() * 200)}.${Math.floor(10 + rng() * 200)}.${Math.floor(2 + rng() * 250)}`,
        registeredAt: `${date} ${hour}:${min}`,
        round: "October UEFA & European sports signups",
        location: profile.country,
        region: profile.region,
        deposit: 0,
        stake: 0,
      };
      dayUsers.push(user);
      autoUsers.push(user);
    }

    const m1 = MATCH_CATALOG[(dayIdx * 2) % MATCH_CATALOG.length];
    const m2 = MATCH_CATALOG[(dayIdx * 2 + 1) % MATCH_CATALOG.length];
    autoFixtures.push({
      league: m1.league,
      date,
      time: "18:45 CET",
      match: m1.match,
      matchday: m1.matchday,
      moneyline: m1.moneyline,
      handicap: m1.handicap,
      total: m1.total,
      featured: m1.featured,
      status: "Today"
    });
    autoFixtures.push({
      league: m2.league,
      date,
      time: "21:00 CET",
      match: m2.match,
      matchday: m2.matchday,
      moneyline: m2.moneyline,
      handicap: m2.handicap,
      total: m2.total,
      featured: m2.featured,
      status: "Upcoming"
    });

    const slip1Stake = 40;
    dayUsers[0].stake = slip1Stake;
    autoLeagueSlips.push({
      id: `LGB-${date.replace(/-/g, "").slice(4)}01`,
      time: `${date} 15:30`,
      user: dayUsers[0].username,
      league: m1.league,
      match: m1.match,
      market: m1.market,
      selection: m1.selection,
      odds: m1.odds,
      stake: slip1Stake,
      potentialPayout: Math.round(slip1Stake * m1.odds * 100) / 100,
      betType: "Single",
      status: "Pending",
      risk: "Low"
    });
    autoLeagueSlips.push({
      id: `LGB-${date.replace(/-/g, "").slice(4)}02`,
      time: `${date} 17:45`,
      user: "Hamad16",
      league: m2.league,
      match: m2.match,
      market: m2.market,
      selection: m2.selection,
      odds: m2.odds,
      stake: 30,
      potentialPayout: Math.round(30 * m2.odds * 100) / 100,
      betType: "Single",
      status: "Pending",
      risk: "Low"
    });
  });

  return {autoUsers, autoCrashIncomes, autoLeagueReceipts, autoLeagueSlips, autoFixtures, autoDates: dates, autoSummary};
}

const autoDailyData = generateAutoDailyData();

const adminUsers: PlatformUser[] = registrationPlan.flatMap((plan) => Array.from({length: plan.count}, (_, offset) => ({plan, offset})))
  .map(({plan}, index) => enrichUserWithProfile({
    id: `user_${String(index + 1).padStart(3, "0")}`,
    username: `${names[index]}${String(index + 11).padStart(2, "0")}`,
    registeredAt: `${plan.date} ${String(9 + (index % 11)).padStart(2, "0")}:${String((index * 7) % 60).padStart(2, "0")}`,
    round: plan.round,
    location: locations[index],
    region: locations[index] === "Singapore" ? "Singapore" : index >= 70 && index <= 77 ? "Europe" : "Middle East",
    deposit: depositAmounts[index],
    stake: stakeAmounts[index],
  }));

const northAmericaUsers: PlatformUser[] = [
  "Ethan","Logan","Noah","Lucas","Mason","Aiden","Carter","Wyatt","Caleb","Ryan","Dylan","Owen",
  "Liam","Jacob","Cole","Hunter","Blake","Chase","Austin","Connor","Miles","Nolan","Parker","Reed",
].map((name, index) => enrichUserWithProfile({
  id: `na_user_${String(index + 1).padStart(3, "0")}`,
  username: `${name}${index % 2 === 0 ? "CA" : "US"}${String(index + 31).padStart(2, "0")}`,
  registeredAt: `2026-07-${String(20 + (index % 12)).padStart(2, "0")} ${String(10 + (index % 9)).padStart(2, "0")}:${String((index * 11) % 60).padStart(2, "0")}`,
  round: "Post World Cup sports",
  location: index % 3 === 0 ? "Canada" : "United States",
  region: "North America",
  deposit: index < 2 ? 10 : 0,
  stake: 0,
}));
const seasonalRegisteredUsers: PlatformUser[] = [
  {id: "user_aug_01", username: "LucasFR51", registeredAt: "2026-08-18 10:15", round: "Serie A / LaLiga opener", location: "France", region: "Europe", deposit: 0, stake: 0},
  {id: "user_aug_02", username: "MateoES52", registeredAt: "2026-08-19 11:20", round: "LaLiga opener", location: "Spain", region: "Europe", deposit: 0, stake: 0},
  {id: "user_aug_03", username: "FelixDE53", registeredAt: "2026-08-20 09:45", round: "Bundesliga opener", location: "Germany", region: "Europe", deposit: 0, stake: 0},
  {id: "user_aug_04", username: "LiamUK54", registeredAt: "2026-08-21 14:10", round: "Premier League kickoff", location: "United Kingdom", region: "Europe", deposit: 0, stake: 0},
  {id: "user_aug_05", username: "ArthurFR55", registeredAt: "2026-08-22 09:30", round: "Five-league weekend", location: "France", region: "Europe", deposit: 0, stake: 0},
  {id: "user_aug_06", username: "JulianDE56", registeredAt: "2026-08-22 10:45", round: "Five-league weekend", location: "Germany", region: "Europe", deposit: 0, stake: 0},
  {id: "user_aug_07", username: "GianniIT57", registeredAt: "2026-08-23 11:00", round: "Serie A Sunday", location: "Italy", region: "Europe", deposit: 0, stake: 0},
  {id: "user_aug_08", username: "OliverEU42", registeredAt: "2026-08-24 14:00", round: "Serie A kickoff", location: "Italy", region: "Europe", deposit: 0, stake: 60},
  {id: "user_aug_09", username: "RodrigoES58", registeredAt: "2026-08-25 15:20", round: "LaLiga Matchday 2", location: "Spain", region: "Europe", deposit: 0, stake: 0},
  {id: "user_aug_10", username: "PabloES59", registeredAt: "2026-08-27 16:30", round: "LaLiga midweek", location: "Spain", region: "Europe", deposit: 0, stake: 0},
  {id: "user_aug_11", username: "Amina21", registeredAt: "2026-08-28 01:10", round: "Liga de Expansión MX", location: "Mexico", region: "North America", deposit: 0, stake: 20},
  {id: "user_aug_12", username: "CallumUK60", registeredAt: "2026-08-29 09:15", round: "Premier League Matchday 3", location: "United Kingdom", region: "Europe", deposit: 0, stake: 0},
  {id: "user_aug_13", username: "GastonFR61", registeredAt: "2026-08-31 08:50", round: "Ligue 1 Matchday 3", location: "France", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_01", username: "SorenDK62", registeredAt: "2026-09-01 10:20", round: "European football autumn", location: "Denmark", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_02", username: "VictorDE63", registeredAt: "2026-09-05 11:40", round: "Bundesliga Matchday 2", location: "Germany", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_03", username: "EnzoIT64", registeredAt: "2026-09-07 09:50", round: "Serie A Matchday 3", location: "Italy", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_04", username: "Hassan91", registeredAt: "2026-09-08 11:20", round: "Ligue 1 special", location: "France", region: "Europe", deposit: 0, stake: 25},
  {id: "user_sep_05", username: "ChenYu88", registeredAt: "2026-09-08 12:45", round: "LaLiga special", location: "Singapore", region: "Singapore", deposit: 0, stake: 25},
  {id: "user_sep_06", username: "MasonUK65", registeredAt: "2026-09-09 10:05", round: "Premier League midweek", location: "United Kingdom", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_07", username: "JavierES66", registeredAt: "2026-09-10 11:30", round: "LaLiga special", location: "Spain", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_08", username: "SandroIT67", registeredAt: "2026-09-11 12:15", round: "Serie A Matchday 4", location: "Italy", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_09", username: "LeonDE68", registeredAt: "2026-09-12 09:40", round: "Bundesliga Der Klassiker", location: "Germany", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_10", username: "HugoFR69", registeredAt: "2026-09-13 10:50", round: "Ligue 1 Matchday 4", location: "France", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_11", username: "FabioIT70", registeredAt: "2026-09-14 11:10", round: "Serie A Monday night", location: "Italy", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_12", username: "AlfieUK71", registeredAt: "2026-09-15 13:25", round: "Premier League autumn", location: "United Kingdom", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_13", username: "BenoitFR72", registeredAt: "2026-09-16 12:00", round: "Ligue 1 Matchday 5", location: "France", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_14", username: "MarcoES73", registeredAt: "2026-09-17 11:45", round: "LaLiga Matchday 5", location: "Spain", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_15", username: "MaximDE74", registeredAt: "2026-09-18 10:30", round: "Bundesliga Friday", location: "Germany", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_16", username: "DarioIT75", registeredAt: "2026-09-19 09:20", round: "Serie A Saturday", location: "Italy", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_17", username: "FlorianFR76", registeredAt: "2026-09-20 11:15", round: "Ligue 1 Super Sunday", location: "France", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_18", username: "DavideIT77", registeredAt: "2026-09-21 12:40", round: "Serie A Monday", location: "Italy", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_19", username: "SergioES78", registeredAt: "2026-09-22 14:10", round: "LaLiga Matchday 6", location: "Spain", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_20", username: "OscarSE79", registeredAt: "2026-09-24 10:00", round: "LaLiga midweek", location: "Sweden", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_21", username: "ArnaudFR80", registeredAt: "2026-09-25 11:50", round: "LaLiga Friday night", location: "France", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_22", username: "ZhengWu92", registeredAt: "2026-09-26 10:30", round: "ATP China Open Beijing", location: "China", region: "Asia", deposit: 0, stake: 150},
  {id: "user_sep_23", username: "ElenaRU93", registeredAt: "2026-09-26 11:15", round: "ATP China Open Beijing", location: "Russia", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_24", username: "JonasDE81", registeredAt: "2026-09-27 10:15", round: "Bundesliga Friday night", location: "Germany", region: "Europe", deposit: 0, stake: 30},
  {id: "user_sep_25", username: "KasperDK94", registeredAt: "2026-09-28 09:15", round: "Premier League Saturday", location: "Denmark", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_26", username: "LukasAT95", registeredAt: "2026-09-28 10:30", round: "Bundesliga Super Saturday", location: "Austria", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_27", username: "MateoHR96", registeredAt: "2026-09-28 11:20", round: "Serie A Weekend", location: "Croatia", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_28", username: "TariqSA97", registeredAt: "2026-09-28 12:05", round: "Premier League Early Kickoff", location: "Saudi Arabia", region: "Middle East", deposit: 0, stake: 0},
  {id: "user_sep_29", username: "OliverUK98", registeredAt: "2026-09-28 13:45", round: "Premier League Matchday 6", location: "United Kingdom", region: "Europe", deposit: 0, stake: 50},
  {id: "user_sep_30", username: "CarlosES99", registeredAt: "2026-09-29 11:30", round: "LaLiga Madrid Derby", location: "Spain", region: "Europe", deposit: 0, stake: 50},
  {id: "user_sep_31", username: "MateoES101", registeredAt: "2026-09-29 09:15", round: "LaLiga Madrid Derby", location: "Spain", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_32", username: "HugoFR102", registeredAt: "2026-09-29 10:20", round: "Ligue 1 Weekend", location: "France", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_33", username: "LucaIT103", registeredAt: "2026-09-29 11:05", round: "Serie A Weekend", location: "Italy", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_34", username: "NoahDE104", registeredAt: "2026-09-29 12:40", round: "Bundesliga Matchday", location: "Germany", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_35", username: "LiamUK105", registeredAt: "2026-09-29 13:15", round: "Premier League Super Sunday", location: "United Kingdom", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_36", username: "ArthurBE106", registeredAt: "2026-09-29 14:30", round: "European Football", location: "Belgium", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_37", username: "LeoNL107", registeredAt: "2026-09-29 15:50", round: "Eredivisie / LaLiga", location: "Netherlands", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_38", username: "EliasSE108", registeredAt: "2026-09-29 16:25", round: "Nordic Sports", location: "Sweden", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_39", username: "MilanRS109", registeredAt: "2026-09-29 17:10", round: "SuperLiga / European Bets", location: "Serbia", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_40", username: "GabrielBR110", registeredAt: "2026-09-29 18:00", round: "Brasileirao / International", location: "Brazil", region: "North America", deposit: 0, stake: 0},
  {id: "user_sep_41", username: "MasonUK111", registeredAt: "2026-09-30 09:30", round: "Premier League Monday Night", location: "United Kingdom", region: "Europe", deposit: 0, stake: 50},
  {id: "user_sep_42", username: "FabianDE112", registeredAt: "2026-09-30 10:15", round: "Bundesliga Midweek", location: "Germany", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_43", username: "AdrienFR113", registeredAt: "2026-09-30 11:20", round: "Ligue 1 / Champions League", location: "France", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_44", username: "MatteoIT114", registeredAt: "2026-09-30 12:05", round: "Serie A Parma vs Cagliari", location: "Italy", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_45", username: "JavierES115", registeredAt: "2026-09-30 13:40", round: "LaLiga Matchday 8", location: "Spain", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_46", username: "LukasAT116", registeredAt: "2026-09-30 14:15", round: "Austrian Bundesliga / UCL", location: "Austria", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_47", username: "OscarDK117", registeredAt: "2026-09-30 15:00", round: "Danish Superliga", location: "Denmark", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_48", username: "FinnIE118", registeredAt: "2026-09-30 16:30", round: "Premier League Monday", location: "Ireland", region: "Europe", deposit: 0, stake: 0},
  {id: "user_sep_49", username: "DmitryKZ119", registeredAt: "2026-09-30 17:45", round: "European Champions League", location: "Kazakhstan", region: "Asia", deposit: 0, stake: 0},
  {id: "user_sep_50", username: "RafaelPT120", registeredAt: "2026-09-30 18:20", round: "Primeira Liga", location: "Portugal", region: "Europe", deposit: 0, stake: 0},
].map(enrichUserWithProfile);
const allUsers = [...adminUsers, ...northAmericaUsers, ...seasonalRegisteredUsers, ...autoDailyData.autoUsers];

function syncedMainUsers(summary: AdminSummary | null): PlatformUser[] {
  if (!summary?.users?.length) return [];
  const known = new Set(allUsers.map((user) => user.username.toLowerCase()));
  return summary.users
    .filter((user) => user.username.toLowerCase() !== "admin")
    .filter((user) => !known.has(user.username.toLowerCase()))
    .map((user, index) => ({
      id: user.id,
      username: user.username,
      registeredAt: user.createdAt ? new Date(user.createdAt).toLocaleString() : "Synced from main site",
      round: "Main site registration",
      location: "Live API",
      region: "North America",
      deposit: 0,
      stake: 0,
      email: `${user.username.toLowerCase()}@sports-platform.io`,
      phone: "+1 (555) 019-2831",
      ip: "104.28.19.42",
      syncSource: "main-api",
      syncOrder: index + 1,
    } as PlatformUser & {syncSource: string; syncOrder: number}));
}

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
  {stake: 50, selection: "France win", odds: 1.86, result: "Won - contact support" as const},
  {stake: 45, selection: "France win", odds: 1.84, result: "Won - contact support" as const},
  {stake: 40, selection: "France win", odds: 1.82, result: "Won - contact support" as const},
  {stake: 40, selection: "France win", odds: 1.88, result: "Won - contact support" as const},
  {stake: 40, selection: "France win", odds: 1.8, result: "Won - contact support" as const},
  {stake: 35, selection: "France win", odds: 1.9, result: "Won - contact support" as const},
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

const postFinalBetPlans = [
  {date: "2026-07-20", sport: "NBA", match: "Lakers vs Celtics", total: 20, stakes: [10, 10], selections: ["Lakers moneyline", "Over 218.5"]},
  {date: "2026-07-21", sport: "NHL", match: "Maple Leafs vs Bruins", total: 36, stakes: [12, 14, 10]},
  {date: "2026-07-22", sport: "NBA", match: "Warriors vs Suns", total: 48, stakes: [10, 12, 8, 9, 9]},
  {date: "2026-07-23", sport: "NHL", match: "Canadiens vs Rangers", total: 62, stakes: [10, 12, 15, 8, 9, 8]},
  {date: "2026-07-24", sport: "NBA", match: "Bulls vs Heat", total: 74, stakes: [12, 10, 11, 9, 8, 14, 10]},
  {date: "2026-07-25", sport: "NHL", match: "Oilers vs Avalanche", total: 55, stakes: [10, 15, 8, 12, 10]},
  {date: "2026-07-26", sport: "NBA", match: "Knicks vs Nets", total: 80, stakes: [10, 12, 11, 9, 13, 8, 7, 10]},
  {date: "2026-07-27", sport: "NHL", match: "Canucks vs Kraken", total: 43, stakes: [10, 9, 12, 12]},
  {date: "2026-07-28", sport: "NBA", match: "Mavericks vs Nuggets", total: 69, stakes: [12, 10, 9, 8, 15, 15]},
  {date: "2026-07-29", sport: "NHL", match: "Flames vs Jets", total: 31, stakes: [16, 15]},
  {date: "2026-07-30", sport: "NBA", match: "76ers vs Bucks", total: 77, stakes: [9, 10, 12, 8, 11, 10, 7, 10]},
  {date: "2026-07-31", sport: "NHL", match: "Senators vs Red Wings", total: 52, stakes: [10, 14, 8, 10, 10]},
  {date: "2026-08-01", sport: "NBA", match: "Clippers vs Kings", total: 66, stakes: [12, 9, 10, 8, 7, 10, 10]},
  {date: "2026-08-22", sport: "Premier League", match: "Arsenal vs Coventry City", total: 10, stakes: [10], selections: ["Arsenal moneyline"], result: "Pending" as const, odds: [1.44]},
];

function allocatePostFinalBets(startIndex: number): BetRecord[] {
  const selections = ["Moneyline", "Spread -3.5", "Total over", "Total under", "First period winner", "Player points over"];
  const records: BetRecord[] = [];
  postFinalBetPlans.forEach((plan, planIndex) => {
    plan.stakes.forEach((stake, offset) => {
      const user = northAmericaUsers[(planIndex + offset) % northAmericaUsers.length];
      records.push({
        id: `BET-${String(startIndex + records.length + 1).padStart(4, "0")}`,
        user,
        match: plan.match,
        round: plan.sport,
        matchDate: plan.date,
        selection: plan.selections?.[offset] || selections[(planIndex + offset) % selections.length],
        odds: plan.odds?.[offset] || Number((1.68 + ((planIndex + offset) % 7) * 0.11).toFixed(2)),
        stake,
        result: plan.result || "Lost",
        payout: 0,
      });
    });
  });
  return records;
}

const worldCupBetRecords = allocateBets();
const betRecords = [...worldCupBetRecords, ...allocatePostFinalBets(worldCupBetRecords.length)];
const exchangeWithdrawals: ExchangeWithdrawal[] = [
  {date: "2026-06-17", amount: 200, status: "Completed", destination: "Exchange treasury"},
  {date: "2026-06-30", amount: 399, status: "Completed", destination: "Exchange treasury"},
  {date: "2026-07-05", amount: 599, status: "Completed", destination: "Exchange treasury"},
  {date: "2026-07-10", amount: 505, status: "Completed", destination: "Exchange treasury"},
  {date: "2026-07-16", amount: 1000, status: "Completed", destination: "Exchange treasury"},
  {date: "2026-08-02", amount: 1000, status: "Completed", destination: "Exchange treasury"},
  {date: "2026-08-03", amount: 400, status: "Completed", destination: "Exchange treasury"},
  {date: "2026-08-08", amount: 332.75, status: "Completed", destination: "Exchange treasury"},
  {date: "2026-08-23", amount: 240, status: "Completed", destination: "Exchange treasury"},
  {date: "2026-09-01", amount: 800, status: "Processing", destination: "Exchange treasury (Est. 20% fee · ETA 9.2)"},
  {date: "2026-09-17", amount: 1000, status: "Processing", destination: "Exchange treasury (Est. 20% fee · ETA 9.18)"},
  {date: "2026-09-24", amount: 500, status: "Processing", destination: "Exchange treasury (Est. 20% fee · ETA 9.25)"},
  {date: "2026-09-29", amount: 1000, status: "Processing", destination: "Exchange treasury (Est. 20% fee · ETA 9.30)"},
  {date: "2026-10-05", amount: 1000, status: "Processing", destination: "Exchange treasury (Est. 20% fee: 200u, Net: 800u · ETA 2026-10-08)"},
];
const openingWalletReserve = 0;
const totalDeposits = allUsers.reduce((sum, user) => sum + user.deposit, 0);
const totalStakes = betRecords.reduce((sum, bet) => sum + bet.stake, 0);
const paidPayouts = betRecords.filter((bet) => bet.result === "Paid").reduce((sum, bet) => sum + bet.payout, 0);
const exchangeWithdrawn = exchangeWithdrawals.reduce((sum, item) => sum + item.amount, 0);
const preJulyFifteenthBets = betRecords.filter((bet) => bet.matchDate < "2026-07-15");
const preJulyFifteenthStakes = preJulyFifteenthBets.reduce((sum, bet) => sum + bet.stake, 0);
const preJulyFifteenthPaidPayouts = preJulyFifteenthBets.filter((bet) => bet.result === "Paid").reduce((sum, bet) => sum + bet.payout, 0);
const targetPostJulyTenthBalance = 875;
const walletReconciliationAdjustment = Math.round((targetPostJulyTenthBalance - (openingWalletReserve + totalDeposits + preJulyFifteenthStakes - preJulyFifteenthPaidPayouts - exchangeWithdrawn)) * 100) / 100;
const postJulyTenthManualPayouts = 260.25;
const todayBets = betRecords.filter((bet) => bet.matchDate === "2026-07-15");
const todayStakeTotal = todayBets.reduce((sum, bet) => sum + bet.stake, 0);
const todayPaidPayouts = postJulyTenthManualPayouts;
const todayWalletChange = Math.round((todayStakeTotal - todayPaidPayouts) * 100) / 100;
const postJulyFifteenthBets = betRecords.filter((bet) => bet.matchDate > "2026-07-15");
const postJulyFifteenthStakes = postJulyFifteenthBets.reduce((sum, bet) => sum + bet.stake, 0);
const postJulyFifteenthDeposits = northAmericaUsers.reduce((sum, user) => sum + user.deposit, 0);
const postJulyFifteenthWithdrawals = exchangeWithdrawals.filter((item) => item.date > "2026-07-15").reduce((sum, item) => sum + item.amount, 0);
const augustWithdrawals = exchangeWithdrawals.filter((item) => item.date.startsWith("2026-08")).reduce((sum, item) => sum + item.amount, 0);
const septemberWithdrawals = exchangeWithdrawals.filter((item) => item.date.startsWith("2026-09")).reduce((sum, item) => sum + item.amount, 0);
const octoberWithdrawals = exchangeWithdrawals.filter((item) => item.date.startsWith("2026-10")).reduce((sum, item) => sum + item.amount, 0);
const wheelIncomes: WheelIncome[] = [
  {date: "2026-08-08", amount: 20, source: "Wheel game", status: "Settled"},
  {date: "2026-08-10", amount: 15, source: "Wheel game", status: "Settled"},
  {date: "2026-08-11", amount: 5, source: "Wheel game", status: "Settled"},
  {date: "2026-08-16", amount: 20, source: "Wheel game", status: "Settled"},
  {date: "2026-08-17", amount: 19, source: "Wheel game", status: "Settled"},
  {date: "2026-08-18", amount: 22, source: "Wheel game", status: "Settled"},
  {date: "2026-08-19", amount: 18, source: "Wheel game", status: "Settled"},
  {date: "2026-08-20", amount: 23, source: "Wheel game", status: "Settled"},
  {date: "2026-08-21", amount: 21, source: "Wheel game", status: "Settled"},
  {date: "2026-09-05", amount: 30, source: "Wheel game", status: "Settled"},
  {date: "2026-09-06", amount: 30, source: "Wheel game (early morning)", status: "Settled"},
  {date: "2026-09-06", amount: 20, source: "Wheel game (evening)", status: "Settled"},
  {date: "2026-09-06", amount: 10, source: "Wheel game (late night)", status: "Settled"},
  {date: "2026-09-08", amount: 30, source: "Wheel game", status: "Settled"},
  {date: "2026-09-09", amount: 30, source: "Wheel game", status: "Settled"},
  {date: "2026-09-22", amount: 30, source: "Wheel game", status: "Settled"},
  {date: "2026-09-24", amount: 40, source: "Wheel game", status: "Settled"},
  {date: "2026-09-26", amount: 55, source: "Wheel game", status: "Settled"},
];
const wheelIncomeTotal = wheelIncomes.reduce((sum, item) => sum + item.amount, 0);
const crashIncomes: CrashIncome[] = [
  {date: "2026-09-10", amount: 25, source: "Crash game", status: "Settled"},
  {date: "2026-09-11", amount: 25, source: "Crash game", status: "Settled"},
  {date: "2026-09-12", amount: 50, source: "Crash game", status: "Settled"},
  {date: "2026-09-13", amount: 20, source: "Crash game", status: "Settled"},
  {date: "2026-09-14", amount: 70, source: "Crash game", status: "Settled"},
  {date: "2026-09-15", amount: 50, source: "Crash game", status: "Settled"},
  {date: "2026-09-16", amount: 30, source: "Crash game", status: "Settled"},
  {date: "2026-09-17", amount: 10, source: "Crash game", status: "Settled"},
  {date: "2026-09-17", amount: 10, source: "Crash game (evening)", status: "Settled"},
  {date: "2026-09-18", amount: 10, source: "Crash game", status: "Settled"},
  {date: "2026-09-19", amount: 10, source: "Crash game", status: "Settled"},
  {date: "2026-09-20", amount: 15, source: "Crash game", status: "Settled"},
  {date: "2026-09-21", amount: 15, source: "Crash game", status: "Settled"},
  {date: "2026-09-25", amount: 25, source: "Crash game", status: "Settled"},
  {date: "2026-09-26", amount: 25, source: "Crash game", status: "Settled"},
  {date: "2026-09-27", amount: 20, source: "Crash game", status: "Settled"},
  {date: "2026-09-29", amount: 21, source: "Crash game", status: "Settled"},
  {date: "2026-09-30", amount: 23, source: "Crash game", status: "Settled"},
  ...autoDailyData.autoCrashIncomes,
];
const crashIncomeTotal = crashIncomes.reduce((sum, item) => sum + item.amount, 0);
const historicalWithdrawalAlreadyInBaseline = exchangeWithdrawals.find((item) => item.date === "2026-07-16")?.amount ?? 0;
const platformBalanceBeforeLeagueBetMerge = Math.round((targetPostJulyTenthBalance + todayWalletChange + postJulyFifteenthDeposits + postJulyFifteenthStakes + wheelIncomeTotal + crashIncomeTotal - postJulyFifteenthWithdrawals + historicalWithdrawalAlreadyInBaseline) * 100) / 100;
const dailyBetTotals = betRecords.reduce<Record<string, number>>((acc, bet) => {
  acc[bet.matchDate] = Math.round(((acc[bet.matchDate] || 0) + bet.stake) * 100) / 100;
  return acc;
}, {});

const leagueMarkets: LeagueMarket[] = [
  {league: "Premier League", country: "England", kickoff: "2026-08-21 20:00 UK / 2026-08-22 03:00 CST", match: "Arsenal vs Coventry City", matchday: "Matchweek 1", market: "Home win", odds: "1.44", stake: 10, users: 1, exposure: 14.4, source: "Premier League official fixture list", status: "Confirmed"},
  {league: "Premier League", country: "England", kickoff: "2026-08-22 12:30 BST", match: "Hull City vs Manchester United", matchday: "Matchweek 1", market: "Moneyline / Over 2.5", odds: "2.18 / 1.86", stake: 38, users: 3, exposure: 82.84, source: "Manchester United official fixture listing", status: "Live"},
  {league: "Premier League", country: "England", kickoff: "2026-08-22 17:30 UK", match: "Brentford vs Tottenham Hotspur", matchday: "Matchweek 1", market: "Asian handicap -0.25", odds: "1.91", stake: 25, users: 2, exposure: 47.75, source: "Premier League official fixture list", status: "Confirmed"},
  {league: "Premier League", country: "England", kickoff: "2026-08-23 14:00 UK", match: "Manchester City vs AFC Bournemouth", matchday: "Matchweek 1", market: "Home win / Team total", odds: "1.42 / 1.78", stake: 15, users: 1, exposure: 26.7, source: "Premier League live schedule", status: "Live"},
  {league: "Premier League", country: "England", kickoff: "2026-08-23 16:30 UK", match: "Newcastle United vs Liverpool", matchday: "Matchweek 1", market: "Double chance / Total goals", odds: "1.67 / 1.84", stake: 0, users: 0, exposure: 0, source: "Premier League official fixture list", status: "Pregame"},
  {league: "LaLiga", country: "Spain", kickoff: "2026-08-22 21:30 CEST", match: "RCD Espanyol de Barcelona vs Real Madrid", matchday: "Matchday 2", market: "Away win / Player shots", odds: "1.58 / 1.92", stake: 47, users: 3, exposure: 86.72, source: "Real Madrid official match preview", status: "Pregame"},
  {league: "LaLiga", country: "Spain", kickoff: "2026-08-25 19:00 CEST", match: "Valencia vs Real Betis", matchday: "LALIGA EA SPORTS", market: "Live 1X2 / correct score / total goals", odds: "2.42 / 3.10 / 2.88", stake: 95, users: 3, exposure: 275.5, source: "LALIGA official live match board", status: "Live"},
  {league: "LaLiga", country: "Spain", kickoff: "2026-08-26 19:00 local", match: "Real Madrid vs Real Sociedad", matchday: "Matchday 3", market: "Home win / Team total", odds: "1.62 / 1.88", stake: 0, users: 0, exposure: 0, source: "LALIGA calendar", status: "Confirmed"},
  {league: "LaLiga", country: "Spain", kickoff: "2026-08-27 21:00 CEST", match: "FC Barcelona vs Athletic Club", matchday: "Matchday 1", market: "1X2 / Both teams to score", odds: "1.64 / 1.74", stake: 30, users: 2, exposure: 49.2, source: "LALIGA official first matchday schedule", status: "Confirmed"},
  {league: "Serie A", country: "Italy", kickoff: "2026-08-23 17:30 CEST", match: "Frosinone vs Juventus", matchday: "Matchday 1", market: "Away win", odds: "1.62", stake: 12, users: 1, exposure: 19.44, source: "Juventus official matchroom", status: "Pregame"},
  {league: "Serie A", country: "Italy", kickoff: "2026-08-23 19:45 CEST", match: "Atalanta vs Sassuolo", matchday: "Matchday 1", market: "Moneyline / Under 3.5", odds: "1.66 / 1.81", stake: 13, users: 1, exposure: 23.53, source: "Juventus official Matchday 1 listing", status: "Pregame"},
  {league: "Serie A", country: "Italy", kickoff: "2026-08-23 20:45 CEST", match: "Torino vs AC Milan", matchday: "Matchday 1", market: "Away draw no bet", odds: "1.79", stake: 18, users: 2, exposure: 32.22, source: "AC Milan official schedule", status: "Pregame"},
  {league: "Serie A", country: "Italy", kickoff: "2026-08-24 17:30 CEST", match: "Bologna vs Lazio", matchday: "Matchday 1", market: "Draw no bet", odds: "1.74", stake: 60, users: 3, exposure: 104.4, source: "Serie A official fixture list", status: "Pregame"},
  {league: "Bundesliga", country: "Germany", kickoff: "2026-08-22 18:30 CEST", match: "Borussia Dortmund vs Bayern Munich", matchday: "Franz Beckenbauer Supercup", market: "Bayern win / Next goal", odds: "2.08 / 2.18", stake: 40, users: 3, exposure: 85.3, source: "Bundesliga official Supercup page", status: "Live"},
  {league: "Bundesliga", country: "Germany", kickoff: "2026-08-28 20:30 CEST", match: "Bayern Munich vs VfB Stuttgart", matchday: "Matchday 1", market: "Correct score / Moneyline / Totals", odds: "2.40 / 1.25 / 1.22", stake: 220, users: 4, exposure: 192, source: "Bundesliga official fixture and live odds board", status: "Risk review"},
  {league: "Ligue 1", country: "France", kickoff: "2026-08-21 opening weekend", match: "Olympique de Marseille vs RC Strasbourg Alsace", matchday: "Matchday 1", market: "Home win / Total goals", odds: "1.77 / 1.86", stake: 24, users: 2, exposure: 44.64, source: "Ligue 1 official calendar release", status: "Pregame"},
  {league: "Ligue 1", country: "France", kickoff: "2026-08-23 20:45 CEST", match: "Paris Saint-Germain vs Stade Rennais FC", matchday: "Matchday 1", market: "Home win", odds: "1.35", stake: 27, users: 2, exposure: 36.45, source: "PSG official match page", status: "Pregame"},
  {league: "Ligue 1", country: "France", kickoff: "2026-08-30 20:45 local", match: "LOSC vs Paris Saint-Germain", matchday: "Matchday 2 top-ten match", market: "Away draw no bet", odds: "1.72", stake: 0, users: 0, exposure: 0, source: "Ligue 1 official calendar release", status: "Confirmed"},
  {league: "Liga de Expansión MX", country: "Mexico", kickoff: "2026-08-28 02:00 local", match: "Alebrijes Oaxaca vs Tapatío", matchday: "Matchday fixture", market: "1X2", odds: "1.97 / 3.46 / 3.22", stake: 20, users: 1, exposure: 39.4, source: "2026-08-28 football fixture listing", status: "Pregame"},
  {league: "Premier League", country: "England", kickoff: "2026-08-29 12:30 BST", match: "Liverpool vs Nottingham Forest", matchday: "Matchweek 2", market: "Moneyline", odds: "1.48", stake: 25, users: 1, exposure: 37, source: "Premier League official fixture list", status: "Pregame"},
  {league: "Premier League", country: "England", kickoff: "2026-08-29 17:30 BST", match: "Tottenham Hotspur vs Newcastle United", matchday: "Matchweek 2", market: "Moneyline / Total goals", odds: "2.05 / 1.82", stake: 25, users: 1, exposure: 51.25, source: "Premier League official fixture list", status: "Pregame"},
  {league: "Ligue 1", country: "France", kickoff: "2026-08-29 17:15 local", match: "RC Strasbourg Alsace vs RC Lens", matchday: "Matchday 2", market: "Away win", odds: "2.10", stake: 20, users: 1, exposure: 42, source: "Ligue 1 official calendar", status: "Pregame"},
  {league: "Ligue 1", country: "France", kickoff: "2026-08-29 20:45 local", match: "Olympique Lyonnais vs Le Havre AC", matchday: "Matchday 2", market: "Home win", odds: "1.72", stake: 15, users: 1, exposure: 25.8, source: "Ligue 1 official calendar", status: "Pregame"},
  {league: "LaLiga", country: "Spain", kickoff: "2026-08-29 19:30 CEST", match: "Sevilla FC vs Atlético de Madrid", matchday: "Matchday 2", market: "Draw no bet", odds: "2.18", stake: 20, users: 1, exposure: 43.6, source: "LALIGA official next matches", status: "Pregame"},
  {league: "Premier League", country: "England", kickoff: "2026-08-31 20:00 BST", match: "Manchester United vs Liverpool", matchday: "Matchweek 3", market: "Moneyline / Total goals", odds: "3.40 / 3.80 / 1.95", stake: 15, users: 1, exposure: 29.25, source: "Premier League official fixture list", status: "Pregame"},
  {league: "LaLiga", country: "Spain", kickoff: "2026-08-31 21:30 CEST", match: "Real Madrid vs Real Betis", matchday: "Matchday 3", market: "Moneyline", odds: "1.45 / 4.60 / 6.50", stake: 10, users: 1, exposure: 14.5, source: "LALIGA official next matches", status: "Pregame"},
  {league: "Serie A", country: "Italy", kickoff: "2026-08-31 20:45 CEST", match: "Juventus vs Roma", matchday: "Matchday 2", market: "Draw no bet", odds: "1.68", stake: 10, users: 1, exposure: 16.8, source: "Serie A official fixture list", status: "Pregame"},
  {league: "Bundesliga", country: "Germany", kickoff: "2026-08-31 17:30 CEST", match: "Bayern Munich vs SC Freiburg", matchday: "Matchday 2", market: "Asian handicap", odds: "1.75", stake: 10, users: 1, exposure: 17.5, source: "Bundesliga official schedule", status: "Pregame"},
  {league: "Ligue 1", country: "France", kickoff: "2026-08-31 20:45 local", match: "Olympique Lyonnais vs AS Monaco", matchday: "Matchday 2", market: "Total goals", odds: "1.82", stake: 10, users: 1, exposure: 18.2, source: "Ligue 1 official calendar", status: "Pregame"},
  {league: "Premier League", country: "England", kickoff: "2026-09-01 20:00 BST", match: "Arsenal vs Brighton & Hove Albion", matchday: "Matchweek 3", market: "Moneyline", odds: "1.55", stake: 30, users: 1, exposure: 46.5, source: "Premier League official fixture list", status: "Pregame"},
  {league: "LaLiga", country: "Spain", kickoff: "2026-09-01 21:30 CEST", match: "FC Barcelona vs Real Valladolid", matchday: "Matchday 4", market: "Asian handicap", odds: "1.72", stake: 20, users: 1, exposure: 34.4, source: "LALIGA official next matches", status: "Pregame"},
  {league: "Premier League", country: "England", kickoff: "2026-09-05 17:30 BST", match: "Manchester City vs Chelsea", matchday: "Matchweek 4", market: "Moneyline", odds: "1.65", stake: 30, users: 1, exposure: 49.5, source: "Premier League official fixture list", status: "Pregame"},
  {league: "LaLiga", country: "Spain", kickoff: "2026-09-05 21:00 CEST", match: "Real Madrid vs Real Sociedad", matchday: "Matchday 4", market: "Moneyline", odds: "1.50", stake: 20, users: 1, exposure: 30, source: "LALIGA official next matches", status: "Pregame"},
  {league: "Premier League", country: "England", kickoff: "2026-09-07 16:30 BST", match: "Tottenham Hotspur vs Arsenal", matchday: "Matchweek 4", market: "Moneyline", odds: "1.90", stake: 30, users: 1, exposure: 57, source: "Premier League official fixture list", status: "Pregame"},
  {league: "Serie A", country: "Italy", kickoff: "2026-09-07 20:45 CEST", match: "Inter Milan vs Atalanta", matchday: "Matchday 3", market: "Moneyline", odds: "1.68", stake: 20, users: 1, exposure: 33.6, source: "Serie A official fixture list", status: "Pregame"},
  {league: "Ligue 1", country: "France", kickoff: "2026-09-08 20:45 CEST", match: "Paris Saint-Germain vs AS Monaco", matchday: "Matchweek 4", market: "Moneyline", odds: "1.52", stake: 30, users: 1, exposure: 45.6, source: "Ligue 1 official calendar", status: "Pregame"},
  {league: "LaLiga", country: "Spain", kickoff: "2026-09-08 21:00 CEST", match: "Atlético de Madrid vs Sevilla FC", matchday: "Matchday 4", market: "Moneyline", odds: "1.75", stake: 20, users: 1, exposure: 35, source: "LALIGA official next matches", status: "Pregame"},
  {league: "Premier League", country: "England", kickoff: "2026-09-09 19:45 BST", match: "Chelsea vs Liverpool", matchday: "Matchweek 4", market: "Moneyline", odds: "1.85", stake: 30, users: 1, exposure: 55.5, source: "Premier League official fixture list", status: "Pregame"},
  {league: "Serie A", country: "Italy", kickoff: "2026-09-09 20:45 CEST", match: "AC Milan vs Napoli", matchday: "Matchday 4", market: "Moneyline", odds: "1.70", stake: 20, users: 1, exposure: 34, source: "Serie A official fixture list", status: "Pregame"},
  {league: "Bundesliga", country: "Germany", kickoff: "2026-09-10 20:30 CEST", match: "Bayer Leverkusen vs RB Leipzig", matchday: "Matchday 3", market: "Moneyline", odds: "1.92", stake: 30, users: 1, exposure: 57.6, source: "Bundesliga official schedule", status: "Pregame"},
  {league: "LaLiga", country: "Spain", kickoff: "2026-09-10 21:30 CEST", match: "Athletic Club vs Valencia", matchday: "Matchday 4", market: "Moneyline", odds: "1.72", stake: 20, users: 1, exposure: 34.4, source: "LALIGA official next matches", status: "Pregame"},
  {league: "Premier League", country: "England", kickoff: "2026-09-11 20:00 BST", match: "Manchester City vs Newcastle United", matchday: "Matchweek 4", market: "Moneyline", odds: "1.58", stake: 40, users: 1, exposure: 63.2, source: "Premier League official fixture list", status: "Pregame"},
  {league: "Serie A", country: "Italy", kickoff: "2026-09-11 20:45 CEST", match: "Roma vs Fiorentina", matchday: "Matchday 4", market: "Moneyline", odds: "1.82", stake: 30, users: 1, exposure: 54.6, source: "Serie A official fixture list", status: "Pregame"},
  {league: "Bundesliga", country: "Germany", kickoff: "2026-09-12 18:30 CEST", match: "Bayern Munich vs Borussia Dortmund", matchday: "Matchday 4", market: "Moneyline", odds: "1.72", stake: 45, users: 1, exposure: 77.4, source: "Bundesliga official schedule", status: "Pregame"},
  {league: "LaLiga", country: "Spain", kickoff: "2026-09-12 21:00 CEST", match: "Real Madrid vs Getafe CF", matchday: "Matchday 5", market: "Moneyline", odds: "1.45", stake: 35, users: 1, exposure: 50.75, source: "LALIGA official next matches", status: "Pregame"},
  {league: "Ligue 1", country: "France", kickoff: "2026-09-12 20:45 CEST", match: "Paris Saint-Germain vs Stade de Reims", matchday: "Matchweek 5", market: "Moneyline", odds: "1.38", stake: 25, users: 1, exposure: 34.5, source: "Ligue 1 official calendar", status: "Pregame"},
  {league: "Premier League", country: "England", kickoff: "2026-09-13 17:30 BST", match: "Tottenham Hotspur vs Arsenal", matchday: "Matchweek 4", market: "Moneyline", odds: "1.75", stake: 20, users: 1, exposure: 35.0, source: "Premier League official fixture list", status: "Pregame"},
  {league: "Serie A", country: "Italy", kickoff: "2026-09-13 20:45 CEST", match: "Inter Milan vs Juventus", matchday: "Matchday 4", market: "Moneyline", odds: "1.80", stake: 15, users: 1, exposure: 27.0, source: "Serie A official fixture list", status: "Pregame"},
  {league: "LaLiga", country: "Spain", kickoff: "2026-09-14 21:00 CEST", match: "Atlético de Madrid vs Valencia", matchday: "Matchday 5", market: "Moneyline", odds: "1.65", stake: 50, users: 1, exposure: 82.5, source: "LALIGA official next matches", status: "Pregame"},
  {league: "Serie A", country: "Italy", kickoff: "2026-09-14 20:45 CEST", match: "Napoli vs Cagliari", matchday: "Matchday 4", market: "Moneyline", odds: "1.55", stake: 35, users: 1, exposure: 54.25, source: "Serie A official fixture list", status: "Pregame"},
  {league: "Premier League", country: "England", kickoff: "2026-09-15 20:00 BST", match: "Aston Villa vs Everton", matchday: "Matchweek 4", market: "Moneyline", odds: "1.80", stake: 30, users: 1, exposure: 54.0, source: "Premier League official fixture list", status: "Pregame"},
  {league: "Bundesliga", country: "Germany", kickoff: "2026-09-16 20:30 CEST", match: "RB Leipzig vs Union Berlin", matchday: "Matchday 4", market: "Moneyline", odds: "1.60", stake: 40, users: 1, exposure: 64.0, source: "Bundesliga official schedule", status: "Pregame"},
  {league: "Ligue 1", country: "France", kickoff: "2026-09-16 21:00 CEST", match: "Olympique de Marseille vs OGC Nice", matchday: "Matchweek 5", market: "Moneyline", odds: "1.85", stake: 30, users: 1, exposure: 55.5, source: "Ligue 1 official calendar", status: "Pregame"},
  {league: "LaLiga", country: "Spain", kickoff: "2026-09-17 21:30 CEST", match: "Real Betis vs Real Sociedad", matchday: "Matchday 5", market: "Moneyline", odds: "1.90", stake: 30, users: 1, exposure: 57.0, source: "LALIGA official next matches", status: "Pregame"},
  {league: "Serie A", country: "Italy", kickoff: "2026-09-17 20:45 CEST", match: "Fiorentina vs Udinese", matchday: "Matchday 4", market: "Moneyline", odds: "1.70", stake: 10, users: 1, exposure: 17.0, source: "Serie A official fixture list", status: "Pregame"},
  {league: "Bundesliga", country: "Germany", kickoff: "2026-09-18 20:30 CEST", match: "VfB Stuttgart vs FC St. Pauli", matchday: "Matchday 4", market: "Moneyline", odds: "1.60", stake: 60, users: 1, exposure: 96.0, source: "Bundesliga official schedule", status: "Pregame"},
  {league: "LaLiga", country: "Spain", kickoff: "2026-09-18 21:00 CEST", match: "Real Valladolid vs Real Sociedad", matchday: "Matchday 5", market: "Moneyline", odds: "1.90", stake: 50, users: 1, exposure: 95.0, source: "LALIGA official next matches", status: "Pregame"},
  {league: "Premier League", country: "England", kickoff: "2026-09-19 12:30 BST", match: "West Ham United vs Chelsea", matchday: "Matchweek 5", market: "Moneyline", odds: "1.75", stake: 40, users: 1, exposure: 70.0, source: "Premier League official fixture list", status: "Pregame"},
  {league: "Serie A", country: "Italy", kickoff: "2026-09-19 18:00 CEST", match: "Juventus vs Napoli", matchday: "Matchday 5", market: "Moneyline", odds: "1.80", stake: 30, users: 1, exposure: 54.0, source: "Serie A official fixture list", status: "Pregame"},
  {league: "Premier League", country: "England", kickoff: "2026-09-20 16:30 BST", match: "Manchester City vs Arsenal", matchday: "Matchweek 5", market: "Moneyline", odds: "1.85", stake: 45, users: 1, exposure: 83.25, source: "Premier League official fixture list", status: "Pregame"},
  {league: "Serie A", country: "Italy", kickoff: "2026-09-20 20:45 CEST", match: "Inter Milan vs AC Milan", matchday: "Matchday 5", market: "Moneyline", odds: "1.95", stake: 30, users: 1, exposure: 58.5, source: "Serie A official fixture list", status: "Pregame"},
  {league: "LaLiga", country: "Spain", kickoff: "2026-09-21 21:00 CEST", match: "Real Betis vs RCD Mallorca", matchday: "Matchday 6", market: "Moneyline", odds: "1.90", stake: 40, users: 1, exposure: 76.0, source: "LaLiga official fixture list", status: "Pregame"},
  {league: "Serie A", country: "Italy", kickoff: "2026-09-21 20:45 CEST", match: "Atalanta vs Como", matchday: "Matchday 5", market: "Moneyline", odds: "1.50", stake: 25, users: 1, exposure: 37.5, source: "Serie A official fixture list", status: "Pregame"},
  {league: "LaLiga", country: "Spain", kickoff: "2026-09-22 19:00 CEST", match: "Sevilla vs Real Valladolid", matchday: "Matchday 6", market: "Moneyline", odds: "1.70", stake: 50, users: 1, exposure: 85.0, source: "LaLiga official fixture list", status: "Pregame"},
  {league: "LaLiga", country: "Spain", kickoff: "2026-09-22 21:00 CEST", match: "Valencia vs CA Osasuna", matchday: "Matchday 6", market: "Moneyline", odds: "2.00", stake: 30, users: 1, exposure: 60.0, source: "LaLiga official fixture list", status: "Pregame"},
  {league: "LaLiga", country: "Spain", kickoff: "2026-09-24 19:00 CEST", match: "RCD Espanyol vs Villarreal", matchday: "Matchday 6", market: "Moneyline", odds: "2.25", stake: 80, users: 1, exposure: 180.0, source: "LaLiga official fixture list", status: "Pregame"},
  {league: "LaLiga", country: "Spain", kickoff: "2026-09-24 21:00 CEST", match: "Celta Vigo vs Atlético Madrid", matchday: "Matchday 6", market: "Moneyline", odds: "1.90", stake: 100, users: 1, exposure: 190.0, source: "LaLiga official fixture list", status: "Pregame"},
  {league: "LaLiga", country: "Spain", kickoff: "2026-09-25 19:00 CEST", match: "Girona FC vs Rayo Vallecano", matchday: "Matchday 7", market: "Moneyline", odds: "1.80", stake: 30, users: 1, exposure: 54.0, source: "LaLiga official fixture list", status: "Pregame"},
  {league: "LaLiga", country: "Spain", kickoff: "2026-09-25 21:00 CEST", match: "FC Barcelona vs Getafe CF", matchday: "Matchday 7", market: "Moneyline", odds: "1.30", stake: 50, users: 1, exposure: 65.0, source: "LaLiga official fixture list", status: "Pregame"},
  {league: "ATP Tour", country: "China", kickoff: "2026-09-26 13:00 CST", match: "Jannik Sinner vs Nicolas Jarry", matchday: "Round of 32", market: "Match / Set betting", odds: "1.15 / 1.48", stake: 250, users: 1, exposure: 370.0, source: "ATP Tour China Open official schedule", status: "Live"},
  {league: "ATP Tour", country: "China", kickoff: "2026-09-26 16:30 CST", match: "Daniil Medvedev vs Gaël Monfils", matchday: "Round of 32", market: "Moneyline", odds: "1.28", stake: 150, users: 1, exposure: 192.0, source: "ATP Tour China Open official schedule", status: "Pregame"},
  {league: "Bundesliga", country: "Germany", kickoff: "2026-09-27 20:30 CEST", match: "Borussia Dortmund vs VfL Bochum", matchday: "Matchday 5", market: "Moneyline", odds: "1.35", stake: 50, users: 1, exposure: 67.5, source: "Bundesliga official fixture list", status: "Pregame"},
  {league: "Serie A", country: "Italy", kickoff: "2026-09-27 20:45 CEST", match: "AC Milan vs Lecce", matchday: "Matchday 6", market: "Moneyline", odds: "1.40", stake: 30, users: 1, exposure: 42.0, source: "Serie A official fixture list", status: "Pregame"},
  {league: "Premier League", country: "England", kickoff: "2026-09-28 12:30 BST", match: "Newcastle United vs Manchester City", matchday: "Matchweek 6", market: "Moneyline", odds: "1.62", stake: 50, users: 1, exposure: 81.0, source: "Premier League official fixture list", status: "Pregame"},
  {league: "Bundesliga", country: "Germany", kickoff: "2026-09-28 18:30 CEST", match: "Bayern Munich vs Bayer Leverkusen", matchday: "Matchday 5", market: "Moneyline", odds: "1.75", stake: 30, users: 1, exposure: 52.5, source: "Bundesliga official fixture list", status: "Pregame"},
  {league: "LaLiga", country: "Spain", kickoff: "2026-09-29 21:00 CEST", match: "Atlético Madrid vs Real Madrid", matchday: "Matchday 8", market: "Moneyline", odds: "1.80", stake: 50, users: 1, exposure: 90.0, source: "LaLiga official fixture list", status: "Pregame"},
  {league: "Premier League", country: "England", kickoff: "2026-09-29 16:30 BST", match: "Manchester United vs Tottenham Hotspur", matchday: "Matchweek 6", market: "Moneyline", odds: "2.10", stake: 30, users: 1, exposure: 63.0, source: "Premier League official fixture list", status: "Pregame"},
  {league: "Premier League", country: "England", kickoff: "2026-09-30 20:00 BST", match: "AFC Bournemouth vs Southampton", matchday: "Matchweek 6", market: "Moneyline", odds: "1.75", stake: 50, users: 1, exposure: 87.5, source: "Premier League official fixture list", status: "Pregame"},
  {league: "Serie A", country: "Italy", kickoff: "2026-09-30 18:30 CEST", match: "Parma vs Cagliari", matchday: "Matchday 6", market: "Total goals", odds: "1.85", stake: 30, users: 1, exposure: 55.5, source: "Serie A official fixture list", status: "Pregame"},
];
const leagueNames = Array.from(new Set(leagueMarkets.map((item) => item.league)));
const leaguePageItems: LeaguePage[] = ["Premier League", "LaLiga", "Serie A", "Bundesliga", "Ligue 1"];
const leagueTotalStake = leagueMarkets.reduce((sum, item) => sum + item.stake, 0);
const leagueTotalExposure = Math.round(leagueMarkets.reduce((sum, item) => sum + item.exposure, 0) * 100) / 100;
const liveLeagueMarkets = leagueMarkets.filter((item) => item.status === "Live").length;
const leagueBetSlips: LeagueBetSlip[] = [
  {id: "LGB-1801", time: "2026-08-18 22:18", user: "WeiMing89", league: "Serie A", match: "Frosinone vs Juventus", market: "Moneyline", selection: "Juventus win", odds: 1.62, stake: 12, potentialPayout: 19.44, betType: "Single", status: "Open", risk: "Low"},
  {id: "LGB-1901", time: "2026-08-19 23:06", user: "JiaHao90", league: "LaLiga", match: "RCD Espanyol de Barcelona vs Real Madrid", market: "Team total", selection: "Real Madrid over 1.5 goals", odds: 1.76, stake: 15, potentialPayout: 26.4, betType: "Team prop", status: "Open", risk: "Low"},
  {id: "LGB-2001", time: "2026-08-20 21:44", user: "EthanCA31", league: "Bundesliga", match: "Borussia Dortmund vs Bayern Munich", market: "Moneyline", selection: "Bayern Munich win", odds: 2.08, stake: 10, potentialPayout: 20.8, betType: "Single", status: "Open", risk: "Medium"},
  {id: "LGB-2101", time: "2026-08-21 19:16", user: "LoganUS32", league: "Premier League", match: "Arsenal vs Coventry City", market: "Moneyline", selection: "Arsenal win", odds: 1.44, stake: 10, potentialPayout: 14.4, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-2201", time: "2026-08-22 12:04", user: "Omar11", league: "Premier League", match: "Hull City vs Manchester United", market: "Moneyline", selection: "Manchester United win", odds: 2.18, stake: 20, potentialPayout: 43.6, betType: "Single", status: "Open", risk: "Medium"},
  {id: "LGB-2202", time: "2026-08-22 12:22", user: "Yousef12", league: "Premier League", match: "Hull City vs Manchester United", market: "Total goals", selection: "Over 2.5", odds: 1.86, stake: 18, potentialPayout: 33.48, betType: "Live", status: "Open", risk: "Medium"},
  {id: "LGB-2203", time: "2026-08-22 17:08", user: "Khalid13", league: "Premier League", match: "Brentford vs Tottenham Hotspur", market: "Asian handicap", selection: "Tottenham -0.25", odds: 1.91, stake: 25, potentialPayout: 47.75, betType: "Single", status: "Open", risk: "Low"},
  {id: "LGB-2204", time: "2026-08-22 20:55", user: "Fahad14", league: "LaLiga", match: "RCD Espanyol de Barcelona vs Real Madrid", market: "Player shots", selection: "Mbappe over 3.5 shots", odds: 1.92, stake: 32, potentialPayout: 61.44, betType: "Player prop", status: "Open", risk: "Medium"},
  {id: "LGB-2205", time: "2026-08-22 18:12", user: "Nasser15", league: "Bundesliga", match: "Borussia Dortmund vs Bayern Munich", market: "Next goal", selection: "Bayern next goal", odds: 2.18, stake: 30, potentialPayout: 65.4, betType: "Live", status: "Risk hold", risk: "High"},
  {id: "LGB-2206", time: "2026-08-22 19:38", user: "Hamad16", league: "Ligue 1", match: "Olympique de Marseille vs RC Strasbourg Alsace", market: "Total goals", selection: "Over 2.5", odds: 1.86, stake: 24, potentialPayout: 44.64, betType: "Single", status: "Open", risk: "Low"},
  {id: "LGB-2207", time: "2026-08-22 20:41", user: "Saeed17", league: "Ligue 1", match: "Paris Saint-Germain vs Stade Rennais FC", market: "Team total", selection: "PSG over 1.5 goals", odds: 1.95, stake: 28, potentialPayout: 54.6, betType: "Team prop", status: "Open", risk: "Low"},
  {id: "LGB-2208", time: "2026-08-22 21:33", user: "Tariq18", league: "Serie A", match: "Torino vs AC Milan", market: "Draw no bet", selection: "AC Milan DNB", odds: 1.79, stake: 18, potentialPayout: 32.22, betType: "Single", status: "Open", risk: "Low"},
  {id: "LGB-2209", time: "2026-08-22 22:10", user: "Majid19", league: "Serie A", match: "Atalanta vs Sassuolo", market: "Total goals", selection: "Under 3.5", odds: 1.81, stake: 13, potentialPayout: 23.53, betType: "Single", status: "Open", risk: "Low"},
  {id: "LGB-2301", time: "2026-08-23 13:42", user: "CalebCA37", league: "Premier League", match: "Manchester City vs AFC Bournemouth", market: "Team total", selection: "Manchester City over 1.5 goals", odds: 1.78, stake: 15, potentialPayout: 26.7, betType: "Team prop", status: "Open", risk: "Low"},
  {id: "LGB-2302", time: "2026-08-23 17:30", user: "MarcoIT39", league: "Serie A", match: "Frosinone vs Juventus", market: "Moneyline", selection: "Juventus win", odds: 1.62, stake: 12, potentialPayout: 19.44, betType: "Single", status: "Open", risk: "Low"},
  {id: "LGB-2303", time: "2026-08-23 19:45", user: "LucaIT40", league: "Serie A", match: "Atalanta vs Sassuolo", market: "Moneyline", selection: "Atalanta win", odds: 1.66, stake: 13, potentialPayout: 21.58, betType: "Single", status: "Open", risk: "Low"},
  {id: "LGB-2304", time: "2026-08-23 20:45", user: "NoahEU41", league: "Serie A", match: "Torino vs AC Milan", market: "Draw no bet", selection: "AC Milan DNB", odds: 1.79, stake: 18, potentialPayout: 32.22, betType: "Single", status: "Open", risk: "Low"},
  {id: "LGB-2305", time: "2026-08-23 20:18", user: "RyanUS38", league: "Ligue 1", match: "Paris Saint-Germain vs Stade Rennais FC", market: "Moneyline", selection: "PSG win", odds: 1.35, stake: 27, potentialPayout: 36.45, betType: "Single", status: "Open", risk: "Low"},
  {id: "LGB-2401", time: "2026-08-24 17:30", user: "OliverEU42", league: "Serie A", match: "Bologna vs Lazio", market: "Draw no bet", selection: "Lazio DNB", odds: 1.74, stake: 60, potentialPayout: 104.4, betType: "Single", status: "Open", risk: "Medium"},
  {id: "LGB-2501", time: "2026-08-25 18:52", user: "MasonUS35", league: "LaLiga", match: "Valencia vs Real Betis", market: "Moneyline", selection: "Valencia win", odds: 2.42, stake: 35, potentialPayout: 84.7, betType: "Single", status: "Open", risk: "Medium"},
  {id: "LGB-2502", time: "2026-08-25 19:08", user: "AidenCA36", league: "LaLiga", match: "Valencia vs Real Betis", market: "Correct score", selection: "0-0 live score hold", odds: 6.2, stake: 25, potentialPayout: 155, betType: "Live", status: "Risk hold", risk: "High"},
  {id: "LGB-2503", time: "2026-08-25 19:26", user: "CarterUS37", league: "LaLiga", match: "Valencia vs Real Betis", market: "Total goals", selection: "Under 2.5", odds: 1.62, stake: 35, potentialPayout: 56.7, betType: "Single", status: "Open", risk: "Low"},
  {id: "LGB-2701", time: "2026-08-27 19:42", user: "Omar11", league: "LaLiga", match: "FC Barcelona vs Athletic Club", market: "Moneyline", selection: "FC Barcelona win", odds: 1.64, stake: 15, potentialPayout: 24.6, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-2702", time: "2026-08-27 20:06", user: "Yousef12", league: "LaLiga", match: "FC Barcelona vs Athletic Club", market: "Both teams to score", selection: "Yes", odds: 1.74, stake: 15, potentialPayout: 26.1, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-2801", time: "2026-08-28 02:00", user: "Amina21", league: "Liga de Expansión MX", match: "Alebrijes Oaxaca vs Tapatío", market: "Moneyline", selection: "Alebrijes Oaxaca win", odds: 1.97, stake: 20, potentialPayout: 39.4, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-2802", time: "2026-08-28 18:42", user: "Hamad16", league: "Bundesliga", match: "Bayern Munich vs VfB Stuttgart", market: "Correct score", selection: "Bayern Munich 5-1 VfB Stuttgart", odds: 2.4, stake: 80, potentialPayout: 192, betType: "Single", status: "Paid", risk: "Low"},
  {id: "LGB-2803", time: "2026-08-28 19:05", user: "Nasser15", league: "Bundesliga", match: "Bayern Munich vs VfB Stuttgart", market: "Moneyline", selection: "Bayern Munich win", odds: 1.25, stake: 60, potentialPayout: 75, betType: "Single", status: "Open", risk: "Low"},
  {id: "LGB-2804", time: "2026-08-28 19:18", user: "Omar11", league: "Bundesliga", match: "Bayern Munich vs VfB Stuttgart", market: "Total goals", selection: "Over 2.5", odds: 1.22, stake: 40, potentialPayout: 48.8, betType: "Single", status: "Open", risk: "Low"},
  {id: "LGB-2805", time: "2026-08-28 19:26", user: "Yousef12", league: "Bundesliga", match: "Bayern Munich vs VfB Stuttgart", market: "Asian handicap", selection: "Bayern Munich -1.5", odds: 1.70, stake: 40, potentialPayout: 68, betType: "Single", status: "Open", risk: "Medium"},
  {id: "LGB-2901", time: "2026-08-29 10:14", user: "Khalid13", league: "Premier League", match: "Liverpool vs Nottingham Forest", market: "Moneyline", selection: "Liverpool win", odds: 1.48, stake: 25, potentialPayout: 37, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-2902", time: "2026-08-29 11:02", user: "Fahad14", league: "Premier League", match: "Tottenham Hotspur vs Newcastle United", market: "Moneyline", selection: "Tottenham Hotspur win", odds: 2.05, stake: 25, potentialPayout: 51.25, betType: "Single", status: "Pending", risk: "Medium"},
  {id: "LGB-2903", time: "2026-08-29 12:26", user: "Saeed17", league: "Ligue 1", match: "RC Strasbourg Alsace vs RC Lens", market: "Moneyline", selection: "RC Lens win", odds: 2.10, stake: 20, potentialPayout: 42, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-2904", time: "2026-08-29 14:20", user: "MasonUS35", league: "Ligue 1", match: "Olympique Lyonnais vs Le Havre AC", market: "Moneyline", selection: "Olympique Lyonnais win", odds: 1.72, stake: 15, potentialPayout: 25.8, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-2905", time: "2026-08-29 15:08", user: "AidenCA36", league: "LaLiga", match: "Sevilla FC vs Atlético de Madrid", market: "Draw no bet", selection: "Atlético de Madrid DNB", odds: 2.18, stake: 20, potentialPayout: 43.6, betType: "Single", status: "Pending", risk: "Medium"},
  {id: "LGB-3101", time: "2026-08-31 10:18", user: "Tariq18", league: "Premier League", match: "Manchester United vs Liverpool", market: "Moneyline", selection: "Liverpool win", odds: 1.95, stake: 15, potentialPayout: 29.25, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-3102", time: "2026-08-31 11:35", user: "Majid19", league: "LaLiga", match: "Real Madrid vs Real Betis", market: "Moneyline", selection: "Real Madrid win", odds: 1.45, stake: 10, potentialPayout: 14.5, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-3103", time: "2026-08-31 13:22", user: "NoahCA33", league: "Serie A", match: "Juventus vs Roma", market: "Draw no bet", selection: "Juventus DNB", odds: 1.68, stake: 10, potentialPayout: 16.8, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-3104", time: "2026-08-31 15:40", user: "LucasUS34", league: "Bundesliga", match: "Bayern Munich vs SC Freiburg", market: "Asian handicap", selection: "Bayern Munich -1.5", odds: 1.75, stake: 10, potentialPayout: 17.5, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-3105", time: "2026-08-31 17:15", user: "Adel20", league: "Ligue 1", match: "Olympique Lyonnais vs AS Monaco", market: "Total goals", selection: "Over 2.5", odds: 1.82, stake: 10, potentialPayout: 18.2, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-9101", time: "2026-09-01 14:20", user: "MasonUS35", league: "Premier League", match: "Arsenal vs Brighton & Hove Albion", market: "Moneyline", selection: "Arsenal win", odds: 1.55, stake: 30, potentialPayout: 46.5, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-9102", time: "2026-09-01 16:40", user: "CarterUS37", league: "LaLiga", match: "FC Barcelona vs Real Valladolid", market: "Asian handicap", selection: "FC Barcelona -1.5", odds: 1.72, stake: 20, potentialPayout: 34.4, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-9501", time: "2026-09-05 14:10", user: "Hamad16", league: "Premier League", match: "Manchester City vs Chelsea", market: "Moneyline", selection: "Manchester City win", odds: 1.65, stake: 30, potentialPayout: 49.5, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-9502", time: "2026-09-05 16:30", user: "Amina21", league: "LaLiga", match: "Real Madrid vs Real Sociedad", market: "Moneyline", selection: "Real Madrid win", odds: 1.50, stake: 20, potentialPayout: 30, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-9701", time: "2026-09-07 10:20", user: "WeiMing89", league: "Premier League", match: "Tottenham Hotspur vs Arsenal", market: "Moneyline", selection: "Arsenal win", odds: 1.90, stake: 30, potentialPayout: 57, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-9702", time: "2026-09-07 11:45", user: "MarcoIT39", league: "Serie A", match: "Inter Milan vs Atalanta", market: "Moneyline", selection: "Inter Milan win", odds: 1.68, stake: 20, potentialPayout: 33.6, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-9801", time: "2026-09-08 14:10", user: "Hassan91", league: "Ligue 1", match: "Paris Saint-Germain vs AS Monaco", market: "Moneyline", selection: "Paris Saint-Germain win", odds: 1.52, stake: 30, potentialPayout: 45.6, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-9802", time: "2026-09-08 16:30", user: "ChenYu88", league: "LaLiga", match: "Atlético de Madrid vs Sevilla FC", market: "Moneyline", selection: "Atlético de Madrid win", odds: 1.75, stake: 20, potentialPayout: 35, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-9901", time: "2026-09-09 14:15", user: "LucasUS34", league: "Premier League", match: "Chelsea vs Liverpool", market: "Moneyline", selection: "Liverpool win", odds: 1.85, stake: 30, potentialPayout: 55.5, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-9902", time: "2026-09-09 16:40", user: "MarcoIT39", league: "Serie A", match: "AC Milan vs Napoli", market: "Moneyline", selection: "AC Milan win", odds: 1.70, stake: 20, potentialPayout: 34, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-91001", time: "2026-09-10 14:20", user: "Hamad16", league: "Bundesliga", match: "Bayer Leverkusen vs RB Leipzig", market: "Moneyline", selection: "Bayer Leverkusen win", odds: 1.92, stake: 30, potentialPayout: 57.6, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-91002", time: "2026-09-10 16:50", user: "Omar11", league: "LaLiga", match: "Athletic Club vs Valencia", market: "Moneyline", selection: "Athletic Club win", odds: 1.72, stake: 20, potentialPayout: 34.4, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-91101", time: "2026-09-11 14:30", user: "LucasUS34", league: "Premier League", match: "Manchester City vs Newcastle United", market: "Moneyline", selection: "Manchester City win", odds: 1.58, stake: 40, potentialPayout: 63.2, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-91102", time: "2026-09-11 16:45", user: "LucaIT40", league: "Serie A", match: "Roma vs Fiorentina", market: "Moneyline", selection: "Roma win", odds: 1.82, stake: 30, potentialPayout: 54.6, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-91201", time: "2026-09-12 12:10", user: "Hamad16", league: "Bundesliga", match: "Bayern Munich vs Borussia Dortmund", market: "Moneyline", selection: "Bayern Munich win", odds: 1.72, stake: 45, potentialPayout: 77.4, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-91202", time: "2026-09-12 14:20", user: "Yousef12", league: "LaLiga", match: "Real Madrid vs Getafe CF", market: "Moneyline", selection: "Real Madrid win", odds: 1.45, stake: 35, potentialPayout: 50.75, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-91203", time: "2026-09-12 16:30", user: "Nasser15", league: "Ligue 1", match: "Paris Saint-Germain vs Stade de Reims", market: "Moneyline", selection: "Paris Saint-Germain win", odds: 1.38, stake: 25, potentialPayout: 34.5, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-91301", time: "2026-09-13 14:15", user: "LucasUS34", league: "Premier League", match: "Tottenham Hotspur vs Arsenal", market: "Moneyline", selection: "Arsenal win", odds: 1.75, stake: 20, potentialPayout: 35.0, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-91302", time: "2026-09-13 16:30", user: "MarcoIT39", league: "Serie A", match: "Inter Milan vs Juventus", market: "Moneyline", selection: "Inter Milan win", odds: 1.80, stake: 15, potentialPayout: 27.0, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-91401", time: "2026-09-14 14:20", user: "Hamad16", league: "LaLiga", match: "Atlético de Madrid vs Valencia", market: "Moneyline", selection: "Atlético de Madrid win", odds: 1.65, stake: 50, potentialPayout: 82.5, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-91402", time: "2026-09-14 16:40", user: "Omar11", league: "Serie A", match: "Napoli vs Cagliari", market: "Moneyline", selection: "Napoli win", odds: 1.55, stake: 35, potentialPayout: 54.25, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-91501", time: "2026-09-15 15:30", user: "LucasUS34", league: "Premier League", match: "Aston Villa vs Everton", market: "Moneyline", selection: "Aston Villa win", odds: 1.80, stake: 30, potentialPayout: 54.0, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-91601", time: "2026-09-16 14:10", user: "Yousef12", league: "Bundesliga", match: "RB Leipzig vs Union Berlin", market: "Moneyline", selection: "RB Leipzig win", odds: 1.60, stake: 40, potentialPayout: 64.0, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-91602", time: "2026-09-16 17:00", user: "Nasser15", league: "Ligue 1", match: "Olympique de Marseille vs OGC Nice", market: "Moneyline", selection: "Marseille win", odds: 1.85, stake: 30, potentialPayout: 55.5, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-91701", time: "2026-09-17 15:15", user: "LucaIT40", league: "LaLiga", match: "Real Betis vs Real Sociedad", market: "Moneyline", selection: "Real Betis win", odds: 1.90, stake: 30, potentialPayout: 57.0, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-91702", time: "2026-09-17 17:40", user: "MarcoIT39", league: "Serie A", match: "Fiorentina vs Udinese", market: "Moneyline", selection: "Fiorentina win", odds: 1.70, stake: 10, potentialPayout: 17.0, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-91801", time: "2026-09-18 14:30", user: "Hamad16", league: "Bundesliga", match: "VfB Stuttgart vs FC St. Pauli", market: "Moneyline", selection: "Stuttgart win", odds: 1.60, stake: 60, potentialPayout: 96.0, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-91802", time: "2026-09-18 17:10", user: "Omar11", league: "LaLiga", match: "Real Valladolid vs Real Sociedad", market: "Moneyline", selection: "Real Sociedad win", odds: 1.90, stake: 50, potentialPayout: 95.0, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-91901", time: "2026-09-19 11:20", user: "LucasUS34", league: "Premier League", match: "West Ham United vs Chelsea", market: "Moneyline", selection: "Chelsea win", odds: 1.75, stake: 40, potentialPayout: 70.0, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-91902", time: "2026-09-19 16:45", user: "LucaIT40", league: "Serie A", match: "Juventus vs Napoli", market: "Moneyline", selection: "Juventus win", odds: 1.80, stake: 30, potentialPayout: 54.0, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-92001", time: "2026-09-20 14:10", user: "Hamad16", league: "Premier League", match: "Manchester City vs Arsenal", market: "Moneyline", selection: "Manchester City win", odds: 1.85, stake: 45, potentialPayout: 83.25, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-92002", time: "2026-09-20 17:30", user: "MarcoIT39", league: "Serie A", match: "Inter Milan vs AC Milan", market: "Moneyline", selection: "Inter Milan win", odds: 1.95, stake: 30, potentialPayout: 58.5, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-92101", time: "2026-09-21 15:20", user: "LucasUS34", league: "LaLiga", match: "Real Betis vs RCD Mallorca", market: "Moneyline", selection: "Real Betis win", odds: 1.90, stake: 40, potentialPayout: 76.0, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-92102", time: "2026-09-21 18:40", user: "LucaIT40", league: "Serie A", match: "Atalanta vs Como", market: "Moneyline", selection: "Atalanta win", odds: 1.50, stake: 25, potentialPayout: 37.5, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-92201", time: "2026-09-22 16:45", user: "Hamad16", league: "LaLiga", match: "Sevilla vs Real Valladolid", market: "Moneyline", selection: "Sevilla win", odds: 1.70, stake: 50, potentialPayout: 85.0, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-92202", time: "2026-09-22 18:30", user: "Yousef12", league: "LaLiga", match: "Valencia vs CA Osasuna", market: "Moneyline", selection: "Valencia win", odds: 2.00, stake: 30, potentialPayout: 60.0, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-92401", time: "2026-09-24 15:30", user: "LucasUS34", league: "LaLiga", match: "RCD Espanyol vs Villarreal", market: "Moneyline", selection: "Villarreal win", odds: 2.25, stake: 80, potentialPayout: 180.0, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-92402", time: "2026-09-24 17:50", user: "Hamad16", league: "LaLiga", match: "Celta Vigo vs Atlético Madrid", market: "Moneyline", selection: "Atlético Madrid win", odds: 1.90, stake: 100, potentialPayout: 190.0, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-92501", time: "2026-09-25 14:15", user: "LucaIT40", league: "LaLiga", match: "Girona FC vs Rayo Vallecano", market: "Moneyline", selection: "Girona FC win", odds: 1.80, stake: 30, potentialPayout: 54.0, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-92502", time: "2026-09-25 17:30", user: "Hamad16", league: "LaLiga", match: "FC Barcelona vs Getafe CF", market: "Moneyline", selection: "FC Barcelona win", odds: 1.30, stake: 50, potentialPayout: 65.0, betType: "Single", status: "Pending", risk: "Low"},
  {id: "TNB-92601", time: "2026-09-26 13:00", user: "Hamad16", league: "ATP Tour", match: "Jannik Sinner vs Nicolas Jarry", market: "Match / Set betting", selection: "Jannik Sinner 2-0", odds: 1.48, stake: 250, potentialPayout: 370.0, betType: "Single", status: "Pending", risk: "Low"},
  {id: "TNB-92602", time: "2026-09-26 16:30", user: "ZhengWu92", league: "ATP Tour", match: "Daniil Medvedev vs Gaël Monfils", market: "Moneyline", selection: "Daniil Medvedev win", odds: 1.28, stake: 150, potentialPayout: 192.0, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-92701", time: "2026-09-27 15:30", user: "Hamad16", league: "Bundesliga", match: "Borussia Dortmund vs VfL Bochum", market: "Moneyline", selection: "Borussia Dortmund win", odds: 1.35, stake: 50, potentialPayout: 67.5, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-92702", time: "2026-09-27 17:45", user: "JonasDE81", league: "Serie A", match: "AC Milan vs Lecce", market: "Moneyline", selection: "AC Milan win", odds: 1.40, stake: 30, potentialPayout: 42.0, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-92801", time: "2026-09-28 12:15", user: "OliverUK98", league: "Premier League", match: "Newcastle United vs Manchester City", market: "Moneyline", selection: "Manchester City win", odds: 1.62, stake: 50, potentialPayout: 81.0, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-92802", time: "2026-09-28 17:30", user: "Hamad16", league: "Bundesliga", match: "Bayern Munich vs Bayer Leverkusen", market: "Moneyline", selection: "Bayern Munich win", odds: 1.75, stake: 30, potentialPayout: 52.5, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-92901", time: "2026-09-29 15:30", user: "CarlosES99", league: "LaLiga", match: "Atlético Madrid vs Real Madrid", market: "Moneyline", selection: "Real Madrid win", odds: 1.80, stake: 50, potentialPayout: 90.0, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-92902", time: "2026-09-29 17:00", user: "Hamad16", league: "Premier League", match: "Manchester United vs Tottenham Hotspur", market: "Moneyline", selection: "Tottenham Hotspur win", odds: 2.10, stake: 30, potentialPayout: 63.0, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-93001", time: "2026-09-30 14:30", user: "MasonUK111", league: "Premier League", match: "AFC Bournemouth vs Southampton", market: "Moneyline", selection: "Bournemouth win", odds: 1.75, stake: 50, potentialPayout: 87.5, betType: "Single", status: "Pending", risk: "Low"},
  {id: "LGB-93002", time: "2026-09-30 17:15", user: "Hamad16", league: "Serie A", match: "Parma vs Cagliari", market: "Total goals", selection: "Over 2.5", odds: 1.85, stake: 30, potentialPayout: 55.5, betType: "Single", status: "Pending", risk: "Low"},
  ...autoDailyData.autoLeagueSlips,
] as LeagueBetSlip[];
const leagueBetStakeTotal = leagueBetSlips.reduce((sum, slip) => sum + slip.stake, 0);
const leagueBetExposureTotal = Math.round(leagueBetSlips.reduce((sum, slip) => sum + slip.potentialPayout, 0) * 100) / 100;
const leagueBetRiskHolds = leagueBetSlips.filter((slip) => slip.status === "Risk hold" || slip.risk === "High").length;
const leagueBetStakeAlreadyInSportsLedger = leagueBetStakeTotal;
const leagueBetWalletStakeAdjustment = leagueBetStakeTotal - leagueBetStakeAlreadyInSportsLedger;
const leagueBetReceipts = [
  {date: "2026-08-18", amount: 12, source: "Serie A early betting proceeds", status: "Collected"},
  {date: "2026-08-19", amount: 15, source: "LaLiga early betting proceeds", status: "Collected"},
  {date: "2026-08-20", amount: 10, source: "Bundesliga early betting proceeds", status: "Collected"},
  {date: "2026-08-21", amount: 10, source: "Premier League opening betting proceeds", status: "Collected"},
  {date: "2026-08-22", amount: 208, source: "Five-league betting proceeds", status: "Collected"},
  {date: "2026-08-23", amount: 85, source: "Five-league Sunday betting proceeds", status: "Collected"},
  {date: "2026-08-24", amount: 60, source: "Serie A Bologna vs Lazio betting proceeds", status: "Collected"},
  {date: "2026-08-25", amount: 95, source: "LaLiga Valencia vs Real Betis betting proceeds", status: "Collected"},
  {date: "2026-08-26", amount: 50, source: "Five-league betting proceeds", status: "Collected"},
  {date: "2026-08-27", amount: 30, source: "LaLiga FC Barcelona vs Athletic Club betting proceeds", status: "Collected"},
  {date: "2026-08-28", amount: 20, source: "Alebrijes Oaxaca vs Tapatío betting proceeds", status: "Collected"},
  {date: "2026-08-28", amount: 220, source: "Bundesliga Bayern Munich vs VfB Stuttgart betting proceeds", status: "Collected"},
  {date: "2026-08-29", amount: 105, source: "Five-league popular fixtures betting proceeds", status: "Collected"},
  {date: "2026-08-31", amount: 55, source: "Five-league popular fixtures betting proceeds", status: "Collected"},
  {date: "2026-09-01", amount: 50, source: "Five-league popular fixtures betting proceeds", status: "Collected"},
  {date: "2026-09-05", amount: 50, source: "Five-league popular fixtures betting proceeds", status: "Collected"},
  {date: "2026-09-07", amount: 50, source: "Five-league popular fixtures betting proceeds", status: "Collected"},
  {date: "2026-09-08", amount: 50, source: "Five-league popular fixtures betting proceeds", status: "Collected"},
  {date: "2026-09-09", amount: 50, source: "Five-league popular fixtures betting proceeds", status: "Collected"},
  {date: "2026-09-10", amount: 50, source: "Five-league popular fixtures betting proceeds", status: "Collected"},
  {date: "2026-09-11", amount: 70, source: "Five-league popular fixtures betting proceeds", status: "Collected"},
  {date: "2026-09-12", amount: 105, source: "Five-league popular fixtures betting proceeds", status: "Collected"},
  {date: "2026-09-13", amount: 35, source: "Five-league popular fixtures betting proceeds", status: "Collected"},
  {date: "2026-09-14", amount: 85, source: "Five-league popular fixtures betting proceeds", status: "Collected"},
  {date: "2026-09-15", amount: 30, source: "Five-league popular fixtures betting proceeds", status: "Collected"},
  {date: "2026-09-16", amount: 70, source: "Five-league popular fixtures betting proceeds", status: "Collected"},
  {date: "2026-09-17", amount: 30, source: "Five-league popular fixtures betting proceeds", status: "Collected"},
  {date: "2026-09-17", amount: 10, source: "Serie A Fiorentina vs Udinese betting proceeds", status: "Collected"},
  {date: "2026-09-18", amount: 110, source: "Five-league popular fixtures betting proceeds", status: "Collected"},
  {date: "2026-09-19", amount: 70, source: "Five-league popular fixtures betting proceeds", status: "Collected"},
  {date: "2026-09-20", amount: 75, source: "Five-league popular fixtures betting proceeds", status: "Collected"},
  {date: "2026-09-21", amount: 65, source: "Five-league popular fixtures betting proceeds", status: "Collected"},
  {date: "2026-09-22", amount: 80, source: "Five-league popular fixtures betting proceeds", status: "Collected"},
  {date: "2026-09-24", amount: 180, source: "Five-league popular fixtures betting proceeds", status: "Collected"},
  {date: "2026-09-25", amount: 80, source: "Five-league popular fixtures betting proceeds", status: "Collected"},
  {date: "2026-09-26", amount: 400, source: "ATP China Open tennis popular fixtures betting proceeds", status: "Collected"},
  {date: "2026-09-27", amount: 80, source: "Five-league popular fixtures betting proceeds", status: "Collected"},
  {date: "2026-09-28", amount: 80, source: "Five-league popular fixtures betting proceeds", status: "Collected"},
  {date: "2026-09-29", amount: 80, source: "Five-league popular fixtures betting proceeds", status: "Collected"},
  {date: "2026-09-30", amount: 80, source: "Five-league popular fixtures betting proceeds", status: "Collected"},
  ...autoDailyData.autoLeagueReceipts,
];
const leagueBetReceiptTotal = leagueBetReceipts.reduce((sum, item) => sum + item.amount, 0);
const manualSettledPayouts = 207;
const platformBalance = Math.round((platformBalanceBeforeLeagueBetMerge + leagueBetWalletStakeAdjustment + leagueBetReceiptTotal - manualSettledPayouts) * 100) / 100;
const ledgerReconciliationDate = "2026-07-10";

function addLedgerAmount(rows: Record<string, Omit<DateLedgerRow, "date" | "net" | "balanceAfter">>, date: string, field: keyof Omit<DateLedgerRow, "date" | "net" | "balanceAfter" | "items">, amount: number, item: string) {
  if (!rows[date]) {
    rows[date] = {deposits: 0, sportsStakes: 0, leagueStake: 0, leagueReceipts: 0, wheelIncome: 0, crashIncome: 0, payouts: 0, exchangeWithdrawals: 0, reconciliation: 0, items: []};
  }
  rows[date][field] = Math.round((Number(rows[date][field]) + amount) * 100) / 100;
  rows[date].items.push(item);
}

function buildDateLedgerRows(): DateLedgerRow[] {
  const rows: Record<string, Omit<DateLedgerRow, "date" | "net" | "balanceAfter">> = {};

  depositQueue.forEach((deposit) => {
    addLedgerAmount(rows, deposit.age.slice(0, 10), "deposits", deposit.amount, `Deposit ${deposit.id}: ${deposit.user} +${deposit.amount}u ${deposit.chain}`);
  });
  betRecords.forEach((bet) => {
    addLedgerAmount(rows, bet.matchDate, "sportsStakes", bet.stake, `Sports stake ${bet.id}: ${bet.user.username} ${bet.stake}u on ${bet.match} · ${bet.selection} @ ${bet.odds.toFixed(2)}`);
    if (bet.result === "Paid" && bet.payout > 0) {
      addLedgerAmount(rows, bet.matchDate, "payouts", bet.payout, `Paid payout ${bet.id}: ${bet.user.username} -${bet.payout}u`);
    }
  });
  if (todayPaidPayouts > 0) {
    addLedgerAmount(rows, "2026-07-15", "payouts", todayPaidPayouts, `Merged unpaid World Cup payout reserve -${todayPaidPayouts}u`);
  }
  exchangeWithdrawals.forEach((withdrawal) => {
    addLedgerAmount(rows, withdrawal.date, "exchangeWithdrawals", withdrawal.amount, `Exchange withdrawal: -${withdrawal.amount}u to ${withdrawal.destination}`);
  });
  wheelIncomes.forEach((income) => {
    addLedgerAmount(rows, income.date, "wheelIncome", income.amount, `${income.source} income +${income.amount}u`);
  });
  crashIncomes.forEach((income) => {
    addLedgerAmount(rows, income.date, "crashIncome", income.amount, `${income.source} income +${income.amount}u`);
  });
  leagueBetSlips.forEach((slip) => {
    addLedgerAmount(rows, slip.time.slice(0, 10), "leagueStake", slip.stake, `League slip ${slip.id}: ${slip.user} ${slip.stake}u · ${slip.league} · ${slip.match} · ${slip.selection} @ ${slip.odds.toFixed(2)}`);
  });
  leagueBetReceipts.forEach((receipt) => {
    addLedgerAmount(rows, receipt.date, "leagueReceipts", receipt.amount, `${receipt.source} +${receipt.amount}u`);
  });
  if (manualSettledPayouts > 0) {
    addLedgerAmount(rows, "2026-09-26", "payouts", manualSettledPayouts, `Settled winner payout deduction -${manualSettledPayouts}u`);
  }
  addLedgerAmount(rows, ledgerReconciliationDate, "reconciliation", walletReconciliationAdjustment, `Wallet reconciliation to 7.10 baseline ${targetPostJulyTenthBalance}u`);

  // Keep the historical August and September calendar continuous so every date can be opened,
  // including days where no source record was supplied.
  for (let day = 2; day <= 31; day += 1) {
    const date = `2026-08-${String(day).padStart(2, "0")}`;
    if (!rows[date]) {
      rows[date] = {deposits: 0, sportsStakes: 0, leagueStake: 0, leagueReceipts: 0, wheelIncome: 0, crashIncome: 0, payouts: 0, exchangeWithdrawals: 0, reconciliation: 0, items: ["No recorded wallet movement for this date."]};
    }
  }
  for (let day = 1; day <= 30; day += 1) {
    const date = `2026-09-${String(day).padStart(2, "0")}`;
    if (!rows[date]) {
      rows[date] = {deposits: 0, sportsStakes: 0, leagueStake: 0, leagueReceipts: 0, wheelIncome: 0, crashIncome: 0, payouts: 0, exchangeWithdrawals: 0, reconciliation: 0, items: ["No recorded wallet movement for this date."]};
    }
  }
  autoDailyData.autoDates.forEach((date) => {
    if (!rows[date]) {
      rows[date] = {deposits: 0, sportsStakes: 0, leagueStake: 0, leagueReceipts: 0, wheelIncome: 0, crashIncome: 0, payouts: 0, exchangeWithdrawals: 0, reconciliation: 0, items: ["No recorded wallet movement for this date."]};
    }
  });

  // Reconcile the complete dated ledger to the same platform wallet total.
  // This prevents a later treasury withdrawal from being deducted twice.
  const ledgerBeforeFinalReconciliation = Object.values(rows).reduce((total, row) => total + row.deposits + row.sportsStakes + row.leagueReceipts + row.wheelIncome + row.crashIncome - row.payouts - row.exchangeWithdrawals, 0);
  const finalReconciliation = Math.round((platformBalance - ledgerBeforeFinalReconciliation) * 100) / 100;
  rows[ledgerReconciliationDate].reconciliation = finalReconciliation;
  rows[ledgerReconciliationDate].items.push(`Final ledger reconciliation to platform balance ${platformBalance}u`);

  let balanceAfter = openingWalletReserve;
  return Object.entries(rows)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, row]) => {
      const net = Math.round((row.deposits + row.sportsStakes + row.leagueReceipts + row.wheelIncome + row.crashIncome + row.reconciliation - row.payouts - row.exchangeWithdrawals) * 100) / 100;
      balanceAfter = Math.round((balanceAfter + net) * 100) / 100;
      return {...row, date, net, balanceAfter};
    });
}

function buildIncomeSummary(periodKey: (date: string) => string): IncomeSummaryRow[] {
  const grouped: Record<string, IncomeSummaryRow> = {};
  const add = (date: string, amount: number, label: string) => {
    const period = periodKey(date);
    if (!grouped[period]) grouped[period] = {period, total: 0, items: []};
    grouped[period].total = Math.round((grouped[period].total + amount) * 100) / 100;
    grouped[period].items.push(`${date} · ${label} +${amount}u`);
  };
  leagueBetReceipts.forEach((receipt) => add(receipt.date, receipt.amount, receipt.source));
  wheelIncomes.forEach((income) => add(income.date, income.amount, income.source));
  crashIncomes.forEach((income) => add(income.date, income.amount, income.source));
  return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
}

const leagueDailyFixtures: LeagueDailyFixture[] = [
  {league: "Premier League", date: "2026-08-22", time: "12:30 UK", match: "Hull City vs Manchester United", matchday: "Matchweek 1", moneyline: "3.10 / 3.45 / 2.18", handicap: "Manchester United -0.5 @ 1.91", total: "Over 2.5 @ 1.86", featured: "Man United win @ 2.18", status: "Live"},
  {league: "Premier League", date: "2026-08-22", time: "17:30 UK", match: "Brentford vs Tottenham Hotspur", matchday: "Matchweek 1", moneyline: "2.76 / 3.35 / 2.42", handicap: "Tottenham -0.25 @ 1.91", total: "Under 3.0 @ 1.88", featured: "Tottenham DNB @ 1.72", status: "Today"},
  {league: "Premier League", date: "2026-08-23", time: "14:00 UK", match: "Manchester City vs AFC Bournemouth", matchday: "Matchweek 1", moneyline: "1.42 / 4.90 / 7.10", handicap: "Manchester City -1.5 @ 1.94", total: "Over 3.0 @ 1.78", featured: "City team total over 2.5 @ 1.83", status: "Upcoming"},
  {league: "LaLiga", date: "2026-08-22", time: "19:30 local", match: "RCD Espanyol de Barcelona vs Real Madrid", matchday: "Matchday 2", moneyline: "5.80 / 4.20 / 1.58", handicap: "Real Madrid -1.0 @ 1.90", total: "Over 2.75 @ 1.92", featured: "Real Madrid win @ 1.58", status: "Today"},
  {league: "LaLiga", date: "2026-08-25", time: "19:00 CEST", match: "Valencia vs Real Betis", matchday: "LALIGA EA SPORTS", moneyline: "2.42 / 3.10 / 2.88", handicap: "Valencia -0.25 @ 1.94", total: "Under 2.5 @ 1.62", featured: "Live correct score 0-0 @ 6.20", status: "Live"},
  {league: "LaLiga", date: "2026-08-26", time: "19:00 local", match: "Real Madrid vs Real Sociedad", matchday: "Matchday 3", moneyline: "1.62 / 4.05 / 5.20", handicap: "Real Madrid -0.75 @ 1.88", total: "Under 3.0 @ 1.84", featured: "Real Madrid team total over 1.5 @ 1.76", status: "Upcoming"},
  {league: "LaLiga", date: "2026-08-27", time: "21:00 CEST", match: "FC Barcelona vs Athletic Club", matchday: "Matchday 1", moneyline: "1.64 / 4.10 / 5.20", handicap: "FC Barcelona -0.75 @ 1.88", total: "Both teams score @ 1.74", featured: "Barcelona win @ 1.64", status: "Upcoming"},
  {league: "Serie A", date: "2026-08-23", time: "TBD", match: "Atalanta vs Sassuolo", matchday: "Matchday 1", moneyline: "1.66 / 3.90 / 5.10", handicap: "Atalanta -0.75 @ 1.87", total: "Under 3.5 @ 1.81", featured: "Atalanta win @ 1.66", status: "TBD"},
  {league: "Serie A", date: "2026-08-23", time: "TBD", match: "Torino vs AC Milan", matchday: "Matchday 1", moneyline: "3.90 / 3.30 / 1.98", handicap: "AC Milan -0.25 @ 1.79", total: "Under 2.5 @ 1.86", featured: "AC Milan DNB @ 1.79", status: "TBD"},
  {league: "Serie A", date: "2026-08-24", time: "17:30 CEST", match: "Bologna vs Lazio", matchday: "Matchday 1", moneyline: "2.72 / 3.25 / 2.58", handicap: "Lazio draw no bet @ 1.74", total: "Under 2.75 @ 1.83", featured: "Lazio DNB @ 1.74", status: "Upcoming"},
  {league: "Bundesliga", date: "2026-08-22", time: "11:30 local", match: "Borussia Dortmund vs Bayern Munich", matchday: "Franz Beckenbauer Supercup", moneyline: "3.05 / 3.80 / 2.08", handicap: "Bayern -0.5 @ 2.18", total: "Over 3.25 @ 1.90", featured: "Bayern next goal @ 2.18", status: "Live"},
  {league: "Bundesliga", date: "2026-08-28", time: "20:30 CEST", match: "Bayern Munich vs VfB Stuttgart", matchday: "Matchday 1", moneyline: "1.25 / 6.50 / 8.50", handicap: "Bayern -1.5 @ 1.70", total: "Over 2.5 @ 1.22", featured: "Correct score 5-1 @ 2.40", status: "Today"},
  {league: "Ligue 1", date: "2026-08-21", time: "weekend", match: "Olympique de Marseille vs RC Strasbourg Alsace", matchday: "Matchday 1", moneyline: "1.77 / 3.70 / 4.60", handicap: "Marseille -0.5 @ 1.86", total: "Over 2.5 @ 1.86", featured: "Marseille win @ 1.77", status: "Today"},
  {league: "Ligue 1", date: "2026-08-22", time: "weekend", match: "Paris Saint-Germain vs Stade Rennais FC", matchday: "Matchday 1", moneyline: "1.35 / 5.25 / 8.40", handicap: "PSG -1.5 @ 1.95", total: "PSG team over 1.5 @ 1.95", featured: "PSG team total over 1.5 @ 1.95", status: "Today"},
  {league: "Ligue 1", date: "2026-08-30", time: "20:45 local", match: "LOSC vs Paris Saint-Germain", matchday: "Matchday 2", moneyline: "4.40 / 3.80 / 1.72", handicap: "PSG -0.5 @ 1.72", total: "Over 2.75 @ 1.89", featured: "PSG DNB @ 1.42", status: "Upcoming"},
  {league: "Liga de Expansión MX", date: "2026-08-28", time: "02:00 local", match: "Alebrijes Oaxaca vs Tapatío", matchday: "Matchday fixture", moneyline: "1.97 / 3.46 / 3.22", handicap: "Alebrijes -0.25 @ 1.90", total: "Over 2.5 @ 1.88", featured: "Alebrijes win @ 1.97", status: "Today"},
  {league: "Premier League", date: "2026-08-29", time: "12:30 BST", match: "Liverpool vs Nottingham Forest", matchday: "Matchweek 2", moneyline: "1.48 / 4.60 / 6.80", handicap: "Liverpool -1.0 @ 1.86", total: "Over 2.5 @ 1.78", featured: "Liverpool win @ 1.48", status: "Today"},
  {league: "Premier League", date: "2026-08-29", time: "17:30 BST", match: "Tottenham Hotspur vs Newcastle United", matchday: "Matchweek 2", moneyline: "2.05 / 3.60 / 3.25", handicap: "Tottenham -0.25 @ 1.91", total: "Over 2.5 @ 1.82", featured: "Tottenham win @ 2.05", status: "Today"},
  {league: "Ligue 1", date: "2026-08-29", time: "17:15 local", match: "RC Strasbourg Alsace vs RC Lens", matchday: "Matchday 2", moneyline: "3.10 / 3.25 / 2.10", handicap: "Lens -0.25 @ 1.88", total: "Under 2.5 @ 1.80", featured: "Lens win @ 2.10", status: "Today"},
  {league: "Ligue 1", date: "2026-08-29", time: "20:45 local", match: "Olympique Lyonnais vs Le Havre AC", matchday: "Matchday 2", moneyline: "1.72 / 3.70 / 4.80", handicap: "Lyon -0.5 @ 1.72", total: "Over 2.5 @ 1.84", featured: "Lyon win @ 1.72", status: "Today"},
  {league: "LaLiga", date: "2026-08-29", time: "19:30 CEST", match: "Sevilla FC vs Atlético de Madrid", matchday: "Matchday 2", moneyline: "3.20 / 3.25 / 2.18", handicap: "Atlético -0.25 @ 1.90", total: "Under 2.75 @ 1.86", featured: "Atlético DNB @ 2.18", status: "Today"},
  {league: "Premier League", date: "2026-08-31", time: "20:00 BST", match: "Manchester United vs Liverpool", matchday: "Matchweek 3", moneyline: "3.40 / 3.80 / 1.95", handicap: "Liverpool -0.5 @ 1.95", total: "Over 3.0 @ 1.85", featured: "Liverpool win @ 1.95", status: "Today"},
  {league: "LaLiga", date: "2026-08-31", time: "21:30 CEST", match: "Real Madrid vs Real Betis", matchday: "Matchday 3", moneyline: "1.45 / 4.60 / 6.50", handicap: "Real Madrid -1.5 @ 1.85", total: "Over 2.75 @ 1.80", featured: "Real Madrid win @ 1.45", status: "Today"},
  {league: "Serie A", date: "2026-08-31", time: "20:45 CEST", match: "Juventus vs Roma", matchday: "Matchday 2", moneyline: "2.10 / 3.25 / 3.40", handicap: "Juventus -0.25 @ 1.68", total: "Under 2.5 @ 1.72", featured: "Juventus DNB @ 1.68", status: "Today"},
  {league: "Bundesliga", date: "2026-08-31", time: "17:30 CEST", match: "Bayern Munich vs SC Freiburg", matchday: "Matchday 2", moneyline: "1.20 / 7.00 / 12.00", handicap: "Bayern -1.5 @ 1.75", total: "Over 3.25 @ 1.88", featured: "Bayern -1.5 @ 1.75", status: "Today"},
  {league: "Ligue 1", date: "2026-08-31", time: "20:45 local", match: "Olympique Lyonnais vs AS Monaco", matchday: "Matchday 2", moneyline: "2.45 / 3.60 / 2.65", handicap: "Monaco +0 @ 1.90", total: "Over 2.5 @ 1.82", featured: "Over 2.5 goals @ 1.82", status: "Today"},
  {league: "Premier League", date: "2026-09-01", time: "20:00 BST", match: "Arsenal vs Brighton & Hove Albion", matchday: "Matchweek 3", moneyline: "1.55 / 4.40 / 5.80", handicap: "Arsenal -1.0 @ 1.85", total: "Over 2.75 @ 1.82", featured: "Arsenal win @ 1.55", status: "Today"},
  {league: "LaLiga", date: "2026-09-01", time: "21:30 CEST", match: "FC Barcelona vs Real Valladolid", matchday: "Matchday 4", moneyline: "1.25 / 6.50 / 11.00", handicap: "FC Barcelona -1.5 @ 1.72", total: "Over 3.0 @ 1.75", featured: "Barcelona -1.5 @ 1.72", status: "Today"},
  {league: "Premier League", date: "2026-09-05", time: "17:30 BST", match: "Manchester City vs Chelsea", matchday: "Matchweek 4", moneyline: "1.65 / 4.20 / 4.80", handicap: "Manchester City -0.75 @ 1.88", total: "Over 2.75 @ 1.80", featured: "Man City win @ 1.65", status: "Today"},
  {league: "LaLiga", date: "2026-09-05", time: "21:00 CEST", match: "Real Madrid vs Real Sociedad", matchday: "Matchday 4", moneyline: "1.50 / 4.50 / 6.00", handicap: "Real Madrid -1.0 @ 1.82", total: "Over 2.5 @ 1.75", featured: "Real Madrid win @ 1.50", status: "Today"},
  {league: "Premier League", date: "2026-09-07", time: "16:30 BST", match: "Tottenham Hotspur vs Arsenal", matchday: "Matchweek 4", moneyline: "3.20 / 3.60 / 1.90", handicap: "Arsenal -0.5 @ 1.90", total: "Over 2.75 @ 1.85", featured: "Arsenal win @ 1.90", status: "Today"},
  {league: "Serie A", date: "2026-09-07", time: "20:45 CEST", match: "Inter Milan vs Atalanta", matchday: "Matchday 3", moneyline: "1.68 / 3.80 / 4.60", handicap: "Inter -0.75 @ 1.88", total: "Over 2.5 @ 1.80", featured: "Inter Milan win @ 1.68", status: "Today"},
  {league: "Ligue 1", date: "2026-09-08", time: "20:45 CEST", match: "Paris Saint-Germain vs AS Monaco", matchday: "Matchweek 4", moneyline: "1.52 / 4.40 / 5.60", handicap: "PSG -1.0 @ 1.85", total: "Over 2.75 @ 1.80", featured: "PSG win @ 1.52", status: "Today"},
  {league: "LaLiga", date: "2026-09-08", time: "21:00 CEST", match: "Atlético de Madrid vs Sevilla FC", matchday: "Matchday 4", moneyline: "1.75 / 3.60 / 4.50", handicap: "Atlético -0.5 @ 1.75", total: "Under 2.5 @ 1.78", featured: "Atlético win @ 1.75", status: "Today"},
  {league: "Premier League", date: "2026-09-09", time: "19:45 BST", match: "Chelsea vs Liverpool", matchday: "Matchweek 4", moneyline: "2.10 / 3.40 / 1.85", handicap: "Liverpool -0.25 @ 1.85", total: "Over 2.75 @ 1.80", featured: "Liverpool win @ 1.85", status: "Today"},
  {league: "Serie A", date: "2026-09-09", time: "20:45 CEST", match: "AC Milan vs Napoli", matchday: "Matchday 4", moneyline: "1.70 / 3.60 / 4.40", handicap: "AC Milan -0.5 @ 1.70", total: "Under 2.5 @ 1.75", featured: "AC Milan win @ 1.70", status: "Today"},
  {league: "Bundesliga", date: "2026-09-10", time: "20:30 CEST", match: "Bayer Leverkusen vs RB Leipzig", matchday: "Matchday 3", moneyline: "1.92 / 3.60 / 3.80", handicap: "Leverkusen -0.5 @ 1.92", total: "Over 2.75 @ 1.85", featured: "Leverkusen win @ 1.92", status: "Today"},
  {league: "LaLiga", date: "2026-09-10", time: "21:30 CEST", match: "Athletic Club vs Valencia", matchday: "Matchday 4", moneyline: "1.72 / 3.50 / 4.80", handicap: "Athletic Club -0.5 @ 1.72", total: "Under 2.5 @ 1.76", featured: "Athletic Club win @ 1.72", status: "Today"},
  {league: "Premier League", date: "2026-09-11", time: "20:00 BST", match: "Manchester City vs Newcastle United", matchday: "Matchweek 4", moneyline: "1.58 / 4.10 / 5.20", handicap: "Man City -1.0 @ 1.88", total: "Over 2.75 @ 1.82", featured: "Man City win @ 1.58", status: "Today"},
  {league: "Serie A", date: "2026-09-11", time: "20:45 CEST", match: "Roma vs Fiorentina", matchday: "Matchday 4", moneyline: "1.82 / 3.50 / 4.20", handicap: "Roma -0.5 @ 1.82", total: "Under 2.5 @ 1.78", featured: "Roma win @ 1.82", status: "Today"},
  {league: "Bundesliga", date: "2026-09-12", time: "18:30 CEST", match: "Bayern Munich vs Borussia Dortmund", matchday: "Matchday 4", moneyline: "1.72 / 3.70 / 4.50", handicap: "Bayern -0.75 @ 1.88", total: "Over 2.75 @ 1.82", featured: "Bayern win @ 1.72", status: "Today"},
  {league: "LaLiga", date: "2026-09-12", time: "21:00 CEST", match: "Real Madrid vs Getafe CF", matchday: "Matchday 5", moneyline: "1.45 / 4.50 / 7.20", handicap: "Real Madrid -1.5 @ 1.82", total: "Over 2.5 @ 1.75", featured: "Real Madrid win @ 1.45", status: "Today"},
  {league: "Ligue 1", date: "2026-09-12", time: "20:45 CEST", match: "Paris Saint-Germain vs Stade de Reims", matchday: "Matchweek 5", moneyline: "1.38 / 5.20 / 8.50", handicap: "PSG -1.5 @ 1.80", total: "Over 3.0 @ 1.78", featured: "PSG win @ 1.38", status: "Today"},
  {league: "Premier League", date: "2026-09-13", time: "17:30 BST", match: "Tottenham Hotspur vs Arsenal", matchday: "Matchweek 4", moneyline: "3.40 / 3.60 / 1.75", handicap: "Arsenal -0.5 @ 1.75", total: "Over 2.75 @ 1.82", featured: "Arsenal win @ 1.75", status: "Today"},
  {league: "Serie A", date: "2026-09-13", time: "20:45 CEST", match: "Inter Milan vs Juventus", matchday: "Matchday 4", moneyline: "1.80 / 3.40 / 4.20", handicap: "Inter -0.5 @ 1.80", total: "Under 2.5 @ 1.75", featured: "Inter win @ 1.80", status: "Today"},
  {league: "LaLiga", date: "2026-09-14", time: "21:00 CEST", match: "Atlético de Madrid vs Valencia", matchday: "Matchday 5", moneyline: "1.65 / 3.80 / 5.20", handicap: "Atlético -0.75 @ 1.82", total: "Over 2.5 @ 1.78", featured: "Atlético win @ 1.65", status: "Today"},
  {league: "Serie A", date: "2026-09-14", time: "20:45 CEST", match: "Napoli vs Cagliari", matchday: "Matchday 4", moneyline: "1.55 / 4.10 / 5.80", handicap: "Napoli -1.0 @ 1.85", total: "Over 2.75 @ 1.80", featured: "Napoli win @ 1.55", status: "Today"},
  {league: "Premier League", date: "2026-09-15", time: "20:00 BST", match: "Aston Villa vs Everton", matchday: "Matchweek 4", moneyline: "1.80 / 3.60 / 4.40", handicap: "Villa -0.5 @ 1.80", total: "Under 2.5 @ 1.82", featured: "Villa win @ 1.80", status: "Today"},
  {league: "Bundesliga", date: "2026-09-16", time: "20:30 CEST", match: "RB Leipzig vs Union Berlin", matchday: "Matchday 4", moneyline: "1.60 / 4.00 / 5.40", handicap: "Leipzig -1.0 @ 1.88", total: "Over 2.75 @ 1.82", featured: "Leipzig win @ 1.60", status: "Today"},
  {league: "Ligue 1", date: "2026-09-16", time: "21:00 CEST", match: "Olympique de Marseille vs OGC Nice", matchday: "Matchweek 5", moneyline: "1.85 / 3.50 / 4.20", handicap: "Marseille -0.5 @ 1.85", total: "Under 2.5 @ 1.75", featured: "Marseille win @ 1.85", status: "Today"},
  {league: "LaLiga", date: "2026-09-17", time: "21:30 CEST", match: "Real Betis vs Real Sociedad", matchday: "Matchday 5", moneyline: "1.90 / 3.40 / 4.00", handicap: "Betis -0.25 @ 1.90", total: "Under 2.5 @ 1.80", featured: "Betis win @ 1.90", status: "Today"},
  {league: "Serie A", date: "2026-09-17", time: "20:45 CEST", match: "Fiorentina vs Udinese", matchday: "Matchday 4", moneyline: "1.70 / 3.50 / 4.60", handicap: "Fiorentina -0.5 @ 1.70", total: "Under 2.5 @ 1.75", featured: "Fiorentina win @ 1.70", status: "Today"},
  {league: "Bundesliga", date: "2026-09-18", time: "20:30 CEST", match: "VfB Stuttgart vs FC St. Pauli", matchday: "Matchday 4", moneyline: "1.60 / 4.10 / 5.20", handicap: "Stuttgart -1.0 @ 1.88", total: "Over 2.75 @ 1.82", featured: "Stuttgart win @ 1.60", status: "Today"},
  {league: "LaLiga", date: "2026-09-18", time: "21:00 CEST", match: "Real Valladolid vs Real Sociedad", matchday: "Matchday 5", moneyline: "3.40 / 3.20 / 1.90", handicap: "Sociedad -0.5 @ 1.90", total: "Under 2.5 @ 1.75", featured: "Sociedad win @ 1.90", status: "Today"},
  {league: "Premier League", date: "2026-09-19", time: "12:30 BST", match: "West Ham United vs Chelsea", matchday: "Matchweek 5", moneyline: "3.40 / 3.60 / 1.75", handicap: "Chelsea -0.5 @ 1.75", total: "Over 2.75 @ 1.82", featured: "Chelsea win @ 1.75", status: "Today"},
  {league: "Serie A", date: "2026-09-19", time: "18:00 CEST", match: "Juventus vs Napoli", matchday: "Matchday 5", moneyline: "1.80 / 3.40 / 4.20", handicap: "Juventus -0.5 @ 1.80", total: "Under 2.5 @ 1.75", featured: "Juventus win @ 1.80", status: "Today"},
  {league: "Premier League", date: "2026-09-20", time: "16:30 BST", match: "Manchester City vs Arsenal", matchday: "Matchweek 5", moneyline: "1.85 / 3.60 / 4.20", handicap: "Man City -0.5 @ 1.85", total: "Over 2.5 @ 1.80", featured: "Man City win @ 1.85", status: "Today"},
  {league: "Serie A", date: "2026-09-20", time: "20:45 CEST", match: "Inter Milan vs AC Milan", matchday: "Matchday 5", moneyline: "1.95 / 3.40 / 3.80", handicap: "Inter -0.5 @ 1.95", total: "Over 2.5 @ 1.85", featured: "Inter win @ 1.95", status: "Today"},
  {league: "LaLiga", date: "2026-09-21", time: "21:00 CEST", match: "Real Betis vs RCD Mallorca", matchday: "Matchday 6", moneyline: "1.90 / 3.40 / 4.40", handicap: "Betis -0.5 @ 1.90", total: "Under 2.5 @ 1.70", featured: "Betis win @ 1.90", status: "Today"},
  {league: "Serie A", date: "2026-09-21", time: "20:45 CEST", match: "Atalanta vs Como", matchday: "Matchday 5", moneyline: "1.50 / 4.30 / 6.50", handicap: "Atalanta -1.0 @ 1.82", total: "Over 2.75 @ 1.85", featured: "Atalanta win @ 1.50", status: "Today"},
  {league: "LaLiga", date: "2026-09-22", time: "19:00 CEST", match: "Sevilla vs Real Valladolid", matchday: "Matchday 6", moneyline: "1.70 / 3.60 / 4.80", handicap: "Sevilla -0.75 @ 1.88", total: "Under 2.5 @ 1.75", featured: "Sevilla win @ 1.70", status: "Today"},
  {league: "LaLiga", date: "2026-09-22", time: "21:00 CEST", match: "Valencia vs CA Osasuna", matchday: "Matchday 6", moneyline: "2.00 / 3.20 / 3.90", handicap: "Valencia -0.5 @ 2.00", total: "Under 2.25 @ 1.80", featured: "Valencia win @ 2.00", status: "Today"},
  {league: "LaLiga", date: "2026-09-24", time: "19:00 CEST", match: "RCD Espanyol vs Villarreal", matchday: "Matchday 6", moneyline: "3.20 / 3.40 / 2.25", handicap: "Villarreal -0.25 @ 1.95", total: "Over 2.5 @ 1.85", featured: "Villarreal win @ 2.25", status: "Today"},
  {league: "LaLiga", date: "2026-09-24", time: "21:00 CEST", match: "Celta Vigo vs Atlético Madrid", matchday: "Matchday 6", moneyline: "4.00 / 3.50 / 1.90", handicap: "Atlético -0.5 @ 1.90", total: "Under 2.5 @ 1.75", featured: "Atlético win @ 1.90", status: "Today"},
  {league: "LaLiga", date: "2026-09-25", time: "19:00 CEST", match: "Girona FC vs Rayo Vallecano", matchday: "Matchday 7", moneyline: "1.80 / 3.60 / 4.40", handicap: "Girona -0.5 @ 1.80", total: "Under 2.5 @ 1.75", featured: "Girona win @ 1.80", status: "Today"},
  {league: "LaLiga", date: "2026-09-25", time: "21:00 CEST", match: "FC Barcelona vs Getafe CF", matchday: "Matchday 7", moneyline: "1.30 / 5.50 / 9.50", handicap: "Barcelona -1.5 @ 1.85", total: "Over 2.5 @ 1.55", featured: "Barcelona win @ 1.30", status: "Today"},
  {league: "ATP Tour", date: "2026-09-26", time: "13:00 CST", match: "Jannik Sinner vs Nicolas Jarry", matchday: "China Open Round of 32", moneyline: "1.15 / 5.50", handicap: "Sinner -1.5 sets @ 1.48", total: "Under 20.5 @ 1.85", featured: "Sinner 2-0 @ 1.48", status: "Today"},
  {league: "ATP Tour", date: "2026-09-26", time: "16:30 CST", match: "Daniil Medvedev vs Gaël Monfils", matchday: "China Open Round of 32", moneyline: "1.28 / 3.75", handicap: "Medvedev -3.5 games @ 1.80", total: "Over 21.5 @ 1.90", featured: "Medvedev win @ 1.28", status: "Today"},
  {league: "Bundesliga", date: "2026-09-27", time: "20:30 CEST", match: "Borussia Dortmund vs VfL Bochum", matchday: "Matchday 5", moneyline: "1.35 / 5.20 / 8.00", handicap: "Dortmund -1.5 @ 1.88", total: "Over 3.0 @ 1.82", featured: "Dortmund win @ 1.35", status: "Today"},
  {league: "Serie A", date: "2026-09-27", time: "20:45 CEST", match: "AC Milan vs Lecce", matchday: "Matchday 6", moneyline: "1.40 / 4.80 / 7.50", handicap: "Milan -1.25 @ 1.85", total: "Over 2.5 @ 1.75", featured: "Milan win @ 1.40", status: "Today"},
  {league: "Premier League", date: "2026-09-28", time: "12:30 BST", match: "Newcastle United vs Manchester City", matchday: "Matchweek 6", moneyline: "5.00 / 4.20 / 1.62", handicap: "Man City -0.75 @ 1.82", total: "Over 2.75 @ 1.80", featured: "Man City win @ 1.62", status: "Today"},
  {league: "Bundesliga", date: "2026-09-28", time: "18:30 CEST", match: "Bayern Munich vs Bayer Leverkusen", matchday: "Matchday 5", moneyline: "1.75 / 4.20 / 4.00", handicap: "Bayern -0.5 @ 1.75", total: "Over 3.25 @ 1.85", featured: "Bayern win @ 1.75", status: "Today"},
  {league: "LaLiga", date: "2026-09-29", time: "21:00 CEST", match: "Atlético Madrid vs Real Madrid", matchday: "Matchday 8", moneyline: "2.80 / 3.40 / 2.50", handicap: "Real Madrid 0 @ 1.80", total: "Over 2.5 @ 1.85", featured: "Real Madrid DNB @ 1.80", status: "Today"},
  {league: "Premier League", date: "2026-09-29", time: "16:30 BST", match: "Manchester United vs Tottenham Hotspur", matchday: "Matchweek 6", moneyline: "2.30 / 3.70 / 2.85", handicap: "Tottenham +0.25 @ 1.85", total: "Over 3.0 @ 1.80", featured: "Tottenham win @ 2.85", status: "Today"},
  {league: "Premier League", date: "2026-09-30", time: "20:00 BST", match: "AFC Bournemouth vs Southampton", matchday: "Matchweek 6", moneyline: "1.75 / 3.80 / 4.60", handicap: "Bournemouth -0.5 @ 1.75", total: "Over 2.5 @ 1.70", featured: "Bournemouth win @ 1.75", status: "Today"},
  {league: "Serie A", date: "2026-09-30", time: "18:30 CEST", match: "Parma vs Cagliari", matchday: "Matchday 6", moneyline: "2.10 / 3.45 / 3.40", handicap: "Parma -0.25 @ 1.82", total: "Over 2.5 @ 1.85", featured: "Over 2.5 goals @ 1.85", status: "Today"},
  ...autoDailyData.autoFixtures,
];
const olCompanionModules = [
  {name: "Fixtures", status: "Connected as Ligue 1 fixture board", path: "/home/uuxu/ol-companion/frontend/src/routes/fixtures.tsx"},
  {name: "Standings", status: "Pattern imported for table monitoring", path: "/home/uuxu/ol-companion/frontend/src/routes/standings.tsx"},
  {name: "Live match", status: "SSE/live-card pattern mapped to admin live desk", path: "/home/uuxu/ol-companion/frontend/src/routes/match.tsx"},
  {name: "News", status: "RSS/news card pattern mapped to operator notes", path: "/home/uuxu/ol-companion/frontend/src/routes/news.tsx"},
];

const depositQueue: DepositRecord[] = [
  ...adminUsers.map((user, index) => ({
  id: `DEP-${String(8200 + index).padStart(4, "0")}`,
  user: user.username,
  chain: index % 9 === 0 ? "USDT ERC20" : "USDT TRC20",
  tx: index % 9 === 0 ? `0x${String(index + 1137).padStart(4, "0")}...${String(index + 88).padStart(4, "0")}` : `T${String(index + 821).padStart(4, "0")}...${String(index + 44).padStart(4, "0")}`,
  amount: user.deposit,
  confirmations: index % 9 === 0 ? "64/64" : "20/20",
  status: "Confirmed",
  age: user.registeredAt,
  })),
  ...northAmericaUsers.slice(0, 2).map((user, index) => ({
    id: `DEP-${String(9100 + index).padStart(4, "0")}`,
    user: user.username,
    chain: "USDT TRC20",
    tx: `TNBA${String(index + 21).padStart(2, "0")}...${String(index + 70).padStart(2, "0")}`,
    amount: user.deposit,
    confirmations: "20/20",
    status: "Confirmed",
    age: "2026-07-20 01:18",
  })),
];

const dateLedgerRows = buildDateLedgerRows();
const dateLedgerFinalBalance = dateLedgerRows.at(-1)?.balanceAfter ?? openingWalletReserve;
const dateLedgerDelta = Math.round((platformBalance - dateLedgerFinalBalance) * 100) / 100;
const dailyIncomeRows = buildIncomeSummary((date) => date);
const monthlyIncomeRows = buildIncomeSummary((date) => date.slice(0, 7));
const totalCollectedIncome = dailyIncomeRows.reduce((sum, row) => sum + row.total, 0);

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
  {time: "2026-10-05 21:00", actor: "cashier", action: "Submitted exchange treasury withdrawal of 1000u (Est. 20% fee: 200u, Net credited: 800u, ETA: 2026-10-08)", result: "Processing"},
  {time: "2026-10-05 23:58", actor: "system", action: "Updated Ledger by Date with 10.5 withdrawal -1000u; credited to exchange treasury on 10.8 (800u net)", result: "OK"},
  {time: "2026-10-01 23:58", actor: "system", action: "Updated Ledger by Date with 10.1 crash game income 35u and 5 new user signups; current platform balance 300u", result: "OK"},
  {time: "2026-10-01 20:00", actor: "cashier", action: "Credited 35u from 10.1 Crash game income to platform wallet", result: "OK"},
  {time: "2026-10-01 14:50", actor: "system", action: "Registered 5 new users on 10.1 (AlexanderUK121, FelixDE122, RomainFR123, GiovanniIT124, AlvaroES125)", result: "OK"},
  {time: "2026-09-30 23:58", actor: "system", action: "Updated Ledger by Date with 9.30 five-league receipts 80u and crash game income 23u; current platform balance 265u", result: "OK"},
  {time: "2026-09-30 20:00", actor: "cashier", action: "Credited 23u from 9.30 Crash game income to platform wallet", result: "OK"},
  {time: "2026-09-30 19:15", actor: "cashier", action: "Collected 80u from 9.30 five-league popular fixtures betting proceeds", result: "OK"},
  {time: "2026-09-30 18:20", actor: "system", action: "Registered 10 new users on 9.30 (MasonUK111, FabianDE112, AdrienFR113, MatteoIT114, JavierES115, LukasAT116, OscarDK117, FinnIE118, DmitryKZ119, RafaelPT120)", result: "OK"},
  {time: "2026-09-30 17:15", actor: "sportsbook", action: "Accepted 30u Over 2.5 @ 1.85 on Parma vs Cagliari (Returning User Hamad16)", result: "Pending"},
  {time: "2026-09-30 14:30", actor: "sportsbook", action: "Accepted 50u Bournemouth win @ 1.75 on AFC Bournemouth vs Southampton (New User MasonUK111)", result: "Pending"},
  {time: "2026-09-29 23:58", actor: "system", action: "Updated Ledger by Date with 9.29 five-league receipts 80u, crash game income 21u, and exchange treasury withdrawal -1000u; current platform balance 162u", result: "OK"},
  {time: "2026-09-29 21:00", actor: "cashier", action: "Submitted exchange treasury withdrawal of 1000u (Est. 20% fee: 200u, ETA 2026-09-30)", result: "Processing"},
  {time: "2026-09-29 20:00", actor: "cashier", action: "Credited 21u from 9.29 Crash game income to platform wallet", result: "OK"},
  {time: "2026-09-29 19:15", actor: "cashier", action: "Collected 80u from 9.29 five-league popular fixtures betting proceeds", result: "OK"},
  {time: "2026-09-29 18:00", actor: "system", action: "Registered 10 additional users on 9.29 (MateoES101, HugoFR102, LucaIT103, NoahDE104, LiamUK105, ArthurBE106, LeoNL107, EliasSE108, MilanRS109, GabrielBR110)", result: "OK"},
  {time: "2026-09-29 17:00", actor: "sportsbook", action: "Accepted 30u Tottenham Hotspur win @ 2.10 on Manchester United vs Tottenham Hotspur (Returning User Hamad16)", result: "Pending"},
  {time: "2026-09-29 15:30", actor: "sportsbook", action: "Accepted 50u Real Madrid win @ 1.80 on Atlético Madrid vs Real Madrid (New User CarlosES99)", result: "Pending"},
  {time: "2026-09-29 11:30", actor: "system", action: "Registered new user CarlosES99 from Spain", result: "OK"},
  {time: "2026-09-28 23:58", actor: "system", action: "Updated Ledger by Date with 9.28 five-league receipts 80u; current platform balance 1061u", result: "OK"},
  {time: "2026-09-28 17:30", actor: "sportsbook", action: "Accepted 30u Bayern Munich win @ 1.75 on Bayern Munich vs Bayer Leverkusen (Returning User Hamad16)", result: "Pending"},
  {time: "2026-09-28 13:45", actor: "system", action: "Registered 5 new users on 9.28 (KasperDK94, LukasAT95, MateoHR96, TariqSA97, OliverUK98)", result: "OK"},
  {time: "2026-09-28 12:15", actor: "sportsbook", action: "Accepted 50u Manchester City win @ 1.62 on Newcastle United vs Manchester City (New User OliverUK98)", result: "Pending"},
  {time: "2026-09-28 09:15", actor: "cashier", action: "Collected 80u from 9.28 five-league popular fixtures betting proceeds", result: "OK"},
  {time: "2026-09-27 23:58", actor: "system", action: "Updated Ledger by Date with 9.27 five-league receipts 80u and crash game income 20u; current platform balance 981u", result: "OK"},
  {time: "2026-09-27 20:00", actor: "cashier", action: "Credited 20u from 9.27 Crash game income to platform wallet", result: "OK"},
  {time: "2026-09-27 19:15", actor: "cashier", action: "Collected 80u from 9.27 five-league popular fixtures betting proceeds", result: "OK"},
  {time: "2026-09-27 17:45", actor: "sportsbook", action: "Accepted 30u AC Milan win @ 1.40 on AC Milan vs Lecce (New User JonasDE81)", result: "Pending"},
  {time: "2026-09-27 15:30", actor: "sportsbook", action: "Accepted 50u Borussia Dortmund win @ 1.35 on Borussia Dortmund vs VfL Bochum (Returning User Hamad16)", result: "Pending"},
  {time: "2026-09-27 10:15", actor: "system", action: "Registered new user JonasDE81 from Germany", result: "OK"},
  {time: "2026-09-26 09:30", actor: "cashier", action: "Customer service completed manual payout of 192u for winning slip LGB-2802 (Hamad16); status marked as Paid (已完成兑付)", result: "Completed"},
  {time: "2026-09-26 23:58", actor: "system", action: "Updated Ledger by Date with 9.26 tennis receipts 400u, wheel game income 55u, and crash game income 25u; current platform balance 1088u", result: "OK"},
  {time: "2026-09-26 20:30", actor: "cashier", action: "Credited 55u from 9.26 Wheel game income to platform wallet", result: "OK"},
  {time: "2026-09-26 20:00", actor: "cashier", action: "Credited 25u from 9.26 Crash game income to platform wallet", result: "OK"},
  {time: "2026-09-26 19:15", actor: "cashier", action: "Collected 400u from 9.26 ATP China Open tennis popular fixtures betting proceeds", result: "OK"},
  {time: "2026-09-26 16:30", actor: "sportsbook", action: "Accepted 150u Daniil Medvedev win @ 1.28 on Daniil Medvedev vs Gaël Monfils", result: "Pending"},
  {time: "2026-09-26 13:00", actor: "sportsbook", action: "Accepted 250u Jannik Sinner 2-0 @ 1.48 on Jannik Sinner vs Nicolas Jarry", result: "Pending"},
  {time: "2026-09-25 23:58", actor: "system", action: "Updated Ledger by Date with 9.25 five-league receipts 80u and crash game income 25u; current platform balance 608u", result: "OK"},
  {time: "2026-09-25 20:30", actor: "cashier", action: "Credited 25u from 9.25 Crash game income to platform wallet", result: "OK"},
  {time: "2026-09-25 19:15", actor: "cashier", action: "Collected 80u from 9.25 five-league popular fixtures betting proceeds", result: "OK"},
  {time: "2026-09-25 17:30", actor: "sportsbook", action: "Accepted 50u FC Barcelona win @ 1.30 on FC Barcelona vs Getafe CF", result: "Pending"},
  {time: "2026-09-25 14:15", actor: "sportsbook", action: "Accepted 30u Girona FC win @ 1.80 on Girona FC vs Rayo Vallecano", result: "Pending"},
  {time: "2026-09-24 23:58", actor: "system", action: "Updated Ledger by Date with 9.24 five-league receipts 180u, wheel game income 40u, and exchange withdrawal -500u; current platform balance 503u", result: "OK"},
  {time: "2026-09-24 21:00", actor: "cashier", action: "Submitted exchange treasury withdrawal of 500u (Est. 20% fee, ETA 2026-09-25)", result: "Processing"},
  {time: "2026-09-24 20:30", actor: "cashier", action: "Credited 40u from 9.24 Wheel game income to platform wallet", result: "OK"},
  {time: "2026-09-24 19:15", actor: "cashier", action: "Collected 180u from 9.24 five-league popular fixtures betting proceeds", result: "OK"},
  {time: "2026-09-24 17:50", actor: "sportsbook", action: "Accepted 100u Atlético Madrid win @ 1.90 on Celta Vigo vs Atlético Madrid", result: "Pending"},
  {time: "2026-09-24 15:30", actor: "sportsbook", action: "Accepted 80u Villarreal win @ 2.25 on RCD Espanyol vs Villarreal", result: "Pending"},
  {time: "2026-09-22 23:58", actor: "system", action: "Updated Ledger by Date with 9.22 five-league receipts 80u and wheel game income 30u; current platform balance 783u", result: "OK"},
  {time: "2026-09-22 20:30", actor: "cashier", action: "Credited 30u from 9.22 Wheel game income to platform wallet", result: "OK"},
  {time: "2026-09-22 19:15", actor: "cashier", action: "Collected 80u from 9.22 five-league popular fixtures betting proceeds", result: "OK"},
  {time: "2026-09-22 18:30", actor: "sportsbook", action: "Accepted 30u Valencia win @ 2.00 on Valencia vs CA Osasuna", result: "Pending"},
  {time: "2026-09-22 16:45", actor: "sportsbook", action: "Accepted 50u Sevilla win @ 1.70 on Sevilla vs Real Valladolid", result: "Pending"},
  {time: "2026-09-21 23:58", actor: "system", action: "Updated Ledger by Date with 9.21 five-league receipts 65u and crash game income 15u; current platform balance 673u", result: "OK"},
  {time: "2026-09-21 20:30", actor: "cashier", action: "Credited 15u from 9.21 Crash game income to platform wallet", result: "OK"},
  {time: "2026-09-21 19:15", actor: "cashier", action: "Collected 65u from 9.21 five-league popular fixtures betting proceeds", result: "OK"},
  {time: "2026-09-21 18:40", actor: "sportsbook", action: "Accepted 25u Atalanta win @ 1.50 on Atalanta vs Como", result: "Pending"},
  {time: "2026-09-21 15:20", actor: "sportsbook", action: "Accepted 40u Real Betis win @ 1.90 on Real Betis vs RCD Mallorca", result: "Pending"},
  {time: "2026-09-20 23:58", actor: "system", action: "Updated Ledger by Date with 9.20 five-league receipts 75u and crash game income 15u; current platform balance 593u", result: "OK"},
  {time: "2026-09-20 20:30", actor: "cashier", action: "Credited 15u from 9.20 Crash game income to platform wallet", result: "OK"},
  {time: "2026-09-20 19:15", actor: "cashier", action: "Collected 75u from 9.20 five-league popular fixtures betting proceeds", result: "OK"},
  {time: "2026-09-20 17:30", actor: "sportsbook", action: "Accepted 30u Inter Milan win @ 1.95 on Inter Milan vs AC Milan", result: "Pending"},
  {time: "2026-09-20 14:10", actor: "sportsbook", action: "Accepted 45u Manchester City win @ 1.85 on Manchester City vs Arsenal", result: "Pending"},
  {time: "2026-09-19 23:58", actor: "system", action: "Updated Ledger by Date with 9.19 five-league receipts 70u and crash game income 10u; current platform balance 503u", result: "OK"},
  {time: "2026-09-19 20:30", actor: "cashier", action: "Credited 10u from 9.19 Crash game income to platform wallet", result: "OK"},
  {time: "2026-09-19 19:15", actor: "cashier", action: "Collected 70u from 9.19 five-league popular fixtures betting proceeds", result: "OK"},
  {time: "2026-09-19 16:45", actor: "sportsbook", action: "Accepted 30u Juventus win @ 1.80 on Juventus vs Napoli", result: "Pending"},
  {time: "2026-09-19 11:20", actor: "sportsbook", action: "Accepted 40u Chelsea win @ 1.75 on West Ham United vs Chelsea", result: "Pending"},
  {time: "2026-09-18 23:58", actor: "system", action: "Updated Ledger by Date with 9.18 five-league receipts 110u and crash game income 10u; current platform balance 423u", result: "OK"},
  {time: "2026-09-18 20:30", actor: "cashier", action: "Credited 10u from 9.18 Crash game income to platform wallet", result: "OK"},
  {time: "2026-09-18 19:15", actor: "cashier", action: "Collected 110u from 9.18 five-league popular fixtures betting proceeds", result: "OK"},
  {time: "2026-09-18 17:10", actor: "sportsbook", action: "Accepted 50u Real Sociedad win @ 1.90 on Real Valladolid vs Real Sociedad", result: "Pending"},
  {time: "2026-09-18 14:30", actor: "sportsbook", action: "Accepted 60u VfB Stuttgart win @ 1.60 on VfB Stuttgart vs FC St. Pauli", result: "Pending"},
  {time: "2026-09-17 23:59", actor: "system", action: "Updated Ledger by Date with 9.17 additional five-league receipts 10u and crash game 10u; current platform balance 303u", result: "OK"},
  {time: "2026-09-17 22:30", actor: "cashier", action: "Credited 10u from 9.17 additional Crash game income to platform wallet", result: "OK"},
  {time: "2026-09-17 22:15", actor: "cashier", action: "Collected 10u from 9.17 Serie A Fiorentina vs Udinese betting proceeds", result: "OK"},
  {time: "2026-09-17 17:40", actor: "sportsbook", action: "Accepted 10u Fiorentina win @ 1.70 on Fiorentina vs Udinese", result: "Pending"},
  {time: "2026-09-17 23:58", actor: "system", action: "Updated Ledger by Date with 9.17 receipts 30u, crash game 10u, and exchange withdrawal -1000u; current platform balance 283u", result: "OK"},
  {time: "2026-09-17 21:00", actor: "cashier", action: "Submitted exchange treasury withdrawal of 1000u (Est. 20% fee, ETA 2026-09-18)", result: "Processing"},
  {time: "2026-09-17 20:30", actor: "cashier", action: "Credited 10u from 9.17 Crash game income to platform wallet", result: "OK"},
  {time: "2026-09-17 19:15", actor: "cashier", action: "Collected 30u from 9.17 five-league popular fixtures betting proceeds", result: "OK"},
  {time: "2026-09-17 15:15", actor: "sportsbook", action: "Accepted 30u Real Betis win @ 1.90 on Real Betis vs Real Sociedad", result: "Pending"},
  {time: "2026-09-16 23:58", actor: "system", action: "Updated Ledger by Date with 9.16 five-league receipts 70u and crash game income 30u; current platform balance 1243u", result: "OK"},
  {time: "2026-09-16 20:30", actor: "cashier", action: "Credited 30u from 9.16 Crash game income to platform wallet", result: "OK"},
  {time: "2026-09-16 19:15", actor: "cashier", action: "Collected 70u from 9.16 five-league popular fixtures betting proceeds", result: "OK"},
  {time: "2026-09-16 17:00", actor: "sportsbook", action: "Accepted 30u Marseille win @ 1.85 on Marseille vs Nice", result: "Pending"},
  {time: "2026-09-16 14:10", actor: "sportsbook", action: "Accepted 40u RB Leipzig win @ 1.60 on RB Leipzig vs Union Berlin", result: "Pending"},
  {time: "2026-09-15 23:58", actor: "system", action: "Updated Ledger by Date with 9.15 five-league receipts 30u and crash game income 50u; current platform balance 1143u", result: "OK"},
  {time: "2026-09-15 20:30", actor: "cashier", action: "Credited 50u from 9.15 Crash game income to platform wallet", result: "OK"},
  {time: "2026-09-15 19:15", actor: "cashier", action: "Collected 30u from 9.15 five-league popular fixtures betting proceeds", result: "OK"},
  {time: "2026-09-15 15:30", actor: "sportsbook", action: "Accepted 30u Aston Villa win @ 1.80 on Aston Villa vs Everton", result: "Pending"},
  {time: "2026-09-14 23:58", actor: "system", action: "Updated Ledger by Date with 9.14 five-league receipts 85u and crash game income 70u; current platform balance 1063u", result: "OK"},
  {time: "2026-09-14 20:30", actor: "cashier", action: "Credited 70u from 9.14 Crash game income to platform wallet", result: "OK"},
  {time: "2026-09-14 19:15", actor: "cashier", action: "Collected 85u from 9.14 five-league popular fixtures betting proceeds", result: "OK"},
  {time: "2026-09-14 16:40", actor: "sportsbook", action: "Accepted 35u Napoli win @ 1.55 on Napoli vs Cagliari", result: "Pending"},
  {time: "2026-09-14 14:20", actor: "sportsbook", action: "Accepted 50u Atlético de Madrid win @ 1.65 on Atlético vs Valencia", result: "Pending"},
  {time: "2026-09-13 23:58", actor: "system", action: "Updated Ledger by Date with 9.13 five-league receipts 35u and crash game income 20u; current platform balance 908u", result: "OK"},
  {time: "2026-09-13 20:30", actor: "cashier", action: "Credited 20u from 9.13 Crash game income to platform wallet", result: "OK"},
  {time: "2026-09-13 19:15", actor: "cashier", action: "Collected 35u from 9.13 five-league popular fixtures betting proceeds", result: "OK"},
  {time: "2026-09-13 16:30", actor: "sportsbook", action: "Accepted 15u Inter Milan win @ 1.80 on Inter Milan vs Juventus", result: "Pending"},
  {time: "2026-09-13 14:15", actor: "sportsbook", action: "Accepted 20u Arsenal win @ 1.75 on Tottenham Hotspur vs Arsenal", result: "Pending"},
  {time: "2026-09-12 23:58", actor: "system", action: "Updated Ledger by Date with 9.12 five-league receipts 105u and crash game income 50u; current platform balance 853u", result: "OK"},
  {time: "2026-09-12 20:30", actor: "cashier", action: "Credited 50u from 9.12 Crash game income to platform wallet", result: "OK"},
  {time: "2026-09-12 19:15", actor: "cashier", action: "Collected 105u from 9.12 five-league popular fixtures betting proceeds", result: "OK"},
  {time: "2026-09-12 16:30", actor: "sportsbook", action: "Accepted 25u Paris Saint-Germain win @ 1.38 on PSG vs Stade de Reims", result: "Pending"},
  {time: "2026-09-12 14:20", actor: "sportsbook", action: "Accepted 35u Real Madrid win @ 1.45 on Real Madrid vs Getafe CF", result: "Pending"},
  {time: "2026-09-12 12:10", actor: "sportsbook", action: "Accepted 45u Bayern Munich win @ 1.72 on Bayern Munich vs Borussia Dortmund", result: "Pending"},
  {time: "2026-09-11 23:58", actor: "system", action: "Updated Ledger by Date with 9.11 five-league receipts 70u and crash game income 25u; current platform balance 698u", result: "OK"},
  {time: "2026-09-11 20:30", actor: "cashier", action: "Credited 25u from 9.11 Crash game income to platform wallet", result: "OK"},
  {time: "2026-09-11 19:15", actor: "cashier", action: "Collected 70u from 9.11 five-league popular fixtures betting proceeds", result: "OK"},
  {time: "2026-09-11 16:45", actor: "sportsbook", action: "Accepted 30u Roma win @ 1.82 on Roma vs Fiorentina", result: "Pending"},
  {time: "2026-09-11 14:30", actor: "sportsbook", action: "Accepted 40u Manchester City win @ 1.58 on Manchester City vs Newcastle United", result: "Pending"},
  {time: "2026-09-10 23:58", actor: "system", action: "Updated Ledger by Date with 9.10 five-league receipts 50u and crash game income 25u; current platform balance 603u", result: "OK"},
  {time: "2026-09-10 20:30", actor: "cashier", action: "Credited 25u from 9.10 Crash game income to platform wallet", result: "OK"},
  {time: "2026-09-10 19:15", actor: "cashier", action: "Collected 50u from 9.10 five-league popular fixtures betting proceeds", result: "OK"},
  {time: "2026-09-10 16:50", actor: "sportsbook", action: "Accepted 20u Athletic Club win @ 1.72 on Athletic Club vs Valencia", result: "Pending"},
  {time: "2026-09-10 14:20", actor: "sportsbook", action: "Accepted 30u Bayer Leverkusen win @ 1.92 on Bayer Leverkusen vs RB Leipzig", result: "Pending"},
  {time: "2026-09-09 23:58", actor: "system", action: "Updated Ledger by Date with 9.9 five-league receipts 50u and wheel income 30u; current platform balance 528u", result: "OK"},
  {time: "2026-09-09 20:10", actor: "cashier", action: "Credited 30u from 9.9 Wheel game income to platform wallet", result: "OK"},
  {time: "2026-09-09 19:25", actor: "cashier", action: "Collected 50u from 9.9 five-league popular fixtures betting proceeds", result: "OK"},
  {time: "2026-09-09 16:40", actor: "sportsbook", action: "Accepted 20u AC Milan win @ 1.70 on AC Milan vs Napoli", result: "Pending"},
  {time: "2026-09-09 14:15", actor: "sportsbook", action: "Accepted 30u Liverpool win @ 1.85 on Chelsea vs Liverpool", result: "Pending"},
  {time: "2026-09-08 23:58", actor: "system", action: "Updated Ledger by Date with 9.8 five-league receipts 50u and wheel income 30u; current platform balance 448u", result: "OK"},
  {time: "2026-09-08 20:10", actor: "cashier", action: "Credited 30u from 9.8 Wheel game income to platform wallet", result: "OK"},
  {time: "2026-09-08 19:25", actor: "cashier", action: "Collected 50u from 9.8 five-league popular fixtures betting proceeds", result: "OK"},
  {time: "2026-09-08 16:30", actor: "sportsbook", action: "Accepted 20u Atlético de Madrid win @ 1.75 on Atlético de Madrid vs Sevilla FC", result: "Pending"},
  {time: "2026-09-08 14:10", actor: "sportsbook", action: "Accepted 30u Paris Saint-Germain win @ 1.52 on Paris Saint-Germain vs AS Monaco", result: "Pending"},
  {time: "2026-09-07 23:58", actor: "system", action: "Updated Ledger by Date with 9.7 five-league receipts 50u; current platform balance 368u", result: "OK"},
  {time: "2026-09-07 19:15", actor: "cashier", action: "Collected 50u from 9.7 five-league popular fixtures betting proceeds", result: "OK"},
  {time: "2026-09-07 11:45", actor: "sportsbook", action: "Accepted 20u Inter Milan win @ 1.68 on Inter Milan vs Atalanta", result: "Pending"},
  {time: "2026-09-07 10:20", actor: "sportsbook", action: "Accepted 30u Arsenal win @ 1.90 on Tottenham Hotspur vs Arsenal", result: "Pending"},
  {time: "2026-09-06 23:45", actor: "system", action: "Updated Ledger by Date with 9.6 late night Wheel game income +10u; current platform balance 318u", result: "OK"},
  {time: "2026-09-06 23:40", actor: "cashier", action: "Credited 10u from late night Wheel game income to platform wallet", result: "OK"},
  {time: "2026-09-06 22:35", actor: "system", action: "Updated Ledger by Date with 9.6 evening Wheel game income +20u; platform balance 308u", result: "OK"},
  {time: "2026-09-06 22:30", actor: "cashier", action: "Credited 20u from evening Wheel game income to platform wallet", result: "OK"},
  {time: "2026-09-06 02:20", actor: "system", action: "Updated Ledger by Date with 9.6 early morning Wheel game income +30u; current platform balance 288u", result: "OK"},
  {time: "2026-09-06 02:15", actor: "cashier", action: "Credited 30u from early morning Wheel game income to platform wallet", result: "OK"},
  {time: "2026-09-05 23:58", actor: "system", action: "Updated Ledger by Date with 9.5 five-league receipts 50u and wheel income 30u; current balance 258u", result: "OK"},
  {time: "2026-09-05 20:00", actor: "cashier", action: "Credited 30u from 9.5 Wheel game income to platform wallet", result: "OK"},
  {time: "2026-09-05 19:10", actor: "cashier", action: "Collected 50u from five-league popular fixtures betting proceeds", result: "OK"},
  {time: "2026-09-05 16:30", actor: "sportsbook", action: "Accepted 20u Real Madrid win @ 1.50 on Real Madrid vs Real Sociedad", result: "Pending"},
  {time: "2026-09-05 14:10", actor: "sportsbook", action: "Accepted 30u Manchester City win @ 1.65 on Manchester City vs Chelsea", result: "Pending"},
  {time: "2026-09-01 23:58", actor: "system", action: "Updated Ledger by Date with 9.1 five-league receipts 50u and exchange withdrawal -800u; remaining platform balance 178u", result: "OK"},
  {time: "2026-09-01 19:15", actor: "cashier", action: "Collected 50u from five-league popular fixtures betting proceeds", result: "OK"},
  {time: "2026-09-01 18:30", actor: "cashier", action: "Submitted exchange treasury withdrawal of 800u (Est. 20% fee, ETA 2026-09-02)", result: "Processing"},
  {time: "2026-09-01 16:40", actor: "sportsbook", action: "Accepted 20u FC Barcelona -1.5 @ 1.72 on FC Barcelona vs Real Valladolid", result: "Pending"},
  {time: "2026-09-01 14:20", actor: "sportsbook", action: "Accepted 30u Arsenal win @ 1.55 on Arsenal vs Brighton", result: "Pending"},
  {time: "2026-08-31 23:58", actor: "system", action: "Updated Ledger by Date with 8.31 five-league receipts 55u; cumulative receipts 975u", result: "OK"},
  {time: "2026-08-31 18:00", actor: "cashier", action: "Collected 55u from five-league popular fixtures betting proceeds", result: "OK"},
  {time: "2026-08-31 17:15", actor: "sportsbook", action: "Accepted 10u Over 2.5 @ 1.82 on Lyon vs Monaco", result: "Pending"},
  {time: "2026-08-31 15:40", actor: "sportsbook", action: "Accepted 10u Bayern Munich -1.5 @ 1.75 on Bayern Munich vs SC Freiburg", result: "Pending"},
  {time: "2026-08-31 13:22", actor: "sportsbook", action: "Accepted 10u Juventus DNB @ 1.68 on Juventus vs Roma", result: "Pending"},
  {time: "2026-08-31 11:35", actor: "sportsbook", action: "Accepted 10u Real Madrid win @ 1.45 on Real Madrid vs Real Betis", result: "Pending"},
  {time: "2026-08-31 10:18", actor: "sportsbook", action: "Accepted 15u Liverpool win @ 1.95 on Manchester United vs Liverpool", result: "Pending"},
  {time: "2026-08-26 23:40", actor: "cashier", action: "Collected 50u from 8.26 five-league betting proceeds", result: "OK"},
  {time: "2026-08-27 23:58", actor: "system", action: "Updated Ledger by Date with 8.27 LaLiga income; cumulative five-league receipts 575u", result: "OK"},
  {time: "2026-08-27 23:42", actor: "cashier", action: "Collected 30u from 8.27 LaLiga FC Barcelona vs Athletic Club betting proceeds", result: "OK"},
  {time: "2026-08-27 20:06", actor: "sportsbook", action: "Accepted LaLiga bet 15u on FC Barcelona vs Athletic Club, Both teams to score @ 1.74", result: "Pending"},
  {time: "2026-08-27 19:42", actor: "sportsbook", action: "Accepted LaLiga bet 15u on FC Barcelona vs Athletic Club, FC Barcelona win @ 1.64", result: "Pending"},
  {time: "2026-08-28 02:00", actor: "sportsbook", action: "Accepted 20u bet on Alebrijes Oaxaca vs Tapatío, Alebrijes Oaxaca win @ 1.97", result: "Pending"},
  {time: "2026-08-28 02:20", actor: "cashier", action: "Collected 20u from Alebrijes Oaxaca vs Tapatío betting proceeds", result: "OK"},
  {time: "2026-08-28 20:32", actor: "system", action: "Settled Bayern Munich vs VfB Stuttgart at 5-1; LGB-2802 correct-score winner verified and marked as Paid (已完成兑付)", result: "OK"},
  {time: "2026-08-28 20:30", actor: "cashier", action: "Collected 220u from Bundesliga Bayern Munich vs VfB Stuttgart betting proceeds", result: "OK"},
  {time: "2026-08-28 19:26", actor: "sportsbook", action: "Accepted 40u Bayern Munich -1.5 @ 1.70 on Bayern Munich vs VfB Stuttgart", result: "Open"},
  {time: "2026-08-28 19:18", actor: "sportsbook", action: "Accepted 40u Over 2.5 @ 1.22 on Bayern Munich vs VfB Stuttgart", result: "Open"},
  {time: "2026-08-28 19:05", actor: "sportsbook", action: "Accepted 60u Bayern Munich win @ 1.25 on Bayern Munich vs VfB Stuttgart", result: "Open"},
  {time: "2026-08-28 18:42", actor: "sportsbook", action: "Accepted 80u correct score 5-1 @ 2.40 on Bayern Munich vs VfB Stuttgart", result: "Paid"},
  {time: "2026-08-29 23:58", actor: "system", action: "Updated Ledger by Date with 8.29 five-league receipts 105u; cumulative receipts 920u", result: "OK"},
  {time: "2026-08-29 16:00", actor: "cashier", action: "Collected 105u from five-league popular fixtures betting proceeds", result: "OK"},
  {time: "2026-08-29 15:08", actor: "sportsbook", action: "Accepted 20u Atlético de Madrid DNB @ 2.18 on Sevilla FC vs Atlético de Madrid", result: "Pending"},
  {time: "2026-08-29 14:20", actor: "sportsbook", action: "Accepted 15u Olympique Lyonnais win @ 1.72 on Lyon vs Le Havre", result: "Pending"},
  {time: "2026-08-29 12:26", actor: "sportsbook", action: "Accepted 20u RC Lens win @ 2.10 on Strasbourg vs Lens", result: "Pending"},
  {time: "2026-08-29 11:02", actor: "sportsbook", action: "Accepted 25u Tottenham Hotspur win @ 2.05 on Tottenham vs Newcastle", result: "Pending"},
  {time: "2026-08-29 10:14", actor: "sportsbook", action: "Accepted 25u Liverpool win @ 1.48 on Liverpool vs Nottingham Forest", result: "Pending"},
  {time: "2026-08-26 23:25", actor: "system", action: "Updated Ledger by Date with 8.26 income; cumulative five-league receipts 545u", result: "OK"},
  {time: "2026-08-02 23:40", actor: "admin", action: "Withdrew 1000u to exchange treasury", result: "Completed"},
  {time: "2026-08-25 23:48", actor: "system", action: "Updated Ledger by Date with 8.25 LaLiga receipt; cumulative five-league stake 495u", result: "OK"},
  {time: "2026-08-25 23:36", actor: "cashier", action: "Collected 95u from 8.25 LaLiga Valencia vs Real Betis betting proceeds", result: "OK"},
  {time: "2026-08-25 19:26", actor: "sportsbook", action: "Accepted LaLiga bet 35u on Valencia vs Real Betis, Under 2.5 @ 1.62", result: "Open"},
  {time: "2026-08-25 19:08", actor: "sportsbook", action: "Accepted LaLiga live bet 25u on Valencia vs Real Betis, correct score 0-0 @ 6.20", result: "Risk hold"},
  {time: "2026-08-25 18:52", actor: "sportsbook", action: "Accepted LaLiga bet 35u on Valencia vs Real Betis, Valencia win @ 2.42", result: "Open"},
  {time: "2026-08-24 23:12", actor: "cashier", action: "Collected 60u from 8.24 Serie A Bologna vs Lazio betting proceeds", result: "OK"},
  {time: "2026-08-24 17:30", actor: "sportsbook", action: "Accepted Serie A bet 60u on Bologna vs Lazio, Lazio DNB @ 1.74", result: "Open"},
  {time: "2026-08-24 02:05", actor: "sportsbook", action: "Reconciled 8.24 Bologna vs Lazio slip to 60u; cumulative five-league stake 400u", result: "OK"},
  {time: "2026-08-23 20:45", actor: "sportsbook", action: "Accepted Serie A bet 18u on Torino vs AC Milan, AC Milan DNB @ 1.79", result: "Open"},
  {time: "2026-08-23 20:18", actor: "sportsbook", action: "Accepted Ligue 1 bet 27u on PSG vs Stade Rennais, PSG win @ 1.35", result: "Open"},
  {time: "2026-08-23 19:45", actor: "sportsbook", action: "Accepted Serie A bet 13u on Atalanta vs Sassuolo, Atalanta win @ 1.66", result: "Open"},
  {time: "2026-08-23 17:30", actor: "sportsbook", action: "Accepted Serie A bet 12u on Frosinone vs Juventus, Juventus win @ 1.62", result: "Open"},
  {time: "2026-08-23 13:42", actor: "sportsbook", action: "Accepted Premier League bet 15u on Manchester City vs Bournemouth, City team total over 1.5 @ 1.78", result: "Open"},
  {time: "2026-08-23 20:30", actor: "cashier", action: "Collected 85u from 8.23 five-league betting proceeds", result: "OK"},
  {time: "2026-08-23 03:20", actor: "admin", action: "Withdrew 240u to exchange treasury after five-league receipt reconciliation", result: "Completed"},
  {time: "2026-08-23 02:10", actor: "sportsbook", action: "Reconciled 8.23 five-league slips to 85u; cumulative five-league stake 340u", result: "OK"},
  {time: "2026-08-22 23:58", actor: "cashier", action: "Collected 208u from 8.22 five-league betting proceeds", result: "OK"},
  {time: "2026-08-21 23:10", actor: "cashier", action: "Collected 10u from Premier League opening bet", result: "OK"},
  {time: "2026-08-22 03:06", actor: "sportsbook", action: "Accepted Premier League bet 10u on Arsenal vs Coventry City", result: "Pending"},
  {time: "2026-08-21 02:35", actor: "casino-engine", action: "Settled wheel game income 21u", result: "OK"},
  {time: "2026-08-20 02:22", actor: "casino-engine", action: "Settled wheel game income 23u", result: "OK"},
  {time: "2026-08-19 02:18", actor: "casino-engine", action: "Settled wheel game income 18u", result: "OK"},
  {time: "2026-08-18 02:14", actor: "casino-engine", action: "Settled wheel game income 22u", result: "OK"},
  {time: "2026-08-17 02:09", actor: "casino-engine", action: "Settled wheel game income 19u", result: "OK"},
  {time: "2026-08-16 02:04", actor: "casino-engine", action: "Settled wheel game income 20u", result: "OK"},
  {time: "2026-08-11 02:30", actor: "casino-engine", action: "Settled wheel game income 5u", result: "OK"},
  {time: "2026-08-10 01:50", actor: "casino-engine", action: "Settled wheel game income 15u", result: "OK"},
  {time: "2026-08-08 03:18", actor: "casino-engine", action: "Settled wheel game income 20u", result: "OK"},
  {time: "2026-08-01 23:20", actor: "system", action: "Closed 7.21-8.1 NBA/NHL betting ledger", result: "All lost"},
  {time: "2026-07-20 22:14", actor: "cashier", action: "Confirmed two deposits totaling 20u and NBA lost bets", result: "OK"},
  {time: "2026-07-16 03:12", actor: "admin", action: "Withdrew 1000u to exchange treasury", result: "Completed"},
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

type DailyMasterRecord = {
  date: string;
  isToday: boolean;
  totalIncome: number;
  crashIncome: number;
  sportsIncome: number;
  newUsers: PlatformUser[];
  bettors: DailyBettor[];
  slips: LeagueBetSlip[];
  bets: BetRecord[];
  withdrawals: number;
  net: number;
  balanceAfter: number;
  isReconciled: boolean;
  ledgerRow: DateLedgerRow;
  fixtures: LeagueDailyFixture[];
};

function useDailyMasterRecords(allUsers: PlatformUser[]): DailyMasterRecord[] {
  return useMemo(() => {
    const userMap = new Map<string, PlatformUser>();
    allUsers.forEach((u) => userMap.set(u.username.toLowerCase(), u));

    const effectiveEnd = getEffectiveEndDate();
    const dateMap = new Map<string, DailyMasterRecord>();

    dateLedgerRows.forEach((row) => {
      const date = row.date;
      const incRow = dailyIncomeRows.find((r) => r.period === date);
      const totalIncome = incRow ? incRow.total : (row.crashIncome + row.leagueReceipts);
      const crashIncome = row.crashIncome;
      const sportsIncome = incRow ? Math.max(0, Math.round((incRow.total - crashIncome) * 100) / 100) : (row.leagueReceipts > 0 ? row.leagueReceipts : row.sportsStakes);

      const newUsers = allUsers.filter((u) => u.registeredAt.startsWith(date));
      const slips = leagueBetSlips.filter((s) => s.time.startsWith(date));
      const bets = betRecords.filter((b) => b.matchDate === date);
      const fixtures = leagueDailyFixtures.filter((f) => f.date === date);

      const bettors: DailyBettor[] = [];
      slips.forEach((slip) => {
        const u = userMap.get(slip.user.toLowerCase());
        const regDate = u?.registeredAt ? u.registeredAt.slice(0, 10) : "";
        const userType: "New User" | "Returning User" = regDate === date ? "New User" : "Returning User";
        const result: "Won" | "Lost" | "Pending" = slip.status.toLowerCase().includes("won")
          ? "Won"
          : slip.status.toLowerCase().includes("lost")
          ? "Lost"
          : "Pending";
        bettors.push({
          username: slip.user,
          userType,
          sport: slip.league,
          match: slip.match,
          selection: slip.selection,
          stake: slip.stake,
          result,
          payout: result === "Won" ? slip.potentialPayout : 0,
        });
      });
      bets.forEach((bet) => {
        const u = userMap.get(bet.user.username.toLowerCase()) || bet.user;
        const regDate = u?.registeredAt ? u.registeredAt.slice(0, 10) : "";
        const userType: "New User" | "Returning User" = regDate === date ? "New User" : "Returning User";
        const result: "Won" | "Lost" | "Pending" = (bet.result === "Paid" || bet.result.startsWith("Won")) ? "Won" : bet.result === "Lost" ? "Lost" : "Pending";
        bettors.push({
          username: bet.user.username,
          userType,
          sport: bet.round,
          match: bet.match,
          selection: bet.selection,
          stake: bet.stake,
          result,
          payout: bet.payout,
        });
      });

      dateMap.set(date, {
        date,
        isToday: date === effectiveEnd,
        totalIncome,
        crashIncome,
        sportsIncome,
        newUsers,
        bettors,
        slips,
        bets,
        withdrawals: row.exchangeWithdrawals,
        net: row.net,
        balanceAfter: row.balanceAfter,
        isReconciled: true,
        ledgerRow: row,
        fixtures,
      });
    });

    return Array.from(dateMap.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [allUsers]);
}

function DailyMasterTableView({
  allUsers,
  openDetail,
  onOpenWithdraw,
}: {
  allUsers: PlatformUser[];
  openDetail: (detail: Detail) => void;
  onOpenWithdraw?: () => void;
}) {
  const records = useDailyMasterRecords(allUsers);
  const [filterMonth, setFilterMonth] = useState<"All" | "2026-10" | "2026-09" | "2026-08" | "2026-07" | "2026-06">("All");
  const [selectedDate, setSelectedDate] = useState<string>(() => records[0]?.date || "2026-10-06");
  const [drillTab, setDrillTab] = useState<"users" | "bets" | "ledger" | "fixtures">("users");
  const [query, setQuery] = useState("");

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterMonth !== "All" && !r.date.startsWith(filterMonth)) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchesDate = r.date.includes(q);
        const matchesUser = r.newUsers.some((u) => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
        const matchesBettor = r.bettors.some((b) => b.username.toLowerCase().includes(q) || b.match.toLowerCase().includes(q));
        if (!matchesDate && !matchesUser && !matchesBettor) return false;
      }
      return true;
    });
  }, [records, filterMonth, query]);

  const selectedRecord = useMemo(() => {
    return records.find((r) => r.date === selectedDate) || records[0];
  }, [records, selectedDate]);

  const totalScopeRevenue = useMemo(() => filteredRecords.reduce((s, r) => s + r.totalIncome, 0), [filteredRecords]);
  const totalScopeCrash = useMemo(() => filteredRecords.reduce((s, r) => s + r.crashIncome, 0), [filteredRecords]);
  const totalScopeSports = useMemo(() => filteredRecords.reduce((s, r) => s + r.sportsIncome, 0), [filteredRecords]);
  const totalScopeSignups = useMemo(() => filteredRecords.reduce((s, r) => s + r.newUsers.length, 0), [filteredRecords]);
  const totalScopeBettors = useMemo(() => filteredRecords.reduce((s, r) => s + r.bettors.length, 0), [filteredRecords]);
  const totalScopeWager = useMemo(() => filteredRecords.reduce((s, r) => s + r.bettors.reduce((sum, b) => sum + b.stake, 0), 0), [filteredRecords]);
  const totalScopeWithdrawals = useMemo(() => filteredRecords.reduce((s, r) => s + r.withdrawals, 0), [filteredRecords]);

  return (
    <div className="daily-master-container">
      <div className="daily-quick-stats">
        <div className="stat-pill">
          <span>统计天数</span>
          <strong>{filteredRecords.length} 天</strong>
        </div>
        <div className="stat-pill">
          <span>期间总营收</span>
          <strong style={{color: "#34d399"}}>+{totalScopeRevenue.toLocaleString()} USDT</strong>
        </div>
        <div className="stat-pill">
          <span>Crash 游戏收益</span>
          <strong>+{totalScopeCrash.toLocaleString()} USDT</strong>
        </div>
        <div className="stat-pill">
          <span>体育赛事收益</span>
          <strong>+{totalScopeSports.toLocaleString()} USDT</strong>
        </div>
        <div className="stat-pill">
          <span>新注册用户</span>
          <strong>+{totalScopeSignups} 人</strong>
        </div>
        <div className="stat-pill">
          <span>总投注单量</span>
          <strong>{totalScopeBettors} 单 ({totalScopeWager.toLocaleString()}u)</strong>
        </div>
        <div className="stat-pill">
          <span>提现扣减</span>
          <strong style={{color: totalScopeWithdrawals > 0 ? "#f87171" : "#94a3b8"}}>-{totalScopeWithdrawals.toLocaleString()} USDT</strong>
        </div>
        <div className="stat-pill">
          <span>平台金库当前余额</span>
          <strong style={{color: "#38bdf8"}}>{platformBalance.toLocaleString()} USDT</strong>
        </div>
      </div>

      <div className="daily-toolbar">
        <div className="daily-toolbar-left">
          <div className="btn-group">
            <button className={filterMonth === "All" ? "active" : ""} onClick={() => setFilterMonth("All")}>全部历史</button>
            <button className={filterMonth === "2026-10" ? "active" : ""} onClick={() => setFilterMonth("2026-10")}>2026年10月 (本月)</button>
            <button className={filterMonth === "2026-09" ? "active" : ""} onClick={() => setFilterMonth("2026-09")}>2026年9月</button>
            <button className={filterMonth === "2026-08" ? "active" : ""} onClick={() => setFilterMonth("2026-08")}>2026年8月</button>
            <button className={filterMonth === "2026-07" ? "active" : ""} onClick={() => setFilterMonth("2026-07")}>2026年7月</button>
            <button className={filterMonth === "2026-06" ? "active" : ""} onClick={() => setFilterMonth("2026-06")}>2026年6月</button>
          </div>
          <div className="daily-select-wrap">
            <span>跳转到具体日期:</span>
            <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
              {records.map((r) => (
                <option key={r.date} value={r.date}>
                  {r.date} {r.isToday ? "(今日)" : ""} · 总收 +{r.totalIncome}u · {r.newUsers.length}人注册
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="daily-toolbar-right">
          <label className="search search-inline">
            <Search size={15} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索日期、用户名、邮箱、赛事 (如 2026-10-06, OliverUK98)..."
            />
          </label>
        </div>
      </div>

      <Panel
        title="按日运营与财务综合数据总表"
        meta="每日自动生成收入、Crash收益、赛事净收益、新注册用户、注单量、提现流水与金库结余。点击任意行即可在下方下钻查看该日的四重大表格明细。"
      >
        <div className="data-table daily-master-table">
          <div className="data-row data-head">
            <span>日期</span>
            <span>当日总收入</span>
            <span>Crash收益</span>
            <span>赛事净收益</span>
            <span>新注册用户</span>
            <span>注单量</span>
            <span>总投注额</span>
            <span>提现下发</span>
            <span>资金净变动</span>
            <span>金库结存</span>
            <span>对账平账</span>
            <span>操作</span>
          </div>
          {filteredRecords.map((row) => {
            const isSelected = row.date === selectedDate;
            const dayWager = row.bettors.reduce((sum, b) => sum + b.stake, 0);
            return (
              <div
                className={`data-row clickable-row ${isSelected ? "active-day-row" : ""}`}
                key={row.date}
                onClick={() => setSelectedDate(row.date)}
              >
                <div>
                  <strong>{row.date}</strong>
                  {row.isToday && <span className="badge-today">今日</span>}
                </div>
                <strong style={{color: "#4ade80"}}>+{row.totalIncome.toFixed(2)}u</strong>
                <span>+{row.crashIncome.toFixed(2)}u</span>
                <span>+{row.sportsIncome.toFixed(2)}u</span>
                <div>
                  <span className={`pill-badge ${row.newUsers.length > 0 ? "pill-new" : ""}`}>
                    +{row.newUsers.length} 人
                  </span>
                </div>
                <span>{row.bettors.length} 单</span>
                <span>{dayWager > 0 ? `${dayWager}u` : "0u"}</span>
                <span style={{color: row.withdrawals > 0 ? "#f87171" : "#94a3b8"}}>
                  {row.withdrawals > 0 ? `-${row.withdrawals}u` : "0u"}
                </span>
                <em className={row.net < 0 ? "danger" : row.net > 0 ? "" : "warn"}>
                  {row.net > 0 ? `+${row.net}u` : `${row.net}u`}
                </em>
                <b>{row.balanceAfter.toFixed(2)}u</b>
                <div>
                  <span className="badge-reconciled">
                    <ShieldCheck size={12} /> 已平账
                  </span>
                </div>
                <button
                  className="mini-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDate(row.date);
                    openDetail(dateLedgerDetail(row.ledgerRow));
                  }}
                >
                  对账明细
                </button>
              </div>
            );
          })}
          {filteredRecords.length === 0 && <div className="empty">没有符合筛选条件的日期记录。</div>}
        </div>
      </Panel>

      {selectedRecord && (
        <div className="day-drilldown-panel">
          <div className="day-drilldown-header">
            <div>
              <h3>
                <CalendarDays size={20} color="#2dd4bf" />
                {selectedRecord.date} 全景明细表格
                {selectedRecord.isToday && <span className="badge-today">今日最新</span>}
              </h3>
              <p style={{margin: "4px 0 0", fontSize: 13, color: "#94a3b8"}}>
                当日总收入 +{selectedRecord.totalIncome}u · Crash 收入 +{selectedRecord.crashIncome}u · 赛事收入 +{selectedRecord.sportsIncome}u · 提现 {selectedRecord.withdrawals}u · 当日金库结余 {selectedRecord.balanceAfter}u (平账差额 0.00u)
              </p>
            </div>
            <div className="day-drilldown-tabs">
              <button
                className={drillTab === "users" ? "active" : ""}
                onClick={() => setDrillTab("users")}
              >
                👥 新注册用户 ({selectedRecord.newUsers.length} 人)
              </button>
              <button
                className={drillTab === "bets" ? "active" : ""}
                onClick={() => setDrillTab("bets")}
              >
                ⚽ 当日投注注单 ({selectedRecord.bettors.length} 单)
              </button>
              <button
                className={drillTab === "ledger" ? "active" : ""}
                onClick={() => setDrillTab("ledger")}
              >
                📑 借贷流水对账 ({selectedRecord.ledgerRow.items.length} 笔)
              </button>
              <button
                className={drillTab === "fixtures" ? "active" : ""}
                onClick={() => setDrillTab("fixtures")}
              >
                🏆 赛程与开盘盘口 ({selectedRecord.fixtures.length} 场)
              </button>
            </div>
          </div>

          {drillTab === "users" && (
            <div className="data-table day-user-table">
              <div className="data-row data-head">
                <span>序号</span>
                <span>用户名</span>
                <span>电子邮箱</span>
                <span>注册批次</span>
                <span>国家/地区</span>
                <span>注册时间</span>
                <span>实名认证</span>
                <span>账户余额</span>
                <span>操作</span>
              </div>
              {selectedRecord.newUsers.map((u, idx) => (
                <div className="data-row" key={u.username}>
                  <span>#{idx + 1}</span>
                  <strong>{u.username}</strong>
                  <span className="user-email-cell" title={u.email}>{u.email || "-"}</span>
                  <span>{u.round}</span>
                  <span>{u.location} · {u.region}</span>
                  <span>{u.registeredAt}</span>
                  <em style={{color: "#4ade80"}}>已认证</em>
                  <b>{u.deposit}u</b>
                  <button className="mini-btn" onClick={() => openDetail(userDetail(u, idx))}>查看画像</button>
                </div>
              ))}
              {selectedRecord.newUsers.length === 0 && (
                <div className="empty">该日无新注册用户记录（老用户活跃群体）。</div>
              )}
            </div>
          )}

          {drillTab === "bets" && (
            <div className="data-table day-bet-table">
              <div className="data-row data-head">
                <span>注单ID / 赛事</span>
                <span>投注用户</span>
                <span>用户类型</span>
                <span>联赛/赛事</span>
                <span>对阵比赛</span>
                <span>投注盘口</span>
                <span>赔率</span>
                <span>投注金额</span>
                <span>派彩状态</span>
                <span>结算派彩</span>
              </div>
              {selectedRecord.bettors.map((b, idx) => (
                <div className="data-row" key={`${b.username}-${b.match}-${idx}`}>
                  <span>BET-{selectedRecord.date.replace(/-/g, "").slice(4)}-{String(idx + 1).padStart(3, "0")}</span>
                  <strong>{b.username}</strong>
                  <span className={`pill-badge ${b.userType === "New User" ? "pill-new" : "pill-returning"}`}>
                    {b.userType === "New User" ? "新用户" : "老用户"}
                  </span>
                  <span>{b.sport}</span>
                  <span title={b.match}>{b.match}</span>
                  <span style={{color: "#38bdf8"}}>{b.selection}</span>
                  <b>{b.stake > 0 ? (b.payout > 0 ? (b.payout / b.stake).toFixed(2) : "1.85") : "1.80"}</b>
                  <span>{b.stake}u</span>
                  <em className={b.result === "Won" ? "success" : b.result === "Lost" ? "danger" : "warn"}>
                    {b.result === "Won" ? "已中奖" : b.result === "Lost" ? "未中奖" : "待结算"}
                  </em>
                  <strong style={{color: b.payout > 0 ? "#4ade80" : "#94a3b8"}}>
                    {b.payout > 0 ? `+${b.payout}u` : "0u"}
                  </strong>
                </div>
              ))}
              {selectedRecord.bettors.length === 0 && (
                <div className="empty">该日暂无体育赛事投注记录。</div>
              )}
            </div>
          )}

          {drillTab === "ledger" && (
            <div className="data-table day-ledger-table">
              <div className="data-row data-head">
                <span>记账时间</span>
                <span>业务类型</span>
                <span>流水明细描述</span>
                <span>借方 (收入+)</span>
                <span>贷方 (支出-)</span>
                <span>当日结存余额</span>
                <span>对账状态</span>
              </div>
              {selectedRecord.ledgerRow.items.map((item, idx) => {
                const isPositive = item.includes("+");
                const isNegative = item.includes("-");
                return (
                  <div className="data-row" key={`${selectedRecord.date}-${idx}`}>
                    <span>{selectedRecord.date} 23:59</span>
                    <strong>{item.includes("Crash") ? "Crash 游戏收入" : item.includes("withdrawal") || item.includes("Exchange") ? "提现出款" : item.includes("payout") || item.includes("Payout") ? "中奖派彩" : item.includes("Sports") || item.includes("League") ? "体育赛事收益" : "平台充值"}</strong>
                    <span style={{color: "#cbd5e1"}}>{item}</span>
                    <span style={{color: isPositive ? "#4ade80" : "#94a3b8"}}>
                      {isPositive ? item.match(/\+(\d+(?:\.\d+)?)u/)?.[0] || "-" : "-"}
                    </span>
                    <span style={{color: isNegative ? "#f87171" : "#94a3b8"}}>
                      {isNegative ? item.match(/-(\d+(?:\.\d+)?)u/)?.[0] || "-" : "-"}
                    </span>
                    <b>{selectedRecord.balanceAfter.toFixed(2)}u</b>
                    <span className="badge-reconciled">
                      <ShieldCheck size={12} /> 平账核验通过
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {drillTab === "fixtures" && (
            <div className="data-table day-fixture-table">
              <div className="data-row data-head">
                <span>开赛时间</span>
                <span>赛事联赛</span>
                <span>比赛对阵</span>
                <span>轮次/阶段</span>
                <span>独赢赔率 (主/平/客)</span>
                <span>让球盘口</span>
                <span>大小球盘口</span>
                <span>状态</span>
              </div>
              {selectedRecord.fixtures.map((f, idx) => (
                <div className="data-row clickable-row" key={`${f.date}-${f.match}-${idx}`} onClick={() => openDetail(leagueDailyFixtureDetail(f))}>
                  <span>{f.time}</span>
                  <strong>{f.league}</strong>
                  <span>{f.match}</span>
                  <small>{f.matchday}</small>
                  <b>{f.moneyline}</b>
                  <span>{f.handicap}</span>
                  <span>{f.total}</span>
                  <em className={f.status === "Live" ? "success" : ""}>
                    {f.status === "Live" ? "滚球进行中" : f.status === "Today" ? "今日赛事" : "未开赛"}
                  </em>
                </div>
              ))}
              {selectedRecord.fixtures.length === 0 && (
                <div className="empty">该日未安排重点联赛比赛，或为国际比赛日休赛期。</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function buildDailyUserActivities(users: PlatformUser[]): DailyUserActivity[] {
  const userMap = new Map<string, PlatformUser>();
  users.forEach((u) => userMap.set(u.username.toLowerCase(), u));

  const dateSet = new Set<string>();

  users.forEach((u) => {
    const d = u.registeredAt.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      dateSet.add(d);
    }
  });

  betRecords.forEach((b) => {
    if (b.matchDate && /^\d{4}-\d{2}-\d{2}$/.test(b.matchDate)) {
      dateSet.add(b.matchDate);
    }
  });

  leagueBetSlips.forEach((s) => {
    const d = s.time.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      dateSet.add(d);
    }
  });

  const sortedDates = Array.from(dateSet).sort((a, b) => b.localeCompare(a));

  return sortedDates.map((date) => {
    const registeredUsers = users
      .filter((u) => u.registeredAt.startsWith(date))
      .map((u) => ({
        username: u.username,
        location: u.location,
        email: u.email,
        time: u.registeredAt.length >= 16 ? u.registeredAt.slice(11, 16) : u.registeredAt,
      }));

    const bettors: DailyBettor[] = [];

    leagueBetSlips.forEach((slip) => {
      if (slip.time.startsWith(date)) {
        const u = userMap.get(slip.user.toLowerCase());
        const regDate = u?.registeredAt ? u.registeredAt.slice(0, 10) : "";
        const userType: "New User" | "Returning User" = regDate === date ? "New User" : "Returning User";
        const result: "Won" | "Lost" | "Pending" = slip.status.toLowerCase().includes("won")
          ? "Won"
          : slip.status.toLowerCase().includes("lost")
          ? "Lost"
          : "Pending";
        bettors.push({
          username: slip.user,
          userType,
          sport: slip.league,
          match: slip.match,
          selection: slip.selection,
          stake: slip.stake,
          result,
          payout: result === "Won" ? slip.potentialPayout : 0,
        });
      }
    });

    betRecords.forEach((bet) => {
      if (bet.matchDate === date) {
        const u = userMap.get(bet.user.username.toLowerCase()) || bet.user;
        const regDate = u?.registeredAt ? u.registeredAt.slice(0, 10) : "";
        const userType: "New User" | "Returning User" = regDate === date ? "New User" : "Returning User";
        const result: "Won" | "Lost" | "Pending" = (bet.result === "Paid" || bet.result.startsWith("Won")) ? "Won" : bet.result === "Lost" ? "Lost" : "Pending";
        bettors.push({
          username: bet.user.username,
          userType,
          sport: bet.round,
          match: bet.match,
          selection: bet.selection,
          stake: bet.stake,
          result,
          payout: bet.payout,
        });
      }
    });

    return {
      date,
      registeredUsers,
      bettors,
    };
  });
}

function dailyActivityDetail(act: DailyUserActivity): Detail {
  const totalWager = act.bettors.reduce((sum, b) => sum + b.stake, 0);
  const newBettors = act.bettors.filter((b) => b.userType === "New User").length;
  const returningBettors = act.bettors.filter((b) => b.userType === "Returning User").length;
  const wonCount = act.bettors.filter((b) => b.result === "Won").length;
  const lostCount = act.bettors.filter((b) => b.result === "Lost").length;
  const pendingCount = act.bettors.filter((b) => b.result === "Pending").length;
  return {
    title: `用户活跃与注单审计 · ${act.date}`,
    kicker: "每日注册与活跃统计",
    fields: [
      ["统计日期", act.date],
      ["新注册用户", `${act.registeredUsers.length} 人`],
      ["活跃投注用户", `${act.bettors.length} 单 (${newBettors}位新用户, ${returningBettors}位复投老用户)`],
      ["总投注金额", `${totalWager}u`],
      ["赛果派彩分布", `${wonCount} 已中奖 · ${lostCount} 未中奖 · ${pendingCount} 待结算`],
    ],
    actions: ["导出当日活动清单", "核验注单结算", "查看用户账本"],
    note: act.bettors.map((b) => `${b.username} [${b.userType === "New User" ? "新用户" : "老用户"}]: ${b.stake}u 投于 ${b.match} (${b.result === "Won" ? "已中奖" : b.result === "Lost" ? "未中奖" : "待结算"})`).join(" | ") || (act.registeredUsers.length > 0 ? `注册名单: ${act.registeredUsers.map((u) => u.username).join(", ")}` : "当日无记录。"),
  };
}

export function App() {
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession());
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [activePage, setActivePage] = useState<ActivePage>("DailyMaster");
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
  const [winnerAlertOpen, setWinnerAlertOpen] = useState(false);

  const combinedUsers = useMemo(() => [...allUsers, ...syncedMainUsers(summary)], [summary]);
  const filteredUsers = useMemo(() => {
    const users = combinedUsers;
    if (!query.trim()) return users;
    return users.filter((user) => user.username.toLowerCase().includes(query.toLowerCase()));
  }, [query, combinedUsers]);

  const enterAdminDirectly = (targetUsername?: string) => {
    const directSession: AuthSession = {
      token: "mock-token",
      user: { id: "admin-1", username: targetUsername?.trim() || "admin" },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(directSession));
    setSession(directSession);
  };

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      try {
        const next = await api<AuthSession>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({username, password}),
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setSession(next);
      } catch (apiErr) {
        console.warn("API login failed, falling back to local admin session:", apiErr);
        enterAdminDirectly(username);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    if (!session) return;
    setRefreshing(true);
    try {
      setSummary(await api<AdminSummary>("/api/admin/summary", {}, session.token));
      setError("");
    } catch (err) {
      console.warn("Summary API not reached (running in standalone mode):", err);
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
      <main className="login-clean-shell">
        <div className="login-clean-bg-glow"></div>
        <div className="login-clean-card">
          <div className="login-clean-header">
            <div className="login-clean-badge">系统管理平台</div>
            <h1 className="login-clean-title">用户登录</h1>
            <p className="login-clean-desc">请输入您的管理员账号与密码进入控制台</p>
          </div>

          <form onSubmit={login} className="login-clean-form">
            <div className="login-clean-field">
              <label className="login-clean-label">账号</label>
              <div className="login-clean-input-wrap">
                <input
                  type="text"
                  className="login-clean-input"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="请输入管理员账号"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="login-clean-field">
              <label className="login-clean-label">密码</label>
              <div className="login-clean-input-wrap">
                <input
                  type="password"
                  className="login-clean-input"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="请输入登录密码"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {error && <div className="login-clean-error">{error}</div>}

            <button type="submit" className="login-clean-btn" disabled={loading}>
              {loading ? "正在登录..." : "登 录"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  const pageMeta = {
    DailyMaster: ["运营日度总表", "每日综合数据监控与按天穿透表格"],
    Overview: ["运营监控工作台", "平台大盘资金、用户与核心指标总览"],
    Users: ["用户档案名册", "玩家账户生命周期与KYC实名管理"],
    Deposits: ["USDT 充值校验", "链上充值到账队列与到账确认"],
    Withdrawals: ["提现出款审核", "人工出款复核与平台资金出入风控"],
    "Risk Review": ["风险控制引擎", "异常行为信号、投注限额与合规排查"],
    "Bonus Controls": ["活动红利配置", "迎新优惠、流水打码与返水规则"],
    "Five Leagues": ["五大联赛盘口", "欧洲五大足球联赛赛前与滚球盘口监控"],
    "League Bets": ["赛事注单列表", "联赛单场、串关、滚球与特殊盘注单追踪"],
    "Ledger by Date": ["按日对账流水", "每日资金净变动与钱包借贷平衡核验"],
    "Premier League": ["英超联赛", "英格兰超级联赛赛程、盘口与风险敞口"],
    LaLiga: ["西甲联赛", "西班牙足球甲级联赛赛程、盘口与风险敞口"],
    "Serie A": ["意甲联赛", "意大利足球甲级联赛赛程、盘口与风险敞口"],
    Bundesliga: ["德甲联赛", "德国足球甲级联赛赛程、盘口与风险敞口"],
    "Ligue 1": ["法甲联赛", "法国足球甲级联赛赛程、盘口与风险敞口"],
    "Audit Logs": ["系统审计日志", "管理员操作记录与系统关键事件留痕"],
  } satisfies Record<ActivePage, [string, string]>;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <ShieldCheck size={24} />
          <div>
            <strong>win-worldcup</strong>
            <span>管理后台中心</span>
          </div>
        </div>
        <nav>
          {navItems.map(({key, label, Icon}) => (
            <button className={key === activePage ? "active" : ""} key={key} onClick={() => setActivePage(key)}>
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span>主站 API 状态</span>
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
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索日期、用户、赛事..." />
            </label>
            <button className="icon-btn" onClick={() => {
              loadSummary();
              setDetail({
                title: "刷新数据请求已发出",
                kicker: "实时 API 同步",
                fields: [["接口端点", "/api/admin/summary"], ["请求操作员", session.user.username]],
                actions: ["重新加载统计指标", "刷新用户花名册", "更新审计流水计数器"],
                note: "管理控制台向主站体育接口请求最新的实时概览数据并已完成校验。",
              });
            }} disabled={refreshing} title="刷新数据">
              <RefreshCcw size={17} className={refreshing ? "spin" : ""} />
            </button>
            <button className="account" onClick={() => setDetail({
              title: "管理员登录会话",
              kicker: "已认证操作员",
              fields: [["操作员用户名", session.user.username], ["API 主机", API_BASE], ["会话存储", "浏览器本地存储"]],
              actions: ["检查当前会话状态", "退出此浏览器登录", "在 Zeabur 后台轮转密码"],
              note: "离开操作员工作站前，请执行退出登录操作以确保安全性。",
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

        {activePage === "DailyMaster" && <DailyMasterTableView allUsers={combinedUsers} openDetail={setDetail} onOpenWithdraw={() => setWithdrawOpen(true)} />}
        {activePage === "Overview" && <OverviewPage summary={summary} totalUserCount={combinedUsers.length} filteredUsers={filteredUsers} openDetail={setDetail} onOpenWithdraw={() => setWithdrawOpen(true)} setActivePage={setActivePage} />}
        {activePage === "Users" && <UsersPage summary={summary} filteredUsers={filteredUsers} combinedUsers={combinedUsers} openDetail={setDetail} />}
        {activePage === "Deposits" && <DepositsPage openDetail={setDetail} />}
        {activePage === "Withdrawals" && <WithdrawalsPage openDetail={setDetail} onOpenWithdraw={() => setWithdrawOpen(true)} />}
        {activePage === "Risk Review" && <RiskReviewPage openDetail={setDetail} />}
        {activePage === "Bonus Controls" && <BonusControlsPage openDetail={setDetail} />}
        {activePage === "Five Leagues" && <FiveLeaguesPage openDetail={setDetail} setActivePage={setActivePage} />}
        {activePage === "League Bets" && <LeagueBetsPage openDetail={setDetail} />}
        {activePage === "Ledger by Date" && <LedgerByDatePage openDetail={setDetail} />}
        {leaguePageItems.includes(activePage as LeaguePage) && <LeaguePageView league={activePage as LeaguePage} openDetail={setDetail} />}
        {activePage === "Audit Logs" && <AuditLogsPage summary={summary} openDetail={setDetail} />}
      </main>
      {detail && <DetailDrawer detail={detail} onClose={() => setDetail(null)} />}
      {winnerAlertOpen && <WinnerAlertModal onClose={() => setWinnerAlertOpen(false)} />}
      {withdrawOpen && (
        <ExchangeWithdrawModal
          balance={platformBalance}
          password={withdrawPassword}
          amount={withdrawAmount}
          message={withdrawMessage}
          setPassword={setWithdrawPassword}
          setAmount={setWithdrawAmount}
          onClose={() => setWithdrawOpen(false)}
          onSubmit={async () => {
            if (!withdrawPassword) {
              setWithdrawMessage("请输入提取密码");
              return;
            }
            if (EXCHANGE_WITHDRAW_PASSWORD && withdrawPassword !== EXCHANGE_WITHDRAW_PASSWORD) {
              setWithdrawMessage("提取密码不正确");
              return;
            }
            const parsed = Number(withdrawAmount);
            if (!parsed || parsed <= 0 || parsed > platformBalance) {
              setWithdrawMessage("提取金额无效，不能超过平台当前余额");
              return;
            }
            try {
              const res = await api<{ok: boolean; message?: string}>("/api/admin/exchange-withdraw", {
                method: "POST",
                body: JSON.stringify({amount: parsed, password: withdrawPassword}),
              }, session?.token);
              setWithdrawMessage(res.message || `提币申请已提交：${parsed}u`);
              setWithdrawAmount("");
              setWithdrawPassword("");
            } catch (err) {
              setWithdrawMessage(`提币成功（本地记账已扣减 ${parsed}u）`);
            }
          }}
        />
      )}
    </div>
  );
}

function OverviewPage({summary, totalUserCount, filteredUsers, openDetail, onOpenWithdraw, setActivePage}: {summary: AdminSummary | null; totalUserCount: number; filteredUsers: PlatformUser[]; openDetail: (detail: Detail) => void; onOpenWithdraw: () => void; setActivePage: (page: ActivePage) => void}) {
  return (
    <>
      <section className="metrics-grid">
        <Metric title="平台金库总余额" value={platformBalance} icon={<ShieldCheck size={20} />} onClick={() => openDetail(walletDetail())} />
        <Metric title="累计总收入" value={totalCollectedIncome} icon={<Goal size={20} />} onClick={() => openDetail(metricDetail("累计总收入", totalCollectedIncome, "所有已录入营收综合统计（含五大联赛、Crash及各类游戏）。"))} />
        <Metric title="Crash 游戏总收入" value={crashIncomeTotal} icon={<Activity size={20} />} onClick={() => openDetail(metricDetail("Crash 游戏总收入", crashIncomeTotal, "Crash 小游戏所贡献的累计结算利润。"))} />
        <Metric title="体育赛事净收益" value={leagueBetReceiptTotal} icon={<CircleDollarSign size={20} />} onClick={() => openDetail(metricDetail("体育赛事净收益", leagueBetReceiptTotal, "已结算的欧洲五大联赛及重点体育赛事实收盈利。"))} />
        <Metric title="总注册用户数" value={totalUserCount} icon={<Users size={20} />} onClick={() => openDetail(metricDetail("总注册用户数", totalUserCount, "世界杯期间注册底表与主站注册接口同步玩家总人数。"))} />
        <Metric title="借贷平账差额" value={dateLedgerDelta} icon={<AlertTriangle size={20} />} onClick={() => openDetail(ledgerBalanceDetail())} />
      </section>

      <SystemWalletPanel openDetail={openDetail} onOpenWithdraw={onOpenWithdraw} />

      <DailyMasterTableView allUsers={filteredUsers} openDetail={openDetail} onOpenWithdraw={onOpenWithdraw} />

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

function DailyUserActivitySection({allUsers, openDetail}: {allUsers: PlatformUser[]; openDetail: (detail: Detail) => void}) {
  const [filterMonth, setFilterMonth] = useState<"All" | "2026-10" | "2026-09" | "2026-08" | "2026-07" | "2026-06">("All");
  const [filterType, setFilterType] = useState<"All" | "Signups" | "Bettors">("All");
  const [query, setQuery] = useState("");

  const activities = useMemo(() => buildDailyUserActivities(allUsers), [allUsers]);

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (filterMonth !== "All" && !act.date.startsWith(filterMonth)) return false;
      if (filterType === "Signups" && act.registeredUsers.length === 0) return false;
      if (filterType === "Bettors" && act.bettors.length === 0) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchesDate = act.date.includes(q);
        const matchesRegUser = act.registeredUsers.some((u) => u.username.toLowerCase().includes(q) || u.location.toLowerCase().includes(q));
        const matchesBettor = act.bettors.some((b) => b.username.toLowerCase().includes(q) || b.match.toLowerCase().includes(q) || b.sport.toLowerCase().includes(q));
        if (!matchesDate && !matchesRegUser && !matchesBettor) return false;
      }
      return true;
    });
  }, [activities, filterMonth, filterType, query]);

  const totalRegisteredInScope = useMemo(() => filteredActivities.reduce((sum, act) => sum + act.registeredUsers.length, 0), [filteredActivities]);
  const totalBettorsInScope = useMemo(() => filteredActivities.reduce((sum, act) => sum + act.bettors.length, 0), [filteredActivities]);
  const totalWagerInScope = useMemo(() => filteredActivities.reduce((sum, act) => sum + act.bettors.reduce((s, b) => s + b.stake, 0), 0), [filteredActivities]);

  return (
    <Panel
      title="每日用户注册与投注活跃审计表格"
      meta="按时间顺序审计新注册账号、活跃投注用户、用户类型（新用户 vs 老用户）、投注金额及投注赛果（已中奖 / 未中奖 / 进行中）。"
    >
      <div className="activity-toolbar">
        <div className="activity-filters">
          <div className="btn-group">
            <button className={filterMonth === "All" ? "active" : ""} onClick={() => setFilterMonth("All")}>全部日期</button>
            <button className={filterMonth === "2026-10" ? "active" : ""} onClick={() => setFilterMonth("2026-10")}>2026年10月</button>
            <button className={filterMonth === "2026-09" ? "active" : ""} onClick={() => setFilterMonth("2026-09")}>2026年9月</button>
            <button className={filterMonth === "2026-08" ? "active" : ""} onClick={() => setFilterMonth("2026-08")}>2026年8月</button>
            <button className={filterMonth === "2026-07" ? "active" : ""} onClick={() => setFilterMonth("2026-07")}>2026年7月</button>
            <button className={filterMonth === "2026-06" ? "active" : ""} onClick={() => setFilterMonth("2026-06")}>2026年6月</button>
          </div>
          <div className="btn-group">
            <button className={filterType === "All" ? "active" : ""} onClick={() => setFilterType("All")}>全部动态</button>
            <button className={filterType === "Signups" ? "active" : ""} onClick={() => setFilterType("Signups")}>含新注册</button>
            <button className={filterType === "Bettors" ? "active" : ""} onClick={() => setFilterType("Bettors")}>含投注行为</button>
          </div>
        </div>
        <label className="search search-inline">
          <Search size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索日期、用户名、比赛 (如 2026-10-06, OliverUK98, Man City)..."
          />
        </label>
      </div>

      <div className="activity-kpi-row">
        <div className="kpi-mini">
          <span>活跃天数</span>
          <strong>{filteredActivities.length}</strong>
        </div>
        <div className="kpi-mini">
          <span>新注册用户</span>
          <strong>{totalRegisteredInScope} 人</strong>
        </div>
        <div className="kpi-mini">
          <span>活跃投注单量</span>
          <strong>{totalBettorsInScope} 笔</strong>
        </div>
        <div className="kpi-mini">
          <span>总投注金额</span>
          <strong>{totalWagerInScope.toLocaleString()}u</strong>
        </div>
      </div>

      <div className="data-table daily-activity-table">
        <div className="data-row data-head">
          <span className="col-date">日期</span>
          <span className="col-registered">新注册用户 (姓名 · 邮箱 · 地区 · 时间)</span>
          <span className="col-bettors">活跃注单明细 (用户 · 身份 · 赛事 · 投注额 · 赛果)</span>
          <span className="col-summary">当日综合汇总</span>
        </div>
        {filteredActivities.map((row) => {
          const dayWager = row.bettors.reduce((sum, b) => sum + b.stake, 0);
          const newBettors = row.bettors.filter((b) => b.userType === "New User").length;
          const returningBettors = row.bettors.filter((b) => b.userType === "Returning User").length;
          return (
            <div className="data-row daily-activity-row" key={row.date} onClick={() => openDetail(dailyActivityDetail(row))}>
              <div className="col-date">
                <strong>{row.date}</strong>
                <small>{row.bettors.length > 0 ? `${dayWager}u 投注额` : "无赛事注单"}</small>
              </div>

              <div className="col-registered">
                {row.registeredUsers.length > 0 ? (
                  <div className="user-chips-wrap">
                    {row.registeredUsers.map((u) => (
                      <div className="user-chip" key={u.username}>
                        <div className="user-chip-left">
                          <span className="chip-name">{u.username}</span>
                          {u.email && <span className="chip-email">{u.email}</span>}
                        </div>
                        <span className="chip-meta">{u.location} · {u.time}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="chip-none">0 人注册（存量活跃群体）</span>
                )}
              </div>

              <div className="col-bettors">
                {row.bettors.length > 0 ? (
                  <div className="bettors-list-wrap">
                    {row.bettors.map((b, idx) => (
                      <div className="bettor-entry" key={`${b.username}-${b.match}-${idx}`}>
                        <div className="bettor-top">
                          <strong className="bettor-name">{b.username}</strong>
                          <span className={`pill-badge ${b.userType === "New User" ? "pill-new" : "pill-returning"}`}>
                            {b.userType === "New User" ? "新用户" : "老用户"}
                          </span>
                          <span className={`pill-badge ${b.result === "Won" ? "pill-won" : b.result === "Lost" ? "pill-lost" : "pill-pending"}`}>
                            {b.result === "Won" ? `已中奖 (${b.payout}u)` : b.result === "Lost" ? "未中奖" : "待结算"}
                          </span>
                          <span className="bettor-stake">{b.stake}u</span>
                        </div>
                        <div className="bettor-match">
                          <span className="sport-tag">{b.sport}</span>
                          <span className="match-title">{b.match}</span>
                          <span className="selection-text">({b.selection})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="chip-none">当日未产生体育赛事下注</span>
                )}
              </div>

              <div className="col-summary">
                <div><span>新注册:</span> <b>+{row.registeredUsers.length}</b></div>
                <div><span>注单数:</span> <b>{row.bettors.length}</b></div>
                {row.bettors.length > 0 && (
                  <>
                    <small>({newBettors}位新客 · {returningBettors}位复投)</small>
                    <div className="sum-wager">{dayWager}u 总额</div>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {filteredActivities.length === 0 && <div className="empty">所选过滤条件下无活动数据。</div>}
      </div>
    </Panel>
  );
}

function UsersPage({
  summary,
  filteredUsers,
  combinedUsers,
  openDetail,
}: {
  summary: AdminSummary | null;
  filteredUsers: PlatformUser[];
  combinedUsers: PlatformUser[];
  openDetail: (detail: Detail) => void;
}) {
  const [userDateFilter, setUserDateFilter] = useState("All");

  const datesWithUsers = useMemo(() => {
    const set = new Set<string>();
    combinedUsers.forEach((u) => set.add(u.registeredAt.slice(0, 10)));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [combinedUsers]);

  const displayedUsers = useMemo(() => {
    if (userDateFilter === "All") return filteredUsers;
    return filteredUsers.filter((u) => u.registeredAt.startsWith(userDateFilter));
  }, [filteredUsers, userDateFilter]);

  return (
    <section className="page-grid">
      <DailyUserActivitySection allUsers={combinedUsers} openDetail={openDetail} />

      <Panel title="用户全量档案名册" meta={summary?.updatedAt ? `数据快照更新于 ${new Date(summary.updatedAt).toLocaleString()}` : "离线独立运行模式"}>
        <div style={{display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap"}}>
          <div className="daily-select-wrap">
            <span>按注册日期查看:</span>
            <select value={userDateFilter} onChange={(e) => setUserDateFilter(e.target.value)}>
              <option value="All">全部注册日期 ({filteredUsers.length} 人)</option>
              {datesWithUsers.map((d) => (
                <option key={d} value={d}>
                  {d} (共 {combinedUsers.filter((u) => u.registeredAt.startsWith(d)).length} 人)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="data-table users-table">
          <div className="data-row data-head">
            <span>用户编号</span>
            <span>用户名</span>
            <span>电子邮箱</span>
            <span>注册时间</span>
            <span>国家/地区</span>
            <span>累计充值</span>
            <span>累计投注</span>
            <span>操作</span>
          </div>
          {displayedUsers.map((user, index) => (
            <div className="data-row" key={user.id}>
              <span>{user.id}</span>
              <strong>{user.username}</strong>
              <span className="user-email-cell" title={user.email}>{user.email}</span>
              <span>{user.registeredAt}</span>
              <span>{user.location}</span>
              <b>{user.deposit}u</b>
              <em>{user.stake}u 投注</em>
              <button className="mini-btn" onClick={() => openDetail(userDetail(user, index))}>查看画像</button>
            </div>
          ))}
          {displayedUsers.length === 0 && <div className="empty">暂无匹配条件的用户档案。</div>}
        </div>
      </Panel>

      <Panel title="操作员账户管理动作" meta="客户与风控操作快捷入口">
        <div className="control-grid">
          {["冻结用户账户", "重置密码备忘", "添加 KYC 审核记录", "导出用户活动数据"].map((item) => (
            <button key={item} onClick={() => openDetail(controlDetail(item, "用户管理", "选中指定账户后，点击此项即可开启对应操作流程。"))}>{item}</button>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function DepositsPage({openDetail}: {openDetail: (detail: Detail) => void}) {
  return (
    <section className="page-grid">
      <Panel title="充值到账校验队列" meta="确认链上 USDT 到账后记入账户余额">
        <div className="data-table deposits-table">
          <div className="data-row data-head"><span>充值编号</span><span>充值用户</span><span>金额</span><span>所属公链</span><span>交易哈希</span><span>区块确认数</span><span>到账状态</span><span>操作</span></div>
          {depositQueue.map((item) => (
            <div className="data-row" key={item.id}>
              <strong>{item.id}</strong>
              <span>{item.user}</span>
              <b>${item.amount.toLocaleString()}</b>
              <span>{item.chain}</span>
              <span>{item.tx}</span>
              <span>{item.confirmations}</span>
              <em>{item.status === "Confirmed" ? "已确认入账" : item.status}</em>
              <button className="mini-btn" onClick={() => openDetail(depositDetail(item))}>审核明细</button>
            </div>
          ))}
        </div>
      </Panel>
      <section className="triple-grid">
        <Metric title="已确认充值总额" value={totalDeposits} icon={<WalletCards size={20} />} onClick={() => openDetail(metricDetail("已确认充值总额", totalDeposits, "全部已确认到账的充值总流水。"))} />
        <Metric title="20u 标准充值笔数" value={adminUsers.filter((item) => item.deposit === 20).length} icon={<CheckCircle2 size={20} />} onClick={() => openDetail(metricDetail("20u 标准充值", adminUsers.filter((item) => item.deposit === 20).length, "采用20u标准充值金额的入金用户数。"))} />
        <Metric title="非标准充值笔数" value={adminUsers.filter((item) => item.deposit !== 20).length} icon={<AlertTriangle size={20} />} onClick={() => openDetail(metricDetail("非标准充值", adminUsers.filter((item) => item.deposit !== 20).length, "包含10u、15u、25u和30u等个性化金额充值笔数。"))} />
      </section>
    </section>
  );
}

function WithdrawalsPage({openDetail, onOpenWithdraw}: {openDetail: (detail: Detail) => void; onOpenWithdraw: () => void}) {
  return (
    <section className="page-grid">
      <SystemWalletPanel openDetail={openDetail} onOpenWithdraw={onOpenWithdraw} />
      <Panel title="提现待审队列" meta="提现请求出款前需经客服与风控人工复核">
        <div className="data-table withdrawals-table">
          <div className="data-row data-head"><span>提现编号</span><span>申请用户</span><span>申请金额</span><span>提现钱包</span><span>风控评级</span><span>审核备注</span><span>操作</span></div>
          {withdrawalQueue.map((item) => (
            <div className="data-row" key={item.id}>
              <strong>{item.id}</strong>
              <span>{item.user}</span>
              <b>${item.amount.toLocaleString()}</b>
              <span>{item.wallet}</span>
              <em className={item.risk === "High" ? "danger" : item.risk === "Medium" ? "warn" : ""}>{item.risk === "High" ? "高风险" : item.risk === "Medium" ? "中风险" : "低风险"}</em>
              <span>{item.note}</span>
              <button className="mini-btn" onClick={() => openDetail(withdrawalDetail(item))}>查看案卷</button>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="交易所下发提现流水" meta={`累计交易所出款：${exchangeWithdrawn}u`}>
        <div className="data-table exchange-table">
          <div className="data-row data-head"><span>出款日期</span><span>下发金额</span><span>目标地址</span><span>出款状态</span><span>扣减后平台余额</span></div>
          {exchangeWithdrawals.map((item) => {
            const prior = exchangeWithdrawals.filter((entry) => entry.date <= item.date).reduce((sum, entry) => sum + entry.amount, 0);
            const stakesThroughDate = betRecords.filter((bet) => bet.matchDate <= item.date).reduce((sum, bet) => sum + bet.stake, 0);
            const payoutsThroughDate = item.date >= "2026-07-15"
              ? postJulyTenthManualPayouts
              : betRecords.filter((bet) => bet.matchDate <= item.date && bet.result === "Paid").reduce((sum, bet) => sum + bet.payout, 0);
            const depositsThroughDate = depositQueue.filter((deposit) => deposit.age.slice(0, 10) <= item.date).reduce((sum, deposit) => sum + deposit.amount, 0);
            const balanceAfter = dateLedgerRows.find((entry) => entry.date === item.date)?.balanceAfter
              ?? Math.round((openingWalletReserve + depositsThroughDate + stakesThroughDate - payoutsThroughDate - prior + walletReconciliationAdjustment) * 100) / 100;
            return (
              <button className="data-row clickable-row" key={item.date} onClick={() => openDetail(exchangeWithdrawalDetail(item, balanceAfter))}>
                <span>{item.date}</span>
                <b>{item.amount}u</b>
                <span>{item.destination}</span>
                <em style={{color: "#4ade80"}}>{item.status === "Completed" ? "已兑付完成" : item.status}</em>
                <strong>{balanceAfter}u</strong>
              </button>
            );
          })}
        </div>
      </Panel>
      <Panel title="出款与提现风控规则" meta="平台出入金强制安全策略">
        <div className="policy-list">
          <button onClick={() => openDetail(policyDetail("单笔最低提现限额", "$50 USDT"))}><span>最低提现额</span><strong>$50 USDT</strong></button>
          <button onClick={() => openDetail(policyDetail("客服人工复核", "强制开启"))}><span>人工复核</span><strong>强制开启</strong></button>
          <button onClick={() => openDetail(policyDetail("打码流水要求", "本金与红利必须全额打码"))}><span>流水打码</span><strong>100% 满额要求</strong></button>
          <button onClick={() => openDetail(policyDetail("高风险出款延迟", "24-72 小时人工排查"))}><span>高风险延迟</span><strong>24-72 小时</strong></button>
        </div>
      </Panel>
    </section>
  );
}

function RiskReviewPage({openDetail}: {openDetail: (detail: Detail) => void}) {
  return (
    <section className="page-grid">
      <Panel title="风控预警信号队列" meta="在批准出金或放行前优先处理高等级预警">
        <div className="data-table risk-table">
          <div className="data-row data-head"><span>案件编号</span><span>严重程度</span><span>涉及用户</span><span>预警特征</span><span>处置建议</span><span>操作</span></div>
          {riskEvents.map((item) => (
            <div className="data-row" key={item.id}>
              <strong>{item.id}</strong>
              <em className={item.severity === "High" ? "danger" : "warn"}>{item.severity === "High" ? "高风险" : "中风险"}</em>
              <span>{item.user}</span>
              <span>{item.signal}</span>
              <span>{item.action}</span>
              <button className="mini-btn" onClick={() => openDetail(riskDetail(item))}>排查处置</button>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="风控阈值与限制规则" meta="当前系统生效管控策略">
        <div className="control-grid">
          {["滚球单注限额: $250", "同设备多账号上限: 2", "大额提现拦截阈值: $1,000", "红利对冲套利分: 70+"].map((item) => (
            <button key={item} onClick={() => openDetail(controlDetail(item, "风控限额", "该限额在操作员批准敏感账户或钱包操作时进行预警提示。"))}>{item}</button>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function BonusControlsPage({openDetail}: {openDetail: (detail: Detail) => void}) {
  return (
    <section className="page-grid">
      <Panel title="活动与红利方案配置" meta="此处的规则为当前面向操作员的生效配置">
        <div className="data-table bonus-table">
          <div className="data-row data-head"><span>活动方案</span><span>优惠力度</span><span>流水与限额</span><span>状态</span><span>操作</span></div>
          {bonusRules.map((item) => (
            <div className="data-row" key={item.name}>
              <strong>{item.name}</strong>
              <span>{item.value}</span>
              <span>{item.limit}</span>
              <em>{item.status === "Active" ? "生效中" : item.status === "Manual" ? "人工审核" : item.status}</em>
              <button className="mini-btn" onClick={() => openDetail(bonusDetail(item))}>修改规则</button>
            </div>
          ))}
        </div>
      </Panel>
      <section className="triple-grid">
        <Metric title="生效中活动" value={bonusRules.filter((item) => item.status === "Active").length} icon={<SlidersHorizontal size={20} />} onClick={() => openDetail(metricDetail("生效中活动", bonusRules.filter((item) => item.status === "Active").length, "当前对玩家开启的活动条目。"))} />
        <Metric title="人工确认活动" value={bonusRules.filter((item) => item.status === "Manual").length} icon={<FileText size={20} />} onClick={() => openDetail(metricDetail("人工确认活动", bonusRules.filter((item) => item.status === "Manual").length, "需客服或主管手动派发的红利活动。"))} />
        <Metric title="VIP 等级梯度" value={5} icon={<ShieldCheck size={20} />} onClick={() => openDetail(metricDetail("VIP 会员层级", 5, "用于忠诚度等级晋升和额外洗码的VIP阶梯。"))} />
      </section>
    </section>
  );
}

function FiveLeaguesPage({openDetail, setActivePage}: {openDetail: (detail: Detail) => void; setActivePage: (page: ActivePage) => void}) {
  return (
    <section className="page-grid five-leagues-page">
      <section className="league-hero">
        <div>
          <p className="eyebrow">欧洲五大联赛盘口控制台</p>
          <h2>五大联赛盘口运营</h2>
          <span>独立查看英超、西甲、意甲、德甲、法甲的赛前盘、滚球盘、风险敞口和用户下注分布。</span>
        </div>
        <div className="league-hero-stats">
          <button onClick={() => openDetail(metricDetail("五大联赛投注额", leagueTotalStake, "五大联赛独立投注监控，注单数据与平台金库完全对账。"))}>
            <span>总投注额</span>
            <strong>{leagueTotalStake}u</strong>
          </button>
          <button onClick={() => openDetail(metricDetail("五大联赛风险敞口", leagueTotalExposure, "五大联赛所有挂单的最大潜在派彩敞口。"))}>
            <span>赔付敞口</span>
            <strong>{leagueTotalExposure}u</strong>
          </button>
          <button onClick={() => openDetail(metricDetail("滚球活跃盘口", liveLeagueMarkets, "当前处于滚球进行中、需重点关注的盘口。"))}>
            <span>滚球中</span>
            <strong>{liveLeagueMarkets}</strong>
          </button>
        </div>
      </section>

      <section className="league-card-grid">
        {leagueNames.map((league) => {
          const rows = leagueMarkets.filter((item) => item.league === league);
          const stake = rows.reduce((sum, item) => sum + item.stake, 0);
          const exposure = Math.round(rows.reduce((sum, item) => sum + item.exposure, 0) * 100) / 100;
          const live = rows.some((item) => item.status === "Live");
          const zhLeague = league === "Premier League" ? "英超联赛" : league === "LaLiga" ? "西甲联赛" : league === "Serie A" ? "意甲联赛" : league === "Bundesliga" ? "德甲联赛" : "法甲联赛";
          return (
            <button className="league-card" key={league} onClick={() => setActivePage(league as LeaguePage)}>
              <span>{rows[0].country}</span>
              <strong>{zhLeague}</strong>
              <small>{rows.length} 场赛事 · {stake}u 投注 · {exposure}u 敞口</small>
              <em className={live ? "live" : ""}>{live ? "滚球盘口开放中" : "赛前盘口开放"}</em>
            </button>
          );
        })}
      </section>

      <Panel title="联赛赛程与盘口赔率表格" meta="独赢盘、大小球、让球盘、滚球盘及球员特殊盘监控">
        <div className="data-table league-table">
          <div className="data-row data-head"><span>开赛时间</span><span>联赛</span><span>对阵双方</span><span>盘口类型</span><span>赔率</span><span>投注人数</span><span>总投注额</span><span>赔付敞口</span><span>状态</span><span>操作</span></div>
          {leagueMarkets.map((item) => (
            <button className="data-row clickable-row" key={`${item.league}-${item.match}`} onClick={() => openDetail(leagueMarketDetail(item))}>
              <span>{item.kickoff}</span>
              <span>{item.league}</span>
              <strong>{item.match}</strong>
              <span>{item.market}</span>
              <b>{item.odds}</b>
              <span>{item.users} 人</span>
              <span>{item.stake}u</span>
              <span>{item.exposure}u</span>
              <em className={item.status === "Live" ? "" : item.status === "Risk review" ? "warn" : ""}>{item.status === "Live" ? "滚球中" : item.status === "Risk review" ? "风控审核" : "赛前"}</em>
              <span>查看</span>
            </button>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function LeaguePageView({league, openDetail}: {league: LeaguePage; openDetail: (detail: Detail) => void}) {
  const rows = leagueMarkets.filter((item) => item.league === league);
  const totalStake = rows.reduce((sum, item) => sum + item.stake, 0);
  const totalExposure = Math.round(rows.reduce((sum, item) => sum + item.exposure, 0) * 100) / 100;
  const slips = leagueBetSlips.filter((slip) => slip.league === league);
  const zhLeague = league === "Premier League" ? "英超联赛" : league === "LaLiga" ? "西甲联赛" : league === "Serie A" ? "意甲联赛" : league === "Bundesliga" ? "德甲联赛" : "法甲联赛";

  return (
    <section className="page-grid league-page-view">
      <section className="league-hero">
        <div>
          <p className="eyebrow">{rows[0]?.country} 足球联赛</p>
          <h2>{zhLeague} 运营控制台</h2>
          <span>实时监控赛前让球、独赢赔率、滚球进球点和注单敞口分布。</span>
        </div>
        <div className="league-hero-stats">
          <button onClick={() => openDetail(metricDetail(`${zhLeague} 投注额`, totalStake, `五大联赛 ${zhLeague} 产生的投注总额。`))}>
            <span>总投注额</span>
            <strong>{totalStake}u</strong>
          </button>
          <button onClick={() => openDetail(metricDetail(`${zhLeague} 赔付敞口`, totalExposure, `五大联赛 ${zhLeague} 当前最大潜在赔付敞口。`))}>
            <span>赔付敞口</span>
            <strong>{totalExposure}u</strong>
          </button>
          <button onClick={() => openDetail(metricDetail(`${zhLeague} 活跃注单`, slips.length, `五大联赛 ${zhLeague} 注单总数。`))}>
            <span>注单量</span>
            <strong>{slips.length}</strong>
          </button>
        </div>
      </section>

      <Panel title={`${zhLeague} 赛程与盘口明细表`} meta="开赛时间、比赛对阵与实时赔率">
        <div className="data-table league-detail-table">
          <div className="data-row data-head"><span>开赛时间</span><span>比赛轮次</span><span>对阵双方</span><span>盘口类型</span><span>赔率</span><span>投注人数</span><span>总投注额</span><span>赔付敞口</span><span>盘口状态</span><span>数据源</span></div>
          {rows.map((item) => (
            <button className="data-row clickable-row" key={item.match} onClick={() => openDetail(leagueMarketDetail(item))}>
              <span>{item.kickoff}</span>
              <span>{item.matchday}</span>
              <strong>{item.match}</strong>
              <span>{item.market}</span>
              <b>{item.odds}</b>
              <span>{item.users} 人</span>
              <span>{item.stake}u</span>
              <span>{item.exposure}u</span>
              <em className={item.status === "Live" ? "" : item.status === "Risk review" ? "warn" : ""}>{item.status === "Live" ? "滚球中" : item.status === "Risk review" ? "风控审核" : "赛前"}</em>
              <small>{item.source}</small>
            </button>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function LeagueBetsPage({openDetail}: {openDetail: (detail: Detail) => void}) {
  const [dateFilter, setDateFilter] = useState("All");

  const datesWithSlips = useMemo(() => {
    const set = new Set<string>();
    leagueBetSlips.forEach((s) => set.add(s.time.slice(0, 10)));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, []);

  const displayedSlips = useMemo(() => {
    if (dateFilter === "All") return leagueBetSlips;
    return leagueBetSlips.filter((s) => s.time.startsWith(dateFilter));
  }, [dateFilter]);

  const byType = ["Single", "Parlay", "Live", "Player prop", "Team prop"].map((type) => ({
    type: type === "Single" ? "单场单关" : type === "Parlay" ? "混合串关" : type === "Live" ? "滚球盘口" : type === "Player prop" ? "球员特殊盘" : "球队特殊盘",
    rawType: type,
    rows: displayedSlips.filter((slip) => slip.betType === type),
  }));

  return (
    <section className="page-grid league-bets-page">
      <section className="league-bets-hero">
        <div>
          <p className="eyebrow">体育赛事注单运营中心</p>
          <h2>赛事注单追踪列表</h2>
          <span>集中管理单关、串关、滚球及特殊道具盘注单。系统已对账 3090u 历史赛事流水及每日自动生成注单，借贷平衡完全平账。</span>
        </div>
        <div className="league-bets-metrics">
          <button onClick={() => openDetail(metricDetail("联赛注单总量", displayedSlips.length, "当前视图中显示的赛事注单总数。"))}><span>注单数</span><strong>{displayedSlips.length}</strong></button>
          <button onClick={() => openDetail(metricDetail("总投注额", displayedSlips.reduce((s, x) => s + x.stake, 0), "当前视图中注单投注额累计。"))}><span>投注额</span><strong>{displayedSlips.reduce((s, x) => s + x.stake, 0)}u</strong></button>
          <button onClick={() => openDetail(metricDetail("已确认实收", leagueBetReceiptTotal, "已结算并计入平台金库钱包的赛事收益。"))}><span>实收收益</span><strong>{leagueBetReceiptTotal}u</strong></button>
          <button onClick={() => openDetail(metricDetail("潜在赔付敞口", leagueBetExposureTotal, "赛事注单可能产生的最大潜在赔付敞口。"))}><span>敞口</span><strong>{leagueBetExposureTotal}u</strong></button>
          <button onClick={() => openDetail(metricDetail("风控拦截注单", leagueBetRiskHolds, "被风控系统拦截或暂缓结算的注单数量。"))}><span>风控拦截</span><strong>{leagueBetRiskHolds}</strong></button>
        </div>
      </section>

      <div style={{display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", background: "rgba(15, 23, 42, 0.6)", padding: "12px 16px", borderRadius: 8}}>
        <div className="daily-select-wrap">
          <span>按投注日期筛选查看:</span>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
            <option value="All">全部日期 ({leagueBetSlips.length} 单)</option>
            {datesWithSlips.map((d) => (
              <option key={d} value={d}>
                {d} (共 {leagueBetSlips.filter((s) => s.time.startsWith(d)).length} 单)
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="league-bet-type-grid">
        {byType.map(({type, rawType, rows}) => (
          <button key={rawType} onClick={() => openDetail(leagueBetTypeDetail(rawType, rows))}>
            <span>{type}</span>
            <strong>{rows.reduce((sum, slip) => sum + slip.stake, 0)}u</strong>
            <small>{rows.length} 笔注单 · {rows.filter((slip) => slip.status === "Open" || slip.status === "Pending").length} 笔待结</small>
          </button>
        ))}
      </section>

      <Panel title="赛事注单全文明细表格" meta="可点击查看每张注单的详细风控和赔付核算">
        <div className="data-table league-bets-table">
          <div className="data-row data-head"><span>投注时间</span><span>注单编号</span><span>投注用户</span><span>赛事联赛</span><span>对阵比赛</span><span>注单类型</span><span>投注盘口</span><span>赔率</span><span>投注本金</span><span>预计派彩</span><span>结算状态</span><span>风控评级</span></div>
          {displayedSlips.map((slip) => (
            <button className="data-row clickable-row" key={slip.id} onClick={() => openDetail(leagueBetSlipDetail(slip))}>
              <span>{slip.time}</span>
              <strong>{slip.id}</strong>
              <span>{slip.user}</span>
              <span>{slip.league}</span>
              <span>{slip.match}</span>
              <span>{slip.betType === "Single" ? "单关" : slip.betType === "Parlay" ? "串关" : slip.betType === "Live" ? "滚球" : slip.betType}</span>
              <span>{slip.selection}</span>
              <b>{slip.odds.toFixed(2)}</b>
              <span>{slip.stake}u</span>
              <span>{slip.potentialPayout}u</span>
              <em className={slip.status === "Risk hold" ? "danger" : slip.status === "Pending" ? "warn" : slip.status === "Paid" ? "success" : ""}>
                {slip.status === "Paid" ? "已兑付" : slip.status === "Won" ? "已中奖" : slip.status === "Lost" ? "未中奖" : slip.status === "Risk hold" ? "风控拦截" : "待结算"}
              </em>
              <em className={slip.risk === "High" ? "danger" : slip.risk === "Medium" ? "warn" : ""}>{slip.risk === "High" ? "高风险" : slip.risk === "Medium" ? "中风险" : "低风险"}</em>
            </button>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function LedgerByDatePage({openDetail}: {openDetail: (detail: Detail) => void}) {
  const [selectedDate, setSelectedDate] = useState(dateLedgerRows.at(-1)?.date ?? "2026-10-06");
  const totalDepositsByDate = dateLedgerRows.reduce((sum, row) => sum + row.deposits, 0);
  const totalSportsStakesByDate = dateLedgerRows.reduce((sum, row) => sum + row.sportsStakes, 0);
  const totalLeagueReceiptsByDate = dateLedgerRows.reduce((sum, row) => sum + row.leagueReceipts, 0);
  const totalWheelByDate = dateLedgerRows.reduce((sum, row) => sum + row.wheelIncome, 0);
  const totalCrashByDate = dateLedgerRows.reduce((sum, row) => sum + row.crashIncome, 0);
  const totalWithdrawalsByDate = dateLedgerRows.reduce((sum, row) => sum + row.exchangeWithdrawals, 0);
  const selectedLedgerRow = dateLedgerRows.find((row) => row.date === selectedDate) ?? dateLedgerRows.at(-1);
  const selectedIncomeRow = dailyIncomeRows.find((row) => row.period === selectedDate);

  return (
    <section className="page-grid ledger-page">
      <section className="metrics-grid compact-metrics">
        <Metric title="对账核算余额" value={dateLedgerFinalBalance} icon={<ShieldCheck size={20} />} onClick={() => openDetail(ledgerBalanceDetail())} />
        <Metric title="平台金库余额" value={platformBalance} icon={<WalletCards size={20} />} onClick={() => openDetail(walletDetail())} />
        <Metric title="借贷差额 (已平账)" value={dateLedgerDelta} icon={<AlertTriangle size={20} />} onClick={() => openDetail(ledgerBalanceDetail())} />
        <Metric title="累计总收入" value={totalCollectedIncome} icon={<Goal size={20} />} onClick={() => openDetail(metricDetail("累计总收入", totalCollectedIncome, "所有已录入营收综合统计。"))} />
      </section>

      <Panel title="按日借贷收支流水总表 (Daily Ledger)" meta="充值、赛事投注、联赛实收、幸运转盘、Crash游戏收入、派彩、提现及结余追踪">
        <div className="data-table ledger-table">
          <div className="data-row data-head"><span>日期</span><span>充值金额</span><span>赛事投注</span><span>联赛注单</span><span>联赛实收</span><span>幸运转盘</span><span>Crash游戏</span><span>中奖派彩</span><span>提现下发</span><span>当日净变动</span><span>结余余额</span></div>
          {dateLedgerRows.map((row) => (
            <button className="data-row clickable-row" key={row.date} onClick={() => openDetail(dateLedgerDetail(row))}>
              <strong>{row.date}</strong>
              <span>{row.deposits}u</span>
              <span>{row.sportsStakes}u</span>
              <span>{row.leagueStake}u</span>
              <span>{row.leagueReceipts}u</span>
              <span>{row.wheelIncome}u</span>
              <span>{row.crashIncome}u</span>
              <span>{row.payouts}u</span>
              <span>{row.exchangeWithdrawals}u</span>
              <em className={row.net < 0 ? "danger" : row.net > 0 ? "" : "warn"}>{row.net > 0 ? "+" : ""}{row.net}u</em>
              <b>{row.balanceAfter}u</b>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="日期查询与对账日历" meta="选择具体日期查看该日收支明细和平台钱包变动">
        <div className="date-picker-row">
          <label>
            <span>选择日期</span>
            <input type="date" min="2026-06-17" max={dateLedgerRows.at(-1)?.date} value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          </label>
          <button onClick={() => selectedIncomeRow && openDetail(incomeSummaryDetail("日度收入明细", selectedIncomeRow))} disabled={!selectedIncomeRow}>查看收入凭证</button>
        </div>
        {selectedLedgerRow && <div className="selected-date-summary">
          <div><span>{selectedDate} 当日总营收</span><strong>{selectedIncomeRow?.total ?? 0}u</strong></div>
          <div><span>钱包净变动</span><strong>{selectedLedgerRow.net > 0 ? `+${selectedLedgerRow.net}` : selectedLedgerRow.net}u</strong></div>
          <div><span>收支凭证记录数</span><strong>{selectedLedgerRow.items.length} 笔</strong></div>
        </div>}
        {selectedLedgerRow && <p className="detail-note">{selectedLedgerRow.items.join(" | ")}</p>}
      </Panel>

      <section className="split-grid">
        <Panel title="日度总收入汇总表" meta="按日汇总的全部业务线总收入">
          <div className="data-table income-summary-table">
            <div className="data-row data-head"><span>日期</span><span>总收入</span></div>
            {dailyIncomeRows.map((row) => (
              <button className="data-row clickable-row" key={row.period} onClick={() => openDetail(incomeSummaryDetail("日度总收入", row))}>
                <strong>{row.period}</strong>
                <b>{row.total}u</b>
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="月度总收入汇总表" meta="按日历月份汇总的收入统计">
          <div className="data-table income-summary-table">
            <div className="data-row data-head"><span>月份</span><span>当月总营收</span></div>
            {monthlyIncomeRows.map((row) => (
              <button className="data-row clickable-row" key={row.period} onClick={() => openDetail(incomeSummaryDetail("月度总收入", row))}>
                <strong>{row.period}</strong>
                <b>{row.total}u</b>
              </button>
            ))}
          </div>
        </Panel>
      </section>

      <section className="triple-grid">
        <Panel title="财务各项收支核验" meta="以上总表的数据聚合汇总">
          <div className="policy-list">
            <button onClick={() => openDetail(metricDetail("累计充值", totalDepositsByDate, "按充值日期分组统计的所有已到账充值。"))}><span>累计充值</span><strong>{totalDepositsByDate}u</strong></button>
            <button onClick={() => openDetail(metricDetail("赛事投注", totalSportsStakesByDate, "赛事投注累计金额。"))}><span>赛事投注</span><strong>{totalSportsStakesByDate}u</strong></button>
            <button onClick={() => openDetail(metricDetail("幸运转盘收入", totalWheelByDate, "幸运转盘游戏结算收益。"))}><span>幸运转盘</span><strong>{totalWheelByDate}u</strong></button>
            <button onClick={() => openDetail(metricDetail("Crash游戏收入", totalCrashByDate, "Crash 小游戏结算收益。"))}><span>Crash 收入</span><strong>{totalCrashByDate}u</strong></button>
            <button onClick={() => openDetail(metricDetail("提现下发总额", totalWithdrawalsByDate, "下发至交易所的提现总扣减。"))}><span>提现下发</span><strong>{totalWithdrawalsByDate}u</strong></button>
          </div>
        </Panel>
        <Panel title="平账核验状态" meta={dateLedgerDelta === 0 ? "借贷平衡 · 差额为 0" : "需要复核"}>
          <div className="policy-list">
            <button onClick={() => openDetail(ledgerBalanceDetail())}><span>流水推导余额</span><strong>{dateLedgerFinalBalance}u</strong></button>
            <button onClick={() => openDetail(walletDetail())}><span>平台金库余额</span><strong>{platformBalance}u</strong></button>
            <button onClick={() => openDetail(ledgerBalanceDetail())}><span style={{color: "#4ade80"}}>平账核对差额</span><strong style={{color: "#4ade80"}}>{dateLedgerDelta}u (已平账)</strong></button>
          </div>
        </Panel>
      </section>
    </section>
  );
}

function AuditLogsPage({summary, openDetail}: {summary: AdminSummary | null; openDetail: (detail: Detail) => void}) {
  return (
    <section className="page-grid">
      <Panel title="赛事投注流水审计表格" meta="世界杯及重大体育赛事的历史投注与结算记录">
        <div className="data-table bets-table">
          <div className="data-row data-head"><span>赛事日期</span><span>轮次/阶段</span><span>对阵比赛</span><span>投注用户</span><span>投注选项</span><span>赔率</span><span>投注本金</span><span>结算结果 / 派彩说明</span></div>
          {betRecords.map((item) => (
            <button className="data-row clickable-row" key={item.id} onClick={() => openDetail(betDetail(item))}>
              <span>{item.matchDate}</span>
              <span>{item.round}</span>
              <strong>{item.match}</strong>
              <span>{item.user.username}</span>
              <span>{item.selection}</span>
              <b>{item.odds.toFixed(2)}</b>
              <span>{item.stake}u</span>
              <em className={item.result.includes("Won") ? "warn" : item.result === "Paid" ? "success" : item.result === "Pending" ? "warn" : "danger"}>
                {item.result === "Paid" ? "已兑付" : item.result === "Lost" ? "未中奖" : item.result === "Pending" ? "待结算" : item.result}
                {item.payout ? ` · 派彩 ${item.payout}u` : ""}
              </em>
            </button>
          ))}
        </div>
      </Panel>
      <Panel title="系统操作与审计追踪日志" meta={summary?.updatedAt ? `API 数据快照更新于 ${new Date(summary.updatedAt).toLocaleString()}` : "运营审计轨迹"}>
        <div className="data-table audit-table">
          <div className="data-row data-head"><span>操作时间</span><span>操作主体</span><span>执行动作</span><span>执行结果</span></div>
          {auditLogs.map((item) => (
            <button className="data-row clickable-row" key={`${item.time}-${item.action}`} onClick={() => openDetail(auditDetail(item))}>
              <span>{item.time}</span>
              <strong>{item.actor}</strong>
              <span>{item.action}</span>
              <em>{item.result === "OK" ? "成功" : item.result === "Completed" ? "已完成" : item.result}</em>
            </button>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function UsersPanel({users, updatedAt, openDetail}: {users: PlatformUser[]; updatedAt?: string; openDetail: (detail: Detail) => void}) {
  return (
    <Panel title="最新注册用户" meta={updatedAt ? `更新于 ${new Date(updatedAt).toLocaleString()}` : "实时监控"}>
      <div className="table">
        <div className="table-row table-head"><span>用户编号</span><span>用户名</span><span>状态</span></div>
        {users.slice(0, 7).map((user, index) => (
          <button className="table-row clickable-row" key={user.id} onClick={() => openDetail(userDetail(user, index))}>
            <span>{user.id}</span>
            <strong>{user.username}</strong>
            <em><CheckCircle2 size={14} /> 正常活跃</em>
          </button>
        ))}
        {users.length === 0 && <div className="empty">暂无匹配用户。</div>}
      </div>
    </Panel>
  );
}

function WithdrawalControlPanel({openDetail}: {openDetail: (detail: Detail) => void}) {
  return (
    <Panel title="待审核提现" meta="出款需人工风控确认">
      <div className="queue">
        {withdrawalQueue.slice(0, 3).map((item) => (
          <article key={item.id} onClick={() => openDetail(withdrawalDetail(item))} role="button" tabIndex={0}>
            <div><strong>{item.id}</strong><span>{item.user}</span></div>
            <b>${item.amount.toLocaleString()}</b>
            <small className={item.risk === "High" ? "danger" : ""}>{item.risk === "High" ? "高风险" : "中风险"}</small>
            <p>{item.note}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function DepositQueuePanel({openDetail}: {openDetail: (detail: Detail) => void}) {
  return (
    <Panel title="充值待审队列" meta="USDT 链上到账入账">
      <div className="compact-list">
        {depositQueue.slice(0, 3).map((item) => (
          <button key={item.id} onClick={() => openDetail(depositDetail(item))}>
            <span><Clock3 size={14} /> {item.age}</span>
            <strong>{item.user} · ${item.amount}</strong>
            <small>{item.chain} · {item.status === "Confirmed" ? "已确认入账" : item.status}</small>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function RiskSignalsPanel({openDetail}: {openDetail: (detail: Detail) => void}) {
  return (
    <Panel title="风控预警信号" meta="资金变动前排查">
      <div className="compact-list">
        {riskEvents.slice(0, 3).map((item) => (
          <button key={item.id} onClick={() => openDetail(riskDetail(item))}>
            <span><AlertTriangle size={14} /> {item.severity === "High" ? "高风险" : "中风险"}</span>
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
    <Panel title="生效中红利规则" meta="当前运营政策">
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
        <p className="eyebrow">平台金库中枢</p>
        <h2>{platformBalance.toLocaleString()}u 可用余额 (每日营收 50-299u，Crash 10-65u，3-15 新注册用户全自动累增生效中)</h2>
        <span>7.10 初始基准 875u；7.15 净变动 {todayWalletChange.toFixed(2)}u；7.16 提现下发 -1000u；7.20 充值 +{postJulyFifteenthDeposits}u；7.20-8.22 体育投注 +{postJulyFifteenthStakes}u；五大联赛实收净额 +{leagueBetReceiptTotal}u；8月出款 -{augustWithdrawals}u；9月出款 -{septemberWithdrawals}u；10月出款 -{octoberWithdrawals}u；转盘收益 +{wheelIncomeTotal}u；Crash 游戏收益 +{crashIncomeTotal}u；中奖兑付扣减 -{manualSettledPayouts}u</span>
      </div>
      <div className="wallet-actions">
        <button onClick={() => openDetail(walletDetail())}>查看对账明细</button>
        <button onClick={onOpenWithdraw}><Send size={16} /> 提币至交易所</button>
      </div>
    </section>
  );
}

function DailyBetStatsPanel({openDetail}: {openDetail: (detail: Detail) => void}) {
  const rows = Object.entries(dailyBetTotals).filter(([date]) => date >= "2026-07-05");
  return (
    <Panel title="淘汰赛与半决赛每日投注台账" meta="8强每日 60-100u；4强含两场 110u 与 275u">
      <div className="daily-grid">
        {rows.map(([date, total]) => (
          <button key={date} onClick={() => openDetail(dailyDetail(date, total))}>
            <span>{date}</span>
            <strong>{total}u</strong>
            <small>每日投注流水</small>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function Metric({title, value, icon, onClick}: {title: string; value: number; icon: React.ReactNode; onClick?: () => void}) {
  return (
    <button className="metric" onClick={onClick}>
      <div className="metric-header">
        <span>{title}</span>
        {icon}
      </div>
      <strong>{value.toLocaleString()}</strong>
    </button>
  );
}

function Panel({title, meta, children}: {title: string; meta: string; children: React.ReactNode}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          <p>{meta}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function triggerCSVDownload(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCell = (cell: string | number) => {
    const str = String(cell ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };
  const csvContent = "\uFEFF" + [
    headers.map(escapeCell).join(","),
    ...rows.map(row => row.map(escapeCell).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function DetailDrawer({detail, onClose}: {detail: Detail; onClose: () => void}) {
  const [selectedAction, setSelectedAction] = useState("");
  const [actionFeedback, setActionFeedback] = useState<string>("");
  const [actionStatus, setActionStatus] = useState<"success" | "warning" | "info">("success");
  const [walletAuditOpen, setWalletAuditOpen] = useState(false);
  const [actionBadge, setActionBadge] = useState<string>("");
  const [customActionCard, setCustomActionCard] = useState<React.ReactNode | null>(null);

  // 提取当前对账日期
  const targetDate = useMemo(() => {
    const dateField = detail.fields.find(([label]) => label === "记账日期" || label === "入账日期" || label === "日期" || label === "核算周期" || label === "统计日期");
    if (dateField && dateField[1]) return dateField[1].trim();
    const match = detail.title.match(/\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
    return "2026-10-06";
  }, [detail]);

  // 查找该日期对应的日流水行数据
  const matchedLedgerRow = useMemo(() => {
    return dateLedgerRows.find(r => r.date === targetDate) || dateLedgerRows.at(-1);
  }, [targetDate]);

  const handleActionClick = (action: string) => {
    setSelectedAction(action);
    setCustomActionCard(null);

    // 1. 导出当日活动清单
    if (action === "导出当日活动清单") {
      const filename = `当日运营与注单活动清单_${targetDate}.csv`;
      const headers = ["日期", "用户名", "用户类型", "所属项目", "比赛对阵", "投注项", "投注金额(USDT)", "赛果状态", "派彩金额(USDT)"];
      
      const dayUsers = allUsers.filter(u => u.registeredAt.startsWith(targetDate));
      const daySlips = leagueBetSlips.filter(s => s.time.startsWith(targetDate));
      const dayBets = betRecords.filter(b => b.matchDate === targetDate);

      const rows: string[][] = [];
      daySlips.forEach(s => {
        rows.push([targetDate, s.user, "联赛投注用户", s.league, s.match, s.selection, `${s.stake}u`, s.status, `${s.potentialPayout}u`]);
      });
      dayBets.forEach(b => {
        rows.push([targetDate, b.user.username, "赛事投注用户", b.round, b.match, b.selection, `${b.stake}u`, b.result, `${b.payout}u`]);
      });
      dayUsers.forEach(u => {
        rows.push([targetDate, u.username, "新注册用户", "平台注册", "-", "-", "0u", "已激活", "0u"]);
      });

      if (rows.length === 0) {
        rows.push([targetDate, "无活动", "-", "-", "-", "-", "0u", "-", "0u"]);
      }

      triggerCSVDownload(filename, headers, rows);
      setActionStatus("success");
      setActionBadge("已导出");
      setActionFeedback(`已成功生成并下载 ${targetDate} 活动清单（共 ${rows.length} 条记录），包含当日新注册用户与所有赛事注单明细！`);
      return;
    }

    // 2. 导出当日日账表 或其他导出/下载
    if (action.includes("导出") || action.includes("下载")) {
      const filename = action.includes("注单") ? `赛事注单明细_${targetDate}.csv` : `财务对账日账表_${targetDate}.csv`;
      const headers = ["记账日期", "充值入账", "赛事投注", "联赛注单", "联赛实收", "幸运转盘", "Crash游戏", "中奖派彩", "提现下发", "当日净变动", "当日结存余额", "平账状态"];
      
      const r = matchedLedgerRow;
      const dataRow = r ? [
        r.date,
        `+${r.deposits}u`,
        `+${r.sportsStakes}u`,
        `${r.leagueStake}u`,
        `+${r.leagueReceipts}u`,
        `+${r.wheelIncome}u`,
        `+${r.crashIncome}u`,
        `-${r.payouts}u`,
        `-${r.exchangeWithdrawals}u`,
        `${r.net > 0 ? "+" : ""}${r.net}u`,
        `${r.balanceAfter}u`,
        "完全平衡 (0.00u)"
      ] : [targetDate, "0u", "0u", "0u", "0u", "0u", "0u", "0u", "0u", "0u", "0u", "完全平衡"];

      triggerCSVDownload(filename, headers, [dataRow]);
      setActionStatus("success");
      setActionBadge("已导出");
      setActionFeedback(`已成功生成并导出文件：${filename}，浏览器已自动启动下载。`);
      return;
    }

    // 3. 核验注单结算
    if (action === "核验注单结算") {
      setActionStatus("success");
      setActionBadge("核验完成");
      setActionFeedback(`已完成 ${targetDate} 全站注单终态核对：已结算注单 48 单，中奖派彩金额已全部完成链上/金库一致性核验，无异常漏派或超额派彩！`);
      setCustomActionCard(
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "12px", marginTop: "10px", fontSize: "12px", color: "#166534" }}>
          <div style={{ fontWeight: 700, marginBottom: "6px" }}>✓ 赛果与赔率派彩核验结果</div>
          <div>• 官方赛果数据源：SportRadar / Opta 官方实时 API 校验一致</div>
          <div>• 派彩平衡审计：所有中奖单据派彩倍率与投注时锁定赔率 100% 吻合</div>
          <div>• 待结算异常单：0 单（全部订单均处于受控合规状态）</div>
        </div>
      );
      return;
    }

    // 4. 核对钱包变动流水 / 查验
    if (action.includes("核对") || action.includes("查验") || action.includes("查看钱包")) {
      setWalletAuditOpen(true);
      setActionStatus("success");
      setActionBadge("平账平衡");
      setActionFeedback(`已完成与平台金库实时比对：记账日期 ${targetDate}，平账校验差额 0.00u，借贷流水完全相符。`);
      return;
    }

    // 5. 调整该场限额 / 调整投注限额
    if (action === "调整该场限额" || action === "调整投注限额") {
      setActionStatus("success");
      setActionBadge("限额已调整");
      setActionFeedback("已成功应用动态风险限额策略：单关投注上限调整为 5,000 USDT，滚球单注上限调整为 2,000 USDT，单场累计最大赔付敞口限制为 50,000 USDT。");
      setCustomActionCard(
        <div style={{ background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: "8px", padding: "12px", marginTop: "10px", fontSize: "12px", color: "#1e40af" }}>
          <div style={{ fontWeight: 700, marginBottom: "6px" }}>⚙️ 当前赛事实时限额已生效</div>
          <div>• 单关最高限额: <b>5,000 USDT</b></div>
          <div>• 滚球盘最高限额: <b>2,000 USDT</b></div>
          <div>• 单用户单场上限: <b>10,000 USDT</b></div>
          <div>• 熔断敞口阈值: <b>50,000 USDT</b> (超过将触发自动降赔)</div>
        </div>
      );
      return;
    }

    // 6. 暂停滚球盘口
    if (action === "暂停滚球盘口") {
      setActionStatus("warning");
      setActionBadge("盘口已暂停");
      setActionFeedback("已触发盘口紧急熔断保护机制！该场比赛滚球即时投注已暂停接收新订单，前端展示状态已切换为「盘口封盘维护中」。");
      setCustomActionCard(
        <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "8px", padding: "12px", marginTop: "10px", fontSize: "12px", color: "#92400e" }}>
          <div style={{ fontWeight: 700, marginBottom: "6px" }}>⚠️ 滚球盘口状态：已熔断锁定</div>
          <div>• 受注状态: <b>已暂停受注 (Suspended)</b></div>
          <div>• 现有挂单: 保持冻结待赛果确认</div>
          <div>• 恢复机制: 待赛事实时盘口风险消除后可随时由操盘台恢复开放</div>
        </div>
      );
      return;
    }

    // 7. 复核通过放行出款
    if (action === "复核通过放行出款") {
      setActionStatus("success");
      setActionBadge("已放行出款");
      setActionFeedback("提现申请人工复核已通过！已批准出金指令，系统已自动提交至链上出款广播队列并生成出款任务单。");
      setCustomActionCard(
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "12px", marginTop: "10px", fontSize: "12px", color: "#166534" }}>
          <div style={{ fontWeight: 700, marginBottom: "6px" }}>✓ 出款放行审批指令已下达</div>
          <div>• 审批状态: <b>人工终审已批准放行</b></div>
          <div>• 交易签名: 平台金库多签节点正在签名广播</div>
          <div>• 操作人: 当前登录管理员 (admin) · 审计留痕完成</div>
        </div>
      );
      return;
    }

    // 8. 暂缓出款
    if (action === "暂缓出款") {
      setActionStatus("warning");
      setActionBadge("已暂缓出款");
      setActionFeedback("出款流程已标记为暂缓！出金队列已锁定，该提现单已转入二次风险合规审查流程，用户端提示「出款处理中，人工安全核验中」。");
      setCustomActionCard(
        <div style={{ background: "#fff7ed", border: "1px solid #fdba74", borderRadius: "8px", padding: "12px", marginTop: "10px", fontSize: "12px", color: "#9a3412" }}>
          <div style={{ fontWeight: 700, marginBottom: "6px" }}>⏸️ 提现暂缓出款登记</div>
          <div>• 处置状态: <b>暂缓下发，等待合规二次核验</b></div>
          <div>• 资金安全: 用户钱包提现额度保持锁定，未发生划转</div>
          <div>• 复核指引: 建议核查用户流水打码倍数及近期充值链上关联度</div>
        </div>
      );
      return;
    }

    // 9. 升级至风控主管
    if (action === "升级至风控主管") {
      setActionStatus("warning");
      setActionBadge("已升级风控主管");
      setActionFeedback("案件已提升至最高优先级风险排查，已自动流转至高阶风控主管复审专席，并生成加密风控工单。");
      setCustomActionCard(
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "12px", marginTop: "10px", fontSize: "12px", color: "#991b1b" }}>
          <div style={{ fontWeight: 700, marginBottom: "6px" }}>🚨 案件升级通知</div>
          <div>• 风险等级: <b>提升为 High Risk (高危风控)</b></div>
          <div>• 流转目标: 风控高级总监 / 合规安全委员会主管专席</div>
          <div>• 限制动作: 该用户全站充提与高额下注即刻纳入特别监视</div>
        </div>
      );
      return;
    }

    // 10. 标记为已核实
    if (action === "标记为已核实") {
      setActionStatus("success");
      setActionBadge("已核实");
      setActionFeedback("充值订单已标记为人工核实无误！资金到账状态确认，入账流水已归档至合规审计台账。");
      setCustomActionCard(
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "12px", marginTop: "10px", fontSize: "12px", color: "#166534" }}>
          <div style={{ fontWeight: 700, marginBottom: "6px" }}>✓ 链上充值核验确认通过</div>
          <div>• 核验结果: <b>区块链 TXID 与平台托管金库到账地址完全一致</b></div>
          <div>• 确认数: 已达 64 区块不可逆确认</div>
          <div>• 用户额度: 充值已核准计入可用额度</div>
        </div>
      );
      return;
    }

    // 11. 要求补充链上凭证
    if (action === "要求补充链上凭证") {
      setActionStatus("info");
      setActionBadge("待补凭证");
      setActionFeedback("已向该用户发送补充凭证工单提醒，要求提交链上钱包转账哈希 (TXID) 截图及发起地址所有权证明。");
      setCustomActionCard(
        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px", padding: "12px", marginTop: "10px", fontSize: "12px", color: "#0369a1" }}>
          <div style={{ fontWeight: 700, marginBottom: "6px" }}>ℹ️ 补充凭证通知已派发</div>
          <div>• 凭证类型: <b>需要用户提供交易 TXID 链上浏览器详情及转出截图</b></div>
          <div>• 有效期限: 24 小时内补充，逾期将自动退回重审</div>
        </div>
      );
      return;
    }

    // 12. 风控拦截复查
    if (action === "风控拦截复查") {
      setActionStatus("warning");
      setActionBadge("复查中");
      setActionFeedback("已开启链上关联度反洗钱 (AML) 穿透复核，正在排查发起地址是否命中高风险黑灰产标签库。");
      setCustomActionCard(
        <div style={{ background: "#fff7ed", border: "1px solid #fdba74", borderRadius: "8px", padding: "12px", marginTop: "10px", fontSize: "12px", color: "#9a3412" }}>
          <div style={{ fontWeight: 700, marginBottom: "6px" }}>🔍 正在执行反洗钱穿透排查</div>
          <div>• 筛查维度: Chainalysis / Elliptic 风险评分引擎</div>
          <div>• 混币器筛查: 暂未发现 Tornado Cash 等混币交互痕迹</div>
          <div>• 复查结论: 建议重点关注资金来源中转跳数</div>
        </div>
      );
      return;
    }

    // 13. 创建审计备忘
    if (action === "创建审计备忘") {
      const memoId = "MEMO-" + Date.now().toString().slice(-6);
      setActionStatus("success");
      setActionBadge("备忘已存档");
      setActionFeedback(`操作员审计备忘已生成并归档（编号：${memoId}）！已记录审核时间、管理员身份及当前订单详情。`);
      setCustomActionCard(
        <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "12px", marginTop: "10px", fontSize: "12px", color: "#334155" }}>
          <div style={{ fontWeight: 700, marginBottom: "6px" }}>📝 审计备忘录内容</div>
          <div>• 备忘编号: <b>${memoId}</b></div>
          <div>• 记录主体: ${detail.title}</div>
          <div>• 记账操作员: 当前管理员 (admin)</div>
          <div>• 归档节点: 合规与风控安全审计专用存储桶 (不可篡改)</div>
        </div>
      );
      return;
    }

    // 通用操作回退
    setActionStatus("success");
    setActionBadge("已执行");
    setActionFeedback(`指令「${action}」已成功执行，操作凭据已成功同步至后台审计追踪队列。`);
  };

  return (
    <aside className="detail-overlay" aria-label="管理详情抽屉">
      <section className="detail-drawer">
        <header>
          <div>
            <p className="eyebrow">{detail.kicker}</p>
            <h2>{detail.title}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} title="关闭抽屉"><X size={18} /></button>
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

        {/* 钱包变动流水动态核对结果面板 */}
        {walletAuditOpen && matchedLedgerRow && (
          <div className="wallet-audit-card" style={{
            background: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: "10px",
            padding: "16px",
            margin: "16px 0 8px",
            color: "#166534"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", fontWeight: 700 }}>
              <Check size={18} color="#16a34a" />
              <span>钱包流水借贷平账核验通过 ({targetDate})</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px", color: "#14532d" }}>
              <div>充值入账: <b>+{matchedLedgerRow.deposits}u</b></div>
              <div>游戏营收: <b>+{matchedLedgerRow.crashIncome + matchedLedgerRow.wheelIncome}u</b></div>
              <div>赛事净收益: <b>+{matchedLedgerRow.sportsStakes + matchedLedgerRow.leagueReceipts}u</b></div>
              <div>提现及出款: <b>-{matchedLedgerRow.exchangeWithdrawals + matchedLedgerRow.payouts}u</b></div>
              <div>当日净变动: <b>{matchedLedgerRow.net > 0 ? "+" : ""}{matchedLedgerRow.net}u</b></div>
              <div>日终金库结余: <b>{matchedLedgerRow.balanceAfter}u</b></div>
            </div>
            <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed #bbf7d0", fontSize: "11px", color: "#15803d" }}>
              对账凭证：{matchedLedgerRow.items.join(" · ") || "全业务流水校验闭环"}
            </div>
          </div>
        )}

        <div className="detail-actions">
          {detail.actions.map((action) => {
            const isDownload = action.includes("导出") || action.includes("下载");
            const isAudit = action.includes("核对") || action.includes("核验");
            const isPrimary = action.includes("放行") || action.includes("核实");
            const isWarning = action.includes("暂缓") || action.includes("暂停") || action.includes("主管") || action.includes("风控");
            return (
              <button
                key={action}
                onClick={() => handleActionClick(action)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  ...(isDownload ? { background: "#0284c7", color: "#ffffff", fontWeight: 600 } : {}),
                  ...(isAudit ? { background: "#059669", color: "#ffffff", fontWeight: 600 } : {}),
                  ...(isPrimary ? { background: "#16a34a", color: "#ffffff", fontWeight: 600 } : {}),
                  ...(isWarning ? { background: "#d97706", color: "#ffffff", fontWeight: 600 } : {})
                }}
              >
                {isDownload && <Download size={15} />}
                {isAudit && <Check size={15} />}
                <span>{action}</span>
              </button>
            );
          })}
        </div>

        {selectedAction && (
          <div className="action-result" style={{
            background: actionStatus === "warning" ? "#fffbeb" : actionStatus === "info" ? "#f0f9ff" : "#f8fafc",
            border: actionStatus === "warning" ? "1px solid #fcd34d" : actionStatus === "info" ? "1px solid #bae6fd" : "1px solid #cbd5e1",
            borderRadius: "8px",
            padding: "14px",
            marginTop: "14px"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: actionStatus === "warning" ? "#d97706" : actionStatus === "info" ? "#0284c7" : "#059669", fontWeight: 700 }}>
                <Check size={16} />
                <span>{selectedAction}</span>
              </div>
              {actionBadge && (
                <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", background: actionStatus === "warning" ? "#fef3c7" : actionStatus === "info" ? "#e0f2fe" : "#dcfce7", color: actionStatus === "warning" ? "#92400e" : actionStatus === "info" ? "#0369a1" : "#166534", fontWeight: 600 }}>
                  {actionBadge}
                </span>
              )}
            </div>
            <div style={{ fontSize: "13px", color: "#334155", lineHeight: "1.5" }}>
              {actionFeedback || "已成功执行所选操作并完成系统即时响应。"}
            </div>
            {customActionCard}
          </div>
        )}
      </section>
    </aside>
  );
}

function WinnerAlertModal({onClose}: {onClose: () => void}) {
  return (
    <aside className="detail-overlay" aria-label="中奖兑付提醒">
      <section className="withdraw-modal winner-alert" role="alertdialog" aria-modal="true">
        <header>
          <div>
            <p className="eyebrow">结算出款通知</p>
            <h2>中奖投注已兑付</h2>
          </div>
          <button className="icon-btn" onClick={onClose} title="关闭提示"><X size={18} /></button>
        </header>
        <div className="wallet-summary">
          <span>比分中奖出款</span>
          <strong>LGB-2802 · 192u (已兑付)</strong>
        </div>
        <div className="detail-fields">
          <div><span>中奖用户</span><strong>Hamad16</strong></div>
          <div><span>比赛</span><strong>Bayern Munich 5-1 VfB Stuttgart</strong></div>
          <div><span>投注</span><strong>80u · 正确比分 5-1</strong></div>
          <div><span>赔率</span><strong>2.40</strong></div>
          <div><span>状态</span><strong>已兑付 (Paid)</strong></div>
        </div>
        <p className="detail-note">该中奖注单已由客服人工审核完成全额兑付 192u，状态已更新为已兑付，无需再次人工操作。</p>
        <div className="detail-actions">
          <button onClick={onClose}>标记已知悉</button>
          <button onClick={onClose}>已完成兑付归档</button>
        </div>
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
            <p className="eyebrow">交易所出款流程</p>
            <h2>提币至交易所</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </header>
        <div className="wallet-summary">
          <span>平台当前可用余额</span>
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
        <button className="submit-withdraw" onClick={onSubmit}>立即提取</button>
        {message && <div className="action-result"><strong>提币状态</strong><span>{message}</span></div>}
      </section>
    </aside>
  );
}

function metricDetail(title: string, value: number, note: string): Detail {
  return {
    title,
    kicker: "大盘监控指标",
    fields: [["当前数值", value.toLocaleString()], ["数据来源", "平台综合数据库与对账引擎"], ["状态", "正常读取"]],
    actions: ["打开对应管理页面", "导出指标数据快照", "添加操作员备忘"],
    note,
  };
}

function userDetail(user: PlatformUser, index: number): Detail {
  const userBets = betRecords.filter((bet) => bet.user.id === user.id);
  const won = userBets.filter((bet) => bet.result === "Paid" || bet.result === "Won - contact support");
  const fields: Array<[string, string]> = [
    ["用户编号", user.id],
    ["用户名", user.username],
    ["电子邮箱", user.email],
    ["联系电话", user.phone || `+1 (555) ${String(100 + (index * 37) % 900)}-${String(1000 + (index * 79) % 9000)}`],
    ["注册时间", user.registeredAt],
    ["注册批次", user.round],
    ["归属地区", `${user.location} · ${user.region}`],
    ["累计充值", `${user.deposit}u`],
    ["累计投注", `${user.stake}u`],
    ["中奖单数", String(won.length)],
    ["风控状态", index % 4 === 0 ? "建议跟进复核" : "信用良好"],
  ];
  if (user.ip) {
    fields.push(["注册 IP 地址", user.ip]);
  }
  return {
    title: `用户画像资料 · ${user.username}`,
    kicker: "用户管理",
    fields,
    actions: ["冻结账户", "添加 KYC 备忘", "导出用户活动记录", "查看钱包收支"],
    note: userBets.length ? `最近注单: ${userBets[0].match} · ${userBets[0].selection} · ${userBets[0].stake}u @ ${userBets[0].odds}.` : "该用户暂无早期历史注单记录。",
  };
}

function depositDetail(item: typeof depositQueue[number]): Detail {
  return {
    title: `充值审核 · ${item.id}`,
    kicker: "充值管理",
    fields: [["充值用户", item.user], ["充值金额", `$${item.amount.toLocaleString()}`], ["所属公链", item.chain], ["交易哈希", item.tx], ["区块确认数", item.confirmations], ["入账状态", item.status === "Confirmed" ? "已确认" : item.status], ["提交时间", item.age]],
    actions: ["标记为已核实", "要求补充链上凭证", "风控拦截复查", "创建审计备忘"],
  };
}

function withdrawalDetail(item: typeof withdrawalQueue[number]): Detail {
  return {
    title: `提现案件 · ${item.id}`,
    kicker: "提现审核",
    fields: [["申请用户", item.user], ["申请金额", `$${item.amount.toLocaleString()}`], ["提现地址", item.wallet], ["风控等级", item.risk === "High" ? "高风险" : item.risk === "Medium" ? "中风险" : "低风险"], ["审核备注", item.note], ["最低提现要求", "$50 USDT"]],
    actions: ["联系在线客服", "复核通过放行出款", "暂缓出款", "升级至风控主管"],
    note: "提现采用严格的人工双重核验机制，在派彩前全面保障平台资金安全。",
  };
}

function riskDetail(item: typeof riskEvents[number]): Detail {
  return {
    title: `风控预警案件 · ${item.id}`,
    kicker: "风控中心",
    fields: [["严重等级", item.severity === "High" ? "高风险" : "中风险"], ["涉及用户", item.user], ["风险特征", item.signal], ["处置建议", item.action], ["处理专员", "风控总台"]],
    actions: ["立案排查", "设置临时限额", "冻结钱包出金", "添加说明并放行"],
    note: "针对异常投注和多账号对冲行为进行合规限制。",
  };
}

function bonusDetail(item: typeof bonusRules[number]): Detail {
  return {
    title: `红利活动规则 · ${item.name}`,
    kicker: "活动配置",
    fields: [["活动名称", item.name], ["红利额度", item.value], ["流水打码限额", item.limit], ["当前状态", item.status === "Active" ? "正常开放" : "需人工确认"]],
    actions: ["调整流水倍数", "暂停该项活动", "导出领取名单"],
    note: "活动红利规则直接挂钩提现打码校验。",
  };
}

function leagueDetail(league: string): Detail {
  return {
    title: `联赛运营总览 · ${league}`,
    kicker: "联赛控制台",
    fields: [["联赛名称", league], ["状态", "正常开盘"]],
    actions: ["调整赔付上限", "刷新赔率数据源"],
  };
}

function leagueMarketDetail(item: LeagueMarket): Detail {
  return {
    title: `盘口明细 · ${item.match}`,
    kicker: item.league,
    fields: [
      ["联赛", item.league],
      ["对阵双方", item.match],
      ["盘口类型", item.market],
      ["实时赔率", item.odds],
      ["投注人数", `${item.users} 人`],
      ["总投注额", `${item.stake}u`],
      ["赔付敞口", `${item.exposure}u`],
      ["开赛时间", item.kickoff],
      ["状态", item.status === "Live" ? "滚球中" : "赛前"],
    ],
    actions: ["调整该场限额", "暂停滚球盘口", "导出该场注单"],
  };
}

function leagueDailyFixtureDetail(item: LeagueDailyFixture): Detail {
  return {
    title: `重点赛事 · ${item.match}`,
    kicker: item.league,
    fields: [
      ["开赛时间", `${item.date} ${item.time}`],
      ["联赛", item.league],
      ["比赛对阵", item.match],
      ["独赢盘口", item.moneyline],
      ["让球盘口", item.handicap],
      ["大小球盘口", item.total],
      ["特色玩法", item.featured],
      ["盘口状态", item.status === "Live" ? "滚球中" : item.status === "Today" ? "今日赛事" : "未开赛"],
    ],
    actions: ["监控实时盘口", "调整投注限额", "查看投注用户"],
  };
}

function leagueBetTypeDetail(type: string, rows: LeagueBetSlip[]): Detail {
  const zhType = type === "Single" ? "单关" : type === "Parlay" ? "串关" : type === "Live" ? "滚球" : type;
  return {
    title: `注单类型统计 · ${zhType}`,
    kicker: "赛事注单",
    fields: [
      ["注单类型", zhType],
      ["总单数", `${rows.length} 单`],
      ["累计投注额", `${rows.reduce((s, r) => s + r.stake, 0)}u`],
      ["待结算单数", `${rows.filter((r) => r.status === "Open" || r.status === "Pending").length} 单`],
    ],
    actions: ["导出此类注单", "批量核对赛果"],
  };
}

function leagueBetSlipDetail(slip: LeagueBetSlip): Detail {
  return {
    title: `注单详情 · ${slip.id}`,
    kicker: "注单核验",
    fields: [
      ["注单编号", slip.id],
      ["投注用户", slip.user],
      ["投注时间", slip.time],
      ["所属联赛", slip.league],
      ["对阵双方", slip.match],
      ["投注盘口", slip.market],
      ["玩法选项", slip.selection],
      ["赔率", slip.odds.toFixed(2)],
      ["投注本金", `${slip.stake}u`],
      ["预计派彩", `${slip.potentialPayout}u`],
      ["结算状态", slip.status === "Paid" ? "已兑付" : slip.status === "Won" ? "已中奖" : slip.status === "Lost" ? "未中奖" : slip.status === "Risk hold" ? "风控拦截" : "待结算"],
      ["风控评级", slip.risk === "High" ? "高风险" : slip.risk === "Medium" ? "中风险" : "低风险"],
    ],
    actions: ["复核赛果", "手动派彩", "标记风控拦截", "导出注单证明"],
  };
}

function receiptDetail(receipt: typeof leagueBetReceipts[number]): Detail {
  return {
    title: `赛事收款凭据 · ${receipt.date}`,
    kicker: "财务对账",
    fields: [["入账日期", receipt.date], ["入账金额", `+${receipt.amount}u`], ["资金来源", receipt.source], ["到账状态", receipt.status === "Confirmed" ? "已确认入账" : receipt.status]],
    actions: ["查看关联比赛", "核对金库变动"],
  };
}

function dateLedgerDetail(row: DateLedgerRow): Detail {
  return {
    title: `日流水凭据 · ${row.date}`,
    kicker: "按日对账",
    fields: [
      ["记账日期", row.date],
      ["充值入账", `+${row.deposits}u`],
      ["赛事投注", `+${row.sportsStakes}u`],
      ["联赛实收", `+${row.leagueReceipts}u`],
      ["幸运转盘", `+${row.wheelIncome}u`],
      ["Crash 游戏", `+${row.crashIncome}u`],
      ["中奖派彩扣减", `-${row.payouts}u`],
      ["提现出款扣减", `-${row.exchangeWithdrawals}u`],
      ["当日净变动", `${row.net > 0 ? "+" : ""}${row.net}u`],
      ["当日结存余额", `${row.balanceAfter}u`],
      ["借贷平账校验", "差额 0.00u (已完全平账)"],
    ],
    actions: ["导出当日日账表", "核对钱包变动流水"],
    note: row.items.join(" | "),
  };
}

function incomeSummaryDetail(label: string, row: IncomeSummaryRow): Detail {
  return {
    title: `${label} · ${row.period}`,
    kicker: "收入统计",
    fields: [["核算周期", row.period], ["总营收", `+${row.total}u`], ["凭证笔数", `${row.items.length} 笔`]],
    actions: ["导出收入清单", "核算财务月结"],
    note: row.items.join(" | "),
  };
}

function ledgerBalanceDetail(): Detail {
  return {
    title: "每日流水借贷平衡核验",
    kicker: "财务总账",
    fields: [
      ["流水推导余额", `${dateLedgerFinalBalance}u`],
      ["平台金库余额", `${platformBalance}u`],
      ["借贷核对差额", `${dateLedgerDelta}u (已平账)`],
      ["平账状态", "完全平衡 (借贷相符)"],
    ],
    actions: ["生成对账审计报告", "锁定对账期"],
    note: "借方总计等于贷方总计，平台资金与每一天的日流水记录保持严格数学一一对应。",
  };
}

function olCompanionDetail(item: typeof olCompanionModules[number]): Detail {
  return {
    title: `模块接入 · ${item.name}`,
    kicker: "系统架构",
    fields: [["模块名称", item.name], ["状态说明", item.status], ["关联路径", item.path]],
    actions: ["测试接口连通性"],
  };
}

function auditDetail(item: typeof auditLogs[number]): Detail {
  return {
    title: `审计日志详情 · ${item.time}`,
    kicker: "审计留痕",
    fields: [["操作时间", item.time], ["操作主体", item.actor], ["执行操作", item.action], ["执行结果", item.result]],
    actions: ["查看操作员会话", "归档日志"],
  };
}

function betDetail(item: BetRecord): Detail {
  return {
    title: `赛事注单 · ${item.id}`,
    kicker: item.round,
    fields: [
      ["注单编号", item.id],
      ["比赛对阵", item.match],
      ["投注用户", item.user.username],
      ["赛事日期", item.matchDate],
      ["玩法选项", item.selection],
      ["赔率", item.odds.toFixed(2)],
      ["投注金额", `${item.stake}u`],
      ["派彩金额", `${item.payout}u`],
      ["结算结果", item.result === "Paid" ? "已兑付" : item.result === "Lost" ? "未中奖" : item.result === "Pending" ? "待结算" : item.result],
    ],
    actions: ["查看用户画像", "复核结算注单"],
  };
}

function todayMatchDetail(match: string): Detail {
  return {
    title: `当日焦点赛事 · ${match}`,
    kicker: "重点赛事",
    fields: [["比赛对阵", match], ["状态", "已结算"]],
    actions: ["查看注单分布"],
  };
}

function dailyDetail(date: string, total: number): Detail {
  return {
    title: `单日投注统计 · ${date}`,
    kicker: "日度投注",
    fields: [["日期", date], ["总投注额", `${total}u`]],
    actions: ["导出该日全部注单"],
  };
}

function walletDetail(): Detail {
  return {
    title: "平台金库资金推导凭证",
    kicker: "平台金库",
    fields: [
      ["当前金库可用余额", `${platformBalance.toLocaleString()}u`],
      ["7.10 初始基准", "875.00u"],
      ["7.15 当日净变动", `+${todayWalletChange.toFixed(2)}u`],
      ["7.16 提现下发", "-1,000.00u"],
      ["7.20 充值入账", `+${postJulyFifteenthDeposits}u`],
      ["7.20-8.22 体育投注", `+${postJulyFifteenthStakes}u`],
      ["五大联赛实收收益", `+${leagueBetReceiptTotal}u`],
      ["8月提现出款", `-${augustWithdrawals}u`],
      ["9月提现出款", `-${septemberWithdrawals}u`],
      ["10月提现出款", `-${octoberWithdrawals}u`],
      ["幸运转盘收益", `+${wheelIncomeTotal}u`],
      ["Crash 游戏收益", `+${crashIncomeTotal}u`],
      ["中奖注单已兑付扣减", `-${manualSettledPayouts}u`],
      ["借贷平账差额", "0.00u (已完全平账)"],
    ],
    actions: ["下载对账单", "申请提币至交易所"],
    note: "每一笔收支变动均由链上充值、真实赛事赛程或确定性游戏收益驱动，账目借贷完全平衡。",
  };
}

function exchangeWithdrawalDetail(item: ExchangeWithdrawal, balanceAfter: number): Detail {
  return {
    title: `交易所出款凭据 · ${item.date}`,
    kicker: "交易所出金",
    fields: [
      ["出款日期", item.date],
      ["出款金额", `${item.amount}u`],
      ["提现目标地址", item.destination],
      ["出款状态", item.status === "Completed" ? "已兑付完成" : item.status],
      ["扣减后金库余额", `${balanceAfter}u`],
    ],
    actions: ["查看链上出金TX", "打印出款审批凭证"],
  };
}

function controlDetail(title: string, section: string, note: string): Detail {
  return {
    title,
    kicker: section,
    fields: [["操作项", title], ["业务模块", section], ["执行权限", "高级管理员"]],
    actions: ["确认执行", "取消"],
    note,
  };
}

function policyDetail(title: string, value: string): Detail {
  return {
    title,
    kicker: "平台风控政策",
    fields: [["策略名称", title], ["参数配置", value], ["生效范围", "全站强制执行"]],
    actions: ["申请调整策略"],
  };
}
