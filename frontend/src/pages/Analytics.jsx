import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Analytics = () => {
  const { usertoken, backend } = useContext(AppContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [frequency, setFrequency] = useState('365');
  const [type, setType] = useState('all');
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (usertoken) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [usertoken, frequency, type]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${backend}/api/user/transactions/analytics`, {
        headers: { usertoken },
        params: { frequency, type },
      });

      if (data.success) {
        setAnalytics(data.data);
      } else {
        toast.error(data.message || 'Failed to load analytics');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => `₹${(Number(amount) || 0).toFixed(2)}`;

  if (!usertoken) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-semibold text-white mb-2">Please log in</h2>
        <p className="text-gray-400 mb-6">Log in to view analytics</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-full transition-colors"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">No analytics data available</div>
      </div>
    );
  }

  const { totals, categories } = analytics;
  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');
  const netAmount = totals.totalIncome - totals.totalExpense;

  // Calculate percentages for expense categories
  const expenseWithPercentages = expenseCategories.map((cat) => ({
    ...cat,
    percentage: totals.totalExpense > 0 ? ((cat.totalAmount / totals.totalExpense) * 100).toFixed(1) : 0,
  }));

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Analytics</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="bg-[#1a233a] border border-gray-600 rounded-lg px-3 py-2 text-white text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="365">Year</option>
            <option value="all">All</option>
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="bg-[#1a233a] border border-gray-600 rounded-lg px-3 py-2 text-white text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Transactions"
          value={totals.totalTransactions}
          icon="📊"
          color="text-blue-400"
        />
        <StatCard
          label="Total Income"
          value={formatCurrency(totals.totalIncome)}
          icon="💰"
          color="text-green-400"
        />
        <StatCard
          label="Total Expense"
          value={formatCurrency(totals.totalExpense)}
          icon="💸"
          color="text-red-400"
        />
        <StatCard
          label="Net Amount"
          value={formatCurrency(netAmount)}
          icon="📈"
          color={netAmount >= 0 ? 'text-green-400' : 'text-red-400'}
        />
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Categories */}
        <div className="bg-[#141b32] p-6 rounded-xl shadow-lg">
          <h2 className="text-white text-lg font-semibold mb-4">Expense Categories</h2>
          {expenseWithPercentages.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No expense data</p>
          ) : (
            <div className="space-y-4">
              {expenseWithPercentages
                .sort((a, b) => b.totalAmount - a.totalAmount)
                .map((cat, idx) => {
                  const maxAmount = expenseWithPercentages[0]?.totalAmount || 1;
                  const width = Math.min(100, Math.round((cat.totalAmount / maxAmount) * 100));
                  return (
                    <div key={idx}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-200 text-sm font-medium">{cat.category}</span>
                        <div className="text-right">
                          <span className="text-gray-300 text-sm">{formatCurrency(cat.totalAmount)}</span>
                          <span className="text-gray-500 text-xs ml-2">({cat.percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-700/40 h-2 rounded-full">
                        <div
                          className="h-full rounded-full bg-red-500/60"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <p className="text-gray-500 text-xs mt-1">{cat.count} transaction{cat.count !== 1 ? 's' : ''}</p>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Income Categories */}
        <div className="bg-[#141b32] p-6 rounded-xl shadow-lg">
          <h2 className="text-white text-lg font-semibold mb-4">Income Categories</h2>
          {incomeCategories.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No income data</p>
          ) : (
            <div className="space-y-4">
              {incomeCategories
                .sort((a, b) => b.totalAmount - a.totalAmount)
                .map((cat, idx) => {
                  const maxAmount = incomeCategories[0]?.totalAmount || 1;
                  const width = Math.min(100, Math.round((cat.totalAmount / maxAmount) * 100));
                  return (
                    <div key={idx}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-200 text-sm font-medium">{cat.category}</span>
                        <span className="text-gray-300 text-sm">{formatCurrency(cat.totalAmount)}</span>
                      </div>
                      <div className="w-full bg-gray-700/40 h-2 rounded-full">
                        <div
                          className="h-full rounded-full bg-green-500/60"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <p className="text-gray-500 text-xs mt-1">{cat.count} transaction{cat.count !== 1 ? 's' : ''}</p>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => (
  <div className="bg-[#141b32] p-5 rounded-xl shadow-lg">
    <div className="flex items-center justify-between mb-2">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="text-2xl">{icon}</span>
    </div>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </div>
);

export default Analytics;



