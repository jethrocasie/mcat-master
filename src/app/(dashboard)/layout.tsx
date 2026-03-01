import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import type { Profile } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Create profile if first login
  if (!profile) {
    await supabase.from("profiles").insert({
      id: user.id,
      display_name:
        user.user_metadata?.display_name ??
        user.email?.split("@")[0] ??
        "Student",
      exam_date: user.user_metadata?.exam_date ?? null,
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <TopNav profile={profile as Profile | null} />

      {/* Main content — offset for sidebar on desktop, top nav on mobile */}
      <main className="md:ml-56 pt-[57px] md:pt-0 min-h-screen">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
