import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AnimatedSection } from "@/app/components/AnimatedSection";
import { ReviewsSection } from "@/app/components/ReviewsSection";
import { SiteFooter } from "@/app/components/SiteFooter";
import { ActionButton } from "@/app/components/ActionButton";
import { getClinicConfig, getDoctorBySlug, getDoctorSlugs, getGoogleInfo } from "@/lib/doctors";
import { FiInstagram, FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { RiWhatsappLine } from "react-icons/ri";

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
  const clinicPhone = "(42) 3026-2600";
  const whatsappList = contacts?.whatsapp || [];
  const phoneList = contacts?.phones?.length ? contacts.phones : [clinicPhone];
  const instagramList = contacts?.instagram || [];
  const linksList = contacts?.links || [];

  const primaryWhatsapp = whatsappList[0];
  const primaryPhone = phoneList[0];
  const primaryInstagram = instagramList[0];
  const primaryEmail = contacts?.email;
  const whatsappMessage = encodeURIComponent(
    `Olá, estou entrando em contato pelo cartão de visita para agendar uma consulta com ${doctor?.name}.`
  );
  const hasContacts =
    whatsappList.slice(1).length > 0 ||
    phoneList.slice(1).length > 0 ||
    instagramList.slice(1).length > 0 ||
    Boolean(primaryEmail) ||
    linksList.length > 0;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-5 pb-14 pt-8">
      <AnimatedSection>
        <header className="section-card p-6 sm:p-7">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.1em] text-amber-800">Inovare – Serviços de Saúde</p>
              <h1 className="text-3xl font-semibold text-ink sm:text-4xl">{doctor?.name}</h1>
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
          {doctor?.active === false ? (
            <div className="mt-5 rounded-2xl border border-orange-200 bg-secondary/70 p-4 text-amber-900">
              Este profissional não atende mais na Inovare. Consulte os demais especialistas ou fale com a recepção.
            </div>
          ) : null}
        </header>
      </AnimatedSection>

      {(primaryWhatsapp || primaryPhone || primaryEmail || primaryInstagram || linksList.length) && (
        <SectionCard title="Contatos">
          <div className="flex flex-wrap gap-2">
            {primaryWhatsapp ? (
              <ActionButton
                href={`https://wa.me/${sanitizeTel(primaryWhatsapp)}?text=${whatsappMessage}`}
                icon={<RiWhatsappLine />}
                variant="soft"
              >
                WhatsApp
              </ActionButton>
            ) : null}
            {primaryPhone ? (
              <ActionButton href={`tel:${sanitizeTel(primaryPhone)}`} icon={<FiPhone />} variant="soft">
                Telefone
              </ActionButton>
            ) : null}
            {primaryEmail ? (
              <ActionButton href={`mailto:${primaryEmail}`} icon={<FiMail />} variant="soft">
                Email
              </ActionButton>
            ) : null}
            {primaryInstagram ? (
              <ActionButton href={primaryInstagram} icon={<FiInstagram />} variant="soft">
                Instagram
              </ActionButton>
            ) : null}
            {linksList.map((link) => (
              <ActionButton key={link.url} href={link.url} variant="soft" external>
                {link.label}
              </ActionButton>
            ))}
            {whatsappList.slice(1).map((phone) => (
              <ActionButton
                key={`wa-${phone}`}
                href={`https://wa.me/${sanitizeTel(phone)}?text=${whatsappMessage}`}
                icon={<RiWhatsappLine />}
                variant="soft"
              >
                WhatsApp {contactLabel(phone)}
              </ActionButton>
            ))}
            {phoneList.slice(1).map((phone) => (
              <ActionButton key={`phone-${phone}`} href={`tel:${sanitizeTel(phone)}`} icon={<FiPhone />} variant="soft">
                Telefone {contactLabel(phone)}
              </ActionButton>
            ))}
            {instagramList.slice(1).map((url) => (
              <ActionButton key={url} href={url} icon={<FiInstagram />} variant="soft">
                Instagram
              </ActionButton>
            ))}
          </div>
        </SectionCard>
      )}

      {hasContacts ? (
        <></>
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
            <ActionButton href={google.mapsUrl} variant="primary" icon={<FiMapPin />}>
              Abrir no Maps
            </ActionButton>
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
      <SiteFooter clinic={clinic} />
    </main>
  );
}
