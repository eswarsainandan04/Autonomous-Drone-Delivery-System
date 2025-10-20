"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faUser, faLock } from "@fortawesome/free-solid-svg-icons"

const Login = () => {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("") // Clear previous errors

    try {
      const response = await fetch("http://localhost:5062/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Assuming your backend sends full_name in the response data

        sessionStorage.setItem("username", data.username) // Store full_name
        sessionStorage.setItem("full_name", data.full_name) // Store full_name
        navigate("/") // Redirect to main page
      } else {
        setError(data.error || "Login failed. Please try again.")
      }
    } catch (err) {
      console.error("Login API call failed:", err)
      setError("Network error. Please try again later.")
    }
  }

  const handleForgotPassword = () => {
    navigate("/reset-password")
  }

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header with shadowfly.jpg image */}
        <div className="bg-[#171e2a] text-white px-6 py-5 flex items-center justify-between">
          <img src="/shadowfly.jpg" alt="ShadowFly Logo" className="h-10 w-auto object-contain" />
        </div>

        {/* Login Form Content */}
        <div className="p-8">
          <h2 className="text-2xl text-center text-gray-800 mb-8 font-semibold">Welcome to Site Control</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <FontAwesomeIcon
                icon={faUser}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <div className="relative">
              <FontAwesomeIcon
                icon={faLock}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors cursor-pointer bg-transparent border-none"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-blue-600 text-white rounded-lg text-base font-semibold hover:bg-blue-700 hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Login
            </button>
          </form>

          {error && (
            <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg text-center text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
