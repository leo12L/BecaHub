@AGENTS.md

## Curación asistida por IA (`/api/admin/ai/parse-beca`)

La extracción de campos de becas vive aislada en `src/lib/ai/parse-scholarship.ts`
(función `parseScholarshipText`). Proveedor actual: **API de Groq** (hosted,
OpenAI-compatible) vía `fetch` (`GROQ_API_KEY`, `GROQ_MODEL`, default
`llama-3.3-70b-versatile`), sin SDK. Planeado para después: capa intermedia con
n8n + modelo hosted (no implementado todavía). Si cambias de proveedor, toca
solo ese módulo. Ver Fase 3 en `BITACORA.md` para el detalle.
