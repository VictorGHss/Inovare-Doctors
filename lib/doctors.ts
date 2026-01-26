import doctorsData from "../data/doctors.json";
import type { ClinicConfig, Doctor, DoctorsData, GoogleInfo } from "@/types/doctor";

const data = doctorsData as DoctorsData;

export const getClinicConfig = (): ClinicConfig => data.clinic;

export const getDoctors = (): Doctor[] => data.doctors;

export const getDoctorSlugs = (): string[] => data.doctors.map((doctor) => doctor.slug);

export const getDoctorBySlug = (slug: string): Doctor | undefined =>
  data.doctors.find((doctor) => doctor.slug === slug);

export const getGoogleInfo = (doctor?: Doctor): GoogleInfo => ({
  placeId: doctor?.google?.placeId || data.clinic.google.placeId,
  mapsUrl: doctor?.google?.mapsUrl || data.clinic.google.mapsUrl
});
