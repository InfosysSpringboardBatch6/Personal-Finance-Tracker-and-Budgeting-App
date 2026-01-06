import React, { useContext, useState } from "react";
import { assets } from "../assets/assets";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import NotificationPopup from "./NotificationPopup";
import { Menu } from "lucide-react";

const Header = ({ onMenuClick }) => {
  const { usertoken, userData, setUserToken } = useContext(AppContext);
  const navigate = useNavigate();
  const [notificationOpen, setNotificationOpen] = useState(false);

  const logout = () => {
    setUserToken(false);
    localStorage.removeItem("usertoken");
  };

  const toggleNotification = () => {
    setNotificationOpen(!notificationOpen);
  };

  return (
    <div className="w-full flex items-center justify-between px-4 md:px-6 py-4 bg-gradient-to-r from-[#0a0f1d] to-[#111b2e] rounded-xl shadow-lg">

      {/* Left Side */}
      <div className="flex items-center gap-3">
        {/* Hamburger menu - mobile only */}
        <button 
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-[#1a233a] md:hidden"
        >
          <Menu className="w-6 h-6 text-gray-300" />
        </button>
        
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-white flex items-center gap-2">
            Welcome! 👋
          </h1>
          <p className="text-gray-400 text-xs md:text-sm hidden sm:block">Start tracking your finances</p>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2 md:gap-4">

        {/* Notification Bell */}
        {usertoken && (
          <div className="relative">
            <button
              onClick={toggleNotification}
              className="notification-bell-button bg-[#1b233a] p-2 rounded-lg hover:bg-[#23304d] transition relative"
            >
              <img src={assets.bell_icon} className="w-5" alt="bell" />
            </button>
            <NotificationPopup
              isOpen={notificationOpen}
              onClose={() => setNotificationOpen(false)}
            />
          </div>
        )}

        {/* Profile Dropdown */}
        {usertoken && userData ? (
          <div className="relative group flex items-center gap-2 cursor-pointer">

            {/* User Profile Image */}
            <img
              className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-700"
              src={userData.image}
              alt="user"
            />

            {/* Small dropdown icon */}
            <img className="w-2.5 hidden md:block" src={assets.dropdown_icon} alt="" />

            {/* Dropdown Menu */}
            <div className="absolute right-0 top-0 z-20 hidden group-hover:block pt-14">
              <div className="bg-stone-100 min-w-48 rounded-lg shadow-lg p-4 flex flex-col gap-3 text-gray-700 text-sm font-medium">

                <p
                  onClick={() => navigate("/profile")}
                  className="cursor-pointer hover:text-black"
                >
                  My Profile
                </p>

                <p
                  onClick={logout}
                  className="cursor-pointer hover:text-black"
                >
                  Logout
                </p>

              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="group relative z-10 flex items-center justify-center gap-2 overflow-hidden rounded-full border-2 border-gray-50 bg-gray-50 px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-md shadow-lg backdrop-blur-md isolation-auto text-gray-900 font-medium before:absolute before:-left-full before:aspect-square before:w-full before:rounded-full before:bg-emerald-500 before:transition-all before:duration-700 before:hover:left-0 before:hover:w-full before:hover:scale-150 hover:text-white before:-z-10"
          >
            <span className="hidden sm:inline">Register Now</span>
            <span className="sm:hidden">Login</span>
          </button>
        )}

      </div>
    </div>
  );
};

export default Header;
