"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { faArrowLeft, faTrash, faEdit, faPlus, faPlane, faGripVertical } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

const API_URL = "http://localhost:5024/api/packages"
const WAREHOUSE_API_URL = "http://localhost:5024/api/warehouses"
const TOWERS_API_URL = "http://localhost:5024/api/towers"
const DRONES_API_URL = "http://localhost:5024/api/drones"
const DRONE_GRIPPERS_API_URL = "http://localhost:5024/api/drone-grippers"

// Helper function to format date-time for <input type="datetime-local">
const formatDateTimeForInput = (isoString) => {
  if (!isoString) return ""
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return ""

  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Helper function to format date-time for display in the table
const formatOptionalDateTimeForDisplay = (dateTimeStr) => {
  if (!dateTimeStr) return "N/A"
  try {
    const date = new Date(dateTimeStr)
    if (isNaN(date.getTime())) return dateTimeStr
    return date.toLocaleString().replace(",", "")
  } catch (e) {
    return dateTimeStr
  }
}

const PackageManagement = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const initialFormData = {
    package_id: "",
    tracking_code: "",
    sender_id: "",
    customer_id: "",
    warehouse_name: "",
    destination_address: "",
    destination_lat: "",
    destination_lng: "",
    current_status: "",
    weight_kg: "",
    estimated_arrival_time: "",
    dispatch_time: "",
    delivery_time: "",
    item_details: "",
    assigned_drone_id: "",
    assigned_gripper: "",
  }

  const [packages, setPackages] = useState([])
  const [formData, setFormData] = useState(initialFormData)
  const [editingPackageId, setEditingPackageId] = useState(null)
  const [message, setMessage] = useState({ text: "", type: "" })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [packageToDelete, setPackageToDelete] = useState(null)

  const [warehouseNames, setWarehouseNames] = useState([])
  const [warehouseSearchTerm, setWarehouseSearchTerm] = useState("")
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false)

  const [towerNames, setTowerNames] = useState([])
  const [towerSearchTerm, setTowerSearchTerm] = useState("")
  const [showTowerDropdown, setShowTowerDropdown] = useState(false)
  const towerInputRef = useRef(null)

  const warehouseInputRef = useRef(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [filterColumn, setFilterColumn] = useState("all")

  // New state variables for drone and gripper functionality
  const [drones, setDrones] = useState([])
  const [showDroneDropdown, setShowDroneDropdown] = useState(false)
  const [selectedDrone, setSelectedDrone] = useState({ id: "", name: "" })
  const [droneSearchTerm, setDroneSearchTerm] = useState("")
  const droneInputRef = useRef(null)

  const [gripperOptions, setGripperOptions] = useState({
    gripper_01: "",
    gripper_02: "",
    gripper_03: "",
  })
  const [selectedGripper, setSelectedGripper] = useState("")

  const displayMessage = (text, type = "success") => {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: "", type: "" }), 5000)
  }

  const fetchPackages = useCallback(async () => {
    try {
      const response = await fetch(API_URL)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setPackages(data)
    } catch (error) {
      console.error("Error fetching packages:", error)
      displayMessage(`Error fetching packages: ${error.message}`, "error")
    }
  }, [])

  const fetchWarehouseNames = useCallback(async () => {
    try {
      const response = await fetch(WAREHOUSE_API_URL)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setWarehouseNames(data)
    } catch (error) {
      console.error("Error fetching warehouse names:", error)
      displayMessage(`Error fetching warehouses: ${error.message}`, "error")
    }
  }, [])

  const fetchTowerNames = useCallback(async () => {
    try {
      const response = await fetch(TOWERS_API_URL)
      const data = await response.json()
      setTowerNames(data)
    } catch (error) {
      console.error("Error fetching tower names:", error)
      displayMessage(`Error fetching tower names: ${error.message}`, "error")
    }
  }, [])

  const fetchTowerCoordinates = useCallback(async (towerName) => {
    if (!towerName) {
      setFormData((prev) => ({ ...prev, destination_lat: "", destination_lng: "" }))
      return
    }
    try {
      const response = await fetch(`${TOWERS_API_URL}/${encodeURIComponent(towerName)}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setFormData((prev) => ({
        ...prev,
        destination_lat: data.latitude,
        destination_lng: data.longitude,
      }))
    } catch (error) {
      console.error(`Error fetching tower coordinates for ${towerName}:`, error)
      displayMessage(`Error fetching tower coordinates: ${error.message}`, "error")
    }
  }, [])

  // New function to fetch drones for a specific warehouse
  const fetchDronesByWarehouse = useCallback(async (warehouseName) => {
    if (!warehouseName) {
      setDrones([])
      return
    }
    try {
      const response = await fetch(`${DRONES_API_URL}/${encodeURIComponent(warehouseName)}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setDrones(data)
    } catch (error) {
      console.error(`Error fetching drones for warehouse ${warehouseName}:`, error)
      displayMessage(`Error fetching drones: ${error.message}`, "error")
      setDrones([])
    }
  }, [])

  // New function to fetch gripper information for a specific drone
  const fetchDroneGrippers = useCallback(async (droneId) => {
    if (!droneId) {
      setGripperOptions({
        gripper_01: "",
        gripper_02: "",
        gripper_03: "",
      })
      return
    }
    try {
      const response = await fetch(`${DRONE_GRIPPERS_API_URL}/${encodeURIComponent(droneId)}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setGripperOptions({
        gripper_01: data.gripper_01 || "",
        gripper_02: data.gripper_02 || "",
        gripper_03: data.gripper_03 || "",
      })
    } catch (error) {
      console.error(`Error fetching gripper data for drone ${droneId}:`, error)
      displayMessage(`Error fetching gripper data: ${error.message}`, "error")
      setGripperOptions({
        gripper_01: "",
        gripper_02: "",
        gripper_03: "",
      })
    }
  }, [])

  useEffect(() => {
    fetchPackages()
    fetchWarehouseNames()
    fetchTowerNames()

    if (location.state && location.state.warehouseName) {
      const { warehouseName } = location.state
      setFormData((prev) => ({ ...prev, warehouse_name: warehouseName }))
      setWarehouseSearchTerm(warehouseName)
      fetchDronesByWarehouse(warehouseName)
    }
  }, [fetchPackages, fetchWarehouseNames, fetchTowerNames, fetchDronesByWarehouse, location.state])

  // Effect to fetch drones when warehouse changes
  useEffect(() => {
    if (formData.warehouse_name) {
      fetchDronesByWarehouse(formData.warehouse_name)
    } else {
      setDrones([])
      setSelectedDrone({ id: "", name: "" })
      setDroneSearchTerm("")
      setFormData((prev) => ({ ...prev, assigned_drone_id: "" }))
    }
  }, [formData.warehouse_name, fetchDronesByWarehouse])

  // Effect to fetch gripper data when selected drone changes
  useEffect(() => {
    if (formData.assigned_drone_id) {
      fetchDroneGrippers(formData.assigned_drone_id)
    } else {
      setGripperOptions({
        gripper_01: "",
        gripper_02: "",
        gripper_03: "",
      })
      setSelectedGripper("")
      setFormData((prev) => ({ ...prev, assigned_gripper: "" }))
    }
  }, [formData.assigned_drone_id, fetchDroneGrippers])

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" && value === "" ? "" : value,
    }))
  }

  const handleWarehouseSearchChange = (e) => {
    const value = e.target.value
    setWarehouseSearchTerm(value)
    setShowWarehouseDropdown(true)
    setFormData((prev) => ({ ...prev, warehouse_name: "" }))
  }

  const handleWarehouseSelect = (selectedName) => {
    setFormData((prev) => ({
      ...prev,
      warehouse_name: selectedName,
    }))
    setWarehouseSearchTerm(selectedName)
    setShowWarehouseDropdown(false)

    // Reset drone selection when warehouse changes
    setSelectedDrone({ id: "", name: "" })
    setDroneSearchTerm("")
    setFormData((prev) => ({ ...prev, assigned_drone_id: "", assigned_gripper: "" }))
  }

  const handleTowerSearchChange = (e) => {
    const value = e.target.value
    setTowerSearchTerm(value)
    setShowTowerDropdown(true)
  }

  const handleTowerSelect = (towerName) => {
    setTowerSearchTerm(towerName)
    setShowTowerDropdown(false)
    fetchTowerCoordinates(towerName)
  }

  // New handlers for drone selection
  const handleDroneSearchChange = (e) => {
    const value = e.target.value
    setDroneSearchTerm(value)
    setShowDroneDropdown(true)
    setFormData((prev) => ({ ...prev, assigned_drone_id: "" }))
    setSelectedDrone({ id: "", name: "" })
  }

  const handleDroneSelect = (droneId, droneName) => {
    setSelectedDrone({ id: droneId, name: droneName })
    setDroneSearchTerm(droneName)
    setShowDroneDropdown(false)
    setFormData((prev) => ({ ...prev, assigned_drone_id: droneId }))

    // Reset gripper selection when drone changes
    setSelectedGripper("")
    setFormData((prev) => ({ ...prev, assigned_gripper: "" }))
  }

  // Handler for gripper selection
  const handleGripperSelect = (gripperNumber) => {
    let gripperValue = ""

    if (gripperNumber === 1) {
      gripperValue = "gripper_01"
    } else if (gripperNumber === 2) {
      gripperValue = "gripper_02"
    } else if (gripperNumber === 3) {
      gripperValue = "gripper_03"
    }

    setSelectedGripper(gripperNumber.toString())
    setFormData((prev) => ({ ...prev, assigned_gripper: gripperValue }))
  }

  const clearForm = () => {
    setFormData(initialFormData)
    setEditingPackageId(null)
    setWarehouseSearchTerm("")
    setShowWarehouseDropdown(false)
    setTowerSearchTerm("")
    setShowTowerDropdown(false)
    setSelectedDrone({ id: "", name: "" })
    setDroneSearchTerm("")
    setSelectedGripper("")
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const dataToSend = { ...formData }
    ;["destination_lat", "destination_lng", "weight_kg"].forEach((field) => {
      if (dataToSend[field] !== null && dataToSend[field] !== undefined && dataToSend[field] !== "") {
        const numValue = Number.parseFloat(dataToSend[field])
        dataToSend[field] = isNaN(numValue) ? null : numValue
      } else {
        dataToSend[field] = null
      }
    })

    if (formData.weight_kg && dataToSend.weight_kg === null) {
      dataToSend.weight_kg = formData.weight_kg
    } else if (dataToSend.weight_kg !== null) {
      dataToSend.weight_kg = String(dataToSend.weight_kg)
    }
    ;["estimated_arrival_time", "dispatch_time"].forEach((field) => {
      if (!dataToSend[field]) {
        dataToSend[field] = null
      }
    })

    let response
    let url = API_URL
    let method = "POST"

    if (editingPackageId) {
      method = "PUT"
      url = `${API_URL}/${editingPackageId}`
    }

    try {
      response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      })

      const resultText = await response.text()
      let result
      try {
        result = JSON.parse(resultText)
      } catch (e) {
        if (!response.ok) {
          displayMessage(`Error: ${response.status} - ${response.statusText || resultText}`, "error")
          return
        }
        console.warn("Response was OK but not JSON:", resultText)
        result = { message: "Operation successful, but unexpected response format." }
      }

      if (response.ok) {
        displayMessage(result.message || `Package ${editingPackageId ? "updated" : "added"} successfully!`, "success")
        clearForm()
        fetchPackages()
      } else {
        displayMessage(result.error || result.message || `Error: ${response.statusText}`, "error")
      }
    } catch (error) {
      console.error("Form submission error:", error)
      displayMessage(`An unexpected error occurred: ${error.message}`, "error")
    }
  }

  const handleEdit = async (packageId) => {
    try {
      const response = await fetch(`${API_URL}/${packageId}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      const pkg = await response.json()

      const formDataForEdit = {}
      for (const key in initialFormData) {
        if (pkg[key] !== undefined && pkg[key] !== null) {
          if (key === "estimated_arrival_time" || key === "dispatch_time") {
            formDataForEdit[key] = formatDateTimeForInput(pkg[key])
          } else {
            formDataForEdit[key] = pkg[key]
          }
        } else {
          formDataForEdit[key] = initialFormData[key]
          if (["destination_lat", "destination_lng", "weight_kg"].includes(key)) {
            formDataForEdit[key] = ""
          }
        }
      }
      formDataForEdit.package_id = pkg.package_id

      setFormData(formDataForEdit)
      setEditingPackageId(pkg.package_id)
      setWarehouseSearchTerm(pkg.warehouse_name || "")
      setTowerSearchTerm("")

      // Set drone and gripper values for editing
      if (pkg.assigned_drone_id) {
        const matchingDrone = drones.find((drone) => drone.drone_id === pkg.assigned_drone_id)
        if (matchingDrone) {
          setSelectedDrone({ id: matchingDrone.drone_id, name: matchingDrone.drone_name })
          setDroneSearchTerm(matchingDrone.drone_name)
        } else {
          // If we don't have the drone info yet, fetch drones for this warehouse
          if (pkg.warehouse_name) {
            fetchDronesByWarehouse(pkg.warehouse_name).then(() => {
              const foundDrone = drones.find((drone) => drone.drone_id === pkg.assigned_drone_id)
              if (foundDrone) {
                setSelectedDrone({ id: foundDrone.drone_id, name: foundDrone.drone_name })
                setDroneSearchTerm(foundDrone.drone_name)
              }
            })
          }
        }
      } else {
        setSelectedDrone({ id: "", name: "" })
        setDroneSearchTerm("")
      }

      // Set gripper selection
      if (pkg.assigned_gripper) {
        if (pkg.assigned_gripper === "gripper_01") {
          setSelectedGripper("1")
        } else if (pkg.assigned_gripper === "gripper_02") {
          setSelectedGripper("2")
        } else if (pkg.assigned_gripper === "gripper_03") {
          setSelectedGripper("3")
        } else {
          setSelectedGripper("")
        }
      } else {
        setSelectedGripper("")
      }

      window.scrollTo(0, 0)
    } catch (error) {
      console.error("Error fetching package for edit:", error)
      displayMessage(`Error fetching package details: ${error.message}`, "error")
    }
  }

  const handleDeleteInitiate = (packageId) => {
    setPackageToDelete(packageId)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!packageToDelete) return
    try {
      const response = await fetch(`${API_URL}/${packageToDelete}`, { method: "DELETE" })
      const result = await response.json()
      if (response.ok) {
        displayMessage(result.message || "Package deleted successfully!", "success")
        fetchPackages()
        if (editingPackageId === packageToDelete) {
          clearForm()
        }
      } else {
        displayMessage(result.error || `Error: ${response.statusText}`, "error")
      }
    } catch (error) {
      console.error("Error deleting package:", error)
      displayMessage(`An unexpected error occurred while deleting: ${error.message}`, "error")
    } finally {
      setShowDeleteModal(false)
      setPackageToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setPackageToDelete(null)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (warehouseInputRef.current && !warehouseInputRef.current.contains(event.target)) {
        setShowWarehouseDropdown(false)
      }
      if (towerInputRef.current && !towerInputRef.current.contains(event.target)) {
        setShowTowerDropdown(false)
      }
      if (droneInputRef.current && !droneInputRef.current.contains(event.target)) {
        setShowDroneDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const filteredWarehouseNames = warehouseNames.filter((name) =>
    name.toLowerCase().includes(warehouseSearchTerm.toLowerCase()),
  )

  const filteredTowerNames = towerNames.filter((name) => name.toLowerCase().includes(towerSearchTerm.toLowerCase()))

  const filteredDrones = drones.filter((drone) =>
    drone.drone_name.toLowerCase().includes(droneSearchTerm.toLowerCase()),
  )

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleFilterColumnChange = (e) => {
    setFilterColumn(e.target.value)
  }

  const filteredPackages = packages.filter((pkg) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase()

    if (filterColumn === "all") {
      return Object.values(pkg).some((value) => String(value).toLowerCase().includes(lowerCaseSearchTerm))
    } else {
      const value = pkg[filterColumn]
      return String(value).toLowerCase().includes(lowerCaseSearchTerm)
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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

      {/* Main Container */}
      <div className="max-w-9xl mx-auto p-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-slate-200">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-slate-800 mb-2">Package Management</h2>
            <p className="text-slate-600 text-lg">Manage your packages efficiently with our comprehensive system</p>
          </div>

          {/* Message Display */}
          {message.text && (
            <div
              className={`mb-6 p-4 rounded-xl border-l-4 ${
                message.type === "error"
                  ? "bg-red-50 text-red-800 border-red-400"
                  : "bg-green-50 text-green-800 border-green-400"
              }`}
            >
              <div className="flex items-center">
                <div className="font-semibold">{message.type === "error" ? "Error" : "Success"}</div>
                <div className="ml-2">{message.text}</div>
              </div>
            </div>
          )}

          {/* Form Section */}
          <div className="bg-slate-50 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-slate-700 flex items-center">
                <FontAwesomeIcon icon={editingPackageId ? faEdit : faPlus} className="mr-3 text-blue-600" />
                {editingPackageId ? "Edit Package" : "Add New Package"}
              </h3>
              {editingPackageId && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  Editing: {editingPackageId}
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Package ID */}
                <div>
                  <label htmlFor="package_id" className="block text-sm font-semibold text-slate-700 mb-2">
                    Package ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="package_id"
                    name="package_id"
                    value={formData.package_id}
                    onChange={handleInputChange}
                    required
                    readOnly={!!editingPackageId}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                    placeholder="Enter package ID"
                  />
                </div>

                {/* Tracking Code */}
                <div>
                  <label htmlFor="tracking_code" className="block text-sm font-semibold text-slate-700 mb-2">
                    Tracking Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="tracking_code"
                    name="tracking_code"
                    value={formData.tracking_code}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                    placeholder="Enter tracking code"
                  />
                </div>

                {/* Sender ID */}
                <div>
                  <label htmlFor="sender_id" className="block text-sm font-semibold text-slate-700 mb-2">
                    Sender ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="sender_id"
                    name="sender_id"
                    value={formData.sender_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                    placeholder="Enter sender ID"
                  />
                </div>

                {/* Customer ID */}
                <div>
                  <label htmlFor="customer_id" className="block text-sm font-semibold text-slate-700 mb-2">
                    Customer ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="customer_id"
                    name="customer_id"
                    value={formData.customer_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                    placeholder="Enter customer ID"
                  />
                </div>

                {/* Warehouse Name */}
                <div className="relative" ref={warehouseInputRef}>
                  <label htmlFor="warehouse_name" className="block text-sm font-semibold text-slate-700 mb-2">
                    Warehouse Name
                  </label>
                  <input
                    type="text"
                    id="warehouse_name"
                    placeholder="Search warehouse..."
                    value={warehouseSearchTerm}
                    onChange={handleWarehouseSearchChange}
                    onFocus={() => setShowWarehouseDropdown(true)}
                    autoComplete="off"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                  />
                  {showWarehouseDropdown && filteredWarehouseNames.length > 0 && (
                    <ul className="absolute top-full left-0 w-full max-h-48 overflow-y-auto bg-white border border-slate-300 border-t-0 rounded-b-lg shadow-lg z-50">
                      {filteredWarehouseNames.map((name) => (
                        <li
                          key={name}
                          onClick={() => handleWarehouseSelect(name)}
                          className="px-4 py-3 cursor-pointer hover:bg-blue-50 text-sm transition-colors"
                        >
                          {name}
                        </li>
                      ))}
                    </ul>
                  )}
                  <input type="hidden" name="warehouse_name" value={formData.warehouse_name} />
                </div>

                {/* Assign to Drone - NEW FIELD */}
                <div className="relative" ref={droneInputRef}>
                  <label htmlFor="assigned_drone_id" className="block text-sm font-semibold text-slate-700 mb-2">
                    Assign to Drone
                  </label>
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faPlane} className="absolute left-3 text-slate-400" />
                    <input
                      type="text"
                      id="assigned_drone_search"
                      placeholder="Search drone..."
                      value={droneSearchTerm}
                      onChange={handleDroneSearchChange}
                      onFocus={() => setShowDroneDropdown(true)}
                      autoComplete="off"
                      disabled={!formData.warehouse_name}
                      className="w-full pl-10 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                  {showDroneDropdown && filteredDrones.length > 0 && (
                    <ul className="absolute top-full left-0 w-full max-h-48 overflow-y-auto bg-white border border-slate-300 border-t-0 rounded-b-lg shadow-lg z-50">
                      {filteredDrones.map((drone) => (
                        <li
                          key={drone.drone_id}
                          onClick={() => handleDroneSelect(drone.drone_id, drone.drone_name)}
                          className="px-4 py-3 cursor-pointer hover:bg-blue-50 text-sm transition-colors"
                        >
                          <div className="font-medium">{drone.drone_name}</div>
                          <div className="text-xs text-slate-500">ID: {drone.drone_id}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {!formData.warehouse_name && (
                    <p className="mt-1 text-xs text-amber-600">Select a warehouse first to see available drones</p>
                  )}
                  <input type="hidden" name="assigned_drone_id" value={formData.assigned_drone_id} />
                </div>

                {/* Add Package to Gripper - NEW FIELD */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Add Package to Gripper</label>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-4">
                      <FontAwesomeIcon icon={faGripVertical} className="text-slate-400" />
                      <div className="flex flex-wrap gap-3">
                        {[1, 2, 3].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleGripperSelect(num)}
                            disabled={!formData.assigned_drone_id}
                            className={`px-4 py-2 border rounded-lg transition-all ${
                              selectedGripper === num.toString()
                                ? "bg-blue-500 text-white border-blue-600"
                                : "bg-white text-slate-700 border-slate-300 hover:bg-blue-50"
                            } ${!formData.assigned_drone_id ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            {num} {num === 1 && gripperOptions.gripper_01 ? `(${gripperOptions.gripper_01})` : ""}
                            {num === 2 && gripperOptions.gripper_02 ? `(${gripperOptions.gripper_02})` : ""}
                            {num === 3 && gripperOptions.gripper_03 ? `(${gripperOptions.gripper_03})` : ""}
                          </button>
                        ))}
                      </div>
                    </div>
                    {!formData.assigned_drone_id && (
                      <p className="text-xs text-amber-600">Select a drone first to choose a gripper</p>
                    )}
                  </div>
                  <input type="hidden" name="assigned_gripper" value={formData.assigned_gripper} />
                </div>

                {/* Current Status */}
                <div>
                  <label htmlFor="current_status" className="block text-sm font-semibold text-slate-700 mb-2">
                    Current Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="current_status"
                    name="current_status"
                    value={formData.current_status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Failed">Failed</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Returned">Returned</option>
                  </select>
                </div>

                {/* Destination Address */}
                <div>
                  <label htmlFor="destination_address" className="block text-sm font-semibold text-slate-700 mb-2">
                    Destination Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="destination_address"
                    name="destination_address"
                    value={formData.destination_address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                    placeholder="Enter destination address"
                  />
                </div>

                {/* Tower Selection - NEW FIELD */}
                <div className="relative" ref={towerInputRef}>
                  <label htmlFor="tower_search" className="block text-sm font-semibold text-slate-700 mb-2">
                    Select Tower
                  </label>
                  <input
                    type="text"
                    id="tower_search"
                    placeholder="Search tower..."
                    value={towerSearchTerm}
                    onChange={handleTowerSearchChange}
                    onFocus={() => setShowTowerDropdown(true)}
                    autoComplete="off"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                  />
                  {showTowerDropdown && filteredTowerNames.length > 0 && (
                    <ul className="absolute top-full left-0 w-full max-h-48 overflow-y-auto bg-white border border-slate-300 border-t-0 rounded-b-lg shadow-lg z-50">
                      {filteredTowerNames.map((name) => (
                        <li
                          key={name}
                          onClick={() => handleTowerSelect(name)}
                          className="px-4 py-3 cursor-pointer hover:bg-blue-50 text-sm transition-colors"
                        >
                          {name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Destination Latitude */}
                <div>
                  <label htmlFor="destination_lat" className="block text-sm font-semibold text-slate-700 mb-2">
                    Destination Latitude <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="destination_lat"
                    name="destination_lat"
                    value={formData.destination_lat}
                    onChange={handleInputChange}
                    required
                    readOnly={!!towerSearchTerm}
                    className={`w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                      towerSearchTerm ? "bg-slate-100" : "bg-white"
                    }`}
                    placeholder="Enter destination latitude"
                  />
                  {towerSearchTerm && <p className="mt-1 text-xs text-blue-600">Auto-filled from selected tower</p>}
                </div>

                {/* Destination Longitude */}
                <div>
                  <label htmlFor="destination_lng" className="block text-sm font-semibold text-slate-700 mb-2">
                    Destination Longitude <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="destination_lng"
                    name="destination_lng"
                    value={formData.destination_lng}
                    onChange={handleInputChange}
                    required
                    readOnly={!!towerSearchTerm}
                    className={`w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                      towerSearchTerm ? "bg-slate-100" : "bg-white"
                    }`}
                    placeholder="Enter destination longitude"
                  />
                  {towerSearchTerm && <p className="mt-1 text-xs text-blue-600">Auto-filled from selected tower</p>}
                </div>

                {/* Weight (kg) */}
                <div>
                  <label htmlFor="weight_kg" className="block text-sm font-semibold text-slate-700 mb-2">
                    Weight (kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="weight_kg"
                    name="weight_kg"
                    value={formData.weight_kg}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                    placeholder="Enter weight in kg"
                  />
                </div>

                {/* Estimated Arrival Time */}
                <div>
                  <label htmlFor="estimated_arrival_time" className="block text-sm font-semibold text-slate-700 mb-2">
                    Estimated Arrival Time
                  </label>
                  <input
                    type="datetime-local"
                    id="estimated_arrival_time"
                    name="estimated_arrival_time"
                    value={formData.estimated_arrival_time}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                  />
                </div>

                {/* Dispatch Time */}
                <div>
                  <label htmlFor="dispatch_time" className="block text-sm font-semibold text-slate-700 mb-2">
                    Dispatch Time
                  </label>
                  <input
                    type="datetime-local"
                    id="dispatch_time"
                    name="dispatch_time"
                    value={formData.dispatch_time}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                  />
                </div>

                {/* Delivery Time */}
                <div>
                  <label htmlFor="delivery_time" className="block text-sm font-semibold text-slate-700 mb-2">
                    Delivery Time
                  </label>
                  <input
                    type="datetime-local"
                    id="delivery_time"
                    name="delivery_time"
                    value={formData.delivery_time}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                  />
                </div>

                {/* Item Details */}
                <div>
                  <label htmlFor="item_details" className="block text-sm font-semibold text-slate-700 mb-2">
                    Item Details <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="item_details"
                    name="item_details"
                    value={formData.item_details}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                    placeholder="Enter item details"
                  />
                </div>
              </div>

              {/* Submit and Clear Form Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={clearForm}
                  className="bg-slate-500 text-white px-6 py-3 rounded-lg hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-500 transition-all duration-200"
                >
                  Clear Form
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  {editingPackageId ? "Update Package" : "Add Package"}
                </button>
              </div>
            </form>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-semibold text-slate-700">Packages List</h3>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
                  Existing packages: {packages.length}
                </div>
              </div>
              <div className="flex items-center space-x-4 mb-6">
                <input
                  type="text"
                  id="search"
                  name="search"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                  placeholder="Search packages..."
                />
                <select
                  id="filter_column"
                  name="filter_column"
                  value={filterColumn}
                  onChange={handleFilterColumnChange}
                  className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                >
                  <option value="all">All Columns</option>
                  <option value="package_id">Package ID</option>
                  <option value="tracking_code">Tracking Code</option>
                  <option value="sender_id">Sender ID</option>
                  <option value="customer_id">Customer ID</option>
                  <option value="warehouse_name">Warehouse Name</option>
                  <option value="destination_address">Destination Address</option>
                  <option value="current_status">Current Status</option>
                  <option value="weight_kg">Weight (kg)</option>
                  <option value="estimated_arrival_time">Estimated Arrival Time</option>
                  <option value="dispatch_time">Dispatch Time</option>
                  <option value="delivery_time">Delivery Time</option>
                  <option value="item_details">Item Details</option>
                  <option value="assigned_drone_id">Assigned Drone ID</option>
                  <option value="assigned_gripper">Assigned Gripper</option>
                </select>
              </div>
              {searchTerm && (
                <div className="mb-4 text-sm text-slate-600">
                  Results found: <span className="font-semibold">{filteredPackages.length}</span>
                </div>
              )}
            </div>

            {/* Fixed table with proper alignment */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Package ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Tracking Code</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Sender ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Customer ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Warehouse Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Destination Address</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Current Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Weight (kg)</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Estimated Arrival</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Dispatch Time</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Delivery Time</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Item Details</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Drone ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Gripper</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPackages.length > 0 ? (
                    filteredPackages.map((pkg) => (
                      <tr key={pkg.package_id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-600">{pkg.package_id}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{pkg.tracking_code}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{pkg.sender_id}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{pkg.customer_id}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{pkg.warehouse_name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{pkg.destination_address}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{pkg.current_status}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{pkg.weight_kg}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatOptionalDateTimeForDisplay(pkg.estimated_arrival_time)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatOptionalDateTimeForDisplay(pkg.dispatch_time)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatOptionalDateTimeForDisplay(pkg.delivery_time)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{pkg.item_details}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{pkg.assigned_drone_id}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{pkg.assigned_gripper}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(pkg.package_id)}
                              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            >
                              <FontAwesomeIcon icon={faEdit} className="text-sm" />
                            </button>
                            <button
                              onClick={() => handleDeleteInitiate(pkg.package_id)}
                              className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-600 transition-all duration-200"
                            >
                              <FontAwesomeIcon icon={faTrash} className="text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="15" className="px-4 py-6 text-center text-slate-500">
                        No packages found. Add a new package or adjust your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-lg w-full max-w-md">
            <h3 className="text-2xl font-semibold text-slate-800 mb-4">Confirm Deletion</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to delete this package?</p>
            <div className="flex justify-end">
              <button
                onClick={handleDeleteConfirm}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-600 transition-all duration-200 mr-2"
              >
                Delete
              </button>
              <button
                onClick={handleDeleteCancel}
                className="bg-slate-300 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PackageManagement
