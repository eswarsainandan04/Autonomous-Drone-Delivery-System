import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; // Using useParams to get warehouseName from URL
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faWarehouse, faPlane, faBox } from '@fortawesome/free-solid-svg-icons';

// API URL for the Flask backend
const API_URL = 'http://localhost:5028';

const WarehouseDetails = () => {
  // Use useParams to get the warehouseName from the URL
  // Assumes the route is defined like /warehouse/:warehouseName
  const { warehouseName } = useParams();
  const navigate = useNavigate();

  const [warehouseInfo, setWarehouseInfo] = useState(null);
  const [droneAssignments, setDroneAssignments] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Function to fetch all warehouse details
    const fetchWarehouseDetails = async () => {
      setLoading(true);
      setError(null);

      if (!warehouseName) {
        setError("Warehouse name not provided in URL.");
        setLoading(false);
        return;
      }

      try {
        // Fetch warehouse basic info (assuming you have an endpoint for this,
        // or you can derive it from drone assignments if they contain lat/lng)
        // For now, we'll just use the name for display and fetch assignments/packages.
        // If you need full warehouse object, you'd need a /get_warehouse_by_name endpoint.
        // For simplicity, we'll set a dummy warehouseInfo object.
        setWarehouseInfo({ name: decodeURIComponent(warehouseName) });

        // Fetch drone assignments
        const assignmentsResponse = await fetch(`${API_URL}/get_drone_assignments_by_warehouse_name/${encodeURIComponent(warehouseName)}`);
        if (!assignmentsResponse.ok) {
          throw new Error(`Failed to fetch drone assignments: ${assignmentsResponse.statusText}`);
        }
        const assignmentsData = await assignmentsResponse.json();
        setDroneAssignments(assignmentsData);

        // Fetch packages
        const packagesResponse = await fetch(`${API_URL}/get_packages_by_warehouse_name/${encodeURIComponent(warehouseName)}`);
        if (!packagesResponse.ok) {
          throw new Error(`Failed to fetch packages: ${packagesResponse.statusText}`);
        }
        const packagesData = await packagesResponse.json();
        setPackages(packagesData);

      } catch (err) {
        console.error("Error fetching warehouse details:", err);
        setError(`Failed to load warehouse details: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouseDetails();
  }, [warehouseName]); // Re-run effect if warehouseName changes

  const handleBack = () => {
    navigate(-1); // Navigate back to the AdminDashboard
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="bg-white p-6 rounded-lg shadow-lg flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-700">Loading warehouse details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-100 text-red-800 p-4">
        <p className="text-lg font-semibold mb-4">Error: {error}</p>
        <button
          onClick={handleBack}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col bg-slate-50">
      <nav className="bg-slate-800 text-white px-4 sm:px-8 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2 text-lg sm:text-xl font-semibold text-blue-400">
          <FontAwesomeIcon icon={faWarehouse} />
          Warehouse Details: {warehouseInfo?.name || 'N/A'}
        </div>
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-white hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-md p-2 transition-colors duration-300"

        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span className="hidden sm:inline">Back</span>
        </button>
      </nav>

      <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
        <div className="bg-white p-6 rounded-lg shadow-xl mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
            <FontAwesomeIcon icon={faPlane} className="text-blue-500" />
            Drone Assignments
          </h2>
          {droneAssignments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latitude</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Longitude</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drone ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drone Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {droneAssignments.map((assignment, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{assignment.name || 'N/A'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{assignment.latitude || 'N/A'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{assignment.longitude || 'N/A'}</td>

                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{assignment.drone_id || 'N/A'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{assignment.drone_name || 'N/A'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{assignment.status || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No drone assignments found for this warehouse.</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
            <FontAwesomeIcon icon={faBox} className="text-green-500" />
            Available Packages 
          </h2>
          {packages.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {packages.map((pkg, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{pkg.package_id || 'N/A'}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{pkg.last_update_time || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No packages found for this warehouse.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WarehouseDetails;