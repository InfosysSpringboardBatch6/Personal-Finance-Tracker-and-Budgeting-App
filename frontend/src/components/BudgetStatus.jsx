import React, { useContext, useEffect, useMemo } from "react";
import { assets } from "../assets/assets";
import { AppContext } from "../context/AppContext";

// Icons
const iconMap = {
  food: assets.food_icon,
  dining: assets.food_icon,
  transport: assets.transport_icon,
  transportation: assets.transport_icon,
  entertainment: assets.entertain_icon,
  shopping: assets.shop_icon,
};

// Background colors for each category icon
const iconBgMap = {
  food: "#ff7043",            // Orange
  dining: "#ff7043",          // Same as food
  entertainment: "#8e44ad",   // Purple
  transport: "#3498db",       // Blue
  transportation: "#3498db",  // Same as transport
};

const BudgetStatus = () => {
  const { usertoken, budgets, budgetsLoading, loadBudgets, transactions } =
    useContext(AppContext);

  useEffect(() => {
    if (usertoken && budgets.length === 0) {
      loadBudgets();
    }
  }, [usertoken]);

  // Calculate spending per category
  const budgetWithUsage = useMemo(() => {
    const spendByCategory = {};

    transactions.forEach((t) => {
      if (t.type === "expense") {
        const key = (t.category || "Uncategorized").toLowerCase();
        spendByCategory[key] =
          (spendByCategory[key] || 0) + (Number(t.amount) || 0);
      }
    });

    return budgets.map((b) => {
      const key = (b.category || "Uncategorized").toLowerCase();
      const used = spendByCategory[key] || 0;
      return { ...b, used };
    });
  }, [budgets, transactions]);

  // Totals
  const totalBudget = budgetWithUsage.reduce(
    (s, b) => s + Number(b.amount || 0),
    0
  );
  const totalUsed = budgetWithUsage.reduce((s, b) => s + Number(b.used || 0), 0);

  const formatCurrency = (v) => `₹${(Number(v) || 0).toFixed(2)}`;

  return (
    <div className="bg-[#141b32] p-6 rounded-xl shadow-lg relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-lg font-semibold">Budget Status</h2>
        <p className="text-gray-400 text-sm">
          {formatCurrency(totalUsed)} / {formatCurrency(totalBudget)}
        </p>
      </div>

      {budgetsLoading ? (
        <div className="text-gray-400 text-center py-8">Loading budgets...</div>
      ) : budgetWithUsage.length === 0 ? (
        <div className="text-gray-400 text-center py-8">
          No budgets yet. Add one to begin tracking.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {budgetWithUsage.map((item, index) => {
            const pct =
              item.amount > 0
                ? Math.min(100, Math.round((item.used / item.amount) * 100))
                : 0;

            const categoryKey = item.category?.toLowerCase();
            const icon = iconMap[categoryKey] || assets.food_icon;

            // Pick color for icon background
            const iconBg = iconBgMap[categoryKey] || "#1f2942";

            return (
              <div key={`${item.id || index}-${item.category}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {/* Dynamic Icon Background Color */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: iconBg }}
                    >
                      <img src={icon} className="w-5" alt={item.category} />
                    </div>

                    <div>
                      <p className="text-gray-200 font-medium">{item.category}</p>
                      <p className="text-gray-500 text-xs">
                        Budget: {formatCurrency(item.amount)}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm">
                    {formatCurrency(item.used)} / {formatCurrency(item.amount)}
                  </p>
                </div>

                <div className="w-full bg-gray-700/40 h-2 rounded-full mt-2">
                  <div
                    className={`h-full rounded-full ${
                      pct >= 90 ? "bg-red-500" : "bg-[#00b3ff]/80"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BudgetStatus;
