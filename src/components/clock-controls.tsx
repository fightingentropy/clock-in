"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlarmClockCheck, Loader2, MapPin, Power } from "lucide-react";

import { workerClockIn, workerClockOut } from "@/server/actions/worker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ClockControlsProps {
  hasActiveShift: boolean;
  workplaceNames: string[];
}

const ClockControls = ({ hasActiveShift, workplaceNames }: ClockControlsProps) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isGeoPending, setGeoPending] = useState(false);

  const handleClockIn = () => {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported in this browser.");
      return;
    }
    setGeoPending(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoPending(false);
        const { latitude, longitude } = position.coords;
        startTransition(async () => {
          try {
            await workerClockIn({ latitude, longitude });
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Clock in failed");
          }
        });
      },
      () => {
        setGeoPending(false);
        setError("Location permission is required to clock in.");
      },
      { enableHighAccuracy: true },
    );
  };

  const handleClockOut = () => {
    setError(null);
    startTransition(async () => {
      try {
        await workerClockOut();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Clock out failed");
      }
    });
  };

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-black/30 p-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Shift status</p>
        <div className="flex items-center gap-3 text-lg font-semibold text-white">
          {hasActiveShift ? (
            <>
              <AlarmClockCheck className="h-5 w-5 text-emerald-400" />
              <span>Clocked in</span>
            </>
          ) : (
            <>
              <Power className="h-5 w-5 text-muted-foreground" />
              <span>Off shift</span>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {workplaceNames.map((name) => (
            <Badge key={name} variant="outline" className="text-xs">
              <MapPin className="mr-1 h-3 w-3" /> {name}
            </Badge>
          ))}
        </div>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="flex gap-3">
        {hasActiveShift ? (
          <Button
            type="button"
            variant="secondary"
            onClick={handleClockOut}
            disabled={isPending}
            className="flex-1"
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Clocking out...
              </span>
            ) : (
              "Clock out"
            )}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleClockIn}
            disabled={isPending || isGeoPending}
            className="flex-1"
          >
            {isPending || isGeoPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Locating...
              </span>
            ) : (
              "Clock in"
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ClockControls;
