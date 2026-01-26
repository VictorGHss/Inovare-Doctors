import { redirect } from "next/navigation";
import { getDoctorSlugs } from "@/lib/doctors";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return getDoctorSlugs().map((slug) => ({ slug }));
}

export default async function ShortRoutePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/medicos/${slug}`);
}
