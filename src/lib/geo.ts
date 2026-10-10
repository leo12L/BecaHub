/** Detecta menciones a México en texto libre (con o sin acentos/mayúsculas). */
export const MEXICO_PATTERN = /m[eé]xic|\bmx\b/i;

/**
 * Mapeo de nombres de países (en español e inglés) a códigos ISO-3166 alpha-2.
 * Se usa para convertir texto libre de `countryDestination` a `destinationCountries`.
 */
export const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  // México
  méxico: "MX",
  mexico: "MX",
  mx: "MX",
  
  // Estados Unidos
  "estados unidos": "US",
  "united states": "US",
  "usa": "US",
  "us": "US",
  eeuu: "US",
  
  // Canadá
  canadá: "CA",
  canada: "CA",
  ca: "CA",
  
  // España
  espana: "ES",
  españa: "ES",
  spain: "ES",
  es: "ES",
  
  // Reino Unido
  "reino unido": "GB",
  "united kingdom": "GB",
  uk: "GB",
  gb: "GB",
  inglaterra: "GB",
  england: "GB",
  
  // Alemania
  alemania: "DE",
  germany: "DE",
  de: "DE",
  
  // Francia
  francia: "FR",
  france: "FR",
  fr: "FR",
  
  // Italia
  italia: "IT",
  italy: "IT",
  it: "IT",
  
  // China
  china: "CN",
  cn: "CN",
  
  // Japón
  japón: "JP",
  japon: "JP",
  japan: "JP",
  jp: "JP",
  
  // Argentina
  argentina: "AR",
  ar: "AR",
  
  // Brasil
  brasil: "BR",
  brazil: "BR",
  br: "BR",
  
  // Chile
  chile: "CL",
  cl: "CL",
  
  // Colombia
  colombia: "CO",
  co: "CO",
  
  // Perú
  perú: "PE",
  peru: "PE",
  pe: "PE",
  
  // Australia
  australia: "AU",
  au: "AU",
  
  // Nueva Zelanda
  "nueva zelanda": "NZ",
  "new zealand": "NZ",
  nz: "NZ",
  
  // Países Bajos
  "países bajos": "NL",
  "paises bajos": "NL",
  netherlands: "NL",
  holanda: "NL",
  holland: "NL",
  nl: "NL",
  
  // Bélgica
  bélgica: "BE",
  belgica: "BE",
  belgium: "BE",
  be: "BE",
  
  // Suiza
  suiza: "CH",
  switzerland: "CH",
  ch: "CH",
  
  // Suecia
  suecia: "SE",
  sweden: "SE",
  se: "SE",
  
  // Noruega
  noruega: "NO",
  norway: "NO",
  no: "NO",
  
  // Portugal
  portugal: "PT",
  pt: "PT",
  
  // Corea del Sur
  "corea del sur": "KR",
  "south korea": "KR",
  corea: "KR",
  korea: "KR",
  kr: "KR",
};

/**
 * Definición de regiones geográficas como grupos de códigos de país.
 */
export const REGIONS: Record<string, string[]> = {
  europa: ["ES", "GB", "DE", "FR", "IT", "NL", "BE", "CH", "SE", "NO", "PT"],
  "américa del norte": ["US", "CA"],
  "norteamérica": ["US", "CA"],
  "latinoamérica": ["MX", "AR", "BR", "CL", "CO", "PE"],
  "américa latina": ["MX", "AR", "BR", "CL", "CO", "PE"],
  asia: ["CN", "JP", "KR"],
  oceanía: ["AU", "NZ"],
  oceania: ["AU", "NZ"],
};

/**
 * Normaliza un nombre de país a minúsculas sin acentos.
 */
function normalizeCountryName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/ñ/g, "n")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Convierte un nombre de país (texto libre) a código ISO-3166 alpha-2.
 * Retorna `null` si no se puede mapear.
 */
export function countryNameToCode(name: string): string | null {
  const normalized = normalizeCountryName(name);
  return COUNTRY_NAME_TO_CODE[normalized] ?? null;
}

/**
 * Convierte múltiples nombres de países (separados por comas, "y", "o") a códigos.
 * Retorna un arreglo de códigos únicos.
 */
export function parseCountryDestination(text: string): string[] {
  if (!text || text.trim() === "") return [];
  
  const parts = text
    .split(/[,;\/]|\by\b|\bo\b/i)
    .map((p) => p.trim())
    .filter(Boolean);
  
  const codes = parts
    .map((part) => countryNameToCode(part))
    .filter((code): code is string => code !== null);
  
  return [...new Set(codes)];
}

/**
 * Nombres en español de los códigos de país más comunes.
 */
export const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  MX: "México",
  US: "Estados Unidos",
  CA: "Canadá",
  ES: "España",
  GB: "Reino Unido",
  DE: "Alemania",
  FR: "Francia",
  IT: "Italia",
  CN: "China",
  JP: "Japón",
  AR: "Argentina",
  BR: "Brasil",
  CL: "Chile",
  CO: "Colombia",
  PE: "Perú",
  AU: "Australia",
  NZ: "Nueva Zelanda",
  NL: "Países Bajos",
  BE: "Bélgica",
  CH: "Suiza",
  SE: "Suecia",
  NO: "Noruega",
  PT: "Portugal",
  KR: "Corea del Sur",
};

/**
 * Obtiene el nombre en español de un código de país.
 */
export function countryCodeToName(code: string): string {
  return COUNTRY_CODE_TO_NAME[code] ?? code;
}
