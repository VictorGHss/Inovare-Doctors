import Image from "next/image";

const clinicSocial = [
  { label: "Facebook", href: "https://www.facebook.com/inovarepg" },
  { label: "Instagram", href: "https://www.instagram.com/inovaress/" }
];

const whatsappLink = "https://wa.me/5542991742533";

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-orange-100/80 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/90 p-2 sm:h-20 sm:w-20">
            <Image
              src="/Logo.png"
              alt="Inovare – Serviços de Saúde"
              width={96}
              height={96}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">Inovare – Serviços de Saúde</p>
            <p className="text-sm text-gray-700">
              Atendimento: Segunda a sexta, 08h – 12h e 13h – 18h30
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a className="btn-ghost" href={whatsappLink} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
          {clinicSocial.map((item) => (
            <a key={item.href} className="btn-ghost" href={item.href} target="_blank" rel="noopener noreferrer">
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
