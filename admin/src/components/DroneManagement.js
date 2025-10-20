"use client"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useNavigate } from "react-router-dom"
import { useState, useEffect, useCallback } from "react"
import {
  faPlane,
  faArrowLeft,
  faSearch,
  faEdit,
  faTrash,
  faPlus,
  faDownload,
  faUpload,
  faKey,
  faCamera,
  faCog,
  faWifi,
  faExclamationTriangle,
  faCheckCircle,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons"

const API_URL = "http://localhost:5014"

function DroneManagement() {
  const [drones, setDrones] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentDroneDbId, setCurrentDroneDbId] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    drone_id: "",
    original_drone_id: "",
    drone_name: "",
    model: "",
    drone_type: "",
    weight: "",
    max_payload: "",
    battery_type: "",
    battery_capacity: "",
    camera_key: "",
    communication_key: "",
  })
  const [notification, setNotification] = useState({ message: "", type: "" })
  const [csvFile, setCsvFile] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  const displayNotification = (message, type, duration = 5000) => {
    setNotification({ message, type })
    setTimeout(() => setNotification({ message: "", type: "" }), duration)
  }

  const fetchDrones = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/drones`)
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errData.error || `HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setDrones(data)
    } catch (error) {
      console.error("Failed to fetch drones:", error)
      displayNotification(`Error fetching data: ${error.message}`, "error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDrones()
  }, [fetchDrones])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0])
  }

  const resetForm = () => {
    setFormData({
      drone_id: "",
      original_drone_id: "",
      drone_name: "",
      model: "",
      drone_type: "",
      weight: "",
      max_payload: "",
      battery_type: "",
      battery_capacity: "",
      camera_key: "",
      communication_key: "",
    })
    setCurrentDroneDbId(null)
  }

  const openAddModal = () => {
    setIsEditMode(false)
    resetForm()
    setShowModal(true)
  }

  const openEditModal = (drone) => {
    setIsEditMode(true)
    setCurrentDroneDbId(drone.id)
    setFormData({
      drone_id: drone.drone_id || "",
      original_drone_id: drone.drone_id || "",
      drone_name: drone.drone_name || "",
      model: drone.model || "",
      drone_type: drone.drone_type || "",
      weight: drone.weight === null || drone.weight === undefined ? "" : String(drone.weight),
      max_payload: drone.max_payload === null || drone.max_payload === undefined ? "" : String(drone.max_payload),
      battery_type: drone.battery_type || "",
      battery_capacity: drone.battery_capacity || "",
      camera_key: drone.camera_key || "",
      communication_key: drone.communication_key || "",
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    resetForm()
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const params = new URLSearchParams()
    params.append("drone_id", formData.drone_id)
    params.append("drone_name", formData.drone_name)
    params.append("model", formData.model)
    params.append("drone_type", formData.drone_type)
    if (formData.weight) params.append("weight", formData.weight)
    if (formData.max_payload) params.append("max_payload", formData.max_payload)
    params.append("battery_type", formData.battery_type)
    params.append("battery_capacity", formData.battery_capacity)
    params.append("camera_key", formData.camera_key)
    params.append("communication_key", formData.communication_key)

    let url = `${API_URL}/add_drone`
    if (isEditMode && currentDroneDbId) {
      url = `${API_URL}/update_drone/${currentDroneDbId}`
      params.append("original_drone_id", formData.original_drone_id)
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      })
      const responseData = await response.json()
      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || `HTTP error! status: ${response.status}`)
      }
      displayNotification(
        responseData.message || (isEditMode ? "Drone updated successfully!" : "Drone added successfully!"),
        "success",
      )
      fetchDrones()
      closeModal()
    } catch (error) {
      console.error("Failed to save drone:", error)
      displayNotification(`Error saving drone: ${error.message}`, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDrone = async (droneDbId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this drone? This will also remove it from all assignments and packages.",
      )
    ) {
      setLoading(true)
      try {
        const response = await fetch(`${API_URL}/delete_drone/${droneDbId}`, {
          method: "POST",
        })
        const responseData = await response.json()
        if (!response.ok) {
          throw new Error(responseData.error || responseData.message || `HTTP error! status: ${response.status}`)
        }
        displayNotification(responseData.message || "Drone deleted successfully!", "success")
        fetchDrones()
      } catch (error) {
        console.error("Failed to delete drone:", error)
        displayNotification(`Error deleting drone: ${error.message || error}`, "error")
      } finally {
        setLoading(false)
      }
    }
  }

  const handleExportCSV = () => {
    window.location.href = `${API_URL}/export_csv`
  }

  const handleImportCSV = async (e) => {
    e.preventDefault()
    if (!csvFile) {
      displayNotification("Please select a CSV file to import.", "warning")
      return
    }

    setLoading(true)
    const importFormData = new FormData()
    importFormData.append("csv_file", csvFile)

    try {
      const response = await fetch(`${API_URL}/import_csv`, {
        method: "POST",
        body: importFormData,
      })
      const responseData = await response.json()
      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || `HTTP error! status: ${response.status}`)
      }
      displayNotification(responseData.message || "CSV imported successfully! Refreshing list...", "success", 10000)
      fetchDrones()
      setCsvFile(null)
      if (document.getElementById("csv_file_input")) {
        document.getElementById("csv_file_input").value = ""
      }
    } catch (error) {
      console.error("Failed to import CSV:", error)
      displayNotification(`Error importing CSV: ${error.message}`, "error", 10000)
    } finally {
      setLoading(false)
    }
  }

  const filteredDrones = drones.filter((drone) =>
    Object.values(drone).some((value) => value && String(value).toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", icon: faCheckCircle },
      inactive: { color: "bg-yellow-100 text-yellow-800", icon: faExclamationTriangle },
      maintenance: { color: "bg-blue-100 text-blue-800", icon: faCog },
    }

    const config = statusConfig[status] || statusConfig.active
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <FontAwesomeIcon icon={config.icon} className="text-xs" />
        {status || "active"}
      </span>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "N/A"
    }
  }

  return (
    <div className="w-full min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation Header */}
      <nav className="bg-[#171e2a] text-white px-8 py-4 flex justify-between items-center shadow-md w-full">
        <div className="flex items-center gap-2 text-xl font-semibold text-blue-400">
          <img src="/shadowfly.jpg" alt="ShadowFly Logo" className="h-9 w-auto" />
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-md p-2 transition-colors duration-300"
            aria-label="Go back to previous page"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
            <span className="text-lg font-medium">Back Page</span>
          </button>
        </div>
      </nav>

      <div className="flex-grow p-6 md:p-8 font-inter">
        <div className="container mx-auto max-w-9xl">
          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-slate-200">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-slate-800 mb-2">Advanced Drone Fleet Management</h2>
              <p className="text-slate-600 text-lg">
                Comprehensive drone management with enhanced CRUD operations, CSV import/export, and communication
                systems
              </p>
            </div>

            {/* Loading Indicator */}
            {loading && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-blue-800 font-medium">Processing...</span>
                </div>
              </div>
            )}

            {/* Notification Display */}
            {notification.message && (
              <div
                className={`mb-6 p-4 rounded-xl border-l-4 ${
                  notification.type === "success"
                    ? "bg-green-50 text-green-800 border-green-400"
                    : notification.type === "error"
                      ? "bg-red-50 text-red-800 border-red-400"
                      : "bg-yellow-50 text-yellow-800 border-yellow-400"
                }`}
              >
                <div className="flex items-center">
                  <FontAwesomeIcon
                    icon={
                      notification.type === "error"
                        ? faExclamationTriangle
                        : notification.type === "success"
                          ? faCheckCircle
                          : faInfoCircle
                    }
                    className="mr-2"
                  />
                  <div className="font-semibold">
                    {notification.type === "error" ? "Error" : notification.type === "success" ? "Success" : "Warning"}
                  </div>
                  <div className="ml-2 whitespace-pre-wrap">{notification.message}</div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <button
                onClick={openAddModal}
                disabled={loading}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faPlus} className="text-sm" />
                Add New Drone
              </button>
              <button
                onClick={handleExportCSV}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faDownload} className="text-sm" />
                Export to CSV
              </button>
            </div>

            {/* CSV Import Section */}
            <div className="bg-slate-50 rounded-xl p-6 mb-8">
              <h3 className="text-2xl font-semibold text-slate-700 mb-6 flex items-center gap-3">
                <FontAwesomeIcon icon={faUpload} className="text-blue-600" />
                Import Drones from CSV
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-800 mb-2 font-medium">📋 CSV Format Requirements:</p>
                <code className="text-xs bg-blue-100 px-3 py-2 rounded-lg block text-blue-900 font-mono mb-2">
                  drone_id, drone_name, model, drone_type, weight, max_payload, battery_type, battery_capacity,
                </code>
                <code className="text-xs bg-blue-100 px-3 py-2 rounded-lg block text-blue-900 font-mono">
                  camera_key, communication_key
                </code>
                <p className="text-sm text-blue-700 mt-3">
                  💡 Essential fields: drone_id, drone_name. Other fields are optional. Existing drones will be skipped.
                </p>
              </div>
              <form onSubmit={handleImportCSV} className="space-y-6">
                <div>
                  <label htmlFor="csv_file_input" className="block text-sm font-semibold text-slate-700 mb-2">
                    Choose CSV File:
                  </label>
                  <input
                    type="file"
                    name="csv_file"
                    id="csv_file_input"
                    accept=".csv"
                    onChange={handleFileChange}
                    required
                    disabled={loading}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:opacity-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faUpload} className="text-sm" />
                  Upload and Import
                </button>
              </form>
            </div>

            {/* Drone Fleet Table Section */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-semibold text-slate-700 mb-2 flex items-center gap-3">
                      <FontAwesomeIcon icon={faPlane} className="text-blue-600" />
                      Drone Fleet ({filteredDrones.length})
                    </h3>
                  </div>
                </div>

                {/* Search Section */}
                <div className="mb-6 relative">
                  <input
                    type="text"
                    placeholder="Search drones by any field..."
                    className="w-full pl-12 pr-4 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700 bg-slate-50 focus:bg-white shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                {filteredDrones.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                      <tr>
                        <th className="px-4 py-4 text-left font-semibold">Drone ID</th>
                        <th className="px-4 py-4 text-left font-semibold">Name</th>
                        <th className="px-4 py-4 text-left font-semibold">Model</th>
                        <th className="px-4 py-4 text-left font-semibold">Type</th>
                        <th className="px-4 py-4 text-left font-semibold">Weight (kg)</th>
                        <th className="px-4 py-4 text-left font-semibold">Max Payload (kg)</th>
                        <th className="px-4 py-4 text-left font-semibold">Battery</th>
                        <th className="px-4 py-4 text-left font-semibold">Camera Key</th>
                        <th className="px-4 py-4 text-left font-semibold">Comm Key</th>
                        <th className="px-4 py-4 text-left font-semibold">Status</th>
                        <th className="px-4 py-4 text-left font-semibold">Created</th>
                        <th className="px-4 py-4 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredDrones.map((drone, index) => (
                        <tr
                          key={drone.id}
                          className={`${index % 2 === 0 ? "bg-slate-50" : "bg-white"} hover:bg-blue-50 transition-colors`}
                        >
                          <td className="px-4 py-4 text-sm font-semibold text-blue-600">{drone.drone_id}</td>
                          <td className="px-4 py-4 text-sm font-medium text-slate-900">{drone.drone_name}</td>
                          <td className="px-4 py-4 text-sm text-slate-700">{drone.model || "N/A"}</td>
                          <td className="px-4 py-4 text-sm text-slate-700">{drone.drone_type || "N/A"}</td>
                          <td className="px-4 py-4 text-sm text-slate-700">
                            {drone.weight === null || drone.weight === undefined ? "N/A" : `${drone.weight}`}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700">
                            {drone.max_payload === null || drone.max_payload === undefined
                              ? "N/A"
                              : `${drone.max_payload}`}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700">
                            <div className="space-y-1">
                              <div>{drone.battery_type || "N/A"}</div>
                              <div className="text-xs text-slate-500">{drone.battery_capacity || ""}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700">
                            <span className="flex items-center gap-1">
                              <FontAwesomeIcon icon={faCamera} className="text-purple-500" />
                              <span className="text-xs">{drone.camera_key || "N/A"}</span>
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700">
                            <span className="flex items-center gap-1">
                              <FontAwesomeIcon icon={faWifi} className="text-green-500" />
                              <span className="text-xs">{drone.communication_key || "N/A"}</span>
                            </span>
                          </td>
                          <td className="px-4 py-4">{getStatusBadge(drone.status)}</td>
                          <td className="px-4 py-4 text-xs text-slate-500">{formatDate(drone.created_at)}</td>
                          <td className="px-4 py-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openEditModal(drone)}
                                disabled={loading}
                                className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors disabled:opacity-50"
                                title="Edit drone"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button
                                onClick={() => handleDeleteDrone(drone.id)}
                                disabled={loading}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                title="Delete drone"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-16">
                    <FontAwesomeIcon icon={faPlane} className="text-6xl text-slate-300 mb-4" />
                    <p className="text-xl text-slate-500 mb-2">No drones found</p>
                    <p className="text-slate-400">Add a new drone or import from CSV to get started!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-slate-200">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-8 py-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <FontAwesomeIcon icon={isEditMode ? faEdit : faPlus} className="text-blue-600" />
                    {isEditMode ? "Edit Drone Configuration" : "Add New Drone"}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-slate-400 hover:text-slate-600 text-3xl font-bold transition-colors duration-200 hover:bg-slate-100 rounded-full w-10 h-10 flex items-center justify-center"
                  >
                    &times;
                  </button>
                </div>
              </div>

              <form onSubmit={handleFormSubmit} className="p-8">
                <input type="hidden" name="original_drone_id" value={formData.original_drone_id} />

                {/* Basic Information Section */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faInfoCircle} className="text-blue-600" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="form_drone_id" className="block text-sm font-semibold text-slate-700 mb-2">
                        Drone ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="drone_id"
                        id="form_drone_id"
                        value={formData.drone_id}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                        required
                        placeholder="Enter unique drone ID"
                      />
                    </div>

                    <div>
                      <label htmlFor="form_drone_name" className="block text-sm font-semibold text-slate-700 mb-2">
                        Drone Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="drone_name"
                        id="form_drone_name"
                        value={formData.drone_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                        required
                        placeholder="Enter drone name"
                      />
                    </div>

                    <div>
                      <label htmlFor="form_model" className="block text-sm font-semibold text-slate-700 mb-2">
                        Model
                      </label>
                      <input
                        type="text"
                        name="model"
                        id="form_model"
                        value={formData.model}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                        placeholder="Enter drone model"
                      />
                    </div>

                    <div>
                      <label htmlFor="form_drone_type" className="block text-sm font-semibold text-slate-700 mb-2">
                        Drone Type
                      </label>
                      <input
                        type="text"
                        name="drone_type"
                        id="form_drone_type"
                        value={formData.drone_type}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                        placeholder="Enter drone type"
                      />
                    </div>
                  </div>
                </div>

                {/* Physical Specifications Section */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faCog} className="text-blue-600" />
                    Physical Specifications
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="form_weight" className="block text-sm font-semibold text-slate-700 mb-2">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="weight"
                        id="form_weight"
                        value={formData.weight}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                        placeholder="e.g., 895.00"
                      />
                    </div>

                    <div>
                      <label htmlFor="form_max_payload" className="block text-sm font-semibold text-slate-700 mb-2">
                        Max Payload (kg)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="max_payload"
                        id="form_max_payload"
                        value={formData.max_payload}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                        placeholder="e.g., 200.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Battery Configuration Section */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faCog} className="text-green-600" />
                    Battery Configuration
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="form_battery_type" className="block text-sm font-semibold text-slate-700 mb-2">
                        Battery Type
                      </label>
                      <input
                        type="text"
                        name="battery_type"
                        id="form_battery_type"
                        value={formData.battery_type}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                        placeholder="e.g., LiPo 4S"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="form_battery_capacity"
                        className="block text-sm font-semibold text-slate-700 mb-2"
                      >
                        Battery Capacity
                      </label>
                      <input
                        type="text"
                        name="battery_capacity"
                        id="form_battery_capacity"
                        value={formData.battery_capacity}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                        placeholder="e.g., 5000 mAh"
                      />
                    </div>
                  </div>
                </div>

                {/* Communication & Camera Keys Section */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faKey} className="text-blue-600" />
                    Communication & Camera Keys
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="form_camera_key" className="block text-sm font-semibold text-slate-700 mb-2">
                        Camera Key
                      </label>
                      <div className="relative">
                        <FontAwesomeIcon
                          icon={faCamera}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500"
                        />
                        <input
                          type="text"
                          name="camera_key"
                          id="form_camera_key"
                          value={formData.camera_key}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                          placeholder="Enter camera access key"
                        />
                      </div>
                      <p className="text-sm text-slate-600 mt-1">Used for camera system access and control</p>
                    </div>

                    <div>
                      <label
                        htmlFor="form_communication_key"
                        className="block text-sm font-semibold text-slate-700 mb-2"
                      >
                        Communication Key
                      </label>
                      <div className="relative">
                        <FontAwesomeIcon
                          icon={faWifi}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500"
                        />
                        <input
                          type="text"
                          name="communication_key"
                          id="form_communication_key"
                          value={formData.communication_key}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 focus:bg-white"
                          placeholder="Enter communication key for data transfer"
                        />
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        Used for secure communication and data transfer operations
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="mt-8 flex justify-end gap-4 pt-6 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={loading}
                    className="px-6 py-3 bg-slate-600 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={isEditMode ? faEdit : faPlus} className="text-sm" />
                        {isEditMode ? "Save Changes" : "Add Drone"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DroneManagement
