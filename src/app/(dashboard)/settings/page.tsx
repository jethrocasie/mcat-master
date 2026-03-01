"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const settingsSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  examDate: z.string().optional(),
  emailNotifications: z.boolean(),
  studyReminderTime: z.string(),
  timezone: z.string(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export default function SettingsPage() {
  const supabase = createClient();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      emailNotifications: true,
      studyReminderTime: "09:00",
      timezone: "America/New_York",
    },
  });

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("display_name, exam_date, email_notifications, study_reminder_time, timezone")
        .eq("id", user.id)
        .single();

      if (data) {
        reset({
          displayName: data.display_name ?? "",
          examDate: data.exam_date ?? "",
          emailNotifications: data.email_notifications ?? true,
          studyReminderTime: data.study_reminder_time?.slice(0, 5) ?? "09:00",
          timezone: data.timezone ?? "America/New_York",
        });
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  async function onSubmit(data: SettingsForm) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profiles").update({
      display_name: data.displayName,
      exam_date: data.examDate || null,
      email_notifications: data.emailNotifications,
      study_reminder_time: data.studyReminderTime + ":00",
      timezone: data.timezone,
    }).eq("id", user.id);

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const emailNotifications = watch("emailNotifications");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-slate-400 text-sm">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Customize your study experience</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Profile */}
        <Card className="p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Profile</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Display Name
            </label>
            <input
              {...register("displayName")}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
            />
            {errors.displayName && (
              <p className="mt-1 text-xs text-red-500">{errors.displayName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              MCAT Exam Date
            </label>
            <input
              {...register("examDate")}
              type="date"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
            />
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-700">Daily Digest Email</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Cards due, streak, weak topics
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register("emailNotifications")}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {emailNotifications && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Reminder Time
                </label>
                <input
                  {...register("studyReminderTime")}
                  type="time"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Timezone
                </label>
                <select
                  {...register("timezone")}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace("_", " ").replace("/", " / ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </Card>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            loading={isSubmitting}
            className="flex-1"
          >
            Save Settings
          </Button>
          {saved && (
            <span className="text-green-600 text-sm font-medium">
              ✓ Saved!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
