import { useState, useContext } from "react";
import { Loader2, ShoppingBag, Heart, Lightbulb, TrendingUp } from "lucide-react";
import axios from "axios";
import { AppContext } from "@/context/AppContext";
import { toast } from "react-toastify";
import React from "react";

interface AnalysisResult {
  category: "Need" | "Want" | "Unknown";
  confidence: number;
  reasoning: string;
  tips?: string[];
}

export function NeedsWantsAnalyzer() {
  const { backend, usertoken } = useContext(AppContext);
  const [expense, setExpense] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyzeExpense = async () => {
    if (!expense || !amount) {
      toast.error("Please enter an expense name and amount");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data } = await axios.post(
        `${backend}/api/user/ai/analyze-expense`,
        { expense, amount: parseFloat(amount), description },
        { headers: { usertoken } }
      );

      setResult(data);
      toast.success("Analysis complete!");
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast.error(error.response?.data?.error || error.message || "Failed to analyze expense");
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setExpense("");
    setAmount("");
    setDescription("");
    setResult(null);
  };

  return (
    <div className="bg-[#1a233a] rounded-lg overflow-hidden shadow-xl border border-[#2d3748]">
      <div className="bg-gradient-to-r from-[#10b981] to-[#3b82f6] text-white p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Needs vs Wants Analyzer</h2>
            <p className="text-white/80 text-sm">
              AI-powered expense categorization
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">What did you buy?</label>
            <input
              type="text"
              placeholder="e.g., New headphones, Groceries, Netflix subscription"
              value={expense}
              onChange={(e) => setExpense(e.target.value)}
              className="w-full bg-[#0d1224] border border-[#2d3748] rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#3b82f6] transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 text-lg">₹</span>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 bg-[#0d1224] border border-[#2d3748] rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#3b82f6] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Additional context (optional)</label>
            <textarea
              placeholder="Any extra details about this purchase..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0d1224] border border-[#2d3748] rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#3b82f6] transition-colors resize-none"
              rows={2}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={analyzeExpense}
              disabled={loading || !expense || !amount}
              className="flex-1 bg-gradient-to-r from-[#10b981] to-[#3b82f6] hover:opacity-90 transition-opacity text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Analyze Expense
                </>
              )}
            </button>
            {result && (
              <button
                onClick={clearForm}
                className="border border-[#2d3748] text-white px-4 py-2 rounded-lg hover:bg-[#0d1224] transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {result && (
          <div className="space-y-4 pt-4 border-t border-[#2d3748]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-xl ${result.category === "Need"
                    ? "bg-[#10b981]/10 text-[#10b981]"
                    : result.category === "Want"
                      ? "bg-[#f59e0b]/10 text-[#f59e0b]"
                      : "bg-gray-500/10 text-gray-400"
                    }`}
                >
                  {result.category === "Need" ? (
                    <ShoppingBag className="h-6 w-6" />
                  ) : (
                    <Heart className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-400">This is a</p>
                  <p className="text-2xl font-bold text-white">{result.category}</p>
                </div>
              </div>
              <span
                className={`text-sm px-3 py-1 rounded-lg ${result.confidence >= 80
                  ? "bg-[#10b981]/10 text-[#10b981]"
                  : result.confidence >= 60
                    ? "bg-[#f59e0b]/10 text-[#f59e0b]"
                    : "bg-gray-500/10 text-gray-400"
                  }`}
              >
                {result.confidence}% confident
              </span>
            </div>

            <div className="p-4 bg-[#0d1224] rounded-lg border border-[#2d3748]">
              <p className="text-sm text-white leading-relaxed">{result.reasoning}</p>
            </div>

            {result.tips && result.tips.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
                  <Lightbulb className="h-4 w-4 text-[#f59e0b]" />
                  Money-saving tips
                </div>
                <ul className="space-y-2">
                  {result.tips.map((tip, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-white p-3 bg-[#f59e0b]/5 rounded-lg border border-[#2d3748]"
                    >
                      <span className="text-[#f59e0b] font-medium">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
