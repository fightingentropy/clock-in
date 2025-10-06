import { redirect } from "next/navigation";

import LoginForm from "@/components/login-form";
import { getServerSession } from "@/lib/session";

export default async function HomePage() {
  const session = await getServerSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(32,32,32,0.6),_rgba(10,10,10,1))] text-foreground flex items-center justify-center p-6">
      <div className="space-y-6 text-center max-w-lg">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.4em] text-muted-foreground">Timekeeping</p>
          <h1 className="text-4xl font-semibold text-white">Clock In Portal</h1>
          <p className="text-sm text-muted-foreground">
            Track worker hours and manage workplaces effortlessly. Admins can oversee every shift while workers stay focused on the job.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
