import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faWarehouse, 
  faArrowLeft, 
  faMapMarkerAlt, 
  faLocationDot 
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const WarehouseSelection = () => {
  const [warehouses, setWarehouses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = () => {
    const storedWarehouses = JSON.parse(localStorage.getItem('warehouses') || '[]');
    setWarehouses(storedWarehouses);
  };

  const selectWarehouse = (warehouseId) => {
    const selectedWarehouse = warehouses.find(w => w.id === warehouseId);
    if (selectedWarehouse) {
      localStorage.setItem('selectedWarehouse', JSON.stringify(selectedWarehouse));
      navigate('/drone');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-slate-800 text-white px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <FontAwesomeIcon icon={faWarehouse} />
          ShadowFly - Warehouse Selection
        </div>
        <button 
          onClick={() => navigate('/drone')}
          className="flex items-center gap-2 px-5 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-all duration-300 hover:-translate-y-0.5"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Back to Drone Management
        </button>
      </nav>

      {/* Content */}
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
          {warehouses.length === 0 ? (
            <div className="col-span-full text-center p-8 bg-white rounded-lg shadow">
              <h2 className="text-slate-800 text-xl font-semibold mb-4">No Warehouses Available</h2>
              <p className="text-slate-500">Please add warehouses in the admin dashboard first.</p>
            </div>
          ) : (
            warehouses.map(warehouse => (
              <div 
                key={warehouse.id}
                className="bg-white rounded-lg p-6 shadow hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                <div className="text-3xl text-blue-600 mb-4">
                  <FontAwesomeIcon icon={faWarehouse} />
                </div>
                <div className="text-xl font-semibold text-slate-800 mb-2">
                  {warehouse.cityName}
                </div>
                <div className="bg-slate-50 rounded-lg p-3 mb-4">
                  <div className="text-slate-600 text-sm mb-2">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 mr-2 text-blue-600" />
                    {warehouse.name}
                  </div>
                  <div className="text-slate-600 text-sm">
                    <FontAwesomeIcon icon={faLocationDot} className="w-4 mr-2 text-blue-600" />
                    Lat: {warehouse.lat.toFixed(4)}<br />
                    Lng: {warehouse.lng.toFixed(4)}
                  </div>
                </div>
                <button 
                  onClick={() => selectWarehouse(warehouse.id)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300"
                >
                  Select Warehouse
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WarehouseSelection; 