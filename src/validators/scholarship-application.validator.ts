import { z } from "zod";

/**
 * Validación (solo cliente) del wizard de "Registro de solicitud de beca".
 * No hay backend: este schema solo valida los pasos del formulario antes
 * de mostrar el modal de confirmación simulado.
 */

export const ACADEMIC_LEVEL_OPTIONS = [
  "Secundaria",
  "Preparatoria/Bachillerato",
  "TSU",
  "Licenciatura",
  "Posgrado",
  "Otro",
] as const;

export const GPA_SCALE_OPTIONS = [
  "Escala 0-10",
  "Escala 0-100",
  "Otra",
] as const;

export const SCHOLARSHIP_TYPE_OPTIONS = [
  "Manutención",
  "Excelencia académica",
  "Movilidad",
  "Transporte",
  "Deportiva",
  "Investigación",
  "Titulación",
  "Otra",
] as const;

export const MAIN_REASON_OPTIONS = [
  "Económico",
  "Académico",
  "Movilidad",
  "Investigación",
  "Otro",
] as const;

export const HOUSEHOLD_INCOME_OPTIONS = [
  "Menos de $5,000",
  "$5,000 - $10,000",
  "$10,000 - $20,000",
  "$20,000 - $40,000",
  "Más de $40,000",
] as const;

export const YES_NO_OPTIONS = ["si", "no"] as const;

/** Validación estructural de CURP: 18 caracteres alfanuméricos con el formato oficial. */
const CURP_PATTERN = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/i;

const requiredString = (msg: string) => z.string().trim().min(1, msg);

export const personalDataSchema = z
  .object({
    fullName: requiredString("El nombre completo es obligatorio."),
    birthDate: requiredString("La fecha de nacimiento es obligatoria."),
    country: requiredString("El país es obligatorio."),
    state: requiredString("El estado o provincia es obligatorio."),
    city: requiredString("La ciudad o municipio es obligatorio."),
    email: z
      .string()
      .trim()
      .min(1, "El correo electrónico es obligatorio.")
      .email("Ingresa un correo electrónico válido."),
    phone: requiredString("El teléfono es obligatorio."),
    curp: z.string().trim().optional(),
    idDocument: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    const isMexico = data.country.toLowerCase() === "méxico";

    if (isMexico) {
      if (!data.curp) {
        ctx.addIssue({
          code: "custom",
          path: ["curp"],
          message: "La CURP es obligatoria para México.",
        });
      } else if (!CURP_PATTERN.test(data.curp)) {
        ctx.addIssue({
          code: "custom",
          path: ["curp"],
          message: "La CURP debe tener 18 caracteres con el formato oficial.",
        });
      }
    }
  });

export type PersonalDataValues = z.infer<typeof personalDataSchema>;

export const academicDataSchema = z.object({
  academicLevel: z.enum(ACADEMIC_LEVEL_OPTIONS, {
    message: "Selecciona tu nivel educativo.",
  }),
  institution: requiredString("La institución educativa es obligatoria."),
  fieldOfStudy: requiredString("La carrera o área de estudio es obligatoria."),
  currentGrade: requiredString(
    "El semestre, cuatrimestre o año actual es obligatorio.",
  ),
  gpa: z.coerce
    .number({ message: "El promedio debe ser un número." })
    .positive("El promedio debe ser mayor a 0."),
  gpaScale: z.enum(GPA_SCALE_OPTIONS, {
    message: "Selecciona el tipo de promedio.",
  }),
  studentId: z.string().trim().optional(),
});

export type AcademicDataValues = z.infer<typeof academicDataSchema>;

export const scholarshipInfoSchema = z.object({
  scholarshipType: z.enum(SCHOLARSHIP_TYPE_OPTIONS, {
    message: "Selecciona el tipo de beca que buscas.",
  }),
  approxAmount: z
    .union([
      z.coerce
        .number({ message: "El monto debe ser un número." })
        .nonnegative("El monto no puede ser negativo."),
      z.literal(""),
    ])
    .optional()
    .transform((value) =>
      value === "" || value === undefined ? undefined : value,
    ),
  mainReason: z.enum(MAIN_REASON_OPTIONS, {
    message: "Selecciona el motivo principal.",
  }),
  reason: requiredString("Cuéntanos por qué necesitas esta beca.").max(
    500,
    "Máximo 500 caracteres.",
  ),
});

export type ScholarshipInfoValues = z.infer<typeof scholarshipInfoSchema>;

export const socioeconomicSchema = z
  .object({
    householdIncome: z.enum(HOUSEHOLD_INCOME_OPTIONS, {
      message: "Selecciona el ingreso mensual del hogar.",
    }),
    householdMembers: z.coerce
      .number({ message: "Ingresa un número válido." })
      .int("Debe ser un número entero.")
      .min(1, "Debe haber al menos 1 integrante."),
    dependents: z.coerce
      .number({ message: "Ingresa un número válido." })
      .int("Debe ser un número entero.")
      .min(0, "No puede ser negativo."),
    isWorking: z.enum(YES_NO_OPTIONS, {
      message: "Selecciona una opción.",
    }),
    receivesOtherScholarship: z.enum(YES_NO_OPTIONS, {
      message: "Selecciona una opción.",
    }),
    otherScholarshipName: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.receivesOtherScholarship === "si" && !data.otherScholarshipName) {
      ctx.addIssue({
        code: "custom",
        path: ["otherScholarshipName"],
        message: "Indica el nombre de la beca que recibes.",
      });
    }
  });

export type SocioeconomicValues = z.infer<typeof socioeconomicSchema>;

export const documentsSchema = z.object({
  officialId: requiredString("Adjunta tu identificación oficial."),
  enrollmentProof: requiredString("Adjunta tu constancia de inscripción."),
  transcript: requiredString("Adjunta tu historial académico o boleta."),
  incomeProof: z.string().optional(),
  motivationLetter: z.string().optional(),
  truthDeclaration: z.boolean().refine((value) => value === true, {
    message: "Debes declarar que la información es verdadera.",
  }),
  privacyConsent: z.boolean().refine((value) => value === true, {
    message: "Debes aceptar el aviso de privacidad.",
  }),
});

export type DocumentsValues = z.infer<typeof documentsSchema>;

export type ScholarshipApplicationValues = PersonalDataValues &
  AcademicDataValues &
  ScholarshipInfoValues &
  SocioeconomicValues &
  DocumentsValues;

export const STEP_SCHEMAS = [
  personalDataSchema,
  academicDataSchema,
  scholarshipInfoSchema,
  socioeconomicSchema,
  documentsSchema,
] as const;
