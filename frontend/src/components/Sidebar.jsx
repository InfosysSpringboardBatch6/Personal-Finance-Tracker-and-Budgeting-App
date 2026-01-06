import React from "react";
import { NavLink } from "react-router-dom";
import { assets } from "../assets/assets";
import { X } from "lucide-react";

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-screen w-64 bg-[#0d1224] shadow-xl p-5 text-gray-300 flex flex-col gap-6 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        {/* Close button - mobile only */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[#1a233a] md:hidden"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-4">
          <img src={assets.logo} alt="logo" className="w-10" />
          <h1 className="text-xl font-semibold text-white">FinanceApp</h1>
        </div>

        {/* Menu Links */}
        <nav className="flex flex-col gap-2">
          <SidebarLink path="/" label="Dashboard" icon={assets.home_icon} onClose={onClose} />
          <SidebarLink path="/transactions" label="Transactions" icon={assets.transaction_icon} onClose={onClose} />
          <SidebarLink path="/budget" label="Budget" icon={assets.budget_icon} onClose={onClose} />
          <SidebarLink path="/goals" label="Goals" icon={assets.goals_icon} onClose={onClose} />
          <SidebarLink path="/analytics" label="Analytics" icon={assets.transaction_icon} onClose={onClose} />
          <SidebarLink path="/ai-features" label="AI Features" icon={assets.ai_icon} onClose={onClose} />
        </nav>
      </div>
    </>
  );
};

const SidebarLink = ({ path, label, icon, onClose }) => {
  return (
    <NavLink
      to={path}
      onClick={onClose}
      className={({ isActive }) =>
        `flex items-center gap-4 px-4 py-3 rounded-lg transition-all 
        ${isActive ? "bg-[#1a233a] text-white" : "hover:bg-[#141a2e]"}` 
      }
    >
      {/* White circular icon background */}
      <div className="w-8 h-9 rounded-full bg-[#103a5b] flex items-center justify-center">
        <img src={icon} className="w-5 h-5" alt={label} />
      </div>

      <span>{label}</span>
    </NavLink>
  );
};

export default Sidebar;
