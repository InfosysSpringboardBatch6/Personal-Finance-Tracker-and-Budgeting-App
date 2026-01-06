import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import { toast } from "react-toastify";

const StatsCards = () => {
  const { backend, usertoken } = useContext(AppContext);

  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    totalSavings: 0,
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!usertoken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const { data } = await axios.get(
          `${backend}/api/user/transactions/analytics`,
          {
            headers: { usertoken },
            // can change the period:
            // params: { frequency: "30" }, // last 30 days
          }
        );

        if (!data.success) {
          toast.error(data.message || "Failed to load analytics");
          setLoading(false);
          return;
        }

        const totals = data.data?.totals || {};
        const totalIncome = Number(totals.totalIncome || 0);
        const totalExpense = Number(totals.totalExpense || 0);

        const balance = totalIncome - totalExpense;
        const savings = balance; 

        setStats({
          totalBalance: balance,
          totalIncome,
          totalExpenses: totalExpense,
          totalSavings: savings,
        });

        setHasData(
          totalIncome !== 0 ||
          totalExpense !== 0 ||
          (data.data?.totals?.totalTransactions || 0) > 0
        );
      } catch (error) {
        console.error(error);
        toast.error("Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [backend, usertoken]);

  const formatAmount = (value) =>
    `₹${Number(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const cards = [
    {
      title: "Total Balance",
      value: formatAmount(stats.totalBalance),
      icon: assets.wallet_icon,
    },
    {
      title: "Total Income",
      value: formatAmount(stats.totalIncome),
      icon: assets.income_icon,
    },
    {
      title: "Total Expenses",
      value: formatAmount(stats.totalExpenses),
      icon: assets.expense_icon,
    },
    {
      title: "Total Savings",
      value: formatAmount(stats.totalSavings),
      icon: assets.savings_icon,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((item, index) => (
        <div
          key={index}
          className="bg-[#1a233a] p-5 rounded-xl shadow-lg border border-white/5"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-white/10">
              <img src={item.icon} alt="" className="w-6" />
            </div>
            <div>
              <h2 className="text-gray-300 text-sm">{item.title}</h2>
              <h1 className="text-xl font-semibold text-white">
                {loading ? "…" : item.value}
              </h1>
              <p className="text-gray-500 text-xs">
                {!usertoken
                  ? "Log in to see your stats"
                  : loading
                  ? "Loading..."
                  : hasData
                  ? "Based on your transactions"
                  : "No data yet"}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
