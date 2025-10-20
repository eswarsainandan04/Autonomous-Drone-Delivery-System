"use client"

import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faTowerBroadcast,
  faLocationDot,
  faUserCircle,
  faPlane,
  faWarehouse,
  faMapMarkerAlt,
  faBox
} from "@fortawesome/free-solid-svg-icons"
import { MapContainer, TileLayer, Marker, Popup, LayersControl } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

// Custom icons for warehouses and DDTs
const warehouseIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTMgMTBMMTIgM0wyMSAxMFYyMEgzVjEwWiIgZmlsbD0iIzM0OTdGRiIgc3Ryb2tlPSIjMUU0MEFGIiBzdHJva2Utd2lkdGg9IjIiLz4KPHBhdGggZD0iTTkgMjFWMTJIMTVWMjEiIHN0cm9rZT0iIzFFNDBBRiIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPgo=",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

const ddtIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOSIgZmlsbD0iIzEwQjk4MSIgc3Ryb2tlPSIjMDU5NjY5IiBzdHJva2Utd2lkdGg9IjIiLz4KPHBhdGggZD0iTTEyIDhWMTZNOCAxMkgxNiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+Cg==",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
})

const Home = () => {
  const navigate = useNavigate()
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [warehouses, setWarehouses] = useState([])
  const [ddts, setDdts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log("Home component mounted")
    checkAuth()
    fetchMapData()

    return () => {
      console.log("Home component unmounting, cleaning up resources")
    }
  }, [])

  const showNotification = (message) => {
    const notification = document.createElement("div")
    notification.className =
      "fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-90 text-white px-6 py-3 rounded-lg z-50 animate-fadeInOut text-sm max-w-[80%] text-center"
    notification.textContent = message
    document.body.appendChild(notification)

    setTimeout(() => {
      notification.remove()
    }, 3000)
  }

  const checkAuth = () => {
    const storedFullName = sessionStorage.getItem("full_name")
    const storedUsername = sessionStorage.getItem("username")
    if (storedFullName && storedUsername) {
      setFullName(storedFullName)
      setUsername(storedUsername)
    } else {
      setFullName("Guest User")
      setUsername("")
      navigate("/login")
    }
  }

  const fetchMapData = async () => {
    try {
      const [warehousesRes, ddtsRes] = await Promise.all([
        fetch("http://localhost:5080/api/warehouses"),
        fetch("http://localhost:5080/api/ddts"),
      ])

      if (warehousesRes.ok && ddtsRes.ok) {
        const warehousesData = await warehousesRes.json()
        const ddtsData = await ddtsRes.json()
        setWarehouses(warehousesData)
        setDdts(ddtsData)
      } else {
        showNotification("Failed to load map data")
      }
    } catch (error) {
      console.error("Error fetching map data:", error)
      showNotification("Error loading map data")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = (e) => {
    e.preventDefault()
    sessionStorage.removeItem("userRole")
    sessionStorage.removeItem("username")
    sessionStorage.removeItem("full_name")
    navigate("/login")
  }

  const handleProceed = () => {
    console.warn("Proceeding to admin dashboard without location data.")

    const mainContainer = document.querySelector(".w-full.h-screen")
    if (mainContainer) {
      mainContainer.style.opacity = "0"
    }

    sessionStorage.setItem("transitionState", "proceeding")

    setTimeout(() => {
      navigate("/admin-dashboard")
    }, 500)
  }

  const handleLearnMoreClick = () => {
    const featuresSection = document.getElementById("features-section");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth" });
    }
  };


  return (
    <div className="w-full min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 transition-opacity duration-500">
      {/* Navigation */}
      <nav className="bg-[#171e2a] text-white px-8 py-4 flex justify-between items-center shadow-lg relative z-50">
        <div className="flex items-center gap-2 text-xl font-semibold text-blue-400">
          <img src="/shadowfly.jpg" alt="ShadowFly Logo" className="h-9 w-auto" />
        </div>

        <div className="flex items-center gap-8">
          <Link
            to="/delivery"

            className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors duration-300 relative group"
          >
            <FontAwesomeIcon icon={faBox} />
            <span>Packages</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
          </Link>

          <Link
            to="/tower"
            className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors duration-300 relative group"
          >
            <FontAwesomeIcon icon={faLocationDot} />
            <span>Delivery</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
          </Link>

          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors duration-300 focus:outline-none"
            >
              <FontAwesomeIcon icon={faUserCircle} size="lg" />
              <span className="hidden md:inline">{fullName}</span>
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                  onClick={() => setShowProfileDropdown(false)}
                >
                  View Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white py-20 px-8 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  Autonomous Drone
                  <span className="text-blue-400 block">Delivery System</span>
                </h1>
                <p className="text-xl text-blue-100 leading-relaxed">
                  Revolutionary last-mile delivery solution powered by AI-driven autonomous drones, connecting
                  warehouses to delivery terminals with unprecedented speed and precision.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                
                <button
                  onClick={handleLearnMoreClick}
                  className="border-2 border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300"
                >
                  Learn More
                </button>
              </div>
            </div>

            <div className="relative">

              <div className="absolute -top-4 -left-4 bg-green-500 text-white px-4 py-2 rounded-full font-semibold shadow-lg">
                24/7 Active
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features-section" className="py-16 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Autonomous Delivery?</h2>
            <p className="text-xl text-gray-600">Experience the future of logistics with our cutting-edge technology</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center mb-6">
                <FontAwesomeIcon icon={faPlane} className="text-white text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Ultra-Fast Delivery</h3>
              <p className="text-gray-600 leading-relaxed">
                Reduce delivery times by up to 80% with direct point-to-point autonomous flight paths, bypassing
                traditional ground traffic constraints.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center mb-6">
                <FontAwesomeIcon icon={faWarehouse} className="text-white text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Smart Warehousing</h3>
              <p className="text-gray-600 leading-relaxed">
                AI-powered inventory management and automated sorting systems ensure optimal package preparation and
                dispatch efficiency.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-purple-500 rounded-lg flex items-center justify-center mb-6">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-white text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Precision Landing</h3>
              <p className="text-gray-600 leading-relaxed">
                Advanced GPS and computer vision technology enables centimeter-accurate landings at designated delivery
                terminals.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="py-16 px-8 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-blue-400">{warehouses.length}</div>
              <div className="text-gray-300">Active Warehouses</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-green-400">{ddts.length}</div>
              <div className="text-gray-300">Delivery Terminals</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-purple-400">99.8%</div>
              <div className="text-gray-300">Delivery Success Rate</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-yellow-400">15min</div>
              <div className="text-gray-300">Average Delivery Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="py-16 px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Network Coverage Map</h2>
            <p className="text-xl text-gray-600">Explore our extensive network of warehouses and delivery terminals</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold text-gray-900">Live Network Status</h3>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Warehouses ({warehouses.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">DDTs ({ddts.length})</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-[600px] relative">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <MapContainer
                                  center={[15.9129, 79.7400]} // Updated to Andhra Pradesh coordinates

                  zoom={8}
                  style={{ height: "100%", width: "100%" }}
                  className="z-10"
                >
                  <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="Default">
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                    </LayersControl.BaseLayer>

                    <LayersControl.BaseLayer name="Satellite (Hybrid)">
                      <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                      />
                    </LayersControl.BaseLayer>

                    <LayersControl.BaseLayer name="Terrain">
                      <TileLayer
                        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://opentopomap.org/">OpenTopoMap</a>'
                      />
                    </LayersControl.BaseLayer>
                  </LayersControl>

                  {/* Warehouse Markers */}
                  {warehouses.map((warehouse, index) => (
                    <Marker
                      key={`warehouse-${index}`}
                      position={[warehouse.latitude, warehouse.longitude]}
                      icon={warehouseIcon}
                    >
                      <Popup>
                        <div className="p-2">
                          <h4 className="font-bold text-blue-600 mb-2">
                            <FontAwesomeIcon icon={faWarehouse} className="mr-2" />
                            {warehouse.name}
                          </h4>
                          <p className="text-sm text-gray-600">Warehouse Facility</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Lat: {warehouse.latitude.toFixed(4)}, Lng: {warehouse.longitude.toFixed(4)}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {/* DDT Markers */}
                  {ddts.map((ddt, index) => (
                    <Marker key={`ddt-${index}`} position={[ddt.latitude, ddt.longitude]} icon={ddtIcon}>
                      <Popup>
                        <div className="p-2">
                          <h4 className="font-bold text-green-600 mb-2">
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
                            {ddt.name}
                          </h4>
                          <p className="text-sm text-gray-600">Delivery Terminal</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Lat: {ddt.latitude.toFixed(4)}, Lng: {ddt.longitude.toFixed(4)}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#171e2a] text-white py-12 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 text-2xl font-semibold text-blue-400 mb-4">
            <img src="/shadowfly.jpg" alt="ShadowFly Logo" className="h-8 w-auto" />
            ShadowFly
          </div>
          <p className="text-gray-400 mb-6">Revolutionizing delivery through autonomous drone technology</p>
          <div className="border-t border-gray-700 pt-6">
            <p className="text-gray-500">&copy; 2024 ShadowFly. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home