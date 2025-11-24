"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Default icon fix for React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Custom icon for user location
const userIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icon for hospitals
const hospitalIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Hospital {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  website?: string;
  specialties?: { name: string }[];
  latitude: number;
  longitude: number;
}

interface HospitalMapProps {
  hospitals: Hospital[];
  userLocation: { lat: number; lng: number } | null;
  radius?: number;
}

export default function HospitalMap({ hospitals, userLocation, radius = 10000 }: HospitalMapProps) {
  const defaultPosition: [number, number] = [20.5937, 78.9629]; // India center as fallback
  const mapRef = useRef<any>(null);

  // Adjust map view when hospitals or user location changes
  useEffect(() => {
    if (mapRef.current && hospitals.length > 0) {
      const bounds = L.latLngBounds(
        hospitals.map(h => [h.latitude, h.longitude] as [number, number])
      );
      
      if (userLocation) {
        bounds.extend([userLocation.lat, userLocation.lng]);
      }
      
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    } else if (mapRef.current && userLocation) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 13);
    }
  }, [hospitals, userLocation]);

  const center: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lng]
    : hospitals.length > 0
    ? [hospitals[0].latitude, hospitals[0].longitude]
    : defaultPosition;

  return (
    <div style={{ height: "70vh", width: "100%" }}>
      <MapContainer 
        center={center} 
        zoom={userLocation ? 13 : 6} 
        style={{ height: "100%", width: "100%", borderRadius: "8px" }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        
        {/* User location marker */}
        {userLocation && (
          <>
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userIcon}
            >
              <Popup>
                <strong>📍 Your Location</strong>
              </Popup>
            </Marker>
            {/* Circle showing search radius */}
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={radius}
              pathOptions={{ 
                color: 'blue', 
                fillColor: 'blue', 
                fillOpacity: 0.1 
              }}
            />
          </>
        )}

        {/* Hospital markers */}
        {hospitals.map((hospital, index) => (
          <Marker
            key={hospital.id || index}
            position={[hospital.latitude, hospital.longitude]}
            icon={hospitalIcon}
          >
            <Popup>
              <div style={{ minWidth: "200px" }}>
                <strong style={{ fontSize: "16px" }}>🏥 {hospital.name}</strong>
                <br />
                {hospital.address && (
                  <>
                    <strong>Address:</strong> {hospital.address}
                    <br />
                  </>
                )}
                {hospital.city && (
                  <>
                    <strong>City:</strong> {hospital.city}
                    <br />
                  </>
                )}
                {hospital.state && (
                  <>
                    <strong>State:</strong> {hospital.state}
                    <br />
                  </>
                )}
                {hospital.phone && (
                  <>
                    <strong>Phone:</strong> {hospital.phone}
                    <br />
                  </>
                )}
                {hospital.website && (
                  <>
                    <strong>Website:</strong>{" "}
                    <a href={hospital.website} target="_blank" rel="noopener noreferrer" style={{ color: "blue" }}>
                      Visit
                    </a>
                    <br />
                  </>
                )}
                {hospital.specialties && hospital.specialties.length > 0 && (
                  <>
                    <strong>Specialties:</strong>{" "}
                    {hospital.specialties.map(s => s.name).join(", ")}
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
