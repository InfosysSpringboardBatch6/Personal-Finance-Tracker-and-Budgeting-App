import React, { useContext, useEffect, useMemo, useState } from "react";
import { AppContext } from "../context/AppContext";

const SpendingOverview = () => {
  const {
    usertoken,
    transactions,
    transactionsLoading,
    loadTransactions,
  } = useContext(AppContext);

  const [range, setRange] = useState("7");

  // Load transactions
  useEffect(() => {
    if (usertoken) {
      loadTransactions({ frequency: range, page: 1, pageSize: 200 });
    }
  }, [usertoken, range]);

  // Compute only expense category stats
  const { totalExpense, categories } = useMemo(() => {
    let expense = 0;
    const categoryMap = {};

    transactions.forEach((t) => {
      if (t.type !== "expense") return;

      const amt = Number(t.amount) || 0;
      expense += amt;

      const key = t.category || "Uncategorized";
      categoryMap[key] = (categoryMap[key] || 0) + amt;
    });

    const list = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({
        label,
        value,
        percentage: expense > 0 ? ((value / expense) * 100).toFixed(1) : 0,
      }));

    return { totalExpense: expense, categories: list };
  }, [transactions]);

  const formatCurrency = (v) => `₹${(Number(v) || 0).toFixed(2)}`;

  return (
    <div className="bg-[#141b32] p-4 md:p-6 rounded-xl shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-white text-base md:text-lg font-semibold">Spending Overview</h2>

        {/* Range filters */}
        <div className="flex items-center gap-2 text-xs md:text-sm">
          {["7", "30", "365"].map((opt) => (
            <button
              key={opt}
              onClick={() => setRange(opt)}
              className={`px-3 py-1 rounded-lg ${
                range === opt
                  ? "bg-[#00b3ff]/20 text-[#00b3ff]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {opt === "7"
                ? "Week"
                : opt === "30"
                ? "Month"
                : "Year"}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {transactionsLoading ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          Loading...
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-8 opacity-70 py-12">
          <svg
            className="w-12 h-12 mb-3 opacity-60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-gray-400">No expense data</p>
          <p className="text-gray-500 text-xs">Add expenses to see category breakdown</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Total Expense */}
          {/* <div>
            <Stat
              label="Total Expense"
              value={formatCurrency(totalExpense)}
              tone="text-red-400"
            />
          </div> */}

          {/* Category Breakdown */}
          <div>
            {/* <h3 className="text-gray-300 text-sm font-semibold mb-3">
              Expense Categories (% of total)
            </h3> */}

            <div className="space-y-3">
              {categories.map((cat, idx) => {
                const width = Math.min(100, Math.round(cat.percentage));
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>{cat.label}</span>
                      <span className="text-gray-400">
                        {formatCurrency(cat.value)} | {cat.percentage}%
                      </span>
                    </div>

                    <div className="w-full bg-gray-700/40 h-2 rounded-full mt-1">
                      <div
                        className="h-full rounded-full bg-[#00b3ff]/60"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Small stat component
// const Stat = ({ label, value, tone }) => (
//   <div className="bg-[#1a233a] rounded-lg p-3 w-full">
//     <p className="text-gray-400 text-xs">{label}</p>
//     <p className={`text-lg font-semibold ${tone}`}>{value}</p>
//   </div>
// );

export default SpendingOverview;
