"use client"
import { useNavigate } from "react-router-dom"

import {
  faArrowLeft,
  faUserShield, // Icon for Admin
  faUsers, // Icon for Users
} from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

function AdminSettings() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navbar - unchanged */}
      <nav className="bg-[#171e2a] text-white px-4 sm:px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-blue-400">
          <img src="/shadowfly.jpg" alt="ShadowFly Logo" className="h-9 w-auto" />
          <span className="text-[#d3a95c] text-xl sm:text-2xl">Admin</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => {
              navigate("/admin-dashboard")
            }}
            className="flex items-center gap-2 text-white hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-md p-2 transition-colors duration-300"
            aria-label="Go back to previous page"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>
      </nav>

      {/* Main Content - Enhanced */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header Section */}
        <div className="text-center mb-12">
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Manage your administrative settings and user permissions from the options below
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto mt-6 rounded-full"></div>
        </div>

        {/* Settings Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {/* Admin Management Card */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <button
              onClick={() => navigate("/adminsadd")}
              className="relative bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 flex flex-col items-center justify-center text-gray-700 hover:text-blue-600 w-full border border-gray-100 group-hover:border-blue-200 transform group-hover:-translate-y-1"
            >
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-100 rounded-full scale-150 opacity-20 group-hover:scale-175 transition-transform duration-500"></div>
                <FontAwesomeIcon 
                  icon={faUserShield} 
                  className="relative text-6xl text-blue-500 group-hover:text-blue-600 transition-colors duration-300" 
                />
              </div>
              <h3 className="text-2xl font-bold mb-3 group-hover:text-blue-700 transition-colors duration-300">
                Admin Management
              </h3>
              <p className="text-gray-500 text-center leading-relaxed group-hover:text-gray-600 transition-colors duration-300">
                Add new admins and manage administrative accounts with full control over systems
              </p>
              <div className="mt-6 flex items-center text-blue-500 group-hover:text-blue-600 transition-colors duration-300">
                <span className="text-sm font-medium">Manage Admins</span>
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>

          {/* User Management Card */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <button
              onClick={() => navigate("/addusers")}
              className="relative bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 flex flex-col items-center justify-center text-gray-700 hover:text-green-600 w-full border border-gray-100 group-hover:border-green-200 transform group-hover:-translate-y-1"
            >
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-green-100 rounded-full scale-150 opacity-20 group-hover:scale-175 transition-transform duration-500"></div>
                <FontAwesomeIcon 
                  icon={faUsers} 
                  className="relative text-6xl text-green-500 group-hover:text-green-600 transition-colors duration-300" 
                />
              </div>
              <h3 className="text-2xl font-bold mb-3 group-hover:text-green-700 transition-colors duration-300">
                User Management
              </h3>
              <p className="text-gray-500 text-center leading-relaxed group-hover:text-gray-600 transition-colors duration-300">
                Add, edit, or remove users and manage their access permissions across the platform.
              </p>
              <div className="mt-6 flex items-center text-green-500 group-hover:text-green-600 transition-colors duration-300">
                <span className="text-sm font-medium">Manage Users</span>
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="mt-16 text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm">
            <p className="text-gray-600 text-sm">
              Need help? Contact your system administrator or check the documentation for detailed guidance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings