import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

export default function HomePage() {
  return (
    <main className="min-h-[85vh] bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="flex items-center gap-4 pb-8 border-b border-slate-800/80">
          <BrandLogo size="lg" />
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-lime-400">
              PORTAL DIGITAL RESMI
            </p>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mt-0.5">
              TREX SKATE SCHOOL
            </h1>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Pilih Akses Masuk Portal
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Silakan pilih menu sesuai kebutuhan Anda di bawah ini.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
          <Link
            href="/register"
            className="p-6 rounded-3xl bg-lime-400 hover:bg-lime-300 text-slate-950 transition-all flex flex-col justify-between group shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full bg-slate-950 text-lime-400 text-[11px] font-extrabold tracking-wider uppercase">
                  01 • CALON MURID
                </span>
                <svg className="w-6 h-6 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-slate-950 mt-5">
                Pendaftaran Baru
              </h3>
              <p className="text-xs sm:text-sm text-slate-900/90 mt-2 leading-relaxed">
                Daftarkan putra/putri Anda bergabung di kelas latihan sepatu roda TREX Skate School.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-950/15 flex items-center justify-between text-xs sm:text-sm font-black text-slate-950">
              <span>Isi Formulir Daftar</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          <Link
            href="/parent"
            className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-lime-400/60 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-extrabold tracking-wider uppercase">
                  02 • WALI MURID
                </span>
                <svg className="w-6 h-6 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-white mt-5">
                Masuk Portal Orang Tua
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                Pantau perkembangan skill anak, catatan latihan coach, rekap absensi Sabtu, dan rapor bulanan.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs sm:text-sm font-extrabold text-lime-400">
              <span>Masuk Akun Wali</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          <Link
            href="/admin"
            className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-lime-400/60 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full bg-slate-800 text-lime-400 text-[11px] font-extrabold tracking-wider uppercase">
                  03 • PENGURUS KLUB
                </span>
                <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-white mt-5">
                Admin
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                Kelola data murid, kode klaim wali, jadwal latihan Sabtu, absensi lapangan, dan publikasi rapor.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs sm:text-sm font-extrabold text-white">
              <span>Masuk Dashboard Admin</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
