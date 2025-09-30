'use client';

import type { Assignment, TimeEntry, User, Workplace } from '@prisma/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { differenceInMinutes, format } from 'date-fns';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AdminDashboardProps {
  workers: (User & {
    assignments: (Assignment & { workplace: Workplace })[];
    timeEntries: (TimeEntry & { workplace: Workplace })[];
  })[];
  workplaces: (Workplace & {
    assignments: (Assignment & { user: User })[];
  })[];
  recentEntries: (TimeEntry & { user: User; workplace: Workplace })[];
}

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

export default function AdminDashboard({ workers, workplaces, recentEntries }: AdminDashboardProps) {
  const router = useRouter();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [busyWorkplaceId, setBusyWorkplaceId] = useState<string | null>(null);

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

  const activeWorkers = useMemo(
    () => workers.filter((worker) => worker.timeEntries.some((entry) => !entry.clockOutAt)),
    [workers]
  );

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

  async function assignWorker(workplaceId: string, userId: string) {
    try {
      setBusyWorkplaceId(workplaceId);
      const response = await fetch(`/api/admin/workplaces/${workplaceId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error ?? 'Failed to assign worker.');
        return;
      }

      toast.success('Worker assigned.');
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Unexpected error while assigning worker.');
    } finally {
      setBusyWorkplaceId(null);
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">Operations dashboard</h1>
          <p className="text-sm text-neutral-400">
            Monitor attendance in real time, manage workplaces, and control worker access.
          </p>
        </div>
        <AdminNavigation />
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="border-neutral-800 bg-neutral-900/60">
          <CardHeader>
            <CardDescription>Total workers</CardDescription>
            <CardTitle className="text-3xl">{workers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-neutral-800 bg-neutral-900/60">
          <CardHeader>
            <CardDescription>Active now</CardDescription>
            <CardTitle className="text-3xl">{activeWorkers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-neutral-800 bg-neutral-900/60">
          <CardHeader>
            <CardDescription>Workplaces</CardDescription>
            <CardTitle className="text-3xl">{workplaces.length}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Workplaces</h2>
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
            workplaces.map((workplace) => {
              const assignedIds = new Set(workplace.assignments.map((assignment) => assignment.userId));
              const availableWorkers = workers.filter((worker) => !assignedIds.has(worker.id));

              return (
                <Card key={workplace.id} className="border-neutral-800 bg-neutral-900/60">
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle>{workplace.name}</CardTitle>
                      <CardDescription>
                        {Number(workplace.latitude).toFixed(5)}, {Number(workplace.longitude).toFixed(5)} ·{' '}
                        {workplace.radiusMeters} m radius
                      </CardDescription>
                      {workplace.address ? (
                        <p className="text-sm text-neutral-400">{workplace.address}</p>
                      ) : null}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="border-neutral-700">
                          Manage
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="border-neutral-800 bg-neutral-900 text-neutral-100">
                        <DropdownMenuLabel>Assign worker</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {availableWorkers.length === 0 ? (
                          <DropdownMenuItem disabled>No available workers</DropdownMenuItem>
                        ) : (
                          availableWorkers.map((worker) => (
                            <DropdownMenuItem
                              key={worker.id}
                              onClick={() => assignWorker(workplace.id, worker.id)}
                              disabled={busyWorkplaceId === workplace.id}
                            >
                              {worker.name}
                            </DropdownMenuItem>
                          ))
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
              );
            })
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent shifts</h2>
          <span className="text-sm text-neutral-400">Showing last {recentEntries.length} entries</span>
        </div>
        <Card className="border-neutral-800 bg-neutral-900/60">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-800">
                  <TableHead>Worker</TableHead>
                  <TableHead>Workplace</TableHead>
                  <TableHead className="hidden md:table-cell">Clock in</TableHead>
                  <TableHead className="hidden md:table-cell">Clock out</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-neutral-500">
                      No shifts recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentEntries.map((entry) => {
                    const durationMinutes = entry.clockOutAt
                      ? differenceInMinutes(new Date(entry.clockOutAt), new Date(entry.clockInAt))
                      : null;

                    return (
                      <TableRow key={entry.id} className="border-neutral-900">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{entry.user.name}</span>
                            <span className="text-xs text-neutral-500">{entry.user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>{entry.workplace.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{format(new Date(entry.clockInAt), 'MMM d, p')}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {entry.clockOutAt ? format(new Date(entry.clockOutAt), 'MMM d, p') : 'Active'}
                        </TableCell>
                        <TableCell className="text-right">
                          {durationMinutes !== null ? `${durationMinutes} min` : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <Separator className="border-neutral-900" />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Active workers</h2>
        {activeWorkers.length === 0 ? (
          <p className="text-sm text-neutral-500">No one is clocked in right now.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {activeWorkers.map((worker) => {
              const entry = worker.timeEntries[0];
              if (!entry) return null;
              return (
                <Card key={worker.id} className="border-emerald-800 bg-emerald-900/20">
                  <CardHeader>
                    <CardTitle className="text-lg">{worker.name}</CardTitle>
                    <CardDescription>
                      On-site at {entry.workplace.name} since {format(new Date(entry.clockInAt), 'p')}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
