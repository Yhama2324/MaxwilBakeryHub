import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface GoogleMapsAddressProps {
  value: string;
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  label?: string;
  placeholder?: string;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function GoogleMapsAddress({
  value,
  onChange,
  label = "Delivery Address",
  placeholder = "Enter your delivery address"
}: GoogleMapsAddressProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [apiKey, setApiKey] = useState<string>("");

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        const config = await response.json();
        setApiKey(config.GOOGLE_MAPS_API_KEY);
      } catch (error) {
        console.error('Failed to fetch config:', error);
      }
    };

    fetchConfig();
  }, []);

  useEffect(() => {
    if (!apiKey) return;

    const loadGoogleMapsAPI = () => {
      if (window.google && window.google.maps) {
        setIsMapLoaded(true);
        initializeAutocomplete();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;

      window.initMap = () => {
        setIsMapLoaded(true);
        initializeAutocomplete();
      };

      document.head.appendChild(script);
    };

    loadGoogleMapsAPI();
  }, [apiKey]);

  const initializeAutocomplete = () => {
    if (!inputRef.current || !window.google) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'ph' }, // Restrict to Philippines
      fields: ['address_components', 'formatted_address', 'geometry'],
      types: ['address']
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      
      if (place.geometry && place.geometry.location) {
        const coords = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        setCoordinates(coords);
        onChange(place.formatted_address || '', coords);
      } else {
        onChange(place.formatted_address || '');
      }
    });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCoordinates(coords);

        // Reverse geocode to get address
        if (window.google && window.google.maps) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: coords }, (results: any, status: any) => {
            if (status === 'OK' && results[0]) {
              onChange(results[0].formatted_address, coords);
            }
          });
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your current location. Please enter your address manually.');
      }
    );
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="delivery-address" className="flex items-center space-x-2">
        <MapPin className="h-4 w-4" />
        <span>{label}</span>
      </Label>
      
      <div className="flex space-x-2">
        <Input
          ref={inputRef}
          id="delivery-address"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={getCurrentLocation}
          className="px-3"
          title="Use current location"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>
      
      {coordinates && (
        <div className="text-xs text-green-600 flex items-center space-x-1">
          <MapPin className="h-3 w-3" />
          <span>Location verified: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}</span>
        </div>
      )}
      
      {!isMapLoaded && (
        <div className="text-xs text-gray-500">Loading address suggestions...</div>
      )}
    </div>
  );
}