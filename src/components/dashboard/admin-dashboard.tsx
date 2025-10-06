import { formatDistanceToNow } from "date-fns";
import { Users, Building2, Clock, MapPin } from "lucide-react";

import type {
  TimeEntryWithRelations,
  WorkerWithAssignments,
  Workplace,
} from "@/lib/types";
import SignOutButton from "@/components/sign-out-button";
import {
  assignWorkerAction,
  createWorkerAction,
  deleteWorkplaceAction,
  removeAssignmentAction,
  upsertWorkplaceAction,
  adminClockAction,
} from "@/server/actions/admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

interface AdminDashboardProps {
  workers: WorkerWithAssignments[];
  workplaces: Workplace[];
  openEntries: Array<{
    worker_id: string;
    workplace_id: string | null;
    clock_in_at: string;
  }>;
  recentEntries: TimeEntryWithRelations[];
}

const AdminDashboard = ({
  workers,
  workplaces,
  openEntries,
  recentEntries,
}: AdminDashboardProps) => {
  const openMap = new Map<
    string,
    { worker_id: string; workplace_id: string | null; clock_in_at: string }
  >();
  openEntries?.forEach((entry) => {
    openMap.set(entry.worker_id, entry);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-foreground">
      <header className="border-b border-white/5 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-4">
            <svg
              width="48"
              height="48"
              viewBox="0 0 512 512"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="flex-shrink-0"
            >
              <line
                x1="60"
                y1="180"
                x2="140"
                y2="180"
                stroke="currentColor"
                strokeWidth="12"
                strokeLinecap="round"
                className="text-white/60"
              />
              <line
                x1="70"
                y1="230"
                x2="150"
                y2="230"
                stroke="currentColor"
                strokeWidth="12"
                strokeLinecap="round"
                className="text-white/60"
              />
              <line
                x1="80"
                y1="280"
                x2="160"
                y2="280"
                stroke="currentColor"
                strokeWidth="12"
                strokeLinecap="round"
                className="text-white/60"
              />
              <line
                x1="70"
                y1="330"
                x2="150"
                y2="330"
                stroke="currentColor"
                strokeWidth="12"
                strokeLinecap="round"
                className="text-white/60"
              />
              <line
                x1="60"
                y1="380"
                x2="140"
                y2="380"
                stroke="currentColor"
                strokeWidth="12"
                strokeLinecap="round"
                className="text-white/60"
              />
              <line
                x1="80"
                y1="430"
                x2="160"
                y2="430"
                stroke="currentColor"
                strokeWidth="12"
                strokeLinecap="round"
                className="text-white/60"
              />
              <circle
                cx="320"
                cy="305"
                r="180"
                fill="white"
                stroke="currentColor"
                strokeWidth="16"
                className="text-white"
              />
              <rect
                x="300"
                y="80"
                width="40"
                height="30"
                rx="4"
                fill="currentColor"
                className="text-white"
              />
              <rect
                x="290"
                y="110"
                width="60"
                height="20"
                rx="6"
                fill="currentColor"
                className="text-white"
              />
              <line
                x1="320"
                y1="145"
                x2="320"
                y2="165"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                className="text-zinc-900"
              />
              <line
                x1="400"
                y1="225"
                x2="380"
                y2="225"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                className="text-zinc-900"
              />
              <line
                x1="320"
                y1="465"
                x2="320"
                y2="445"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                className="text-zinc-900"
              />
              <line
                x1="240"
                y1="225"
                x2="260"
                y2="225"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                className="text-zinc-900"
              />
              <line
                x1="380"
                y1="180"
                x2="365"
                y2="190"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                className="text-zinc-900"
              />
              <line
                x1="410"
                y1="265"
                x2="390"
                y2="265"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                className="text-zinc-900"
              />
              <line
                x1="380"
                y1="350"
                x2="365"
                y2="340"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                className="text-zinc-900"
              />
              <line
                x1="340"
                y1="430"
                x2="340"
                y2="410"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                className="text-zinc-900"
              />
              <line
                x1="260"
                y1="430"
                x2="260"
                y2="410"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                className="text-zinc-900"
              />
              <line
                x1="220"
                y1="350"
                x2="235"
                y2="340"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                className="text-zinc-900"
              />
              <line
                x1="210"
                y1="265"
                x2="230"
                y2="265"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                className="text-zinc-900"
              />
              <line
                x1="220"
                y1="180"
                x2="235"
                y2="190"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                className="text-zinc-900"
              />
              <line
                x1="320"
                y1="305"
                x2="375"
                y2="220"
                stroke="currentColor"
                strokeWidth="10"
                strokeLinecap="round"
                className="text-zinc-900"
              />
              <circle
                cx="320"
                cy="305"
                r="12"
                fill="currentColor"
                className="text-zinc-900"
              />
            </svg>
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-muted-foreground">
                Admin
              </p>
              <h1 className="text-3xl font-semibold text-white">Ops Console</h1>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{workers?.length ?? 0} workers</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>{workplaces?.length ?? 0} workplaces</span>
            </div>
            <SignOutButton variant="ghost" size="sm" />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <section className="grid gap-6 md:grid-cols-2">
          <Card className="border border-white/5 bg-black/40">
            <CardHeader>
              <CardTitle>Create worker</CardTitle>
              <CardDescription>
                Provision a new worker or admin account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createWorkerAction} className="grid gap-3">
                <Input name="fullName" placeholder="Full name" required />
                <Input name="email" type="email" placeholder="Email" required />
                <Input
                  name="password"
                  type="password"
                  placeholder="Temporary password"
                  required
                />
                <Input name="phone" placeholder="Phone (optional)" />
                <div className="grid gap-2">
                  <label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Role
                  </label>
                  <select
                    name="role"
                    defaultValue="worker"
                    className="rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm"
                  >
                    <option value="worker">Worker</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Assign to workplace (optional)
                  </label>
                  <select
                    name="workplaceId"
                    defaultValue=""
                    className="rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm"
                  >
                    <option value="">None</option>
                    {workplaces?.map((workplace) => (
                      <option key={workplace.id} value={workplace.id}>
                        {workplace.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit" className="mt-2">
                  Create
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border border-white/5 bg-black/40">
            <CardHeader>
              <CardTitle>Create workplace</CardTitle>
              <CardDescription>
                Define a location workers can clock into.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={upsertWorkplaceAction} className="grid gap-3">
                <Input name="name" placeholder="Name" required />
                <Textarea
                  name="description"
                  placeholder="Description (optional)"
                  rows={3}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    name="latitude"
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    required
                  />
                  <Input
                    name="longitude"
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    required
                  />
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
            </CardContent>
          </Card>
        </section>

        <Card className="border border-white/5 bg-black/40">
          <CardHeader>
            <CardTitle>Workplaces</CardTitle>
            <CardDescription>
              Manage geofenced locations available to workers.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {workplaces?.length ? (
              workplaces.map((workplace) => (
                <div
                  key={workplace.id}
                  className="grid gap-2 rounded-lg border border-white/5 bg-black/30 p-4 md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium text-white">
                        {workplace.name}
                      </h3>
                      <Badge variant="outline">
                        {workplace.radius_m}m radius
                      </Badge>
                    </div>
                    {workplace.description ? (
                      <p className="text-sm text-muted-foreground">
                        {workplace.description}
                      </p>
                    ) : null}
                    <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{Number(workplace.latitude).toFixed(5)}</span>
                      <span>/</span>
                      <span>{Number(workplace.longitude).toFixed(5)}</span>
                    </div>
                  </div>
                  <form
                    action={deleteWorkplaceAction}
                    className="justify-self-end"
                  >
                    <input type="hidden" name="id" value={workplace.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      className="text-xs text-destructive hover:text-destructive"
                    >
                      Delete
                    </Button>
                  </form>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No workplaces defined yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-white/5 bg-black/40">
          <CardHeader>
            <CardTitle>Workers</CardTitle>
            <CardDescription>
              Assignments, roles, and live status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Assignments</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workers?.map((worker) => {
                    const assignments = (worker.worker_assignments || [])
                      .map((assignment) => assignment.workplaces)
                      .filter((item): item is Workplace => Boolean(item));
                    const primaryWorkplace = assignments[0];
                    const active = openMap.get(worker.user_id);
                    return (
                      <TableRow key={worker.user_id} className="border-white/5">
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-white">
                              {worker.full_name || worker.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {worker.email}
                            </p>
                            <Badge
                              variant="outline"
                              className="text-xs uppercase"
                            >
                              {worker.role}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {assignments.length ? (
                              assignments.map((workplace) => (
                                <form
                                  key={`${worker.user_id}-${workplace.id}`}
                                  action={removeAssignmentAction}
                                  className="flex items-center gap-2 rounded border border-white/10 bg-black/30 px-2 py-1"
                                >
                                  <input
                                    type="hidden"
                                    name="workerId"
                                    value={worker.user_id}
                                  />
                                  <input
                                    type="hidden"
                                    name="workplaceId"
                                    value={workplace.id}
                                  />
                                  <span>{workplace.name}</span>
                                  <button
                                    type="submit"
                                    className="text-muted-foreground hover:text-white"
                                  >
                                    ×
                                  </button>
                                </form>
                              ))
                            ) : (
                              <span className="text-muted-foreground">
                                No assignment
                              </span>
                            )}
                          </div>
                          <form
                            action={assignWorkerAction}
                            className="mt-2 flex items-center gap-2 text-xs"
                          >
                            <input
                              type="hidden"
                              name="workerId"
                              value={worker.user_id}
                            />
                            <select
                              name="workplaceId"
                              className="flex-1 rounded-md border border-white/10 bg-transparent px-2 py-1"
                              defaultValue=""
                            >
                              <option value="">Assign workplace</option>
                              {workplaces?.map((workplace) => (
                                <option key={workplace.id} value={workplace.id}>
                                  {workplace.name}
                                </option>
                              ))}
                            </select>
                            <Button type="submit" variant="outline" size="sm">
                              Assign
                            </Button>
                          </form>
                        </TableCell>
                        <TableCell>
                          {active ? (
                            <div className="flex flex-col gap-1 text-xs text-emerald-400">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Clocked in
                              </span>
                              <span>
                                {formatDistanceToNow(
                                  new Date(active.clock_in_at),
                                  { addSuffix: true },
                                )}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Off shift
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-2">
                            <form
                              action={adminClockAction}
                              className="flex gap-2 text-xs"
                            >
                              <input
                                type="hidden"
                                name="workerId"
                                value={worker.user_id}
                              />
                              <select
                                name="workplaceId"
                                className="rounded-md border border-white/10 bg-transparent px-2 py-1"
                                defaultValue={primaryWorkplace?.id || ""}
                              >
                                <option value="">Select workplace</option>
                                {assignments.map((workplace) => (
                                  <option
                                    key={workplace.id}
                                    value={workplace.id}
                                  >
                                    {workplace.name}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="hidden"
                                name="action"
                                value="clock-in"
                              />
                              <Button
                                type="submit"
                                variant="secondary"
                                size="sm"
                                disabled={!primaryWorkplace}
                              >
                                Clock in
                              </Button>
                            </form>
                            <form
                              action={adminClockAction}
                              className="flex gap-2 text-xs"
                            >
                              <input
                                type="hidden"
                                name="workerId"
                                value={worker.user_id}
                              />
                              <input
                                type="hidden"
                                name="workplaceId"
                                value={primaryWorkplace?.id || ""}
                              />
                              <input
                                type="hidden"
                                name="action"
                                value="clock-out"
                              />
                              <Button
                                type="submit"
                                variant="ghost"
                                size="sm"
                                disabled={!primaryWorkplace}
                              >
                                Clock out
                              </Button>
                            </form>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-white/5 bg-black/40">
          <CardHeader>
            <CardTitle>Recent time entries</CardTitle>
            <CardDescription>
              Chronological log of clock activity.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {recentEntries?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Workplace</TableHead>
                    <TableHead>Clock in</TableHead>
                    <TableHead>Clock out</TableHead>
                    <TableHead>Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEntries.map((entry) => (
                    <TableRow key={entry.id} className="border-white/5">
                      <TableCell>
                        <div className="text-xs">
                          <p className="font-medium text-white">
                            {entry.worker?.full_name || entry.worker?.email}
                          </p>
                          <p className="text-muted-foreground">
                            {entry.worker?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {entry.workplaces?.name ?? "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(entry.clock_in_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {entry.clock_out_at
                          ? new Date(entry.clock_out_at).toLocaleString()
                          : "Active"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs uppercase">
                          {entry.method}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">
                No time entries found.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
