"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronLeft, ChevronRight, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProgressBar } from "./ProgressBar";
import { FileUploadMock } from "./FileUploadMock";
import {
  ACADEMIC_LEVEL_OPTIONS,
  GPA_SCALE_OPTIONS,
  HOUSEHOLD_INCOME_OPTIONS,
  MAIN_REASON_OPTIONS,
  SCHOLARSHIP_TYPE_OPTIONS,
  STEP_SCHEMAS,
} from "@/validators/scholarship-application.validator";

const STEPS = [
  { label: "Datos personales" },
  { label: "Académico" },
  { label: "Beca" },
  { label: "Situación" },
  { label: "Documentos" },
];

const COUNTRY_OPTIONS = [
  "México",
  "Estados Unidos",
  "Colombia",
  "Argentina",
  "Perú",
  "Chile",
  "España",
  "Otro",
];

type FormState = {
  fullName: string;
  birthDate: string;
  country: string;
  state: string;
  city: string;
  email: string;
  phone: string;
  curp: string;
  idDocument: string;
  academicLevel: string;
  institution: string;
  fieldOfStudy: string;
  currentGrade: string;
  gpa: string;
  gpaScale: string;
  studentId: string;
  scholarshipType: string;
  approxAmount: string;
  mainReason: string;
  reason: string;
  householdIncome: string;
  householdMembers: string;
  dependents: string;
  isWorking: string;
  receivesOtherScholarship: string;
  otherScholarshipName: string;
  officialId: string;
  enrollmentProof: string;
  transcript: string;
  incomeProof: string;
  motivationLetter: string;
  truthDeclaration: boolean;
  privacyConsent: boolean;
};

const INITIAL_STATE: FormState = {
  fullName: "",
  birthDate: "",
  country: "México",
  state: "",
  city: "",
  email: "",
  phone: "",
  curp: "",
  idDocument: "",
  academicLevel: "",
  institution: "",
  fieldOfStudy: "",
  currentGrade: "",
  gpa: "",
  gpaScale: "",
  studentId: "",
  scholarshipType: "",
  approxAmount: "",
  mainReason: "",
  reason: "",
  householdIncome: "",
  householdMembers: "",
  dependents: "",
  isWorking: "",
  receivesOtherScholarship: "",
  otherScholarshipName: "",
  officialId: "",
  enrollmentProof: "",
  transcript: "",
  incomeProof: "",
  motivationLetter: "",
  truthDeclaration: false,
  privacyConsent: false,
};

type FieldErrors = Record<string, string>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-destructive text-xs">{message}</p>;
}

function RequiredMark() {
  return <span className="text-primary">*</span>;
}

export function ScholarshipApplicationForm() {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  const isMexico = values.country === "México";

  function setField<K extends keyof FormState>(name: K, value: FormState[K]) {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  function validateStep(stepIndex: number) {
    const schema = STEP_SCHEMAS[stepIndex - 1];
    const result = schema.safeParse(values);

    if (result.success) {
      setErrors({});
      return true;
    }

    const fieldErrors: FieldErrors = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    setErrors(fieldErrors);
    return false;
  }

  function handleNext() {
    if (!validateStep(step)) return;
    setStep((current) => Math.min(current + 1, STEPS.length));
  }

  function handleBack() {
    setErrors({});
    setStep((current) => Math.max(current - 1, 1));
  }

  function handleSubmit() {
    if (!validateStep(STEPS.length)) return;
    setShowSuccess(true);
  }

  function handleSaveDraft() {
    setDraftSaved(true);
    window.setTimeout(() => setDraftSaved(false), 3000);
  }

  const canSubmit = values.truthDeclaration && values.privacyConsent;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-8">
        <ProgressBar steps={STEPS} currentStep={step} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step - 1].label}</CardTitle>
          <CardDescription>
            Paso {step} de {STEPS.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          {step === 1 && (
            <PersonalDataStep
              values={values}
              errors={errors}
              setField={setField}
              isMexico={isMexico}
            />
          )}
          {step === 2 && (
            <AcademicDataStep
              values={values}
              errors={errors}
              setField={setField}
            />
          )}
          {step === 3 && (
            <ScholarshipInfoStep
              values={values}
              errors={errors}
              setField={setField}
            />
          )}
          {step === 4 && (
            <SocioeconomicStep
              values={values}
              errors={errors}
              setField={setField}
            />
          )}
          {step === 5 && (
            <DocumentsStep
              values={values}
              errors={errors}
              setField={setField}
            />
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={step === 1}
          className="gap-1.5"
        >
          <ChevronLeft className="size-4" />
          Anterior
        </Button>

        <div className="flex items-center gap-3">
          {step === STEPS.length && (
            <div className="relative">
              <Button type="button" variant="outline" onClick={handleSaveDraft}>
                Guardar como borrador
              </Button>
              {draftSaved && (
                <p className="bg-foreground text-background absolute top-full right-0 mt-2 w-max rounded-md px-3 py-1.5 text-xs shadow-md">
                  Borrador guardado
                </p>
              )}
            </div>
          )}

          {step < STEPS.length ? (
            <Button type="button" onClick={handleNext} className="gap-1.5">
              Siguiente
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="gap-1.5"
            >
              <Send className="size-4" />
              Registrar solicitud
            </Button>
          )}
        </div>
      </div>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="text-center sm:text-center">
          <DialogHeader className="items-center text-center sm:text-center">
            <div className="bg-highlight/10 mb-2 flex size-14 items-center justify-center rounded-full">
              <CheckCircle2 className="text-highlight size-8" />
            </div>
            <DialogTitle>¡Solicitud registrada!</DialogTitle>
            <DialogDescription>
              Tu solicitud fue registrada correctamente. En una versión futura
              podrás dar seguimiento desde tu panel.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button asChild>
              <Link href="/">Volver al inicio</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface StepProps {
  values: FormState;
  errors: FieldErrors;
  setField: <K extends keyof FormState>(name: K, value: FormState[K]) => void;
}

function PersonalDataStep({
  values,
  errors,
  setField,
  isMexico,
}: StepProps & { isMexico: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="fullName">
          Nombre completo <RequiredMark />
        </Label>
        <Input
          id="fullName"
          value={values.fullName}
          onChange={(e) => setField("fullName", e.target.value)}
          aria-invalid={!!errors.fullName}
        />
        <FieldError message={errors.fullName} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="birthDate">
          Fecha de nacimiento <RequiredMark />
        </Label>
        <Input
          id="birthDate"
          type="date"
          value={values.birthDate}
          onChange={(e) => setField("birthDate", e.target.value)}
          aria-invalid={!!errors.birthDate}
        />
        <FieldError message={errors.birthDate} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="country">
          País <RequiredMark />
        </Label>
        <Select
          value={values.country}
          onValueChange={(value) => setField("country", value)}
        >
          <SelectTrigger
            id="country"
            className="w-full"
            aria-invalid={!!errors.country}
          >
            <SelectValue placeholder="Selecciona un país" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRY_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={errors.country} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="state">
          Estado / provincia <RequiredMark />
        </Label>
        <Input
          id="state"
          value={values.state}
          onChange={(e) => setField("state", e.target.value)}
          aria-invalid={!!errors.state}
        />
        <FieldError message={errors.state} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="city">
          Ciudad / municipio <RequiredMark />
        </Label>
        <Input
          id="city"
          value={values.city}
          onChange={(e) => setField("city", e.target.value)}
          aria-invalid={!!errors.city}
        />
        <FieldError message={errors.city} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">
          Correo electrónico <RequiredMark />
        </Label>
        <Input
          id="email"
          type="email"
          value={values.email}
          onChange={(e) => setField("email", e.target.value)}
          aria-invalid={!!errors.email}
        />
        <FieldError message={errors.email} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">
          Teléfono <RequiredMark />
        </Label>
        <Input
          id="phone"
          type="tel"
          value={values.phone}
          onChange={(e) => setField("phone", e.target.value)}
          aria-invalid={!!errors.phone}
        />
        <FieldError message={errors.phone} />
      </div>

      {isMexico ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="curp">
            CURP <RequiredMark />
          </Label>
          <Input
            id="curp"
            value={values.curp}
            onChange={(e) => setField("curp", e.target.value.toUpperCase())}
            maxLength={18}
            placeholder="18 caracteres"
            aria-invalid={!!errors.curp}
          />
          <FieldError message={errors.curp} />
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="idDocument">Documento de identidad</Label>
          <Input
            id="idDocument"
            value={values.idDocument}
            onChange={(e) => setField("idDocument", e.target.value)}
            placeholder="Número de pasaporte, DNI, etc."
            aria-invalid={!!errors.idDocument}
          />
          <FieldError message={errors.idDocument} />
        </div>
      )}
    </div>
  );
}

function AcademicDataStep({ values, errors, setField }: StepProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="academicLevel">
          Nivel educativo <RequiredMark />
        </Label>
        <Select
          value={values.academicLevel}
          onValueChange={(value) => setField("academicLevel", value)}
        >
          <SelectTrigger
            id="academicLevel"
            className="w-full"
            aria-invalid={!!errors.academicLevel}
          >
            <SelectValue placeholder="Selecciona tu nivel" />
          </SelectTrigger>
          <SelectContent>
            {ACADEMIC_LEVEL_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={errors.academicLevel} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="institution">
          Institución educativa <RequiredMark />
        </Label>
        <Input
          id="institution"
          value={values.institution}
          onChange={(e) => setField("institution", e.target.value)}
          aria-invalid={!!errors.institution}
        />
        <FieldError message={errors.institution} />
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="fieldOfStudy">
          Carrera o área de estudio <RequiredMark />
        </Label>
        <Input
          id="fieldOfStudy"
          value={values.fieldOfStudy}
          onChange={(e) => setField("fieldOfStudy", e.target.value)}
          aria-invalid={!!errors.fieldOfStudy}
        />
        <FieldError message={errors.fieldOfStudy} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="currentGrade">
          Semestre / cuatrimestre / año actual <RequiredMark />
        </Label>
        <Input
          id="currentGrade"
          value={values.currentGrade}
          onChange={(e) => setField("currentGrade", e.target.value)}
          placeholder="Ej. 5to semestre"
          aria-invalid={!!errors.currentGrade}
        />
        <FieldError message={errors.currentGrade} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="studentId">Matrícula o número de estudiante</Label>
        <Input
          id="studentId"
          value={values.studentId}
          onChange={(e) => setField("studentId", e.target.value)}
          aria-invalid={!!errors.studentId}
        />
        <FieldError message={errors.studentId} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gpa">
          Promedio general <RequiredMark />
        </Label>
        <Input
          id="gpa"
          type="number"
          inputMode="decimal"
          step="0.01"
          value={values.gpa}
          onChange={(e) => setField("gpa", e.target.value)}
          aria-invalid={!!errors.gpa}
        />
        <FieldError message={errors.gpa} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gpaScale">
          Tipo de promedio <RequiredMark />
        </Label>
        <Select
          value={values.gpaScale}
          onValueChange={(value) => setField("gpaScale", value)}
        >
          <SelectTrigger
            id="gpaScale"
            className="w-full"
            aria-invalid={!!errors.gpaScale}
          >
            <SelectValue placeholder="Selecciona una escala" />
          </SelectTrigger>
          <SelectContent>
            {GPA_SCALE_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={errors.gpaScale} />
      </div>
    </div>
  );
}

function ScholarshipInfoStep({ values, errors, setField }: StepProps) {
  const reasonLength = values.reason.length;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="scholarshipType">
          Tipo de beca que buscas <RequiredMark />
        </Label>
        <Select
          value={values.scholarshipType}
          onValueChange={(value) => setField("scholarshipType", value)}
        >
          <SelectTrigger
            id="scholarshipType"
            className="w-full"
            aria-invalid={!!errors.scholarshipType}
          >
            <SelectValue placeholder="Selecciona un tipo" />
          </SelectTrigger>
          <SelectContent>
            {SCHOLARSHIP_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={errors.scholarshipType} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="approxAmount">Monto aproximado que necesitas</Label>
        <Input
          id="approxAmount"
          type="number"
          inputMode="decimal"
          min={0}
          step="100"
          placeholder="MXN mensual"
          value={values.approxAmount}
          onChange={(e) => setField("approxAmount", e.target.value)}
          aria-invalid={!!errors.approxAmount}
        />
        <FieldError message={errors.approxAmount} />
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="mainReason">
          Motivo principal <RequiredMark />
        </Label>
        <Select
          value={values.mainReason}
          onValueChange={(value) => setField("mainReason", value)}
        >
          <SelectTrigger
            id="mainReason"
            className="w-full md:w-1/2"
            aria-invalid={!!errors.mainReason}
          >
            <SelectValue placeholder="Selecciona un motivo" />
          </SelectTrigger>
          <SelectContent>
            {MAIN_REASON_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={errors.mainReason} />
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="reason">
          ¿Por qué necesitas esta beca? <RequiredMark />
        </Label>
        <Textarea
          id="reason"
          value={values.reason}
          onChange={(e) => setField("reason", e.target.value.slice(0, 500))}
          maxLength={500}
          rows={5}
          aria-invalid={!!errors.reason}
        />
        <div className="flex items-center justify-between">
          <FieldError message={errors.reason} />
          <p className="text-muted-foreground ml-auto text-xs">
            {reasonLength}/500
          </p>
        </div>
      </div>
    </div>
  );
}

function SocioeconomicStep({ values, errors, setField }: StepProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="householdIncome">
          Ingreso mensual aproximado del hogar <RequiredMark />
        </Label>
        <Select
          value={values.householdIncome}
          onValueChange={(value) => setField("householdIncome", value)}
        >
          <SelectTrigger
            id="householdIncome"
            className="w-full md:w-1/2"
            aria-invalid={!!errors.householdIncome}
          >
            <SelectValue placeholder="Selecciona un rango" />
          </SelectTrigger>
          <SelectContent>
            {HOUSEHOLD_INCOME_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={errors.householdIncome} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="householdMembers">
          Integrantes del hogar <RequiredMark />
        </Label>
        <Input
          id="householdMembers"
          type="number"
          inputMode="numeric"
          min={1}
          step="1"
          value={values.householdMembers}
          onChange={(e) => setField("householdMembers", e.target.value)}
          aria-invalid={!!errors.householdMembers}
        />
        <FieldError message={errors.householdMembers} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dependents">
          Dependientes económicos <RequiredMark />
        </Label>
        <Input
          id="dependents"
          type="number"
          inputMode="numeric"
          min={0}
          step="1"
          value={values.dependents}
          onChange={(e) => setField("dependents", e.target.value)}
          aria-invalid={!!errors.dependents}
        />
        <FieldError message={errors.dependents} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>
          ¿Trabajas actualmente? <RequiredMark />
        </Label>
        <RadioGroup
          value={values.isWorking}
          onValueChange={(value) => setField("isWorking", value)}
          className="flex flex-row gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="si" id="isWorking-si" />
            <Label htmlFor="isWorking-si" className="font-normal">
              Sí
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="isWorking-no" />
            <Label htmlFor="isWorking-no" className="font-normal">
              No
            </Label>
          </div>
        </RadioGroup>
        <FieldError message={errors.isWorking} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>
          ¿Recibes otra beca actualmente? <RequiredMark />
        </Label>
        <RadioGroup
          value={values.receivesOtherScholarship}
          onValueChange={(value) => setField("receivesOtherScholarship", value)}
          className="flex flex-row gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="si" id="receivesOther-si" />
            <Label htmlFor="receivesOther-si" className="font-normal">
              Sí
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="receivesOther-no" />
            <Label htmlFor="receivesOther-no" className="font-normal">
              No
            </Label>
          </div>
        </RadioGroup>
        <FieldError message={errors.receivesOtherScholarship} />
      </div>

      {values.receivesOtherScholarship === "si" && (
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <Label htmlFor="otherScholarshipName">
            ¿Cuál beca recibes? <RequiredMark />
          </Label>
          <Input
            id="otherScholarshipName"
            value={values.otherScholarshipName}
            onChange={(e) => setField("otherScholarshipName", e.target.value)}
            aria-invalid={!!errors.otherScholarshipName}
          />
          <FieldError message={errors.otherScholarshipName} />
        </div>
      )}
    </div>
  );
}

function DocumentsStep({ values, errors, setField }: StepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <FileUploadMock
          label="Identificación oficial"
          required
          value={values.officialId}
          onChange={(name) => setField("officialId", name)}
          error={errors.officialId}
        />
        <FileUploadMock
          label="Constancia de inscripción"
          required
          value={values.enrollmentProof}
          onChange={(name) => setField("enrollmentProof", name)}
          error={errors.enrollmentProof}
        />
        <FileUploadMock
          label="Historial académico / boleta"
          required
          value={values.transcript}
          onChange={(name) => setField("transcript", name)}
          error={errors.transcript}
        />
        <FileUploadMock
          label="Comprobante de ingresos"
          value={values.incomeProof}
          onChange={(name) => setField("incomeProof", name)}
          hint="Solo se solicitará si resultas beneficiario (p. ej. CLABE para depósito)."
        />
        <FileUploadMock
          label="Carta de motivos"
          value={values.motivationLetter}
          onChange={(name) => setField("motivationLetter", name)}
        />
      </div>

      <div className="border-border flex flex-col gap-3 border-t pt-4">
        <div className="flex items-start gap-2.5">
          <Checkbox
            id="truthDeclaration"
            checked={values.truthDeclaration}
            onCheckedChange={(checked) =>
              setField("truthDeclaration", checked === true)
            }
            aria-invalid={!!errors.truthDeclaration}
          />
          <div className="flex flex-col gap-1">
            <Label htmlFor="truthDeclaration" className="font-normal">
              Declaro que la información proporcionada es verdadera.
            </Label>
            <FieldError message={errors.truthDeclaration} />
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <Checkbox
            id="privacyConsent"
            checked={values.privacyConsent}
            onCheckedChange={(checked) =>
              setField("privacyConsent", checked === true)
            }
            aria-invalid={!!errors.privacyConsent}
          />
          <div className="flex flex-col gap-1">
            <Label htmlFor="privacyConsent" className="font-normal">
              Acepto el aviso de privacidad y el uso de mis datos para fines de
              orientación y postulación a becas.
            </Label>
            <FieldError message={errors.privacyConsent} />
          </div>
        </div>
      </div>
    </div>
  );
}
