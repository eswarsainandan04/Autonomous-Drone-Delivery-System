"use client"

import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { MapContainer, TileLayer, Marker, useMapEvents, Circle, Popup } from "react-leaflet"
import MarkerClusterGroup from "react-leaflet-cluster"
import "leaflet/dist/leaflet.css"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import "../styles/markers.css"
import L from "leaflet"
import { Plane, Warehouse, Plus, Info, Undo2, ClipboardList, Target, Zap, Activity, RefreshCw, Settings, Truck } from 'lucide-react'

import { faSignOutAlt, faLocationDot } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

// Import LayersControl
import { LayersControl } from "react-leaflet"
import { useMap } from "react-leaflet"

// Import leaflet-geosearch
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch"
import "leaflet-geosearch/assets/css/leaflet.css"

// Fix for Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
})

// Custom component to integrate Leaflet-Geosearch with enhanced styling
function LeafletGeocoder({ onLocationSelect }) {
  const map = useMap()

  useEffect(() => {
    const provider = new OpenStreetMapProvider()
    const searchControl = new GeoSearchControl({
      provider,
      style: "bar",
      showMarker: true,
      showPopup: true,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      autoComplete: true,
      autoCompleteDelay: 250,
      position: "topleft",
      searchLabel: "Search locations...",
      keepResult: true,
      maxMarkers: 1,
      marker: {
        icon: new L.Icon({
          iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        }),
        draggable: false,
      },
    })

    map.addControl(searchControl)

    // Enhanced styling for the search control
    setTimeout(() => {
      const searchContainer = document.querySelector(".leaflet-control-geosearch")
      if (searchContainer) {
        // Style the main container
        searchContainer.style.cssText = `
          background: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(10px) !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
          border: 1px solid rgba(226, 232, 240, 0.8) !important;
          overflow: hidden !important;
          min-width: 280px !important;
        `

        // Style the search input
        const searchInput = searchContainer.querySelector("input")
        if (searchInput) {
          searchInput.style.cssText = `
            background: transparent !important;
            border: none !important;
            padding: 12px 16px !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            color: #1e293b !important;
            outline: none !important;
            width: 100% !important;
            transition: all 0.2s ease !important;
          `
          searchInput.placeholder = "🔍 Search locations..."

          // Add focus effects
          searchInput.addEventListener("focus", () => {
            searchContainer.style.boxShadow = "0 10px 25px rgba(59, 130, 246, 0.25) !important"
            searchContainer.style.borderColor = "rgba(59, 130, 246, 0.5) !important"
          })

          searchInput.addEventListener("blur", () => {
            searchContainer.style.boxShadow = "0 10px 25px rgba(0, 0, 0, 0.15) !important"
            searchContainer.style.borderColor = "rgba(226, 232, 240, 0.8) !important"
          })
        }

        // Style the search button
        const searchButton = searchContainer.querySelector("button")
        if (searchButton) {
          searchButton.style.cssText = `
            background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
            border: none !important;
            color: white !important;
            padding: 12px 16px !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            min-width: 48px !important;
          `

          searchButton.innerHTML = `
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
            </svg>
          `

          searchButton.addEventListener("mouseenter", () => {
            searchButton.style.background = "linear-gradient(135deg, #1d4ed8, #1e40af) !important"
            searchButton.style.transform = "scale(1.05) !important"
          })

          searchButton.addEventListener("mouseleave", () => {
            searchButton.style.background = "linear-gradient(135deg, #3b82f6, #1d4ed8) !important"
            searchButton.style.transform = "scale(1) !important"
          })
        }

        // Style the results dropdown
        const resultsContainer = searchContainer.querySelector(".results")
        if (resultsContainer) {
          resultsContainer.style.cssText = `
            background: rgba(255, 255, 255, 0.98) !important;
            backdrop-filter: blur(10px) !important;
            border: none !important;
            border-top: 1px solid rgba(226, 232, 240, 0.8) !important;
            max-height: 300px !important;
            overflow-y: auto !important;
          `
        }
      }

      // Style individual result items
      const observer = new MutationObserver(() => {
        const resultItems = document.querySelectorAll(".leaflet-control-geosearch .results > *")
        resultItems.forEach((item) => {
          item.style.cssText = `
            padding: 12px 16px !important;
            border-bottom: 1px solid rgba(226, 232, 240, 0.5) !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
            font-size: 14px !important;
            color: #374151 !important;
            background: transparent !important;
          `

          item.addEventListener("mouseenter", () => {
            item.style.background = "rgba(59, 130, 246, 0.1) !important"
            item.style.color = "#1e40af !important"
          })

          item.addEventListener("mouseleave", () => {
            item.style.background = "transparent !important"
            item.style.color = "#374151 !important"
          })
        })
      })

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      })

      return () => observer.disconnect()
    }, 100)

    map.on("geosearch/showlocation", (e) => {
      onLocationSelect(e.location)
    })

    return () => {
      map.removeControl(searchControl)
      map.off("geosearch/showlocation")
    }
  }, [map, onLocationSelect])

  return null
}

function MapEventHandler({ onMapClick, isAddingDDT, isAddingWarehouse }) {
  useMapEvents({
    click: (e) => {
      if (isAddingDDT || isAddingWarehouse) {
        onMapClick(e)
      }
    },
  })
  return null
}

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [ddts, setDdts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [isAddingDDT, setIsAddingDDT] = useState(false)
  const [isAddingWarehouse, setIsAddingWarehouse] = useState(false)
  const [isTracking, setIsTracking] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [deletedDDT, setDeletedDDT] = useState(null)
  const [showUndoPopup, setShowUndoPopup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentWarehouseAssignments, setCurrentWarehouseAssignments] = useState([])
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showStats, setShowStats] = useState(true)
  const [mapStyle, setMapStyle] = useState("satellite")
  const [showCircles, setShowCircles] = useState(false)
  const [measureMode, setMeasureMode] = useState(false)
  const [searchedLocation, setSearchedLocation] = useState(null)
  const [showDDTForm, setShowDDTForm] = useState(false)
  const [ddtFormData, setDdtFormData] = useState({ name: '', total_racks: 1, control_key: '', lat: 0, lng: 0 })

  const mapRef = useRef(null)
  const markerClusterRef = useRef(null)
  const watchIdRef = useRef(null)

  const API_URL = "http://localhost:5000"

  // Stats calculation
  const stats = {
    totalDDTs: ddts.length,
    activeDDTs: ddts.filter((d) => d.active).length,
    totalWarehouses: warehouses.length,
    coverage: Math.round((ddts.filter((d) => d.active).length / Math.max(ddts.length, 1)) * 100),
  }

  useEffect(() => {
    loadInitialDataFromBackend()
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    // Clear existing markers on state change
    if (markerClusterRef.current) {
      markerClusterRef.current.clearLayers()
    }

    const addMarkersIfReady = () => {
      if (mapRef.current && markerClusterRef.current) {
        if (ddts.length > 0) {
          ddts.forEach(addDDTToMap)
        }
        if (warehouses.length > 0) {
          warehouses.forEach(addWarehouseToMap)
        }
        handleSelectedLocation()
        return true
      }
      return false
    }

    if (addMarkersIfReady()) {
      return
    }

    const mapSetupInterval = setInterval(() => {
      if (addMarkersIfReady()) {
        clearInterval(mapSetupInterval)
      }
    }, 100)

    return () => clearInterval(mapSetupInterval)
  }, [ddts, warehouses])

  useEffect(() => {
    if (mapRef.current && markerClusterRef.current) {
      markerClusterRef.current.clearLayers()
      if (ddts.length > 0) ddts.forEach(addDDTToMap)
      if (warehouses.length > 0) warehouses.forEach(addWarehouseToMap)
    }

    const mapSetupInterval = setInterval(() => {
      if (mapRef.current) {
        clearInterval(mapSetupInterval)
        handleSelectedLocation()
      }
    }, 100)

    return () => clearInterval(mapSetupInterval)
  }, [ddts, warehouses])

  const loadInitialDataFromBackend = async () => {
    setLoading(true)
    try {
      const ddtsResponse = await fetch(`${API_URL}/get_ddts`)
      if (ddtsResponse.ok) {
        const ddtsData = await ddtsResponse.json()
        setDdts(
          ddtsData.map((d, index) => ({
            ...d,
            lat: Number.parseFloat(d.latitude),
            lng: Number.parseFloat(d.longitude),
            number: d.id || index + 1,
            active: d.status ? d.status === "Active" : true,
          })),
        )
      } else {
        console.error("Failed to fetch DDTs")
        showNotification("Failed to load DDTs from database.", "error")
      }

      const warehousesResponse = await fetch(`${API_URL}/get_warehouses`)
      if (warehousesResponse.ok) {
        const warehousesData = await warehousesResponse.json()
        setWarehouses(
          warehousesData.map((w) => ({
            ...w,
            lat: Number.parseFloat(w.latitude),
            lng: Number.parseFloat(w.longitude),
          })),
        )
      } else {
        console.error("Failed to fetch warehouses")
        showNotification("Failed to load warehouses from database.", "error")
      }
    } catch (error) {
      console.error("Error loading data from backend:", error)
      showNotification("Error connecting to backend.", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectedLocation = () => {
    try {
      const selectedLocationData = sessionStorage.getItem("adminSelectedLocation")
      if (selectedLocationData) {
        const location = JSON.parse(selectedLocationData)
        if (location && typeof location.lat === "number" && typeof location.lng === "number") {
          setUserLocation(location)
          if (mapRef.current) {
            mapRef.current.setView([location.lat, location.lng], 15)
          }
        }
        sessionStorage.removeItem("adminSelectedLocation")
      } else if (mapRef.current && !userLocation && !isTracking) {
        mapRef.current.setView([20, 0], 2)
      }
    } catch (error) {
      console.error("Error handling selected location:", error)
      if (mapRef.current && !userLocation && !isTracking) {
        mapRef.current.setView([20, 0], 2)
      }
    }
  }

  const handleSearchedLocationSelect = (location) => {
    setSearchedLocation({ lat: location.y, lng: location.x, name: location.label })
    if (mapRef.current) {
      mapRef.current.setView([location.y, location.x], 15)
    }
  }

  const handleMapClick = async (e) => {
    const { lat, lng } = e.latlng;
    
    if (isAddingDDT) {
      // Show DDT form popup
      setDdtFormData({ name: '', total_racks: 1, control_key: '', lat, lng });
      setShowDDTForm(true);
      setIsAddingDDT(false);
    } else if (isAddingWarehouse) {
      // For warehouse, keep the simple prompt for now
      const name = prompt("Enter warehouse name:");
      if (!name || name.trim() === "") {
        showNotification("Name cannot be empty.", "error");
        setIsAddingWarehouse(false);
        return;
      }
      await addWarehouseToBackend({ name: name.trim(), latitude: lat, longitude: lng });
      setIsAddingWarehouse(false);
    }
  };

  const handleDDTFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!ddtFormData.name.trim()) {
      showNotification("DDT name cannot be empty.", "error");
      return;
    }

    if (!ddtFormData.control_key.trim()) {
      showNotification("Control key cannot be empty.", "error");
      return;
    }

    await addDDTToBackend({
      name: ddtFormData.name.trim(),
      latitude: ddtFormData.lat,
      longitude: ddtFormData.lng,
      status: "Active",
      total_racks: ddtFormData.total_racks,
      control_key: ddtFormData.control_key.trim(),
    });

    setShowDDTForm(false);
    setDdtFormData({ name: '', total_racks: 1, control_key: '', lat: 0, lng: 0 });
  };

  const closeDDTForm = () => {
    setShowDDTForm(false);
    setDdtFormData({ name: '', total_racks: 1, control_key: '', lat: 0, lng: 0 });
  };

const addDDTToBackend = async (ddtData) => {
  setLoading(true);
  try {
    const response = await fetch(`${API_URL}/add_ddt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ddtData),
    });
    if (response.ok) {
      const result = await response.json();
      const newDDT = {
        id: result.ddt.id,
        lat: Number.parseFloat(result.ddt.latitude),
        lng: Number.parseFloat(result.ddt.longitude),
        name: result.ddt.name,
        active: result.ddt.status === "Active",
        number: result.ddt.id,
        total_racks: result.ddt.total_racks,
        control_key: result.ddt.control_key,
      };
      setDdts((prev) => [...prev, newDDT]);
      showNotification(result.message || "DDT added successfully!", "success");
    } else {
      const errorResult = await response.json();
      showNotification(`Failed to add DDT: ${errorResult.error || "Unknown error"}`, "error");
    }
  } catch (error) {
    console.error("Error adding DDT:", error);
    showNotification("Error connecting to backend to add DDT.", "error");
  } finally {
    setLoading(false);
  }
};

  const addDDTToMap = (ddt) => {
    if (!mapRef.current || !markerClusterRef.current) {
      return
    }
    if (typeof ddt.lat !== "number" || typeof ddt.lng !== "number" || isNaN(ddt.lat) || isNaN(ddt.lng)) {
      console.error("Invalid coordinates for DDT:", ddt.name, "Lat:", ddt.lat, "Lng:", ddt.lng)
      return
    }

    const ddtMapIcon = L.icon({
      iconUrl: "/DDt.jpg",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
      tooltipAnchor: [0, -28],
    })

    const marker = L.marker([ddt.lat, ddt.lng], {
      icon: ddtMapIcon,
      opacity: ddt.active ? 1 : 0.5,
    })

    marker
      .bindTooltip(ddt.name, {
        permanent: true,
        direction: "top",
        className: "location-name-tooltip",
      })
      .openTooltip()

    marker.bindPopup(
      `<b>${ddt.name}</b><br>Active: ${ddt.active}<br>Lat: ${ddt.lat.toFixed(4)}, Lng: ${ddt.lng.toFixed(4)}`,
    )

    marker.on("click", (e) => {
      L.DomEvent.stopPropagation(e)
      if (mapRef.current) {
        mapRef.current.setView([ddt.lat, ddt.lng], 15, { animate: true, duration: 1 })
      }
      showNameEditor(ddt.id)
    })
    marker.ddtData = ddt
    markerClusterRef.current.addLayer(marker)
  }

  const showNameEditor = (ddtId) => {
    const ddtToEdit = ddts.find((d) => d.id === ddtId)
    if (!ddtToEdit) return

    const overlay = document.createElement("div")
    overlay.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"

    const popupContainerId = "editor-popup-container"
    let popupContainer = document.getElementById(popupContainerId)
    if (!popupContainer) {
      popupContainer = document.createElement("div")
      popupContainer.id = popupContainerId
      document.body.appendChild(popupContainer)
    }
    popupContainer.innerHTML = ""
    popupContainer.appendChild(overlay)

    const popup = document.createElement("div")
    popup.className =
      "bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-95 opacity-0"

    requestAnimationFrame(() => {
      popup.classList.remove("scale-95", "opacity-0")
      popup.classList.add("scale-100", "opacity-100")
    })

    popup.innerHTML = `
      <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl">
        <h3 class="text-xl font-semibold text-white flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2L3 7v11a2 2 0 002 2h10a2 2 0 002-2V7l-7-5z"/>
          </svg>
          Edit DDT Terminal
        </h3>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Terminal Name</label>
          <input type="text" id="ddt-name-input" value="${ddtToEdit.name}"
            class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
        </div>
        <div class="flex items-center p-4 bg-slate-50 rounded-lg">
          <input type="checkbox" id="ddt-active-input" ${ddtToEdit.active ? "checked" : ""}
                 class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded">
          <label for="ddt-active-input" class="ml-3 block text-sm font-medium text-slate-700">
            Terminal Active Status
          </label>
        </div>
        <div class="bg-blue-50 p-4 rounded-lg">
          <p class="text-sm text-blue-800">
            <strong>Location:</strong> ${ddtToEdit.lat.toFixed(5)}, ${ddtToEdit.lng.toFixed(5)}
          </p>
        </div>
      </div>
      <div class="flex justify-between items-center px-6 py-4 bg-slate-50 rounded-b-xl">
        <button id="delete-ddt-btn"
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 102 0v3a1 1 0 11-2 0V9zm4 0a1 1 0 10-2 0v3a1 1 0 102 0V9z" clip-rule="evenodd"/>
          </svg>
          Delete
        </button>
        <div class="flex gap-3">
          <button id="cancel-ddt-btn"
            class="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors">
            Cancel
          </button>
          <button id="save-ddt-btn"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            Save Changes
          </button>
        </div>
      </div>
    `
    overlay.appendChild(popup)

    const nameInput = document.getElementById("ddt-name-input")
    const activeInput = document.getElementById("ddt-active-input")
    const saveBtn = document.getElementById("save-ddt-btn")
    const cancelBtn = document.getElementById("cancel-ddt-btn")
    const deleteBtn = document.getElementById("delete-ddt-btn")

    const closeEditor = () => {
      popup.classList.remove("scale-100", "opacity-100")
      popup.classList.add("scale-95", "opacity-0")
      setTimeout(() => {
        if (popupContainer) popupContainer.remove()
      }, 300)
    }

    saveBtn.addEventListener("click", async () => {
      const newName = nameInput.value.trim()
      const newActiveState = activeInput.checked
      const newStatus = newActiveState ? "Active" : "Inactive"

      if (!newName) {
        showNotification("DDT name cannot be empty.", "error")
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`${API_URL}/update_ddt/${ddtId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName, status: newStatus }),
        })
        if (response.ok) {
          const updatedDDTResponse = await response.json()
          setDdts((prevDdts) =>
            prevDdts.map((d) =>
              d.id === ddtId
                ? {
                    ...d,
                    name: updatedDDTResponse.ddt.name,
                    active: updatedDDTResponse.ddt.status === "Active",
                    lat: Number.parseFloat(updatedDDTResponse.ddt.latitude),
                    lng: Number.parseFloat(updatedDDTResponse.ddt.longitude),
                  }
                : d,
            ),
          )
          showNotification("DDT updated successfully!", "success")
          closeEditor()
        } else {
          const errorResult = await response.json()
          showNotification(`Failed to update DDT: ${errorResult.error || "Unknown error"}`, "error")
        }
      } catch (error) {
        console.error("Error updating DDT:", error)
        showNotification("Error connecting to backend to update DDT.", "error")
      } finally {
        setLoading(false)
      }
    })

    deleteBtn.addEventListener("click", () => {
      if (window.confirm("Are you sure you want to delete this DDT? This action cannot be undone.")) {
        deleteDDTFromBackend(ddtId)
        closeEditor()
      }
    })

    cancelBtn.addEventListener("click", closeEditor)
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeEditor()
    })

    nameInput.focus()
    nameInput.select()
  }

  const deleteDDTFromBackend = async (ddtId) => {
    const ddtToDelete = ddts.find((d) => d.id === ddtId)
    if (!ddtToDelete) return

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/delete_ddt/${ddtId}`, { method: "DELETE" })
      if (response.ok) {
        showNotification(`DDT '${ddtToDelete.name}' deleted successfully.`, "success")
        setDeletedDDT({ ddt: ddtToDelete, index: ddts.findIndex((d) => d.id === ddtId) })
        setDdts((prevDdts) => prevDdts.filter((d) => d.id !== ddtId))
        setShowUndoPopup(true)
        setTimeout(() => {
          setShowUndoPopup(false)
          setDeletedDDT(null)
        }, 10000)
      } else {
        const errorResult = await response.json()
        showNotification(`Failed to delete DDT: ${errorResult.error || "Unknown error"}`, "error")
      }
    } catch (error) {
      console.error("Error deleting DDT from backend:", error)
      showNotification("Error connecting to backend to delete DDT.", "error")
    } finally {
      setLoading(false)
    }
  }

  const undoDelete = () => {
    if (deletedDDT) {
      setDdts((prevDdts) => {
        const updatedDDTs = [...prevDdts]
        updatedDDTs.splice(deletedDDT.index, 0, deletedDDT.ddt)
        return updatedDDTs
      })
      setShowUndoPopup(false)
      setDeletedDDT(null)
      showNotification("DDT deletion undone locally.", "info")
    }
  }

  const addWarehouseToBackend = async (warehouseData) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/add_warehouse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(warehouseData),
      })
      if (response.ok) {
        const result = await response.json()
        const newWarehouse = {
          id: result.warehouse.id,
          lat: Number.parseFloat(result.warehouse.latitude),
          lng: Number.parseFloat(result.warehouse.longitude),
          name: result.warehouse.name,
        }
        setWarehouses((prev) => [...prev, newWarehouse])
        showNotification(result.message || "Warehouse added successfully!", "success")
      } else {
        const errorResult = await response.json()
        showNotification(`Failed to add warehouse: ${errorResult.error || "Unknown error"}`, "error")
      }
    } catch (error) {
      console.error("Error adding warehouse:", error)
      showNotification("Error connecting to backend to add warehouse.", "error")
    } finally {
      setLoading(false)
    }
  }

  const addWarehouseToMap = (warehouse) => {
    if (!mapRef.current || !markerClusterRef.current) {
      return
    }
    if (
      typeof warehouse.lat !== "number" ||
      typeof warehouse.lng !== "number" ||
      isNaN(warehouse.lat) ||
      isNaN(warehouse.lng)
    ) {
      console.error("Invalid coordinates for Warehouse:", warehouse.name, "Lat:", warehouse.lat, "Lng:", warehouse.lng)
      return
    }

    const warehouseMapIcon = L.icon({
      iconUrl: "/Warehouse.webp",
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
      tooltipAnchor: [0, -36],
    })

    const marker = L.marker([warehouse.lat, warehouse.lng], {
      icon: warehouseMapIcon,
    })

    marker
      .bindTooltip(warehouse.name, {
        permanent: true,
        direction: "top",
        className: "location-name-tooltip",
      })
      .openTooltip()

    marker.bindPopup(`<b>${warehouse.name}</b><br>Click for details.`)

    marker.on("click", (e) => {
      L.DomEvent.stopPropagation(e)
      showWarehouseEditor(warehouse.id)
    })
    marker.warehouseData = warehouse
    markerClusterRef.current.addLayer(marker)
  }

  const showWarehouseEditor = async (warehouseId) => {
    const warehouseToEdit = warehouses.find((w) => w.id === warehouseId)
    if (!warehouseToEdit) return

    setCurrentWarehouseAssignments([])
    setLoadingAssignments(true)

    const overlay = document.createElement("div")
    overlay.className = "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"

    const popupContainerId = "warehouse-editor-popup-container"
    let popupContainer = document.getElementById(popupContainerId)
    if (!popupContainer) {
      popupContainer = document.createElement("div")
      popupContainer.id = popupContainerId
      document.body.appendChild(popupContainer)
    }
    popupContainer.innerHTML = ""
    popupContainer.appendChild(overlay)

    const popup = document.createElement("div")
    popup.className =
      "bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-95 opacity-0"

    requestAnimationFrame(() => {
      popup.classList.remove("scale-95", "opacity-0")
      popup.classList.add("scale-100", "opacity-100")
    })

    const renderAssignments = (assignments_data_param) => {
      if (loadingAssignments) {
        return '<div class="flex items-center justify-center py-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div><span class="ml-3 text-slate-600">Loading assignments...</span></div>'
      }
      if (!assignments_data_param || assignments_data_param.length === 0) {
        return '<div class="text-center py-8 text-slate-500"><svg class="w-12 h-12 mx-auto mb-3 text-slate-300" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2L3 7v11a2 2 0 002 2h10a2 2 0 002-2V7l-7-5z"/></svg><p>No drone assignments for this warehouse.</p></div>'
      }
      let tableHTML = `
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Drone ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Drone Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-slate-200">
      `
      assignments_data_param.forEach((a) => {
        const statusColor = a.status === "Active" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"
        tableHTML += `
          <tr class="hover:bg-slate-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">${a.drone_id || "N/A"}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-700">${a.drone_name || "N/A"}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}">
                ${a.status || "N/A"}
              </span>
            </td>
          </tr>
        `
      })
      tableHTML += "</tbody></table></div>"
      return tableHTML
    }

    popup.innerHTML = `
      <div class="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
          </svg>
          <h3 class="text-xl font-semibold text-white">Warehouse Management</h3>
        </div>
        <button id="close-warehouse-popup-btn" class="text-white hover:text-slate-200 transition-colors">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>

      <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
        <div class="grid md:grid-cols-2 gap-6 mb-6">
          <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <h4 class="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2L3 7v11a2 2 0 002 2h10a2 2 0 002-2V7l-7-5z"/>
              </svg>
              Warehouse Information
            </h4>
            <div class="space-y-2">
              <p class="text-sm"><strong class="text-blue-700">Name:</strong> <span class="text-slate-700">${warehouseToEdit.name}</span></p>
              <p class="text-sm"><strong class="text-blue-700">Coordinates:</strong> <span class="text-slate-700">${warehouseToEdit.lat.toFixed(5)}, ${warehouseToEdit.lng.toFixed(5)}</span></p>
            </div>
          </div>

          <div class="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-200">
            <h4 class="text-lg font-semibold text-emerald-800 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Quick Stats
            </h4>
            <div class="space-y-2">
              <p class="text-sm"><strong class="text-emerald-700">Status:</strong> <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span></p>
              <p class="text-sm"><strong class="text-emerald-700">Assigned Drones:</strong> <span class="text-slate-700" id="drone-count">Loading...</span></p>
            </div>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-lg">
          <div class="px-6 py-4 border-b border-slate-200">
            <h4 class="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
              Drone Assignments
            </h4>
          </div>
          <div id="warehouse-assignments-container" class="p-6">
            ${renderAssignments(currentWarehouseAssignments)}
          </div>
        </div>
      </div>

      <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <button id="view-more-warehouse-btn" class="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
          </svg>
          View Detailed Analytics
        </button>
        <button id="delete-warehouse-btn-popup" class="w-full sm:w-auto px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 102 0v3a1 1 0 11-2 0V9zm4 0a1 1 0 10-2 0v3a1 1 0 102 0V9z" clip-rule="evenodd"/>
          </svg>
          Delete Warehouse
        </button>
      </div>
    `
    overlay.appendChild(popup)

    const deleteBtnPopup = document.getElementById("delete-warehouse-btn-popup")
    const closeBtnPopup = document.getElementById("close-warehouse-popup-btn")
    const viewMoreBtn = document.getElementById("view-more-warehouse-btn")
    const assignmentsContainer = document.getElementById("warehouse-assignments-container")
    const droneCountElement = document.getElementById("drone-count")

    const closeEditor = () => {
      popup.classList.remove("scale-100", "opacity-100")
      popup.classList.add("scale-95", "opacity-0")
      setTimeout(() => {
        if (popupContainer) popupContainer.remove()
        setCurrentWarehouseAssignments([])
        setLoadingAssignments(false)
      }, 300)
    }

    closeBtnPopup.addEventListener("click", closeEditor)
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeEditor()
    })

    viewMoreBtn.addEventListener("click", () => {
      closeEditor()
      navigate(`/warehouse/${encodeURIComponent(warehouseToEdit.name)}`)
    })

    deleteBtnPopup.addEventListener("click", () => {
      if (
        window.confirm(
          `Are you sure you want to delete warehouse "${warehouseToEdit.name}"? This action also deletes associated drone assignments.`,
        )
      ) {
        deleteWarehouseFromBackend(warehouseId, warehouseToEdit.name)
        closeEditor()
      }
    })

    try {
      const assignmentsResponse = await fetch(
        `${API_URL}/get_drone_assignments_by_warehouse_name/${encodeURIComponent(warehouseToEdit.name)}`,
      )

      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json()
        setCurrentWarehouseAssignments(assignmentsData)
        setLoadingAssignments(false)
        if (assignmentsContainer) {
          assignmentsContainer.innerHTML = renderAssignments(assignmentsData)
        }
        if (droneCountElement) {
          droneCountElement.textContent = assignmentsData.length.toString()
        }
      } else {
        setLoadingAssignments(false)
        if (assignmentsContainer) {
          assignmentsContainer.innerHTML =
            '<p class="text-red-500 text-center py-4">Failed to load assignments. Please try again.</p>'
        }
        if (droneCountElement) {
          droneCountElement.textContent = "Error"
        }
      }
    } catch (error) {
      console.error("Error fetching drone assignments:", error)
      setLoadingAssignments(false)
      if (assignmentsContainer) {
        assignmentsContainer.innerHTML = '<p class="text-red-500 text-center py-4">Error connecting to server.</p>'
      }
      if (droneCountElement) {
        droneCountElement.textContent = "Error"
      }
    }
  }

  const deleteWarehouseFromBackend = async (warehouseId, warehouseName) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/delete_warehouse/${warehouseId}`, { method: "DELETE" })
      if (response.ok) {
        const result = await response.json()
        showNotification(result.message || `Warehouse '${warehouseName}' deleted successfully.`, "success")
        setWarehouses((prevWarehouses) => prevWarehouses.filter((w) => w.id !== warehouseId))
      } else {
        const errorResult = await response.json()
        showNotification(`Failed to delete warehouse: ${errorResult.error || "Unknown error"}`, "error")
      }
    } catch (error) {
      console.error("Error deleting warehouse from backend:", error)
      showNotification("Error connecting to backend to delete warehouse.", "error")
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (message, type = "success") => {
    const notificationId = `notification-${Date.now()}`
    const notification = document.createElement("div")
    notification.id = notificationId

    const typeStyles = {
      success: "bg-emerald-600 border-emerald-500",
      error: "bg-red-600 border-red-500",
      info: "bg-blue-600 border-blue-500",
      warning: "bg-amber-600 border-amber-500",
    }

    notification.className = `notification ${type} fixed top-4 right-4 ${typeStyles[type] || typeStyles.success} text-white p-4 rounded-lg shadow-lg z-[1001] transition-all duration-300 transform translate-x-full opacity-0 max-w-sm`

    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="flex-shrink-0">
          ${
            type === "success"
              ? '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>'
              : type === "error"
                ? '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>'
                : '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>'
          }
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium">${message}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="flex-shrink-0 text-white hover:text-gray-200">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
        </button>
      </div>
    `

    document.body.appendChild(notification)

    requestAnimationFrame(() => {
      notification.classList.remove("translate-x-full", "opacity-0")
      notification.classList.add("translate-x-0", "opacity-100")
    })

    setTimeout(
      () => {
        notification.classList.remove("translate-x-0", "opacity-100")
        notification.classList.add("translate-x-full", "opacity-0")
        setTimeout(() => notification.remove(), 300)
      },
      type === "error" ? 5000 : 3000,
    )
  }

  const handleBack = () => navigate("/")

  const toggleLiveLocation = () => {
    const nextIsTracking = !isTracking
    setIsTracking(nextIsTracking)

    if (nextIsTracking) {
      if (navigator.geolocation) {
        sessionStorage.removeItem("adminSelectedLocation")
        showNotification("Starting live location tracking...", "info")

        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            const newLocation = { lat: latitude, lng: longitude }
            setUserLocation(newLocation)
            if (mapRef.current) {
              mapRef.current.setView([latitude, longitude], 9, { animate: true })
            }
          },
          (error) => {
            console.error("Geolocation error:", error)
            let message = `Location error: ${error.message}`
            if (error.code === 1) message = "Location permission denied. Please enable location access."
            else if (error.code === 2) message = "Location unavailable. Check your connection."
            else if (error.code === 3) message = "Location request timed out."

            showNotification(message, "error")
            setIsTracking(false)
            if (watchIdRef.current) {
              navigator.geolocation.clearWatch(watchIdRef.current)
              watchIdRef.current = null
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000,
          },
        )
      } else {
        showNotification("Geolocation is not supported by this browser.", "error")
        setIsTracking(false)
      }
    } else {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
        showNotification("Live location tracking stopped.", "info")
      }
    }
  }

  const filteredDDTs = ddts.filter((ddt) => ddt.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const filteredWarehouses = warehouses.filter((warehouse) =>
    warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Enhanced Header */}
      <nav className="bg-[#171e2a] text-white px-4 sm:px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-blue-400">
          <img src="/shadowfly.jpg" alt="ShadowFly Logo" className="h-9 w-auto" />
          <span className="text-[#d3a95c] text-xl sm:text-2xl">Admin</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={toggleLiveLocation}
            className="flex items-center gap-2 text-white hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-md p-2 transition-colors duration-300"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faLocationDot} />
            <span className="hidden sm:inline">{isTracking ? "Stop Tracking" : "Location"}</span>
          </button>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 rounded-md p-2 transition-colors duration-300"
            aria-label="Go back to previous page"
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
            <span className="hidden sm:inline">Signout</span>
          </button>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Enhanced Sidebar */}
        <div
          className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:relative z-30 w-80 bg-white shadow-2xl transition-transform duration-300 ease-in-out h-full overflow-y-auto`}
        >
          {/* Stats Dashboard */}
          {showStats && (
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">System Overview</h3>
                <button className="p-1 rounded-lg hover:bg-white/50 transition-colors"></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Total DDTs</p>
                      <p className="text-lg font-bold text-slate-800">{stats.totalDDTs}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Active</p>
                      <p className="text-lg font-bold text-slate-800">{stats.activeDDTs}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Warehouse className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Warehouses</p>
                      <p className="text-lg font-bold text-slate-800">{stats.totalWarehouses}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Activity className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Coverage</p>
                      <p className="text-lg font-bold text-slate-800">{stats.coverage}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="p-6 space-y-3">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">Quick Actions</h3>

            <button
              onClick={() => {
                setIsAddingDDT(true)
                setIsAddingWarehouse(false)
                showNotification("Click on the map to add a DDT terminal.", "info")
                setSidebarOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isAddingDDT
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg"
                  : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg"
              }`}
            >
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="font-medium">Add DDT Terminal</p>
                <p className="text-xs opacity-90">Deploy new delivery terminal</p>
              </div>
            </button>

            <button
              onClick={() => {
                setIsAddingWarehouse(true)
                setIsAddingDDT(false)
                showNotification("Click on the map to add a warehouse.", "info")
                setSidebarOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isAddingWarehouse
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg"
                  : "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg"
              }`}
            >
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Warehouse className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="font-medium">Add Warehouse</p>
                <p className="text-xs opacity-90">Create storage facility</p>
              </div>
            </button>

            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">Management</h4>

              <button
                onClick={() => {
                  navigate("/data-info")
                  setSidebarOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors mb-2"
              >
                <Info className="w-4 h-4 text-slate-600" />
                <span className="font-medium text-slate-700">Data Analytics</span>
              </button>

              <button
                onClick={() => {
                  navigate("/drone-management")
                  setSidebarOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors mb-2"
                disabled={loading}
              >
                <Plane className="w-4 h-4 text-slate-600" />
                <span className="font-medium text-slate-700">Drone Management</span>
              </button>

              <button
                onClick={() => {
                  navigate("/drone-assignment")
                  setSidebarOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors mb-2"
                disabled={loading}
              >
                <ClipboardList className="w-4 h-4 text-slate-600" />
                <span className="font-medium text-slate-700">Drone Assignments</span>
              </button>

              {/* NEW: Delivery Management Button */}
              <button
                onClick={() => {
                  navigate("/delivery", { state: { username: "admin" } })
                  setSidebarOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors mb-2"
                disabled={loading}
              >
                <Truck className="w-4 h-4" />
                <span className="font-medium">Delivery Management</span>
              </button>
            </div>

            {/* Map Controls */}
            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">Map Controls</h4>

              <div className="mt-3">
                <label className="block text-xs font-medium text-slate-600 mb-2">Map Style</label>
                <select
                  value={mapStyle}
                  onChange={(e) => setMapStyle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="satellite">Satellite</option>
                  <option value="default">Street Map</option>
                  <option value="terrain">Terrain</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 mt-4">
              <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">Settings</h4>
              <button
                onClick={() => {
                  navigate("/adminsettings")
                  setSidebarOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                disabled={loading}
              >
                <Settings className="w-4 h-4 text-slate-600" />
                <span className="font-medium text-slate-700">Admin Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Enhanced Map Container */}
        <div className="flex-1 relative">
          <MapContainer
            ref={(mapInstance) => {
              mapRef.current = mapInstance
            }}
            center={
              userLocation && typeof userLocation.lat === "number" && typeof userLocation.lng === "number"
                ? [userLocation.lat, userLocation.lng]
                : [20, 0]
            }
            zoom={userLocation && typeof userLocation.lat === "number" && typeof userLocation.lng === "number" ? 15 : 2}
            minZoom={2}
            maxZoom={18}
            style={{ height: "100%", width: "100%" }}
            className="z-0"
          >
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked={mapStyle === "satellite"} name="Satellite View">
                <TileLayer
                  url="https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                  subdomains={["mt0", "mt1", "mt2", "mt3"]}
                  attribution="&copy; Google Hybrid"
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer checked={mapStyle === "default"} name="Street Map">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer checked={mapStyle === "terrain"} name="Terrain View">
                <TileLayer
                  url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                  attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            {/* Add the LeafletGeocoder component here */}
            <LeafletGeocoder onLocationSelect={handleSearchedLocationSelect} />

            <MarkerClusterGroup ref={markerClusterRef}>{/* Markers are dynamically added */}</MarkerClusterGroup>

            {/* Coverage Circles */}
            {showCircles &&
              ddts
                .filter((ddt) => ddt.active)
                .map((ddt) => (
                  <Circle
                    key={`circle-${ddt.id}`}
                    center={[ddt.lat, ddt.lng]}
                    radius={5000}
                    pathOptions={{
                      color: "#3b82f6",
                      fillColor: "#3b82f6",
                      fillOpacity: 0.1,
                      weight: 2,
                    }}
                  />
                ))}

            {/* User Location Marker */}
            {userLocation && typeof userLocation.lat === "number" && typeof userLocation.lng === "number" && (
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={L.icon({
                  iconUrl: "/current.png",
                  iconSize: [41, 41],
                  iconAnchor: [20, 41],
                })}
              />
            )}

            {/* Marker for searched location */}
            {searchedLocation && (
              <Marker
                position={[searchedLocation.lat, searchedLocation.lng]}
                icon={L.icon({
                  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41],
                })}
              >
                <Popup>{searchedLocation.name}</Popup>
              </Marker>
            )}

            <MapEventHandler
              onMapClick={handleMapClick}
              isAddingDDT={isAddingDDT}
              isAddingWarehouse={isAddingWarehouse}
            />
          </MapContainer>

          {/* Enhanced Location Info Panel */}
          {userLocation && typeof userLocation.lat === "number" && typeof userLocation.lng === "number" && (
            <div className="absolute bottom-6 left-6 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 max-w-sm z-[401]">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-3 h-3 rounded-full ${isTracking ? "bg-emerald-500 animate-pulse" : "bg-blue-500"}`}
                ></div>
                <h3 className="text-slate-800 font-semibold">{isTracking ? "Live Location" : "Selected Location"}</h3>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <p>
                  <span className="font-medium">Latitude:</span> {userLocation.lat.toFixed(6)}
                </p>
                <p>
                  <span className="font-medium">Longitude:</span> {userLocation.lng.toFixed(6)}
                </p>
                {isTracking && (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span className="text-xs">Updating...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Indicators */}
          <div className="absolute top-4 right-4 z-[401] space-y-2">
            {(isAddingDDT || isAddingWarehouse) && (
              <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Click map to add {isAddingDDT ? "DDT" : "Warehouse"}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DDT Form Popup */}
      {showDDTForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Target className="w-5 h-5" />
                Add DDT Terminal
              </h3>
            </div>
            <form onSubmit={handleDDTFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Terminal Name *</label>
                <input
                  type="text"
                  value={ddtFormData.name}
                  onChange={(e) => setDdtFormData({ ...ddtFormData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter DDT terminal name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Total Racks *</label>
                <select
                  value={ddtFormData.total_racks}
                  onChange={(e) => setDdtFormData({ ...ddtFormData, total_racks: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>{num} Rack{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Control Key *</label>
                <input
                  type="text"
                  value={ddtFormData.control_key}
                  onChange={(e) => setDdtFormData({ ...ddtFormData, control_key: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter control key"
                  required
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Location:</strong> {ddtFormData.lat.toFixed(5)}, {ddtFormData.lng.toFixed(5)}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeDDTForm}
                  className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add DDT
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Undo Popup */}
      {showUndoPopup && deletedDDT && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white rounded-xl shadow-2xl p-4 flex items-center gap-4 z-[1001] max-w-md mx-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="font-medium">DDT Deleted</p>
              <p className="text-sm text-slate-300">'{deletedDDT.ddt.name}' has been removed</p>
            </div>
          </div>
          <button
            onClick={undoDelete}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Undo2 className="w-4 h-4" />
            Undo
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard