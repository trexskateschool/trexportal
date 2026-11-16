export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white px-6 py-12 text-center">
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-lime-400 text-xs font-extrabold tracking-wider uppercase">
        <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
        Fase 1 • Tahap 1 Aktif (src/)
      </div>

      <h1 className="text-3xl sm:text-5xl font-black tracking-tight mt-5">
        TREX <span className="text-lime-400">SKATE SCHOOL</span>
      </h1>

      <p className="text-slate-300 mt-3 max-w-md text-sm sm:text-base leading-relaxed">
        Fondasi Next.js, TypeScript, dan Tailwind CSS dengan struktur folder{" "}
        <code className="text-lime-400 font-mono">src/</code> sudah aktif.
      </p>

      <div className="mt-8 px-5 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
        Jadwal Latihan Rutin:{" "}
        <strong className="text-white">Sabtu, 16.00 – 18.00 WIB</strong>
      </div>
    </main>
  );
}
