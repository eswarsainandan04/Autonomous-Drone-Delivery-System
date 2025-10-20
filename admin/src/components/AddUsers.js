"use client"

import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  faArrowLeft,
  faUserPlus,
  faEdit,
  faTrash,
  faSearch,
  faUsers,
  faFilter,
  faTimes,
} from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

function AddUsers() {
  const navigate = useNavigate()
  const initialFormData = {
    full_name: "",
    email: "",
    username: "",
    role: "",
    phone_number: "",
    status: "active",
  }
  const [formData, setFormData] = useState(initialFormData)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchCategory, setSearchCategory] = useState("full_name")

  // Function to fetch users data
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("http://localhost:5062/get_users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        const errorData = await response.json()
        setError(`Failed to fetch users: ${errorData.error || response.statusText}`)
      }
    } catch (err) {
      console.error("Error fetching users:", err)
      setError("Failed to connect to the server to fetch users. Please ensure the backend is running.")
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch users when the component mounts
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }))
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleSearchCategoryChange = (e) => {
    setSearchCategory(e.target.value)
  }

  const clearSearch = () => {
    setSearchTerm("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const method = editingUser ? "PUT" : "POST"
    const url = editingUser ? `http://localhost:5062/update_user/${editingUser}` : "http://localhost:5062/add_user"

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        alert(`User ${editingUser ? "updated" : "added"} successfully!`)
        setFormData(initialFormData)
        setEditingUser(null)
        fetchUsers()
      } else {
        const errorData = await response.json()
        setError(`Error ${editingUser ? "updating" : "adding"} user: ${errorData.error || response.statusText}`)
        alert(
          `Error ${editingUser ? "updating" : "adding"} user: ${errorData.error || "An unexpected error occurred."}`,
        )
      }
    } catch (err) {
      console.error("Failed to submit form:", err)
      setError("Failed to connect to the server. Please ensure the backend is running.")
      alert("Failed to connect to the server.")
    }
  }

  const handleEdit = (userId) => {
    const userToEdit = users.find((user) => user.id === userId)
    if (userToEdit) {
      setFormData({
        full_name: userToEdit.full_name,
        email: userToEdit.email,
        username: userToEdit.username,
        role: userToEdit.role,
        phone_number: userToEdit.phone_number,
        status: userToEdit.status,
      })
      setEditingUser(userId)
    }
  }

  const handleDelete = async (userId) => {
    if (window.confirm(`Are you sure you want to delete user with ID: ${userId}?`)) {
      try {
        const response = await fetch(`http://localhost:5062/delete_user/${userId}`, {
          method: "DELETE",
        })

        if (response.ok) {
          alert("User deleted successfully!")
          fetchUsers()
        } else {
          const errorData = await response.json()
          setError(`Error deleting user: ${errorData.error || response.statusText}`)
          alert(`Error deleting user: ${errorData.error || "An unexpected error occurred."}`)
        }
      } catch (err) {
        console.error("Failed to delete user:", err)
        setError("Failed to connect to the server. Please ensure the backend is running.")
        alert("Failed to connect to the server.")
      }
    }
  }

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: "bg-green-100 text-green-800 border-green-200",
      inactive: "bg-gray-100 text-gray-800 border-gray-200",
      suspended: "bg-red-100 text-red-800 border-red-200",
    }
    return statusClasses[status] || statusClasses.inactive
  }

  const getRoleBadge = (role) => {
    const roleClasses = {
      Operator: "bg-blue-100 text-blue-800 border-blue-200",
      Pilot: "bg-purple-100 text-purple-800 border-purple-200",
      Manager: "bg-orange-100 text-orange-800 border-orange-200",
    }
    return roleClasses[role] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  // Filtered users based on search term and category
  const filteredUsers = users.filter((user) => {
    const valueToSearch = String(user[searchCategory] || "").toLowerCase()
    return valueToSearch.includes(searchTerm.toLowerCase())
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Enhanced Navigation */}
      <nav className="bg-[#171e2a] text-white px-4 sm:px-8 py-4 shadow-xl border-b border-slate-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/shadowfly.jpg" alt="ShadowFly Logo" className="h-10 w-auto rounded-lg shadow-md" />
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-xl sm:text-2xl font-bold">Admin</span>
              <div className="hidden sm:block w-px h-6 bg-slate-600"></div>
              <span className="hidden sm:inline text-slate-300 text-sm">User Management</span>
            </div>
          </div>
          <button
            onClick={() => navigate("/adminsettings")}
            className="flex items-center gap-2 text-white hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-md p-2 transition-colors duration-300"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
            <span className="hidden sm:inline font-medium">Back to Settings</span>
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-lg mb-4">
            <FontAwesomeIcon icon={faUsers} className="text-blue-600 text-xl" />
            <h1 className="text-3xl font-bold text-gray-800">{editingUser ? "Edit User" : "Add New User"}</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {editingUser
              ? "Update user information and permissions"
              : "Create a new user account with role-based access"}
          </p>
        </div>

        {/* Enhanced Form */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <FontAwesomeIcon icon={editingUser ? faEdit : faUserPlus} />
                {editingUser ? "Edit User Details" : "User Information"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label htmlFor="full_name" className="block text-sm font-semibold text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Enter username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="role" className="block text-sm font-semibold text-gray-700">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white"
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="Operator">Operator</option>
                    <option value="Pilot">Pilot</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label htmlFor="phone_number" className="block text-sm font-semibold text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="status" className="block text-sm font-semibold text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={editingUser ? faEdit : faUserPlus} />
                  {editingUser ? "Update User" : "Add User"}
                </button>
                {editingUser && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUser(null)
                      setFormData(initialFormData)
                    }}
                    className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 shadow-lg flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Enhanced Users Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <FontAwesomeIcon icon={faUsers} />
                Existing Users ({filteredUsers.length})
              </h2>
            </div>
          </div>

          {/* Enhanced Search Bar */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={`Search by ${searchCategory
                    .replace("_", " ")
                    .split(" ")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}...`}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faFilter} className="text-gray-500" />
                <select
                  value={searchCategory}
                  onChange={handleSearchCategoryChange}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white min-w-[150px]"
                >
                  <option value="full_name">Full Name</option>
                  <option value="email">Email</option>
                  <option value="username">Username</option>
                  <option value="role">Role</option>
                  <option value="phone_number">Phone Number</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading and Error States */}
          {loading && (
            <div className="p-12 text-center">
              <div className="inline-flex items-center gap-3 text-gray-600">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-lg">Loading users...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-6 bg-red-50 border-l-4 border-red-400">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Enhanced Table */}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Full Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-500">
                          <FontAwesomeIcon icon={faUsers} className="text-4xl text-gray-300" />
                          <p className="text-lg font-medium">No users found</p>
                          <p className="text-sm">Try adjusting your search criteria</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                            {user.username}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadge(user.role)}`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.phone_number || <span className="text-gray-400 italic">N/A</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(user.status)}`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => handleEdit(user.id)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                              aria-label={`Edit user ${user.full_name}`}
                              title="Edit user"
                            >
                              <FontAwesomeIcon icon={faEdit} className="text-sm" />
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                              aria-label={`Delete user ${user.full_name}`}
                              title="Delete user"
                            >
                              <FontAwesomeIcon icon={faTrash} className="text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AddUsers
