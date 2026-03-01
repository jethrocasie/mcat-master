import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-violet-950 text-white">
      {/* Nav */}
      <nav className="container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧠</span>
          <span className="text-xl font-bold">MCAT Master</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-slate-300 hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="container mx-auto px-6 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-8">
          <span>🔥</span>
          <span>968 MCAT flashcards • Spaced repetition • Gamified</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Study smarter.
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">
            Ace the MCAT.
          </span>
        </h1>

        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12">
          Evidence-based spaced repetition + Duolingo-style gamification. Track
          your weak spots, build streaks, and walk into exam day confident.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-600/30"
          >
            Start studying free →
          </Link>
          <Link
            href="/login"
            className="text-slate-400 hover:text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-colors border border-slate-700 hover:border-slate-500"
          >
            I have an account
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-16">
          {[
            "🔁 SM-2 Spaced Repetition",
            "📊 Weak Topic Heatmap",
            "🏆 Achievement Badges",
            "🔥 Streak Tracking",
            "📝 Quiz Mode",
            "📧 Daily Reminders",
          ].map((feature) => (
            <span
              key={feature}
              className="bg-slate-800/60 border border-slate-700 text-slate-300 px-4 py-2 rounded-full text-sm"
            >
              {feature}
            </span>
          ))}
        </div>
      </main>

      {/* Stats section */}
      <section className="border-t border-slate-800 py-20">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { value: "968", label: "Flashcards", sub: "Bio/Biochem, Psych/Soc & more" },
            { value: "SM-2", label: "Algorithm", sub: "Same as Anki, proven effective" },
            { value: "12wk", label: "Study Plan", sub: "Structured for your exam date" },
          ].map(({ value, label, sub }) => (
            <div key={label} className="p-8">
              <div className="text-4xl font-bold text-blue-400 mb-2">{value}</div>
              <div className="text-xl font-semibold text-white mb-1">{label}</div>
              <div className="text-slate-500 text-sm">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-800 py-8 text-center text-slate-600 text-sm">
        <p>Built with ❤️ for the MCAT student who means business.</p>
      </footer>
    </div>
  );
}
