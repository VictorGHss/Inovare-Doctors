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
    <footer className="mt-10 border-t border-orange-100/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-secondary/90 p-2 sm:h-28 sm:w-28">
            <Image
              src="/Logo.png"
              alt="Inovare – Serviços de Saúde"
              width={128}
              height={128}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">Inovare – Serviços de Saúde</p>
            <p className="text-sm text-gray-700">{clinic.address}</p>
            <p className="text-sm text-gray-700">Atendimento: Segunda a sexta, 08h – 12h e 13h – 18h30</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {mapsUrl ? (
            <ActionButton href={mapsUrl} variant="ghost" icon={<FiMapPin />}>
              Ver no Maps
            </ActionButton>
          ) : null}
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
