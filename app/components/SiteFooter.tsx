import Image from "next/image";
import { FiFacebook, FiInstagram, FiMapPin } from "react-icons/fi";
import { RiWhatsappLine } from "react-icons/ri";
import { ActionButton } from "./ActionButton";
import type { ClinicConfig } from "@/types/doctor";

type Props = {
  clinic: ClinicConfig;
};

export function SiteFooter({ clinic }: Props) {
  const mapsUrl = clinic.google.mapsUrl;
  const whatsappLink = "https://wa.me/554230262601";

  const socials = [
    { label: "Facebook", href: "https://www.facebook.com/inovarepg", icon: <FiFacebook /> },
    { label: "Instagram", href: "https://www.instagram.com/inovaress/", icon: <FiInstagram /> }
  ];

  return (
    <footer className="mt-12 border-t border-orange-100/80 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-5 py-10">
        {/* Logo + Infos */}
        <div className="flex flex-col items-center text-center gap-4">
          <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-secondary/60 p-4 sm:h-40 sm:w-40">
            <Image
              src="/Logo.png"
              alt="Inovare – Serviços de Saúde"
              width={200}
              height={200}
              className="h-full w-full object-contain"
              priority
            />
          </div>

          <div className="space-y-1 max-w-md">
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">
              Inovare – Serviços de Saúde
            </p>
            <p className="text-sm text-gray-700">{clinic.address}</p>
            <p className="text-sm text-gray-700">
              Atendimento: Segunda a sexta, 08h – 12h e 13h – 18h30
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {mapsUrl && (
            <ActionButton href={mapsUrl} variant="ghost" icon={<FiMapPin />}>
              Ver no Maps
            </ActionButton>
          )}

          <ActionButton href={whatsappLink} variant="ghost" icon={<RiWhatsappLine />}>
            WhatsApp
          </ActionButton>

          {socials.map((item) => (
            <ActionButton key={item.href} href={item.href} variant="ghost" icon={item.icon}>
              {item.label}
            </ActionButton>
          ))}
        </div>
      </div>
    </footer>
  );
}
