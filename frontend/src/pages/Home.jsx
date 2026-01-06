import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import StatsCards from '../components/Statscards.jsx';
import SpendingOverview from '../components/SpendingOverview';
import BudgetStatus from '../components/BudgetStatus';
import DashboardCharts from '../components/DashboardCharts';

const Home = () => {
  const { usertoken, backend, userData } = useContext(AppContext);
  const [analytics, setAnalytics] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (usertoken) {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [usertoken]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch analytics for last 30 days
      const analyticsRes = await axios.get(`${backend}/api/user/transactions/analytics`, {
        headers: { usertoken },
        params: { frequency: '30' },
      });

      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.data);
      }

      // Fetch recent transactions
      const transactionsRes = await axios.get(`${backend}/api/user/transactions`, {
        headers: { usertoken },
        params: { page: 1, pageSize: 5, frequency: 'all' },
      });

      if (transactionsRes.data.success) {
        setRecentTransactions(transactionsRes.data.transactions || []);
      }
    } catch (error) {
      console.error('Dashboard error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => `₹${(Number(amount) || 0).toFixed(2)}`;
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const userName = userData?.name || 'User';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Hi, {userName}.</h2>
        {/* <p className="text-gray-400">Here's what's happening with your money.</p> */}
      </div>

      {/* Top Stats Cards */}
      <StatsCards />

      {/* Middle Section - Charts and Category Breakdown */}
      {analytics && analytics.categories && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section - Takes 2 columns */}
          <div className="lg:col-span-2 bg-[#141b32] p-6 rounded-xl shadow-lg">
            <DashboardCharts analytics={analytics} />
          </div>

          {/* Category List - Takes 1 column */}
          <div className="bg-[#141b32] p-6 rounded-xl shadow-lg">
            <h3 className="text-white text-lg font-semibold mb-4">Category Breakdown</h3>
            <CategoryList analytics={analytics} />
          </div>
        </div>
      )}

      {/* Bottom Section - Recent Transactions */}
      <div className="bg-[#141b32] p-6 rounded-xl shadow-lg">
        <h3 className="text-white text-lg font-semibold mb-4">Latest Transactions</h3>
        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading...</div>
        ) : recentTransactions.length === 0 ? (
          <div className="text-gray-400 text-center py-8">No recent transactions</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1a233a] border-b border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {recentTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-[#1a233a] transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-200">{txn.description || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-300">
                        {txn.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatDate(txn.transaction_date)}</td>
                    <td
                      className={`px-4 py-3 text-sm font-semibold text-right ${
                        txn.type === 'income' ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {txn.type === 'income' ? '+' : '-'}
                      {formatCurrency(txn.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Existing Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingOverview />
        <BudgetStatus />
      </div>
    </div>
  );
};


// Category List Component
const CategoryList = ({ analytics }) => {
  const expenseCategories = analytics.categories
    .filter((c) => c.type === 'expense')
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 6);

  const totalIncome = analytics.totals.totalIncome || 1;

  return (
    <div className="space-y-3">
      {expenseCategories.length === 0 ? (
        <p className="text-gray-400 text-center py-8 text-sm">No expense categories</p>
      ) : (
        expenseCategories.map((cat, idx) => {
          const percentage = totalIncome > 0 ? ((Number(cat.totalAmount) / totalIncome) * 100).toFixed(1) : 0;
          return (
            <div key={idx} className="bg-[#1a233a] p-3 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-200 text-sm font-medium">{cat.category}</span>
                <span className="text-gray-300 text-sm">₹{Number(cat.totalAmount).toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-700/40 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <p className="text-gray-500 text-xs mt-1">{percentage}% of Income</p>
            </div>
          );
        })
      )}
    </div>
  );
};

export default Home;
