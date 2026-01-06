import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const PAGE_SIZE = 7;

const getInitialFormData = () => ({
  type: 'expense',
  category: '',
  amount: '',
  description: '',
  transaction_date: new Date().toISOString().split('T')[0]
});

const Transactions = () => {
  const {
    usertoken,
    backend,
    transactions,
    transactionsPagination,
    transactionsLoading,
    loadTransactions,
  } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(getInitialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  const isAddPage = location.pathname === '/transactions/add';

  useEffect(() => {
    if (usertoken && !isAddPage) {
      fetchTransactions();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usertoken, location.pathname, page]);

  const fetchTransactions = async () => {
    setLoading(true);
    await loadTransactions({ page, pageSize: PAGE_SIZE, frequency: 'all' });
    setLoading(false);
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

  const formatAmount = (amount) => `₹${parseFloat(amount).toFixed(2)}`;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate description is provided
    if (!formData.description || !formData.description.trim()) {
      toast.error('Description is required for AI categorization');
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await axios.post(
        `${backend}/api/user/transactions`,
        formData,
        { headers: { usertoken } }
      );

      if (data.success) {
        if (data.aiCategory && !formData.category) {
          toast.success(`Transaction added! AI categorized as: ${data.aiCategory}`);
        } else if (data.aiCategory) {
          toast.success(`Transaction added! (AI suggested: ${data.aiCategory})`);
        } else {
          toast.success('Transaction added successfully!');
        }
        setFormData(getInitialFormData());
        navigate('/transactions');
        setPage(1);
        await loadTransactions({ page: 1, pageSize: PAGE_SIZE, frequency: 'all' });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to add transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (transactionId) => {
    if (!window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) return;

    try {
      const { data } = await axios.delete(
        `${backend}/api/user/transactions/${transactionId}`,
        { headers: { usertoken } }
      );

      if (data.success) {
        toast.success('Transaction deleted successfully!');
        await loadTransactions({ page, pageSize: PAGE_SIZE, frequency: 'all' });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to delete transaction');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await axios.get(
        `${backend}/api/user/transactions/export/csv`,
        {
          headers: { usertoken },
          responseType: 'blob', // Important for file download
        }
      );

      // Create a blob from the response
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transactions.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('CSV file downloaded successfully!');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to export CSV');
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await axios.get(
        `${backend}/api/user/transactions/export/pdf`,
        {
          headers: { usertoken },
          responseType: 'blob', // Important for file download
        }
      );

      // Create a blob from the response
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transactions.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('PDF file downloaded successfully!');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to export PDF');
    }
  };

  if (!usertoken) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="mb-6">
          <svg
            className="w-32 h-32 mx-auto text-gray-600 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-white mb-2">Please Log In</h2>
        <p className="text-gray-400 mb-6">You need to be logged in to view your transactions</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-full transition-colors"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if ((loading || transactionsLoading) && !isAddPage) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Loading transactions...</div>
      </div>
    );
  }

  if (isAddPage) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Add Transaction</h1>
          <button
            onClick={() => navigate('/transactions')}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors text-sm md:text-base"
          >
            ← Back
          </button>
        </div>

        <div className="bg-[#141b32] p-6 rounded-xl shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Type <span className="text-red-400">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full bg-[#1a233a] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Category
                  <span className="text-purple-400 text-xs ml-2">(Auto-filled by AI if description provided)</span>
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="Will be auto-filled from description"
                  className="w-full bg-[#1a233a] border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Amount <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full bg-[#1a233a] border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  name="transaction_date"
                  value={formData.transaction_date}
                  onChange={handleInputChange}
                  className="w-full bg-[#1a233a] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Description <span className="text-red-400">*</span>
                <span className="text-purple-400 text-xs ml-2">(AI will auto-categorize)</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="e.g., Lunch at pizza restaurant, Uber ride to office..."
                rows="3"
                className="w-full bg-[#1a233a] border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                required
              />
              <p className="text-gray-500 text-xs mt-1">
                💡 Provide a detailed description for better AI categorization. Category will be auto-suggested if left empty.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                {submitting ? 'Adding...' : 'Add Transaction'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/transactions')}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Transactions</h1>
          <button
            onClick={() => navigate('/transactions/add')}
            className="px-3 py-2 md:px-4 md:py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors text-sm md:text-base"
          >
            + Add
          </button>
        </div>
        
        {/* Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Pagination */}
          <div className="flex items-center gap-2 text-gray-300 text-sm">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2 py-1 md:px-3 md:py-2 bg-[#1a233a] border border-gray-700 rounded-lg text-white hover:bg-[#222c45] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              &lt;
            </button>
            <span className="text-xs md:text-sm">
              {transactionsPagination.page || page}/{transactionsPagination.totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(transactionsPagination.totalPages || 1, p + 1))}
              disabled={page >= (transactionsPagination.totalPages || 1)}
              className="px-2 py-1 md:px-3 md:py-2 bg-[#1a233a] border border-gray-700 rounded-lg text-white hover:bg-[#222c45] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              &gt;
            </button>
          </div>
          
          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="p-2 md:px-3 md:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              title="Export CSV"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden md:inline ml-1">CSV</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="p-2 md:px-3 md:py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              title="Export PDF"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="hidden md:inline ml-1">PDF</span>
            </button>
          </div>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-[#141b32] p-12 rounded-xl shadow-lg text-center">
          <svg
            className="w-20 h-20 mx-auto mb-4 text-gray-600 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-gray-400 text-lg mb-2">No transactions yet</p>
          <p className="text-gray-500 text-sm">Start adding transactions to track your finances</p>
        </div>
      ) : (
        <div className="bg-[#141b32] rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1a233a] border-b border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Description</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Amount</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-[#1a233a] transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {formatDate(transaction.transaction_date)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          transaction.type === 'income'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {transaction.type === 'income' ? 'Income' : 'Expense'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{transaction.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {transaction.description || '-'}
                    </td>
                    <td
                      className={`px-6 py-4 text-sm font-semibold text-right ${
                        transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatAmount(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg transition-colors text-sm font-medium"
                        title="Delete transaction"
                      >
                        <svg
                          className="w-4 h-4 inline-block"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
