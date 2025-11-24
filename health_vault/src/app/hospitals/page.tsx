"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";

// Import map component dynamically to avoid SSR issues
const HospitalMap = dynamic(() => import("@/components/HospitalMap"), {
  ssr: false,
  loading: () => <div className="h-96 flex items-center justify-center">Loading map...</div>
});

interface Hospital {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  phone?: string;
  website?: string;
  specialties?: { name: string }[];
  latitude: number;
  longitude: number;
}

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [radius, setRadius] = useState(10000); // 10km default
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch states for dropdown
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/hospitals/filters/states");
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
        setSelectedCity("");
        return;
      }
      try {
        const res = await axios.get(
          `http://localhost:5000/api/hospitals/filters/cities?state=${selectedState}`
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
        params.append("lat", userLocation.lat.toString());
        params.append("lng", userLocation.lng.toString());
        params.append("radius", radius.toString());
      }
      params.append("limit", "100000");

      const res = await axios.get(
        `http://localhost:5000/api/hospitals?${params.toString()}`
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-cyan-100">
      <Header />
      
      <main className="flex-grow p-6 pb-20">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">🏥 Hospital Location Dashboard</h1>
        
        {/* Results count */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
          <p className="text-lg font-semibold">
            Showing: <span className="text-blue-600">{hospitals.length.toLocaleString()}</span> hospitals
          </p>
        </div>

        {/* Filter Panel */}
        <div className="mb-6 p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">🔍 Filter Hospitals</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* State filter */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700">State</label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedCity("");
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block mb-2 font-semibold text-gray-700">City</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                disabled={!selectedState}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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
                <label className="block mb-2 font-semibold text-gray-700">Radius</label>
                <select
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={getNearbyHospitals}
              className="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors font-semibold"
            >
              📍 Hospitals Near Me
            </button>
            
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition-colors font-semibold"
            >
              🔄 Reset Filters
            </button>
          </div>

          {userLocation && (
            <p className="mt-4 text-green-600 font-medium">
              📍 Showing hospitals near your location ({userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)})
            </p>
          )}
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-600">Loading hospitals...</p>
          </div>
        )}

        {/* Map */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <HospitalMap hospitals={hospitals} userLocation={userLocation} radius={radius} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
