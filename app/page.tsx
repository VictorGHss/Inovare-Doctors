import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { AnimatedSection } from "./components/AnimatedSection";
import { getClinicConfig, getDoctors } from "@/lib/doctors";

export const dynamic = "force-static";

export default function HomePage() {
  const doctors = getDoctors();
  const clinic = getClinicConfig();

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-5 pb-16 pt-10">
      <AnimatedSection>
        <div className="section-card flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/80 p-2">
              <Image src="/Logo.png" alt="Inovare" width={64} height={64} className="h-12 w-12 object-contain" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">Inovare – Serviços de Saúde</p>
              <h1 className="text-3xl font-semibold leading-tight text-ink">Corpo clínico</h1>
              <p className="text-sm text-gray-600">Perfis otimizados para mobile e QR Code.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="#medicos" className="btn-primary">
              Ver médicos
            </a>
            <a href={clinic.google.mapsUrl || "#"} className="btn-ghost" target="_blank" rel="noopener noreferrer">
              Ver clínica no Maps
            </a>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.05}>
        <div className="section-card p-6">
          <p className="text-sm uppercase tracking-wide text-amber-800">Endereço</p>
          <p className="mt-1 text-lg font-medium text-ink">{clinic.address}</p>
          {clinic.google.mapsUrl && (
            <a
              className="btn-primary mt-4 inline-flex"
              href={clinic.google.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir no Maps
            </a>
          )}
        </div>
      </AnimatedSection>

      <div id="medicos" className="grid gap-4 sm:grid-cols-2">
        {doctors.map((doctor, idx) => (
          <AnimatedSection key={doctor.slug} delay={0.07 + idx * 0.05}>
            <Link
              href={`/medicos/${doctor.slug}` as Route}
              className="section-card block h-full p-5 transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-amber-700">Especialista</p>
                  <h2 className="text-xl font-semibold text-ink">{doctor.name}</h2>
                  {doctor.crm && <p className="text-sm text-gray-600">{doctor.crm}</p>}
                </div>
                <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-amber-900">
                  {doctor.active === false ? "Indisponível" : "Atendendo"}
                </span>
              </div>
              {doctor.specialties?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {doctor.specialties.slice(0, 3).map((spec) => (
                    <span key={spec} className="chip">
                      {spec}
                    </span>
                  ))}
                </div>
              ) : null}
              {doctor.bio && <p className="mt-4 text-sm text-gray-700">{doctor.bio}</p>}
            </Link>
          </AnimatedSection>
        ))}
      </div>
    </main>
  );
}
