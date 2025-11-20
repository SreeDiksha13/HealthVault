import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Default icon fix for React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
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

const HospitalMap = ({ hospitals, userLocation }) => {
  const defaultPosition = [20.5937, 78.9629]; // India center as fallback
  const mapRef = useRef(null);

  // Adjust map view when hospitals or user location changes
  useEffect(() => {
    if (mapRef.current && hospitals.length > 0) {
      const bounds = L.latLngBounds(
        hospitals.map(h => [h.latitude, h.longitude])
      );
      
      if (userLocation) {
        bounds.extend([userLocation.lat, userLocation.lng]);
      }
      
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    } else if (mapRef.current && userLocation) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 13);
    }
  }, [hospitals, userLocation]);

  const center = userLocation 
    ? [userLocation.lat, userLocation.lng]
    : hospitals.length > 0
    ? [hospitals[0].latitude, hospitals[0].longitude]
    : defaultPosition;

  return (
    <div style={{ height: "80vh", width: "100%" }}>
      <MapContainer 
        center={center} 
        zoom={userLocation ? 13 : 6} 
        style={{ height: "100%", width: "100%" }}
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
              radius={10000} // This should match the radius from Dashboard
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
};

export default HospitalMap;
