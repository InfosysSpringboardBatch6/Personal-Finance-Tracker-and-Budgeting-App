import React, { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const suggestedCategories = ['Food', 'Entertainment', 'Travel', 'Shopping'];

const Budget = () => {
  const { usertoken, backend, budgets, budgetsLoading, loadBudgets, setBudgets } = useContext(AppContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ category: '', amount: '' });
  const [saving, setSaving] = useState(false);
  const [inlineSaving, setInlineSaving] = useState(null);

  const currency = useMemo(() => '₹', []);

  useEffect(() => {
    if (usertoken) {
      loadBudgets();
    }
  }, [usertoken]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category.trim()) {
      toast.error('Category is required');
      return;
    }
    if (form.amount === '') {
      toast.error('Amount is required');
      return;
    }
    try {
      setSaving(true);
      const { data } = await axios.post(
        `${backend}/api/user/budgets`,
        { category: form.category.trim(), amount: Number(form.amount) },
        { headers: { usertoken } }
      );
      if (data.success) {
        toast.success(data.message || 'Budget saved');
        setForm({ category: '', amount: '' });
        loadBudgets();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const handleInlineSave = async (id, amount) => {
    try {
      setInlineSaving(id);
      const { data } = await axios.put(
        `${backend}/api/user/budgets/${id}`,
        { amount: Number(amount) },
        { headers: { usertoken } }
      );
      if (data.success) {
        toast.success('Budget updated');
        setBudgets((prev) => prev.map((b) => (b.id === id ? { ...b, amount: Number(amount) } : b)));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to update budget');
    } finally {
      setInlineSaving(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget?')) return;
    try {
      const { data } = await axios.delete(`${backend}/api/user/budgets/${id}`, {
        headers: { usertoken },
      });
      if (data.success) {
        toast.success('Budget removed');
        setBudgets((prev) => prev.filter((b) => b.id !== id));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to delete budget');
    }
  };

  if (!usertoken) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-semibold text-white mb-2">Please log in</h2>
        <p className="text-gray-400 mb-6">Log in to manage your budgets</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-full transition-colors"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (budgetsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Loading budgets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Budget</h1>
        <p className="text-gray-400 text-sm">Set limits per category</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-[#141b32] p-5 rounded-xl shadow-lg">
          <h2 className="text-white text-lg font-semibold mb-4">Add / Update Budget</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1">Category</label>
              <input
                type="text"
                name="category"
                value={form.category}
                onChange={handleFormChange}
                placeholder="e.g., Food"
                className="w-full bg-[#1a233a] border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {suggestedCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, category: cat }))}
                    className="px-3 py-1 text-xs bg-[#1f2942] text-gray-200 rounded-full hover:bg-[#243050]"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1">Amount</label>
              <input
                type="number"
                name="amount"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={handleFormChange}
                placeholder="0.00"
                className="w-full bg-[#1a233a] border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : 'Save Budget'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-[#141b32] p-5 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-lg font-semibold">Your Categories</h2>
            <span className="text-gray-400 text-sm">{budgets.length} categories</span>
          </div>

          {budgets.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              No budgets yet. Add one to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#1a233a] border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                      Amount ({currency})
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {budgets.map((budget) => (
                    <BudgetRow
                      key={budget.id}
                      budget={budget}
                      currency={currency}
                      onSave={handleInlineSave}
                      onDelete={handleDelete}
                      saving={inlineSaving === budget.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BudgetRow = ({ budget, currency, onSave, onDelete, saving }) => {
  const [amount, setAmount] = useState(budget.amount);

  useEffect(() => {
    setAmount(budget.amount);
  }, [budget.amount]);

  return (
    <tr className="hover:bg-[#1a233a] transition-colors">
      <td className="px-4 py-3 text-sm text-gray-200">{budget.category}</td>
      <td className="px-4 py-3 text-sm text-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">{currency}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-32 bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </td>
      <td className="px-4 py-3 text-center space-x-2">
        <button
          onClick={() => onSave(budget.id, amount)}
          disabled={saving}
          className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-sm disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={() => onDelete(budget.id)}
          className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm"
        >
          Delete
        </button>
      </td>
    </tr>
  );
};

export default Budget;


