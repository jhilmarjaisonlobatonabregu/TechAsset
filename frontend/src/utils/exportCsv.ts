export interface CsvColumna<T> {
  encabezado: string;
  obtenerValor: (fila: T) => string | number | boolean | null | undefined;
}

export function exportarACsv<T>(
  nombreArchivo: string,
  filas: readonly T[],
  columnas: readonly CsvColumna<T>[],
): void {
  const escaparCelda = (valor: string | number | boolean | null | undefined): string => {
    if (valor === null || valor === undefined) return '""';
    const texto = String(valor).replace(/"/g, '""');
    return `"${texto}"`;
  };

  const lineaEncabezados = columnas.map((c) => escaparCelda(c.encabezado)).join(',');
  const lineasDatos = filas.map((fila) =>
    columnas.map((col) => escaparCelda(col.obtenerValor(fila))).join(','),
  );

  // UTF-8 BOM para que Microsoft Excel abra tildes y eñes correctamente
  const contenidoCsv = `\uFEFF${[lineaEncabezados, ...lineasDatos].join('\r\n')}`;
  const blob = new Blob([contenidoCsv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.setAttribute('download', nombreArchivo.endsWith('.csv') ? nombreArchivo : `${nombreArchivo}.csv`);
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
