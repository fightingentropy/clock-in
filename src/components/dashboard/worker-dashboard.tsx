import { formatDistanceStrict } from "date-fns";
import { Building2, UserRound } from "lucide-react";

import ClockControls from "@/components/clock-controls";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { updateSelfProfileAction } from "@/server/actions/worker";
import type { TimeEntryWithRelations, UserProfile, Workplace } from "@/lib/types";

interface WorkerDashboardProps {
  profile: UserProfile | null;
  workplaces: Workplace[];
  activeEntry: TimeEntryWithRelations | null;
  recentEntries: TimeEntryWithRelations[];
}

const WorkerDashboard = ({ profile, workplaces, activeEntry, recentEntries }: WorkerDashboardProps) => {
  const workplaceNames = workplaces?.map((workplace) => workplace?.name).filter(Boolean) ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-foreground">
      <header className="border-b border-white/5 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-muted-foreground">Worker</p>
            <h1 className="text-3xl font-semibold text-white">Shift Overview</h1>
          </div>
          <Badge variant="outline" className="uppercase">
            {profile?.role}
          </Badge>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
        <section className="grid gap-6 md:grid-cols-[2fr_3fr]">
          <Card className="border border-white/5 bg-black/40">
            <CardHeader>
              <CardTitle>Your profile</CardTitle>
              <CardDescription>Keep your contact details up to date.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateSelfProfileAction} className="grid gap-3">
                <Input
                  name="fullName"
                  placeholder="Full name"
                  defaultValue={profile?.full_name ?? ""}
                />
                <Input name="phone" placeholder="Phone" defaultValue={profile?.phone ?? ""} />
                <Button type="submit">Save changes</Button>
              </form>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <UserRound className="h-4 w-4" />
                  <span>{profile?.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <ClockControls hasActiveShift={Boolean(activeEntry)} workplaceNames={workplaceNames} />
        </section>

        <Card className="border border-white/5 bg-black/40">
          <CardHeader>
            <CardTitle>Assigned workplaces</CardTitle>
            <CardDescription>Locations you are allowed to clock into.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {workplaces?.length ? (
              workplaces.map((workplace) => (
                <div
                  key={workplace.id}
                  className="grid gap-2 rounded-lg border border-white/5 bg-black/30 p-4"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium text-white">{workplace.name}</h3>
                    <Badge variant="outline">{workplace.radius_m}m</Badge>
                  </div>
                  {workplace.description ? (
                    <p className="text-sm text-muted-foreground">{workplace.description}</p>
                  ) : null}
                  <div className="text-xs font-mono text-muted-foreground">
                    {workplace.latitude}, {workplace.longitude}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">You have no workplaces assigned.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-white/5 bg-black/40">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Last recorded clock events.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {recentEntries?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workplace</TableHead>
                    <TableHead>Clock in</TableHead>
                    <TableHead>Clock out</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEntries.map((entry) => {
                    const clockIn = new Date(entry.clock_in_at);
                    const clockOut = entry.clock_out_at ? new Date(entry.clock_out_at) : null;
                    const duration = clockOut
                      ? formatDistanceStrict(clockOut, clockIn, { roundingMethod: "floor" })
                      : "-";
                    return (
                      <TableRow key={entry.id} className="border-white/5">
                        <TableCell className="text-sm">{entry.workplaces?.name ?? "-"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {clockIn.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {clockOut ? clockOut.toLocaleString() : "Active"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{duration}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No time entries found.</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default WorkerDashboard;
