import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Country mapping utility
export const getCountryName = (countryCode: string): string => {
  const countryMap: Record<string, string> = {
    us: "United States",
    uk: "United Kingdom",
    ca: "Canada",
    au: "Australia",
    de: "Germany",
    fr: "France",
    sg: "Singapore",
    jp: "Japan",
    in: "India",
    br: "Brazil",
    za: "South Africa",
    other: "Other",
  };

  return countryMap[countryCode] || countryCode;
};
