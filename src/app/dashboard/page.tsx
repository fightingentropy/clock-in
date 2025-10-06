import { redirect } from "next/navigation";

import AdminDashboard from "@/components/dashboard/admin-dashboard";
import WorkerDashboard from "@/components/dashboard/worker-dashboard";
import { fetchAdminData, fetchWorkerData } from "@/lib/data";
import { requireProfile } from "@/lib/session";

const DashboardPage = async () => {
  let profileBundle;
  try {
    profileBundle = await requireProfile();
  } catch {
    redirect("/");
  }

  const { profile } = profileBundle!;

  if (profile.role === "admin") {
    const data = await fetchAdminData();
    return (
      <AdminDashboard
        workers={data.workers ?? []}
        workplaces={data.workplaces ?? []}
        openEntries={data.openEntries ?? []}
        recentEntries={data.recentEntries ?? []}
      />
    );
  }

  const workerData = await fetchWorkerData(profile.user_id);

  return (
    <WorkerDashboard
      profile={workerData.profile}
      workplaces={workerData.workplaces}
      activeEntry={workerData.activeEntry}
      recentEntries={workerData.recentEntries ?? []}
    />
  );
};

export default DashboardPage;
