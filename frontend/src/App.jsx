import React, { useState } from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Transactions from "./pages/Transactions";
import Budget from "./pages/Budget";
import Analytics from "./pages/Analytics";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "./components/Sidebar";
import Header from './components/Header'
import Goals from "./pages/Goals";
import AiFeatures from "./pages/AiFeatures";

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-[#0b1022] text-white">
      <ToastContainer />
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      
      {/* Main content area - responsive margin */}
      <div className="md:ml-64 px-4 md:px-6 py-4 md:py-6">
        <Header onMenuClick={toggleSidebar} />
      </div>
      <div className="md:ml-64 px-4 md:px-6 py-4 md:py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/transactions/add" element={<Transactions />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/ai-features" element={<AiFeatures />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;