"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

const Tower = () => {
  const [deliveryDrones, setDeliveryDrones] = useState([])
  const [selectedDrone, setSelectedDrone] = useState(null)
  const [droneData, setDroneData] = useState(null)
  const [destinationData, setDestinationData] = useState(null)
  const [ddtFacilities, setDdtFacilities] = useState([])
  const [selectedDdt, setSelectedDdt] = useState(null)
  const [selectedRack, setSelectedRack] = useState("")
  const [deliveryMethod, setDeliveryMethod] = useState("DDT")
  const [loading, setLoading] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [deliveryStatus, setDeliveryStatus] = useState("")

  // Package launch states
  const [selectedPackage, setSelectedPackage] = useState("")
  const [launchStatus, setLaunchStatus] = useState("Ready")
  const [launchLoading, setLaunchLoading] = useState(false)
  const [controlKey, setControlKey] = useState("")

  // Source coordinates popup state
  const [showSourcePopup, setShowSourcePopup] = useState(false)
  const [sourceCoordinates, setSourceCoordinates] = useState({
    source_lat: "",
    source_lng: "",
  })
  const [pendingDrone, setPendingDrone] = useState(null)
  const [popupAction, setPopupAction] = useState("")

  // Email and OTP tracking
  const [otpData, setOtpData] = useState(null)
  const [emailSent, setEmailSent] = useState(false)

  const navigate = useNavigate()
  const API_BASE = "http://localhost:5090/api"

  // EmailJS configuration
  const EMAILJS_PUBLIC_KEY = "PYx32kIU5UYnouHXW"
  const EMAILJS_SERVICE_ID = "service_34u8aka"
  const EMAILJS_TEMPLATE_ID = "template_nvzgp4f"

  useEffect(() => {
    fetchDeliveryDrones()
    checkReturnFromMonitoring()
    loadEmailJS()
  }, [])

  // Status monitoring effect
  useEffect(() => {
    let statusInterval
    if (selectedPackage && launchStatus === "Processing") {
      statusInterval = setInterval(checkPackageStatus, 2000)
    }
    return () => {
      if (statusInterval) clearInterval(statusInterval)
    }
  }, [selectedPackage, launchStatus])

  const loadEmailJS = () => {
    if (!window.emailjs) {
      const script = document.createElement("script")
      script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"
      script.onload = () => {
        window.emailjs.init(EMAILJS_PUBLIC_KEY)
        console.log("EmailJS loaded successfully")
      }
      document.head.appendChild(script)
    } else {
      window.emailjs.init(EMAILJS_PUBLIC_KEY)
    }
  }

  const checkPackageStatus = async () => {
    if (!selectedPackage) return

    try {
      const response = await fetch(`${API_BASE}/package-status/${selectedPackage}`)
      const data = await response.json()

      console.log("Package status:", data)

      if (data.status !== launchStatus) {
        setLaunchStatus(data.status)

        // If delivered and email not sent yet, get OTP data and send email
        if (data.status === "Delivered" && !emailSent) {
          await handleDeliveredStatus()
        }
      }
    } catch (error) {
      console.error("Error checking package status:", error)
    }
  }

  const handleDeliveredStatus = async () => {
    try {
      // Get OTP data from backend
      const otpResponse = await fetch(`${API_BASE}/get-otp-data/${selectedPackage}`)
      const otpData = await otpResponse.json()

      if (otpData.status === "success") {
        setOtpData(otpData)

        // Send email using EmailJS with rack information
        if (window.emailjs) {
          const templateParams = {
            mail_id: otpData.mail_id,
            otp: otpData.otp,
            package_id: otpData.package_id,
            rack_location: otpData.rack ? `Rack ${otpData.rack.replace("rack_", "")}` : "Not specified",
          }

          try {
            await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
            setEmailSent(true)
            console.log("OTP email sent successfully via EmailJS with rack information")
            setDeliveryStatus(
              `✅ Package ${selectedPackage} delivered to ${templateParams.rack_location}! OTP sent to ${otpData.mail_id}. Package is now in the DDT rack waiting for customer pickup.`,
            )
          } catch (emailError) {
            console.error("Failed to send email via EmailJS:", emailError)
            setDeliveryStatus(`Package ${selectedPackage} delivered but email failed: ${emailError.message}`)
          }
        } else {
          console.error("EmailJS not loaded")
          setDeliveryStatus(`Package ${selectedPackage} delivered but EmailJS not available`)
        }
      } else {
        console.error("Failed to get OTP data:", otpData.error)
        setDeliveryStatus(`Package ${selectedPackage} delivered but OTP data error: ${otpData.error}`)
      }
    } catch (error) {
      console.error("Error handling delivered status:", error)
      setDeliveryStatus(`Package ${selectedPackage} delivered but error: ${error.message}`)
    }
  }

  const sendOTPEmailManually = async () => {
    try {
      if (!otpData) {
        // Get OTP data first
        const otpResponse = await fetch(`${API_BASE}/get-otp-data/${selectedPackage}`)
        const data = await otpResponse.json()

        if (data.status === "success") {
          setOtpData(data)

          // Send email using EmailJS with rack information
          if (window.emailjs) {
            const templateParams = {
              mail_id: data.mail_id,
              otp: data.otp,
              package_id: data.package_id,
              rack_location: data.rack ? `Rack ${data.rack.replace("rack_", "")}` : "Not specified",
            }

            await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
            setEmailSent(true)
            setDeliveryStatus(`OTP email sent to ${data.mail_id} with rack location: ${templateParams.rack_location}`)
            alert("OTP email sent successfully with rack information!")
          } else {
            alert("EmailJS not available")
          }
        } else {
          alert(`Failed to get OTP data: ${data.error}`)
        }
      } else {
        // Use existing OTP data
        if (window.emailjs) {
          const templateParams = {
            mail_id: otpData.mail_id,
            otp: otpData.otp,
            package_id: otpData.package_id,
            rack_location: otpData.rack ? `Rack ${otpData.rack.replace("rack_", "")}` : "Not specified",
          }

          await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
          setEmailSent(true)
          setDeliveryStatus(
            `OTP email resent to ${otpData.mail_id} with rack location: ${templateParams.rack_location}`,
          )
          alert("OTP email sent successfully with rack information!")
        } else {
          alert("EmailJS not available")
        }
      }
    } catch (error) {
      console.error("Error sending OTP email:", error)
      alert(`Failed to send email: ${error.message}`)
    }
  }

  const handlePackagePickup = async () => {
    if (!selectedPackage || !selectedDdt || !selectedRack) {
      alert("Missing package or rack information for pickup")
      return
    }

    try {
      const response = await fetch(`${API_BASE}/pickup-package/${selectedPackage}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ddt_name: selectedDdt.name,
          rack_column: selectedRack,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setDeliveryStatus(
          `📦 Package ${selectedPackage} picked up successfully! Rack ${selectedRack.replace("rack_", "")} is now available.`,
        )
        // Reset the form for next delivery
        setLaunchStatus("Ready")
        setSelectedPackage("")
        setOtpData(null)
        setEmailSent(false)
        setControlKey("")
        alert("Package pickup confirmed! Rack has been cleared.")
      } else {
        alert(`Pickup failed: ${result.error}`)
      }
    } catch (error) {
      console.error("Error processing pickup:", error)
      alert("Error processing pickup: " + error.message)
    }
  }

  const checkReturnFromMonitoring = () => {
    try {
      const returnData = localStorage.getItem("monitoringReturnData")
      if (returnData) {
        const parsedData = JSON.parse(returnData)
        localStorage.removeItem("monitoringReturnData")

        if (parsedData.selected_rack) {
          setSelectedRack(parsedData.selected_rack)
          setDeliveryStatus(`Returned from monitoring - Rack ${parsedData.selected_rack.replace("rack_", "")} selected`)
        }

        if (parsedData.drone_id) {
          sessionStorage.setItem("autoSelectDroneId", parsedData.drone_id)
        }
      }
    } catch (error) {
      console.error("Error checking return data:", error)
    }
  }

  const autoSelectDrone = (droneId) => {
    const drone = deliveryDrones.find((d) => d.drone_id === droneId)
    if (drone) {
      checkSourceCoordinatesAndSelect(drone, "select")
      setDeliveryStatus((prev) =>
        prev ? `${prev} - Drone ${droneId} auto-selected` : `Drone ${droneId} auto-selected`,
      )
      sessionStorage.removeItem("autoSelectDroneId")
    }
  }

  useEffect(() => {
    if (deliveryDrones.length > 0) {
      const autoSelectId = sessionStorage.getItem("autoSelectDroneId")
      if (autoSelectId) {
        autoSelectDrone(autoSelectId)
      }
    }
  }, [deliveryDrones])

  const fetchDeliveryDrones = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/delivery-drones`)
      const data = await response.json()
      setDeliveryDrones(data)
    } catch (error) {
      console.error("Error fetching delivery drones:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkSourceCoordinatesAndSelect = (drone, action = "select") => {
    if (!drone.source_lat || !drone.source_lng) {
      setPendingDrone(drone)
      setPopupAction(action)
      setShowSourcePopup(true)
      setSourceCoordinates({
        source_lat: "",
        source_lng: "",
      })
    } else {
      if (action === "select") {
        proceedWithDroneSelection(drone)
      } else if (action === "update") {
        handleUpdateSourceCoordinates(drone)
      }
    }
  }

  const handleSourceCoordinatesSubmit = async () => {
    if (!sourceCoordinates.source_lat || !sourceCoordinates.source_lng) {
      alert("Please enter both latitude and longitude coordinates")
      return
    }

    try {
      const response = await fetch(`${API_BASE}/drone-source-coordinates/${pendingDrone.drone_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_lat: Number.parseFloat(sourceCoordinates.source_lat),
          source_lng: Number.parseFloat(sourceCoordinates.source_lng),
        }),
      })

      const result = await response.json()

      if (response.ok) {
        const updatedDrone = {
          ...pendingDrone,
          source_lat: Number.parseFloat(sourceCoordinates.source_lat),
          source_lng: Number.parseFloat(sourceCoordinates.source_lng),
        }

        setDeliveryDrones((prev) => prev.map((d) => (d.drone_id === updatedDrone.drone_id ? updatedDrone : d)))

        setShowSourcePopup(false)
        setPendingDrone(null)
        setSourceCoordinates({ source_lat: "", source_lng: "" })

        if (popupAction === "select") {
          proceedWithDroneSelection(updatedDrone)
        }

        setDeliveryStatus(`Source coordinates updated for drone ${pendingDrone.drone_id}`)
      } else {
        alert(`Failed to update source coordinates: ${result.error}`)
      }
    } catch (error) {
      console.error("Error updating source coordinates:", error)
      alert("Error updating source coordinates. Please try again.")
    }
  }

  const handleUpdateSourceCoordinates = (drone) => {
    setPendingDrone(drone)
    setPopupAction("update")
    setShowSourcePopup(true)
    setSourceCoordinates({
      source_lat: drone.source_lat || "",
      source_lng: drone.source_lng || "",
    })
  }

  const proceedWithDroneSelection = (drone) => {
    setSelectedDrone(drone)
    fetchDroneDetails(drone.drone_id)
  }

  const fetchDroneDetails = async (droneId) => {
    setDetailsLoading(true)

    try {
      const droneResponse = await fetch(`${API_BASE}/drone/${droneId}`)
      const droneData = await droneResponse.json()
      setDroneData(droneData)

      const destinationResponse = await fetch(`${API_BASE}/drone-destination/${droneId}`)
      const destinationData = await destinationResponse.json()

      setDestinationData(destinationData)

      if (destinationData.ddts && destinationData.ddts.length > 0) {
        setDdtFacilities(destinationData.ddts)
        setSelectedDdt(destinationData.ddts[0])
      } else {
        setDdtFacilities([])
        setSelectedDdt(null)
      }
    } catch (error) {
      console.error("Error fetching drone details:", error)
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleDroneSelect = (drone) => {
    checkSourceCoordinatesAndSelect(drone, "select")
    setDeliveryStatus("")
  }

  const handleRackSelect = (rackColumn) => {
    setSelectedRack(rackColumn)

    const rackData = {
      selected_rack: rackColumn,
      ddt_facility: selectedDdt?.name || "",
      drone_id: selectedDrone?.drone_id || "",
      timestamp: new Date().toISOString(),
    }

    localStorage.setItem("selectedRackData", JSON.stringify(rackData))
    setDeliveryStatus(`Selected ${rackColumn.replace("rack_", "Rack ")} at ${selectedDdt?.name || "DDT Facility"}`)
  }

  const handlePackageLaunch = async () => {
    if (!selectedPackage || !selectedDdt || !selectedRack || !destinationData) {
      alert("Please select a package, DDT facility, and rack before launching")
      return
    }

    setLaunchLoading(true)
    setLaunchStatus("Processing")

    try {
      const launchPayload = {
        package_id: selectedPackage,
        ddt_name: selectedDdt.name,
        rack_column: selectedRack,
        latitude: destinationData.destination_lat,
        longitude: destinationData.destination_lng,
      }

      const response = await fetch(`${API_BASE}/launch-package`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(launchPayload),
      })

      const result = await response.json()

      if (response.ok) {
        setControlKey(result.control_key)
        setDeliveryStatus(
          `🚀 Package ${selectedPackage} launched successfully to ${selectedDdt.name} - ${selectedRack.replace("rack_", "Rack ")}. Package will be placed in the DDT rack upon delivery.`,
        )
        setOtpData(null) // Reset OTP data for new launch
        setEmailSent(false) // Reset email sent flag
        console.log("Launch successful:", result)
      } else {
        setLaunchStatus("Failed")
        alert(`Launch failed: ${result.error}`)
      }
    } catch (error) {
      console.error("Error launching package:", error)
      setLaunchStatus("Failed")
      alert("Connection error during launch: " + error.message)
    } finally {
      setLaunchLoading(false)
    }
  }

  const handleResetLaunch = async () => {
    try {
      if (selectedPackage) {
        await fetch(`${API_BASE}/reset-package/${selectedPackage}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            control_key: controlKey,
          }),
        })
      }

      setLaunchStatus("Ready")
      setSelectedPackage("")
      setOtpData(null)
      setEmailSent(false)
      setControlKey("")
      setDeliveryStatus("System reset")
    } catch (error) {
      console.error("Error resetting launch:", error)
    }
  }

  const handleMonitoringRedirect = () => {
    if (selectedDrone) {
      const monitoringData = {
        drone_id: selectedDrone.drone_id,
        selected_rack: selectedRack,
        ddt_facility: selectedDdt?.name || "",
        drone_name: selectedDrone.drone_name,
        timestamp: new Date().toISOString(),
      }

      localStorage.setItem("towerToMonitoringData", JSON.stringify(monitoringData))
      navigate(
        `/monitoring?drone_id=${selectedDrone.drone_id}&selected_rack=${selectedRack}&ddt=${selectedDdt?.name || ""}`,
      )
    }
  }

  const getAvailablePackages = () => {
    if (!droneData) return []

    const packages = []
    if (droneData.gripper_01) packages.push(droneData.gripper_01)
    if (droneData.gripper_02) packages.push(droneData.gripper_02)
    if (droneData.gripper_03) packages.push(droneData.gripper_03)

    return packages
  }

  useEffect(() => {
    return () => {
      localStorage.removeItem("selectedRackData")
      localStorage.removeItem("towerToMonitoringData")
    }
  }, [])

  return (
    <div>
      <nav className="bg-[#171e2a] text-white px-8 py-4 flex justify-between items-center shadow-md w-full">
        <div className="flex items-center gap-2 text-xl font-semibold text-blue-400">
          <img src="/shadowfly.jpg" alt="ShadowFly Logo" className="h-9 w-auto" />
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-md p-2 transition-colors duration-300"
            aria-label="Go back to previous page"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
            <span className="text-lg font-medium">Back Page</span>
          </button>
        </div>
      </nav>

      {/* Source Coordinates Popup */}
      {showSourcePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {popupAction === "update" ? "Update" : "Set"} Source Coordinates
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {popupAction === "update"
                ? `Update source coordinates for drone ${pendingDrone?.drone_id}:`
                : `Drone ${pendingDrone?.drone_id} needs initial point coordinates. Please enter the source location:`}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={sourceCoordinates.source_lat}
                  onChange={(e) =>
                    setSourceCoordinates((prev) => ({
                      ...prev,
                      source_lat: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 40.7128"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={sourceCoordinates.source_lng}
                  onChange={(e) =>
                    setSourceCoordinates((prev) => ({
                      ...prev,
                      source_lng: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., -74.0060"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSourcePopup(false)
                  setPendingDrone(null)
                  setSourceCoordinates({ source_lat: "", source_lng: "" })
                  setPopupAction("")
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSourceCoordinatesSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {popupAction === "update" ? "Update" : "Set"} Coordinates
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <br />
          <br />

          {deliveryStatus && (
            <div className="mb-6 p-4 bg-blue-100 border border-blue-300 rounded-lg">
              <p className="text-blue-800 font-medium">{deliveryStatus}</p>
            </div>
          )}

          {/* Debug Info */}
          <div className="mb-4 p-3 bg-gray-100 border rounded text-sm">
            <strong>Debug:</strong> Selected Rack: {selectedRack || "None"} | Selected Drone:{" "}
            {selectedDrone?.drone_id || "None"} | Status: {launchStatus} | Control Key: {controlKey ? "Set" : "None"} |
            Email Sent: {emailSent ? "Yes" : "No"}
          </div>

          {/* OTP Information Display */}
          {otpData && (
            <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-2">📧 Package Delivered!</h3>
              <p className="text-green-700">
                <strong>Package:</strong> {otpData.package_id}
                <br />
                <strong>Customer Email:</strong> {otpData.mail_id}
                <br />
                <strong>OTP:</strong> {otpData.otp}
                <br />
                <strong>Delivery Rack:</strong>{" "}
                {otpData.rack ? `Rack ${otpData.rack.replace("rack_", "")}` : "Not specified"}
                <br />
                <strong>Email Status:</strong> {emailSent ? "✅ Sent" : "❌ Not Sent"}
                <br />
                <strong>Status:</strong> Package is in DDT rack waiting for customer pickup
              </p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">On Delivery Drones</h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : deliveryDrones.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Drone ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Drone Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Model
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Battery
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source Coords
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {deliveryDrones.map((drone) => (
                      <tr
                        key={drone.drone_id}
                        className={selectedDrone?.drone_id === drone.drone_id ? "bg-blue-50" : ""}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {drone.drone_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{drone.drone_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{drone.model}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{drone.drone_type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{drone.battery_capacity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {drone.source_lat && drone.source_lng ? (
                            <span className="text-green-600 font-medium">✓ Set</span>
                          ) : (
                            <span className="text-red-600 font-medium">⚠ Missing</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDroneSelect(drone)}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                selectedDrone?.drone_id === drone.drone_id
                                  ? "bg-blue-700 text-white"
                                  : "bg-blue-600 hover:bg-blue-700 text-white"
                              }`}
                            >
                              {selectedDrone?.drone_id === drone.drone_id ? "Selected" : "Select"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No drones currently on delivery.</p>
            )}
          </div>

          {detailsLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading drone details...</p>
            </div>
          )}

          {!detailsLoading && droneData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Assigned Drone Information</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Drone ID</p>
                      <p className="font-medium">{droneData.drone_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{droneData.drone_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Model</p>
                      <p className="font-medium">{droneData.model}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-medium">{droneData.drone_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Weight</p>
                      <p className="font-medium">{droneData.weight} kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Max Payload</p>
                      <p className="font-medium">{droneData.max_payload} kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Battery Type</p>
                      <p className="font-medium">{droneData.battery_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Battery Capacity</p>
                      <p className="font-medium">{droneData.battery_capacity}</p>
                    </div>
                  </div>

                  {/* Source Coordinates Display */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-md font-semibold text-gray-700">Source Coordinates</h4>
                      <div className="flex gap-2">
                        {droneData.source_lat && droneData.source_lng && (
                          <button
                            onClick={() => handleUpdateSourceCoordinates(droneData)}
                            className="px-2 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-700">Source Latitude</p>
                        <p className={`mt-1 ${droneData.source_lat ? "text-green-600 font-medium" : "text-red-400"}`}>
                          {droneData.source_lat || "Not Set"}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-700">Source Longitude</p>
                        <p className={`mt-1 ${droneData.source_lng ? "text-green-600 font-medium" : "text-red-400"}`}>
                          {droneData.source_lng || "Not Set"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-md font-semibold text-gray-700 mb-3">Gripper Status</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-700">Gripper 01</p>
                        <p className={`mt-1 ${droneData.gripper_01 ? "text-green-600 font-medium" : "text-gray-400"}`}>
                          {droneData.gripper_01 || "Empty"}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-700">Gripper 02</p>
                        <p className={`mt-1 ${droneData.gripper_02 ? "text-green-600 font-medium" : "text-gray-400"}`}>
                          {droneData.gripper_02 || "Empty"}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-700">Gripper 03</p>
                        <p className={`mt-1 ${droneData.gripper_03 ? "text-green-600 font-medium" : "text-gray-400"}`}>
                          {droneData.gripper_03 || "Empty"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Delivery Configuration</h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Method</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="DDT"
                        checked={deliveryMethod === "DDT"}
                        onChange={(e) => setDeliveryMethod(e.target.value)}
                        className="mr-2"
                      />
                      DDT Delivery
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="Winch"
                        checked={deliveryMethod === "Winch"}
                        onChange={(e) => setDeliveryMethod(e.target.value)}
                        className="mr-2"
                      />
                      Winch Delivery
                    </label>
                  </div>
                </div>

                {/* Package Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Package from Gripper</label>
                  <select
                    value={selectedPackage}
                    onChange={(e) => {
                      setSelectedPackage(e.target.value)
                      setOtpData(null) // Reset OTP data when package changes
                      setEmailSent(false) // Reset email sent flag
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Package</option>
                    {getAvailablePackages().map((packageId, index) => (
                      <option key={index} value={packageId}>
                        {packageId} (Gripper {index + 1})
                      </option>
                    ))}
                  </select>
                </div>

                {deliveryMethod === "DDT" && ddtFacilities.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">DDT Facility</label>
                    <select
                      value={selectedDdt?.id || ""}
                      onChange={(e) => {
                        const ddt = ddtFacilities.find((d) => d.id === Number.parseInt(e.target.value))
                        setSelectedDdt(ddt)
                        setSelectedRack("")
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select DDT Facility</option>
                      {ddtFacilities.map((ddt) => (
                        <option key={ddt.id} value={ddt.id}>
                          {ddt.name} - Available: {ddt.available_count}/{ddt.total_racks || 0} racks
                        </option>
                      ))}
                    </select>

                    {selectedDdt && selectedDdt.total_racks > 0 && (
                      <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm font-medium text-blue-800">DDT Facility Available</p>
                            <p className="text-lg font-bold text-green-600">
                              {selectedDdt.available_count} / {selectedDdt.total_racks}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-blue-800">Status</p>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                selectedDdt.status === "Active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {selectedDdt.status}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-blue-800 mb-2">
                            Select Rack for DDT Delivery
                          </label>
                          {selectedDdt.available_count > 0 ? (
                            <>
                              <div className="grid grid-cols-3 gap-2 mb-3">
                                {Array.from({ length: selectedDdt.total_racks }, (_, i) => {
                                  const rackNumber = i + 1
                                  const rackColumn = `rack_${rackNumber.toString().padStart(2, "0")}`
                                  const isAvailable = selectedDdt[rackColumn] === null
                                  const isSelected = selectedRack === rackColumn

                                  return (
                                    <button
                                      key={rackNumber}
                                      onClick={() => {
                                        if (isAvailable) {
                                          handleRackSelect(rackColumn)
                                        }
                                      }}
                                      disabled={!isAvailable}
                                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                                        isSelected
                                          ? "border-blue-500 bg-blue-100 text-blue-800"
                                          : isAvailable
                                            ? "border-green-300 bg-green-50 text-green-800 hover:border-green-400"
                                            : "border-red-300 bg-red-50 text-red-500 cursor-not-allowed"
                                      }`}
                                    >
                                      <div className="text-center">
                                        <div className="text-2xl mb-1">{isAvailable ? "📦" : "🔒"}</div>
                                        <div>Rack {rackNumber.toString().padStart(2, "0")}</div>
                                        <div className="text-xs">{isAvailable ? "Available" : "Occupied"}</div>
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                              {selectedRack && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <p className="text-sm text-blue-800">
                                    <strong>Selected DDT Rack:</strong> {selectedRack.replace("rack_", "Rack ")} at{" "}
                                    {selectedDdt.name}
                                  </p>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-yellow-800">
                                <strong>No available racks</strong> at this DDT facility.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {deliveryMethod === "Winch" && (
                  <div className="mb-4">
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="text-lg font-semibold text-purple-800 mb-3">Winch Delivery Configuration</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-purple-700 mb-2">Drop Zone Type</label>
                          <select className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="ground">Ground Level</option>
                            <option value="balcony">Balcony/Terrace</option>
                            <option value="rooftop">Rooftop</option>
                            <option value="window">Window Delivery</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-purple-700 mb-2">Winch Cable Length</label>
                          <select className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="5">5 meters</option>
                            <option value="10">10 meters</option>
                            <option value="15">15 meters</option>
                            <option value="20">20 meters</option>
                            <option value="25">25 meters</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {deliveryMethod === "DDT" && ddtFacilities.length === 0 && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      <strong>No DDT facilities found</strong> at destination coordinates.
                    </p>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleMonitoringRedirect}
                    disabled={!selectedDrone}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg mb-4"
                  >
                    🚁 Open Drone Monitoring Dashboard
                  </button>
                  {!selectedDrone && (
                    <p className="text-sm text-gray-500 text-center mt-2">
                      Please select a drone first to access monitoring
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mission Control Section */}
          {selectedDrone && selectedPackage && selectedDdt && selectedRack && (
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">🚀 Mission Control</h2>

                <div
                  className={`status mb-6 p-6 rounded-lg text-xl font-bold ${
                    launchStatus === "Ready"
                      ? "bg-green-100 text-green-800 border-2 border-green-500"
                      : launchStatus === "Processing"
                        ? "bg-orange-100 text-orange-800 border-2 border-orange-500"
                        : launchStatus === "Delivered"
                          ? "bg-green-100 text-green-800 border-2 border-green-500"
                          : "bg-red-100 text-red-800 border-2 border-red-500"
                  }`}
                >
                  {launchStatus === "Ready" && "🟢 Ready"}
                  {launchStatus === "Processing" && (
                    <div className="flex items-center justify-center gap-2">
                      🟡 Processing
                      <div className="inline-block w-5 h-5 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin"></div>
                    </div>
                  )}
                  {launchStatus === "Delivered" && "🟢 Delivered"}
                  {launchStatus === "Failed" && "🔴 Failed"}
                </div>

                <div className="flex gap-4 justify-center mb-4">
                  <button
                    onClick={handlePackageLaunch}
                    disabled={launchLoading || launchStatus === "Processing"}
                    className={`px-8 py-4 text-lg font-semibold rounded-lg transition-colors ${
                      launchLoading || launchStatus === "Processing"
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-red-500 hover:bg-red-600 text-white"
                    }`}
                  >
                    {launchStatus === "Ready"
                      ? "START MISSION"
                      : launchStatus === "Processing"
                        ? "RUNNING..."
                        : launchStatus === "Delivered"
                          ? "START NEW MISSION"
                          : "RETRY MISSION"}
                  </button>

                  {(launchStatus === "Delivered" || launchStatus === "Failed") && (
                    <button
                      onClick={handleResetLaunch}
                      className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                    >
                      RESET
                    </button>
                  )}
                </div>

                {/* Manual OTP Email Button */}
                {launchStatus === "Delivered" && (
                  <div className="mb-4">
                    <button
                      onClick={sendOTPEmailManually}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors mr-4"
                    >
                      📧 {emailSent ? "Resend OTP Email" : "Send OTP Email"}
                    </button>
                    <button
                      onClick={handlePackagePickup}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      📦 Confirm Package Pickup
                    </button>
                  </div>
                )}

                <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                  <p>
                    <strong>Package:</strong> {selectedPackage}
                  </p>
                  <p>
                    <strong>DDT Facility:</strong> {selectedDdt.name}
                  </p>
                  <p>
                    <strong>Rack:</strong> {selectedRack.replace("rack_", "Rack ")}
                  </p>
                  <p>
                    <strong>Control Key:</strong> {controlKey || "Not fetched"}
                  </p>
                  <p>
                    <strong>Package Status:</strong>{" "}
                    {launchStatus === "Delivered" ? "In DDT rack, awaiting pickup" : launchStatus}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Tower
