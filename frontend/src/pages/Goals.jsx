import React, { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const Goals = () => {
  const { usertoken, backend, goals, setGoals, goalsLoading, loadGoals } = useContext(AppContext);
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [inlineSaving, setInlineSaving] = useState(null);
  const [form, setForm] = useState({
    title: '',
    target_amount: '',
    target_date: '',
    description: '',
  });

  const currency = useMemo(() => '₹', []);

  useEffect(() => {
    if (usertoken) {
      loadGoals();
    }
  }, [usertoken]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (form.target_amount === '') {
      toast.error('Target amount is required');
      return;
    }
    try {
      setSaving(true);
      const { data } = await axios.post(
        `${backend}/api/user/goals`,
        {
          title: form.title.trim(),
          target_amount: Number(form.target_amount),
          target_date: form.target_date || null,
          description: form.description?.trim() || '',
        },
        { headers: { usertoken } }
      );
      if (data.success) {
        toast.success(data.message || 'Goal created');
        setForm({ title: '', target_amount: '', target_date: '', description: '' });
        loadGoals();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save goal');
    } finally {
      setSaving(false);
    }
  };

  const handleInlineSave = async (id, updates) => {
    try {
      setInlineSaving(id);
      const { data } = await axios.put(`${backend}/api/user/goals/${id}`, updates, {
        headers: { usertoken },
      });
      if (data.success) {
        toast.success('Goal updated');
        setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to update goal');
    } finally {
      setInlineSaving(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this goal?')) return;
    try {
      const { data } = await axios.delete(`${backend}/api/user/goals/${id}`, {
        headers: { usertoken },
      });
      if (data.success) {
        toast.success('Goal removed');
        setGoals((prev) => prev.filter((g) => g.id !== id));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to delete goal');
    }
  };

  if (!usertoken) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-semibold text-white mb-2">Please log in</h2>
        <p className="text-gray-400 mb-6">Log in to manage your goals</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-full transition-colors"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (goalsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Loading goals...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Goals</h1>
        <p className="text-gray-400 text-sm">Set savings targets and track progress</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-[#141b32] p-5 rounded-xl shadow-lg">
          <h2 className="text-white text-lg font-semibold mb-4">Add Goal</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleFormChange}
                placeholder="Buy a laptop, emergency fund..."
                className="w-full bg-[#1a233a] border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1">Target Amount</label>
              <input
                type="number"
                name="target_amount"
                min="0"
                step="500.00"
                value={form.target_amount}
                onChange={handleFormChange}
                placeholder="0.00"
                className="w-full bg-[#1a233a] border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1">Target Date (optional)</label>
              <input
                type="date"
                name="target_date"
                value={form.target_date}
                onChange={handleFormChange}
                className="w-full bg-[#1a233a] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-1">Description (optional)</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleFormChange}
                rows={3}
                className="w-full bg-[#1a233a] border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="Notes about this goal"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : 'Save Goal'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-[#141b32] p-5 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-lg font-semibold">Your Goals</h2>
            <span className="text-gray-400 text-sm">{goals.length} goals</span>
          </div>

          {goals.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              No goals yet. Add one to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#1a233a] border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Title</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                      Target ({currency})
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                      Saved ({currency})
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Target Date</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {goals.map((goal) => (
                    <GoalRow
                      key={goal.id}
                      goal={goal}
                      currency={currency}
                      onSave={handleInlineSave}
                      onDelete={handleDelete}
                      saving={inlineSaving === goal.id}
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

const GoalRow = ({ goal, currency, onSave, onDelete, saving }) => {
  const [savedAmount, setSavedAmount] = useState(goal.saved_amount);
  const isCompleted = goal.status === 'completed' || Number(savedAmount) >= Number(goal.target_amount);

  useEffect(() => {
    setSavedAmount(goal.saved_amount);
  }, [goal.saved_amount]);

  const formattedDate = goal.target_date
    ? new Date(goal.target_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    : '-';

  return (
    <tr className="hover:bg-[#1a233a] transition-colors">
      <td className="px-4 py-3 text-sm text-gray-200">
        <div className="font-semibold text-white">{goal.title}</div>
        <div className="text-gray-400 text-xs mt-1">{goal.description || 'No description'}</div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-200">
        {currency}
        {Number(goal.target_amount).toFixed(2)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">{currency}</span>
          <input
            type="number"
            min="0"
            step="500.01"
            value={savedAmount}
            onChange={(e) => setSavedAmount(e.target.value)}
            className="w-28 bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-200">{formattedDate}</td>
      <td className="px-4 py-3 text-center">
        <span
          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
            isCompleted ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'
          }`}
        >
          {isCompleted ? 'Completed' : 'Active'}
        </span>
      </td>
      <td className="px-4 py-3 text-center space-x-2">
        <button
          onClick={() =>
            onSave(goal.id, {
              saved_amount: savedAmount,
              status: Number(savedAmount) >= Number(goal.target_amount) ? 'completed' : 'active',
            })
          }
          disabled={saving}
          className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-sm disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={() => onDelete(goal.id)}
          className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm"
        >
          Delete
        </button>
      </td>
    </tr>
  );
};

export default Goals;

