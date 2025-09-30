'use client';

import type { Assignment, User, Workplace } from '@prisma/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { AdminNavigation } from '@/components/admin/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type WorkerWithAssignments = User & {
  assignments: (Assignment & { workplace: Workplace })[];
};

interface AdminWorkerDirectoryProps {
  workers: WorkerWithAssignments[];
  workplaces: Workplace[];
}

const workerFormSchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  email: z.string().email('Enter a valid email.'),
  workplaceIds: z.array(z.string()),
});

type WorkerForm = z.infer<typeof workerFormSchema>;

export function AdminWorkerDirectory({ workers, workplaces }: AdminWorkerDirectoryProps) {
  const router = useRouter();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerWithAssignments | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<WorkerForm>({
    resolver: zodResolver(workerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      workplaceIds: [],
    },
  });

  function closeDialog() {
    setDialogOpen(false);
    setSelectedWorker(null);
    form.reset({ name: '', email: '', workplaceIds: [] });
  }

  function openDialog(worker: WorkerWithAssignments) {
    setSelectedWorker(worker);
    form.reset({
      name: worker.name,
      email: worker.email,
      workplaceIds: worker.assignments.map((assignment) => assignment.workplaceId),
    });
    setDialogOpen(true);
  }

  async function onSubmit(values: WorkerForm) {
    if (!selectedWorker) return;

    try {
      setIsSaving(true);
      const response = await fetch(`/api/admin/workers/${selectedWorker.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error ?? 'Failed to update worker.');
        return;
      }

      toast.success('Worker updated.');
      closeDialog();
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Unexpected error while updating worker.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">Worker directory</h1>
          <p className="text-sm text-neutral-400">
            Update worker profiles and manage workplace assignments in one place.
          </p>
        </div>
        <AdminNavigation />
      </header>

      <Card className="border-neutral-800 bg-neutral-900/60">
        <CardHeader>
          <CardTitle>Directory</CardTitle>
          <CardDescription>All registered workers and their current workplace assignments.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-neutral-800">
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Workplaces</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-neutral-500">
                    No workers have been added yet.
                  </TableCell>
                </TableRow>
              ) : (
                workers.map((worker) => (
                  <TableRow key={worker.id} className="border-neutral-900">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{worker.name}</span>
                        <span className="text-xs text-neutral-500 md:hidden">{worker.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{worker.email}</TableCell>
                    <TableCell>
                      {worker.assignments.length === 0 ? (
                        <Badge variant="secondary">Unassigned</Badge>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {worker.assignments.map((assignment) => (
                            <Badge key={assignment.id} variant="secondary">
                              {assignment.workplace.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openDialog(worker)}>
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          }
        }}
      >
        <DialogContent className="border-neutral-800 bg-neutral-900 text-neutral-100">
          <DialogHeader>
            <DialogTitle>{selectedWorker ? selectedWorker.name : 'Manage worker'}</DialogTitle>
            <DialogDescription>Adjust contact details and assign workplaces.</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input className="bg-neutral-950/80" placeholder="Full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" className="bg-neutral-950/80" placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="workplaceIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workplace assignments</FormLabel>
                    <div className="grid gap-2 rounded-lg border border-neutral-800 bg-black/40 p-4 text-sm">
                      {workplaces.length === 0 ? (
                        <p className="text-neutral-500">Create a workplace before assigning workers.</p>
                      ) : (
                        workplaces.map((workplace) => {
                          const checked = field.value?.includes(workplace.id) ?? false;
                          return (
                            <label key={workplace.id} className="flex items-center gap-3">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(next) => {
                                  const nextValue = field.value ?? [];
                                  if (next === true) {
                                    field.onChange(Array.from(new Set([...nextValue, workplace.id])));
                                  } else {
                                    field.onChange(nextValue.filter((id) => id !== workplace.id));
                                  }
                                }}
                              />
                              <span>{workplace.name}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
