import "dotenv/config";
import { ejecutarIngesta } from "../src/lib/ingesta/ejecutar";

/**
 * Script para ejecutar la ingesta automática de becas desde todas
 * las fuentes activas. Cada fuente se procesa de forma aislada:
 * si una falla, las demás continúan.
 *
 * Uso: npm run ingesta
 */
async function main() {
  console.log("=".repeat(60));
  console.log("Ingesta Automática de Becas - BecaHub");
  console.log("=".repeat(60));
  console.log();

  const resultados = await ejecutarIngesta("all");

  console.log();
  console.log("=".repeat(60));
  console.log("RESUMEN DE INGESTA");
  console.log("=".repeat(60));

  for (const resultado of resultados) {
    console.log();
    console.log(`Fuente: ${resultado.fuente}`);
    console.log(`Status: ${resultado.status}`);
    console.log(`Encontradas: ${resultado.encontradas}`);
    console.log(`Creadas: ${resultado.creadas}`);
    console.log(`Actualizadas: ${resultado.actualizadas}`);
    console.log(`Omitidas: ${resultado.omitidas}`);
    console.log(`Duración: ${resultado.duracionMs}ms`);

    if (resultado.error) {
      console.log(`Error: ${resultado.error}`);
    }
  }

  console.log();
  console.log("=".repeat(60));

  const totalCreadas = resultados.reduce((sum, r) => sum + r.creadas, 0);
  const totalActualizadas = resultados.reduce(
    (sum, r) => sum + r.actualizadas,
    0,
  );
  const todosFallaron = resultados.every((r) => r.status === "FAILED");

  console.log(`Total becas creadas: ${totalCreadas}`);
  console.log(`Total becas actualizadas: ${totalActualizadas}`);
  console.log();

  if (todosFallaron) {
    console.error("ERROR: Todas las fuentes fallaron");
    process.exitCode = 1;
  } else {
    console.log("✓ Ingesta completada");
  }
}

main().catch((error) => {
  console.error("Error fatal en la ingesta:");
  console.error(error);
  process.exit(1);
});
