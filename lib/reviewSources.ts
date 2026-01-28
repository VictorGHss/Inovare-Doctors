import type { ClinicConfig, Doctor } from "@/types/doctor";

export type ReviewSourceEntry = {
  key: string;
  placeId: string;
  defaultMinRating?: number;
  useSurnameFilter?: boolean;
  displayLabel?: string;
  surnameTokens?: string[];
};

const CLINIC_PLACE_ID = "ChIJN3Bz2lwa6JQRzi0rQrcYanw";

export const REVIEW_SOURCES: ReviewSourceEntry[] = [
  {
    key: "CLINIC_INOVARE",
    placeId: CLINIC_PLACE_ID,
    defaultMinRating: 3.5,
    useSurnameFilter: true,
    displayLabel: "Avaliações da Inovare – Serviços de Saúde"
  },
  {
    key: "IOTCG_ORTOPEDIA",
    placeId: "ChIJY9wtc-ob6JQRtSYIa7PpR9A",
    defaultMinRating: 3.5,
    useSurnameFilter: true,
    displayLabel: "Avaliações do setor"
  },
  {
    key: "CARDIO_HEMODINAMICA",
    placeId: "ChIJg8DRLusb6JQRM-AElkF15D8",
    defaultMinRating: 3.5,
    useSurnameFilter: true,
    displayLabel: "Avaliações do setor"
  },
  {
    key: "CENOVICZ_OFTALMO",
    placeId: "ChIJd4uJ2Vwa6JQRXXQDPeEiMe8",
    defaultMinRating: 3.5,
    useSurnameFilter: true,
    displayLabel: "Avaliações do setor"
  },
  {
    key: "ENDOSCOPIA_GASTRO_IPG",
    placeId: "ChIJsZbOvwUa6JQR9B2EBx_JsUI",
    defaultMinRating: 3.5,
    useSurnameFilter: true,
    displayLabel: "Avaliações do setor"
  }
];

const REVIEW_SOURCES_BY_PLACE = REVIEW_SOURCES.reduce<Record<string, ReviewSourceEntry>>((acc, entry) => {
  acc[entry.placeId] = entry;
  return acc;
}, {});

export type ResolvedReviewConfig = {
  placeId: string;
  minRating: number;
  surnameTokens: string[];
  useSurnameFilter: boolean;
  displayLabel?: string;
  sourceMode: "individual" | "group" | "clinic";
};

const normalizeTokens = (tokens: string[]) =>
  tokens
    .map((t) =>
      t
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase()
    )
    .filter(Boolean);

export function resolveReviewConfig(doctor: Doctor | undefined, clinic: ClinicConfig): ResolvedReviewConfig {
  const envMinRating = Number(process.env.MIN_REVIEW_RATING ?? "3.5");
  const envTokens = normalizeTokens((process.env.REVIEW_SURNAMES || process.env.REVIEW_SURNAME || "").split(","));

  const source = doctor?.google?.reviewSource;
  let sourceMode: ResolvedReviewConfig["sourceMode"] =
    source?.mode ?? (doctor?.google?.placeId ? "individual" : "clinic");

  let placeId =
    source?.placeId ||
    (sourceMode === "individual" ? doctor?.google?.placeId : undefined) ||
    (sourceMode === "group" ? undefined : undefined) ||
    clinic.google.placeId;

  if (!placeId && doctor?.google?.placeId) {
    placeId = doctor.google.placeId;
    sourceMode = "individual";
  }
  if (!placeId && clinic.google.placeId) {
    placeId = clinic.google.placeId;
    sourceMode = "clinic";
  }

  const registry = placeId ? REVIEW_SOURCES_BY_PLACE[placeId] : undefined;
  const minRating = Number.isFinite(envMinRating)
    ? envMinRating
    : registry?.defaultMinRating ?? 3.5;

  const surnameTokens = normalizeTokens(
    source?.surnameTokens || registry?.surnameTokens || (sourceMode === "clinic" ? envTokens : [])
  );

  const useSurnameFilter =
    registry?.useSurnameFilter ?? (sourceMode !== "individual" && surnameTokens.length > 0);

  return {
    placeId: placeId || clinic.google.placeId || "",
    minRating,
    surnameTokens,
    useSurnameFilter,
    displayLabel: registry?.displayLabel,
    sourceMode
  };
}
