import React, { useState } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const DashboardCharts = ({ analytics }) => {
  const [chartType, setChartType] = useState('bar');

  if (!analytics || !analytics.categories) return null;

  const expenseCategories = analytics.categories
    .filter((c) => c.type === 'expense')
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 6);

  if (expenseCategories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>No expense activity yet. Add transactions to see charts.</p>
      </div>
    );
  }

  const chartData = {
    labels: expenseCategories.map((c) => c.category),
    datasets: [
      {
        label: 'Expense Amount (₹)',
        data: expenseCategories.map((c) => Number(c.totalAmount) || 0),
        backgroundColor:
          chartType === 'pie'
            ? ['#6c63ff', '#40a9ff', '#28a745', '#ffc107', '#ff4d4f', '#1890ff']
            : '#6c63ff',
        borderColor: chartType === 'pie' ? '#27273e' : '#5a5adb',
        borderWidth: chartType === 'pie' ? 2 : 1,
        borderRadius: chartType === 'bar' ? 4 : 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: { color: '#a0a0b0' },
        position: chartType === 'pie' ? 'bottom' : 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed?.y ?? context.parsed ?? context.raw ?? 0;
            return `${context.label}: ₹${Number(value).toFixed(2)}`;
          },
        },
      },
    },
    scales:
      chartType !== 'pie'
        ? {
            y: {
              ticks: { color: '#a0a0b0' },
              grid: { color: '#333' },
              beginAtZero: true,
            },
            x: {
              ticks: { color: '#a0a0b0' },
              grid: { color: '#333' },
            },
          }
        : undefined,
  };

  return (
    <div>
      {/* Chart Type Toggle */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white text-lg font-semibold">Your Activity</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('bar')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              chartType === 'bar'
                ? 'bg-purple-600 text-white'
                : 'bg-[#1a233a] text-gray-400 hover:text-white'
            }`}
          >
            📊 Bar
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              chartType === 'pie'
                ? 'bg-purple-600 text-white'
                : 'bg-[#1a233a] text-gray-400 hover:text-white'
            }`}
          >
            🥧 Pie
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              chartType === 'line'
                ? 'bg-purple-600 text-white'
                : 'bg-[#1a233a] text-gray-400 hover:text-white'
            }`}
          >
            📈 Line
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-80">
        {chartType === 'bar' && <Bar data={chartData} options={chartOptions} />}
        {chartType === 'pie' && <Pie data={chartData} options={chartOptions} />}
        {chartType === 'line' && (
          <Line
            data={{
              ...chartData,
              datasets: [
                {
                  ...chartData.datasets[0],
                  borderColor: '#6c63ff',
                  backgroundColor: 'rgba(108, 99, 255, 0.1)',
                  borderWidth: 3,
                  fill: true,
                  tension: 0.4,
                  pointBackgroundColor: '#6c63ff',
                  pointBorderColor: '#fff',
                  pointBorderWidth: 2,
                  pointRadius: 5,
                  pointHoverRadius: 7,
                },
              ],
            }}
            options={chartOptions}
          />
        )}
      </div>
    </div>
  );
};

export default DashboardCharts;


