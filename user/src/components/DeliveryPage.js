"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Edit, Warehouse, Package, Truck, DrillIcon as Drone, MapPin, Activity, CheckCircle, Clock, AlertCircle, Search, X, ChevronDown, Navigation } from 'lucide-react'
import "leaflet/dist/leaflet.css"
import "../styles/Home.css"
import { useLocation } from "react-router-dom"

import { faArrowLeft, faPlane, faEye } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

const DeliveryPage = () => {
  const navigate = useNavigate()
  const [droneAssignments, setDroneAssignments] = useState([])
  const [selectedWarehouse, setSelectedWarehouse] = useState("")
  const [warehouseDetails, setWarehouseDetails] = useState(null)
  const [availablePackages, setAvailablePackages] = useState([])
  const [deliveryMissions, setDeliveryMissions] = useState([])
  const [userRole, setUserRole] = useState(null)

  // Search and filter states
  const [warehouseSearchTerm, setWarehouseSearchTerm] = useState("")
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false)

  // Package filters
  const [packageSearchTerm, setPackageSearchTerm] = useState("")
  const [packageIdFilter, setPackageIdFilter] = useState("")
  const [itemDetailsFilter, setItemDetailsFilter] = useState("")

  // Mission filters
  const [missionSearchTerm, setMissionSearchTerm] = useState("")
  const [missionPackageIdFilter, setMissionPackageIdFilter] = useState("")
  const [missionDroneIdFilter, setMissionDroneIdFilter] = useState("")
  const [missionDestinationFilter, setMissionDestinationFilter] = useState("")
  const [missionStatusFilter, setMissionStatusFilter] = useState("all")

  const [selectedPackage, setSelectedPackage] = useState(null)
  const [showPackageModal, setShowPackageModal] = useState(false)

  const mapRef = useRef(null)
  const warehouseDropdownRef = useRef(null)
  const location = useLocation()

  const { username } = location.state || {}

  // Fetch user role first
  useEffect(() => {
    if (username) {
      fetch(`http://localhost:5042/api/user_role/${username}`)
        .then((response) => response.json())
        .then((data) => {
          setUserRole(data)
        })
        .catch((error) => console.error("Error fetching user role:", error))
    }
  }, [username])

  // Fetch drone assignments for the dropdown
  useEffect(() => {
    fetch("http://localhost:5042/api/drone_assignments")
      .then((response) => response.json())
      .then((data) => {
        setDroneAssignments(data)
      })
      .catch((error) => console.error("Error fetching drone assignments:", error))
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (warehouseDropdownRef.current && !warehouseDropdownRef.current.contains(event.target)) {
        setShowWarehouseDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // **NEW:** Load selected warehouse from sessionStorage on component mount
  useEffect(() => {
    const storedWarehouse = sessionStorage.getItem("selectedWarehouse")
    if (storedWarehouse) {
      const { value, label } = JSON.parse(storedWarehouse)
      setSelectedWarehouse(value)
      setWarehouseSearchTerm(label)
    }
  }, [])

  // Fetch warehouse details when a warehouse is selected
  useEffect(() => {
    if (selectedWarehouse) {
      // **NEW:** Store selected warehouse in sessionStorage
      const warehouseToStore = droneAssignments.find(a => a.value === selectedWarehouse);
      if (warehouseToStore) {
        sessionStorage.setItem("selectedWarehouse", JSON.stringify(warehouseToStore));
      }


      fetch(`http://localhost:5042/api/warehouse_details/${selectedWarehouse}`)
        .then((response) => response.json())
        .then((data) => {
          setWarehouseDetails(data)
        })
        .catch((error) => console.error("Error fetching warehouse details:", error))

      // Fetch available packages for the selected warehouse
      fetch(`http://localhost:5042/api/available_packages/${selectedWarehouse}`)
        .then((response) => response.json())
        .then((data) => {
          setAvailablePackages(data)
        })
        .catch((error) => console.error("Error fetching available packages:", error))

      // Fetch delivery missions for the selected warehouse
      fetch(`http://localhost:5042/api/delivery_missions/${selectedWarehouse}`)
        .then((response) => response.json())
        .then((data) => {
          setDeliveryMissions(Array.isArray(data) ? data : [])
        })
        .catch((error) => console.error("Error fetching delivery missions:", error))
    } else {
      setWarehouseDetails(null)
      setAvailablePackages([])
      setDeliveryMissions([])
      // **NEW:** Clear selected warehouse from sessionStorage if no warehouse is selected
      sessionStorage.removeItem("selectedWarehouse");
    }
  }, [selectedWarehouse, droneAssignments]) // Added droneAssignments to dependency array

  const handleViewClick = async (pkg) => {
    try {
      const response = await fetch(`http://localhost:5042/api/package/${pkg.package_id}`)
      if (!response.ok) throw new Error("Failed to fetch package details")
      const data = await response.json()
      setSelectedPackage(data)
      setShowPackageModal(true)
    } catch (error) {
      console.error("Error fetching package details:", error)
    }
  }

  const handleMonitorClick = (mission) => {
    navigate("/monitor", {
      state: {
        packageData: mission,
        // **NEW:** Pass the selected warehouse data to Monitor.js
        selectedWarehouseData: selectedWarehouse ? droneAssignments.find(a => a.value === selectedWarehouse) : null,
      },
    })
  }

  const DetailRow = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-4">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="text-sm text-slate-900 col-span-2">
        {value || <span className="text-slate-400">Not available</span>}
      </span>
    </div>
  )

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "Not available"
    try {
      const date = new Date(dateTimeString)
      return date.toLocaleString()
    } catch {
      return dateTimeString
    }
  }

  const handleWarehouseSelect = (assignment) => {
    setSelectedWarehouse(assignment.value)
    setWarehouseSearchTerm(assignment.label)
    setShowWarehouseDropdown(false)
  }

  const clearWarehouseSelection = () => {
    setSelectedWarehouse("")
    setWarehouseSearchTerm("")
    setShowWarehouseDropdown(false)
    // **NEW:** Clear sessionStorage when warehouse selection is cleared
    sessionStorage.removeItem("selectedWarehouse")
  }

  // Filter warehouses based on search term
  const filteredWarehouses = droneAssignments.filter((assignment) =>
    assignment.label.toLowerCase().includes(warehouseSearchTerm.toLowerCase()),
  )

  // Calculate dropdown height for proper spacing
  const getDropdownHeight = () => {
    const itemHeight = 64
    const maxItems = 5
    const actualItems = Math.min(filteredWarehouses.length, maxItems)
    return actualItems * itemHeight + 8
  }

  // Filter packages based on all criteria
  const filteredPackages = availablePackages.filter((pkg) => {
    const matchesGeneralSearch =
      packageSearchTerm === "" ||
      pkg.package_id?.toLowerCase().includes(packageSearchTerm.toLowerCase()) ||
      pkg.item_details?.toLowerCase().includes(packageSearchTerm.toLowerCase())

    const matchesPackageId =
      packageIdFilter === "" || pkg.package_id?.toLowerCase().includes(packageIdFilter.toLowerCase())

    const matchesItemDetails =
      itemDetailsFilter === "" || pkg.item_details?.toLowerCase().includes(itemDetailsFilter.toLowerCase())

    return matchesGeneralSearch && matchesPackageId && matchesItemDetails
  })

  // Filter missions based on all criteria
  const filteredMissions = deliveryMissions.filter((mission) => {
    const matchesGeneralSearch =
      missionSearchTerm === "" ||
      mission.package_id?.toLowerCase().includes(missionSearchTerm.toLowerCase()) ||
      mission.drone_id?.toLowerCase().includes(missionSearchTerm.toLowerCase()) ||
      mission.destination?.toLowerCase().includes(missionSearchTerm.toLowerCase()) || // Use mission.destination
      mission.status?.toLowerCase().includes(missionSearchTerm.toLowerCase())

    const matchesPackageId =
      missionPackageIdFilter === "" || mission.package_id?.toLowerCase().includes(missionPackageIdFilter.toLowerCase())

    const matchesDroneId =
      missionDroneIdFilter === "" || mission.drone_id?.toLowerCase().includes(missionDroneIdFilter.toLowerCase())

    const matchesDestination =
      missionDestinationFilter === "" ||
      mission.destination?.toLowerCase().includes(missionDestinationFilter.toLowerCase()) // Use mission.destination

    const matchesStatus =
      missionStatusFilter === "all" || mission.status?.toLowerCase() === missionStatusFilter.toLowerCase()

    return matchesGeneralSearch && matchesPackageId && matchesDroneId && matchesDestination && matchesStatus
  })

  // Get unique values for filters
  const missionStatuses = [...new Set(deliveryMissions.map((mission) => mission.status).filter(Boolean))]

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      inactive: { color: "bg-gray-100 text-gray-800", icon: Clock },
      maintenance: { color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
      in_transit: { color: "bg-blue-100 text-blue-800", icon: Truck },
      delivered: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      pending: { color: "bg-orange-100 text-orange-800", icon: Clock },
    }

    const config = statusConfig[status?.toLowerCase()] || statusConfig["inactive"]
    const IconComponent = config.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3" />
        {status}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Enhanced Navbar */}
      <nav className="bg-[#171e2a] text-white px-8 py-4 flex justify-between items-center shadow-md w-full">
        <div className="flex items-center gap-2 text-xl font-semibold text-blue-400">
          <img src="/shadowfly.jpg" alt="ShadowFly Logo" className="h-9 w-auto" />
        </div>
        <div className="flex items-center gap-4">
          {userRole && (
            <div className="text-sm">
              <span className="text-slate-300">Role: </span>
              <span className="text-blue-300 font-medium capitalize">{userRole.role}</span>
            </div>
          )}
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

      {/* Main Content */}
      <div className="w-full max-w-screen-2xl mx-auto px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="text-center mb-8 w-full">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Delivery Management Dashboard</h1>
          <p className="text-lg text-slate-600">Monitor and manage your drone delivery operations</p>
        </div>

        {/* Warehouse Selection */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden w-full">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 w-full">
            <div className="flex items-center gap-3">
              <Warehouse className="w-6 h-6 text-white" />
              <h2 className="text-xl font-semibold text-white">Warehouse Selection</h2>
            </div>
          </div>
          <div className="p-8 w-full">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Search and select a warehouse to view details and manage deliveries
            </label>

            {/* Dropdown Container with Allocated Space */}
            <div
              className="relative"
              ref={warehouseDropdownRef}
              style={{
                marginBottom: showWarehouseDropdown ? `${getDropdownHeight()}px` : "0px",
                transition: "margin-bottom 0.2s ease-in-out",
              }}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search warehouses..."
                  value={warehouseSearchTerm}
                  onChange={(e) => {
                    setWarehouseSearchTerm(e.target.value)
                    setShowWarehouseDropdown(true)
                  }}
                  onFocus={() => setShowWarehouseDropdown(true)}
                  className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-white transition-all duration-200"
                />
                {selectedWarehouse && (
                  <button
                    onClick={clearWarehouseSelection}
                    className="absolute right-10 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                <ChevronDown
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 transition-transform duration-200 ${
                    showWarehouseDropdown ? "rotate-180" : ""
                  }`}
                />
              </div>

              {/* Enhanced Dropdown with Proper Positioning and Spacing */}
              {showWarehouseDropdown && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-300 rounded-lg shadow-xl overflow-hidden">
                  <div className="max-h-80 overflow-y-auto">
                    {filteredWarehouses.length > 0 ? (
                      <>
                        {filteredWarehouses.map((assignment, index) => (
                          <button
                            key={index}
                            onClick={() => handleWarehouseSelect(assignment)}
                            className="w-full px-6 py-4 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-slate-100 last:border-b-0 transition-colors duration-150 flex items-center gap-3"
                          >
                            <Warehouse className="w-5 h-5 text-slate-500 flex-shrink-0" />
                            <span className="text-slate-900 font-medium truncate">{assignment.label}</span>
                          </button>
                        ))}
                        {filteredWarehouses.length > 5 && (
                          <div className="px-6 py-2 bg-slate-50 text-xs text-slate-500 text-center border-t">
                            Scroll to see more options
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="px-6 py-8 text-slate-500 text-center">
                        <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p>No warehouses found matching "{warehouseSearchTerm}"</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Warehouse Display */}
            {selectedWarehouse && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-800 font-medium">Selected Warehouse:</span>
                  <span className="text-blue-900 font-semibold">
                    {droneAssignments.find((a) => a.value === selectedWarehouse)?.label || selectedWarehouse}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Warehouse Details */}
        {warehouseDetails && (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden w-full">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-4 w-full">
              <div className="flex items-center gap-3">
                <MapPin className="w-6 h-6 text-white" />
                <h2 className="text-xl font-semibold text-white">Warehouse Details</h2>
              </div>
            </div>
            <div className="p-8 w-full">
              <div className="grid md:grid-cols-2 gap-8 mb-8 w-full">
                <div className="space-y-4 w-full">
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-5 h-5 text-slate-600" />
                    <span className="font-medium text-slate-700">Warehouse Name:</span>
                    <span className="text-slate-900">{warehouseDetails.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-slate-600" />
                    <span className="font-medium text-slate-700">Location:</span>
                    <span className="text-slate-900">
                      {warehouseDetails.latitude}, {warehouseDetails.longitude}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6 w-full">
                <div className="flex items-center gap-2 mb-4">
                  <FontAwesomeIcon icon={faPlane} />
                  <h3 className="text-lg font-semibold text-slate-800">Available Drones</h3>
                </div>
                {warehouseDetails.drones && warehouseDetails.drones.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-slate-200 w-full">
                    <div className={warehouseDetails.drones.length > 10 ? "max-h-96 overflow-y-auto" : ""}>
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50 sticky top-0">
                          <tr>
                            <th className="px-8 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Drone ID
                            </th>
                            <th className="px-8 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Drone Name
                            </th>
                            <th className="px-8 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {warehouseDetails.drones.map((drone, index) => (
                            <tr key={index} className="hover:bg-slate-50 transition-colors">
                              <td className="px-8 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                {drone.drone_id}
                              </td>
                              <td className="px-8 py-4 whitespace-nowrap text-sm text-slate-700">{drone.drone_name}</td>
                              <td className="px-8 py-4 whitespace-nowrap text-sm">{getStatusBadge(drone.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 w-full">
                    <Drone className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No drones assigned to this warehouse.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Packages Button */}
        {warehouseDetails && (
          <div className="flex justify-end w-full">
            <button
              onClick={() => navigate("/packages", { state: { warehouseName: warehouseDetails?.name } })}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg hover:from-blue-800 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg text-lg"
            >
              <Edit className="w-6 h-6" />
              Edit Packages
            </button>
          </div>
        )}

        {/* Available Packages */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden w-full">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-4 w-full">
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-white" />
              <h2 className="text-xl font-semibold text-white">Available Packages</h2>
            </div>
          </div>
          <div className="p-8 w-full">
            {/* Search and Filter Controls */}
            <div className="mb-6 space-y-6">
              {/* General Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search across all package fields..."
                  value={packageSearchTerm}
                  onChange={(e) => setPackageSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Column-specific Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Package ID Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Package ID</label>
                  <input
                    type="text"
                    placeholder="Filter by Package ID"
                    value={packageIdFilter}
                    onChange={(e) => setPackageIdFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                {/* Item Details Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Item Details</label>
                  <input
                    type="text"
                    placeholder="Filter by Item Details"
                    value={itemDetailsFilter}
                    onChange={(e) => setItemDetailsFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setPackageSearchTerm("")
                      setPackageIdFilter("")
                      setItemDetailsFilter("")
                    }}
                    className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>

              {/* Results Count */}
              <div className="text-sm text-slate-600">
                Showing {filteredPackages.length} of {availablePackages.length} packages
              </div>
            </div>

            {filteredPackages.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-slate-200 w-full">
                <div className={filteredPackages.length > 10 ? "max-h-96 overflow-y-auto" : ""}>
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-8 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Package ID
                        </th>
                        <th className="px-8 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Item Details
                        </th>
                        <th className="px-8 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          More Info
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {filteredPackages.map((pkg, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {pkg.package_id}
                          </td>
                          <td className="px-8 py-4 whitespace-nowrap text-sm text-slate-700">
                            {pkg.item_details || "--"}
                          </td>
                          <td className="px-8 py-4">
                            <button
                              className="text-blue-600 hover:underline text-sm"
                              onClick={() => handleViewClick(pkg)}
                            >
                              <FontAwesomeIcon icon={faEye} />
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : availablePackages.length > 0 ? (
              <div className="text-center py-8 text-slate-500 w-full">
                <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No packages match your search criteria.</p>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 w-full">
                <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No packages available for this warehouse.</p>
              </div>
            )}
          </div>
        </div>

        {showPackageModal && selectedPackage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-violet-600 to-violet-800 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <h3 className="text-xl font-semibold text-white">Package Details</h3>
                <button
                  onClick={() => setShowPackageModal(false)}
                  className="text-white hover:text-blue-200 focus:outline-none"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg text-slate-800 border-b pb-2">Basic Information</h4>
                    <DetailRow label="Package ID" value={selectedPackage.package_id} />
                    <DetailRow label="Tracking Code" value={selectedPackage.tracking_code} />
                    <DetailRow label="Sender ID" value={selectedPackage.sender_id} />
                    <DetailRow label="Customer ID" value={selectedPackage.customer_id} />
                    <DetailRow label="Warehouse" value={selectedPackage.warehouse_name} />
                    <DetailRow label="Item Details" value={selectedPackage.item_details} />
                    <DetailRow label="Weight (kg)" value={selectedPackage.weight_kg} />
                  </div>

                  {/* Status Info */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg text-slate-800 border-b pb-2">Status Information</h4>
                    <DetailRow label="Current Status" value={getStatusBadge(selectedPackage.current_status)} />
                    <DetailRow label="Assigned Drone" value={selectedPackage.assigned_drone_id} />
                    <DetailRow label="Dispatch Time" value={formatDateTime(selectedPackage.dispatch_time)} />
                    <DetailRow
                      label="Estimated Arrival"
                      value={formatDateTime(selectedPackage.estimated_arrival_time)}
                    />
                    <DetailRow label="Delivery Time" value={formatDateTime(selectedPackage.delivery_time)} />
                    <DetailRow label="Last Update" value={formatDateTime(selectedPackage.last_update_time)} />
                  </div>

                  {/* Location Info */}
                  <div className="space-y-4 md:col-span-2">
                    <h4 className="font-medium text-lg text-slate-800 border-b pb-2">Location Information</h4>
                    <DetailRow label="Destination Address" value={selectedPackage.destination_address} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DetailRow
                        label="Destination Coordinates"
                        value={`${selectedPackage.destination_lat}, ${selectedPackage.destination_lng}`}
                      />
                      <DetailRow
                        label="Last Known Location"
                        value={
                          selectedPackage.last_known_lat && selectedPackage.last_known_lng
                            ? `${selectedPackage.last_known_lat}, ${selectedPackage.last_known_lng}`
                            : "Unknown"
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t flex justify-end"></div>
            </div>
          </div>
        )}

        {/* Ongoing Delivery Missions */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden w-full">
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-8 py-4 w-full">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-white" />
              <h2 className="text-xl font-semibold text-white">Ongoing Delivery Missions</h2>
            </div>
          </div>
          <div className="p-8 w-full">
            {/* Search and Filter Controls */}
            <div className="mb-6 space-y-6">
              {/* General Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search across all mission fields..."
                  value={missionSearchTerm}
                  onChange={(e) => setMissionSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Column-specific Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Package ID Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Package ID</label>
                  <input
                    type="text"
                    placeholder="Filter by Package ID"
                    value={missionPackageIdFilter}
                    onChange={(e) => setMissionPackageIdFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {/* Drone ID Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Drone ID</label>
                  <input
                    type="text"
                    placeholder="Filter by Drone ID"
                    value={missionDroneIdFilter}
                    onChange={(e) => setMissionDroneIdFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {/* Destination Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Destination</label>
                  <input
                    type="text"
                    placeholder="Filter by Destination"
                    value={missionDestinationFilter}
                    onChange={(e) => setMissionDestinationFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {/* Current Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Current Status</label>
                  <div className="relative">
                    <select
                      value={missionStatusFilter}
                      onChange={(e) => setMissionStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white"
                    >
                      <option value="all">All Statuses</option>
                       <option value="Pending">Pending</option>
                                <option value="Dispatched">Dispatched</option>
                                <option value="In Transit">In Transit</option>
                                <option value="Out for Delivery">Out for Delivery</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Failed">Failed</option>
                                <option value="Delayed">Delayed</option>
                                <option value="Returned">Returned</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setMissionSearchTerm("")
                      setMissionPackageIdFilter("")
                      setMissionDroneIdFilter("")
                      setMissionDestinationFilter("")
                      setMissionStatusFilter("all")
                    }}
                    className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>

              {/* Results Count */}
              <div className="text-sm text-slate-600">
                Showing {filteredMissions.length} of {deliveryMissions.length} missions
              </div>
            </div>

            {filteredMissions.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-slate-200 w-full">
                <div className={filteredMissions.length > 10 ? "max-h-96 overflow-y-auto" : ""}>
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-8 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Package ID
                        </th>
                        <th className="px-8 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Drone ID
                        </th>
                        <th className="px-8 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Destination
                        </th>
                        <th className="px-8 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Current Status
                        </th>
                        <th className="px-8 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Progress
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {filteredMissions.map((mission, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {mission.package_id}
                          </td>
                          <td className="px-8 py-4 whitespace-nowrap text-sm text-slate-700">{mission.drone_id}</td>
                          <td className="px-8 py-4 whitespace-nowrap text-sm text-slate-700">
                            {mission.destination}
                          </td>
                          <td className="px-8 py-4 whitespace-nowrap text-sm">{getStatusBadge(mission.status)}</td>
                          <td className="px-8 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleMonitorClick(mission)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
                            >
                              <Navigation className="w-4 h-4" />
                              Monitor
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : deliveryMissions.length > 0 ? (
              <div className="text-center py-8 text-slate-500 w-full">
                <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No missions match your search criteria.</p>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 w-full">
                <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No ongoing delivery missions at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeliveryPage;