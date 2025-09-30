'use client';

import type { Assignment, TimeEntry, Workplace } from '@prisma/client';
import { differenceInMinutes, format, formatDuration, intervalToDuration } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { distanceInMeters } from '@/lib/geoutils';

interface WorkerDashboardProps {
  assignments: (Assignment & { workplace: Workplace })[];
  activeEntry: (TimeEntry & { workplace: Workplace }) | null;
  recentEntries: (TimeEntry & { workplace: Workplace })[];
}

type GeoLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};

export default function WorkerDashboard({ assignments, activeEntry, recentEntries }: WorkerDashboardProps) {
  const router = useRouter();
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState<string>(
    activeEntry?.workplaceId ?? assignments[0]?.workplaceId ?? ''
  );
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clockedInSince, setClockedInSince] = useState(activeEntry?.clockInAt ?? null);
  const [tick, setTick] = useState(0);

  const selectedWorkplace = useMemo(
    () => assignments.find((assignment) => assignment.workplaceId === selectedWorkplaceId)?.workplace ?? null,
    [assignments, selectedWorkplaceId]
  );

  useEffect(() => {
    let watchId: number | null = null;

    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported in this browser.');
      return;
    }

    if (activeEntry) {
      setClockedInSince(activeEntry.clockInAt);
    }

    setIsLocating(true);

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        toast.error(error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000,
      }
    );

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [activeEntry]);

  useEffect(() => {
    if (!activeEntry) {
      setClockedInSince(null);
      return;
    }

    setClockedInSince(activeEntry.clockInAt);
  }, [activeEntry]);

  useEffect(() => {
    if (!clockedInSince) {
      return;
    }

    const timer = setInterval(() => setTick((value) => value + 1), 60000);
    return () => clearInterval(timer);
  }, [clockedInSince, tick]);

  const distanceToWorkplace = useMemo(() => {
    if (!selectedWorkplace || !location) {
      return null;
    }

    return distanceInMeters(
      { latitude: location.latitude, longitude: location.longitude },
      { latitude: selectedWorkplace.latitude, longitude: selectedWorkplace.longitude }
    );
  }, [location, selectedWorkplace]);

  const withinRadius = selectedWorkplace && distanceToWorkplace !== null
    ? distanceToWorkplace <= selectedWorkplace.radiusMeters
    : false;

  async function clock(action: 'IN' | 'OUT') {
    if (!selectedWorkplace) {
      toast.error('Select a workplace first.');
      return;
    }

    if (!location) {
      toast.error('Waiting for location fix.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/worker/clock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          workplaceId: selectedWorkplace.id,
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? 'Unable to update shift.');
        return;
      }

      toast.success(`Clock ${action === 'IN' ? 'in' : 'out'} successful.`);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Unexpected error while updating shift.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const activeDurationLabel = useMemo(() => {
    if (!clockedInSince) {
      return null;
    }

    const duration = intervalToDuration({
      start: new Date(clockedInSince),
      end: new Date(),
    });

    return formatDuration(duration, { delimiter: ', ' });
  }, [clockedInSince]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">Welcome back</h1>
          <p className="text-sm text-neutral-400">Your location helps confirm you are on-site before starting a shift.</p>
        </div>
        <Button variant="outline" onClick={() => signOut({ callbackUrl: '/login' })}>
          Sign out
        </Button>
      </header>

      <section className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <Card className="border-neutral-800 bg-neutral-900/60">
          <CardHeader>
            <CardTitle>Shift controller</CardTitle>
            <CardDescription>Clock in when you arrive and clock out before you leave.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3">
              <Label htmlFor="workplace">Workplace</Label>
              <Select value={selectedWorkplaceId} onValueChange={setSelectedWorkplaceId}>
                <SelectTrigger id="workplace" className="bg-neutral-950/80">
                  <SelectValue placeholder="Select workplace" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 text-neutral-100">
                  {assignments.map((assignment) => (
                    <SelectItem key={assignment.workplaceId} value={assignment.workplaceId}>
                      {assignment.workplace.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedWorkplace ? (
              <div className="grid gap-2 rounded-lg border border-neutral-800 bg-black/40 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Radius</span>
                  <span className="font-medium">{selectedWorkplace.radiusMeters} m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Target</span>
                  <span className="font-medium">
                    {selectedWorkplace.latitude.toFixed(5)}, {selectedWorkplace.longitude.toFixed(5)}
                  </span>
                </div>
                {selectedWorkplace.address ? (
                  <p className="text-neutral-400">{selectedWorkplace.address}</p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-neutral-400">No workplace assigned yet.</p>
            )}

            <div className="grid gap-2 rounded-lg border border-neutral-800 bg-black/40 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Status</span>
                <Badge variant={withinRadius ? 'default' : 'secondary'}>
                  {isLocating ? 'Locating…' : withinRadius ? 'Within radius' : 'Out of range'}
                </Badge>
              </div>
              {location ? (
                <div className="flex flex-col gap-1">
                  <span className="text-neutral-400">Current location</span>
                  <span className="font-medium">
                    {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                  </span>
                  <span className="text-xs text-neutral-500">±{Math.round(location.accuracy)} m accuracy</span>
                  {distanceToWorkplace !== null ? (
                    <span className="text-xs text-neutral-500">
                      {Math.round(distanceToWorkplace)} m from workplace center
                    </span>
                  ) : null}
                </div>
              ) : (
                <p className="text-neutral-500">Grant location access to enable clocking.</p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="flex-1"
                variant={activeEntry ? 'outline' : 'default'}
                disabled={!withinRadius || isSubmitting || Boolean(activeEntry)}
                onClick={() => clock('IN')}
              >
                Clock in
              </Button>
              <Button
                className="flex-1"
                variant="destructive"
                disabled={!withinRadius || isSubmitting || !activeEntry}
                onClick={() => clock('OUT')}
              >
                Clock out
              </Button>
            </div>

            {activeEntry ? (
              <div className="rounded-md border border-emerald-700 bg-emerald-900/20 p-4 text-sm">
                <p className="font-medium">
                  On the clock since {format(new Date(activeEntry.clockInAt), 'p')} at {activeEntry.workplace.name}.
                </p>
                {activeDurationLabel ? (
                  <p className="text-neutral-300">Elapsed time: {activeDurationLabel}</p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-neutral-400">You are currently clocked out.</p>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit border-neutral-800 bg-neutral-900/60">
          <CardHeader>
            <CardTitle>Quick notes</CardTitle>
            <CardDescription>Share anything unusual when you clock out.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="notes">Optional notes</Label>
            <Input id="notes" placeholder="Need a follow-up?" disabled className="bg-neutral-950/80" />
            <p className="text-xs text-neutral-500">
              Notes can be added once the manager enables them. Contact your admin for access.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">Recent activity</h2>
        <div className="grid gap-3">
          {recentEntries.length === 0 ? (
            <p className="text-sm text-neutral-500">No activity recorded yet.</p>
          ) : (
            recentEntries.map((entry) => {
              const durationMinutes = entry.clockOutAt
                ? differenceInMinutes(new Date(entry.clockOutAt), new Date(entry.clockInAt))
                : null;
              return (
                <div
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-black/40 p-4 text-sm"
                >
                  <div>
                    <p className="font-medium">{entry.workplace.name}</p>
                    <p className="text-neutral-400">
                      {format(new Date(entry.clockInAt), 'MMM d, p')} –{' '}
                      {entry.clockOutAt ? format(new Date(entry.clockOutAt), 'p') : 'in progress'}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {durationMinutes !== null ? `${durationMinutes} min` : 'Active'}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
