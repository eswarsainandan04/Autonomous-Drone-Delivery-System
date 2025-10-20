"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { MapContainer, TileLayer, Marker, Popup, Polyline, LayersControl } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { MapPin, Navigation, Package, Truck, Clock, Activity, MapIcon, CheckCircle, AlertCircle } from "lucide-react"
import { faArrowLeft, faPlane } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

// Custom icons
const warehouseIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const destinationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const droneIcon = new L.Icon({
  iconUrl: "/droneicon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [45, 61],
  iconAnchor: [32, 61],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const Monitor = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [packageData, setPackageData] = useState(null)
  const [warehouseCoords, setWarehouseCoords] = useState(null)
  const [destinationName, setDestinationName] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedWarehouseData, setSelectedWarehouseData] = useState(null)

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Get package data from navigation state
        const passedData = location.state?.packageData
        const passedWarehouseData = location.state?.selectedWarehouseData

        if (!passedData || !passedData.package_id) {
          setError("No package data provided")
          setLoading(false)
          return
        }

        if (passedWarehouseData) {
          setSelectedWarehouseData(passedWarehouseData)
        }

        // Fetch complete package data from API
        const response = await fetch(`http://localhost:5042/api/package_monitor/${passedData.package_id}`)
        if (!response.ok) throw new Error("Failed to fetch package data")

        const completeData = await response.json()
        setPackageData(completeData)

        // Set warehouse coordinates from drone source location
        if (completeData.source_lat && completeData.source_lng) {
          setWarehouseCoords([completeData.source_lat, completeData.source_lng])
        }

        // Set destination name
        if (completeData.destination_name) {
          setDestinationName(completeData.destination_name)
        }

        setLoading(false)
      } catch (err) {
        console.error("Error initializing monitor data:", err)
        setError(err.message)
        setLoading(false)
      }
    }

    initializeData()
  }, [location.state])

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "Not available"
    try {
      const date = new Date(dateTimeString)
      return date.toLocaleString()
    } catch {
      return dateTimeString
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-orange-100 text-orange-800 border-orange-200", icon: Clock },
      dispatched: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Truck },
      in_transit: { color: "bg-purple-100 text-purple-800 border-purple-200", icon: Activity },
      out_for_delivery: { color: "bg-indigo-100 text-indigo-800 border-indigo-200", icon: Navigation },
      delivered: { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
      failed: { color: "bg-red-100 text-red-800 border-red-200", icon: AlertCircle },
    }

    const config = statusConfig[status?.toLowerCase()] || statusConfig["pending"]
    const IconComponent = config.icon

    return (
      <span
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}
      >
        <IconComponent className="w-4 h-4" />
        {status}
      </span>
    )
  }

  const DetailCard = ({ title, children, icon: Icon }) => (
    <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-white" />
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  )

  const DetailRow = ({ label, value, className = "" }) => (
    <div className={`flex justify-between items-start ${className}`}>
      <span className="text-sm font-medium text-slate-600 flex-shrink-0 w-1/3">{label}:</span>
      <span className="text-sm text-slate-900 text-right flex-1 ml-2">
        {value || <span className="text-slate-400">Not available</span>}
      </span>
    </div>
  )

  // Distance calculation using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return "N/A"

    const R = 6371 // Radius of the Earth in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    return distance < 1 ? `${(distance * 1000).toFixed(0)} m` : `${distance.toFixed(2)} km`
  }

  // Calculate remaining distance from current position to destination
  const calculateRemainingDistance = (currentLat, currentLon, destLat, destLon) => {
    if (!currentLat || !currentLon) return "Unknown"
    return calculateDistance(currentLat, currentLon, destLat, destLon)
  }

  // Calculate estimated time to delivery
  const calculateEstimatedTime = (currentLat, currentLon, destLat, destLon, status) => {
    if (!currentLat || !currentLon || status?.toLowerCase() === "delivered") return "N/A"

    const distance = Number.parseFloat(calculateDistance(currentLat, currentLon, destLat, destLon))
    if (isNaN(distance)) return "Unknown"

    const avgSpeed = 45 // km/h average drone speed
    const timeInHours = distance / avgSpeed

    if (timeInHours < 1) {
      return `${Math.round(timeInHours * 60)} min`
    } else {
      const hours = Math.floor(timeInHours)
      const minutes = Math.round((timeInHours - hours) * 60)
      return `${hours}h ${minutes}m`
    }
  }

  // Calculate delivery progress percentage
  const calculateProgress = (warehouseLat, warehouseLon, currentLat, currentLon, destLat, destLon) => {
    if (!warehouseLat || !warehouseLon || !currentLat || !currentLon) return "0%"

    const totalDistance = Number.parseFloat(calculateDistance(warehouseLat, warehouseLon, destLat, destLon))
    const remainingDistance = Number.parseFloat(calculateDistance(currentLat, currentLon, destLat, destLon))

    if (isNaN(totalDistance) || isNaN(remainingDistance)) return "0%"

    const progress = ((totalDistance - remainingDistance) / totalDistance) * 100
    return `${Math.max(0, Math.min(100, progress)).toFixed(1)}%`
  }

  // Calculate average speed
  const calculateAverageSpeed = (dispatchTime, lastUpdate, warehouseCoords, currentLat, currentLon) => {
    if (!dispatchTime || !lastUpdate || !warehouseCoords || !currentLat || !currentLon) return "N/A"

    try {
      const startTime = new Date(dispatchTime)
      const endTime = new Date(lastUpdate)
      const timeDiffHours = (endTime - startTime) / (1000 * 60 * 60)

      if (timeDiffHours <= 0) return "N/A"

      const distanceTraveled = Number.parseFloat(
        calculateDistance(warehouseCoords[0], warehouseCoords[1], currentLat, currentLon),
      )
      if (isNaN(distanceTraveled)) return "N/A"

      const speed = distanceTraveled / timeDiffHours
      return `${speed.toFixed(1)} km/h`
    } catch {
      return "N/A"
    }
  }

  // Calculate flight duration
  const calculateFlightDuration = (dispatchTime, lastUpdate) => {
    if (!dispatchTime || !lastUpdate) return "N/A"

    try {
      const startTime = new Date(dispatchTime)
      const endTime = new Date(lastUpdate)
      const timeDiffMinutes = (endTime - startTime) / (1000 * 60)

      if (timeDiffMinutes < 60) {
        return `${Math.round(timeDiffMinutes)} min`
      } else {
        const hours = Math.floor(timeDiffMinutes / 60)
        const minutes = Math.round(timeDiffMinutes % 60)
        return `${hours}h ${minutes}m`
      }
    } catch {
      return "N/A"
    }
  }

  // Get delivery status text
  const getDeliveryStatusText = (status) => {
    const statusMap = {
      pending: "Awaiting Dispatch",
      dispatched: "In Flight",
      in_transit: "En Route",
      out_for_delivery: "Final Approach",
      delivered: "Completed",
      failed: "Delivery Failed",
    }

    return statusMap[status?.toLowerCase()] || "Unknown"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading package monitor data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Data</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!packageData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">No package data available</p>
        </div>
      </div>
    )
  }

  // Calculate map center and bounds
  const mapCenter = warehouseCoords || [packageData.destination_lat, packageData.destination_lng]
  const routeCoordinates = []

  if (warehouseCoords && packageData.destination_lat && packageData.destination_lng) {
    routeCoordinates.push(warehouseCoords)
    routeCoordinates.push([packageData.destination_lat, packageData.destination_lng])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation Header */}
      <nav className="bg-[#171e2a] text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/shadowfly.jpg" alt="ShadowFly Logo" className="h-8 w-auto" />
            <div>
              <h1 className="text-xl font-bold text-blue-400">Package Monitor</h1>
              <p className="text-sm text-slate-300">Real-time delivery tracking</p>
            </div>
          </div>
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

      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Package Info Header */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Package {packageData.package_id}</h2>
                <p className="text-slate-600">Tracking Code: {packageData.tracking_code}</p>
              </div>
            </div>
            {getStatusBadge(packageData.current_status)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span className="text-slate-600">From:</span>
              <span className="font-medium">{packageData.warehouse_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-slate-500" />
              <span className="text-slate-600">To:</span>
              <span className="font-medium">{destinationName || "Delivery Location"}</span>
            </div>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faPlane} />
              <span className="text-slate-600">Drone:</span>
              <span className="font-medium">{packageData.assigned_drone_id}</span>
            </div>
          </div>
        </div>

        {/* Interactive Map */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <MapIcon className="w-6 h-6 text-white" />
              <h3 className="text-xl font-semibold text-white">Live Tracking Map</h3>
            </div>
          </div>

          <div className="relative h-[600px]">
            <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }} className="z-0">
              <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="Default Map">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name="Satellite View">
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                  />
                </LayersControl.BaseLayer>
              </LayersControl>

              {/* Warehouse/Source Marker */}
              {warehouseCoords && (
                <Marker position={warehouseCoords} icon={warehouseIcon}>
                  <Popup>
                    <div className="text-center">
                      <strong>Source Location</strong>
                      <br />
                      {packageData.warehouse_name}
                      <br />
                      <small>
                        {warehouseCoords[0]}, {warehouseCoords[1]}
                      </small>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Destination Marker */}
              {packageData.destination_lat && packageData.destination_lng && (
                <Marker position={[packageData.destination_lat, packageData.destination_lng]} icon={destinationIcon}>
                  <Popup>
                    <div className="text-center">
                      <strong>Destination</strong>
                      <br />
                      {destinationName || "Delivery Location"}
                      <br />
                      <small>
                        {packageData.destination_lat}, {packageData.destination_lng}
                      </small>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Drone Current Position Marker */}
              {packageData.last_known_lat && packageData.last_known_lng && (
                <Marker position={[packageData.last_known_lat, packageData.last_known_lng]} icon={droneIcon}>
                  <Popup>
                    <div className="text-center">
                      <strong>Drone Position</strong>
                      <br />
                      {packageData.assigned_drone_id}
                      <br />
                      <small>
                        {packageData.last_known_lat}, {packageData.last_known_lng}
                      </small>
                      <br />
                      <small>Last Update: {formatDateTime(packageData.last_update_time)}</small>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Route Line */}
              {routeCoordinates.length === 2 && (
                <Polyline positions={routeCoordinates} color="blue" weight={3} opacity={0.7} dashArray="10, 10" />
              )}
            </MapContainer>
          </div>
        </div>

        {/* Package Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Basic Information */}
          <DetailCard title="Basic Information" icon={Package}>
            <DetailRow label="Package ID" value={packageData.package_id} />
            <DetailRow label="Tracking Code" value={packageData.tracking_code} />
            <DetailRow label="Sender ID" value={packageData.sender_id} />
            <DetailRow label="Customer ID" value={packageData.customer_id} />
            <DetailRow label="Item Details" value={packageData.item_details} />
            <DetailRow label="Weight (kg)" value={packageData.weight_kg} />
          </DetailCard>

          {/* Location Information */}
          <DetailCard title="Location Information" icon={MapPin}>
            <DetailRow label="Warehouse" value={packageData.warehouse_name} />
            <DetailRow
              label="Source Coords"
              value={warehouseCoords ? `${warehouseCoords[0]}, ${warehouseCoords[1]}` : "Not available"}
            />
            <DetailRow label="Destination" value={packageData.destination_address} />
            <DetailRow
              label="Destination Coords"
              value={`${packageData.destination_lat}, ${packageData.destination_lng}`}
            />
            <DetailRow
              label="Last Known Position"
              value={
                packageData.last_known_lat && packageData.last_known_lng
                  ? `${packageData.last_known_lat}, ${packageData.last_known_lng}`
                  : "Not available"
              }
            />
          </DetailCard>

          {/* Status & Timing */}
          <DetailCard title="Status & Timing" icon={Clock}>
            <DetailRow label="Current Status" value={getStatusBadge(packageData.current_status)} />
            <DetailRow label="Assigned Drone" value={packageData.assigned_drone_id} />
            <DetailRow label="Dispatch Time" value={formatDateTime(packageData.dispatch_time)} />
            <DetailRow label="Est. Arrival" value={formatDateTime(packageData.estimated_arrival_time)} />
            <DetailRow label="Delivery Time" value={formatDateTime(packageData.delivery_time)} />
            <DetailRow label="Last Update" value={formatDateTime(packageData.last_update_time)} />
          </DetailCard>
        </div>

        {/* Calculated Metrics */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-white" />
              <h3 className="text-xl font-semibold text-white">Delivery Metrics</h3>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Distance Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="w-6 h-6 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Total Distance</h4>
                </div>
                <p className="text-2xl font-bold text-blue-800">
                  {calculateDistance(
                    warehouseCoords?.[0],
                    warehouseCoords?.[1],
                    packageData.destination_lat,
                    packageData.destination_lng,
                  )}
                </p>
                <p className="text-sm text-blue-600">Source to Destination</p>
              </div>

              {/* Remaining Distance Card */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center gap-3 mb-2">
                  <Navigation className="w-6 h-6 text-orange-600" />
                  <h4 className="font-semibold text-orange-900">Remaining Distance</h4>
                </div>
                <p className="text-2xl font-bold text-orange-800">
                  {calculateRemainingDistance(
                    packageData.last_known_lat,
                    packageData.last_known_lng,
                    packageData.destination_lat,
                    packageData.destination_lng,
                  )}
                </p>
                <p className="text-sm text-orange-600">From Current Position</p>
              </div>

              {/* Estimated Time Card */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-6 h-6 text-purple-600" />
                  <h4 className="font-semibold text-purple-900">Est. Time to Delivery</h4>
                </div>
                <p className="text-2xl font-bold text-purple-800">
                  {calculateEstimatedTime(
                    packageData.last_known_lat,
                    packageData.last_known_lng,
                    packageData.destination_lat,
                    packageData.destination_lng,
                    packageData.current_status,
                  )}
                </p>
                <p className="text-sm text-purple-600">Based on current position</p>
              </div>

              {/* Progress Card */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h4 className="font-semibold text-green-900">Delivery Progress</h4>
                </div>
                <p className="text-2xl font-bold text-green-800">
                  {calculateProgress(
                    warehouseCoords?.[0],
                    warehouseCoords?.[1],
                    packageData.last_known_lat,
                    packageData.last_known_lng,
                    packageData.destination_lat,
                    packageData.destination_lng,
                  )}
                </p>
                <p className="text-sm text-green-600">Journey Completed</p>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h5 className="font-medium text-slate-700 mb-2">Average Speed</h5>
                <p className="text-lg font-semibold text-slate-900">
                  {calculateAverageSpeed(
                    packageData.dispatch_time,
                    packageData.last_update_time,
                    warehouseCoords,
                    packageData.last_known_lat,
                    packageData.last_known_lng,
                  )}
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h5 className="font-medium text-slate-700 mb-2">Flight Duration</h5>
                <p className="text-lg font-semibold text-slate-900">
                  {calculateFlightDuration(packageData.dispatch_time, packageData.last_update_time)}
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h5 className="font-medium text-slate-700 mb-2">Delivery Status</h5>
                <p className="text-lg font-semibold text-slate-900">
                  {getDeliveryStatusText(packageData.current_status)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Monitor
