"use client"

// src/components/DdtInfo.js
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faArrowLeft,
  faBroadcastTower,
  faBox,
  faExclamationTriangle,
  faSpinner,
  faInfoCircle,
  faMapMarkerAlt,
  faKey,
  faSignal,
  faCalendarAlt,
  faTruck,
  faUser,
  faWeight,
  faBarcode,
} from "@fortawesome/free-solid-svg-icons"

const API_URL = "http://localhost:5000" // Your Flask backend URL

const DdtInfo = () => {
  const navigate = useNavigate()
  const { ddtName } = useParams()
  const [ddtInfo, setDdtInfo] = useState(null)
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDdtInfo = async () => {
    setLoading(true)
    try {
      // Fetch DDT information
      const ddtResponse = await fetch(`${API_URL}/get_ddt_by_name/${encodeURIComponent(ddtName)}`, {
        cache: "no-store",
      })

      if (!ddtResponse.ok) {
        throw new Error(`Failed to fetch DDT information: ${ddtResponse.statusText}`)
      }

      const ddtData = await ddtResponse.json()
      console.log("[DEBUG] DDT Data:", ddtData)
      setDdtInfo(ddtData)

      // Fetch packages based on rack IDs
      const rackIds = [
        ddtData.rack_01,
        ddtData.rack_02,
        ddtData.rack_03,
        ddtData.rack_04,
        ddtData.rack_05,
        ddtData.rack_06,
      ].filter((id) => id !== null && id !== undefined && id !== "")

      console.log("[DEBUG] Rack IDs:", rackIds)

      if (rackIds.length > 0) {
        const packagesResponse = await fetch(`${API_URL}/get_packages_by_racks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rack_ids: rackIds }),
          cache: "no-store",
        })

        if (!packagesResponse.ok) {
          throw new Error(`Failed to fetch packages: ${packagesResponse.statusText}`)
        }

        const packagesData = await packagesResponse.json()
        console.log("[DEBUG] Packages Data:", packagesData)
        setPackages(packagesData)
      } else {
        setPackages([])
      }

      setError(null)
    } catch (err) {
      console.error("Error fetching DDT info:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (ddtName) {
      fetchDdtInfo()
    }
  }, [ddtName])

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return dateString
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800"
      case "in_transit":
      case "dispatched":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="w-full flex flex-col bg-slate-50 min-h-screen">
        <nav className="bg-[#171e2a] text-white px-8 py-4 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-2 text-xl font-semibold text-blue-400">
            <img src="/shadowfly.jpg" alt="ShadowFly Logo" className="h-9 w-auto" />
            <span className="text-yellow-500 text-xl sm:text-2xl">Admin</span>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-white hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-md p-2 transition-colors duration-300"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
              <span className="text-lg font-medium">Back</span>
            </button>
          </div>
        </nav>

        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <FontAwesomeIcon icon={faSpinner} spin className="text-6xl text-blue-500 mb-4" />
          <p className="text-xl text-gray-600">Loading DDT Information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full flex flex-col bg-slate-50 min-h-screen">
        <nav className="bg-[#171e2a] text-white px-8 py-4 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-2 text-xl font-semibold text-blue-400">
            <img src="/shadowfly.jpg" alt="ShadowFly Logo" className="h-9 w-auto" />
            <span className="text-yellow-500 text-xl sm:text-2xl">Admin</span>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-white hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-md p-2 transition-colors duration-300"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
              <span className="text-lg font-medium">Back</span>
            </button>
          </div>
        </nav>

        <div className="flex-1 flex flex-col items-center justify-center py-20 bg-red-50 rounded-lg mx-6 mt-6">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-6xl text-red-500 mb-4" />
          <p className="text-xl text-red-700 mb-4">Error loading DDT information: {error}</p>
          <div className="flex gap-4">
            <button
              onClick={fetchDdtInfo}
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
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col bg-slate-50 min-h-screen">
      <nav className="bg-[#171e2a] text-white px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2 text-xl font-semibold text-blue-400">
          <img src="/shadowfly.jpg" alt="ShadowFly Logo" className="h-9 w-auto" />
          <span className="text-yellow-500 text-xl sm:text-2xl">Admin</span>
        </div>
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-md p-2 transition-colors duration-300"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
            <span className="text-lg font-medium">Back</span>
          </button>
        </div>
      </nav>

      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
              <FontAwesomeIcon icon={faBroadcastTower} className="text-blue-600" />
              DDT Information: {ddtName}
            </h1>
          </div>

          {/* DDT Information Section */}
          <div className="bg-white rounded-lg shadow-md border mb-8">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FontAwesomeIcon icon={faInfoCircle} className="text-blue-600" />
                DDT Details
              </h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FontAwesomeIcon icon={faBroadcastTower} className="text-blue-500" />
                    <span className="font-semibold text-gray-700">Name</span>
                  </div>
                  <p className="text-lg text-gray-900">{ddtInfo?.name || "N/A"}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-green-500" />
                    <span className="font-semibold text-gray-700">Latitude</span>
                  </div>
                  <p className="text-lg text-gray-900">{ddtInfo?.latitude?.toFixed(6) || "N/A"}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-green-500" />
                    <span className="font-semibold text-gray-700">Longitude</span>
                  </div>
                  <p className="text-lg text-gray-900">{ddtInfo?.longitude?.toFixed(6) || "N/A"}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FontAwesomeIcon icon={faSignal} className="text-purple-500" />
                    <span className="font-semibold text-gray-700">Status</span>
                  </div>
                  <span
                    className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      ddtInfo?.status?.toLowerCase() === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {ddtInfo?.status || "N/A"}
                  </span>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FontAwesomeIcon icon={faKey} className="text-orange-500" />
                    <span className="font-semibold text-gray-700">Control Key</span>
                  </div>
                  <p className="text-lg text-gray-900">{ddtInfo?.control_key || "N/A"}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FontAwesomeIcon icon={faBox} className="text-indigo-500" />
                    <span className="font-semibold text-gray-700">Total Racks</span>
                  </div>
                  <p className="text-lg text-gray-900">{ddtInfo?.total_racks || "N/A"}</p>
                </div>
              </div>

              {/* Rack Information */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Rack Configuration</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((rackNum) => {
                    const rackKey = `rack_0${rackNum}`
                    const rackValue = ddtInfo?.[rackKey]
                    return (
                      <div key={rackNum} className="bg-gray-50 p-3 rounded-lg text-center">
                        <div className="font-semibold text-gray-700 mb-1">Rack {rackNum}</div>
                        <div className={`text-sm ${rackValue ? "text-green-600" : "text-gray-400"}`}>
                          {rackValue || "Empty"}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Received Packages Section */}
          <div className="bg-white rounded-lg shadow-md border">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FontAwesomeIcon icon={faBox} className="text-green-600" />
                Received Packages ({packages.length})
              </h2>
            </div>

            {packages.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Package ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tracking Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Weight (kg)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Warehouse
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dispatch Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {packages.map((pkg, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faBarcode} className="text-gray-400" />
                            {pkg.package_id}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{pkg.tracking_code || "N/A"}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                            {pkg.customer_id || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(pkg.current_status)}`}
                          >
                            {pkg.current_status || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faWeight} className="text-gray-400" />
                            {pkg.weight_kg || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faTruck} className="text-gray-400" />
                            {pkg.warehouse_name || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
                            {formatDate(pkg.dispatch_time)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{pkg.item_details || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <FontAwesomeIcon icon={faBox} className="text-4xl text-gray-300 mb-4" />
                <p className="text-lg">No packages found for this DDT</p>
                <p className="text-sm">Packages will appear here when they are assigned to the DDT's racks.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DdtInfo
