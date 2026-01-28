const digitsOnly = (value: string) => value.replace(/[^\d]/g, "");

const ensureE164 = (value: string) => {
  const digits = digitsOnly(value);
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
};

export const buildWhatsappLink = (phone: string, message: string) =>
  `https://wa.me/${ensureE164(phone)}?text=${encodeURIComponent(message)}`;

export const buildTelLink = (phone: string) => `tel:${ensureE164(phone)}`;

export const displayLabel = (value: string) => value;
