// =====================================================================
//  utils/csv.ts  →  Lector de archivos CSV (para importar productos)
// =====================================================================
//  Entiende separador coma o punto y coma (Excel en español usa ";"),
//  textos entre comillas y saltos de línea de Windows.
// =====================================================================
export function parsearCsv(texto: string): string[][] {
  const limpio = texto.replace(/^\ufeff/, ''); // quita la marca BOM de Excel
  const primera = limpio.split(/\r?\n/)[0] ?? '';
  const separador = (primera.match(/;/g) ?? []).length > (primera.match(/,/g) ?? []).length ? ';' : ',';

  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = '';
  let entreComillas = false;

  const cerrarFila = () => {
    fila.push(campo);
    campo = '';
    if (fila.some((x) => x.trim() !== '')) filas.push(fila);
    fila = [];
  };

  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i];
    if (entreComillas) {
      if (c === '"') {
        if (limpio[i + 1] === '"') { campo += '"'; i++; }
        else entreComillas = false;
      } else campo += c;
    } else if (c === '"') entreComillas = true;
    else if (c === separador) { fila.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && limpio[i + 1] === '\n') i++;
      cerrarFila();
    } else campo += c;
  }
  cerrarFila();
  return filas;
}

/** Convierte el CSV en objetos usando la primera fila como nombres de columna. */
export function csvAFilas(texto: string): Record<string, string>[] {
  const [cabecera, ...resto] = parsearCsv(texto);
  if (!cabecera) return [];
  const claves = cabecera.map((h) =>
    h.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_')
  );
  return resto.map((f) => Object.fromEntries(claves.map((k, i) => [k, (f[i] ?? '').trim()])));
}
