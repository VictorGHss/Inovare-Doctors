import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AnimatedSection } from "@/app/components/AnimatedSection";
import { ReviewsSection } from "@/app/components/ReviewsSection";
import { getClinicConfig, getDoctorBySlug, getDoctorSlugs, getGoogleInfo } from "@/lib/doctors";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return getDoctorSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doctor = getDoctorBySlug(slug);
  const clinic = getClinicConfig();
  const siteBaseUrl = process.env.SITE_BASE_URL || "https://medicos-test.ctrls.dev.br";

  if (!doctor) {
    return {
      title: "Médico não encontrado | Inovare – Serviços de Saúde"
    };
  }

  const specialty = doctor.specialties?.[0];
  const description =
    doctor.bio?.slice(0, 150) ||
    `${doctor.name}${specialty ? ` – ${specialty}` : ""} | ${clinic.name}`;
  const image = doctor.photos?.[0] || "/Logo.png";
  const title = `${doctor.name}${specialty ? ` | ${specialty}` : ""} | Inovare`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [image],
      url: `${siteBaseUrl}/medicos/${doctor.slug}`,
      siteName: clinic.name
    }
  };
}

const contactLabel = (value: string) => value.replace("https://", "").replace("http://", "");

const sanitizeTel = (value: string) => value.replace(/[^\d+]/g, "");

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <AnimatedSection delay={0.05} className="section-card p-6">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
    </div>
    <div className="mt-3 text-sm text-gray-700">{children}</div>
  </AnimatedSection>
);

export default async function DoctorPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doctor = getDoctorBySlug(slug);
  const clinic = getClinicConfig();

  if (!doctor) {
    notFound();
  }

  const google = getGoogleInfo(doctor);
  const usingClinicReviews = !doctor?.google?.placeId && Boolean(clinic.google.placeId);
  const address = doctor?.clinicAddress || clinic.address;

  const contacts = doctor?.contacts;
  const hasContacts =
    contacts?.email ||
    contacts?.phones?.length ||
    contacts?.whatsapp?.length ||
    contacts?.instagram?.length ||
    contacts?.links?.length;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-5 pb-14 pt-8">
      <AnimatedSection>
        <header className="section-card p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/80 p-2">
                <Image
                  src="/Logo.png"
                  alt="Inovare"
                  width={64}
                  height={64}
                  className="h-12 w-12 object-contain"
                  priority
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-amber-800">Inovare – Serviços de Saúde</p>
                <h1 className="text-3xl font-semibold text-ink">{doctor?.name}</h1>
                {doctor?.crm && <p className="text-sm text-gray-600">{doctor.crm}</p>}
                {doctor?.specialties?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {doctor.specialties.map((spec) => (
                      <span key={spec} className="chip">
                        {spec}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {contacts?.whatsapp?.[0] && (
                <a className="btn-primary" href={`https://wa.me/${sanitizeTel(contacts.whatsapp[0])}`} target="_blank">
                  WhatsApp
                </a>
              )}
              {contacts?.phones?.[0] && (
                <a className="btn-ghost" href={`tel:${sanitizeTel(contacts.phones[0])}`}>
                  Ligar
                </a>
              )}
              {contacts?.instagram?.[0] && (
                <a className="btn-ghost" href={contacts.instagram[0]} target="_blank" rel="noopener noreferrer">
                  Instagram
                </a>
              )}
            </div>
          </div>
          {doctor?.active === false && (
            <div className="mt-5 rounded-2xl border border-orange-200 bg-secondary/70 p-4 text-amber-900">
              Este profissional não atende mais na Inovare. Consulte os demais especialistas ou fale com a recepção.
            </div>
          )}
        </header>
      </AnimatedSection>

      {hasContacts ? (
        <SectionCard title="Contatos">
          <div className="flex flex-wrap gap-2">
            {contacts?.whatsapp?.map((phone) => (
              <a
                key={`wa-${phone}`}
                className="btn-primary"
                href={`https://wa.me/${sanitizeTel(phone)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp {contactLabel(phone)}
              </a>
            ))}
            {contacts?.phones?.map((phone) => (
              <a key={`phone-${phone}`} className="btn-ghost" href={`tel:${sanitizeTel(phone)}`}>
                Ligar {contactLabel(phone)}
              </a>
            ))}
            {contacts?.email && (
              <a className="btn-ghost" href={`mailto:${contacts.email}`}>
                Email
              </a>
            )}
            {contacts?.instagram?.map((url) => (
              <a key={url} className="btn-ghost" href={url} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            ))}
            {contacts?.links?.map((link) => (
              <a key={link.url} className="btn-ghost" href={link.url} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {doctor?.bio ? (
        <SectionCard title="Sobre">
          <p className="leading-relaxed text-ink">{doctor.bio}</p>
        </SectionCard>
      ) : null}

      <SectionCard title="Endereço">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-medium text-ink">{address}</p>
            <p className="text-sm text-gray-600">{clinic.name}</p>
          </div>
          {google.mapsUrl && (
            <a className="btn-primary" href={google.mapsUrl} target="_blank" rel="noopener noreferrer">
              Abrir no Maps
            </a>
          )}
        </div>
      </SectionCard>

      <ReviewsSection
        placeId={google.placeId}
        mapsUrl={google.mapsUrl}
        fallbackLabel={usingClinicReviews ? "Avaliações da Inovare – Serviços de Saúde" : undefined}
      />

      {doctor?.photos?.length ? (
        <SectionCard title="Galeria">
          <div className="grid gap-3 sm:grid-cols-2">
            {doctor.photos.map((photo) => (
              <div key={photo} className="relative overflow-hidden rounded-2xl">
                <Image
                  src={photo}
                  alt={`Foto de ${doctor.name}`}
                  width={800}
                  height={600}
                  className="h-full w-full rounded-2xl object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      <AnimatedSection delay={0.05}>
        <div className="section-card flex items-center justify-between p-4">
          <div>
            <p className="text-sm text-gray-600">QR curto</p>
            <p className="text-base font-semibold text-ink">/m/{doctor?.slug}</p>
          </div>
          <Link className="btn-ghost" href={`/m/${doctor?.slug}`}>
            Ir para a rota curta
          </Link>
        </div>
      </AnimatedSection>
    </main>
  );
}
