export type ContactLink = {
  label: string;
  url: string;
};

export type ContactInfo = {
  email?: string;
  phones?: string[];
  whatsapp?: string[];
  instagram?: string[];
  links?: ContactLink[];
};

export type GoogleInfo = {
  placeId?: string;
  mapsUrl?: string;
};

export type Doctor = {
  slug: string;
  name: string;
  crm?: string;
  specialties?: string[];
  bio?: string;
  clinicAddress?: string;
  contacts?: ContactInfo;
  google?: GoogleInfo;
  photos?: string[];
  active?: boolean;
};

export type ClinicConfig = {
  name: string;
  address: string;
  google: GoogleInfo;
};

export type DoctorsData = {
  clinic: ClinicConfig;
  doctors: Doctor[];
};
