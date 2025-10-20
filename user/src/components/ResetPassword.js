"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import emailjs from "@emailjs/browser"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faUser, faLock, faKey, faArrowLeft } from "@fortawesome/free-solid-svg-icons"

const ResetPassword = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Enter username/email, 2: Enter OTP and new password
  const [usernameOrEmail, setUsernameOrEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [generatedOtp, setGeneratedOtp] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [username, setUsername] = useState("")

  // EmailJS configuration
  const EMAILJS_PUBLIC_KEY = "PYx32kIU5UYnouHXW"
  const EMAILJS_SERVICE_ID = "service_34u8aka"
  const EMAILJS_TEMPLATE_ID = "template_tyltts9"


  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  const validatePassword = (password) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long"
    }
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return "Password must contain both letters and numbers"
    }
    return null
  }

  const handleStep1Submit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      console.log("Checking user existence for:", usernameOrEmail)

      // Check if user exists in database
      const response = await fetch("http://localhost:5062/check_user_exists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username_or_email: usernameOrEmail }),
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Response data:", data)

      if (data.exists) {
        // User exists, generate OTP and send email
        const otpCode = generateOTP()
        setGeneratedOtp(otpCode)
        setUserEmail(data.email)
        setUsername(data.username)

        console.log("Sending OTP via EmailJS...")

        // Initialize EmailJS
        emailjs.init(EMAILJS_PUBLIC_KEY)

        // Send OTP via EmailJS
        const templateParams = {
          email: data.email,
          otp: otpCode, // Changed to use 'otp' - clearer variable name
          name: data.full_name,
          username: data.username,
        }

        try {
          const emailResult = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
          console.log("Email sent successfully:", emailResult)
          setSuccess(`OTP has been sent to your registered email: ${data.email}`)
          setStep(2)
        } catch (emailError) {
          console.error("EmailJS error:", emailError)
          setError("Failed to send OTP email. Please check your email configuration.")
        }
      } else {
        setError("YOU ARE NOT REGISTERED FOR THIS SITE")
      }
    } catch (err) {
      console.error("Error in handleStep1Submit:", err)
      if (err.message.includes("fetch")) {
        setError("Cannot connect to server. Please ensure the backend is running on http://localhost:5062")
      } else {
        setError(`Network error: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStep2Submit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Validate OTP
    if (otp !== generatedOtp) {
      setError("Invalid OTP. Please check and try again.")
      return
    }

    // Validate password
    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      setError(passwordError)
      return
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)

    try {
      console.log("Resetting password for user:", username)

      // Reset password
      const response = await fetch("http://localhost:5062/reset_password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          new_password: newPassword,
        }),
      })

      console.log("Reset password response status:", response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Reset password response:", data)

      if (response.ok) {
        setSuccess("Password reset successfully! Redirecting to login...")
        setTimeout(() => {
          navigate("/login")
        }, 2000)
      } else {
        setError(data.error || "Failed to reset password. Please try again.")
      }
    } catch (err) {
      console.error("Error resetting password:", err)
      if (err.message.includes("fetch")) {
        setError("Cannot connect to server. Please ensure the backend is running on http://localhost:5062")
      } else {
        setError(`Network error: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    navigate("/login")
  }

  const handleBackToStep1 = () => {
    setStep(1)
    setOtp("")
    setNewPassword("")
    setConfirmPassword("")
    setError("")
    setSuccess("")
  }

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#171e2a] text-white px-6 py-5 flex items-center justify-between">
          <img src="/shadowfly.jpg" alt="ShadowFly Logo" className="h-10 w-auto object-contain" />
          <button
            onClick={step === 1 ? handleBackToLogin : handleBackToStep1}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
          </button>
        </div>

        {/* Reset Password Form Content */}
        <div className="p-8">
          <h2 className="text-2xl text-center text-gray-800 mb-2 font-semibold">
            {step === 1 ? "Reset Password" : "Verify OTP & Set New Password"}
          </h2>
          <p className="text-center text-gray-600 mb-8 text-sm">
            {step === 1
              ? "Enter your username or email to receive OTP"
              : "Enter the OTP sent to your email and set new password"}
          </p>

          {step === 1 ? (
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div className="relative">
                <FontAwesomeIcon
                  icon={faUser}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="Enter username or email"
                  required
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white rounded-lg text-base font-semibold hover:bg-blue-700 hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleStep2Submit} className="space-y-6">
              <div className="relative">
                <FontAwesomeIcon
                  icon={faKey}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  required
                  maxLength="6"
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
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password (8+ chars, letters & numbers)"
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
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  required
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-green-600 text-white rounded-lg text-base font-semibold hover:bg-green-700 hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Resetting Password..." : "Reset Password"}
              </button>
            </form>
          )}

          {error && (
            <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg text-center text-red-600 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg text-center text-green-600 text-sm">
              {success}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
