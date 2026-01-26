import Link from "next/link";
import { AnimatedSection } from "./components/AnimatedSection";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col items-start gap-4 px-5 pb-12 pt-16">
      <AnimatedSection>
        <div className="section-card p-6">
          <p className="text-xs uppercase tracking-wide text-amber-800">404</p>
          <h1 className="text-2xl font-semibold text-ink">Página não encontrada</h1>
          <p className="mt-2 text-sm text-gray-700">
            O profissional que você buscou não foi localizado. Volte para a lista de médicos.
          </p>
          <Link href="/" className="btn-primary mt-4 inline-flex">
            Ver médicos
          </Link>
        </div>
      </AnimatedSection>
    </main>
  );
}
