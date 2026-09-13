import ExcelJS from 'exceljs';
import { formatCedula } from './cedula';

export interface AthleteExportItem {
  id: string;
  name: string;
  cedula: string;
  phone?: string | null;
  status: string;
  paid_until?: string | null;
  position?: string | null;
  has_alliance?: boolean | null;
  user_id?: string | null;
  created_at?: string | null;
  teams?: {
    id?: string;
    name?: string;
    category?: string;
  } | {
    id?: string;
    name?: string;
    category?: string;
  }[] | null;
}

/**
 * Genera y descarga directamente en el navegador un archivo Excel (.xlsx)
 * con diseño corporativo KsaSports (cabecera Vinotinto, columnas autoajustadas).
 */
export async function exportAthletesToExcel(
  athletes: AthleteExportItem[],
  customSubtitle?: string
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'KsaSports Management';
  workbook.lastModifiedBy = 'KsaSports Admin';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('Roster de Atletas', {
    views: [{ showGridLines: true }]
  });

  // 1. Configurar Columnas
  worksheet.columns = [
    { header: '#', key: 'index', width: 6 },
    { header: 'Nombre Completo', key: 'name', width: 28 },
    { header: 'Cédula de Identidad', key: 'cedula', width: 20 },
    { header: 'Teléfono', key: 'phone', width: 18 },
    { header: 'Disciplina / Categoría', key: 'category', width: 24 },
    { header: 'Equipo', key: 'team', width: 24 },
    { header: 'Estatus', key: 'status', width: 15 },
    { header: 'Solvente Hasta', key: 'paid_until', width: 16 },
    { header: 'Posición', key: 'position', width: 14 },
    { header: 'Alianza', key: 'has_alliance', width: 12 },
    { header: 'Usuario Portal', key: 'portal_user', width: 16 },
    { header: 'Fecha de Registro', key: 'created_at', width: 18 },
  ];

  // 2. Estilizar Fila de Encabezados (Fila 1)
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.font = { 
    name: 'Segoe UI', 
    size: 11, 
    bold: true, 
    color: { argb: 'FFFFFFFF' } 
  };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF800020' } // Vinotinto KsaSports
  };
  headerRow.alignment = { 
    vertical: 'middle', 
    horizontal: 'center',
    wrapText: false
  };

  // 3. Añadir Datos
  athletes.forEach((athlete, i) => {
    let formattedPaidUntil = 'N/A';
    if (athlete.paid_until) {
      try {
        const parts = athlete.paid_until.split('T')[0].split('-');
        if (parts.length === 3) {
          formattedPaidUntil = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      } catch (e) {
        formattedPaidUntil = athlete.paid_until;
      }
    }

    let formattedCreatedAt = 'N/A';
    if (athlete.created_at) {
      try {
        const parts = athlete.created_at.split('T')[0].split('-');
        if (parts.length === 3) {
          formattedCreatedAt = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      } catch (e) {
        formattedCreatedAt = athlete.created_at;
      }
    }

    const teamObj = Array.isArray(athlete.teams) ? athlete.teams[0] : athlete.teams;

    const row = worksheet.addRow({
      index: i + 1,
      name: athlete.name || 'Sin Nombre',
      cedula: formatCedula(athlete.cedula),
      phone: athlete.phone || 'N/A',
      category: teamObj?.category || 'Sin Categoría',
      team: teamObj?.name || 'Sin Equipo',
      status: athlete.status || 'Inactivo',
      paid_until: formattedPaidUntil,
      position: athlete.position || 'N/A',
      has_alliance: athlete.has_alliance ? 'Sí' : 'No',
      portal_user: athlete.user_id ? 'Activo' : 'Pendiente',
      created_at: formattedCreatedAt,
    });

    row.height = 22;
    row.alignment = { vertical: 'middle' };

    // Estilos condicionales por celda
    // Índice centrado
    row.getCell('index').alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell('cedula').alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell('status').alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell('paid_until').alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell('position').alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell('has_alliance').alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell('portal_user').alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell('created_at').alignment = { vertical: 'middle', horizontal: 'center' };

    // Resaltar Estatus
    const statusCell = row.getCell('status');
    if (athlete.status === 'Solvente') {
      statusCell.font = { bold: true, color: { argb: 'FF15803D' } }; // Verde
    } else if (athlete.status === 'Moroso') {
      statusCell.font = { bold: true, color: { argb: 'FFDC2626' } }; // Rojo
    } else {
      statusCell.font = { bold: false, color: { argb: 'FF64748B' } }; // Gris
    }

    // Bordes sutiles en cada celda
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });

    // Fila cebra alterna para facilitar la lectura
    if (i % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' }
      };
    }
  });

  // 4. Autoajustar anchos de columnas basándose en el contenido
  worksheet.columns.forEach((column) => {
    let maxLength = column.header ? column.header.length : 12;
    if (column.eachCell) {
      column.eachCell({ includeEmpty: false }, (cell) => {
        const valStr = cell.value ? cell.value.toString() : '';
        if (valStr.length > maxLength) {
          maxLength = valStr.length;
        }
      });
    }
    column.width = Math.max(maxLength + 4, column.width || 12);
  });

  // 5. Generar Buffer y Disparar Descarga en el Navegador
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const cleanSubtitle = customSubtitle ? `_${customSubtitle.replace(/[^a-zA-Z0-9_-]/g, '')}` : '';
  const fileName = `KsaSports_Atletas${cleanSubtitle}_${dateStr}.xlsx`;

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export interface LedgerExportData {
  dateRangeStr: string;
  totalRevenue: number;
  transactionCount: number;
  averageTicket: number;
  productsSold: number;
  methods: { name: string; count: number; total: number; percentage: number }[];
  products: { name: string; count: number; total: number; percentage: number }[];
  installments: {
    name: string;
    athleteCount: number;
    totalFacturado: number;
    totalAbonado: number;
    saldoPendiente: number;
    percent: number;
  }[];
  transactions: {
    id: string;
    date: string;
    athleteName: string;
    athleteCedula: string;
    productName: string;
    method: string;
    reference?: string | null;
    amount: number;
  }[];
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

/**
 * Genera y descarga directamente un archivo Excel profesional (.xlsx)
 * con el Libro Mayor Financiero y el detalle de transacciones respetando filtros.
 */
export async function exportLedgerToExcel(data: LedgerExportData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'KsaSports Management';
  workbook.lastModifiedBy = 'KsaSports Admin';
  workbook.created = new Date();
  workbook.modified = new Date();

  const thinBorder = {
    top: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } }
  };

  const totalBorder = {
    top: { style: 'thin' as const, color: { argb: 'FF94A3B8' } },
    left: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'double' as const, color: { argb: 'FF475569' } },
    right: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } }
  };

  // ==========================================
  // PESTAÑA 1: LIBRO MAYOR (RESUMEN EJECUTIVO)
  // ==========================================
  const wsSummary = workbook.addWorksheet('Libro Mayor', {
    views: [{ showGridLines: true }]
  });

  // Título Vinotinto Corporativo
  wsSummary.mergeCells('A1:E1');
  const titleCell = wsSummary.getCell('A1');
  titleCell.value = 'KSA SPORTS - REPORTE FINANCIERO Y LIBRO MAYOR';
  titleCell.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF800020' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  wsSummary.getRow(1).height = 30;

  // Subtítulo con Período Filtrado
  wsSummary.mergeCells('A2:E2');
  const subtitleCell = wsSummary.getCell('A2');
  subtitleCell.value = `Período Analizado: ${data.dateRangeStr}  |  Generado: ${new Date().toLocaleDateString('es-VE')}`;
  subtitleCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF334155' } };
  subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  wsSummary.getRow(2).height = 20;

  wsSummary.getRow(3).height = 10;

  // --- SECCIÓN 1: KPIs GENERALES ---
  const kpiTitleRow = wsSummary.getRow(4);
  kpiTitleRow.getCell(1).value = 'MÉTRICAS CLAVE DEL PERÍODO';
  kpiTitleRow.getCell(1).font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF800020' } };
  kpiTitleRow.height = 22;

  const kpiData = [
    { label: 'Ingreso Total Validado', value: data.totalRevenue, isCurrency: true, isHighlight: true },
    { label: 'Total de Transacciones', value: data.transactionCount, isCurrency: false },
    { label: 'Ticket Promedio', value: data.averageTicket, isCurrency: true },
    { label: 'Productos Vendidos', value: data.productsSold, isCurrency: false },
  ];

  kpiData.forEach((kpi, idx) => {
    const r = wsSummary.getRow(5 + idx);
    r.height = 22;
    const labelCell = r.getCell(1);
    labelCell.value = kpi.label;
    labelCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF475569' } };
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    labelCell.border = thinBorder;

    const valCell = r.getCell(2);
    valCell.value = kpi.value;
    valCell.border = thinBorder;
    valCell.alignment = { vertical: 'middle', horizontal: kpi.isCurrency ? 'right' : 'center' };
    if (kpi.isCurrency) {
      valCell.numFmt = '"$"#,##0.00';
    } else {
      valCell.numFmt = '#,##0';
    }
    if (kpi.isHighlight) {
      valCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FF15803D' } };
      valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
    } else {
      valCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    }
  });

  let currentRow = 10;
  wsSummary.getRow(currentRow).height = 14;
  currentRow++;

  // --- SECCIÓN 2: DESGLOSE POR PRODUCTO / CONCEPTO ---
  const prodTitleRow = wsSummary.getRow(currentRow);
  prodTitleRow.getCell(1).value = 'INGRESOS POR PRODUCTO / CONCEPTO (RANKING DE VENTAS)';
  prodTitleRow.getCell(1).font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF800020' } };
  prodTitleRow.height = 22;
  currentRow++;

  // Encabezados Tabla Productos
  const prodHeaderRow = wsSummary.getRow(currentRow);
  prodHeaderRow.height = 24;
  const prodHeaders = ['#', 'Producto / Concepto', 'Transacciones', 'Total Recaudado ($)', '% del Total'];
  prodHeaders.forEach((h, i) => {
    const cell = prodHeaderRow.getCell(i + 1);
    cell.value = h;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF800020' } };
    cell.alignment = { vertical: 'middle', horizontal: i === 1 ? 'left' : (i === 3 || i === 4 ? 'right' : 'center') };
    cell.border = thinBorder;
  });
  currentRow++;

  if (data.products.length === 0) {
    const emptyRow = wsSummary.getRow(currentRow);
    wsSummary.mergeCells(`A${currentRow}:E${currentRow}`);
    const emptyCell = emptyRow.getCell(1);
    emptyCell.value = 'No se registraron ventas de productos en este período.';
    emptyCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF94A3B8' } };
    emptyCell.alignment = { vertical: 'middle', horizontal: 'center' };
    emptyRow.height = 24;
    currentRow++;
  } else {
    data.products.forEach((prod, i) => {
      const row = wsSummary.getRow(currentRow);
      row.height = 21;

      const c1 = row.getCell(1);
      c1.value = i + 1;
      c1.alignment = { vertical: 'middle', horizontal: 'center' };
      c1.border = thinBorder;

      const c2 = row.getCell(2);
      c2.value = prod.name;
      c2.alignment = { vertical: 'middle', horizontal: 'left' };
      c2.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1E293B' } };
      c2.border = thinBorder;

      const c3 = row.getCell(3);
      c3.value = prod.count;
      c3.numFmt = '#,##0';
      c3.alignment = { vertical: 'middle', horizontal: 'center' };
      c3.border = thinBorder;

      const c4 = row.getCell(4);
      c4.value = prod.total;
      c4.numFmt = '"$"#,##0.00';
      c4.alignment = { vertical: 'middle', horizontal: 'right' };
      c4.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF15803D' } };
      c4.border = thinBorder;

      const c5 = row.getCell(5);
      c5.value = prod.percentage / 100;
      c5.numFmt = '0.0%';
      c5.alignment = { vertical: 'middle', horizontal: 'right' };
      c5.border = thinBorder;

      if (i % 2 === 1) {
        for (let col = 1; col <= 5; col++) {
          row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
      }
      currentRow++;
    });

    // Fila de Total Productos
    const prodTotalRow = wsSummary.getRow(currentRow);
    prodTotalRow.height = 24;
    prodTotalRow.getCell(2).value = 'TOTAL GENERAL';
    prodTotalRow.getCell(2).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    
    const totalProdCount = data.products.reduce((acc, p) => acc + p.count, 0);
    const prodCountCell = prodTotalRow.getCell(3);
    prodCountCell.value = totalProdCount;
    prodCountCell.numFmt = '#,##0';
    prodCountCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    prodCountCell.alignment = { vertical: 'middle', horizontal: 'center' };

    const prodTotalAmountCell = prodTotalRow.getCell(4);
    prodTotalAmountCell.value = data.totalRevenue;
    prodTotalAmountCell.numFmt = '"$"#,##0.00';
    prodTotalAmountCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF15803D' } };
    prodTotalAmountCell.alignment = { vertical: 'middle', horizontal: 'right' };

    const prodPctCell = prodTotalRow.getCell(5);
    prodPctCell.value = 1.0;
    prodPctCell.numFmt = '0.0%';
    prodPctCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    prodPctCell.alignment = { vertical: 'middle', horizontal: 'right' };

    for (let col = 1; col <= 5; col++) {
      const c = prodTotalRow.getCell(col);
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      c.border = totalBorder;
    }
    currentRow++;
  }

  wsSummary.getRow(currentRow).height = 14;
  currentRow++;

  // --- SECCIÓN 3: INGRESOS POR MÉTODO DE PAGO ---
  const methodTitleRow = wsSummary.getRow(currentRow);
  methodTitleRow.getCell(1).value = 'INGRESOS POR MÉTODO DE PAGO';
  methodTitleRow.getCell(1).font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF800020' } };
  methodTitleRow.height = 22;
  currentRow++;

  const methodHeaderRow = wsSummary.getRow(currentRow);
  methodHeaderRow.height = 24;
  const methodHeaders = ['#', 'Método de Pago', 'Transacciones', 'Total Recaudado ($)', '% Participación'];
  methodHeaders.forEach((h, i) => {
    const cell = methodHeaderRow.getCell(i + 1);
    cell.value = h;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF800020' } };
    cell.alignment = { vertical: 'middle', horizontal: i === 1 ? 'left' : (i === 3 || i === 4 ? 'right' : 'center') };
    cell.border = thinBorder;
  });
  currentRow++;

  if (data.methods.length === 0) {
    const emptyRow = wsSummary.getRow(currentRow);
    wsSummary.mergeCells(`A${currentRow}:E${currentRow}`);
    const emptyCell = emptyRow.getCell(1);
    emptyCell.value = 'No hay transacciones registradas por método de pago.';
    emptyCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF94A3B8' } };
    emptyCell.alignment = { vertical: 'middle', horizontal: 'center' };
    emptyRow.height = 24;
    currentRow++;
  } else {
    data.methods.forEach((m, i) => {
      const row = wsSummary.getRow(currentRow);
      row.height = 21;

      const c1 = row.getCell(1);
      c1.value = i + 1;
      c1.alignment = { vertical: 'middle', horizontal: 'center' };
      c1.border = thinBorder;

      const c2 = row.getCell(2);
      c2.value = m.name;
      c2.alignment = { vertical: 'middle', horizontal: 'left' };
      c2.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1E293B' } };
      c2.border = thinBorder;

      const c3 = row.getCell(3);
      c3.value = m.count;
      c3.numFmt = '#,##0';
      c3.alignment = { vertical: 'middle', horizontal: 'center' };
      c3.border = thinBorder;

      const c4 = row.getCell(4);
      c4.value = m.total;
      c4.numFmt = '"$"#,##0.00';
      c4.alignment = { vertical: 'middle', horizontal: 'right' };
      c4.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF15803D' } };
      c4.border = thinBorder;

      const c5 = row.getCell(5);
      c5.value = m.percentage / 100;
      c5.numFmt = '0.0%';
      c5.alignment = { vertical: 'middle', horizontal: 'right' };
      c5.border = thinBorder;

      if (i % 2 === 1) {
        for (let col = 1; col <= 5; col++) {
          row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
      }
      currentRow++;
    });

    const methodTotalRow = wsSummary.getRow(currentRow);
    methodTotalRow.height = 24;
    methodTotalRow.getCell(2).value = 'TOTAL POR MÉTODOS';
    methodTotalRow.getCell(2).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };

    const totalMethodCount = data.methods.reduce((acc, m) => acc + m.count, 0);
    const mCountCell = methodTotalRow.getCell(3);
    mCountCell.value = totalMethodCount;
    mCountCell.numFmt = '#,##0';
    mCountCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    mCountCell.alignment = { vertical: 'middle', horizontal: 'center' };

    const mTotalAmountCell = methodTotalRow.getCell(4);
    mTotalAmountCell.value = data.totalRevenue;
    mTotalAmountCell.numFmt = '"$"#,##0.00';
    mTotalAmountCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF15803D' } };
    mTotalAmountCell.alignment = { vertical: 'middle', horizontal: 'right' };

    const mPctCell = methodTotalRow.getCell(5);
    mPctCell.value = 1.0;
    mPctCell.numFmt = '0.0%';
    mPctCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    mPctCell.alignment = { vertical: 'middle', horizontal: 'right' };

    for (let col = 1; col <= 5; col++) {
      const c = methodTotalRow.getCell(col);
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      c.border = totalBorder;
    }
    currentRow++;
  }

  // --- SECCIÓN 4: SEGUIMIENTO DE ABONOS Y DEUDAS (Si existen cuotas) ---
  if (data.installments && data.installments.length > 0) {
    wsSummary.getRow(currentRow).height = 14;
    currentRow++;

    const instTitleRow = wsSummary.getRow(currentRow);
    instTitleRow.getCell(1).value = 'SEGUIMIENTO DE ABONOS Y COBRANZA (CUOTAS ACTIVAS)';
    instTitleRow.getCell(1).font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF800020' } };
    instTitleRow.height = 22;
    currentRow++;

    const instHeaders = ['#', 'Producto / Torneo', 'Atletas', 'Total Facturado ($)', 'Total Abonado ($)', 'Saldo Pendiente ($)', '% Cobranza'];
    const instHeaderRow = wsSummary.getRow(currentRow);
    instHeaderRow.height = 24;
    instHeaders.forEach((h, i) => {
      const cell = instHeaderRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF800020' } };
      cell.alignment = { vertical: 'middle', horizontal: i === 1 ? 'left' : (i >= 3 && i <= 6 ? 'right' : 'center') };
      cell.border = thinBorder;
    });
    currentRow++;

    data.installments.forEach((inst, i) => {
      const row = wsSummary.getRow(currentRow);
      row.height = 21;

      const c1 = row.getCell(1);
      c1.value = i + 1;
      c1.alignment = { vertical: 'middle', horizontal: 'center' };
      c1.border = thinBorder;

      const c2 = row.getCell(2);
      c2.value = inst.name;
      c2.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1E293B' } };
      c2.alignment = { vertical: 'middle', horizontal: 'left' };
      c2.border = thinBorder;

      const c3 = row.getCell(3);
      c3.value = inst.athleteCount;
      c3.numFmt = '#,##0';
      c3.alignment = { vertical: 'middle', horizontal: 'center' };
      c3.border = thinBorder;

      const c4 = row.getCell(4);
      c4.value = inst.totalFacturado;
      c4.numFmt = '"$"#,##0.00';
      c4.alignment = { vertical: 'middle', horizontal: 'right' };
      c4.border = thinBorder;

      const c5 = row.getCell(5);
      c5.value = inst.totalAbonado;
      c5.numFmt = '"$"#,##0.00';
      c5.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF15803D' } };
      c5.alignment = { vertical: 'middle', horizontal: 'right' };
      c5.border = thinBorder;

      const c6 = row.getCell(6);
      c6.value = inst.saldoPendiente;
      c6.numFmt = '"$"#,##0.00';
      c6.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFDC2626' } };
      c6.alignment = { vertical: 'middle', horizontal: 'right' };
      c6.border = thinBorder;

      const c7 = row.getCell(7);
      c7.value = inst.percent / 100;
      c7.numFmt = '0.0%';
      c7.alignment = { vertical: 'middle', horizontal: 'right' };
      c7.font = { name: 'Segoe UI', size: 10, bold: true };
      c7.border = thinBorder;

      if (i % 2 === 1) {
        for (let col = 1; col <= 7; col++) {
          row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
      }
      currentRow++;
    });
  }

  // Autoajustar anchos Pestaña 1
  wsSummary.columns.forEach((col, colIdx) => {
    let max = 14;
    col.eachCell?.({ includeEmpty: false }, (cell, rowNumber) => {
      // Ignorar celdas combinadas de títulos para el ancho de columnas
      if (rowNumber <= 2) return;
      const str = cell.value ? cell.value.toString() : '';
      if (str.length > max) max = str.length;
    });
    col.width = Math.min(Math.max(max + 4, colIdx === 1 ? 30 : 16), 45);
  });

  // ==========================================
  // PESTAÑA 2: DETALLE DE TRANSACCIONES
  // ==========================================
  const wsDetail = workbook.addWorksheet('Transacciones Detalladas', {
    views: [{ showGridLines: true }]
  });

  // Título Vinotinto
  wsDetail.mergeCells('A1:H1');
  const dTitle = wsDetail.getCell('A1');
  dTitle.value = 'KSA SPORTS - DETALLE INDIVIDUAL DE TRANSACCIONES VALIDADAS';
  dTitle.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  dTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF800020' } };
  dTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  wsDetail.getRow(1).height = 30;

  // Subtítulo
  wsDetail.mergeCells('A2:H2');
  const dSub = wsDetail.getCell('A2');
  dSub.value = `Filtro de Fechas: ${data.dateRangeStr}  |  Total Transacciones: ${data.transactions.length}  |  Monto Total: $${data.totalRevenue.toFixed(2)}`;
  dSub.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF334155' } };
  dSub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  dSub.alignment = { vertical: 'middle', horizontal: 'center' };
  wsDetail.getRow(2).height = 20;

  wsDetail.getRow(3).height = 10;

  // Columnas y Encabezados
  const detailHeaders = [
    { header: '#', key: 'idx', width: 8 },
    { header: 'Fecha y Hora', key: 'date', width: 18 },
    { header: 'Atleta / Beneficiario', key: 'athlete', width: 28 },
    { header: 'Cédula', key: 'cedula', width: 18 },
    { header: 'Concepto / Producto', key: 'product', width: 28 },
    { header: 'Método de Pago', key: 'method', width: 18 },
    { header: 'Referencia', key: 'reference', width: 18 },
    { header: 'Monto ($)', key: 'amount', width: 18 },
  ];

  const detailHeaderRow = wsDetail.getRow(4);
  detailHeaderRow.height = 26;
  detailHeaders.forEach((dh, idx) => {
    const cell = detailHeaderRow.getCell(idx + 1);
    cell.value = dh.header;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF800020' } };
    cell.alignment = { vertical: 'middle', horizontal: idx === 7 ? 'right' : (idx === 2 || idx === 4 ? 'left' : 'center') };
    cell.border = thinBorder;
  });

  let detailRowIdx = 5;

  if (data.transactions.length === 0) {
    wsDetail.mergeCells('A5:H5');
    const emptyCell = wsDetail.getCell('A5');
    emptyCell.value = 'No se registraron transacciones completadas en este período de fechas.';
    emptyCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF94A3B8' } };
    emptyCell.alignment = { vertical: 'middle', horizontal: 'center' };
    wsDetail.getRow(5).height = 26;
  } else {
    data.transactions.forEach((tx, i) => {
      const row = wsDetail.getRow(detailRowIdx);
      row.height = 21;

      const c1 = row.getCell(1);
      c1.value = i + 1;
      c1.alignment = { vertical: 'middle', horizontal: 'center' };
      c1.border = thinBorder;

      const c2 = row.getCell(2);
      c2.value = formatDateTime(tx.date);
      c2.alignment = { vertical: 'middle', horizontal: 'center' };
      c2.border = thinBorder;

      const c3 = row.getCell(3);
      c3.value = tx.athleteName || 'Público General';
      c3.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1E293B' } };
      c3.alignment = { vertical: 'middle', horizontal: 'left' };
      c3.border = thinBorder;

      const c4 = row.getCell(4);
      c4.value = tx.athleteCedula ? formatCedula(tx.athleteCedula) : 'N/A';
      c4.alignment = { vertical: 'middle', horizontal: 'center' };
      c4.border = thinBorder;

      const c5 = row.getCell(5);
      c5.value = tx.productName || 'Sin Concepto';
      c5.alignment = { vertical: 'middle', horizontal: 'left' };
      c5.border = thinBorder;

      const c6 = row.getCell(6);
      c6.value = tx.method || 'No especificado';
      c6.alignment = { vertical: 'middle', horizontal: 'center' };
      c6.border = thinBorder;

      const c7 = row.getCell(7);
      c7.value = tx.reference || 'N/A';
      c7.alignment = { vertical: 'middle', horizontal: 'center' };
      c7.border = thinBorder;

      const c8 = row.getCell(8);
      c8.value = tx.amount;
      c8.numFmt = '"$"#,##0.00';
      c8.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF15803D' } };
      c8.alignment = { vertical: 'middle', horizontal: 'right' };
      c8.border = thinBorder;

      if (i % 2 === 1) {
        for (let col = 1; col <= 8; col++) {
          row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
      }
      detailRowIdx++;
    });

    // Fila de Total de Transacciones
    const detailTotalRow = wsDetail.getRow(detailRowIdx);
    detailTotalRow.height = 26;
    
    detailTotalRow.getCell(6).value = 'TOTAL VALIDADO:';
    detailTotalRow.getCell(6).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    detailTotalRow.getCell(6).alignment = { vertical: 'middle', horizontal: 'right' };

    detailTotalRow.getCell(7).value = `${data.transactions.length} pagos`;
    detailTotalRow.getCell(7).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF475569' } };
    detailTotalRow.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };

    const grandTotalCell = detailTotalRow.getCell(8);
    grandTotalCell.value = data.totalRevenue;
    grandTotalCell.numFmt = '"$"#,##0.00';
    grandTotalCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FF15803D' } };
    grandTotalCell.alignment = { vertical: 'middle', horizontal: 'right' };

    for (let col = 1; col <= 8; col++) {
      const c = detailTotalRow.getCell(col);
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      c.border = totalBorder;
    }
  }

  // Autoajustar columnas Pestaña 2
  detailHeaders.forEach((dh, idx) => {
    const col = wsDetail.getColumn(idx + 1);
    let max = dh.header.length;
    col.eachCell?.({ includeEmpty: false }, (cell, rowNumber) => {
      if (rowNumber <= 2) return;
      const str = cell.value ? cell.value.toString() : '';
      if (str.length > max) max = str.length;
    });
    col.width = Math.max(max + 4, dh.width);
  });

  // ==========================================
  // DISPARAR DESCARGA EN EL NAVEGADOR
  // ==========================================
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const cleanRange = data.dateRangeStr.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `KsaSports_LibroMayor_${cleanRange}.xlsx`;

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

