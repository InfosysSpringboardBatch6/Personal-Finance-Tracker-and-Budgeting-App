import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const { backend, usertoken, setUserToken } = useContext(AppContext);

  const [state, setState] = useState("Register"); // 'Register' or 'Login'
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword] = useState(false);

  useEffect(() => {
    if (usertoken) navigate("/");
  }, [usertoken, navigate]);

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (state === "Register") {
        const { data } = await axios.post(`${backend}/api/user/register`, { name, password, email });
        if (data.success) {
          localStorage.setItem("usertoken", data.usertoken);
          setUserToken(data.usertoken);
          toast.success(data.message || "Registered successfully");
        } else {
          toast.error(data.message || "Registration failed");
        }
      } else {
        const { data } = await axios.post(`${backend}/api/user/login`, { password, email });
        if (data.success) {
          localStorage.setItem("usertoken", data.usertoken);
          setUserToken(data.usertoken);
          toast.success(data.message || "Logged in");
        } else {
          toast.error(data.message || "Login failed");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-[#141b32] rounded-2xl shadow-xl p-8 border border-[#1f2942]">
          {/* Header */}
          <div className="flex items-center gap-3 justify-center mb-6">
            <div className="text-center">
              <h1 className="text-white text-2xl font-semibold">{state === "Register" ? "Create Account" : "Welcome Back"}</h1>
              <p className="text-gray-400 text-sm">{state === "Register" ? "Sign up to get started" : "Log in to continue"}</p>
            </div>
          </div>

          <form onSubmit={onSubmitHandler}>
            {state === "Register" && (
              <div className="mb-4">
                <label className="block text-sm text-gray-300 mb-2">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="w-full bg-[#0f1626] text-gray-100 placeholder-gray-500 border border-transparent rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-[#0f1626] text-gray-100 placeholder-gray-500 border border-transparent rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div className="mb-4 relative">
              <label className="block text-sm text-gray-300 mb-2">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full bg-[#0f1626] text-gray-100 placeholder-gray-500 border border-transparent rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-full py-2 font-semibold transition ${
                loading ? "opacity-70 cursor-not-allowed" : "bg-gradient-to-r from-[#6a34c7] to-[#8b5cf6] hover:from-[#7b3bd1] hover:to-[#9a6bff]"
              } text-white`}
            >
              {loading ? (state === "Register" ? "Registering..." : "Logging in...") : (state === "Register" ? "Sign Up" : "Log In")}
            </button>

            <div className="mt-4 text-center text-sm text-gray-400">
              {state === "Register" ? (
                <>
                  Already have an account?{" "}
                  <button type="button" onClick={() => setState("Login")} className="text-purple-300 hover:underline">
                    Log in
                  </button>
                </>
              ) : (
                <>
                  New here?{" "}
                  <button type="button" onClick={() => setState("Register")} className="text-purple-300 hover:underline">
                    Create account
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
