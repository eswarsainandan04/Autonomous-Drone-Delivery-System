"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faArrowLeft,
  faUser,
  faEnvelope,
  faPhone,
  faIdBadge,
  faUserShield,
  faCheckCircle,
  faLock,
  faTimes,
  faEye,
  faEyeSlash,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons"

// Enhanced Change Password Popup Component
const ChangePasswordPopup = ({ username, onClose, onPasswordChangeSuccess }) => {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordChangeMessage, setPasswordChangeMessage] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordChangeMessage("")
    setPasswordError("")
    setIsLoading(true)

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.")
      setIsLoading(false)
      return
    }

    if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setPasswordError("Password must be at least 8 characters long and contain a combination of letters and numbers.")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("http://127.0.0.1:5062/change_password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, new_password: newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password.")
      }

      setPasswordChangeMessage(data.message)
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => {
        onPasswordChangeSuccess()
      }, 2000)
    } catch (err) {
      setPasswordError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full flex justify-center items-center z-50 p-4">
      <div className="relative bg-white w-full max-w-md mx-auto rounded-2xl shadow-2xl transform transition-all duration-300 scale-100">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-2xl p-6 text-white">
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors duration-200 p-1 rounded-full hover:bg-white hover:bg-opacity-20"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faTimes} className="text-xl" />
          </button>
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faLock} className="text-2xl" />
            <h2 className="text-2xl font-bold">Change Password</h2>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="newPassword" className="block text-gray-700 text-sm font-semibold">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 pr-12"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength="8"
                  pattern="^(?=.*[a-zA-Z])(?=.*\d).{8,}$"
                  title="Password must be at least 8 characters long and contain a combination of letters and numbers."
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-semibold">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 pr-12"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            {passwordError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faTimes} className="text-red-500" />
                <p className="text-red-700 text-sm">{passwordError}</p>
              </div>
            )}

            {passwordChangeMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                <p className="text-green-700 text-sm">{passwordChangeMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  Changing Password...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faLock} />
                  Change Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

const Profile = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [userDetails, setUserDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showPasswordPopup, setShowPasswordPopup] = useState(false)

  const handleGoBackWithUsername = () => {
    const usernameToPassBack = userDetails?.username || sessionStorage.getItem("username")
    navigate("/", { state: { username: usernameToPassBack } })
  }

  useEffect(() => {
    const fetchUserDetails = async () => {
      const usernameFromState = location.state?.username
      console.log("Profile.js: Username from location state:", usernameFromState)

      let usernameToFetch = usernameFromState

      if (!usernameToFetch) {
        usernameToFetch = sessionStorage.getItem("username")
        console.log("Profile.js: Username from sessionStorage (fallback):", usernameToFetch)
      }

      if (!usernameToFetch) {
        setError("No username found. Please log in.")
        setLoading(false)
        navigate("/login")
        return
      }

      try {
        const response = await fetch(`http://127.0.0.1:5062/get_user_details/${usernameToFetch}`)
        console.log("Profile.js: API Response:", response)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch user details")
        }
        const data = await response.json()
        setUserDetails(data)
      } catch (err) {
        console.error("Profile.js: Error fetching user details:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchUserDetails()
  }, [navigate, location.state])

  const handlePasswordChangeSuccess = () => {
    setShowPasswordPopup(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} className="text-4xl text-purple-600 animate-spin mb-4" />
          <p className="text-gray-600 text-lg">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <FontAwesomeIcon icon={faTimes} className="text-4xl text-red-500 mb-4" />
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      </div>
    )
  }

  if (!userDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <FontAwesomeIcon icon={faUser} className="text-4xl text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">No user data available.</p>
        </div>
      </div>
    )
  }

  const usernameForPasswordChange = location.state?.username || sessionStorage.getItem("username")

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "text-green-600 bg-green-100"
      case "inactive":
        return "text-red-600 bg-red-100"
      case "pending":
        return "text-yellow-600 bg-yellow-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "text-purple-600 bg-purple-100"
      case "operator":
        return "text-blue-600 bg-blue-100"
      case "pilot":
        return "text-indigo-600 bg-indigo-100"
      case "manager":
        return "text-orange-600 bg-orange-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Enhanced Fixed Navbar */}
      <nav className="bg-[#171e2a] text-white px-8 py-4 flex justify-between items-center shadow-md w-full">
        <div className="flex items-center gap-2 text-xl font-semibold text-blue-400">
          <img src="/shadowfly.jpg" alt="ShadowFly Logo" className="h-9 w-auto" />
        </div>
        <div className="flex items-center">
          <button
            onClick={handleGoBackWithUsername}
            className="flex items-center gap-2 text-white hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-md p-2 transition-colors duration-300"
            aria-label="Go back to previous page"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
            <span className="text-lg font-medium">Back Page</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-12 text-white text-center">
              <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <FontAwesomeIcon icon={faUser} className="text-4xl text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-2">{userDetails.full_name}</h1>
              <p className="text-xl opacity-90">@{userDetails.username}</p>
            </div>
          </div>

          {/* Profile Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Personal Information Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FontAwesomeIcon icon={faUser} className="text-blue-600 text-xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Personal Details</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                  <FontAwesomeIcon icon={faIdBadge} className="text-gray-500 text-lg w-5" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Full Name</p>
                    <p className="text-gray-800 font-semibold">{userDetails.full_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                  <FontAwesomeIcon icon={faUser} className="text-gray-500 text-lg w-5" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Username</p>
                    <p className="text-gray-800 font-semibold">{userDetails.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                  <FontAwesomeIcon icon={faEnvelope} className="text-gray-500 text-lg w-5" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Email</p>
                    <p className="text-gray-800 font-semibold">{userDetails.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                  <FontAwesomeIcon icon={faPhone} className="text-gray-500 text-lg w-5" />
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Phone Number</p>
                    <p className="text-gray-800 font-semibold">{userDetails.phone_number}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Role & Status Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <FontAwesomeIcon icon={faUserShield} className="text-purple-600 text-xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Role & Status</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                  <FontAwesomeIcon icon={faUserShield} className="text-gray-500 text-lg w-5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-medium">Role</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getRoleColor(userDetails.role)}`}
                    >
                      {userDetails.role}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-gray-500 text-lg w-5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-medium">Status</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(userDetails.status)}`}
                    >
                      {userDetails.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Account Actions</h3>
            <button
              onClick={() => setShowPasswordPopup(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3 mx-auto"
            >
              <FontAwesomeIcon icon={faLock} className="text-lg" />
              Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Password Change Popup */}
      {showPasswordPopup && (
        <ChangePasswordPopup
          username={usernameForPasswordChange}
          onClose={() => setShowPasswordPopup(false)}
          onPasswordChangeSuccess={handlePasswordChangeSuccess}
        />
      )}
    </div>
  )
}

export default Profile
