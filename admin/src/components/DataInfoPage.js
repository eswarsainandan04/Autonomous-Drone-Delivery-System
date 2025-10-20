"use client"

// src/components/DataInfoPage.js
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faArrowLeft,
  faWarehouse,
  faBroadcastTower,
  faExclamationTriangle,
  faSpinner,
  faEdit,
  faTrash,
  faSave,
  faTimesCircle,
  faEye,
  faSearch,
} from "@fortawesome/free-solid-svg-icons"

const API_URL = "http://localhost:5000" // Your Flask backend URL

const DataInfoPage = () => {
  const navigate = useNavigate()
  const [ddts, setDdts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Search states
  const [ddtSearchTerm, setDdtSearchTerm] = useState("")
  const [warehouseSearchTerm, setWarehouseSearchTerm] = useState("")

  // State for inline editing
  const [editingDdtId, setEditingDdtId] = useState(null)
  const [editingDdtData, setEditingDdtData] = useState({
    name: "",
    status: "Active",
    latitude: "",
    longitude: "",
    control_key: "",
  })
  const [editingWarehouseId, setEditingWarehouseId] = useState(null)
  const [editingWarehouseData, setEditingWarehouseData] = useState({ name: "", latitude: "", longitude: "" })

  const fetchData = async (updatedId = null) => {
    setLoading(true)
    try {
      const ddtsResponse = await fetch(`${API_URL}/get_ddts`, { cache: "no-store" })
      if (!ddtsResponse.ok) {
        throw new Error(`Failed to fetch DDTs: ${ddtsResponse.statusText}`)
      }
      const ddtsData = await ddtsResponse.json()
      console.log("[DEBUG] Raw ddtsData from GET /get_ddts:", ddtsData)

      if (updatedId !== null && ddtsData.some((d) => Number.parseInt(d.id, 10) === updatedId)) {
        const ddtInQuestion = ddtsData.find((d) => Number.parseInt(d.id, 10) === updatedId)
        console.log(`[DEBUG] DDT ID ${updatedId} as received by fetchData:`, ddtInQuestion)
      }

      setDdts(
        ddtsData.map((d) => {
          let isActive = false
          if (typeof d.status === "string") {
            isActive = d.status.trim().toLowerCase() === "active"
          }
          return {
            ...d,
            id: Number.parseInt(d.id, 10),
            lat: Number.parseFloat(d.latitude),
            lng: Number.parseFloat(d.longitude),
            active: isActive,
          }
        }),
      )

      const warehousesResponse = await fetch(`${API_URL}/get_warehouses`, { cache: "no-store" })
      if (!warehousesResponse.ok) {
        throw new Error(`Failed to fetch Warehouses: ${warehousesResponse.statusText}`)
      }
      const warehousesData = await warehousesResponse.json()
      setWarehouses(
        warehousesData.map((w) => ({
          ...w,
          id: Number.parseInt(w.id, 10),
          lat: Number.parseFloat(w.latitude),
          lng: Number.parseFloat(w.longitude),
        })),
      )

      if (updatedId === null) setError(null)
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filter functions
  const filteredDdts = ddts
    .filter(
      (ddt) =>
        ddt.name.toLowerCase().includes(ddtSearchTerm.toLowerCase()) ||
        ddt.lat?.toString().includes(ddtSearchTerm) ||
        ddt.lng?.toString().includes(ddtSearchTerm) ||
        (ddt.control_key && ddt.control_key.toLowerCase().includes(ddtSearchTerm.toLowerCase())) ||
        (ddt.active ? "active" : "inactive").includes(ddtSearchTerm.toLowerCase()),
    )
    .slice(0, 10)

  const filteredWarehouses = warehouses
    .filter(
      (warehouse) =>
        warehouse.name.toLowerCase().includes(warehouseSearchTerm.toLowerCase()) ||
        warehouse.lat?.toString().includes(warehouseSearchTerm) ||
        warehouse.lng?.toString().includes(warehouseSearchTerm),
    )
    .slice(0, 10)

  // --- DDT Handlers ---
  const handleEditDdt = (ddt) => {
    setError(null)
    setEditingDdtId(ddt.id)
    setEditingDdtData({
      name: ddt.name,
      status: ddt.active ? "Active" : "Inactive",
      latitude: ddt.lat?.toString() || "",
      longitude: ddt.lng?.toString() || "",
      control_key: ddt.control_key || "",
    })
  }

  const handleCancelEditDdt = () => {
    setEditingDdtId(null)
    setEditingDdtData({ name: "", status: "Active", latitude: "", longitude: "", control_key: "" })
  }

  const handleDdtInputChange = (e) => {
    const { name, value } = e.target
    setEditingDdtData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveDdt = async (ddtId) => {
    setError(null)
    console.log(`[DEBUG] handleSaveDdt for ID: ${ddtId}`)
    console.log("[DEBUG] editingDdtData to be sent:", editingDdtData)
    const payload = {
      name: editingDdtData.name,
      status: editingDdtData.status,
      control_key: editingDdtData.control_key,
    }
    console.log("[DEBUG] JSON being sent:", JSON.stringify(payload))

    try {
      const response = await fetch(`${API_URL}/update_ddt/${ddtId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      })

      const responseText = await response.text()
      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch (e) {
        console.error("[DEBUG] Failed to parse PUT response as JSON:", responseText)
        throw new Error(`Update failed. Server returned non-JSON response: ${responseText.substring(0, 150)}...`)
      }

      console.log("[DEBUG] Backend response from PUT /update_ddt (parsed):", responseData)

      if (!response.ok) {
        console.error("[DEBUG] Update DDT - Response not OK:", response.status, responseData)
        throw new Error(responseData.error || `Failed to update DDT (${response.status})`)
      }

      await fetchData(ddtId)
      handleCancelEditDdt()
    } catch (err) {
      console.error("Error updating DDT:", err)
      setError(err.message)
    }
  }

  const handleDeleteDdt = async (ddtId) => {
    setError(null)
    if (window.confirm(`Are you sure you want to delete DDT ID ${ddtId}?`)) {
      try {
        const response = await fetch(`${API_URL}/delete_ddt/${ddtId}`, {
          method: "DELETE",
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Failed to parse error JSON" }))
          throw new Error(errorData.error || `Failed to delete DDT (${response.status})`)
        }
        await fetchData()
      } catch (err) {
        console.error("Error deleting DDT:", err)
        setError(err.message)
      }
    }
  }

  const handleViewDdtDetails = (ddtName) => {
    navigate(`/ddtinfo/${encodeURIComponent(ddtName)}`)
  }
  // --- Warehouse Handlers ---
  const handleEditWarehouse = (warehouse) => {
    setError(null)
    setEditingWarehouseId(warehouse.id)
    setEditingWarehouseData({
      name: warehouse.name,
      latitude: warehouse.lat?.toString() || "",
      longitude: warehouse.lng?.toString() || "",
    })
  }

  const handleCancelEditWarehouse = () => {
    setEditingWarehouseId(null)
    setEditingWarehouseData({ name: "", latitude: "", longitude: "" })
  }

  const handleWarehouseInputChange = (e) => {
    const { name, value } = e.target
    setEditingWarehouseData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveWarehouse = async (warehouseId) => {
    setError(null)
    console.log(`[DEBUG] Saving Warehouse ${warehouseId} with data:`, editingWarehouseData)
    try {
      const response = await fetch(`${API_URL}/update_warehouse/${warehouseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingWarehouseData),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error JSON" }))
        throw new Error(errorData.error || `Failed to update warehouse (${response.status})`)
      }
      await fetchData(warehouseId)
      handleCancelEditWarehouse()
    } catch (err) {
      console.error("Error updating warehouse:", err)
      setError(err.message)
    }
  }

  const handleDeleteWarehouse = async (warehouseId) => {
    setError(null)
    if (window.confirm(`Are you sure you want to delete Warehouse ID ${warehouseId}?`)) {
      try {
        const response = await fetch(`${API_URL}/delete_warehouse/${warehouseId}`, {
          method: "DELETE",
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Failed to parse error JSON" }))
          throw new Error(errorData.error || `Failed to delete warehouse (${response.status})`)
        }
        await fetchData()
      } catch (err) {
        console.error("Error deleting warehouse:", err)
        setError(err.message)
      }
    }
  }

  const handleViewWarehouseDetails = (warehouseName) => {
    navigate(`/warehouse/${encodeURIComponent(warehouseName)}`)
  }

  const activeDdtsCount = ddts.filter((d) => d.active).length
  const inactiveDdtsCount = ddts.length - activeDdtsCount

  const showInitialLoading = loading && ddts.length === 0 && warehouses.length === 0
  const isInitialLoadError = error && ddts.length === 0 && warehouses.length === 0 && !loading

  return (
    <div className="w-full flex flex-col bg-slate-50 min-h-screen transition-opacity duration-500">
      <nav className="bg-[#171e2a] text-white px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2 text-xl font-semibold text-blue-400">
          <img src="/shadowfly.jpg" alt="ShadowFly Logo" className="h-9 w-auto" />
          <span className="text-yellow-500 text-xl sm:text-2xl">Admin</span>
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

      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Data Information</h1>
          </div>

          {error && !isInitialLoadError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                <span>Operation Error: {error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900 font-bold">
                ×
              </button>
            </div>
          )}

          {showInitialLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <FontAwesomeIcon icon={faSpinner} spin className="text-6xl text-blue-500 mb-4" />
              <p className="text-xl text-gray-600">Loading Data...</p>
            </div>
          )}

          {isInitialLoadError && (
            <div className="flex flex-col items-center justify-center py-20 bg-red-50 rounded-lg">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-6xl text-red-500 mb-4" />
              <p className="text-xl text-red-700 mb-4">Error loading initial data: {error}</p>
              <div className="flex gap-4">
                <button
                  onClick={() => fetchData()}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          )}

          {!showInitialLoading && !isInitialLoadError && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md border">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Total DDTs</h3>
                  <p className="text-3xl font-bold text-blue-600">{ddts.length}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Active DDTs</h3>
                  <p className="text-3xl font-bold text-green-600">{activeDdtsCount}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Inactive DDTs</h3>
                  <p className="text-3xl font-bold text-red-600">{inactiveDdtsCount}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Warehouses</h3>
                  <p className="text-3xl font-bold text-purple-600">{warehouses.length}</p>
                </div>
              </div>

              {/* DDTs Section */}
              <div className="bg-white rounded-lg shadow-md border mb-8">
                <div className="p-6 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <FontAwesomeIcon icon={faBroadcastTower} className="text-blue-600" />
                      DDTs (Drone Drop Towers)
                    </h2>
                    <div className="relative">
                      <FontAwesomeIcon
                        icon={faSearch}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        placeholder="Search DDTs..."
                        value={ddtSearchTerm}
                        onChange={(e) => setDdtSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                      />
                    </div>
                  </div>
                </div>

                {filteredDdts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Latitude
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Longitude
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Control Key
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredDdts.map((ddt) => (
                          <tr key={ddt.id} className="hover:bg-gray-50">
                            {editingDdtId === ddt.id ? (
                              <>
                                <td className="px-6 py-4">
                                  <input
                                    type="text"
                                    name="name"
                                    value={editingDdtData.name}
                                    onChange={handleDdtInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </td>
                                <td className="px-6 py-4">
                                  <input
                                    type="text"
                                    name="latitude"
                                    value={editingDdtData.latitude}
                                    onChange={handleDdtInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Latitude"
                                  />
                                </td>
                                <td className="px-6 py-4">
                                  <input
                                    type="text"
                                    name="longitude"
                                    value={editingDdtData.longitude}
                                    onChange={handleDdtInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Longitude"
                                  />
                                </td>
                                <td className="px-6 py-4">
                                  <select
                                    name="status"
                                    value={editingDdtData.status}
                                    onChange={handleDdtInputChange}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                  </select>
                                </td>
                                <td className="px-6 py-4">
                                  <input
                                    type="text"
                                    name="control_key"
                                    value={editingDdtData.control_key}
                                    onChange={handleDdtInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Control Key"
                                  />
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleSaveDdt(ddt.id)}
                                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                                    >
                                      <FontAwesomeIcon icon={faSave} /> Save
                                    </button>
                                    <button
                                      onClick={handleCancelEditDdt}
                                      className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                                    >
                                      <FontAwesomeIcon icon={faTimesCircle} /> Cancel
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{ddt.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">{ddt.lat?.toFixed(6) || "N/A"}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">{ddt.lng?.toFixed(6) || "N/A"}</td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      ddt.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {ddt.active ? "Active" : "Inactive"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">{ddt.control_key || "N/A"}</td>
                                <td className="px-6 py-4">
                                  <div className="flex gap-2 flex-wrap">
                                    <button
                                      onClick={() => handleViewDdtDetails(ddt.name)}
                                      className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                                    >
                                      <FontAwesomeIcon icon={faEye} /> View
                                    </button>
                                    <button
                                      onClick={() => handleEditDdt(ddt)}
                                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                                    >
                                      <FontAwesomeIcon icon={faEdit} /> Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteDdt(ddt.id)}
                                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                                    >
                                      <FontAwesomeIcon icon={faTrash} /> Delete
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    {ddtSearchTerm ? "No DDTs found matching your search." : "No DDT data available."}
                  </div>
                )}
              </div>

              {/* Warehouses Section */}
              <div className="bg-white rounded-lg shadow-md border">
                <div className="p-6 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <FontAwesomeIcon icon={faWarehouse} className="text-purple-600" />
                      Warehouses
                    </h2>
                    <div className="relative">
                      <FontAwesomeIcon
                        icon={faSearch}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        placeholder="Search Warehouses..."
                        value={warehouseSearchTerm}
                        onChange={(e) => setWarehouseSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                      />
                    </div>
                  </div>
                </div>

                {filteredWarehouses.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Latitude
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Longitude
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Details
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredWarehouses.map((warehouse) => (
                          <tr key={warehouse.id} className="hover:bg-gray-50">
                            {editingWarehouseId === warehouse.id ? (
                              <>
                                <td className="px-6 py-4">
                                  <input
                                    type="text"
                                    name="name"
                                    value={editingWarehouseData.name}
                                    onChange={handleWarehouseInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </td>
                                <td className="px-6 py-4">
                                  <input
                                    type="text"
                                    name="latitude"
                                    value={editingWarehouseData.latitude}
                                    onChange={handleWarehouseInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Latitude"
                                  />
                                </td>
                                <td className="px-6 py-4">
                                  <input
                                    type="text"
                                    name="longitude"
                                    value={editingWarehouseData.longitude}
                                    onChange={handleWarehouseInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Longitude"
                                  />
                                </td>
                                <td className="px-6 py-4"></td>
                                <td className="px-6 py-4">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleSaveWarehouse(warehouse.id)}
                                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                                    >
                                      <FontAwesomeIcon icon={faSave} /> Save
                                    </button>
                                    <button
                                      onClick={handleCancelEditWarehouse}
                                      className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                                    >
                                      <FontAwesomeIcon icon={faTimesCircle} /> Cancel
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{warehouse.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {warehouse.lat?.toFixed(6) || "N/A"}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {warehouse.lng?.toFixed(6) || "N/A"}
                                </td>
                                <td className="px-6 py-4">
                                  <button
                                    onClick={() => handleViewWarehouseDetails(warehouse.name)}
                                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                                  >
                                    <FontAwesomeIcon icon={faEye} /> View
                                  </button>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleEditWarehouse(warehouse)}
                                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                                    >
                                      <FontAwesomeIcon icon={faEdit} /> Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteWarehouse(warehouse.id)}
                                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                                    >
                                      <FontAwesomeIcon icon={faTrash} /> Delete
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    {warehouseSearchTerm ? "No warehouses found matching your search." : "No Warehouse data available."}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default DataInfoPage
