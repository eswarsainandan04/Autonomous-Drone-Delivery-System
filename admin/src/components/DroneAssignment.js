"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft, faSearch, faChevronDown } from "@fortawesome/free-solid-svg-icons"

// Define the base URL for your Flask API.
const API_BASE_URL = "http://localhost:5008"

function DroneWarehousePage() {
  const [drones, setDrones] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [assignments, setAssignments] = useState([])
  const [flashedMessages, setFlashedMessages] = useState([])
  const [pageError, setPageError] = useState("")

  const [selectedDronePk, setSelectedDronePk] = useState("")
  const [selectedWarehousePk, setSelectedWarehousePk] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("Active")

  // Search states for dropdowns
  const [droneSearchTerm, setDroneSearchTerm] = useState("")
  const [warehouseSearchTerm, setWarehouseSearchTerm] = useState("")
  const [isDroneDropdownOpen, setIsDroneDropdownOpen] = useState(false)
  const [isWarehouseDropdownOpen, setIsWarehouseDropdownOpen] = useState(false)

  // Table filter states
  const [tableFilters, setTableFilters] = useState({
    droneId: "",
    droneName: "",
    warehouse: "",
    status: "",
  })

  // For editing status
  const [editingAssignmentId, setEditingAssignmentId] = useState(null)
  const [editingStatus, setEditingStatus] = useState("")

  const navigate = useNavigate()

  const addFlashedMessage = (message, category = "info", autoDismiss = true) => {
    const id = Date.now()
    setFlashedMessages((prev) => [...prev, { id, category, message }])
    if (autoDismiss) {
      setTimeout(() => removeFlashedMessage(id), 5000)
    }
  }

  const removeFlashedMessage = (id) => {
    setFlashedMessages((prev) => prev.filter((msg) => msg.id !== id))
  }

  const loadInitialData = async () => {
    setPageError("")
    try {
      const [dronesRes, warehousesRes, assignmentsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/drones`),
        fetch(`${API_BASE_URL}/api/warehouses`),
        fetch(`${API_BASE_URL}/api/assignments`),
      ])

      if (!dronesRes.ok) throw new Error(`Failed to fetch drones: ${dronesRes.status} ${await dronesRes.text()}`)
      if (!warehousesRes.ok)
        throw new Error(`Failed to fetch warehouses: ${warehousesRes.status} ${await warehousesRes.text()}`)
      if (!assignmentsRes.ok)
        throw new Error(`Failed to fetch assignments: ${assignmentsRes.status} ${await assignmentsRes.text()}`)

      const dronesData = await dronesRes.json()
      const warehousesData = await warehousesRes.json()
      const assignmentsData = await assignmentsRes.json()

      setDrones(dronesData || [])
      setWarehouses(warehousesData || [])
      setAssignments(assignmentsData || [])
    } catch (error) {
      console.error("Error fetching initial data:", error)
      setPageError(
        `Error fetching initial data: ${error.message}. Ensure Flask API is running and accessible at ${API_BASE_URL}.`,
      )
      addFlashedMessage(`Failed to load page data: ${error.message}`, "error", false)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  // Filter functions
  const filteredDrones = drones.filter(
    (drone) =>
      drone.drone_name.toLowerCase().includes(droneSearchTerm.toLowerCase()) ||
      drone.drone_id.toLowerCase().includes(droneSearchTerm.toLowerCase()),
  )

  const filteredWarehouses = warehouses.filter((warehouse) =>
    warehouse.name.toLowerCase().includes(warehouseSearchTerm.toLowerCase()),
  )

  const filteredAssignments = assignments.filter((assignment) => {
    return (
      assignment.drone_id.toLowerCase().includes(tableFilters.droneId.toLowerCase()) &&
      assignment.drone_name.toLowerCase().includes(tableFilters.droneName.toLowerCase()) &&
      assignment.warehouse_name.toLowerCase().includes(tableFilters.warehouse.toLowerCase()) &&
      assignment.status.toLowerCase().includes(tableFilters.status.toLowerCase())
    )
  })

  const handleAssignDrone = async (e) => {
    e.preventDefault()
    if (!selectedDronePk || !selectedWarehousePk || !selectedStatus) {
      addFlashedMessage("Please select a drone, a warehouse, and a status.", "warning")
      return
    }

    const formData = new FormData()
    formData.append("drone_pk", selectedDronePk)
    formData.append("warehouse_pk", selectedWarehousePk)
    formData.append("status", selectedStatus)

    try {
      const response = await fetch(`${API_BASE_URL}/api/assign`, {
        method: "POST",
        body: formData,
      })

      const responseData = await response.json()

      if (response.ok) {
        addFlashedMessage(responseData.message, responseData.category || "success")
        if (responseData.assignment && (responseData.category === "success" || response.status === 201)) {
          setAssignments((prev) => {
            const existing = prev.find((a) => a.id === responseData.assignment.id)
            return existing
              ? prev.map((a) => (a.id === responseData.assignment.id ? responseData.assignment : a))
              : [responseData.assignment, ...prev].sort((a, b) => b.id - a.id)
          })
        }
        setSelectedDronePk("")
        setSelectedWarehousePk("")
        setSelectedStatus("Active")
        setDroneSearchTerm("")
        setWarehouseSearchTerm("")
      } else {
        addFlashedMessage(
          responseData.message || `Assignment failed with status: ${response.status}`,
          responseData.category || "error",
        )
      }
    } catch (error) {
      console.error("Error assigning drone:", error)
      addFlashedMessage(`Client-side error during assignment: ${error.message}`, "error")
    }
  }

  const handleDeleteAssignment = async (assignmentId) => {
    if (window.confirm("Are you sure you want to delete this assignment?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/delete_assignment/${assignmentId}`, {
          method: "POST",
        })

        const responseData = await response.json()

        if (response.ok) {
          addFlashedMessage(responseData.message, responseData.category || "success")
          if (responseData.deleted_id) {
            setAssignments((prev) => prev.filter((assign) => assign.id !== responseData.deleted_id))
          }
        } else {
          addFlashedMessage(
            responseData.message || `Deletion failed with status: ${response.status}`,
            responseData.category || "error",
          )
        }
      } catch (error) {
        console.error("Error deleting assignment:", error)
        addFlashedMessage(`Client-side error during deletion: ${error.message}`, "error")
      }
    }
  }

  const handleEditStatusClick = (assignment) => {
    setEditingAssignmentId(assignment.id)
    setEditingStatus(assignment.status)
  }

  const handleSaveStatus = async (assignmentId) => {
    if (!editingStatus) {
      addFlashedMessage("Please select a status.", "warning")
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/update_assignment_status/${assignmentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: editingStatus }),
      })

      const responseData = await response.json()

      if (response.ok) {
        addFlashedMessage(responseData.message, responseData.category || "success")
        if (responseData.assignment) {
          setAssignments((prev) => prev.map((a) => (a.id === responseData.assignment.id ? responseData.assignment : a)))
        }
        setEditingAssignmentId(null)
      } else {
        addFlashedMessage(
          responseData.message || `Status update failed: ${response.status}`,
          responseData.category || "error",
        )
      }
    } catch (error) {
      console.error("Error updating status:", error)
      addFlashedMessage(`Client-side error updating status: ${error.message}`, "error")
    }
  }

  const handleDroneSelect = (drone) => {
    setSelectedDronePk(drone.id)
    setDroneSearchTerm(`${drone.drone_name} (ID: ${drone.drone_id})`)
    setIsDroneDropdownOpen(false)
  }

  const handleWarehouseSelect = (warehouse) => {
    setSelectedWarehousePk(warehouse.id)
    setWarehouseSearchTerm(
      `${warehouse.name} (Lat: ${Number.parseFloat(warehouse.latitude).toFixed(4)}, Lon: ${Number.parseFloat(warehouse.longitude).toFixed(4)})`,
    )
    setIsWarehouseDropdownOpen(false)
  }

  const clearTableFilters = () => {
    setTableFilters({
      droneId: "",
      droneName: "",
      warehouse: "",
      status: "",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navbar */}
      <nav className="bg-[#171e2a] text-white px-8 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2 text-xl font-semibold text-blue-400">
          <img src="/shadowfly.jpg" alt="ShadowFly Logo" className="h-9 w-auto" />
          <span className="text-[#d3a95c] text-xl sm:text-2xl">Admin</span>
        </div>
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-md p-2 transition-colors duration-300"
            aria-label="Go back to previous page"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
            <span className="text-lg font-medium">Back</span>
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Flash Messages */}
        {flashedMessages.map((flash) => (
          <div
            key={flash.id}
            className={`mb-4 p-4 rounded-lg border-l-4 shadow-sm ${
              flash.category === "success"
                ? "bg-green-50 border-green-400 text-green-800"
                : flash.category === "error"
                  ? "bg-red-50 border-red-400 text-red-800"
                  : flash.category === "warning"
                    ? "bg-yellow-50 border-yellow-400 text-yellow-800"
                    : "bg-blue-50 border-blue-400 text-blue-800"
            }`}
            role="alert"
          >
            <div className="flex justify-between items-center">
              <span>{flash.message}</span>
              <button
                type="button"
                className="ml-4 text-lg font-bold opacity-70 hover:opacity-100 transition-opacity"
                onClick={() => removeFlashedMessage(flash.id)}
              >
                ×
              </button>
            </div>
          </div>
        ))}

        {pageError && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-800 rounded-lg shadow-sm">
            <strong>Error loading page:</strong> {pageError}
          </div>
        )}

        {/* Assignment Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-slate-200">
          <h2 className="text-3xl font-bold mb-8 text-slate-800 border-b border-slate-200 pb-4">
            Assign Drone to Warehouse
          </h2>
          <form onSubmit={handleAssignDrone} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Drone Selection */}
              <div className="relative">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Select Drone:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={droneSearchTerm}
                    onChange={(e) => {
                      setDroneSearchTerm(e.target.value)
                      setIsDroneDropdownOpen(true)
                      if (!e.target.value) setSelectedDronePk("")
                    }}
                    onFocus={() => setIsDroneDropdownOpen(true)}
                    placeholder="Search and select a drone..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                    required
                  />
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  {isDroneDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredDrones.length > 0 ? (
                        filteredDrones.map((drone) => (
                          <div
                            key={drone.id}
                            onClick={() => handleDroneSelect(drone)}
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors"
                          >
                            <div className="font-medium text-slate-800">{drone.drone_name}</div>
                            <div className="text-sm text-slate-500">ID: {drone.drone_id}</div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-slate-500">No drones found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Warehouse Selection */}
              <div className="relative">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Select Warehouse:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={warehouseSearchTerm}
                    onChange={(e) => {
                      setWarehouseSearchTerm(e.target.value)
                      setIsWarehouseDropdownOpen(true)
                      if (!e.target.value) setSelectedWarehousePk("")
                    }}
                    onFocus={() => setIsWarehouseDropdownOpen(true)}
                    placeholder="Search and select a warehouse..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                    required
                  />
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  {isWarehouseDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredWarehouses.length > 0 ? (
                        filteredWarehouses.map((warehouse) => (
                          <div
                            key={warehouse.id}
                            onClick={() => handleWarehouseSelect(warehouse)}
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors"
                          >
                            <div className="font-medium text-slate-800">{warehouse.name}</div>
                            <div className="text-sm text-slate-500">
                              Lat: {Number.parseFloat(warehouse.latitude).toFixed(4)}, Lon:{" "}
                              {Number.parseFloat(warehouse.longitude).toFixed(4)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-slate-500">No warehouses found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Select Status:</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Assign Drone
              </button>
            </div>
          </form>
        </div>

        {/* Assignments Table */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Current Drone Assignments</h2>

            {/* Table Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Drone ID:</label>
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={tableFilters.droneId}
                    onChange={(e) => setTableFilters((prev) => ({ ...prev, droneId: e.target.value }))}
                    placeholder="Search Drone ID..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Drone Name:</label>
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={tableFilters.droneName}
                    onChange={(e) => setTableFilters((prev) => ({ ...prev, droneName: e.target.value }))}
                    placeholder="Search Drone Name..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Warehouse:</label>
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={tableFilters.warehouse}
                    onChange={(e) => setTableFilters((prev) => ({ ...prev, warehouse: e.target.value }))}
                    placeholder="Search Warehouse..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Status:</label>
                <select
                  value={tableFilters.status}
                  onChange={(e) => setTableFilters((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={clearTableFilters}
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Clear All Filters
              </button>
              <span className="text-sm text-slate-600">
                Showing {filteredAssignments.length} of {assignments.length} assignments
              </span>
            </div>
          </div>

          {filteredAssignments && filteredAssignments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">
                      Drone ID
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">
                      Drone Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">
                      Warehouse
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">
                      Latitude
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">
                      Longitude
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAssignments.map((assignment, index) => (
                    <tr
                      key={assignment.id}
                      className={`hover:bg-slate-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-slate-25"}`}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{assignment.drone_id}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{assignment.drone_name}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{assignment.warehouse_name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                        {typeof assignment.latitude === "number"
                          ? assignment.latitude.toFixed(6)
                          : Number.parseFloat(assignment.latitude || 0).toFixed(6)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                        {typeof assignment.longitude === "number"
                          ? assignment.longitude.toFixed(6)
                          : Number.parseFloat(assignment.longitude || 0).toFixed(6)}
                      </td>
                      <td className="px-6 py-4">
                        {editingAssignmentId === assignment.id ? (
                          <div className="flex items-center space-x-2">
                            <select
                              value={editingStatus}
                              onChange={(e) => setEditingStatus(e.target.value)}
                              className="px-3 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                            </select>
                            <button
                              onClick={() => handleSaveStatus(assignment.id)}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingAssignmentId(null)}
                              className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                              assignment.status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {assignment.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-3">
                          {editingAssignmentId !== assignment.id && (
                            <button
                              type="button"
                              onClick={() => handleEditStatusClick(assignment)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                            >
                              Edit
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            className="text-red-600 hover:text-red-800 font-medium text-sm transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="text-slate-400 text-lg mb-2">No assignments found</div>
              <div className="text-slate-500 text-sm">
                {assignments.length === 0
                  ? "No drones are currently assigned to any warehouses."
                  : "No assignments match your current filters."}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside handlers */}
      {(isDroneDropdownOpen || isWarehouseDropdownOpen) && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setIsDroneDropdownOpen(false)
            setIsWarehouseDropdownOpen(false)
          }}
        />
      )}
    </div>
  )
}

export default DroneWarehousePage
