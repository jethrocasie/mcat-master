import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-violet-950 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-10">
        <span className="text-3xl">🧠</span>
        <span className="text-2xl font-bold text-white">MCAT Master</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl shadow-black/20 p-8">
        {children}
      </div>

      <p className="mt-6 text-slate-500 text-sm text-center">
        © {new Date().getFullYear()} MCAT Master. Study hard. 💪
      </p>
    </div>
  );
}
