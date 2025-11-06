import { format, formatDistanceStrict, formatDistanceToNow } from "date-fns";
import { ArrowLeft, BadgeCheck, Building2, Clock, Mail, Phone, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchWorkerDetail } from "@/lib/data";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

const formatHours = (hours: number) => {
  if (!Number.isFinite(hours) || hours <= 0) {
    return "0h";
  }
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  if (minutes === 60) {
    return `${wholeHours + 1}h`;
  }
  if (wholeHours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${wholeHours}h`;
  }
  return `${wholeHours}h ${minutes}m`;
};

const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "MMM d, yyyy • h:mm a");
};

const WorkerDetailPage = async ({
  params,
}: {
  params: Promise<{ workerId: string }>;
}) => {
  const { workerId } = await params;

  await requireAdmin();

  const data = await fetchWorkerDetail(workerId);

  if (!data.profile) {
    notFound();
  }

  const { profile, workplaces, timeEntries, activeEntry, stats } = data;

  const activeSince = activeEntry
    ? formatDistanceToNow(new Date(activeEntry.clock_in_at), { addSuffix: true })
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-foreground">
      <header className="border-b border-white/5 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href="/dashboard?tab=workers">
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
            </Button>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
                Worker profile
              </p>
              <h1 className="text-3xl font-semibold text-white">
                {profile.full_name || profile.email}
              </h1>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="uppercase">
              {profile.role}
            </Badge>
            {activeEntry ? (
              <Badge className="bg-emerald-500/20 text-emerald-300">
                <Clock className="mr-1 h-3 w-3" /> Clocked in
              </Badge>
            ) : (
              <Badge className="bg-slate-500/20 text-slate-200">
                Off shift
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border border-white/5 bg-black/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total hours (last 7 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-white">
                {formatHours(stats.totalHoursPastWeek)}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-white/5 bg-black/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Shifts (last 7 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-white">
                {stats.totalShiftsPastWeek}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-white/5 bg-black/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average shift length
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-white">
                {formatHours(stats.averageShiftDurationHours)}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-white/5 bg-black/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Current status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              {activeEntry ? (
                <>
                  <p className="text-white">Clocked in</p>
                  <p className="flex items-center gap-2 text-xs">
                    <Clock className="h-3 w-3" /> {activeSince}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-white">Off shift</p>
                  <p className="text-xs">
                    Last clock out: {formatDateTime(stats.lastClockOutAt)}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card className="border border-white/5 bg-black/40">
            <CardHeader>
              <CardTitle>Activity timeline</CardTitle>
              <CardDescription>Full history of clock events.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {timeEntries.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Clock in</TableHead>
                      <TableHead>Clock out</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Workplace</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeEntries.map((entry) => {
                      const clockIn = new Date(entry.clock_in_at);
                      const clockOut = entry.clock_out_at ? new Date(entry.clock_out_at) : null;
                      const durationLabel = formatDistanceStrict(
                        clockOut ?? new Date(),
                        clockIn,
                        {
                          roundingMethod: "floor",
                        },
                      );

                      return (
                        <TableRow key={entry.id} className="border-white/5">
                          <TableCell className="text-xs text-muted-foreground">
                            {format(clockIn, "MMM d, yyyy • h:mm a")}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {clockOut ? format(clockOut, "MMM d, yyyy • h:mm a") : "Active"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {durationLabel}
                          </TableCell>
                          <TableCell className="text-sm">
                            {entry.workplaces?.name ?? "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs uppercase">
                              {entry.method}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                            {entry.notes ?? "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No time entries recorded.</p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="border border-white/5 bg-black/40">
              <CardHeader>
                <CardTitle>Contact</CardTitle>
                <CardDescription>Profile details and reachability.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 text-white">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.full_name || "Not set"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{profile.phone ?? "Not provided"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4" />
                  <span>Account created {formatDateTime(profile.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Last clock in: {formatDateTime(stats.lastClockInAt)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-white/5 bg-black/40">
              <CardHeader>
                <CardTitle>Assignments</CardTitle>
                <CardDescription>Workplaces available to this worker.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {workplaces.length ? (
                  workplaces.map((workplace) => (
                    <div
                      key={workplace.id}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-black/30 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-white">{workplace.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {workplace.radius_m}m radius
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No workplace assignments.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
};

export default WorkerDetailPage;

