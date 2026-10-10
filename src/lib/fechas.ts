/**
 * Funciones para manejo de fechas en zona horaria de México (America/Mexico_City).
 * 
 * REGLA: La fecha de cierre de una beca es el último día en hora de México
 * y se guarda como medianoche con offset -06:00 (México ya no tiene horario de verano).
 * 
 * Todas las fechas de cierre deben pasar por estas funciones para evitar
 * problemas de zona horaria entre el servidor (UTC en CI/Netlify) y México.
 */

/**
 * Obtiene la fecha de hoy en México como Date con offset -06:00.
 * 
 * @example
 * // Si en UTC es 2026-10-10 05:30 (día 10 a las 5:30 AM)
 * // En México es 2026-10-09 23:30 (día 9 a las 11:30 PM)
 * // Retorna: new Date('2026-10-09T00:00:00-06:00')
 */
export function getTodayInMexicoCity(): Date {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  
  const fechaMexico = formatter.format(new Date()); // Formato YYYY-MM-DD
  return new Date(`${fechaMexico}T00:00:00-06:00`);
}

/**
 * Convierte una fecha YYYY-MM-DD a medianoche de México con offset -06:00.
 * 
 * @param fechaYYYYMMDD - Fecha en formato YYYY-MM-DD (ej: "2026-10-15")
 * @returns Date object representando medianoche de ese día en México
 * 
 * @example
 * dateToMexicoMidnight('2026-10-15')
 * // Retorna: new Date('2026-10-15T00:00:00-06:00')
 */
export function dateToMexicoMidnight(fechaYYYYMMDD: string): Date {
  // Validar formato básico
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaYYYYMMDD)) {
    throw new Error(
      `Formato de fecha inválido: ${fechaYYYYMMDD}. Se esperaba YYYY-MM-DD`
    );
  }
  
  return new Date(`${fechaYYYYMMDD}T00:00:00-06:00`);
}

/**
 * Convierte componentes de fecha (año, mes, día) a medianoche de México.
 * 
 * @param year - Año (ej: 2026)
 * @param month - Mes (1-12, no 0-11)
 * @param day - Día del mes (1-31)
 * @returns Date object representando medianoche de ese día en México
 * 
 * @example
 * componentsToMexicoMidnight(2026, 10, 15)
 * // Retorna: new Date('2026-10-15T00:00:00-06:00')
 */
export function componentsToMexicoMidnight(
  year: number,
  month: number,
  day: number
): Date {
  const fechaYYYYMMDD = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return dateToMexicoMidnight(fechaYYYYMMDD);
}
