import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlane,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';

const Racks = () => {
  // State variables
  const [currentDDT, setCurrentDDT] = useState(null);
  const [racks, setRacks] = useState([]);

  // Load data when component mounts
  useEffect(() => {
    loadDDTData();
    createRacks();
  }, []);

  // Load DDT data from localStorage
  const loadDDTData = () => {
    const ddtId = sessionStorage.getItem('currentDDT');
    if (!ddtId) {
      window.location.href = '/admin-dashboard';
      return;
    }

    // Get DDT data from localStorage
    const ddts = JSON.parse(localStorage.getItem('ddts') || '[]');
    const ddt = ddts.find(d => d.id === parseInt(ddtId));
    
    if (!ddt) {
      window.location.href = '/admin-dashboard';
      return;
    }

    setCurrentDDT(ddt);
  };

  // Create racks data
  const createRacks = () => {
    const newRacks = [];
    for (let i = 1; i <= 4; i++) {
      // Randomly set rack status for demonstration
      const isEmpty = Math.random() > 0.5;
      
      newRacks.push({
        id: i,
        number: i,
        isEmpty: isEmpty
      });
    }
    setRacks(newRacks);
  };

  // Handle back button click
  const handleBack = () => {
    window.location.href = '/admin-dashboard';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="bg-navbar text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <FontAwesomeIcon icon={faPlane} />
          ShadowFly - DDT Racks
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 px-5 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to Dashboard
          </button>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto p-8">
        {currentDDT && (
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-text mb-2">
              DDT <span className="text-primary">{currentDDT.name}</span>
            </h2>
            <p className="text-gray-500">
              Location: {currentDDT.lat.toFixed(6)}, {currentDDT.lng.toFixed(6)}
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
          {racks.map(rack => (
            <div 
              key={rack.id} 
              className="bg-white rounded-lg p-8 text-center shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
            >
              <div className="text-xl font-semibold mb-4">Rack {rack.number}</div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                rack.isEmpty 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {rack.isEmpty ? 'Empty' : 'Full'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Racks; 