"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faArrowLeft,
  faMapMarkedAlt,
  faVideo,
  faInfoCircle,
  faGamepad,
  faPlaneDeparture,
  faPause,
  faRocket,
  faPlaneArrival,
  faStop,
  faTimesCircle,
  faHome,
  faCamera,
  faRecordVinyl,
  faExpand,
  faBox,
  faBuilding,
  faLocationDot,
  faCompass,
  faMountain,
  faBatteryFull,
  faBolt,
  faGauge,
  faTachometerAlt,
  faArrowUp,
  faArrowsRotate,
  faRotate,
  faSatellite,
  faWifi,
  faCheckCircle,
  faPlane,
  faShield,
  faHeart,
  faSignal,
  faRulerVertical,
  faEye,
  faCrosshairs,
  faCompress,
  faMaximize,
} from "@fortawesome/free-solid-svg-icons"
import { MapContainer, TileLayer, Marker, Popup, Polyline, LayersControl } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

const DroneMonitoring = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const mapRef = useRef(null)

  const [droneData, setDroneData] = useState(null)
  const [selectedRackData, setSelectedRackData] = useState(null)
  const [statusDisplay, setStatusDisplay] = useState("Drone Status: Standby")
  const [loading, setLoading] = useState(true)
  const [cameraUrl, setCameraUrl] = useState("")
  const [cameraLoading, setCameraLoading] = useState(true)
  const [cameraError, setCameraError] = useState(null)
  const [mapCenter, setMapCenter] = useState([37.7749, -122.4194])
  const [mapZoom, setMapZoom] = useState(10)

  // New state for flip functionality
  const [primaryView, setPrimaryView] = useState("map") // "map" or "camera"

  // Drone parameters with N/A initial values
  const [droneParameters, setDroneParameters] = useState({
    latitude: "N/A",
    longitude: "N/A",
    altitude_rel: "N/A",
    altitude_abs: "N/A",
    battery_level: "N/A",
    battery_voltage: "N/A",
    battery_current: "N/A",
    airspeed: "N/A",
    groundspeed: "N/A",
    heading: "N/A",
    pitch: "N/A",
    roll: "N/A",
    yaw: "N/A",
    satellites_visible: "N/A",
    fix_type: "N/A",
    ekf_ok: "N/A",
    mode: "N/A",
    armed: "N/A",
    is_armable: "N/A",
    last_heartbeat: "N/A",
  })

  // Parameter icons mapping
  const parameterIcons = {
    latitude: faLocationDot,
    longitude: faLocationDot,
    altitude_rel: faMountain,
    altitude_abs: faRulerVertical,
    battery_level: faBatteryFull,
    battery_voltage: faBolt,
    battery_current: faGauge,
    airspeed: faTachometerAlt,
    groundspeed: faTachometerAlt,
    heading: faCompass,
    pitch: faArrowUp,
    roll: faArrowsRotate,
    yaw: faRotate,
    satellites_visible: faSatellite,
    fix_type: faWifi,
    ekf_ok: faCheckCircle,
    mode: faPlane,
    armed: faShield,
    is_armable: faShield,
    last_heartbeat: faHeart,
  }

  // Get parameters from URL
  const urlParams = new URLSearchParams(location.search)
  const droneId = urlParams.get("drone_id")
  const urlSelectedRack = urlParams.get("selected_rack")
  const urlDdtName = urlParams.get("ddt")

  // Custom icons
  const droneIcon = new L.Icon({
    iconUrl:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTQiIGZpbGw9IiNmZjAwMDAiLz4KPHN2ZyB4PSI2IiB5PSI2IiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPgo8cGF0aCBkPSJNMTIgMkw0LjUgMjAuMjloLjdxbDEuNjMtMy4wNWgxMS4zMmwxLjYzIDMuMDVoLjdxbDEyIDJ6bTAgMi44MUwxNi4zNyAxNkg3LjYzTDEyIDQuODF6Ii8+Cjwvc3ZnPgo8L3N2Zz4K",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  })

  const sourceIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })

  const destinationIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })

  // Flip between map and camera views
  const flipView = () => {
    setPrimaryView(primaryView === "map" ? "camera" : "map")
  }

  // Load drone parameters from communication_key URL
  const loadDroneParameters = async () => {
    try {
      console.log(`Fetching drone parameters for drone: ${droneId}`)

      const response = await fetch(`http://localhost:5095/api/drone-parameters/${droneId}`)
      const data = await response.json()

      if (data.error) {
        console.error("Error loading drone parameters:", data.error)
        return
      }

      if (data.parameters) {
        console.log("Successfully loaded drone parameters:", data.parameters)
        setDroneParameters(data.parameters)

        // Update map center if we have new coordinates
        if (data.parameters.latitude !== "N/A" && data.parameters.longitude !== "N/A") {
          const lat = parseFloat(data.parameters.latitude)
          const lng = parseFloat(data.parameters.longitude)
          if (!isNaN(lat) && !isNaN(lng)) {
            setMapCenter([lat, lng])
            setMapZoom(15)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching drone parameters:", error)
    }
  }

  // Load camera URL for the drone
  const loadCameraUrl = async () => {
    try {
      setCameraLoading(true)
      setCameraError(null)

      const response = await fetch(`http://localhost:5095/api/drone-camera/${droneId}`)
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setCameraUrl(data.camera_url)
      setCameraLoading(false)
    } catch (error) {
      console.error("Error loading camera URL:", error)
      setCameraError(error.message)
      setCameraLoading(false)
    }
  }

  // Load selected rack data from localStorage and URL parameters
  const loadSelectedRackData = () => {
    try {
      const towerData = localStorage.getItem("towerToMonitoringData")
      if (towerData) {
        setSelectedRackData(JSON.parse(towerData))
      } else {
        if (urlSelectedRack && droneId) {
          const rackData = {
            drone_id: droneId,
            selected_rack: urlSelectedRack,
            ddt_facility: urlDdtName || "Unknown",
            timestamp: new Date().toISOString(),
          }
          setSelectedRackData(rackData)
        }
      }
    } catch (error) {
      console.error("Error loading selected rack data:", error)
    }
  }

  // Load drone data
  const loadDroneData = async () => {
    try {
      const response = await fetch(`http://localhost:5095/api/drone-monitoring/${droneId}`)
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setDroneData(data)
      updateMapView(data)
      setLoading(false)
    } catch (error) {
      console.error("Error loading drone data:", error)
      setLoading(false)
    }
  }

  // Update map view based on drone data
  const updateMapView = (data) => {
    if (!data) return

    const { drone, source, destination, warehouse } = data
    const bounds = []

    // Add live drone position to bounds (prioritize real-time coordinates)
    if (droneParameters.latitude !== "N/A" && droneParameters.longitude !== "N/A") {
      const lat = parseFloat(droneParameters.latitude)
      const lng = parseFloat(droneParameters.longitude)
      if (!isNaN(lat) && !isNaN(lng)) {
        bounds.push([lat, lng])
      }
    } else if (drone.last_known_lat && drone.last_known_lng) {
      bounds.push([drone.last_known_lat, drone.last_known_lng])
    }

    // Add source position to bounds (from dronesdata table)
    if (source && source.latitude && source.longitude) {
      bounds.push([source.latitude, source.longitude])
    }

    // Add destination position to bounds (from dronesdata table)
    if (destination && destination.latitude && destination.longitude) {
      bounds.push([destination.latitude, destination.longitude])
    }

    // Add warehouse position to bounds (if exists)
    if (warehouse && warehouse.latitude && warehouse.longitude) {
      bounds.push([warehouse.latitude, warehouse.longitude])
    }

    // Update map center and zoom to fit all markers
    if (bounds.length > 0) {
      if (bounds.length === 1) {
        setMapCenter(bounds[0])
        setMapZoom(15)
      } else {
        // Calculate center of all points
        const centerLat = bounds.reduce((sum, point) => sum + point[0], 0) / bounds.length
        const centerLng = bounds.reduce((sum, point) => sum + point[1], 0) / bounds.length
        setMapCenter([centerLat, centerLng])
        setMapZoom(12)
      }
    }
  }

  // Send control command
  const sendCommand = async (command) => {
    try {
      const response = await fetch(`http://localhost:5095/api/drone-control/${droneId}/${command}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (result.status === "success") {
        setStatusDisplay(result.message)
        setTimeout(() => {
          setStatusDisplay("Drone Status: Standby")
        }, 3000)
      } else {
        throw new Error(result.error || "Command failed")
      }
    } catch (error) {
      console.error("Error sending command:", error)
      setStatusDisplay(`Error: ${error.message}`)
    }
  }

  // Go back to Tower with data transfer
  const goBack = () => {
    try {
      const returnData = {
        drone_id: droneId,
        selected_rack: selectedRackData?.selected_rack || urlSelectedRack || null,
        ddt_name: selectedRackData?.ddt_facility || urlDdtName || null,
        timestamp: new Date().toISOString(),
      }

      localStorage.setItem("monitoringReturnData", JSON.stringify(returnData))
      localStorage.removeItem("towerToMonitoringData")
      navigate("/tower")
    } catch (error) {
      console.error("Error preparing return data:", error)
      alert("Error preparing return data. Please try again.")
    }
  }

  // Get current drone position (prioritize real-time data)
  const getCurrentDronePosition = () => {
    if (droneParameters.latitude !== "N/A" && droneParameters.longitude !== "N/A") {
      const lat = parseFloat(droneParameters.latitude)
      const lng = parseFloat(droneParameters.longitude)
      if (!isNaN(lat) && !isNaN(lng)) {
        return [lat, lng]
      }
    }
    if (droneData?.drone?.last_known_lat && droneData?.drone?.last_known_lng) {
      return [droneData.drone.last_known_lat, droneData.drone.last_known_lng]
    }
    return null
  }

  // Format parameter value with units
  const formatParameterValue = (key, value) => {
    if (value === "N/A") return value

    const units = {
      latitude: "°",
      longitude: "°",
      altitude_rel: "m",
      altitude_abs: "m",
      battery_level: "%",
      battery_voltage: "V",
      battery_current: "A",
      airspeed: "m/s",
      groundspeed: "m/s",
      heading: "°",
      pitch: "°",
      roll: "°",
      yaw: "°",
      satellites_visible: "",
      fix_type: "",
      ekf_ok: "",
      mode: "",
      armed: "",
      is_armable: "",
      last_heartbeat: "s",
    }

    return `${value}${units[key] || ""}`
  }

  // Get parameter display name
  const getParameterDisplayName = (key) => {
    const names = {
      latitude: "LAT",
      longitude: "LON",
      altitude_rel: "ALT REL",
      altitude_abs: "ALT ABS",
      battery_level: "BAT %",
      battery_voltage: "BAT V",
      battery_current: "BAT A",
      airspeed: "AIRSPD",
      groundspeed: "GNDSPD",
      heading: "HDG",
      pitch: "PITCH",
      roll: "ROLL",
      yaw: "YAW",
      satellites_visible: "SATS",
      fix_type: "GPS",
      ekf_ok: "EKF",
      mode: "MODE",
      armed: "ARM",
      is_armable: "ARMABLE",
      last_heartbeat: "HB",
    }
    return names[key] || key.toUpperCase()
  }

  // Render Camera Feed Component
  const renderCameraFeed = (isSmall = false) => {
    const containerStyle = isSmall
      ? {
          width: "300px",
          height: "200px",
          position: "absolute",
          bottom: "20px",
          right: "20px",
          zIndex: 1000,
          cursor: "pointer",
          border: "2px solid #00ff00",
          borderRadius: "4px",
          overflow: "hidden",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
        }
      : {
          width: "100%",
          height: "100%",
          backgroundColor: "#000000",
          border: "1px solid #404040",
          position: "relative",
        }

    return (
      <div style={containerStyle} onClick={isSmall ? flipView : undefined}>
        <div
          style={{
            position: "absolute",
            top: "8px",
            left: "8px",
            background: "rgba(0, 0, 0, 0.8)",
            color: "#00ff00",
            padding: "0.25rem 0.5rem",
            borderRadius: "3px",
            fontSize: isSmall ? "0.6rem" : "0.7rem",
            fontWeight: "700",
            zIndex: 1001,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <FontAwesomeIcon icon={faEye} />
          {isSmall ? "CAM" : `CAMERA FEED - DRONE ${droneId}`}
          {!cameraLoading && !cameraError && (
            <div
              style={{
                width: "6px",
                height: "6px",
                backgroundColor: "#ff0000",
                borderRadius: "50%",
                animation: "pulse 2s infinite",
              }}
            ></div>
          )}
        </div>

        {cameraLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              flexDirection: "column",
              gap: "1rem",
              color: "#00ff00",
            }}
          >
            <div
              style={{
                width: isSmall ? "20px" : "32px",
                height: isSmall ? "20px" : "32px",
                border: "2px solid #404040",
                borderTop: "2px solid #00ff00",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            ></div>
            <p style={{ fontSize: isSmall ? "0.6rem" : "0.8rem" }}>
              {isSmall ? "LOADING..." : "LOADING CAMERA FEED..."}
            </p>
          </div>
        ) : cameraError ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              flexDirection: "column",
              gap: "1rem",
              color: "#ff4444",
            }}
          >
            <FontAwesomeIcon icon={faVideo} size={isSmall ? "lg" : "2x"} />
            <p style={{ fontSize: isSmall ? "0.6rem" : "0.8rem" }}>
              {isSmall ? "CAM ERROR" : "CAMERA FEED UNAVAILABLE"}
            </p>
            {!isSmall && <p style={{ fontSize: "0.7rem", color: "#cccccc" }}>{cameraError}</p>}
          </div>
        ) : cameraUrl ? (
          <>
            <iframe
              src={cameraUrl}
              allow="camera; microphone; autoplay;"
              title={`Live Drone Camera Feed - ${droneId}`}
              style={{ width: "100%", height: "100%", border: "none" }}
            />

            {/* Camera Controls - only show on main view */}
            {!isSmall && (
              <div
                style={{
                  position: "absolute",
                  bottom: "8px",
                  right: "8px",
                  display: "flex",
                  gap: "0.5rem",
                }}
              >
                <button
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    color: "#ffffff",
                    border: "1px solid #606060",
                    padding: "0.5rem",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "0.7rem",
                  }}
                >
                  <FontAwesomeIcon icon={faCamera} />
                </button>
                <button
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    color: "#ffffff",
                    border: "1px solid #606060",
                    padding: "0.5rem",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "0.7rem",
                  }}
                >
                  <FontAwesomeIcon icon={faRecordVinyl} />
                </button>
                <button
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    color: "#ffffff",
                    border: "1px solid #606060",
                    padding: "0.5rem",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "0.7rem",
                  }}
                >
                  <FontAwesomeIcon icon={faExpand} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              flexDirection: "column",
              gap: "1rem",
              color: "#ff4444",
            }}
          >
            <FontAwesomeIcon icon={faVideo} size={isSmall ? "lg" : "2x"} />
            <p style={{ fontSize: isSmall ? "0.6rem" : "0.8rem" }}>{isSmall ? "NO CAM" : "NO CAMERA URL AVAILABLE"}</p>
          </div>
        )}
      </div>
    )
  }

  // Render Map Component
  const renderMap = (isSmall = false) => {
    const containerStyle = isSmall
      ? {
          width: "300px",
          height: "200px",
          position: "absolute",
          bottom: "20px",
          right: "20px",
          zIndex: 1000,
          cursor: "pointer",
          border: "2px solid #00ff00",
          borderRadius: "4px",
          overflow: "hidden",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
        }
      : {
          width: "100%",
          height: "100%",
          position: "relative",
          border: "1px solid #404040",
        }

    return (
      <div style={containerStyle} onClick={isSmall ? flipView : undefined}>
        <div
          style={{
            position: "absolute",
            top: "8px",
            left: "8px",
            background: "rgba(0, 0, 0, 0.8)",
            color: "#00ff00",
            padding: "0.25rem 0.5rem",
            borderRadius: "3px",
            fontSize: isSmall ? "0.6rem" : "0.7rem",
            fontWeight: "700",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <FontAwesomeIcon icon={faMapMarkedAlt} />
          {isSmall ? "MAP" : `MISSION MAP - DRONE ${droneId}`}
        </div>

        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
          key={isSmall ? "small-map" : "main-map"}
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer name="Satellite" checked>
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="© Esri, Maxar, Earthstar Geographics"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Street Map">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="© OpenStreetMap contributors"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Terrain">
              <TileLayer
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                attribution="© OpenTopoMap contributors"
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* Live Drone Marker */}
          {currentDronePos && (
            <Marker position={currentDronePos} icon={droneIcon}>
              <Popup>
                <div style={{ minWidth: "200px", color: "#000000" }}>
                  <b>🚁 DRONE {droneData?.drone?.drone_id}</b>
                  <br />
                  <span style={{ color: "#00aa00", fontWeight: "600" }}>● LIVE POSITION</span>
                  <br />
                  <br />
                  <strong>COORDINATES:</strong>
                  <br />
                  LAT: {currentDronePos[0].toFixed(6)}°
                  <br />
                  LON: {currentDronePos[1].toFixed(6)}°
                  <br />
                  <br />
                  <strong>TELEMETRY:</strong>
                  <br />
                  ALT: {droneParameters.altitude_rel !== "N/A" ? `${droneParameters.altitude_rel}m` : "N/A"}
                  <br />
                  BAT: {droneParameters.battery_level !== "N/A" ? `${droneParameters.battery_level}%` : "N/A"}
                  <br />
                  SPD: {droneParameters.groundspeed !== "N/A" ? `${droneParameters.groundspeed} m/s` : "N/A"}
                  <br />
                  HDG: {droneParameters.heading !== "N/A" ? `${droneParameters.heading}°` : "N/A"}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Source Marker (from dronesdata table) */}
          {droneData?.source?.latitude && droneData?.source?.longitude && (
            <Marker position={[droneData.source.latitude, droneData.source.longitude]} icon={sourceIcon}>
              <Popup>
                <div style={{ color: "#000000" }}>
                  <b>🏁 SOURCE POINT</b>
                  <br />
                  LAT: {droneData.source.latitude.toFixed(6)}°
                  <br />
                  LON: {droneData.source.longitude.toFixed(6)}°
                  <br />
                  <small>From dronesdata table</small>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Destination Marker (from dronesdata table) */}
          {droneData?.destination?.latitude && droneData?.destination?.longitude && (
            <Marker
              position={[droneData.destination.latitude, droneData.destination.longitude]}
              icon={destinationIcon}
            >
              <Popup>
                <div style={{ color: "#000000" }}>
                  <b>🎯 DESTINATION POINT</b>
                  <br />
                  LAT: {droneData.destination.latitude.toFixed(6)}°
                  <br />
                  LON: {droneData.destination.longitude.toFixed(6)}°
                  <br />
                  <small>From dronesdata table</small>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Route Line (planned path from source to destination) */}
          {routePoints.length === 2 && (
            <Polyline
              positions={routePoints}
              pathOptions={{
                color: "#ffff00",
                weight: 3,
                opacity: 0.8,
                dashArray: "10, 10",
              }}
            />
          )}

          {/* Current Drone Path (Live) */}
          {currentPath.length === 2 && (
            <Polyline
              positions={currentPath}
              pathOptions={{
                color: "#00ff00",
                weight: 4,
                opacity: 0.9,
              }}
            />
          )}
        </MapContainer>
      </div>
    )
  }

  useEffect(() => {
    loadSelectedRackData()
    loadDroneData()
    loadCameraUrl()
    loadDroneParameters()

    const interval = setInterval(() => {
      loadDroneData()
      loadDroneParameters()
    }, 2000)

    return () => clearInterval(interval)
  }, [droneId])

  if (loading) {
    return (
      <div
        style={{
          fontFamily: "'Roboto Mono', 'Courier New', monospace",
          backgroundColor: "#1a1a1a",
          minHeight: "100vh",
          color: "#ffffff",
        }}
      >
        <nav
          style={{
            backgroundColor: "#2d2d2d",
            color: "#ffffff",
            padding: "0.75rem 1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "2px solid #404040",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              fontSize: "1.1rem",
              fontWeight: "700",
              color: "#00ff00",
            }}
          >
            <FontAwesomeIcon icon={faCrosshairs} />
            QGroundControl - ShadowFly
          </div>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#ffffff",
              background: "#404040",
              border: "1px solid #606060",
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: "500",
            }}
            onClick={goBack}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>BACK</span>
          </button>
        </nav>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "calc(100vh - 80px)",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              border: "2px solid #404040",
              borderTop: "2px solid #00ff00",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          ></div>
          <p style={{ color: "#00ff00", fontFamily: "'Roboto Mono', monospace" }}>LOADING DRONE MONITORING DATA...</p>
        </div>
      </div>
    )
  }

  // Prepare route points for polylines
  const routePoints = []
  const currentPath = []
  const currentDronePos = getCurrentDronePosition()

  // Route from source to destination (from dronesdata table)
  if (droneData?.source?.latitude && droneData?.source?.longitude) {
    routePoints.push([droneData.source.latitude, droneData.source.longitude])
  }
  if (droneData?.destination?.latitude && droneData?.destination?.longitude) {
    routePoints.push([droneData.destination.latitude, droneData.destination.longitude])
  }

  // Current drone path from source to current position
  if (currentDronePos && droneData?.source?.latitude && droneData?.source?.longitude) {
    currentPath.push([droneData.source.latitude, droneData.source.longitude])
    currentPath.push(currentDronePos)
  }

  // Split parameters for top and bottom display
  const topParameters = ["latitude", "longitude", "altitude_rel", "altitude_abs", "heading", "airspeed", "groundspeed"]
  const bottomParameters = [
    "battery_level",
    "battery_voltage",
    "satellites_visible",
    "mode",
    "armed",
    "pitch",
    "roll",
    "yaw",
  ]

  return (
    <div
      style={{
        fontFamily: "'Roboto Mono', 'Courier New', monospace",
        backgroundColor: "#1a1a1a",
        color: "#ffffff",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          .qgc-button {
            background: linear-gradient(145deg, #404040, #2d2d2d);
            border: 1px solid #606060;
            color: #ffffff;
            padding: 0.75rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-family: 'Roboto Mono', monospace;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
          }
          .qgc-button:hover {
            background: linear-gradient(145deg, #505050, #3d3d3d);
            border-color: #808080;
            transform: translateY(-1px);
          }
          .qgc-button.primary {
            background: linear-gradient(145deg, #0066cc, #004499);
            border-color: #0088ff;
          }
          .qgc-button.success {
            background: linear-gradient(145deg, #00aa00, #007700);
            border-color: #00cc00;
          }
          .qgc-button.warning {
            background: linear-gradient(145deg, #cc6600, #994400);
            border-color: #ff8800;
          }
          .qgc-button.danger {
            background: linear-gradient(145deg, #cc0000, #990000);
            border-color: #ff0000;
          }
          .telemetry-bar {
            background: linear-gradient(145deg, #2d2d2d, #1a1a1a);
            border: 1px solid #404040;
            padding: 0.5rem;
            display: flex;
            justify-content: space-around;
            align-items: center;
            font-size: 0.75rem;
            font-weight: 600;
          }
          .telemetry-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;
            min-width: 80px;
            padding: 0.25rem;
            border-radius: 3px;
            transition: all 0.3s ease;
          }
          .telemetry-item.live {
            background: rgba(0, 255, 0, 0.1);
            border: 1px solid rgba(0, 255, 0, 0.3);
          }
          .telemetry-item.offline {
            background: rgba(128, 128, 128, 0.1);
            border: 1px solid rgba(128, 128, 128, 0.3);
          }
          .telemetry-label {
            color: #cccccc;
            font-size: 0.65rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .telemetry-value {
            color: #00ff00;
            font-size: 0.8rem;
            font-weight: 700;
            font-family: 'Courier New', monospace;
          }
          .telemetry-value.offline {
            color: #808080;
          }
          .qgc-panel {
            background: linear-gradient(145deg, #2d2d2d, #1a1a1a);
            border: 1px solid #404040;
            border-radius: 4px;
            overflow: hidden;
          }
          .qgc-panel-header {
            background: linear-gradient(145deg, #404040, #2d2d2d);
            color: #00ff00;
            padding: 0.5rem 0.75rem;
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            border-bottom: 1px solid #606060;
          }
          .qgc-panel-content {
            padding: 0.75rem;
          }
          .leaflet-control-layers {
            background: rgba(45, 45, 45, 0.95) !important;
            color: #ffffff !important;
            border: 1px solid #606060 !important;
            border-radius: 4px !important;
          }
          .leaflet-control-layers-toggle {
            background-color: #404040 !important;
          }
          .status-indicator {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.25rem 0.5rem;
            border-radius: 3px;
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
          }
          .status-indicator.armed {
            background: rgba(255, 0, 0, 0.2);
            color: #ff4444;
            border: 1px solid rgba(255, 0, 0, 0.5);
          }
          .status-indicator.disarmed {
            background: rgba(0, 255, 0, 0.2);
            color: #44ff44;
            border: 1px solid rgba(0, 255, 0, 0.5);
          }
        `}
      </style>

      {/* QGroundControl Style Navigation */}
      <nav
        style={{
          backgroundColor: "#171e2a",
          color: "white",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "1.25rem",
            fontWeight: "600",
            color: "#60a5fa",
          }}
        >
          <img src="/shadowfly.jpg" alt="ShadowFly Logo" style={{ height: "36px", width: "auto" }} />
        </div>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "white",
            background: "none",
            border: "none",
            padding: "0.5rem",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "500",
          }}
          onClick={goBack}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Back to Tower</span>
        </button>
      </nav>

      {/* Top Telemetry Bar */}
      <div className="telemetry-bar" style={{ borderBottom: "1px solid #404040" }}>
        {topParameters.map((param) => {
          const isLive = droneParameters[param] !== "N/A"
          return (
            <div key={param} className={`telemetry-item ${isLive ? "live" : "offline"}`}>
              <div className="telemetry-label">{getParameterDisplayName(param)}</div>
              <div className={`telemetry-value ${isLive ? "" : "offline"}`}>
                {formatParameterValue(param, droneParameters[param])}
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 350px",
          gap: "0",
          height: "calc(100vh - 140px)",
          overflow: "hidden",
        }}
      >
        {/* Left Side - Main View (Map or Camera) with Small View Overlay */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0",
            backgroundColor: "#1a1a1a",
            border: "1px solid #404040",
            position: "relative",
          }}
        >
          {/* Main View */}
          <div style={{ height: "100%" }}>{primaryView === "map" ? renderMap(false) : renderCameraFeed(false)}</div>

          {/* Small View Overlay */}
          {primaryView === "map" ? renderCameraFeed(true) : renderMap(true)}
        </div>

        {/* Right Side - Flight Controls */}
        <div
          style={{
            backgroundColor: "#2d2d2d",
            border: "1px solid #404040",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            padding: "0.75rem",
            overflow: "auto",
          }}
        >
          {/* View Toggle Button */}
          <div className="qgc-panel">
            <div className="qgc-panel-header">
              <FontAwesomeIcon icon={faExpand} />
              VIEW CONTROL
            </div>
            <div className="qgc-panel-content">
              <button className="qgc-button primary" onClick={flipView} style={{ width: "100%" }}>
                <FontAwesomeIcon icon={primaryView === "map" ? faVideo : faMapMarkedAlt} />
                <span>SWITCH TO {primaryView === "map" ? "CAMERA" : "MAP"}</span>
              </button>
            </div>
          </div>

          {/* Status Display */}
          <div className="qgc-panel">
            <div className="qgc-panel-header">
              <FontAwesomeIcon icon={faInfoCircle} />
              SYSTEM STATUS
            </div>
            <div className="qgc-panel-content">
              <div
                style={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #404040",
                  borderRadius: "3px",
                  padding: "0.5rem",
                  textAlign: "center",
                  fontSize: "0.8rem",
                  color: "#00ff00",
                  fontWeight: "600",
                }}
              >
                {statusDisplay}
              </div>
            </div>
          </div>

          {/* Flight Controls */}
          <div className="qgc-panel" style={{ flex: 1 }}>
            <div className="qgc-panel-header">
              <FontAwesomeIcon icon={faGamepad} />
              FLIGHT CONTROLS
            </div>
            <div className="qgc-panel-content">
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <button className="qgc-button success" onClick={() => sendCommand("takeoff")}>
                    <FontAwesomeIcon icon={faPlaneDeparture} />
                    <span>TAKEOFF</span>
                  </button>

                  <button className="qgc-button" onClick={() => sendCommand("hover")}>
                    <FontAwesomeIcon icon={faPause} />
                    <span>HOVER</span>
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <button className="qgc-button primary" onClick={() => sendCommand("launch")}>
                    <FontAwesomeIcon icon={faRocket} />
                    <span>LAUNCH</span>
                  </button>

                  <button className="qgc-button warning" onClick={() => sendCommand("land")}>
                    <FontAwesomeIcon icon={faPlaneArrival} />
                    <span>LAND</span>
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <button className="qgc-button danger" onClick={() => sendCommand("stop")}>
                    <FontAwesomeIcon icon={faStop} />
                    <span>STOP</span>
                  </button>

                  <button className="qgc-button danger" onClick={() => sendCommand("abort")}>
                    <FontAwesomeIcon icon={faTimesCircle} />
                    <span>ABORT</span>
                  </button>
                </div>

                <button className="qgc-button" onClick={() => sendCommand("rtl")} style={{ width: "100%" }}>
                  <FontAwesomeIcon icon={faHome} />
                  <span>RETURN TO LAUNCH</span>
                </button>
              </div>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="qgc-panel">
            <div className="qgc-panel-header">
              <FontAwesomeIcon icon={faPlane} />
              VEHICLE INFO
            </div>
            <div className="qgc-panel-content">
              {droneData?.drone ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#cccccc" }}>ID:</span>
                    <span style={{ color: "#00ff00", fontWeight: "600" }}>{droneData.drone.drone_id}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#cccccc" }}>MODEL:</span>
                    <span style={{ color: "#00ff00", fontWeight: "600" }}>{droneData.drone.model}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#cccccc" }}>MODE:</span>
                    <span style={{ color: "#00ff00", fontWeight: "600" }}>
                      {droneParameters.mode !== "N/A" ? droneParameters.mode : "UNKNOWN"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#cccccc" }}>BATTERY:</span>
                    <span
                      style={{
                        color: droneParameters.battery_level !== "N/A" ? "#00ff00" : "#808080",
                        fontWeight: "600",
                      }}
                    >
                      {droneParameters.battery_level !== "N/A" ? `${droneParameters.battery_level}%` : "N/A"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#cccccc" }}>PRIMARY VIEW:</span>
                    <span style={{ color: "#00ff00", fontWeight: "600" }}>{primaryView.toUpperCase()}</span>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", color: "#808080" }}>LOADING VEHICLE DATA...</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="telemetry-bar" style={{ borderTop: "1px solid #404040" }}>
        {bottomParameters.map((param) => {
          const isLive = droneParameters[param] !== "N/A"
          return (
            <div key={param} className={`telemetry-item ${isLive ? "live" : "offline"}`}>
              <div className="telemetry-label">{getParameterDisplayName(param)}</div>
              <div className={`telemetry-value ${isLive ? "" : "offline"}`}>
                {formatParameterValue(param, droneParameters[param])}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DroneMonitoring