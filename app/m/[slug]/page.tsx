import { redirect } from "next/navigation";
import { getDoctorSlugs } from "@/lib/doctors";

export const dynamic = "force-static";

type PageProps = {
  params: { slug: string };
};

export async function generateStaticParams() {
  return getDoctorSlugs().map((slug) => ({ slug }));
}

export default async function ShortRoutePage({ params }: PageProps) {
  redirect(`/medicos/${params.slug}`);
}
