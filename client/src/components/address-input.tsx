import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";

interface AddressInputProps {
  value: string;
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  label?: string;
  placeholder?: string;
}

export default function AddressInput({
  value,
  onChange,
  label = "Delivery Address",
  placeholder = "Enter your complete delivery address"
}: AddressInputProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use reverse geocoding with a free service
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          
          if (response.ok) {
            const data = await response.json();
            const address = data.display_name || `${latitude}, ${longitude}`;
            onChange(address, { lat: latitude, lng: longitude });
          } else {
            // Fallback to coordinates
            const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            onChange(address, { lat: latitude, lng: longitude });
          }
        } catch (error) {
          // Fallback to coordinates if reverse geocoding fails
          const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          onChange(address, { lat: latitude, lng: longitude });
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = "Unable to get your location.";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enter your address manually.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable. Please enter your address manually.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please enter your address manually.";
            break;
        }
        
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="address">{label}</Label>
      <div className="flex space-x-2">
        <Input
          id="address"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          title="Use current location"
        >
          {isGettingLocation ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-gray-500">
        Click the location button to automatically get your current address, or type it manually.
      </p>
    </div>
  );
}