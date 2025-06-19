import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  placeholder = "Enter your delivery address"
}: AddressInputProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not available",
        description: "Your browser doesn't support location services",
        variant: "destructive"
      });
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCoordinates(coords);

        try {
          // Use OpenStreetMap's Nominatim service for reverse geocoding (free)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`
          );
          
          if (response.ok) {
            const data = await response.json();
            const address = data.display_name || `${coords.lat}, ${coords.lng}`;
            onChange(address, coords);
            
            toast({
              title: "Location found",
              description: "Your current location has been detected",
              variant: "default"
            });
          } else {
            onChange(`${coords.lat}, ${coords.lng}`, coords);
          }
        } catch (error) {
          // Fallback to coordinates if reverse geocoding fails
          onChange(`${coords.lat}, ${coords.lng}`, coords);
          toast({
            title: "Location detected",
            description: "Using your GPS coordinates",
            variant: "default"
          });
        }

        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        let message = "Unable to get your location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access denied. Please enable location services.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out.";
            break;
        }

        toast({
          title: "Location error",
          description: message,
          variant: "destructive"
        });
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
      <Label htmlFor="delivery-address" className="flex items-center space-x-2">
        <MapPin className="h-4 w-4" />
        <span>{label}</span>
      </Label>
      
      <div className="space-y-2">
        <div className="flex space-x-2">
          <Textarea
            id="delivery-address"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1"
            rows={3}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="px-3 h-auto self-start"
            title="Use current location"
          >
            {isGettingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {coordinates && (
          <div className="text-xs text-green-600 flex items-center space-x-1">
            <MapPin className="h-3 w-3" />
            <span>GPS location: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}</span>
          </div>
        )}
      </div>
      
      <p className="text-xs text-gray-500">
        Include street, barangay, city, and landmarks for accurate delivery
      </p>
    </div>
  );
}