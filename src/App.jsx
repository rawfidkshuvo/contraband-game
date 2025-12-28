import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  arrayUnion,
  increment,
  collection,
} from "firebase/firestore";
import {
  Package,
  Siren,
  ShieldCheck,
  AlertOctagon,
  Coins,
  LogOut,
  History,
  BookOpen,
  X,
  Crown,
  User,
  RotateCcw,
  Home,
  CheckCircle,
  Briefcase,
  Box,
  Cpu,
  Zap,
  Skull,
  Cross,
  Utensils,
  Hammer,
  ShoppingBag,
  TrendingUp,
  Eye,
  Handshake,
  Ghost,
  Lock,
  Flag,
  Bomb,
  Scan,
  BadgeDollarSign,
  Layers,
  Info,
  Clock,
  Calendar,
  FileText,
  CreditCard,
  ChevronRight,
  TrendingDown,
  Trash,
  Sparkles,
} from "lucide-react";

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyBjIjK53vVJW1y5RaqEFGSFp0ECVDBEe1o",
  authDomain: "game-hub-ff8aa.firebaseapp.com",
  projectId: "game-hub-ff8aa",
  storageBucket: "game-hub-ff8aa.firebasestorage.app",
  messagingSenderId: "586559578902",
  appId: "1:586559578902:web:2af23956db92c5956aa637",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const APP_ID = typeof __app_id !== "undefined" ? __app_id : "contraband-game";
const GAME_ID = "12";
// --- Game Constants ---
const STARTING_COINS = 5000;
const BANK_LOAN = 5000;

const ROLES = {
  DIPLOMAT: {
    id: "DIPLOMAT",
    name: "Diplomat",
    desc: "Pay 50% less fines.",
    icon: Flag,
    color: "text-blue-400",
  },
  YAKUZA: {
    id: "YAKUZA",
    name: "Yakuza",
    desc: "+20% value for Contraband.",
    icon: Ghost,
    color: "text-purple-400",
  },
  SNITCH: {
    id: "SNITCH",
    name: "Snitch",
    desc: "Earn $500 whenever another player is fined.",
    icon: Eye,
    color: "text-yellow-400",
  },
  MERCHANT: {
    id: "MERCHANT",
    name: "Merchant",
    desc: "+20% value for Legal Goods.",
    icon: Briefcase,
    color: "text-emerald-400",
  },
};

const EVENTS = {
  NORMAL: {
    id: "NORMAL",
    name: "Market Stable",
    desc: "Business as usual.",
    multiplier: 1,
    target: null,
  },
  WAR: {
    id: "WAR",
    name: "War Zone",
    desc: "Weapons value x2.",
    multiplier: 2,
    target: "WEAPON",
  },
  PANDEMIC: {
    id: "PANDEMIC",
    name: "Pandemic",
    desc: "Meds value x2.",
    multiplier: 2,
    target: "MEDS",
  },
  CRACKDOWN: {
    id: "CRACKDOWN",
    name: "Police Crackdown",
    desc: "All Fines Double.",
    multiplier: 2,
    target: "ALL_FINES",
  },
  FREE_TRADE: {
    id: "FREE_TRADE",
    name: "Free Trade",
    desc: "All Fines Halved.",
    multiplier: 0.5,
    target: "ALL_FINES",
  },
};

const SHOP_ITEMS = {
  POCKETS: {
    id: "POCKETS",
    name: "Deep Pockets",
    desc: "Hand Size +1 (Immediate Draw)",
    cost: 3000,
    icon: Briefcase,
  },
  EXPANDED: {
    id: "EXPANDED",
    name: "Crate Extension",
    desc: "Load up to 5 cards",
    cost: 5000,
    icon: Box,
  },
  CONCEAL: {
    id: "CONCEAL",
    name: "Hidden Compartment",
    desc: "First illegal item is safe per inspection",
    cost: 4000,
    icon: Lock,
  },
  SCANNER: {
    id: "SCANNER",
    name: "X-Ray Scanner",
    desc: "As Inspector, reveal 1 random card per crate",
    cost: 4000,
    icon: Scan,
  },
};

const GOODS = {
  // LEGAL
  MEDS: {
    id: "MEDS",
    name: "Medkits",
    val: 1000,
    penalty: 1000,
    type: "LEGAL",
    icon: Cross,
    color: "text-green-400",
  },
  FOOD: {
    id: "FOOD",
    name: "Rations",
    val: 1500,
    penalty: 1000,
    type: "LEGAL",
    icon: Utensils,
    color: "text-green-300",
  },
  PARTS: {
    id: "PARTS",
    name: "Machinery",
    val: 2000,
    penalty: 1000,
    type: "LEGAL",
    icon: Hammer,
    color: "text-green-200",
  },
  // CONTRABAND
  CHIP: {
    id: "CHIP",
    name: "AI Core",
    val: 6000,
    penalty: 4000,
    type: "ILLEGAL",
    icon: Cpu,
    color: "text-red-400",
  },
  WEAPON: {
    id: "WEAPON",
    name: "Plasma Rifle",
    val: 8000,
    penalty: 5000,
    type: "ILLEGAL",
    icon: Zap,
    color: "text-red-500",
  },
  NARCO: {
    id: "NARCO",
    name: "Stims",
    val: 10000,
    penalty: 6000,
    type: "ILLEGAL",
    icon: Skull,
    color: "text-purple-500",
  },
  // SPECIAL
  TRAP: {
    id: "TRAP",
    name: "Booby Trap",
    val: 0,
    penalty: 0,
    type: "TRAP",
    icon: Bomb,
    color: "text-orange-500",
    desc: "If opened: Inspector pays $2000",
  },
};

const ContrabandLogo = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Package size={12} className="text-emerald-400" />
    <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">
      CONTRABAND
    </span>
  </div>
);

// Deck Template - Scaled for Player Count
const generateDeck = (playerCount) => {
  let deck = [];
  // Linear scaling: ~35 cards per player
  const counts = {
    MEDS: 6 * playerCount,
    FOOD: 6 * playerCount,
    PARTS: 6 * playerCount,
    CHIP: 4 * playerCount,
    WEAPON: 4 * playerCount,
    NARCO: 4 * playerCount,
    TRAP: 1 * playerCount, //chaged from 2 to 1
  };
  Object.entries(counts).forEach(([type, count]) => {
    for (let i = 0; i < count; i++) deck.push(type);
  });
  return deck;
};

const shuffle = (array) => {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
};

// Helper: Draw a card but prevent more than 1 Trap in hand
const drawSafeCard = (deck, currentHand) => {
  if (deck.length === 0) return null;
  let rejected = [];
  let card = null;
  const hasTrap = currentHand.includes("TRAP");
  while (deck.length > 0) {
    let candidate = deck.pop();
    if (candidate === "TRAP" && hasTrap) {
      rejected.push(candidate);
    } else {
      card = candidate;
      break;
    }
  }
  if (rejected.length > 0) deck.unshift(...rejected);
  return card;
};

// Helper: Assign random roles
const assignRandomRoles = (players) => {
  const rolesKeys = Object.keys(ROLES);
  const pool = [...rolesKeys];
  while (pool.length < players.length) pool.push(...rolesKeys);
  const shuffledRoles = shuffle(pool);
  return players.map((p, i) => ({ ...p, role: ROLES[shuffledRoles[i]].id }));
};

// Helper to update detailed round stats with RICH transactions
const getUpdatedStats = (currentStats, playerId, updates) => {
  const playerStats = currentStats[playerId] || {
    income: 0,
    expense: 0,
    transactions: [],
    role: "",
    isInspector: false,
    marketItems: [],
    roleBonus: 0,
  };

  const newTransactions = updates.transaction
    ? [...(playerStats.transactions || []), updates.transaction]
    : playerStats.transactions || [];
  const newMarketItems = updates.marketItem
    ? [...(playerStats.marketItems || []), updates.marketItem]
    : playerStats.marketItems || [];

  return {
    ...currentStats,
    [playerId]: {
      ...playerStats,
      ...updates,
      income: (playerStats.income || 0) + (updates.income || 0),
      expense: (playerStats.expense || 0) + (updates.expense || 0),
      roleBonus: (playerStats.roleBonus || 0) + (updates.roleBonus || 0),
      transactions: newTransactions,
      marketItems: newMarketItems,
    },
  };
};

// --- Sub-Components ---

const FloatingBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black" />
    <div className="absolute top-0 left-0 w-full h-full bg-emerald-900/5 mix-blend-overlay" />
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage:
          "linear-gradient(45deg, #064e3b 25%, transparent 25%, transparent 75%, #064e3b 75%, #064e3b), linear-gradient(45deg, #064e3b 25%, transparent 25%, transparent 75%, #064e3b 75%, #064e3b)",
        backgroundPosition: "0 0, 10px 10px",
        backgroundSize: "20px 20px",
      }}
    ></div>
  </div>
);

const CardIcon = ({ typeId, size = 12 }) => {
  const info = GOODS[typeId];
  if (!info) return null;
  return <info.icon size={size} className={info.color} />;
};

const ReportCard = ({ players, roundData, isFinal }) => {
  const [activeTab, setActiveTab] = useState(isFinal ? "FINAL" : 0);

  // Tabs for final view
  const tabs = isFinal
    ? ["FINAL", ...roundData.map((_, i) => `ROUND ${i + 1}`)]
    : [];

  const renderTable = (data, isFinalView) => {
    let displayData = [];

    if (isFinalView) {
      displayData = players.map((p) => {
        let stashBonus = 0;
        let totalRoleBonus = 0;
        let bonusBreakdown = [];
        const stash = p.stash || [];

        // 2. Aggregate per-round bonuses (Snitch, Diplomat, etc) from history
        let roundBonusTotal = 0;
        roundData.forEach((r, i) => {
          const rStats = r.stats[p.id];
          if (rStats && rStats.roleBonus > 0) {
            roundBonusTotal += rStats.roleBonus;
            bonusBreakdown.push(
              `R${i + 1} (${ROLES[rStats.role]?.name}): +$${rStats.roleBonus}`
            );
          }
        });
        totalRoleBonus += roundBonusTotal;

        const total = Math.floor(p.coins + stashBonus - BANK_LOAN);
        const stashTotal = stash.reduce(
          (acc, c) => acc + (GOODS[c]?.val || 0),
          0
        );

        return {
          id: p.id,
          name: p.name,
          role: p.role,
          cash: p.coins,
          stashVal: stashTotal,
          bonus: Math.floor(totalRoleBonus),
          bonusDetails: bonusBreakdown,
          loan: -BANK_LOAN,
          total,
          isWinner: false,
        };
      });
      displayData.sort((a, b) => b.total - a.total);
      if (displayData.length > 0) displayData[0].isWinner = true;
    } else {
      // Round View - Detailed
      const roundIdx =
        typeof activeTab === "string"
          ? parseInt(activeTab.split(" ")[1]) - 1
          : activeTab;
      // Handle the new structure { stats, event }
      const roundEntry = Array.isArray(roundData)
        ? roundData[
            activeTab === "FINAL"
              ? 0
              : typeof activeTab === "number"
              ? activeTab
              : parseInt(activeTab.split(" ")[1]) - 1
          ]
        : null;
      const stats = roundEntry ? roundEntry.stats : null;
      const roundEvent = roundEntry ? roundEntry.event : null;

      if (!stats)
        return (
          <div className="p-12 text-center text-zinc-500 italic">
            No Data Available
          </div>
        );

      displayData = Object.keys(stats).map((pid) => {
        const pStat = stats[pid];
        const pName = players.find((pl) => pl.id === pid)?.name || "Unknown";
        return {
          id: pid,
          name: pName,
          role: pStat.role,
          isInspector: pStat.isInspector,
          marketItems: pStat.marketItems || [],
          roleBonus: pStat.roleBonus || 0,
          transactions: pStat.transactions || [],
          income: pStat.income,
          expense: pStat.expense,
          net: pStat.income - pStat.expense,
          activeEvent: roundEvent,
        };
      });
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-900/50 text-xs uppercase text-zinc-500 font-bold tracking-wider">
              <th className="px-6 py-3 border-b border-zinc-800">Agent</th>
              {isFinalView ? (
                <>
                  <th className="px-6 py-3 border-b border-zinc-800 text-right">
                    Cash
                  </th>
                  <th className="px-6 py-3 border-b border-zinc-800 text-right text-emerald-300">
                    Stash
                  </th>
                  <th className="px-6 py-3 border-b border-zinc-800 text-right text-yellow-400">
                    All Role Bonuses
                  </th>
                  <th className="px-6 py-3 border-b border-zinc-800 text-right text-red-400">
                    Loan
                  </th>
                  <th className="px-6 py-3 border-b border-zinc-800 text-right text-white">
                    Final Score
                  </th>
                </>
              ) : (
                <>
                  <th className="px-6 py-3 border-b border-zinc-800">
                    Event Impact
                  </th>
                  <th className="px-6 py-3 border-b border-zinc-800">Market</th>
                  <th className="px-6 py-3 border-b border-zinc-800">
                    Role Bonus
                  </th>
                  <th className="px-6 py-3 border-b border-zinc-800 w-1/3">
                    Activity Log
                  </th>
                  <th className="px-6 py-3 border-b border-zinc-800 text-right">
                    Net Change
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-sm">
            {displayData.map((d, i) => {
              if (isFinalView) {
                return (
                  <tr
                    key={d.id}
                    className={`group hover:bg-zinc-800/30 transition-colors ${
                      d.isWinner ? "bg-emerald-900/10" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center w-6 h-6 rounded-full font-bold text-[10px] ${
                            d.isWinner
                              ? "bg-yellow-500 text-black"
                              : "bg-zinc-800 text-zinc-500"
                          }`}
                        >
                          {i + 1}
                        </div>
                        <span
                          className={`font-medium ${
                            d.isWinner ? "text-white" : "text-zinc-400"
                          }`}
                        >
                          {d.name}
                        </span>
                        {d.isWinner && (
                          <Crown size={14} className="text-yellow-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-zinc-400">
                      ${d.cash}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-emerald-300">
                      ${d.stashVal}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-mono text-yellow-400">
                          +{d.bonus}
                        </span>
                        {d.bonusDetails.map((det, idx) => (
                          <span key={idx} className="text-[9px] text-zinc-500">
                            {det}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-red-400">
                      {d.loan}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-white text-lg">
                      ${d.total}
                    </td>
                  </tr>
                );
              } else {
                return (
                  <tr key={d.id} className="group hover:bg-zinc-800/30">
                    <td className="px-6 py-4 align-top">
                      <div className="font-medium text-white mb-1">
                        {d.name}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-zinc-500 mb-2">
                        {d.isInspector ? (
                          <ShieldCheck size={12} className="text-blue-400" />
                        ) : (
                          <User size={12} />
                        )}
                        {d.isInspector ? "Inspector" : ROLES[d.role]?.name}
                      </div>
                    </td>

                    <td className="px-6 py-4 align-top">
                      {d.activeEvent && (
                        <div className="text-xs text-zinc-400">
                          <div className="font-bold text-zinc-300">
                            {d.activeEvent.name}
                          </div>
                          <div className="text-[10px] italic">
                            {d.activeEvent.desc}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 align-top">
                      {d.marketItems.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {d.marketItems.map((item, idx) => {
                            const S = SHOP_ITEMS[item];
                            return (
                              <div
                                key={idx}
                                className="text-xs text-zinc-400 flex items-center gap-1"
                              >
                                <ShoppingBag size={10} /> {S?.name}{" "}
                                <span className="text-red-400">
                                  -${S?.cost}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-zinc-600 italic text-xs">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4 align-top">
                      {d.roleBonus > 0 ? (
                        <span className="text-yellow-400 font-mono text-xs">
                          +${d.roleBonus}
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-xs">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4 align-top">
                      <div className="space-y-2">
                        {d.transactions.length === 0 ? (
                          <span className="text-zinc-600 italic text-xs">
                            No activity.
                          </span>
                        ) : (
                          d.transactions.map((t, idx) => (
                            <div
                              key={idx}
                              className="flex flex-col text-xs border-b border-zinc-800 pb-1 last:border-0"
                            >
                              <div className="flex justify-between w-full">
                                <span className="text-zinc-300 font-bold">
                                  {t.label}
                                </span>
                                <span
                                  className={`font-mono ${
                                    t.amount >= 0
                                      ? "text-emerald-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {t.amount >= 0 ? "+" : ""}
                                  {t.amount}
                                </span>
                              </div>
                              {t.items && t.items.length > 0 && (
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {t.items.map((c, ci) => (
                                    <div
                                      key={ci}
                                      className="bg-black/40 p-0.5 rounded border border-zinc-700"
                                      title={GOODS[c]?.name}
                                    >
                                      <CardIcon typeId={c} size={10} />
                                    </div>
                                  ))}
                                </div>
                              )}
                              {t.detail && (
                                <div className="text-[10px] text-zinc-500 mt-0.5">
                                  {t.detail}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold align-top">
                      <span
                        className={
                          d.net >= 0 ? "text-emerald-400" : "text-red-400"
                        }
                      >
                        {d.net >= 0 ? "+" : ""}
                        {d.net}
                      </span>
                    </td>
                  </tr>
                );
              }
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl bg-zinc-900 rounded-xl border border-zinc-700 overflow-hidden shadow-2xl mb-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
      <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-900/30 rounded-lg border border-emerald-500/20">
            <FileText className="text-emerald-500" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Mission Report</h3>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">
              {isFinal ? "Final Operation Audit" : "Round Summary"}
            </p>
          </div>
        </div>
      </div>

      {isFinal && (
        <div className="flex border-b border-zinc-800 bg-zinc-900/50 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-bold transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? "text-emerald-400 border-b-2 border-emerald-500 bg-emerald-900/10"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {renderTable(roundData, isFinal && activeTab === "FINAL")}
    </div>
  );
};

const StashModal = ({ stash, onClose }) => (
  <div className="fixed inset-0 bg-black/90 z-[160] flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6 max-w-lg w-full shadow-2xl flex flex-col max-h-[80vh]">
      <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Briefcase className="text-emerald-500" /> Stash ({stash.length})
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-zinc-800 rounded text-zinc-400"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-4 gap-2">
        {stash.length === 0 ? (
          <div className="col-span-4 text-center text-zinc-500 py-8 italic">
            Your stash is empty.
          </div>
        ) : (
          stash.map((cId, i) => {
            const info = GOODS[cId];
            if (!info) return null;
            const isIllegal = info.type === "ILLEGAL";
            return (
              <div
                key={i}
                className={`p-2 rounded border flex flex-col items-center gap-1 ${
                  isIllegal
                    ? "bg-red-900/10 border-red-900/30"
                    : "bg-emerald-900/10 border-emerald-900/30"
                }`}
              >
                <info.icon size={24} className={info.color} />
                <span className={`text-[10px] font-bold ${info.color}`}>
                  {info.name}
                </span>
                <span className="text-[9px] text-zinc-500">${info.val}</span>
              </div>
            );
          })
        )}
      </div>
      <div className="mt-4 pt-2 border-t border-zinc-800 text-center text-xs text-zinc-500">
        Total Base Value: $
        {stash.reduce((acc, c) => acc + (GOODS[c]?.val || 0), 0)}
      </div>
    </div>
  </div>
);

const Card = ({ typeId, small, selected, onClick, faceDown }) => {
  const info = GOODS[typeId];
  if (!info) return null;
  const Icon = info.icon;
  const isIllegal = info.type === "ILLEGAL";
  const isTrap = info.type === "TRAP";

  if (faceDown) {
    return (
      <div
        className={`
        relative rounded-xl border-2 border-zinc-700 bg-zinc-800 
        flex flex-col items-center justify-center shadow-lg
        ${small ? "w-10 h-14" : "w-20 h-32"}
      `}
      >
        <div className="opacity-20">
          <Package size={small ? 16 : 32} />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-xl border-2 flex flex-col items-center justify-between shadow-lg transition-all 
        ${
          selected
            ? "ring-4 ring-yellow-400 -translate-y-2 z-10 scale-105"
            : "hover:-translate-y-1"
        }
        ${
          isTrap
            ? "bg-orange-950/50 border-orange-600/50"
            : isIllegal
            ? "bg-red-950/30 border-red-900/50"
            : "bg-emerald-950/30 border-emerald-900/50"
        }
        ${small ? "w-12 h-16 p-1" : "w-24 h-36 md:w-32 md:h-44 p-2 md:p-3"}
        ${onClick ? "cursor-pointer" : ""}
      `}
    >
      <div className="w-full flex justify-between items-start">
        <span
          className={`font-black ${
            small ? "text-[8px]" : "text-xs"
          } text-zinc-500`}
        >
          {isTrap ? "TRAP" : isIllegal ? "!!" : "OK"}
        </span>
        <Icon size={small ? 10 : 16} className={info.color} />
      </div>

      <div className="flex flex-col items-center gap-1">
        <Icon
          size={small ? 16 : 32}
          className={`${info.color} drop-shadow-md`}
        />
        {!small && (
          <span
            className={`text-[10px] uppercase font-bold text-center leading-tight ${info.color}`}
          >
            {info.name}
          </span>
        )}
      </div>

      {!small && (
        <div className="w-full bg-black/40 rounded p-1 text-[8px] text-zinc-400 text-center leading-tight">
          {isTrap ? (
            "Inspector pays fine"
          ) : (
            <>
              val: {info.val} <br /> fine: {info.penalty}
            </>
          )}
        </div>
      )}
    </div>
  );
};

const LeaveConfirmModal = ({ onConfirm, onCancel, isHost, onLobby }) => (
  <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-zinc-900 rounded-xl border border-zinc-700 p-6 max-w-sm w-full text-center shadow-2xl">
      <h3 className="text-xl font-bold text-white mb-2">
        {isHost ? "Disband Operation?" : "Abandon Cargo?"}
      </h3>
      <p className="text-zinc-400 mb-6 text-sm">
        {isHost
          ? "You are the Host. Leaving will close the checkpoint and kick all players."
          : "Leaving now will forfeit your progress."}
      </p>
      <div className="flex flex-col gap-3">
        {isHost && onLobby && (
          <button
            onClick={onLobby}
            className="bg-zinc-700 hover:bg-zinc-600 text-white py-3 rounded font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Home size={18} /> Return Everyone to Lobby
          </button>
        )}
        <button
          onClick={onConfirm}
          className="bg-red-900/80 hover:bg-red-800 text-red-200 py-3 rounded font-bold transition-colors flex items-center justify-center gap-2 border border-red-900"
        >
          <LogOut size={18} /> {isHost ? "Destroy Room & Exit" : "Leave Game"}
        </button>
        <button
          onClick={onCancel}
          className="text-zinc-500 hover:text-white py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

const FeedbackOverlay = ({ type, message, subtext, icon: Icon }) => (
  <div className="fixed inset-0 z-[160] flex items-center justify-center pointer-events-none p-4">
    <div
      className={`
      flex flex-col items-center justify-center p-8 md:p-12 rounded-3xl border-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] 
      transform transition-all animate-in fade-in zoom-in slide-in-from-bottom-5 duration-300 backdrop-blur-xl
      ${
        type === "success"
          ? "bg-emerald-900/90 border-emerald-500 text-emerald-100"
          : ""
      }
      ${type === "danger" ? "bg-red-900/90 border-red-500 text-red-100" : ""}
      ${
        type === "neutral" ? "bg-zinc-800/90 border-zinc-500 text-zinc-100" : ""
      }
      ${
        type === "bribe"
          ? "bg-yellow-900/90 border-yellow-500 text-yellow-100"
          : ""
      }
    `}
    >
      {Icon && (
        <div className="mb-4 p-4 bg-black/30 rounded-full border-2 border-white/20 shadow-xl">
          <Icon size={48} className="animate-bounce" />
        </div>
      )}
      <h2 className="text-4xl md:text-6xl font-black uppercase tracking-widest text-center drop-shadow-lg mb-2">
        {message}
      </h2>
      {subtext && (
        <p className="text-xl md:text-2xl font-bold opacity-90 tracking-wide text-center">
          {subtext}
        </p>
      )}
    </div>
  </div>
);

const ShopModal = ({ isOpen, onClose, player, onBuy }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-yellow-600/30 shadow-2xl overflow-hidden">
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-yellow-500 flex items-center gap-2">
            <ShoppingBag /> Black Market
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-white font-mono flex items-center gap-1 bg-zinc-800 px-3 py-1 rounded-full">
              <Coins size={14} className="text-yellow-500" /> ${player.coins}
            </span>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-full"
            >
              <X className="text-zinc-400" />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(SHOP_ITEMS).map((item) => {
            const hasItem = player.upgrades?.includes(item.id);
            const canAfford = player.coins >= item.cost;
            return (
              <div
                key={item.id}
                className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700 flex flex-col justify-between group hover:border-yellow-500/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-black/50 rounded-lg text-yellow-500">
                    <item.icon size={24} />
                  </div>
                  <span className="text-sm font-mono text-zinc-400">
                    ${item.cost}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-white mb-1">
                  {item.name}
                </h3>
                <p className="text-xs text-zinc-400 mb-4 h-8">{item.desc}</p>
                <button
                  onClick={() => onBuy(item)}
                  disabled={hasItem || !canAfford}
                  className={`w-full py-2 rounded font-bold text-sm transition-all
                    ${
                      hasItem
                        ? "bg-zinc-700 text-zinc-500 cursor-default"
                        : canAfford
                        ? "bg-yellow-600 hover:bg-yellow-500 text-black shadow-lg shadow-yellow-900/20"
                        : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    }`}
                >
                  {hasItem ? "OWNED" : canAfford ? "BUY" : "TOO POOR"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const LogViewer = ({ logs, onClose }) => (
  <div className="fixed inset-0 bg-black/90 z-[150] flex items-center justify-center p-0 md:p-4">
    <div className="bg-zinc-900 w-full md:max-w-md h-full md:h-[70vh] rounded-none md:rounded-xl flex flex-col border-none md:border border-zinc-700 shadow-2xl">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <History size={18} className="text-emerald-500" /> Operation Logs
        </h3>
        <button
          onClick={onClose}
          className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700"
        >
          <X className="text-zinc-400" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {[...logs].reverse().map((log, i) => (
          <div
            key={i}
            className={`text-xs md:text-sm p-3 rounded border-l-2 ${
              log.type === "danger"
                ? "bg-red-900/10 border-red-500 text-red-300"
                : log.type === "success"
                ? "bg-green-900/10 border-green-500 text-green-300"
                : log.type === "bribe"
                ? "bg-yellow-900/10 border-yellow-500 text-yellow-300"
                : "bg-zinc-800/50 border-zinc-600 text-zinc-400"
            }`}
          >
            <span className="opacity-50 mr-2 font-mono">
              [
              {new Date(parseInt(log.id)).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
              ]
            </span>
            {log.text}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const RulesModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/95 z-[150] flex items-center justify-center p-0 md:p-4 animate-in fade-in">
    <div className="bg-zinc-900 md:rounded-2xl w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] overflow-hidden border-none md:border border-emerald-500/30 flex flex-col shadow-2xl">
      <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 tracking-wider">
          <BookOpen className="text-emerald-500" /> Smuggler's Guide
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400"
        >
          <X />
        </button>
      </div>

      <div className="p-6 overflow-y-auto text-zinc-300 space-y-8 scrollbar-thin scrollbar-thumb-zinc-700">
        {/* Intro */}
        <section className="text-center space-y-2">
          <h3 className="text-3xl font-black text-emerald-400 uppercase tracking-widest">
            The Goal
          </h3>
          <p className="text-lg text-zinc-400">
            Amass the biggest fortune. Money is earned by smuggling goods and
            collecting fines. The player with the highest total value (Cash +
            Stash Bonus) when the deck runs out wins.
          </p>
        </section>

        {/* Game Loop */}
        <section className="grid md:grid-cols-3 gap-4">
          <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
            <h4 className="font-bold text-yellow-500 mb-2 flex items-center gap-2">
              <ShoppingBag size={16} /> 1. The Market
            </h4>
            <p className="text-sm">
              Buy illegal upgrades from the Black Market. Deep pockets, crate
              extensions, and scanners can turn the tide.
            </p>
          </div>
          <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
            <h4 className="font-bold text-emerald-500 mb-2 flex items-center gap-2">
              <Package size={16} /> 2. Load & Bluff
            </h4>
            <p className="text-sm">
              Pack up to 3 cards. You must declare a legal good type. You can
              lie. You can also attach a cash <strong>Bribe</strong> to tempt
              the Inspector.
            </p>
          </div>
          <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
            <h4 className="font-bold text-red-500 mb-2 flex items-center gap-2">
              <Siren size={16} /> 3. Inspection
            </h4>
            <p className="text-sm">
              The Inspector chooses to <strong>PASS</strong> or{" "}
              <strong>OPEN</strong>. If passed, you sell goods immediately. If
              opened and caught lying, you pay a fine!
            </p>
          </div>
        </section>

        {/* Inspection Details */}
        <section className="bg-zinc-800/30 p-5 rounded-xl border border-zinc-700/50">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="text-emerald-500" /> Inspection Mechanics
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <ul className="space-y-2">
              <li className="flex gap-2">
                <span className="text-green-400 font-bold min-w-[60px]">
                  PASS:
                </span>{" "}
                Smuggler keeps goods & earns full value immediately.
              </li>
              <li className="flex gap-2">
                <span className="text-yellow-400 font-bold min-w-[60px]">
                  BRIBE:
                </span>{" "}
                If Inspector accepts bribe, crate passes. Inspector keeps bribe.
              </li>
              <li className="flex gap-2">
                <span className="text-orange-400 font-bold min-w-[60px]">
                  TRAP:
                </span>{" "}
                If opened crate has a{" "}
                <span className="text-orange-500 font-bold">Booby Trap</span>,
                Inspector pays $2000 fine!
              </li>
            </ul>
            <ul className="space-y-2">
              <li className="flex gap-2">
                <span className="text-red-400 font-bold min-w-[60px]">
                  BUSTED:
                </span>{" "}
                If opened & lying (or contraband): Smuggler pays fine. Illegal
                goods seized.
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 font-bold min-w-[60px]">
                  CLEAN:
                </span>{" "}
                If opened & telling truth: Inspector pays fine to Smuggler for
                wasting time.
              </li>
            </ul>
          </div>
        </section>

        {/* Roles */}
        <section>
          <h3 className="text-xl font-bold text-white mb-4">Player Roles</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-2 font-bold text-blue-400 mb-1">
                <Flag size={16} /> Diplomat
              </div>
              <div className="text-xs text-zinc-400">
                Pays 50% less fines when caught.
              </div>
            </div>
            <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
              <div className="flex items-center gap-2 font-bold text-purple-400 mb-1">
                <Ghost size={16} /> Yakuza
              </div>
              <div className="text-xs text-zinc-400">
                +20% immediate value for Illegal goods.
              </div>
            </div>
            <div className="p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
              <div className="flex items-center gap-2 font-bold text-emerald-400 mb-1">
                <Briefcase size={16} /> Merchant
              </div>
              <div className="text-xs text-zinc-400">
                +20% immediate value for Legal goods.
              </div>
            </div>
            <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center gap-2 font-bold text-yellow-400 mb-1">
                <Eye size={16} /> Snitch
              </div>
              <div className="text-xs text-zinc-400">
                Get $500 whenever someone else is fined.
              </div>
            </div>
          </div>
        </section>

        {/* Events */}
        <section>
          <h3 className="text-xl font-bold text-white mb-4">Global Events</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-3 p-2 bg-zinc-800 rounded">
              <Bomb size={16} className="text-red-500" />{" "}
              <span>
                <strong>War Zone:</strong> Weapons sell for 2x value.
              </span>
            </div>
            <div className="flex items-center gap-3 p-2 bg-zinc-800 rounded">
              <Skull size={16} className="text-purple-500" />{" "}
              <span>
                <strong>Pandemic:</strong> Meds sell for 2x value.
              </span>
            </div>
            <div className="flex items-center gap-3 p-2 bg-zinc-800 rounded">
              <Siren size={16} className="text-blue-500" />{" "}
              <span>
                <strong>Crackdown:</strong> All fines are doubled.
              </span>
            </div>
            <div className="flex items-center gap-3 p-2 bg-zinc-800 rounded">
              <TrendingUp size={16} className="text-green-500" />{" "}
              <span>
                <strong>Free Trade:</strong> All fines are halved.
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
);

// --- Main Component ---
export default function ContrabandGame() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("menu");
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isMaintenance, setIsMaintenance] = useState(false);

  // UI States
  const [showRules, setShowRules] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showStash, setShowStash] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Interaction States
  const [selectedCards, setSelectedCards] = useState([]);
  const [declaredType, setDeclaredType] = useState("MEDS");
  const [bribeAmount, setBribeAmount] = useState(0);
  const [lastBribeUpdate, setLastBribeUpdate] = useState(0);

  // --- Auth & Listener ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- Session Restoration ---
  useEffect(() => {
    const savedRoomId = localStorage.getItem("contraband_roomId");
    if (savedRoomId) {
      setRoomId(savedRoomId);
    }
  }, []);

  useEffect(() => {
    if (!roomId || !user) return;
    const unsub = onSnapshot(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (!data.players?.some((p) => p.id === user.uid)) {
            // Player was likely kicked or game ended
            setRoomId("");
            setView("menu");
            localStorage.removeItem("contraband_roomId");
            setError("Connection Lost or Room Closed.");
            return;
          }
          setGameState(data);
          if (data.status === "lobby") setView("lobby");
          else setView("game");

          if (
            data.feedbackTrigger &&
            data.feedbackTrigger.id !== gameState?.feedbackTrigger?.id
          ) {
            setFeedback(data.feedbackTrigger);
            setTimeout(() => setFeedback(null), 3000);
          }
        } else {
          setRoomId("");
          setView("menu");
          localStorage.removeItem("contraband_roomId");
          setError("Room Closed.");
        }
      }
    );
    return () => unsub();
  }, [roomId, user, gameState?.feedbackTrigger?.id]);

  // --- Helpers ---
  const me = gameState?.players.find((p) => p.id === user?.uid) || {};
  const isInspector =
    gameState?.players[gameState?.inspectorIndex]?.id === user?.uid;
  const isHost = gameState?.hostId === user?.uid;
  const currentEvent = gameState?.marketEvent
    ? EVENTS[gameState.marketEvent.id]
    : EVENTS.NORMAL;

  const totalRounds = gameState?.players.length || 0;

  useEffect(() => {
    if (me.loadedCrate && me.loadedCrate.bribe !== undefined) {
      setBribeAmount(me.loadedCrate.bribe);
    }
  }, [me.loadedCrate]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "game_hub_settings", "config"), (doc) => {
      if (doc.exists() && doc.data()[GAME_ID]?.maintenance)
        setIsMaintenance(true);
      else setIsMaintenance(false);
    });
    return () => unsub();
  }, []);

  // --- Game Actions ---
  const createRoom = async () => {
    if (!playerName.trim()) return setError("Codename required.");
    setLoading(true);
    const newId = Math.random().toString(36).substring(2, 7).toUpperCase();

    const initialData = {
      roomId: newId,
      hostId: user.uid,
      status: "lobby",
      players: [
        {
          id: user.uid,
          name: playerName,
          coins: STARTING_COINS,
          hand: [],
          stash: [],
          upgrades: [],
          role: null,
          loadedCrate: null,
          ready: false,
        },
      ],
      deck: [],
      inspectorIndex: 0,
      turnState: "IDLE",
      marketEvent: EVENTS.NORMAL,
      logs: [],
      currentRound: 1,
      inspectorOrder: [],
      roundHistory: [],
      currentRoundStats: {},
    };
    await setDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", newId),
      initialData
    );
    localStorage.setItem("contraband_roomId", newId);
    setRoomId(newId);
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!roomCodeInput || !playerName) return setError("Missing Info.");
    setLoading(true);
    try {
      const ref = doc(
        db,
        "artifacts",
        APP_ID,
        "public",
        "data",
        "rooms",
        roomCodeInput
      );
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error("Room not found.");
      if (snap.data().status !== "lobby") throw new Error("Game in progress.");
      if (snap.data().players.length >= 6) throw new Error("Full.");

      const newPlayer = {
        id: user.uid,
        name: playerName,
        coins: STARTING_COINS,
        hand: [],
        stash: [],
        upgrades: [],
        role: null,
        loadedCrate: null,
        ready: false,
      };
      await updateDoc(ref, { players: arrayUnion(newPlayer) });
      localStorage.setItem("contraband_roomId", roomCodeInput);
      setRoomId(roomCodeInput);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const leaveRoom = async () => {
    if (!roomId) return;
    const ref = doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId);
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        if (data.hostId === user.uid) {
          await deleteDoc(ref);
        } else {
          const updatedPlayers = data.players.filter((p) => p.id !== user.uid);
          await updateDoc(ref, { players: updatedPlayers });
        }
      }
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem("contraband_roomId");
    setRoomId("");
    setView("menu");
    setShowLeaveConfirm(false);
  };

  const kickPlayer = async (playerId) => {
    if (!isHost || !roomId) return;
    const updatedPlayers = gameState.players.filter((p) => p.id !== playerId);
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      { players: updatedPlayers }
    );
  };

  const returnToLobby = async () => {
    const resetPlayers = gameState.players.map((p) => ({
      ...p,
      coins: STARTING_COINS,
      hand: [],
      stash: [],
      upgrades: [],
      role: null,
      loadedCrate: null,
      ready: false,
    }));
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "lobby",
        players: resetPlayers,
        logs: [],
        deck: [],
        turnState: "IDLE",
        winner: null,
        feedbackTrigger: null,
        marketEvent: EVENTS.NORMAL,
        currentRound: 1,
        inspectorOrder: [],
        roundHistory: [],
        currentRoundStats: {},
      }
    );
    setShowLeaveConfirm(false);
  };

  const startGame = async () => {
    if (gameState.players.length < 3) return setError("Need 3+ Players.");
    const deck = shuffle(generateDeck(gameState.players.length));
    const inspectorOrder = shuffle(gameState.players.map((_, i) => i));

    const firstInspectorId = gameState.players[inspectorOrder[0]].id;
    const initialRoundStats = {};

    let players = assignRandomRoles(gameState.players);
    players = players.map((p) => {
      const hand = [];
      const handSize = 6;
      for (let j = 0; j < handSize; j++) {
        const card = drawSafeCard(deck, hand);
        if (card) hand.push(card);
      }

      initialRoundStats[p.id] = {
        role: p.role,
        isInspector: p.id === firstInspectorId,
        income: 0,
        expense: 0,
        transactions: [],
      };

      return {
        ...p,
        hand,
        coins: STARTING_COINS,
        stash: [],
        upgrades: [],
        loadedCrate: null,
        ready: false,
      };
    });

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "playing",
        players,
        deck,
        inspectorOrder,
        inspectorIndex: inspectorOrder[0],
        currentRound: 1,
        currentRoundStats: initialRoundStats,
        roundHistory: [],
        turnState: "SHOPPING",
        marketEvent: EVENTS.NORMAL,
        logs: [
          {
            id: Date.now().toString(),
            text: "Market Open. Roles Assigned.",
            type: "neutral",
          },
        ],
      }
    );
  };

  const toggleReady = async () => {
    const players = gameState.players.map((p) =>
      p.id === user.uid ? { ...p, ready: !p.ready } : p
    );

    // LOGIC 1: End of Market Phase
    if (
      gameState.status === "playing" &&
      gameState.turnState === "SHOPPING" &&
      players.every((p) => p.ready)
    ) {
      players.forEach((p) => (p.ready = false));
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players,
          turnState: "LOADING",
          logs: arrayUnion({
            id: Date.now().toString(),
            text: "Loading Phase Begun.",
            type: "neutral",
          }),
        }
      );
      return;
    }

    // LOGIC 2: End of Round Summary (NEW)
    if (
      gameState.status === "playing" &&
      gameState.turnState === "ROUND_SUMMARY"
    ) {
      // If everyone is ready, proceed
      if (players.every((p) => p.ready)) {
        // Trigger the next round logic
        await startNextRound();
        return;
      }
    }

    // Standard ready toggle update
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      { players }
    );
  };

  const buyItem = async (item) => {
    if (me.coins < item.cost) return;
    let updatedDeck = [...gameState.deck];

    // Update stats
    let stats = getUpdatedStats(gameState.currentRoundStats, user.uid, {
      expense: item.cost,
      marketItem: item.id,
    });

    const players = gameState.players.map((p) => {
      if (p.id === user.uid) {
        let newHand = [...p.hand];
        if (item.id === "POCKETS" && updatedDeck.length > 0) {
          const card = drawSafeCard(updatedDeck, newHand);
          if (card) newHand.push(card);
        }
        return {
          ...p,
          hand: newHand,
          coins: p.coins - item.cost,
          upgrades: [...(p.upgrades || []), item.id],
        };
      }
      return p;
    });
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      { players, deck: updatedDeck, currentRoundStats: stats }
    );
  };

  const updateBribe = async () => {
    if (Date.now() - lastBribeUpdate < 2000) return;
    const newAmount = parseInt(bribeAmount);
    if (isNaN(newAmount) || newAmount < 0) return;
    const currentBribe = me.loadedCrate?.bribe || 0;
    const diff = newAmount - currentBribe;
    if (me.coins - diff < 0) return;
    setLastBribeUpdate(Date.now());
    const players = gameState.players.map((p) => {
      if (p.id === user.uid) {
        return {
          ...p,
          coins: p.coins - diff,
          loadedCrate: { ...p.loadedCrate, bribe: newAmount },
        };
      }
      return p;
    });
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      { players }
    );
  };

  const loadCrate = async () => {
    const maxCards = me.upgrades?.includes("EXPANDED") ? 5 : 4;
    if (selectedCards.length === 0 || selectedCards.length > maxCards) return;
    const bribeVal = Math.max(0, parseInt(bribeAmount) || 0);
    if (bribeVal > 0 && bribeVal > me.coins) return;
    const myIdx = gameState.players.findIndex((p) => p.id === user.uid);
    const players = [...gameState.players];
    const hand = [...players[myIdx].hand];
    const crateCards = [];
    [...selectedCards]
      .sort((a, b) => b - a)
      .forEach((idx) => {
        crateCards.push(hand[idx]);
        hand.splice(idx, 1);
      });
    players[myIdx].hand = hand;
    players[myIdx].coins -= bribeVal;
    players[myIdx].loadedCrate = {
      cards: crateCards,
      declaration: declaredType,
      bribe: bribeVal,
    };
    const inspectorId = players[gameState.inspectorIndex].id;
    const allLoaded = players.every(
      (p) => p.id === inspectorId || p.loadedCrate !== null
    );
    let update = { players };
    if (allLoaded) {
      update.turnState = "INSPECTING";
      update.logs = arrayUnion({
        id: Date.now().toString(),
        text: "Inspection Phase.",
        type: "neutral",
      });
    }
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      update
    );
    setSelectedCards([]);
    setBribeAmount(0);
  };

  const inspectCrate = async (targetId, action) => {
    const inspector = gameState.players[gameState.inspectorIndex];
    const players = [...gameState.players];
    const targetIdx = players.findIndex((p) => p.id === targetId);
    const inspectorIdx = players.findIndex((p) => p.id === inspector.id);
    const target = players[targetIdx];
    if (!target.loadedCrate) return;

    const inspectorHasScanner = inspector.upgrades?.includes("SCANNER");
    const targetHasConceal = target.upgrades?.includes("CONCEAL");
    const snitchBonus = players.filter(
      (p) => p.role === "SNITCH" && p.id !== target.id
    );

    let stats = { ...gameState.currentRoundStats };

    // Helper to apply Merchant/Yakuza bonuses immediately
    const applyGoodsBonus = (pIdx, items) => {
      const p = players[pIdx];
      let bonus = 0;
      if (p.role === "MERCHANT") {
        const legalItems = items.filter((c) => GOODS[c].type === "LEGAL");
        const val = legalItems.reduce((acc, c) => acc + (GOODS[c].val || 0), 0);
        bonus = Math.floor(val * 0.2);
      } else if (p.role === "YAKUZA") {
        const illegalItems = items.filter((c) => GOODS[c].type === "ILLEGAL");
        const val = illegalItems.reduce(
          (acc, c) => acc + (GOODS[c].val || 0),
          0
        );
        bonus = Math.floor(val * 0.2);
      }

      if (bonus > 0) {
        players[pIdx].coins += bonus;
        stats = getUpdatedStats(stats, p.id, {
          income: bonus,
          roleBonus: bonus,
          transaction: {
            label: `${ROLES[p.role].name} Bonus`,
            amount: bonus,
            detail: "Role ability triggered",
          },
        });
      }
    };

    // Peek Logic
    if (action === "PEEK") {
      if (target.loadedCrate.scanned) return;
      const randomCard =
        target.loadedCrate.cards[
          Math.floor(Math.random() * target.loadedCrate.cards.length)
        ];
      const updatedPlayers = [...players];
      updatedPlayers[targetIdx].loadedCrate = {
        ...updatedPlayers[targetIdx].loadedCrate,
        scanned: true,
      };
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players: updatedPlayers,
          logs: arrayUnion({
            id: Date.now().toString(),
            text: `Scanner reveals a ${GOODS[randomCard].name} in ${target.name}'s crate!`,
            type: "neutral",
          }),
          feedbackTrigger: {
            id: Date.now(),
            type: "neutral",
            message: "SCAN RESULT",
            subtext: `Found: ${GOODS[randomCard].name}`,
          },
        }
      );
      return;
    }

    let logs = [];
    let fb = null;

    if (action === "PASS" || action === "ACCEPT_BRIBE") {
      const bribe = target.loadedCrate.bribe || 0;
      if (action === "ACCEPT_BRIBE" && bribe > 0) {
        players[inspectorIdx].coins += bribe;
        logs.push({
          id: Date.now().toString(),
          text: `Inspector accepted $${bribe} bribe from ${target.name}.`,
          type: "bribe",
        });

        // RICH LOGS
        stats = getUpdatedStats(stats, inspector.id, {
          income: bribe,
          transaction: {
            label: "Bribe Accepted",
            amount: bribe,
            detail: `From ${target.name}`,
          },
        });
        stats = getUpdatedStats(stats, target.id, {
          expense: bribe,
          transaction: {
            label: "Bribe Paid",
            amount: -bribe,
            detail: `To ${inspector.name}`,
          },
        });
      } else {
        players[targetIdx].coins += bribe; // Return bribe
        logs.push({
          id: Date.now().toString(),
          text: `Inspector passed ${target.name}.`,
          type: "success",
        });
        stats = getUpdatedStats(stats, inspector.id, {
          transaction: {
            label: "Pass Decision",
            amount: 0,
            detail: `Passed ${target.name}`,
          },
        });
        if (bribe > 0)
          stats = getUpdatedStats(stats, target.id, {
            income: bribe,
            transaction: { label: "Bribe Returned", amount: bribe },
          });
      }

      const saleValue = target.loadedCrate.cards.reduce((sum, c) => {
        let v = GOODS[c].val;
        if (currentEvent.target === c) v *= currentEvent.multiplier;
        return sum + v;
      }, 0);
      players[targetIdx].coins += saleValue;

      // RICH LOGS SALE
      stats = getUpdatedStats(stats, target.id, {
        income: saleValue,
        transaction: {
          label: "Goods Sold",
          amount: saleValue,
          items: target.loadedCrate.cards,
          detail: currentEvent.target
            ? `Event Mult: x${currentEvent.multiplier}`
            : "",
        },
      });

      players[targetIdx].stash.push(...target.loadedCrate.cards);
      applyGoodsBonus(targetIdx, target.loadedCrate.cards); // Apply Bonus
    } else if (action === "OPEN") {
      const bribe = target.loadedCrate.bribe || 0;
      players[targetIdx].coins += bribe; // Return bribe
      if (bribe > 0)
        stats = getUpdatedStats(stats, target.id, {
          income: bribe,
          transaction: { label: "Bribe Returned", amount: bribe },
        });

      const cards = target.loadedCrate.cards;
      const declared = target.loadedCrate.declaration;

      const hasTrap = cards.includes("TRAP");
      if (hasTrap) {
        players[inspectorIdx].coins -= 2000;
        players[targetIdx].coins += 2000;

        // RICH LOGS TRAP
        stats = getUpdatedStats(stats, inspector.id, {
          expense: 2000,
          transaction: {
            label: "Trap Exploded",
            amount: -2000,
            detail: "Booby Trap triggered",
          },
        });
        stats = getUpdatedStats(stats, target.id, {
          income: 2000,
          transaction: {
            label: "Trap Reward",
            amount: 2000,
            detail: "Inspector triggered trap",
          },
        });

        const remainingCards = cards.filter((c) => c !== "TRAP");
        const saleValue = remainingCards.reduce((sum, c) => {
          let v = GOODS[c].val;
          if (currentEvent.target === c) v *= currentEvent.multiplier;
          return sum + v;
        }, 0);
        players[targetIdx].coins += saleValue;

        stats = getUpdatedStats(stats, target.id, {
          income: saleValue,
          transaction: {
            label: "Survivors Sold",
            amount: saleValue,
            items: remainingCards,
          },
        });
        players[targetIdx].stash.push(...remainingCards);
        applyGoodsBonus(targetIdx, remainingCards); // Apply Bonus

        logs.push({
          id: Date.now().toString(),
          text: `BOOM! Booby Trap! Inspector pays $2000.`,
          type: "danger",
        });
        fb = {
          id: Date.now(),
          type: "danger",
          message: "BOOBY TRAP!",
          subtext: "Inspector blown up.",
        };
      } else {
        let illegalCards = cards.filter(
          (c) => GOODS[c].type === "ILLEGAL" || c !== declared
        );

        if (targetHasConceal && illegalCards.length > 0) {
          illegalCards.shift();
          logs.push({
            id: Date.now().toString(),
            text: `${target.name}'s Hidden Compartment saved an item!`,
            type: "neutral",
          });
        }

        if (illegalCards.length === 0) {
          // CLEAN
          let penalty = cards.reduce((sum, c) => sum + GOODS[c].penalty, 0);
          if (currentEvent.id === "CRACKDOWN") penalty *= 2;
          if (currentEvent.id === "FREE_TRADE") penalty *= 0.5;

          players[inspectorIdx].coins -= penalty;
          players[targetIdx].coins += penalty;

          // RICH LOGS CLEAN
          stats = getUpdatedStats(stats, inspector.id, {
            expense: penalty,
            transaction: {
              label: "Wrongful Search",
              amount: -penalty,
              detail: "Paid compensation",
            },
          });
          stats = getUpdatedStats(stats, target.id, {
            income: penalty,
            transaction: {
              label: "Clean Bonus",
              amount: penalty,
              detail: "Compensation received",
            },
          });

          const saleValue = cards.reduce((sum, c) => {
            let v = GOODS[c].val;
            if (currentEvent.target === c) v *= currentEvent.multiplier;
            return sum + v;
          }, 0);
          players[targetIdx].coins += saleValue;
          stats = getUpdatedStats(stats, target.id, {
            income: saleValue,
            transaction: {
              label: "Goods Sold",
              amount: saleValue,
              items: cards,
            },
          });

          players[targetIdx].stash.push(...cards);
          applyGoodsBonus(targetIdx, cards); // Apply Bonus

          logs.push({
            id: Date.now().toString(),
            text: `CLEAN! Inspector pays $${penalty} fine.`,
            type: "danger",
          });
          fb = {
            id: Date.now(),
            type: "danger",
            message: "CLEAN",
            subtext: "Inspector pays fine.",
          };
        } else {
          // BUSTED
          let fine = 0;
          let seized = [];
          let kept = [];
          let roleBonus = 0;

          cards.forEach((c) => {
            if (illegalCards.includes(c)) {
              let itemFine = GOODS[c].penalty;
              let baseFine = itemFine;

              if (target.role === "DIPLOMAT") itemFine *= 0.5;
              if (currentEvent.id === "CRACKDOWN") itemFine *= 2;
              if (currentEvent.id === "FREE_TRADE") itemFine *= 0.5;

              // Track Diplomat Savings
              if (target.role === "DIPLOMAT") roleBonus += baseFine * 0.5;

              fine += itemFine;
              seized.push(c);
              const idx = illegalCards.indexOf(c);
              if (idx > -1) illegalCards.splice(idx, 1);
            } else {
              kept.push(c);
            }
          });

          players[targetIdx].coins -= fine;
          players[inspectorIdx].coins += fine;

          // RICH LOGS BUSTED
          stats = getUpdatedStats(stats, target.id, {
            expense: fine,
            roleBonus: roleBonus,
            transaction: {
              label: "Fine Paid",
              amount: -fine,
              detail: `Seized: ${seized.length} items`,
            },
          });
          stats = getUpdatedStats(stats, inspector.id, {
            income: fine,
            transaction: {
              label: "Fine Collected",
              amount: fine,
              items: seized,
            },
          });

          const saleValue = kept.reduce((sum, c) => {
            let v = GOODS[c].val;
            if (currentEvent.target === c) v *= currentEvent.multiplier;
            return sum + v;
          }, 0);
          players[targetIdx].coins += saleValue;
          if (saleValue > 0)
            stats = getUpdatedStats(stats, target.id, {
              income: saleValue,
              transaction: {
                label: "Kept Goods Sold",
                amount: saleValue,
                items: kept,
              },
            });

          players[targetIdx].stash.push(...kept);
          applyGoodsBonus(targetIdx, kept); // Apply Bonus

          // Snitch Bonus
          snitchBonus.forEach((s) => {
            const sIdx = players.findIndex((pl) => pl.id === s.id);
            if (sIdx > -1) {
              players[sIdx].coins += 500;
              stats = getUpdatedStats(stats, s.id, {
                income: 500,
                roleBonus: 500,
                transaction: {
                  label: "Snitch Reward",
                  amount: 500,
                  detail: `${target.name} busted`,
                },
              });
            }
          });

          logs.push({
            id: Date.now().toString(),
            text: `BUSTED! ${target.name} pays $${fine}. ${seized.length} items seized.`,
            type: "success",
          });
          fb = {
            id: Date.now(),
            type: "success",
            message: "BUSTED",
            subtext: `Contraband Seized!`,
          };
        }
      }
    }

    players[targetIdx].loadedCrate = null;
    const pending = players.filter(
      (p) => p.id !== inspector.id && p.loadedCrate !== null
    );

    // ... inside inspectCrate, replacing the pending.length check ...

    if (pending.length === 0) {
      // 1. Create the history entry for this round
      const historyEntry = {
        stats: stats,
        event: currentEvent || EVENTS.NORMAL,
      };

      // 2. Update DB: Commit history and switch to ROUND_SUMMARY
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players,
          logs: arrayUnion(...logs),
          currentRoundStats: stats,
          roundHistory: arrayUnion(historyEntry), // Save history immediately
          turnState: "ROUND_SUMMARY", // <--- NEW STATE
          feedbackTrigger: fb,
        }
      );
    } else {
      // Standard update if round isn't over
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players,
          logs: arrayUnion(...logs),
          currentRoundStats: stats,
          feedbackTrigger: fb,
        }
      );
    }
  };

  const startNextRound = async () => {
    const nextRound = gameState.currentRound + 1;

    // --- SCENARIO A: GAME OVER ---
    if (nextRound > totalRounds) {
      // Calculate Final Scores
      const finalScores = gameState.players
        .map((p) => {
          return {
            ...p,
            finalScore: Math.floor(p.coins - BANK_LOAN),
            ready: false,
          };
        })
        .sort((a, b) => b.finalScore - a.finalScore);

      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players: finalScores,
          status: "finished",
          turnState: "IDLE",
          winner: finalScores[0].name,
          feedbackTrigger: {
            id: Date.now(),
            type: "success",
            message: "GAME OVER",
            subtext: `${finalScores[0].name} wins!`,
          },
        }
      );
      return;
    }

    // --- SCENARIO B: SETUP NEXT ROUND ---
    let nextInspectorIndex = gameState.inspectorOrder[nextRound - 1];
    let deck = [...gameState.deck];

    // Generate Event
    const eventKeys = Object.keys(EVENTS);
    const randomEventKey =
      eventKeys[Math.floor(Math.random() * eventKeys.length)];
    const nextEvent = EVENTS[randomEventKey];

    // Assign Roles & Hands
    const playersWithRoles = assignRandomRoles(gameState.players);
    const nextInspectorId = playersWithRoles[nextInspectorIndex].id;

    const nextRoundStats = {};
    playersWithRoles.forEach((p) => {
      nextRoundStats[p.id] = {
        role: p.role,
        isInspector: p.id === nextInspectorId,
        income: 0,
        expense: 0,
        transactions: [],
        marketItems: [],
        roleBonus: 0,
      };
    });

    const nextPlayers = playersWithRoles.map((p) => {
      const hand = [...p.hand];
      const limit = p.upgrades?.includes("POCKETS") ? 7 : 6;
      while (hand.length < limit && deck.length > 0) {
        const card = drawSafeCard(deck, hand);
        if (card) hand.push(card);
      }
      return { ...p, hand, loadedCrate: null, ready: false }; // Reset ready status
    });

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        players: nextPlayers,
        deck,
        inspectorIndex: nextInspectorIndex,
        currentRound: nextRound,
        currentRoundStats: nextRoundStats,
        turnState: "SHOPPING", // Start next round
        marketEvent: nextEvent,
        logs: arrayUnion({
          id: Date.now().toString(),
          text: `Round ${nextRound} Started. Event: ${nextEvent.name}`,
          type: "neutral",
        }),
      }
    );
  };

  const finishRound = async (players, stats, logs, fb, event) => {
    // 1. Commit the results of the current round to history
    const historyEntry = { stats: stats, event: event || EVENTS.NORMAL };

    // 2. Determine if Game Over or Next Round
    const nextRound = gameState.currentRound + 1;

    // --- SCENARIO A: GAME OVER ---
    if (nextRound > totalRounds) {
      // Calculate Final Scores immediately
      const finalScores = players
        .map((p) => {
          return {
            ...p,
            finalScore: Math.floor(p.coins - BANK_LOAN),
            ready: false,
          };
        })
        .sort((a, b) => b.finalScore - a.finalScore);

      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players: finalScores,
          logs: arrayUnion(...logs),
          currentRoundStats: stats,
          roundHistory: arrayUnion(historyEntry),
          status: "finished", // Game Over State
          turnState: "IDLE",
          winner: finalScores[0].name,
          feedbackTrigger: {
            id: Date.now(),
            type: "success",
            message: "GAME OVER",
            subtext: `${finalScores[0].name} wins!`,
          },
        }
      );
      return;
    }

    // --- SCENARIO B: NEXT ROUND (Automatic) ---
    // Prepare next round data immediately using the updated 'players' array
    let nextInspectorIndex = gameState.inspectorOrder[nextRound - 1];
    let deck = [...gameState.deck];

    // Generate Event
    const eventKeys = Object.keys(EVENTS);
    const randomEventKey =
      eventKeys[Math.floor(Math.random() * eventKeys.length)];
    const nextEvent = EVENTS[randomEventKey];

    // Assign Roles & Hands
    const playersWithRoles = assignRandomRoles(players);
    const nextInspectorId = playersWithRoles[nextInspectorIndex].id;

    const nextRoundStats = {};
    playersWithRoles.forEach((p) => {
      nextRoundStats[p.id] = {
        role: p.role,
        isInspector: p.id === nextInspectorId,
        income: 0,
        expense: 0,
        transactions: [],
        marketItems: [],
        roleBonus: 0,
      };
    });

    const nextPlayers = playersWithRoles.map((p) => {
      const hand = [...p.hand];
      const limit = p.upgrades?.includes("POCKETS") ? 7 : 6;
      while (hand.length < limit && deck.length > 0) {
        const card = drawSafeCard(deck, hand);
        if (card) hand.push(card);
      }
      return { ...p, hand, loadedCrate: null, ready: false };
    });

    // Update Doc to skip straight to Shopping
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        players: nextPlayers,
        deck,
        inspectorIndex: nextInspectorIndex,
        currentRound: nextRound,
        currentRoundStats: nextRoundStats,
        roundHistory: arrayUnion(historyEntry),
        turnState: "SHOPPING", // Directly to shop
        marketEvent: nextEvent,
        logs: arrayUnion(...logs, {
          id: Date.now().toString(),
          text: `Round ${nextRound} Started. Event: ${nextEvent.name}`,
          type: "neutral",
        }),
        feedbackTrigger: fb, // Show the result of the inspection that just finished
      }
    );
  };

  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-4 text-center">
        <div className="bg-orange-500/10 p-8 rounded-2xl border border-orange-500/30">
          <Hammer
            size={64}
            className="text-orange-500 mx-auto mb-4 animate-bounce"
          />
          <h1 className="text-3xl font-bold mb-2">Under Maintenance</h1>
          <p className="text-gray-400">
            Border crossing closed. Inspections are paused.
          </p>
        </div>
        {/* Add Spacing Between Boxes */}
        <div className="h-8"></div>

        {/* Clickable Second Card */}
        <a href="https://rawfidkshuvo.github.io/gamehub/">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="text-center pb-12 animate-pulse">
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900/50 rounded-full border border-indigo-500/20 text-indigo-300 font-bold tracking-widest text-sm uppercase backdrop-blur-sm">
                <Sparkles size={16} /> Visit Gamehub...Try our other releases...{" "}
                <Sparkles size={16} />
              </div>
            </div>
          </div>
        </a>
      </div>
    );
  }

  // --- Render ---
  if (view === "menu") {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <FloatingBackground />

        {showRules && <RulesModal onClose={() => setShowRules(false)} />}

        <div className="z-10 text-center mb-10">
          <Package
            size={64}
            className="text-emerald-500 mx-auto mb-4 animate-bounce"
          />
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-emerald-400 to-green-700 tracking-widest">
            CONTRABAND
          </h1>
          <p className="text-white-400/60 tracking-[0.3em] uppercase mt-2">
            Black Market Edition
          </p>
        </div>
        <div className="bg-zinc-900/80 backdrop-blur border border-emerald-500/30 p-8 rounded-2xl w-full max-w-md shadow-2xl z-10">
          {error && (
            <div className="bg-red-900/50 text-red-200 p-2 mb-4 rounded text-center text-sm">
              {error}
            </div>
          )}
          <input
            className="w-full bg-black/50 border border-zinc-600 p-3 rounded mb-4 text-white placeholder-zinc-500 focus:border-emerald-500 outline-none"
            placeholder="Alias"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-emerald-700 hover:bg-emerald-600 p-4 rounded font-bold mb-4 flex items-center justify-center gap-2 transition-all"
          >
            <ShieldCheck size={20} /> Create Operation
          </button>
          <div className="flex gap-2 mb-4">
            <input
              className="flex-1 min-w-0 bg-black/50 border border-zinc-600 p-3 rounded text-white placeholder-zinc-500 uppercase tracking-wider"
              placeholder="CODE"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
            />
            <button
              onClick={joinRoom}
              disabled={loading}
              className="bg-zinc-800 hover:bg-zinc-700 px-6 rounded font-bold flex-shrink-0"
            >
              Join
            </button>
          </div>
          <button
            onClick={() => setShowRules(true)}
            className="w-full text-center text-zinc-500 hover:text-white text-sm mt-2 flex items-center justify-center gap-2"
          >
            <BookOpen size={14} /> Rules
          </button>
        </div>
        <div className="absolute bottom-4 text-slate-600 text-xs text-center">
          Inspired by Sheriff of Nottingham. A tribute game.
          <br />
          Developed by <strong>RAWFID K SHUVO</strong>. Visit{" "}
          <a
            href="https://rawfidkshuvo.github.io/gamehub/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-500 underline hover:text-green-600"
          >
            GAMEHUB
          </a>{" "}
          for more games.
        </div>
      </div>
    );
  }

  if (view === "lobby" && gameState) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 relative">
        <FloatingBackground />

        {showLeaveConfirm && (
          <LeaveConfirmModal
            isHost={isHost}
            onConfirm={leaveRoom}
            onCancel={() => setShowLeaveConfirm(false)}
          />
        )}

        <div className="z-10 w-full max-w-lg bg-zinc-900/90 backdrop-blur p-8 rounded-2xl border border-emerald-900/50 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-serif text-emerald-500">
              Lobby <span className="text-white font-mono">{roomId}</span>
            </h2>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 hover:bg-red-900/50 rounded text-red-400"
            >
              <LogOut size={16} />
            </button>
          </div>

          <div className="space-y-2 mb-8">
            {gameState.players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-zinc-800/50 p-3 rounded border border-zinc-700/50"
              >
                <span className="font-bold flex items-center gap-2">
                  <User
                    size={14}
                    className={
                      p.id === user.uid ? "text-emerald-500" : "text-zinc-500"
                    }
                  />
                  {p.name}{" "}
                  {p.id === gameState.hostId && (
                    <Crown size={14} className="text-yellow-500" />
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-xs">Waiting</span>
                  {/* KICK BUTTON - Only for Host, cannot kick self */}
                  {gameState.hostId === user.uid && p.id !== user.uid && (
                    <button
                      onClick={() => kickPlayer(p.id)}
                      className="p-1.5 bg-zinc-700 hover:bg-red-900/50 text-zinc-400 hover:text-red-400 rounded transition-colors"
                      title="Kick Player"
                    >
                      <Trash size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {gameState.hostId === user.uid && (
            <button
              onClick={startGame}
              disabled={gameState.players.length < 3}
              className="w-full py-4 bg-emerald-700 hover:bg-emerald-600 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {gameState.players.length < 3 ? "Need 3+ Players" : "Start Game"}
            </button>
          )}
        </div>
        <ContrabandLogo />
      </div>
    );
  }

  if (view === "game" && gameState) {
    const inspector = gameState.players[gameState.inspectorIndex];
    const guestsReady = gameState.players
      .filter((p) => p.id !== gameState.hostId)
      .every((p) => p.ready);
    const shopDisabled = me.ready || gameState.turnState !== "SHOPPING";

    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col relative overflow-hidden font-sans">
        <FloatingBackground />

        {feedback && (
          <FeedbackOverlay
            type={feedback.type}
            message={feedback.message}
            subtext={feedback.subtext}
            icon={
              feedback.type === "danger"
                ? Siren
                : feedback.type === "bribe"
                ? Handshake
                : AlertOctagon
            }
          />
        )}
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
        {showLogs && (
          <LogViewer logs={gameState.logs} onClose={() => setShowLogs(false)} />
        )}
        {showLeaveConfirm && (
          <LeaveConfirmModal
            isHost={isHost}
            onLobby={returnToLobby}
            onConfirm={leaveRoom}
            onCancel={() => setShowLeaveConfirm(false)}
          />
        )}
        {showStash && (
          <StashModal
            stash={me.stash || []}
            onClose={() => setShowStash(false)}
          />
        )}
        <ShopModal
          isOpen={showShop}
          onClose={() => setShowShop(false)}
          player={me}
          onBuy={buyItem}
        />

        {/* --- Top Bar --- */}
        <div className="h-16 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between px-4 z-50 backdrop-blur-md sticky top-0 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col">
              <span className="text-xs text-zinc-500 uppercase tracking-widest">
                Event
              </span>
              <span className="text-sm font-bold text-yellow-500 flex items-center gap-1">
                {currentEvent.id === "WAR" && <Bomb size={14} />}
                {currentEvent.id === "PANDEMIC" && <Skull size={14} />}
                {currentEvent.id === "CRACKDOWN" && <Siren size={14} />}
                {currentEvent.name}
              </span>
            </div>
            <div className="bg-black/40 px-3 py-1 rounded-full border border-zinc-700 flex items-center gap-2">
              <Coins size={14} className="text-yellow-500" />
              <span className="font-mono font-bold">${me.coins}</span>
            </div>
            {/* Round Counter */}
            <div className="text-xs text-zinc-500 bg-black/50 px-2 py-1 rounded border border-zinc-800 flex items-center gap-1">
              <Calendar size={14} />
              <span>
                {gameState.currentRound}/{totalRounds}
              </span>
            </div>
            {/* Deck Counter */}
            <div className="text-xs text-zinc-500 bg-black/50 px-2 py-1 rounded border border-zinc-800 flex items-center gap-1">
              <div className="w-2 h-3 bg-zinc-600 rounded-sm"></div>
              {gameState.deck.length}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Removed Shop Icon Button from Header */}
            <button
              onClick={() => setShowLogs(true)}
              className="p-2 hover:bg-zinc-800 rounded text-zinc-400"
            >
              <History size={20} />
            </button>
            <button
              onClick={() => setShowRules(true)}
              className="p-2 hover:bg-zinc-800 rounded text-zinc-400"
            >
              <BookOpen size={20} />
            </button>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 hover:bg-red-900/50 rounded text-red-400"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* --- Game Area --- */}
        <div className="flex-1 p-4 flex flex-col items-center relative z-10 max-w-6xl mx-auto w-full gap-6">
          {/* Status Banner */}
          <div className="flex items-center justify-center gap-4">
            <div
              className={`px-6 py-2 rounded-full border flex items-center gap-2 shadow-lg ${
                gameState.turnState === "INSPECTING"
                  ? "bg-red-900/30 border-red-500 text-red-200"
                  : "bg-emerald-900/30 border-emerald-500 text-emerald-200"
              }`}
            >
              {gameState.turnState === "SHOPPING" ? (
                <ShoppingBag size={18} />
              ) : gameState.turnState === "LOADING" ? (
                <Package size={18} />
              ) : gameState.turnState === "ROUND_SUMMARY" ? (
                <FileText size={18} />
              ) : (
                <Siren size={18} />
              )}
              <span className="font-bold tracking-wide">
                {gameState.turnState === "SHOPPING"
                  ? "MARKET PHASE"
                  : gameState.turnState === "LOADING"
                  ? "LOAD CRATES"
                  : gameState.turnState === "ROUND_SUMMARY"
                  ? "ROUND REPORT"
                  : `INSPECTOR: ${inspector.name}`}
              </span>
            </div>
          </div>

          {/* Main Game Grid (Always Visible) */}
          <div
            className={`flex gap-3 justify-center flex-wrap w-full transition-opacity duration-500 ${
              gameState.status === "finished"
                ? "opacity-20 pointer-events-none"
                : "opacity-100"
            }`}
          >
            {gameState.players.map((p) => {
              if (p.id === user.uid) return null;
              const isInsp = p.id === inspector.id;
              const RoleIcon = p.role ? ROLES[p.role].icon : User;
              return (
                <div
                  key={p.id}
                  className={`relative bg-zinc-900/90 p-3 rounded-xl border-2 w-32 transition-all flex flex-col items-center ${
                    isInsp
                      ? "border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                      : "border-zinc-700"
                  } ${p.loadedCrate ? "bg-zinc-800" : ""}`}
                >
                  <div className="absolute top-1 right-1 flex items-center gap-1 opacity-70">
                    <RoleIcon size={12} className={ROLES[p.role]?.color} />
                  </div>
                  <User
                    size={24}
                    className={isInsp ? "text-yellow-500" : "text-zinc-600"}
                  />
                  <span
                    className={`font-bold text-xs truncate w-full text-center mt-1 ${
                      isInsp ? "text-yellow-200" : "text-zinc-400"
                    }`}
                  >
                    {p.name}
                  </span>

                  {p.loadedCrate ? (
                    <div className="mt-2 w-full bg-black/40 rounded p-2 text-center border border-zinc-600">
                      <div className="text-[10px] text-zinc-500 uppercase flex justify-center items-center gap-1">
                        {GOODS[p.loadedCrate.declaration].name}{" "}
                        {p.loadedCrate.bribe > 0 && (
                          <Coins size={10} className="text-yellow-500" />
                        )}
                      </div>

                      {isInspector &&
                        me.id === inspector.id &&
                        gameState.turnState === "INSPECTING" && (
                          <div className="grid grid-cols-2 gap-1 mt-2">
                            <button
                              onClick={() => inspectCrate(p.id, "PASS")}
                              className="bg-emerald-700 hover:bg-emerald-600 text-[8px] py-2 rounded text-white font-bold"
                            >
                              PASS
                            </button>
                            <button
                              onClick={() => inspectCrate(p.id, "OPEN")}
                              className="bg-red-700 hover:bg-red-600 text-[8px] py-2 rounded text-white font-bold"
                            >
                              OPEN
                            </button>
                            {p.loadedCrate.bribe > 0 && (
                              <button
                                onClick={() =>
                                  inspectCrate(p.id, "ACCEPT_BRIBE")
                                }
                                className="col-span-2 bg-yellow-600 hover:bg-yellow-500 text-[9px] py-1 rounded text-black font-bold flex items-center justify-center gap-1"
                              >
                                Take ${p.loadedCrate.bribe} Bribe
                              </button>
                            )}
                            {me.upgrades?.includes("SCANNER") &&
                              !p.loadedCrate.scanned && (
                                <button
                                  onClick={() => inspectCrate(p.id, "PEEK")}
                                  className="col-span-2 bg-blue-600 hover:bg-blue-500 text-[9px] py-1 rounded text-white font-bold flex items-center justify-center gap-1"
                                >
                                  <Scan size={10} /> SCAN (1)
                                </button>
                              )}
                          </div>
                        )}
                    </div>
                  ) : (
                    !isInsp && (
                      <div className="mt-2 text-[9px] text-zinc-600 animate-pulse">
                        {p.ready ? "Ready" : "Thinking..."}
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Player Area */}
          <div
            className={`w-full max-w-4xl bg-zinc-900/95 p-4 md:p-6 rounded-t-3xl border-t border-emerald-500/30 backdrop-blur-md mt-auto shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20 transition-opacity duration-500 ${
              gameState.status === "finished"
                ? "opacity-20 pointer-events-none"
                : "opacity-100"
            }`}
          >
            <div className="flex flex-col md:flex-row gap-6">
              {/* My Stats */}
              <div className="flex flex-col gap-2 min-w-[140px]">
                <div className="font-bold text-lg text-white flex items-center gap-2">
                  {me.role &&
                    React.createElement(ROLES[me.role].icon, {
                      size: 18,
                      className: ROLES[me.role].color,
                    })}
                  {me.name}
                </div>
                <div className="text-xs text-zinc-500">
                  {ROLES[me.role]?.desc}
                </div>

                {/* Event Info Display */}
                <div className="mt-2 border-t border-zinc-700 pt-2">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1 flex items-center gap-1">
                    <Info size={10} /> Event Active
                  </div>
                  <div className="text-sm font-bold text-yellow-500">
                    {currentEvent.name}
                  </div>
                  <div className="text-[10px] text-zinc-400 leading-tight">
                    {currentEvent.desc}
                  </div>
                </div>

                <div className="mt-2 flex gap-1 flex-wrap">
                  {me.upgrades?.map((u) => {
                    const ItemIcon = SHOP_ITEMS[u].icon;
                    return (
                      <div
                        key={u}
                        className="p-1 bg-zinc-800 rounded border border-zinc-700 text-yellow-500"
                        title={SHOP_ITEMS[u].name}
                      >
                        <ItemIcon size={12} />
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => setShowStash(true)}
                  className="mt-2 w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-300 border border-zinc-600 flex items-center justify-center gap-2 transition-colors"
                >
                  <Briefcase size={12} /> View Stash ({me.stash.length})
                </button>

                {gameState.turnState === "SHOPPING" && (
                  <>
                    <button
                      onClick={() => !shopDisabled && setShowShop(true)}
                      disabled={shopDisabled}
                      className={`mt-2 w-full py-2 rounded text-xs border flex items-center justify-center gap-2 transition-colors ${
                        !shopDisabled
                          ? "bg-yellow-900/20 hover:bg-yellow-900/30 text-yellow-500 border-yellow-500/50"
                          : "bg-zinc-800 text-zinc-600 border-zinc-700 cursor-not-allowed"
                      }`}
                    >
                      <ShoppingBag size={12} /> Open Black Market
                    </button>
                    <button
                      onClick={toggleReady}
                      disabled={me.ready}
                      className={`mt-2 py-2 px-4 rounded font-bold transition-all ${
                        me.ready
                          ? "bg-green-600/50 text-white/50 cursor-not-allowed"
                          : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                      }`}
                    >
                      {me.ready ? "READY" : "MARKET DONE"}
                    </button>
                  </>
                )}
              </div>

              {/* Hand / Main Action Area */}
              <div className="flex-1 overflow-x-auto min-h-[160px]">
                {isInspector ? (
                  <div className="h-full flex items-center justify-center text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl bg-black/20 gap-2">
                    <ShieldCheck size={32} />
                    <span>You are the Inspector. Check crates above.</span>
                  </div>
                ) : me.loadedCrate ? (
                  <div className="h-full flex flex-col items-center justify-center w-full min-w-0">
                    {/* Display Locked Cards - Scrollable & Centered */}
                    <div className="w-full overflow-x-auto no-scrollbar">
                      {/* w-max + mx-auto: Centers the cards if they fit, aligns left if they overflow.
                          p-4: Adds padding so the hover animation (-translate-y) doesn't get clipped.
                      */}
                      <div className="flex gap-2 w-max mx-auto px-4 py-4 grayscale-[0.3] scale-90 origin-bottom">
                        {me.loadedCrate.cards.map((cId, i) => (
                          <div
                            key={i}
                            className="relative group flex-shrink-0 transition-transform hover:-translate-y-2"
                          >
                            <Card typeId={cId} small={false} />
                            {/* Lock Overlay */}
                            <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Lock className="text-white/80 drop-shadow-md" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-3 bg-zinc-900/80 px-4 py-2 rounded-full border border-emerald-500/30 text-xs shadow-xl backdrop-blur-md whitespace-nowrap z-20">
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <Lock size={12} /> LOCKED
                      </span>
                      <div className="w-px h-3 bg-zinc-700"></div>
                      <span className="text-zinc-400">
                        Declared:{" "}
                        <strong className="text-white">
                          {GOODS[me.loadedCrate.declaration]?.name}
                        </strong>
                      </span>
                      {me.loadedCrate.bribe > 0 && (
                        <>
                          <div className="w-px h-3 bg-zinc-700"></div>
                          <span className="flex items-center gap-1 text-yellow-500 font-mono">
                            <Coins size={12} /> ${me.loadedCrate.bribe}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ) : gameState.turnState === "LOADING" ? (
                  <div className="flex gap-2 pb-2">
                    {me.hand.map((cId, i) => (
                      <Card
                        key={i}
                        typeId={cId}
                        selected={selectedCards.includes(i)}
                        onClick={() => {
                          if (selectedCards.includes(i))
                            setSelectedCards(
                              selectedCards.filter((idx) => idx !== i)
                            );
                          else if (
                            selectedCards.length <
                            (me.upgrades?.includes("EXPANDED") ? 5 : 4)
                          )
                            setSelectedCards([...selectedCards, i]);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-600 italic">
                    Market Phase - Check Shop
                  </div>
                )}
              </div>

              {/* Controls */}
              {!isInspector && gameState.turnState !== "SHOPPING" && (
                <div className="min-w-[200px] flex flex-col gap-3">
                  {/* Phase 1: Loading (Visible when no crate yet) */}
                  {!me.loadedCrate && gameState.turnState === "LOADING" && (
                    <>
                      <div className="bg-zinc-800 p-2 rounded-xl border border-zinc-700">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">
                          Declare As
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                          {["MEDS", "FOOD", "PARTS"].map((type) => (
                            <button
                              key={type}
                              onClick={() => setDeclaredType(type)}
                              className={`p-2 rounded flex items-center justify-center ${
                                declaredType === type
                                  ? "bg-emerald-600 text-white"
                                  : "bg-zinc-700 text-zinc-400"
                              }`}
                            >
                              {React.createElement(GOODS[type].icon, {
                                size: 16,
                              })}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-zinc-800 p-2 rounded-xl border border-zinc-700 flex items-center gap-2">
                        <div className="text-[10px] text-zinc-500 uppercase font-bold w-12">
                          Bribe
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={Math.max(0, Math.min(me.coins, 10000))}
                          step="100"
                          value={bribeAmount}
                          onChange={(e) => setBribeAmount(e.target.value)}
                          className="flex-1 accent-yellow-500 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-xs font-mono text-yellow-500 w-10 text-right">
                          ${bribeAmount}
                        </span>
                      </div>

                      <button
                        onClick={loadCrate}
                        disabled={selectedCards.length === 0}
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg"
                      >
                        LOAD CRATE
                      </button>
                    </>
                  )}

                  {/* Phase 2: Updating Bribe (Visible when crate IS loaded) */}
                  {me.loadedCrate && (
                    <div className="bg-zinc-800/80 p-3 rounded-xl border border-yellow-500/30 animate-in fade-in">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <Handshake size={14} className="text-yellow-500" />{" "}
                          Negotiation
                        </div>
                        <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                          Active
                        </div>
                      </div>

                      <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-700 flex items-center gap-2 mb-2">
                        <div className="text-[10px] text-zinc-500 uppercase font-bold w-8">
                          Offer
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={Math.min(
                            10000,
                            me.coins + (me.loadedCrate?.bribe || 0)
                          )}
                          step="100"
                          value={bribeAmount}
                          onChange={(e) => setBribeAmount(e.target.value)}
                          className="flex-1 accent-yellow-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-xs font-mono text-yellow-500 w-10 text-right">
                          ${bribeAmount}
                        </span>
                      </div>

                      <button
                        onClick={updateBribe}
                        disabled={Date.now() - lastBribeUpdate < 2000}
                        className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold rounded-lg text-xs shadow-lg shadow-yellow-900/20 transition-colors flex items-center justify-center gap-2"
                      >
                        {Date.now() - lastBribeUpdate < 2000 ? (
                          <>
                            <Clock size={12} className="animate-spin" /> WAIT
                          </>
                        ) : (
                          "UPDATE OFFER"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Game Over Screen Overlay */}
          {gameState.status === "finished" && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
              <div className="w-full max-w-4xl bg-zinc-900 border border-emerald-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 bg-zinc-950 border-b border-zinc-800 text-center">
                  <h2 className="text-4xl font-bold text-emerald-400 drop-shadow-md">
                    {gameState.winner} Wins!
                  </h2>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <ReportCard
                    players={gameState.players}
                    roundData={gameState.roundHistory}
                    isFinal={true}
                  />
                </div>

                <div className="p-6 bg-zinc-950 border-t border-zinc-800 flex justify-center gap-4">
                  {!isHost ? (
                    <button
                      onClick={toggleReady}
                      className={`px-8 py-3 rounded-xl font-bold transition-all ${
                        me.ready
                          ? "bg-green-600 text-white"
                          : "bg-zinc-700 hover:bg-zinc-600 text-white"
                      }`}
                    >
                      {me.ready
                        ? "Ready! Waiting for Host..."
                        : "Ready for Next Round"}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={startGame}
                        disabled={!guestsReady}
                        className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${
                          guestsReady
                            ? "bg-emerald-600 hover:bg-emerald-500"
                            : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                        }`}
                      >
                        New Game
                      </button>
                      <button
                        onClick={returnToLobby}
                        disabled={!guestsReady}
                        className={`px-6 py-3 rounded-xl font-bold text-white transition-all ${
                          guestsReady
                            ? "bg-zinc-700 hover:bg-zinc-600"
                            : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                        }`}
                      >
                        Return Team to Lobby
                      </button>
                    </>
                  )}
                </div>
                {isHost && !guestsReady && (
                  <div className="pb-4 text-center text-xs text-zinc-500 animate-pulse">
                    Waiting for squad...
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Round Summary Overlay */}
          {/* Round Summary Overlay */}
          {gameState.turnState === "ROUND_SUMMARY" && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
              <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white">
                    Round {gameState.currentRound} Complete
                  </h2>
                  <div className="text-xs text-zinc-500 uppercase tracking-widest">
                    {gameState.currentRound >= totalRounds
                      ? "Game Sequence Complete"
                      : "Next Event Loading..."}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <ReportCard
                    players={gameState.players}
                    // Force the tab to be the specific round index
                    roundData={gameState.roundHistory}
                    isFinal={false}
                  />
                </div>

                <div className="p-6 bg-zinc-950 border-t border-zinc-800 flex justify-center">
                  <button
                    onClick={toggleReady}
                    className={`px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 ${
                      me.ready
                        ? "bg-green-600 text-white shadow-green-900/20"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20"
                    }`}
                  >
                    {me.ready ? (
                      <>
                        <CheckCircle size={20} /> Waiting for others...
                      </>
                    ) : (
                      <>
                        {gameState.currentRound >= totalRounds ? (
                          <>
                            Show Final Results <Crown size={20} />
                          </>
                        ) : (
                          <>
                            Start Round {gameState.currentRound + 1}{" "}
                            <ChevronRight size={20} />
                          </>
                        )}
                      </>
                    )}
                  </button>
                </div>

                {/* Show who is ready */}
                <div className="pb-4 bg-zinc-950 flex justify-center gap-2">
                  {gameState.players.map((p) => (
                    <div
                      key={p.id}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        p.ready ? "bg-green-500" : "bg-zinc-700"
                      }`}
                      title={p.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <ContrabandLogo />
      </div>
    );
  }

  return null;
}
