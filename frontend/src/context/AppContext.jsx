import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const currency = "₹";
  const backend = import.meta.env.VITE_BACKEND_URL;

  const [usertoken, setUserToken] = useState(localStorage.getItem('usertoken') ? localStorage.getItem('usertoken') : false);
  const [userData, setUserData] = useState(false)
  const [transactions, setTransactions] = useState([]);
  const [transactionsPagination, setTransactionsPagination] = useState({
    page: 1,
    totalPages: 1,
    pageSize: 10,
    total: 0,
  });
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  const [budgets, setBudgets] = useState([]);
  const [budgetsLoading, setBudgetsLoading] = useState(false);

  const [goals, setGoals] = useState([]);
  const [goalsLoading, setGoalsLoading] = useState(false);

  const profileData = async () => {
    try {
      const { data } = await axios.get(backend + '/api/user/profile', { headers: { usertoken } });
      if (data.success) {
        setUserData(data.userdata);
      } else {
        localStorage.removeItem('usertoken');
        setUserToken(false);
        setUserData(false);
      }
    } catch (error) {
      console.log(error);
      localStorage.removeItem('usertoken');
      setUserToken(false);
      setUserData(false);
    }
  }

  const loadTransactions = async ({ page = 1, pageSize = 10, frequency = 'all' } = {}) => {
    if (!usertoken) return;
    try {
      setTransactionsLoading(true);
      const { data } = await axios.get(backend + '/api/user/transactions', {
        headers: { usertoken },
        params: { page, pageSize, frequency },
      });
      if (data.success) {
        setTransactions(data.transactions || []);
        setTransactionsPagination({
          page: data.pagination?.page || page,
          totalPages: data.pagination?.totalPages || 1,
          pageSize: data.pagination?.pageSize || pageSize,
          total: data.pagination?.total || 0,
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const loadBudgets = async () => {
    if (!usertoken) return;
    try {
      setBudgetsLoading(true);
      const { data } = await axios.get(backend + '/api/user/budgets', {
        headers: { usertoken },
      });
      if (data.success) {
        setBudgets(data.budgets || []);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setBudgetsLoading(false);
    }
  };

  const loadGoals = async () => {
    if (!usertoken) return;
    try {
      setGoalsLoading(true);
      const { data } = await axios.get(backend + '/api/user/goals', {
        headers: { usertoken },
      });
      if (data.success) {
        setGoals(data.goals || []);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setGoalsLoading(false);
    }
  };

  const value = {
    currency,
    usertoken,
    setUserToken,
    backend,
    userData, setUserData,
    profileData,
    transactions,
    setTransactions,
    transactionsPagination,
    transactionsLoading,
    loadTransactions,
    budgets,
    setBudgets,
    budgetsLoading,
    loadBudgets,
    goals,
    setGoals,
    goalsLoading,
    loadGoals,
  };


  useEffect(() => {
    if (usertoken) {
      profileData()
    } else {
      setUserData(false)
    }
  }, [usertoken]);

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};

export default AppContextProvider;
