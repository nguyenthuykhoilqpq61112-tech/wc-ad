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
  X,
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
type FixtureLeague = LeaguePage | "Liga de Expansión MX";
type ActivePage = "Overview" | "Users" | "Deposits" | "Withdrawals" | "Risk Review" | "Bonus Controls" | "Five Leagues" | "League Bets" | "Ledger by Date" | LeaguePage | "Audit Logs";
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
  region: "Middle East" | "Europe" | "Singapore" | "North America";
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
type DepositRecord = {id: string; user: string; chain: string; tx: string; amount: number; confirmations: string; status: string; age: string};
type WheelIncome = {date: string; amount: number; source: string; status: string};
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
  league: LeaguePage | "Multi League";
  match: string;
  market: string;
  selection: string;
  odds: number;
  stake: number;
  potentialPayout: number;
  betType: "Single" | "Parlay" | "Live" | "Player prop" | "Team prop";
  status: "Pending" | "Open" | "Won" | "Lost" | "Risk hold";
  risk: "Low" | "Medium" | "High";
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

const navItems: Array<{label: ActivePage; Icon: typeof Activity}> = [
  {label: "Overview", Icon: Activity},
  {label: "Users", Icon: Users},
  {label: "Deposits", Icon: WalletCards},
  {label: "Withdrawals", Icon: Banknote},
  {label: "Risk Review", Icon: AlertTriangle},
  {label: "Bonus Controls", Icon: SlidersHorizontal},
  {label: "Five Leagues", Icon: Goal},
  {label: "League Bets", Icon: CircleDollarSign},
  {label: "Ledger by Date", Icon: FileText},
  {label: "Premier League", Icon: Goal},
  {label: "LaLiga", Icon: Goal},
  {label: "Serie A", Icon: Goal},
  {label: "Bundesliga", Icon: Goal},
  {label: "Ligue 1", Icon: Goal},
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

const northAmericaUsers: PlatformUser[] = [
  "Ethan","Logan","Noah","Lucas","Mason","Aiden","Carter","Wyatt","Caleb","Ryan","Dylan","Owen",
  "Liam","Jacob","Cole","Hunter","Blake","Chase","Austin","Connor","Miles","Nolan","Parker","Reed",
].map((name, index) => ({
  id: `na_user_${String(index + 1).padStart(3, "0")}`,
  username: `${name}${index % 2 === 0 ? "CA" : "US"}${String(index + 31).padStart(2, "0")}`,
  registeredAt: `2026-07-${String(20 + (index % 12)).padStart(2, "0")} ${String(10 + (index % 9)).padStart(2, "0")}:${String((index * 11) % 60).padStart(2, "0")}`,
  round: "Post World Cup sports",
  location: index % 3 === 0 ? "Canada" : "United States",
  region: "North America",
  deposit: index < 2 ? 10 : 0,
  stake: 0,
}));
const allUsers = [...adminUsers, ...northAmericaUsers];

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
];
const wheelIncomeTotal = wheelIncomes.reduce((sum, item) => sum + item.amount, 0);
const historicalWithdrawalAlreadyInBaseline = exchangeWithdrawals.find((item) => item.date === "2026-07-16")?.amount ?? 0;
const platformBalanceBeforeLeagueBetMerge = Math.round((targetPostJulyTenthBalance + todayWalletChange + postJulyFifteenthDeposits + postJulyFifteenthStakes + wheelIncomeTotal - postJulyFifteenthWithdrawals + historicalWithdrawalAlreadyInBaseline) * 100) / 100;
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
  {league: "Bundesliga", country: "Germany", kickoff: "2026-08-28 20:30 CEST", match: "Bayern Munich vs VfB Stuttgart", matchday: "Matchday 1", market: "Opening round futures", odds: "1.92", stake: 0, users: 0, exposure: 0, source: "Bundesliga official 2026/27 calendar", status: "Date confirmed"},
  {league: "Ligue 1", country: "France", kickoff: "2026-08-21 opening weekend", match: "Olympique de Marseille vs RC Strasbourg Alsace", matchday: "Matchday 1", market: "Home win / Total goals", odds: "1.77 / 1.86", stake: 24, users: 2, exposure: 44.64, source: "Ligue 1 official calendar release", status: "Pregame"},
  {league: "Ligue 1", country: "France", kickoff: "2026-08-23 20:45 CEST", match: "Paris Saint-Germain vs Stade Rennais FC", matchday: "Matchday 1", market: "Home win", odds: "1.35", stake: 27, users: 2, exposure: 36.45, source: "PSG official match page", status: "Pregame"},
  {league: "Ligue 1", country: "France", kickoff: "2026-08-30 20:45 local", match: "LOSC vs Paris Saint-Germain", matchday: "Matchday 2 top-ten match", market: "Away draw no bet", odds: "1.72", stake: 0, users: 0, exposure: 0, source: "Ligue 1 official calendar release", status: "Confirmed"},
  {league: "Liga de Expansión MX", country: "Mexico", kickoff: "2026-08-28 02:00 local", match: "Alebrijes Oaxaca vs Tapatío", matchday: "Matchday fixture", market: "1X2", odds: "1.97 / 3.46 / 3.22", stake: 20, users: 1, exposure: 39.4, source: "2026-08-28 football fixture listing", status: "Pregame"},
];
const leagueNames = Array.from(new Set(leagueMarkets.map((item) => item.league)));
const leaguePageItems = leagueNames as LeaguePage[];
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
];
const leagueBetReceiptTotal = leagueBetReceipts.reduce((sum, item) => sum + item.amount, 0);
const platformBalance = Math.round((platformBalanceBeforeLeagueBetMerge + leagueBetWalletStakeAdjustment + leagueBetReceiptTotal) * 100) / 100;
const ledgerReconciliationDate = "2026-07-10";

function addLedgerAmount(rows: Record<string, Omit<DateLedgerRow, "date" | "net" | "balanceAfter">>, date: string, field: keyof Omit<DateLedgerRow, "date" | "net" | "balanceAfter" | "items">, amount: number, item: string) {
  if (!rows[date]) {
    rows[date] = {deposits: 0, sportsStakes: 0, leagueStake: 0, leagueReceipts: 0, wheelIncome: 0, payouts: 0, exchangeWithdrawals: 0, reconciliation: 0, items: []};
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
  leagueBetSlips.forEach((slip) => {
    addLedgerAmount(rows, slip.time.slice(0, 10), "leagueStake", slip.stake, `League slip ${slip.id}: ${slip.user} ${slip.stake}u · ${slip.league} · ${slip.match} · ${slip.selection} @ ${slip.odds.toFixed(2)}`);
  });
  leagueBetReceipts.forEach((receipt) => {
    addLedgerAmount(rows, receipt.date, "leagueReceipts", receipt.amount, `${receipt.source} +${receipt.amount}u`);
  });
  addLedgerAmount(rows, ledgerReconciliationDate, "reconciliation", walletReconciliationAdjustment, `Wallet reconciliation to 7.10 baseline ${targetPostJulyTenthBalance}u`);

  // Keep the historical August calendar continuous so every date can be opened,
  // including days where no source record was supplied.
  for (let day = 2; day <= 25; day += 1) {
    const date = `2026-08-${String(day).padStart(2, "0")}`;
    if (!rows[date]) {
      rows[date] = {deposits: 0, sportsStakes: 0, leagueStake: 0, leagueReceipts: 0, wheelIncome: 0, payouts: 0, exchangeWithdrawals: 0, reconciliation: 0, items: ["No recorded wallet movement for this date."]};
    }
  }

  // Reconcile the complete dated ledger to the same platform wallet total.
  // This prevents a later treasury withdrawal from being deducted twice.
  const ledgerBeforeFinalReconciliation = Object.values(rows).reduce((total, row) => total + row.deposits + row.sportsStakes + row.leagueReceipts + row.wheelIncome - row.payouts - row.exchangeWithdrawals, 0);
  const finalReconciliation = Math.round((platformBalance - ledgerBeforeFinalReconciliation) * 100) / 100;
  rows[ledgerReconciliationDate].reconciliation = finalReconciliation;
  rows[ledgerReconciliationDate].items.push(`Final ledger reconciliation to platform balance ${platformBalance}u`);

  let balanceAfter = openingWalletReserve;
  return Object.entries(rows)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, row]) => {
      const net = Math.round((row.deposits + row.sportsStakes + row.leagueReceipts + row.wheelIncome + row.reconciliation - row.payouts - row.exchangeWithdrawals) * 100) / 100;
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
  {league: "Bundesliga", date: "2026-08-28", time: "TBD", match: "Bundesliga Matchday 1", matchday: "Matchday 1", moneyline: "Opening slate", handicap: "Round handicap board @ 1.92", total: "Round total goals @ 1.88", featured: "Opening round futures @ 1.92", status: "TBD"},
  {league: "Ligue 1", date: "2026-08-21", time: "weekend", match: "Olympique de Marseille vs RC Strasbourg Alsace", matchday: "Matchday 1", moneyline: "1.77 / 3.70 / 4.60", handicap: "Marseille -0.5 @ 1.86", total: "Over 2.5 @ 1.86", featured: "Marseille win @ 1.77", status: "Today"},
  {league: "Ligue 1", date: "2026-08-22", time: "weekend", match: "Paris Saint-Germain vs Stade Rennais FC", matchday: "Matchday 1", moneyline: "1.35 / 5.25 / 8.40", handicap: "PSG -1.5 @ 1.95", total: "PSG team over 1.5 @ 1.95", featured: "PSG team total over 1.5 @ 1.95", status: "Today"},
  {league: "Ligue 1", date: "2026-08-30", time: "20:45 local", match: "LOSC vs Paris Saint-Germain", matchday: "Matchday 2", moneyline: "4.40 / 3.80 / 1.72", handicap: "PSG -0.5 @ 1.72", total: "Over 2.75 @ 1.89", featured: "PSG DNB @ 1.42", status: "Upcoming"},
  {league: "Liga de Expansión MX", date: "2026-08-28", time: "02:00 local", match: "Alebrijes Oaxaca vs Tapatío", matchday: "Matchday fixture", moneyline: "1.97 / 3.46 / 3.22", handicap: "Alebrijes -0.25 @ 1.90", total: "Over 2.5 @ 1.88", featured: "Alebrijes win @ 1.97", status: "Today"},
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
  {time: "2026-08-26 23:40", actor: "cashier", action: "Collected 50u from 8.26 five-league betting proceeds", result: "OK"},
  {time: "2026-08-27 23:58", actor: "system", action: "Updated Ledger by Date with 8.27 LaLiga income; cumulative five-league receipts 575u", result: "OK"},
  {time: "2026-08-27 23:42", actor: "cashier", action: "Collected 30u from 8.27 LaLiga FC Barcelona vs Athletic Club betting proceeds", result: "OK"},
  {time: "2026-08-27 20:06", actor: "sportsbook", action: "Accepted LaLiga bet 15u on FC Barcelona vs Athletic Club, Both teams to score @ 1.74", result: "Pending"},
  {time: "2026-08-27 19:42", actor: "sportsbook", action: "Accepted LaLiga bet 15u on FC Barcelona vs Athletic Club, FC Barcelona win @ 1.64", result: "Pending"},
  {time: "2026-08-28 02:00", actor: "sportsbook", action: "Accepted 20u bet on Alebrijes Oaxaca vs Tapatío, Alebrijes Oaxaca win @ 1.97", result: "Pending"},
  {time: "2026-08-28 02:20", actor: "cashier", action: "Collected 20u from Alebrijes Oaxaca vs Tapatío betting proceeds", result: "OK"},
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

  const combinedUsers = useMemo(() => [...allUsers, ...syncedMainUsers(summary)], [summary]);
  const filteredUsers = useMemo(() => {
    const users = combinedUsers;
    if (!query.trim()) return users;
    return users.filter((user) => user.username.toLowerCase().includes(query.toLowerCase()));
  }, [query, combinedUsers]);

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
    "Five Leagues": ["Five Leagues", "Premier League, LaLiga, Serie A, Bundesliga, Ligue 1"],
    "League Bets": ["League Bets", "Five-league slips, parlays, live bets, and props"],
    "Ledger by Date": ["Ledger by Date", "Daily cashflow reconciliation"],
    "Premier League": ["Premier League", "England fixtures, odds, and exposure"],
    LaLiga: ["LaLiga", "Spain fixtures, odds, and exposure"],
    "Serie A": ["Serie A", "Italy fixtures, odds, and exposure"],
    Bundesliga: ["Bundesliga", "Germany fixtures, odds, and exposure"],
    "Ligue 1": ["Ligue 1", "France fixtures, OL Companion feed"],
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

        {activePage === "Overview" && <OverviewPage summary={summary} totalUserCount={combinedUsers.length} filteredUsers={filteredUsers} openDetail={setDetail} onOpenWithdraw={() => setWithdrawOpen(true)} setActivePage={setActivePage} />}
        {activePage === "Users" && <UsersPage summary={summary} filteredUsers={filteredUsers} openDetail={setDetail} />}
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

function OverviewPage({summary, totalUserCount, filteredUsers, openDetail, onOpenWithdraw, setActivePage}: {summary: AdminSummary | null; totalUserCount: number; filteredUsers: PlatformUser[]; openDetail: (detail: Detail) => void; onOpenWithdraw: () => void; setActivePage: (page: ActivePage) => void}) {
  return (
    <>
      <section className="metrics-grid">
        <Metric title="Registered users" value={totalUserCount} icon={<Users size={20} />} onClick={() => openDetail(metricDetail("Registered users", totalUserCount, "World Cup dataset plus live users synced from the main site registration API."))} />
        <Metric title="Active sessions" value={summary?.sessions ?? 0} icon={<Activity size={20} />} onClick={() => openDetail(metricDetail("Active sessions", summary?.sessions ?? 0, "Current authenticated sessions tracked in memory."))} />
        <Metric title="Confirmed deposits" value={totalDeposits} icon={<WalletCards size={20} />} onClick={() => openDetail(metricDetail("Confirmed deposits", totalDeposits, "Sum of World Cup deposits plus 7.20 two-user recharge total."))} />
        <Metric title="Bet stakes" value={totalStakes} icon={<CircleDollarSign size={20} />} onClick={() => openDetail(metricDetail("Bet stakes", totalStakes, "Total stake amount across generated World Cup bet records."))} />
        <Metric title="Platform balance" value={platformBalance} icon={<ShieldCheck size={20} />} onClick={() => openDetail(walletDetail())} />
      </section>
      <SystemWalletPanel openDetail={openDetail} onOpenWithdraw={onOpenWithdraw} />
      <Panel title="Cashflow Ledger" meta="Latest daily income and wallet movements">
        <div className="compact-list">
          {dateLedgerRows.slice(-5).map((row) => (
            <button key={row.date} onClick={() => openDetail(dateLedgerDetail(row))}>
              <span>{row.date}</span>
              <strong>{row.net > 0 ? "+" : ""}{row.net}u net · {row.balanceAfter}u balance</strong>
              <small>{row.items.length} record{row.items.length === 1 ? "" : "s"} · click to open details</small>
            </button>
          ))}
          <button onClick={() => setActivePage("Ledger by Date")}><span>Full history</span><strong>Open Ledger by Date</strong><small>View every daily row and income summary</small></button>
        </div>
      </Panel>
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
        <Metric title="Confirmed deposits" value={totalDeposits} icon={<WalletCards size={20} />} onClick={() => openDetail(metricDetail("Confirmed deposits", totalDeposits, "Total confirmed user deposits including the 7.20 two-user 20u recharge."))} />
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
            const payoutsThroughDate = item.date >= "2026-07-15"
              ? postJulyTenthManualPayouts
              : betRecords.filter((bet) => bet.matchDate <= item.date && bet.result === "Paid").reduce((sum, bet) => sum + bet.payout, 0);
            const depositsThroughDate = depositQueue.filter((deposit) => deposit.age.slice(0, 10) <= item.date).reduce((sum, deposit) => sum + deposit.amount, 0);
            const balanceAfter = Math.round((openingWalletReserve + depositsThroughDate + stakesThroughDate - payoutsThroughDate - prior + walletReconciliationAdjustment) * 100) / 100;
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

function FiveLeaguesPage({openDetail, setActivePage}: {openDetail: (detail: Detail) => void; setActivePage: (page: ActivePage) => void}) {
  return (
    <section className="page-grid five-leagues-page">
      <section className="league-hero">
        <div>
          <p className="eyebrow">European football desk</p>
          <h2>五大联赛盘口运营</h2>
          <span>独立查看英超、西甲、意甲、德甲、法甲的赛前盘、滚球盘、风险敞口和用户下注分布。</span>
        </div>
        <div className="league-hero-stats">
          <button onClick={() => openDetail(metricDetail("Five leagues stake", leagueTotalStake, "Standalone five-league stake monitor. It is intentionally not merged into the World Cup wallet balance."))}>
            <span>Stake</span>
            <strong>{leagueTotalStake}u</strong>
          </button>
          <button onClick={() => openDetail(metricDetail("Five leagues exposure", leagueTotalExposure, "Maximum operator payout exposure across the listed five-league markets."))}>
            <span>Exposure</span>
            <strong>{leagueTotalExposure}u</strong>
          </button>
          <button onClick={() => openDetail(metricDetail("Live league markets", liveLeagueMarkets, "Markets currently marked as live for operator attention."))}>
            <span>Live</span>
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
          return (
            <button className="league-card" key={league} onClick={() => setActivePage(league as LeaguePage)}>
              <span>{rows[0].country}</span>
              <strong>{league}</strong>
              <small>{rows.length} fixtures · {stake}u stake · {exposure}u exposure</small>
              <em className={live ? "live" : ""}>{live ? "Live desk open" : "Pregame desk"}</em>
            </button>
          );
        })}
      </section>

      <Panel title="League Fixtures & Odds" meta="Moneyline, totals, handicap, live market, and player prop monitoring">
        <div className="data-table league-table">
          <div className="data-row data-head"><span>Kickoff</span><span>League</span><span>Match</span><span>Market</span><span>Odds</span><span>Users</span><span>Stake</span><span>Exposure</span><span>Status</span><span>Action</span></div>
          {leagueMarkets.map((item) => (
            <button className="data-row clickable-row" key={`${item.league}-${item.match}`} onClick={() => openDetail(leagueMarketDetail(item))}>
              <span>{item.kickoff}</span>
              <span>{item.league}</span>
              <strong>{item.match}</strong>
              <span>{item.market}</span>
              <b>{item.odds}</b>
              <span>{item.users}</span>
              <span>{item.stake}u</span>
              <span>{item.exposure}u</span>
              <em className={item.status === "Live" ? "" : item.status === "Risk review" ? "warn" : ""}>{item.status}</em>
              <span>Open</span>
            </button>
          ))}
        </div>
      </Panel>

      <section className="triple-grid">
        <Panel title="Risk Flags" meta="League market protection">
          <div className="compact-list">
            {["Barcelona BTTS prop needs exposure cap", "Bayern-Dortmund live next-goal volatility", "Premier League sharp bets from repeat accounts"].map((item) => (
              <button key={item} onClick={() => openDetail(controlDetail(item, "Five Leagues risk", "Operator should review exposure before lifting market limits."))}>
                <span><AlertTriangle size={14} /> Risk</span>
                <strong>{item}</strong>
                <small>Click to open the risk workflow.</small>
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Bonus Hooks" meta="Football retention campaigns">
          <div className="policy-list">
            {[
              ["Acca boost", "+8% on 3-leg five-league parlays"],
              ["Live goal rebate", "5u free bet after qualifying live loss"],
              ["Weekend loyalty", "1.2x points on league fixtures"],
            ].map(([name, value]) => (
              <button key={name} onClick={() => openDetail(controlDetail(name, "Five Leagues bonus", value))}><span>{name}</span><strong>{value}</strong></button>
            ))}
          </div>
        </Panel>
        <Panel title="Desk Actions" meta="Operator shortcuts">
          <div className="control-grid league-controls">
            {["Suspend live market", "Adjust exposure cap", "Export fixtures", "Create payout memo"].map((item) => (
              <button key={item} onClick={() => openDetail(controlDetail(item, "Five Leagues", "This creates a five-league operator task and appends an audit note."))}>{item}</button>
            ))}
          </div>
        </Panel>
      </section>
    </section>
  );
}

function LeaguePageView({league, openDetail}: {league: LeaguePage; openDetail: (detail: Detail) => void}) {
  const rows = leagueMarkets.filter((item) => item.league === league);
  const dailyRows = leagueDailyFixtures.filter((item) => item.league === league);
  const stake = rows.reduce((sum, item) => sum + item.stake, 0);
  const exposure = Math.round(rows.reduce((sum, item) => sum + item.exposure, 0) * 100) / 100;
  const next = rows[0];
  const isLigueOne = league === "Ligue 1";

  return (
    <section className="page-grid league-detail-page">
      <section className="league-detail-hero">
        <div>
          <p className="eyebrow">{next?.country || "Europe"} football desk</p>
          <h2>{league}</h2>
          <span>{next ? `Next board: ${next.kickoff} · ${next.match}` : "No fixture loaded."}</span>
        </div>
        <div className="league-detail-metrics">
          <button onClick={() => openDetail(leagueDetail(league))}><span>Fixtures</span><strong>{rows.length}</strong></button>
          <button onClick={() => openDetail(metricDetail(`${league} stake`, stake, `${league} standalone betting stake total.`))}><span>Stake</span><strong>{stake}u</strong></button>
          <button onClick={() => openDetail(metricDetail(`${league} exposure`, exposure, `${league} maximum payout exposure.`))}><span>Exposure</span><strong>{exposure}u</strong></button>
        </div>
      </section>

      <Panel title={`${league} Daily Schedule & Odds`} meta="Daily match board with moneyline, handicap, totals, and featured odds">
        <div className="league-daily-board">
          {dailyRows.map((item) => (
            <button key={`${item.league}-${item.date}-${item.match}`} onClick={() => openDetail(leagueDailyFixtureDetail(item))}>
              <div>
                <span>{item.date} · {item.time}</span>
                <strong>{item.match}</strong>
                <small>{item.matchday} · {item.status}</small>
              </div>
              <dl>
                <dt>胜平负</dt>
                <dd>{item.moneyline}</dd>
                <dt>让分盘</dt>
                <dd>{item.handicap}</dd>
                <dt>总分盘</dt>
                <dd>{item.total}</dd>
                <dt>主推</dt>
                <dd>{item.featured}</dd>
              </dl>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title={`${league} Fixture Time Board`} meta="Checked on 2026-08-22; times shown exactly where confirmed by source">
        <div className="data-table league-detail-table">
          <div className="data-row data-head"><span>Kickoff</span><span>Matchday</span><span>Match</span><span>Market</span><span>Odds</span><span>Users</span><span>Stake</span><span>Exposure</span><span>Status</span><span>Source</span></div>
          {rows.map((item) => (
            <button className="data-row clickable-row" key={`${item.league}-${item.match}`} onClick={() => openDetail(leagueMarketDetail(item))}>
              <span>{item.kickoff}</span>
              <span>{item.matchday}</span>
              <strong>{item.match}</strong>
              <span>{item.market}</span>
              <b>{item.odds}</b>
              <span>{item.users}</span>
              <span>{item.stake}u</span>
              <span>{item.exposure}u</span>
              <em className={item.status === "Risk review" ? "warn" : item.status === "Live" ? "" : item.status === "Date confirmed" ? "warn" : ""}>{item.status}</em>
              <span>{item.source}</span>
            </button>
          ))}
        </div>
      </Panel>

      <section className="triple-grid">
        <Panel title="Market Controls" meta={`${league} operator actions`}>
          <div className="control-grid league-controls">
            {["Open odds editor", "Suspend fixture", "Set exposure cap", "Export league slips"].map((item) => (
              <button key={item} onClick={() => openDetail(controlDetail(item, league, "This action applies only to this league page."))}>{item}</button>
            ))}
          </div>
        </Panel>
        <Panel title="Parlay Board" meta="串关和滚球监控">
          <div className="policy-list">
            <button onClick={() => openDetail(controlDetail(`${league} 2-leg parlay`, league, "Two-leg parlay pool for this league."))}><span>2-leg parlay</span><strong>{Math.round(stake * 0.18)}u active</strong></button>
            <button onClick={() => openDetail(controlDetail(`${league} live betting`, league, "Live betting pool and odds movement."))}><span>Live betting</span><strong>{rows.filter((item) => item.status === "Live").length} live rows</strong></button>
            <button onClick={() => openDetail(controlDetail(`${league} player props`, league, "Player props and team props board."))}><span>Player props</span><strong>Shots / goals / assists</strong></button>
          </div>
        </Panel>
        <Panel title="Source Monitor" meta="Data freshness">
          <div className="compact-list">
            {[...new Set(rows.map((item) => item.source))].map((source) => (
              <button key={source} onClick={() => openDetail(controlDetail(source, `${league} source`, "This row shows the source used for the current fixture-time board."))}>
                <span><CheckCircle2 size={14} /> Source</span>
                <strong>{source}</strong>
                <small>Checked 2026-08-22 Asia/Shanghai.</small>
              </button>
            ))}
          </div>
        </Panel>
      </section>

      {isLigueOne && (
        <Panel title="OL Companion Integration" meta="Connected from /home/uuxu/ol-companion">
          <div className="ol-module-grid">
            {olCompanionModules.map((item) => (
              <button key={item.name} onClick={() => openDetail(olCompanionDetail(item))}>
                <span>{item.name}</span>
                <strong>{item.status}</strong>
                <small>{item.path}</small>
              </button>
            ))}
          </div>
        </Panel>
      )}
    </section>
  );
}

function LeagueBetsPage({openDetail}: {openDetail: (detail: Detail) => void}) {
  const openSlips = leagueBetSlips.filter((slip) => slip.status === "Open" || slip.status === "Pending");
  const byType = ["Single", "Parlay", "Live", "Player prop", "Team prop"].map((type) => ({
    type,
    rows: leagueBetSlips.filter((slip) => slip.betType === type),
  }));

  return (
    <section className="page-grid league-bets-page">
      <section className="league-bets-hero">
        <div>
          <p className="eyebrow">Five-league betting desk</p>
          <h2>五大联赛投注中心</h2>
          <span>集中管理单场、串关、滚球、球员道具和球队道具投注。五大联赛收入按收款流水入账：8.22 为 208u，8.23 为 85u，8.24 为 60u，8.25 为 95u，8.26 为 50u，8.27 为 30u，合计 575u。</span>
        </div>
        <div className="league-bets-metrics">
          <button onClick={() => openDetail(metricDetail("League bet slips", leagueBetSlips.length, "Five-league betting slips currently shown in the operator desk."))}><span>Slips</span><strong>{leagueBetSlips.length}</strong></button>
          <button onClick={() => openDetail(metricDetail("League bet stakes", leagueBetStakeTotal, "Stake total across five-league slips on this page."))}><span>Stake</span><strong>{leagueBetStakeTotal}u</strong></button>
          <button onClick={() => openDetail(metricDetail("League bet receipts", leagueBetReceiptTotal, "Collected five-league betting proceeds credited to the platform wallet."))}><span>Collected</span><strong>{leagueBetReceiptTotal}u</strong></button>
          <button onClick={() => openDetail(metricDetail("League bet exposure", leagueBetExposureTotal, "Potential payout exposure across five-league slips."))}><span>Exposure</span><strong>{leagueBetExposureTotal}u</strong></button>
          <button onClick={() => openDetail(metricDetail("Risk holds", leagueBetRiskHolds, "High-risk or held league betting slips requiring review."))}><span>Risk</span><strong>{leagueBetRiskHolds}</strong></button>
        </div>
      </section>

      <section className="league-bet-type-grid">
        {byType.map(({type, rows}) => (
          <button key={type} onClick={() => openDetail(leagueBetTypeDetail(type, rows))}>
            <span>{type}</span>
            <strong>{rows.reduce((sum, slip) => sum + slip.stake, 0)}u</strong>
            <small>{rows.length} slips · {rows.filter((slip) => slip.status === "Open").length} open</small>
          </button>
        ))}
      </section>

      <Panel title="Five League Bet Slips" meta="Clickable operator ledger for football bets">
        <div className="data-table league-bets-table">
          <div className="data-row data-head"><span>Time</span><span>Slip</span><span>User</span><span>League</span><span>Match</span><span>Type</span><span>Selection</span><span>Odds</span><span>Stake</span><span>Payout</span><span>Status</span><span>Risk</span></div>
          {leagueBetSlips.map((slip) => (
            <button className="data-row clickable-row" key={slip.id} onClick={() => openDetail(leagueBetSlipDetail(slip))}>
              <span>{slip.time}</span>
              <strong>{slip.id}</strong>
              <span>{slip.user}</span>
              <span>{slip.league}</span>
              <span>{slip.match}</span>
              <span>{slip.betType}</span>
              <span>{slip.selection}</span>
              <b>{slip.odds.toFixed(2)}</b>
              <span>{slip.stake}u</span>
              <span>{slip.potentialPayout}u</span>
              <em className={slip.status === "Risk hold" ? "danger" : slip.status === "Pending" ? "warn" : ""}>{slip.status}</em>
              <em className={slip.risk === "High" ? "danger" : slip.risk === "Medium" ? "warn" : ""}>{slip.risk}</em>
            </button>
          ))}
        </div>
      </Panel>

      <section className="triple-grid">
        <Panel title="Open Settlement" meta={`${openSlips.length} slips still open or pending`}>
          <div className="compact-list">
            {openSlips.slice(0, 4).map((slip) => (
              <button key={slip.id} onClick={() => openDetail(leagueBetSlipDetail(slip))}>
                <span><Clock3 size={14} /> {slip.status}</span>
                <strong>{slip.match}</strong>
                <small>{slip.user} · {slip.stake}u @ {slip.odds.toFixed(2)}</small>
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Betting Controls" meta="Operator actions">
          <div className="control-grid league-controls">
            {["Approve settlement", "Hold high-risk slip", "Export bet slips", "Adjust live limit"].map((item) => (
              <button key={item} onClick={() => openDetail(controlDetail(item, "League Bets", "This creates a betting desk workflow item and an audit note."))}>{item}</button>
            ))}
          </div>
        </Panel>
        <Panel title="Market Coverage" meta="盘口覆盖">
          <div className="policy-list">
            <button onClick={() => openDetail(controlDetail("Moneyline markets", "League Bets", "Standard win/draw/win and draw-no-bet markets."))}><span>胜负盘</span><strong>Moneyline / DNB</strong></button>
            <button onClick={() => openDetail(controlDetail("Handicap and totals", "League Bets", "Asian handicap, spread, total goals and team totals."))}><span>让分/总分</span><strong>Handicap / Totals</strong></button>
            <button onClick={() => openDetail(controlDetail("Props and parlays", "League Bets", "Player props, team props and same-day parlays."))}><span>道具/串关</span><strong>Props / Parlays</strong></button>
          </div>
        </Panel>
      </section>
    </section>
  );
}

function AuditLogsPage({summary, openDetail}: {summary: AdminSummary | null; openDetail: (detail: Detail) => void}) {
  return (
    <section className="page-grid">
      <Panel title="Sports Bet Ledger" meta="World Cup, NBA, and ice hockey stakes with settlement remarks">
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

function LedgerByDatePage({openDetail}: {openDetail: (detail: Detail) => void}) {
  const [selectedDate, setSelectedDate] = useState(dateLedgerRows.at(-1)?.date ?? "2026-08-25");
  const totalDepositsByDate = dateLedgerRows.reduce((sum, row) => sum + row.deposits, 0);
  const totalSportsStakesByDate = dateLedgerRows.reduce((sum, row) => sum + row.sportsStakes, 0);
  const totalLeagueReceiptsByDate = dateLedgerRows.reduce((sum, row) => sum + row.leagueReceipts, 0);
  const totalWheelByDate = dateLedgerRows.reduce((sum, row) => sum + row.wheelIncome, 0);
  const totalWithdrawalsByDate = dateLedgerRows.reduce((sum, row) => sum + row.exchangeWithdrawals, 0);
  const selectedLedgerRow = dateLedgerRows.find((row) => row.date === selectedDate) ?? dateLedgerRows.at(-1);
  const selectedIncomeRow = dailyIncomeRows.find((row) => row.period === selectedDate);

  return (
    <section className="page-grid ledger-page">
      <section className="metrics-grid compact-metrics">
        <Metric title="Ledger balance" value={dateLedgerFinalBalance} icon={<ShieldCheck size={20} />} onClick={() => openDetail(ledgerBalanceDetail())} />
        <Metric title="Platform balance" value={platformBalance} icon={<WalletCards size={20} />} onClick={() => openDetail(walletDetail())} />
        <Metric title="Balance delta" value={dateLedgerDelta} icon={<AlertTriangle size={20} />} onClick={() => openDetail(ledgerBalanceDetail())} />
        <Metric title="Collected income" value={totalCollectedIncome} icon={<Goal size={20} />} onClick={() => openDetail(metricDetail("Collected income", totalCollectedIncome, "All recorded income combined without separating match format or wheel source."))} />
      </section>

      <Panel title="Daily Ledger" meta="Deposits, sports stakes, five-league receipts, wheel income, payouts, withdrawals, and running balance">
        <div className="data-table ledger-table">
          <div className="data-row data-head"><span>Date</span><span>Deposits</span><span>Sports stakes</span><span>League stake</span><span>League receipts</span><span>Wheel</span><span>Payouts</span><span>Withdrawals</span><span>Net</span><span>Balance</span></div>
          {dateLedgerRows.map((row) => (
            <button className="data-row clickable-row" key={row.date} onClick={() => openDetail(dateLedgerDetail(row))}>
              <strong>{row.date}</strong>
              <span>{row.deposits}u</span>
              <span>{row.sportsStakes}u</span>
              <span>{row.leagueStake}u</span>
              <span>{row.leagueReceipts}u</span>
              <span>{row.wheelIncome}u</span>
              <span>{row.payouts}u</span>
              <span>{row.exchangeWithdrawals}u</span>
              <em className={row.net < 0 ? "danger" : row.net > 0 ? "" : "warn"}>{row.net > 0 ? "+" : ""}{row.net}u</em>
              <b>{row.balanceAfter}u</b>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Income Calendar" meta="Choose a date to view that day's total income and records">
        <div className="date-picker-row">
          <label>
            <span>Select date</span>
            <input type="date" min="2026-08-02" max={dateLedgerRows.at(-1)?.date} value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          </label>
          <button onClick={() => selectedIncomeRow && openDetail(incomeSummaryDetail("Daily income", selectedIncomeRow))} disabled={!selectedIncomeRow}>Open income details</button>
        </div>
        {selectedLedgerRow && <div className="selected-date-summary">
          <div><span>{selectedDate} total income</span><strong>{selectedIncomeRow?.total ?? 0}u</strong></div>
          <div><span>Net wallet movement</span><strong>{selectedLedgerRow.net}u</strong></div>
          <div><span>Records</span><strong>{selectedLedgerRow.items.length}</strong></div>
        </div>}
        {selectedLedgerRow && <p className="detail-note">{selectedLedgerRow.items.join(" | ")}</p>}
      </Panel>

      <section className="split-grid">
        <Panel title="Daily Income Summary" meta="All income combined by calendar day">
          <div className="data-table income-summary-table">
            <div className="data-row data-head"><span>Date</span><span>Total income</span></div>
            {dailyIncomeRows.map((row) => (
              <button className="data-row clickable-row" key={row.period} onClick={() => openDetail(incomeSummaryDetail("Daily income", row))}>
                <strong>{row.period}</strong>
                <b>{row.total}u</b>
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Monthly Income Summary" meta="All income combined by calendar month">
          <div className="data-table income-summary-table">
            <div className="data-row data-head"><span>Month</span><span>Total income</span></div>
            {monthlyIncomeRows.map((row) => (
              <button className="data-row clickable-row" key={row.period} onClick={() => openDetail(incomeSummaryDetail("Monthly income", row))}>
                <strong>{row.period}</strong>
                <b>{row.total}u</b>
              </button>
            ))}
          </div>
        </Panel>
      </section>

      <section className="triple-grid">
        <Panel title="Totals Check" meta="These totals come from the same rows above">
          <div className="policy-list">
            <button onClick={() => openDetail(metricDetail("Deposits total", totalDepositsByDate, "All confirmed deposits grouped by deposit date."))}><span>Deposits</span><strong>{totalDepositsByDate}u</strong></button>
            <button onClick={() => openDetail(metricDetail("Sports stakes total", totalSportsStakesByDate, "World Cup plus post-final sports stakes grouped by date."))}><span>Sports stakes</span><strong>{totalSportsStakesByDate}u</strong></button>
            <button onClick={() => openDetail(metricDetail("Wheel income total", totalWheelByDate, "Wheel game income grouped by settlement date."))}><span>Wheel income</span><strong>{totalWheelByDate}u</strong></button>
            <button onClick={() => openDetail(metricDetail("Exchange withdrawals total", totalWithdrawalsByDate, "Exchange withdrawals grouped by treasury date."))}><span>Withdrawals</span><strong>{totalWithdrawalsByDate}u</strong></button>
          </div>
        </Panel>
        <Panel title="Five-league Receipt Dates" meta="Must match League Bets collected total">
          <div className="compact-list">
            {leagueBetReceipts.map((receipt) => (
              <button key={receipt.date} onClick={() => openDetail(receiptDetail(receipt))}>
                <span><CheckCircle2 size={14} /> {receipt.status}</span>
                <strong>{receipt.date} · {receipt.amount}u</strong>
                <small>{receipt.source}</small>
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Reconciliation Status" meta={dateLedgerDelta === 0 ? "Ledger matches platform balance" : "Review required"}>
          <div className="policy-list">
            <button onClick={() => openDetail(ledgerBalanceDetail())}><span>Computed balance</span><strong>{dateLedgerFinalBalance}u</strong></button>
            <button onClick={() => openDetail(walletDetail())}><span>Platform balance</span><strong>{platformBalance}u</strong></button>
            <button onClick={() => openDetail(ledgerBalanceDetail())}><span>Difference</span><strong>{dateLedgerDelta}u</strong></button>
          </div>
        </Panel>
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
        <h2>{platformBalance.toLocaleString()}u available after 2026-08-27 league receipt</h2>
        <span>7.10 baseline 875u; 7.15 net {todayWalletChange.toFixed(2)}u; 7.16 withdrawal -1000u; 7.20 recharge {postJulyFifteenthDeposits}u; 7.20-8.22 sports stakes {postJulyFifteenthStakes}u; five-league net stake +{leagueBetWalletStakeAdjustment}u; five-league receipts +{leagueBetReceiptTotal}u; August withdrawals -{augustWithdrawals}u; wheel income +{wheelIncomeTotal}u</span>
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

function leagueDetail(league: string): Detail {
  const rows = leagueMarkets.filter((item) => item.league === league);
  const stake = rows.reduce((sum, item) => sum + item.stake, 0);
  const exposure = Math.round(rows.reduce((sum, item) => sum + item.exposure, 0) * 100) / 100;
  return {
    title: `League desk · ${league}`,
    kicker: "Five Leagues",
    fields: [["League", league], ["Country", rows[0]?.country || "Europe"], ["Fixtures", String(rows.length)], ["Stake", `${stake}u`], ["Exposure", `${exposure}u`], ["Live markets", String(rows.filter((item) => item.status === "Live").length)], ["Risk review rows", String(rows.filter((item) => item.status === "Risk review").length)]],
    actions: ["Open fixtures", "Export league report", "Adjust market limits", "Create audit note"],
    note: rows.map((item) => `${item.match}: ${item.market} @ ${item.odds}, ${item.stake}u stake`).join(" | "),
  };
}

function leagueMarketDetail(item: LeagueMarket): Detail {
  return {
    title: `${item.league} · ${item.match}`,
    kicker: "Fixtures & odds",
    fields: [["Kickoff", item.kickoff], ["Matchday", item.matchday], ["Country", item.country], ["League", item.league], ["Match", item.match], ["Market", item.market], ["Odds", item.odds], ["Users", String(item.users)], ["Stake", `${item.stake}u`], ["Exposure", `${item.exposure}u`], ["Status", item.status], ["Source", item.source]],
    actions: ["Open bet slips", "Adjust odds note", "Suspend market", "Export fixture"],
    note: item.status === "Date confirmed" ? "The season date is confirmed, but exact kickoff/team-time board still requires final broadcaster confirmation." : item.status === "Risk review" ? "This market is flagged because exposure or user behavior needs manual review before promotion." : "Fixture row is ready for operator monitoring and odds review.",
  };
}

function leagueDailyFixtureDetail(item: LeagueDailyFixture): Detail {
  return {
    title: `${item.league} · ${item.match}`,
    kicker: "Daily schedule odds",
    fields: [["Date", item.date], ["Time", item.time], ["League", item.league], ["Matchday", item.matchday], ["Match", item.match], ["Moneyline", item.moneyline], ["Handicap", item.handicap], ["Total", item.total], ["Featured odds", item.featured], ["Status", item.status]],
    actions: ["Open bet slip", "Adjust odds", "Create risk note", "Export fixture"],
    note: "This daily board is shown on the individual league page so operators can scan every day's matches with core odds in one place.",
  };
}

function leagueBetTypeDetail(type: string, rows: LeagueBetSlip[]): Detail {
  const stake = rows.reduce((sum, slip) => sum + slip.stake, 0);
  const exposure = Math.round(rows.reduce((sum, slip) => sum + slip.potentialPayout, 0) * 100) / 100;
  return {
    title: `Bet type · ${type}`,
    kicker: "League Bets",
    fields: [["Type", type], ["Slip count", String(rows.length)], ["Stake", `${stake}u`], ["Potential payout", `${exposure}u`], ["Open slips", String(rows.filter((slip) => slip.status === "Open" || slip.status === "Pending").length)], ["Risk holds", String(rows.filter((slip) => slip.status === "Risk hold" || slip.risk === "High").length)]],
    actions: ["Open slips", "Export type report", "Set max stake", "Create audit note"],
    note: rows.length ? rows.map((slip) => `${slip.id}: ${slip.user} ${slip.stake}u on ${slip.selection}`).join(" | ") : "No slips in this bet type.",
  };
}

function leagueBetSlipDetail(slip: LeagueBetSlip): Detail {
  return {
    title: `${slip.id} · ${slip.match}`,
    kicker: "League bet slip",
    fields: [["Time", slip.time], ["User", slip.user], ["League", slip.league], ["Match", slip.match], ["Market", slip.market], ["Selection", slip.selection], ["Odds", slip.odds.toFixed(2)], ["Stake", `${slip.stake}u`], ["Potential payout", `${slip.potentialPayout}u`], ["Bet type", slip.betType], ["Status", slip.status], ["Risk", slip.risk]],
    actions: ["Open user", "Approve settlement", "Hold slip", "Export slip"],
    note: slip.status === "Risk hold" ? "This slip is held because live-market exposure is above the configured operator threshold." : "This slip is available for operator review in the five-league betting desk.",
  };
}

function receiptDetail(receipt: typeof leagueBetReceipts[number]): Detail {
  const sameDaySlips = leagueBetSlips.filter((slip) => slip.time.slice(0, 10) === receipt.date);
  return {
    title: `Receipt · ${receipt.date}`,
    kicker: "Five-league receipt",
    fields: [["Date", receipt.date], ["Amount", `${receipt.amount}u`], ["Source", receipt.source], ["Status", receipt.status], ["Slip stake", `${sameDaySlips.reduce((sum, slip) => sum + slip.stake, 0)}u`], ["Slip count", String(sameDaySlips.length)]],
    actions: ["Open receipt", "Export receipt", "Create audit note"],
    note: sameDaySlips.length ? sameDaySlips.map((slip) => `${slip.id}: ${slip.user} ${slip.stake}u on ${slip.selection}`).join(" | ") : "Receipt is included in wallet balance but has no same-day slip rows.",
  };
}

function dateLedgerDetail(row: DateLedgerRow): Detail {
  return {
    title: `Daily ledger · ${row.date}`,
    kicker: "Ledger by Date",
    fields: [["Date", row.date], ["Deposits", `${row.deposits}u`], ["Sports stakes", `${row.sportsStakes}u`], ["League stake", `${row.leagueStake}u`], ["League receipts", `${row.leagueReceipts}u`], ["Wheel income", `${row.wheelIncome}u`], ["Payouts", `${row.payouts}u`], ["Withdrawals", `${row.exchangeWithdrawals}u`], ["Reconciliation", `${row.reconciliation}u`], ["Net movement", `${row.net}u`], ["Balance after", `${row.balanceAfter}u`]],
    actions: ["Open day slips", "Export date ledger", "Create audit note"],
    note: row.items.join(" | "),
  };
}

function incomeSummaryDetail(label: string, row: IncomeSummaryRow): Detail {
  return {
    title: `${label} · ${row.period}`,
    kicker: "Income Summary",
    fields: [["Period", row.period], ["Total income", `${row.total}u`], ["Records", String(row.items.length)], ["Calculation", "All income combined"]],
    actions: ["Export income summary", "Open source records", "Create audit note"],
    note: row.items.join(" | "),
  };
}

function ledgerBalanceDetail(): Detail {
  const latest = dateLedgerRows.at(-1);
  return {
    title: "Ledger balance reconciliation",
    kicker: "Ledger by Date",
    fields: [["Ledger final balance", `${dateLedgerFinalBalance}u`], ["Platform balance", `${platformBalance}u`], ["Difference", `${dateLedgerDelta}u`], ["Latest ledger date", latest?.date ?? "None"], ["Five-league receipts", `${leagueBetReceiptTotal}u`], ["Five-league slip stake", `${leagueBetStakeTotal}u`], ["Ledger rows", String(dateLedgerRows.length)]],
    actions: ["Export ledger", "Open wallet report", "Create audit note"],
    note: dateLedgerDelta === 0 ? "Ledger by Date matches the platform wallet balance." : "Ledger by Date needs review because the computed balance differs from the platform wallet balance.",
  };
}

function olCompanionDetail(item: typeof olCompanionModules[number]): Detail {
  return {
    title: `OL Companion · ${item.name}`,
    kicker: "Ligue 1 integration",
    fields: [["Module", item.name], ["Status", item.status], ["Local source", item.path], ["Repository", "https://github.com/Sylad/ol-companion"], ["Mode", "Embedded into admin league page as an operator module"]],
    actions: ["Open module notes", "Map to live desk", "Create source audit", "Export Ligue 1 board"],
    note: "The downloaded project is a full Ligue 1 companion app. This admin integrates its fixtures, standings, live-match, and news concepts without adding a second backend service to the Zeabur deployment.",
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
    fields: [["Match", match], ["Final score", "Spain 0:2 France"], ["Total stake", `${rows.reduce((sum, bet) => sum + bet.stake, 0)}u`], ["Bettors", String(new Set(rows.map((bet) => bet.user.id)).size)], ["Date", "2026-07-15"], ["Paid/merged payouts", `${postJulyTenthManualPayouts.toFixed(2)}u`], ["Payout remark", "Paid amount includes unresolved payouts from matches before 2026-07-15"]],
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
    fields: [["平台初始余额", `${openingWalletReserve}u`], ["7.10 baseline balance", `${targetPostJulyTenthBalance}u`], ["Confirmed deposits", `${totalDeposits}u`], ["Bet stakes", `${totalStakes}u`], ["Paid payouts before balance merge", `${paidPayouts.toFixed(2)}u`], ["Exchange withdrawals", `${exchangeWithdrawn}u`], ["Wallet reconciliation to 7.10", `${walletReconciliationAdjustment.toFixed(2)}u`], ["7.15 stakes", `${todayStakeTotal}u`], ["7.15 paid/merged payouts", `${todayPaidPayouts.toFixed(2)}u`], ["7.15 wallet change", `${todayWalletChange.toFixed(2)}u`], ["7.16 withdrawal", "-1000u"], ["8.2 withdrawal", "-1000u"], ["8.3 withdrawal", "-400u"], ["8.8 withdrawal", "-332.75u"], ["8.23 withdrawal", "-240u"], ["August withdrawals", `-${augustWithdrawals}u`], ["7.20 deposits", `${postJulyFifteenthDeposits}u`], ["7.20-8.22 sports stakes", `${postJulyFifteenthStakes}u`], ["Balance before league receipts", `${platformBalanceBeforeLeagueBetMerge}u`], ["League Bets stake total", `${leagueBetStakeTotal}u`], ["Already counted league stake", `-${leagueBetStakeAlreadyInSportsLedger}u`], ["League Bets net wallet increase", `${leagueBetWalletStakeAdjustment}u`], ["Five-league receipt total", `${leagueBetReceiptTotal}u`], ["8.27 LaLiga receipts", "30u"], ["8.26 five-league receipts", "50u"], ["8.25 five-league receipts", "95u"], ["8.24 five-league receipts", "60u"], ["8.23 five-league receipts", "85u"], ["8.22 five-league receipts", "208u"], ["8.21 Premier League receipt", "10u"], ["8.18-8.20 early receipts", "37u"], ["8.8 wheel income", "20u"], ["8.10 wheel income", "15u"], ["8.11 wheel income", "5u"], ["8.16 wheel income", "20u"], ["8.17 wheel income", "19u"], ["8.18 wheel income", "22u"], ["8.19 wheel income", "18u"], ["8.20 wheel income", "23u"], ["8.21 wheel income", "21u"], ["Wheel income total", `${wheelIncomeTotal}u`], ["Current platform balance", `${platformBalance}u`]],
    actions: ["Open withdrawal modal", "Export wallet report", "Create audit note"],
    note: "Current balance is calculated after 8.27 LaLiga receipts and the 8.23 exchange treasury withdrawal.",
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
