'use client';

import type { Assignment, User, Workplace } from '@prisma/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { AdminNavigation } from '@/components/admin/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

type WorkplaceWithAssignments = Workplace & {
  assignments: (Assignment & { user: User })[];
};

const numericString = (label: string, min: number, max: number) =>
  z
    .string()
    .refine((value) => value.trim().length > 0, `${label} is required.`)
    .refine((value) => !Number.isNaN(Number(value)), `${label} must be a number.`)
    .refine((value) => {
      const asNumber = Number(value);
      return asNumber >= min && asNumber <= max;
    }, `${label} must be between ${min} and ${max}.`);

const workplaceSchema = z.object({
  name: z.string().min(2),
  latitude: numericString('Latitude', -90, 90),
  longitude: numericString('Longitude', -180, 180),
  radiusMeters: numericString('Radius', 10, 1000),
  address: z.string().optional(),
});

type WorkplaceForm = z.infer<typeof workplaceSchema>;

interface AdminWorkplaceManagementProps {
  workplaces: WorkplaceWithAssignments[];
}

export function AdminWorkplaceManagement({ workplaces }: AdminWorkplaceManagementProps) {
  const router = useRouter();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [busyWorkplaceId, setBusyWorkplaceId] = useState<string | null>(null);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [editingWorkplace, setEditingWorkplace] = useState<WorkplaceWithAssignments | null>(null);
  const [isSavingWorkplace, setSavingWorkplace] = useState(false);
  const [isDeletingWorkplace, setDeletingWorkplace] = useState(false);
  const [isLocating, setLocating] = useState(false);

  const workplaceDefaults: WorkplaceForm = {
    name: '',
    latitude: '',
    longitude: '',
    radiusMeters: '50',
    address: '',
  };

  const form = useForm<WorkplaceForm>({
    resolver: zodResolver(workplaceSchema),
    defaultValues: workplaceDefaults,
  });

  const editForm = useForm<WorkplaceForm>({
    resolver: zodResolver(workplaceSchema),
    defaultValues: workplaceDefaults,
  });

  async function populateFromCurrentLocation() {
    if (isLocating) return;

    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      toast.error('Geolocation is not supported in this browser.');
      return;
    }

    setLocating(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude, longitude } = position.coords;
      const latitudeString = latitude.toFixed(6);
      const longitudeString = longitude.toFixed(6);

      form.setValue('latitude', latitudeString, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      form.setValue('longitude', longitudeString, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });

      toast.success('Location captured from this device.');
    } catch (error) {
      let message = 'Unable to retrieve current location.';

      if (error && typeof error === 'object' && 'code' in error) {
        const geoError = error as GeolocationPositionError;
        if (geoError.code === geoError.PERMISSION_DENIED) {
          message = 'Location permission denied. Allow access and try again.';
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          message = 'Current location is unavailable. Try again in a moment.';
        } else if (geoError.code === geoError.TIMEOUT) {
          message = 'Timed out while fetching location. Try again.';
        }
      }

      toast.error(message);
    } finally {
      setLocating(false);
    }
  }

  async function createWorkplace(values: WorkplaceForm) {
    try {
      const payload = {
        name: values.name,
        latitude: Number(values.latitude),
        longitude: Number(values.longitude),
        radiusMeters: Number(values.radiusMeters),
        address: values.address?.trim() ? values.address : undefined,
      };

      const response = await fetch('/api/admin/workplaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error ?? 'Failed to create workplace.');
        return;
      }

      toast.success('Workplace created.');
      setDialogOpen(false);
      form.reset(workplaceDefaults);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Unexpected error while creating workplace.');
    }
  }

  async function removeAssignment(workplaceId: string, userId: string) {
    try {
      setBusyWorkplaceId(workplaceId);
      const response = await fetch(`/api/admin/workplaces/${workplaceId}/assign?userId=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error ?? 'Failed to remove assignment.');
        return;
      }

      toast.success('Assignment removed.');
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Unexpected error while removing assignment.');
    } finally {
      setBusyWorkplaceId(null);
    }
  }

  function openEditDialog(workplace: WorkplaceWithAssignments) {
    setEditingWorkplace(workplace);
    editForm.reset({
      name: workplace.name,
      latitude: String(workplace.latitude),
      longitude: String(workplace.longitude),
      radiusMeters: String(workplace.radiusMeters),
      address: workplace.address ?? '',
    });
    setEditDialogOpen(true);
  }

  function closeEditDialog() {
    setEditDialogOpen(false);
    setEditingWorkplace(null);
    editForm.reset(workplaceDefaults);
  }

  async function updateWorkplace(values: WorkplaceForm) {
    if (!editingWorkplace) return;

    try {
      setSavingWorkplace(true);
      const payload = {
        name: values.name,
        latitude: Number(values.latitude),
        longitude: Number(values.longitude),
        radiusMeters: Number(values.radiusMeters),
        address: values.address?.trim() ? values.address : undefined,
      };

      const response = await fetch(`/api/admin/workplaces/${editingWorkplace.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error ?? 'Failed to update workplace.');
        return;
      }

      toast.success('Workplace updated.');
      closeEditDialog();
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Unexpected error while updating workplace.');
    } finally {
      setSavingWorkplace(false);
    }
  }

  async function deleteWorkplace() {
    if (!editingWorkplace) return;

    const confirmed = window.confirm('Delete this workplace? This action cannot be undone.');
    if (!confirmed) return;

    try {
      setDeletingWorkplace(true);
      const response = await fetch(`/api/admin/workplaces/${editingWorkplace.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error ?? 'Failed to delete workplace.');
        return;
      }

      toast.success('Workplace deleted.');
      closeEditDialog();
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Unexpected error while deleting workplace.');
    } finally {
      setDeletingWorkplace(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">Workplaces</h1>
          <p className="text-sm text-neutral-400">Manage geofenced worksites and worker access.</p>
        </div>
        <AdminNavigation />
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">All workplaces</h2>
          <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create workplace</Button>
            </DialogTrigger>
            <DialogContent className="border-neutral-800 bg-neutral-900 text-neutral-100">
              <DialogHeader>
                <DialogTitle>New workplace</DialogTitle>
                <DialogDescription>Provide coordinates and optional label for the geofence center.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form className="grid gap-4" onSubmit={form.handleSubmit(createWorkplace)}>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Warehouse A" className="bg-neutral-950/80" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium text-neutral-300">Coordinates</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={populateFromCurrentLocation}
                        disabled={isLocating}
                      >
                        {isLocating ? 'Locating...' : 'Use current location'}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="latitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Latitude</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.00001" placeholder="40.7128" className="bg-neutral-950/80" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="longitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Longitude</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.00001" placeholder="-74.0060" className="bg-neutral-950/80" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name="radiusMeters"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Radius (m)</FormLabel>
                        <FormControl>
                          <Input type="number" step="1" placeholder="50" className="bg-neutral-950/80" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" className="bg-neutral-950/80" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Save workplace</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {workplaces.length === 0 ? (
            <p className="text-sm text-neutral-500">No workplaces yet. Create one to start assigning workers.</p>
          ) : (
            workplaces.map((workplace) => (
              <Card key={workplace.id} className="border-neutral-800 bg-neutral-900/60">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>{workplace.name}</CardTitle>
                    <CardDescription>
                      {Number(workplace.latitude).toFixed(5)}, {Number(workplace.longitude).toFixed(5)} · {workplace.radiusMeters} m
                      radius
                    </CardDescription>
                    {workplace.address ? (
                      <p className="text-sm text-neutral-400">{workplace.address}</p>
                    ) : null}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-neutral-700"
                    onClick={() => openEditDialog(workplace)}
                  >
                    Manage
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-neutral-400">Assigned workers</p>
                  <div className="flex flex-wrap gap-2">
                    {workplace.assignments.length === 0 ? (
                      <Badge variant="secondary">No one assigned</Badge>
                    ) : (
                      workplace.assignments.map((assignment) => (
                        <Badge key={assignment.id} variant="secondary" className="gap-2">
                          {assignment.user.name}
                          <button
                            type="button"
                            className="rounded bg-neutral-800 px-1 text-xs text-neutral-300 hover:bg-neutral-700"
                            onClick={() => removeAssignment(workplace.id, assignment.userId)}
                            disabled={busyWorkplaceId === workplace.id}
                          >
                            ×
                          </button>
                        </Badge>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeEditDialog();
          }
        }}
      >
        <DialogContent className="border-neutral-800 bg-neutral-900 text-neutral-100">
          <DialogHeader>
            <DialogTitle>{editingWorkplace ? `Edit ${editingWorkplace.name}` : 'Edit workplace'}</DialogTitle>
            <DialogDescription>Update location details or delete the workplace.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form className="grid gap-4" onSubmit={editForm.handleSubmit(updateWorkplace)}>
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Warehouse A" className="bg-neutral-950/80" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={editForm.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.00001" placeholder="40.7128" className="bg-neutral-950/80" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.00001" placeholder="-74.0060" className="bg-neutral-950/80" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="radiusMeters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Radius (m)</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" placeholder="50" className="bg-neutral-950/80" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" className="bg-neutral-950/80" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={deleteWorkplace}
                  disabled={isDeletingWorkplace || isSavingWorkplace}
                >
                  {isDeletingWorkplace ? 'Deleting…' : 'Delete workplace'}
                </Button>
                <Button type="submit" disabled={isSavingWorkplace || isDeletingWorkplace}>
                  {isSavingWorkplace ? 'Saving…' : 'Save changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
