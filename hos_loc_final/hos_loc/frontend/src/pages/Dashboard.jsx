import { useEffect, useState } from "react";
import axios from "axios";
import HospitalMap from "../components/HospitalMap";

const Dashboard = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [radius, setRadius] = useState(10000); // 10km default
  const [userLocation, setUserLocation] = useState(null);

  // Fetch states for dropdown
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/hospitals/filters/states");
        setStates(res.data);
      } catch (error) {
        console.error("Error fetching states:", error);
      }
    };
    fetchStates();
  }, []);

  // Fetch cities when state changes
  useEffect(() => {
    const fetchCities = async () => {
      if (!selectedState) {
        setCities([]);
        setSelectedCity(""); // Reset city when state is cleared
        return;
      }
      try {
        const res = await axios.get(
          `http://localhost:4000/api/hospitals/filters/cities?state=${selectedState}`
        );
        setCities(res.data);
      } catch (error) {
        console.error("Error fetching cities:", error);
      }
    };
    fetchCities();
  }, [selectedState]);

  // Fetch hospitals based on filters
  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (selectedState) params.append("state", selectedState);
      if (selectedCity) params.append("city", selectedCity);
      if (userLocation) {
        params.append("lat", userLocation.lat);
        params.append("lng", userLocation.lng);
        params.append("radius", radius);
      }
      // Remove limit to show ALL hospitals
      params.append("limit", 100000);

      const res = await axios.get(
        `http://localhost:4000/api/hospitals?${params.toString()}`
      );
      setHospitals(res.data.hospitals || []);
    } catch (error) {
      console.error("Error fetching hospitals:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get user's current location
  const getNearbyHospitals = () => {
    if ("geolocation" in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          // Fetch will happen automatically via useEffect
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to get your location. Please enable location services.");
          setLoading(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }
  };

  // Fetch hospitals when filters change
  useEffect(() => {
    fetchHospitals();
  }, [selectedState, selectedCity, userLocation, radius]);

  const handleReset = () => {
    setSelectedState("");
    setSelectedCity("");
    setUserLocation(null);
    setRadius(10000);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🏥 Hospital Location Dashboard</h2>
      
      {/* Results count */}
      <div style={{ 
        marginBottom: "20px", 
        padding: "10px 15px", 
        background: "#f0f0f0", 
        borderRadius: "8px" 
      }}>
        <p style={{ margin: 0 }}><strong>Showing:</strong> {hospitals.length.toLocaleString()} hospitals</p>
      </div>

      {/* Filter Panel */}
      <div style={{ 
        marginBottom: "20px", 
        padding: "20px", 
        background: "#fff", 
        border: "1px solid #ddd",
        borderRadius: "8px" 
      }}>
        <h3>🔍 Filter Hospitals</h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "15px" }}>
          {/* State filter */}
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              State
            </label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedCity(""); // Reset city when state changes
              }}
              style={{ 
                width: "100%", 
                padding: "8px", 
                borderRadius: "4px", 
                border: "1px solid #ccc" 
              }}
            >
              <option value="">All States</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          {/* City filter */}
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              City
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              disabled={!selectedState}
              style={{ 
                width: "100%", 
                padding: "8px", 
                borderRadius: "4px", 
                border: "1px solid #ccc" 
              }}
            >
              <option value="">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Radius (for nearby search) */}
          {userLocation && (
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Radius (meters)
              </label>
              <select
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                style={{ 
                  width: "100%", 
                  padding: "8px", 
                  borderRadius: "4px", 
                  border: "1px solid #ccc" 
                }}
              >
                <option value="1000">1 km</option>
                <option value="5000">5 km</option>
                <option value="10000">10 km</option>
                <option value="25000">25 km</option>
                <option value="50000">50 km</option>
              </select>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={getNearbyHospitals}
            style={{
              padding: "10px 20px",
              background: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            📍 Hospitals Near Me
          </button>
          
          <button
            onClick={handleReset}
            style={{
              padding: "10px 20px",
              background: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            🔄 Reset Filters
          </button>
        </div>

        {userLocation && (
          <p style={{ marginTop: "10px", color: "#4CAF50" }}>
            📍 Showing hospitals near your location ({userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)})
          </p>
        )}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <p>Loading hospitals...</p>
        </div>
      )}

      {/* Map */}
      <HospitalMap hospitals={hospitals} userLocation={userLocation} />
    </div>
  );
};

export default Dashboard;
