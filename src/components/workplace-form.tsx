"use client";

import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

import { upsertWorkplaceAction } from "@/server/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function WorkplaceForm() {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleGetCurrentLocation = () => {
    setLocationError(null);

    if (!("geolocation" in navigator)) {
      setLocationError("Geolocation is not supported in this browser.");
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString());
        setLongitude(position.coords.longitude.toString());
        setIsGettingLocation(false);
        setLocationError(null);
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location permission denied. Please enable location access.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out.");
            break;
          default:
            setLocationError("An unknown error occurred while getting location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <form action={upsertWorkplaceAction} className="grid gap-3">
      <Input name="name" placeholder="Name" required />
      <Textarea
        name="description"
        placeholder="Description (optional)"
        rows={3}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-muted-foreground">
            Location Coordinates
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGetCurrentLocation}
            disabled={isGettingLocation}
            className="text-xs"
          >
            {isGettingLocation ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Getting location...
              </>
            ) : (
              <>
                <MapPin className="mr-1 h-3 w-3" />
                Use my location
              </>
            )}
          </Button>
        </div>

        {locationError && (
          <p className="text-xs text-red-500">{locationError}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            name="latitude"
            type="number"
            step="any"
            placeholder="Latitude"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            required
          />
          <Input
            name="longitude"
            type="number"
            step="any"
            placeholder="Longitude"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            required
          />
        </div>
      </div>

      <Input
        name="radius_m"
        type="number"
        min={10}
        defaultValue={50}
        placeholder="Radius meters"
        required
      />

      <Button type="submit" className="mt-2">
        Save workplace
      </Button>
    </form>
  );
}
