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
    rateType?: string;
    exchangeRate?: number;
    transferredAmount?: number;
    paymentCurrency?: string;
    dateRate?: string;
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
  wsDetail.mergeCells('A1:M1');
  const dTitle = wsDetail.getCell('A1');
  dTitle.value = 'KSA SPORTS - DETALLE INDIVIDUAL DE TRANSACCIONES VALIDADAS';
  dTitle.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  dTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF800020' } };
  dTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  wsDetail.getRow(1).height = 30;

  // Subtítulo
  wsDetail.mergeCells('A2:M2');
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
    { header: 'Moneda Base', key: 'rateType', width: 14 },
    { header: 'Monto ($)', key: 'amount', width: 16 },
    { header: 'Método de Pago', key: 'method', width: 20 },
    { header: 'Moneda Pago', key: 'paymentCurrency', width: 14 },
    { header: 'Monto Transferido', key: 'transferredAmount', width: 20 },
    { header: 'Tasa BCV', key: 'exchangeRate', width: 16 },
    { header: 'Fecha Tasa', key: 'dateRate', width: 16 },
    { header: 'Referencia', key: 'reference', width: 18 },
  ];

  const detailHeaderRow = wsDetail.getRow(4);
  detailHeaderRow.height = 26;
  detailHeaders.forEach((dh, idx) => {
    const cell = detailHeaderRow.getCell(idx + 1);
    cell.value = dh.header;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF800020' } };
    cell.alignment = { vertical: 'middle', horizontal: idx === 6 || idx === 9 || idx === 10 ? 'right' : (idx === 2 || idx === 4 ? 'left' : 'center') };
    cell.border = thinBorder;
  });

  let detailRowIdx = 5;

  if (data.transactions.length === 0) {
    wsDetail.mergeCells('A5:M5');
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
      c6.value = tx.rateType || 'USD';
      c6.alignment = { vertical: 'middle', horizontal: 'center' };
      c6.border = thinBorder;

      const c7 = row.getCell(7);
      c7.value = tx.amount;
      c7.numFmt = '"$"#,##0.00';
      c7.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF15803D' } };
      c7.alignment = { vertical: 'middle', horizontal: 'right' };
      c7.border = thinBorder;

      const c8 = row.getCell(8);
      c8.value = tx.method || 'No especificado';
      c8.alignment = { vertical: 'middle', horizontal: 'center' };
      c8.border = thinBorder;

      const c9 = row.getCell(9);
      c9.value = tx.paymentCurrency || 'USD';
      c9.alignment = { vertical: 'middle', horizontal: 'center' };
      c9.border = thinBorder;

      const c10 = row.getCell(10);
      c10.value = tx.transferredAmount !== undefined ? tx.transferredAmount : tx.amount;
      c10.numFmt = tx.paymentCurrency === 'VES' ? '"Bs."#,##0.00' : '"$"#,##0.00';
      c10.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
      c10.alignment = { vertical: 'middle', horizontal: 'right' };
      c10.border = thinBorder;

      const c11 = row.getCell(11);
      c11.value = tx.exchangeRate || 1.0;
      c11.numFmt = '#,##0.0000';
      c11.alignment = { vertical: 'middle', horizontal: 'right' };
      c11.border = thinBorder;

      const c12 = row.getCell(12);
      c12.value = tx.dateRate || 'N/A';
      c12.alignment = { vertical: 'middle', horizontal: 'center' };
      c12.border = thinBorder;

      const c13 = row.getCell(13);
      c13.value = tx.reference || 'N/A';
      c13.alignment = { vertical: 'middle', horizontal: 'center' };
      c13.border = thinBorder;

      if (i % 2 === 1) {
        for (let col = 1; col <= 13; col++) {
          row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
      }
      detailRowIdx++;
    });

    // Fila de Total de Transacciones
    const detailTotalRow = wsDetail.getRow(detailRowIdx);
    detailTotalRow.height = 26;
    
    detailTotalRow.getCell(5).value = 'TOTAL VALIDADO:';
    detailTotalRow.getCell(5).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    detailTotalRow.getCell(5).alignment = { vertical: 'middle', horizontal: 'right' };

    detailTotalRow.getCell(6).value = `${data.transactions.length} pagos`;
    detailTotalRow.getCell(6).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF475569' } };
    detailTotalRow.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };

    const grandTotalCell = detailTotalRow.getCell(7);
    grandTotalCell.value = data.totalRevenue;
    grandTotalCell.numFmt = '"$"#,##0.00';
    grandTotalCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FF15803D' } };
    grandTotalCell.alignment = { vertical: 'middle', horizontal: 'right' };

    for (let col = 1; col <= 13; col++) {
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

export interface PaymentsExportItem {
  id: string;
  date: string;
  athleteName: string;
  athleteCedula: string;
  concept: string;
  method: string;
  reference: string;
  amount: number;
  status: 'Completado' | 'Pendiente' | 'Rechazado' | string;
  rateType?: string;
  exchangeRate?: number;
  transferredAmount?: number;
  paymentCurrency?: string;
  dateRate?: string;
}

export interface PaymentsExportData {
  dateRangeStr: string;
  totalCount: number;
  completedCount: number;
  pendingCount: number;
  rejectedCount: number;
  completedTotal: number;
  pendingTotal: number;
  rejectedTotal: number;
  methods: { name: string; count: number; total: number; percentage: number }[];
  concepts: { name: string; count: number; total: number; percentage: number }[];
  payments: PaymentsExportItem[];
}

/**
 * Genera y descarga directamente un archivo Excel profesional (.xlsx)
 * con el reporte de Finanzas y Pagos respetando el rango de fechas activo.
 */
export async function exportPaymentsToExcel(data: PaymentsExportData) {
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
    bottom: { style: 'thin' as const, color: { argb: 'FF94A3B8' } },
    right: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } }
  };

  const doubleBottomBorder = {
    top: { style: 'thin' as const, color: { argb: 'FF94A3B8' } },
    left: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'double' as const, color: { argb: 'FF475569' } },
    right: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } }
  };

  // ==========================================
  // PESTAÑA 1: HISTORIAL DE PAGOS (OPERATIVO)
  // ==========================================
  const wsPayments = workbook.addWorksheet('Historial de Pagos', {
    views: [{ showGridLines: true }]
  });

  // Título Vinotinto Corporativo
  wsPayments.mergeCells('A1:N1');
  const titleCell = wsPayments.getCell('A1');
  titleCell.value = 'KSA SPORTS - BANDEJA DE FINANZAS Y CONTROL DE PAGOS';
  titleCell.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF800020' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  wsPayments.getRow(1).height = 30;

  // Subtítulo con Período y Métricas
  wsPayments.mergeCells('A2:N2');
  const subCell = wsPayments.getCell('A2');
  subCell.value = `Filtro de Fechas: ${data.dateRangeStr}  |  Total Pagos: ${data.totalCount}  |  Aprobados: $${data.completedTotal.toFixed(2)}  |  Por Revisar: ${data.pendingCount}`;
  subCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF334155' } };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };
  wsPayments.getRow(2).height = 20;

  wsPayments.getRow(3).height = 10;

  // Encabezados de Columna
  const paymentHeaders = [
    { header: '#', key: 'idx', width: 6 },
    { header: 'Fecha y Hora', key: 'date', width: 18 },
    { header: 'Atleta / Pagador', key: 'athlete', width: 28 },
    { header: 'Cédula', key: 'cedula', width: 18 },
    { header: 'Concepto / Motivo', key: 'concept', width: 28 },
    { header: 'Moneda Base', key: 'rateType', width: 14 },
    { header: 'Monto Divisa', key: 'amount', width: 16 },
    { header: 'Método de Pago', key: 'method', width: 20 },
    { header: 'Moneda Pago', key: 'paymentCurrency', width: 14 },
    { header: 'Monto Transferido', key: 'transferredAmount', width: 20 },
    { header: 'Tasa BCV', key: 'exchangeRate', width: 16 },
    { header: 'Fecha de Tasa', key: 'dateRate', width: 16 },
    { header: 'N° Referencia', key: 'reference', width: 18 },
    { header: 'Estado', key: 'status', width: 16 },
  ];

  const headerRow = wsPayments.getRow(4);
  headerRow.height = 26;
  paymentHeaders.forEach((ph, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = ph.header;
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF800020' } };
    cell.alignment = { 
      vertical: 'middle', 
      horizontal: idx === 6 || idx === 9 || idx === 10 ? 'right' : (idx === 2 || idx === 4 ? 'left' : 'center') 
    };
    cell.border = thinBorder;
  });

  let curRowIdx = 5;

  if (data.payments.length === 0) {
    wsPayments.mergeCells(`A5:N5`);
    const emptyCell = wsPayments.getCell('A5');
    emptyCell.value = 'No hay pagos reportados en este período de fechas.';
    emptyCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF94A3B8' } };
    emptyCell.alignment = { vertical: 'middle', horizontal: 'center' };
    wsPayments.getRow(5).height = 26;
    curRowIdx++;
  } else {
    data.payments.forEach((p, i) => {
      const row = wsPayments.getRow(curRowIdx);
      row.height = 22;

      const c1 = row.getCell(1);
      c1.value = i + 1;
      c1.alignment = { vertical: 'middle', horizontal: 'center' };
      c1.border = thinBorder;

      const c2 = row.getCell(2);
      c2.value = formatDateTime(p.date);
      c2.alignment = { vertical: 'middle', horizontal: 'center' };
      c2.border = thinBorder;

      const c3 = row.getCell(3);
      c3.value = p.athleteName || 'Atleta Desconocido';
      c3.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1E293B' } };
      c3.alignment = { vertical: 'middle', horizontal: 'left' };
      c3.border = thinBorder;

      const c4 = row.getCell(4);
      c4.value = p.athleteCedula ? formatCedula(p.athleteCedula) : 'N/A';
      c4.alignment = { vertical: 'middle', horizontal: 'center' };
      c4.border = thinBorder;

      const c5 = row.getCell(5);
      c5.value = p.concept || 'Sin Concepto';
      c5.alignment = { vertical: 'middle', horizontal: 'left' };
      c5.border = thinBorder;

      const c6 = row.getCell(6);
      c6.value = p.rateType || 'USD';
      c6.alignment = { vertical: 'middle', horizontal: 'center' };
      c6.border = thinBorder;

      const c7 = row.getCell(7);
      c7.value = p.amount;
      c7.numFmt = '"$"#,##0.00';
      c7.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF800020' } };
      c7.alignment = { vertical: 'middle', horizontal: 'right' };
      c7.border = thinBorder;

      const c8 = row.getCell(8);
      c8.value = p.method || 'No Especificado';
      c8.alignment = { vertical: 'middle', horizontal: 'center' };
      c8.border = thinBorder;

      const c9 = row.getCell(9);
      c9.value = p.paymentCurrency || 'USD';
      c9.alignment = { vertical: 'middle', horizontal: 'center' };
      c9.border = thinBorder;

      const c10 = row.getCell(10);
      c10.value = p.transferredAmount !== undefined ? p.transferredAmount : p.amount;
      c10.numFmt = p.paymentCurrency === 'VES' ? '"Bs."#,##0.00' : '"$"#,##0.00';
      c10.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
      c10.alignment = { vertical: 'middle', horizontal: 'right' };
      c10.border = thinBorder;

      const c11 = row.getCell(11);
      c11.value = p.exchangeRate || 1.0;
      c11.numFmt = '#,##0.0000';
      c11.alignment = { vertical: 'middle', horizontal: 'right' };
      c11.border = thinBorder;

      const c12 = row.getCell(12);
      c12.value = p.dateRate || 'N/A';
      c12.alignment = { vertical: 'middle', horizontal: 'center' };
      c12.border = thinBorder;

      const c13 = row.getCell(13);
      c13.value = p.reference || 'N/A';
      c13.alignment = { vertical: 'middle', horizontal: 'center' };
      c13.border = thinBorder;

      const c14 = row.getCell(14);
      c14.value = p.status;
      c14.alignment = { vertical: 'middle', horizontal: 'center' };
      c14.border = thinBorder;

      // Resaltado de Estado (Semáforo contable)
      if (p.status === 'Completado') {
        c14.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF15803D' } };
        c14.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
      } else if (p.status === 'Pendiente') {
        c14.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFB45309' } };
        c14.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
      } else if (p.status === 'Rechazado') {
        c14.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFB91C1C' } };
        c14.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
      } else {
        c14.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF475569' } };
      }

      if (i % 2 === 1) {
        for (let col = 1; col <= 14; col++) {
          row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
      }
      curRowIdx++;
    });

    // Bloque de Totales al pie de la tabla
    const totalStatusItems = [
      { label: 'TOTAL APROBADO (Completado):', count: data.completedCount, amount: data.completedTotal, color: 'FF15803D' },
      { label: 'TOTAL POR REVISAR (Pendiente):', count: data.pendingCount, amount: data.pendingTotal, color: 'FFB45309' },
      { label: 'TOTAL RECHAZADO:', count: data.rejectedCount, amount: data.rejectedTotal, color: 'FFB91C1C' },
      { 
        label: 'TOTAL REPORTADO GLOBAL:', 
        count: data.totalCount, 
        amount: data.completedTotal + data.pendingTotal + data.rejectedTotal, 
        color: 'FF0F172A',
        isGrandTotal: true 
      },
    ];

    totalStatusItems.forEach(item => {
      const totRow = wsPayments.getRow(curRowIdx);
      totRow.height = 24;

      totRow.getCell(5).value = item.label;
      totRow.getCell(5).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: item.color } };
      totRow.getCell(5).alignment = { vertical: 'middle', horizontal: 'right' };

      totRow.getCell(6).value = `${item.count} pagos`;
      totRow.getCell(6).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF475569' } };
      totRow.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };

      const amtCell = totRow.getCell(7);
      amtCell.value = item.amount;
      amtCell.numFmt = '"$"#,##0.00';
      amtCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: item.color } };
      amtCell.alignment = { vertical: 'middle', horizontal: 'right' };

      for (let col = 1; col <= 14; col++) {
        const c = totRow.getCell(col);
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        c.border = item.isGrandTotal ? doubleBottomBorder : totalBorder;
      }
      curRowIdx++;
    });
  }

  // Autoajuste columnas Pestaña 1
  paymentHeaders.forEach((ph, idx) => {
    const col = wsPayments.getColumn(idx + 1);
    let max = ph.header.length;
    col.eachCell?.({ includeEmpty: false }, (cell, rowNumber) => {
      if (rowNumber <= 2) return;
      const str = cell.value ? cell.value.toString() : '';
      if (str.length > max) max = str.length;
    });
    col.width = Math.max(max + 4, ph.width);
  });

  // ==========================================
  // PESTAÑA 2: RESUMEN DE FINANZAS Y DESGLOSE
  // ==========================================
  const wsSummary = workbook.addWorksheet('Resumen de Finanzas', {
    views: [{ showGridLines: true }]
  });

  wsSummary.mergeCells('A1:E1');
  const sumTitle = wsSummary.getCell('A1');
  sumTitle.value = 'KSA SPORTS - RESUMEN CONSOLIDADO DE FINANZAS';
  sumTitle.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  sumTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF800020' } };
  sumTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  wsSummary.getRow(1).height = 30;

  wsSummary.mergeCells('A2:E2');
  const sumSub = wsSummary.getCell('A2');
  sumSub.value = `Período Analizado: ${data.dateRangeStr}  |  Generado: ${new Date().toLocaleDateString('es-VE')}`;
  sumSub.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF334155' } };
  sumSub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  sumSub.alignment = { vertical: 'middle', horizontal: 'center' };
  wsSummary.getRow(2).height = 20;

  wsSummary.getRow(3).height = 10;

  // --- SECCIÓN 1: BALANCE POR ESTADO ---
  const s1Row = wsSummary.getRow(4);
  s1Row.getCell(1).value = '1. BALANCE GENERAL POR ESTADO DE PAGO';
  s1Row.getCell(1).font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF800020' } };
  s1Row.height = 22;

  const statusHeaders = ['Estado', 'Cantidad de Pagos', 'Monto Total ($)', '% del Monto Total'];
  const s1HeaderRow = wsSummary.getRow(5);
  s1HeaderRow.height = 24;
  statusHeaders.forEach((h, i) => {
    const c = s1HeaderRow.getCell(i + 1);
    c.value = h;
    c.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF800020' } };
    c.alignment = { vertical: 'middle', horizontal: i === 0 ? 'left' : (i >= 2 ? 'right' : 'center') };
    c.border = thinBorder;
  });

  const grandTotalAmount = data.completedTotal + data.pendingTotal + data.rejectedTotal;

  const statusRows = [
    { name: 'Completado (Aprobado)', count: data.completedCount, amount: data.completedTotal, color: 'FF15803D', bg: 'FFDCFCE7' },
    { name: 'Pendiente (Por Revisar)', count: data.pendingCount, amount: data.pendingTotal, color: 'FFB45309', bg: 'FFFEF3C7' },
    { name: 'Rechazado', count: data.rejectedCount, amount: data.rejectedTotal, color: 'FFB91C1C', bg: 'FFFEE2E2' },
  ];

  let sumRowIdx = 6;
  statusRows.forEach(st => {
    const r = wsSummary.getRow(sumRowIdx);
    r.height = 22;

    const c1 = r.getCell(1);
    c1.value = st.name;
    c1.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: st.color } };
    c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: st.bg } };
    c1.border = thinBorder;

    const c2 = r.getCell(2);
    c2.value = st.count;
    c2.numFmt = '#,##0';
    c2.alignment = { vertical: 'middle', horizontal: 'center' };
    c2.border = thinBorder;

    const c3 = r.getCell(3);
    c3.value = st.amount;
    c3.numFmt = '"$"#,##0.00';
    c3.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: st.color } };
    c3.alignment = { vertical: 'middle', horizontal: 'right' };
    c3.border = thinBorder;

    const c4 = r.getCell(4);
    c4.value = grandTotalAmount > 0 ? st.amount / grandTotalAmount : 0;
    c4.numFmt = '0.0%';
    c4.alignment = { vertical: 'middle', horizontal: 'right' };
    c4.border = thinBorder;

    sumRowIdx++;
  });

  // Total balance general
  const sTotRow = wsSummary.getRow(sumRowIdx);
  sTotRow.height = 24;
  sTotRow.getCell(1).value = 'TOTAL REPORTADO';
  sTotRow.getCell(1).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };

  const sTotCount = sTotRow.getCell(2);
  sTotCount.value = data.totalCount;
  sTotCount.numFmt = '#,##0';
  sTotCount.font = { name: 'Segoe UI', size: 10, bold: true };
  sTotCount.alignment = { vertical: 'middle', horizontal: 'center' };

  const sTotAmount = sTotRow.getCell(3);
  sTotAmount.value = grandTotalAmount;
  sTotAmount.numFmt = '"$"#,##0.00';
  sTotAmount.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF0F172A' } };
  sTotAmount.alignment = { vertical: 'middle', horizontal: 'right' };

  const sTotPct = sTotRow.getCell(4);
  sTotPct.value = 1.0;
  sTotPct.numFmt = '0.0%';
  sTotPct.font = { name: 'Segoe UI', size: 10, bold: true };
  sTotPct.alignment = { vertical: 'middle', horizontal: 'right' };

  for (let c = 1; c <= 4; c++) {
    const cell = sTotRow.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    cell.border = doubleBottomBorder;
  }
  sumRowIdx++;

  wsSummary.getRow(sumRowIdx).height = 14;
  sumRowIdx++;

  // --- SECCIÓN 2: DESGLOSE POR MÉTODO DE PAGO ---
  const s2Row = wsSummary.getRow(sumRowIdx);
  s2Row.getCell(1).value = '2. INGRESOS POR MÉTODO DE PAGO';
  s2Row.getCell(1).font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF800020' } };
  s2Row.height = 22;
  sumRowIdx++;

  const mHeaders = ['#', 'Método de Pago', 'Transacciones', 'Monto Total ($)', '% Participación'];
  const mHeaderRow = wsSummary.getRow(sumRowIdx);
  mHeaderRow.height = 24;
  mHeaders.forEach((h, i) => {
    const c = mHeaderRow.getCell(i + 1);
    c.value = h;
    c.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF800020' } };
    c.alignment = { vertical: 'middle', horizontal: i === 1 ? 'left' : (i >= 3 ? 'right' : 'center') };
    c.border = thinBorder;
  });
  sumRowIdx++;

  if (data.methods.length === 0) {
    wsSummary.mergeCells(`A${sumRowIdx}:E${sumRowIdx}`);
    const emptyM = wsSummary.getCell(`A${sumRowIdx}`);
    emptyM.value = 'No hay transacciones registradas por método de pago.';
    emptyM.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF94A3B8' } };
    emptyM.alignment = { vertical: 'middle', horizontal: 'center' };
    wsSummary.getRow(sumRowIdx).height = 22;
    sumRowIdx++;
  } else {
    data.methods.forEach((m, i) => {
      const r = wsSummary.getRow(sumRowIdx);
      r.height = 21;

      const c1 = r.getCell(1);
      c1.value = i + 1;
      c1.alignment = { vertical: 'middle', horizontal: 'center' };
      c1.border = thinBorder;

      const c2 = r.getCell(2);
      c2.value = m.name;
      c2.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1E293B' } };
      c2.alignment = { vertical: 'middle', horizontal: 'left' };
      c2.border = thinBorder;

      const c3 = r.getCell(3);
      c3.value = m.count;
      c3.numFmt = '#,##0';
      c3.alignment = { vertical: 'middle', horizontal: 'center' };
      c3.border = thinBorder;

      const c4 = r.getCell(4);
      c4.value = m.total;
      c4.numFmt = '"$"#,##0.00';
      c4.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF15803D' } };
      c4.alignment = { vertical: 'middle', horizontal: 'right' };
      c4.border = thinBorder;

      const c5 = r.getCell(5);
      c5.value = m.percentage / 100;
      c5.numFmt = '0.0%';
      c5.alignment = { vertical: 'middle', horizontal: 'right' };
      c5.border = thinBorder;

      if (i % 2 === 1) {
        for (let col = 1; col <= 5; col++) {
          r.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
      }
      sumRowIdx++;
    });
  }

  wsSummary.getRow(sumRowIdx).height = 14;
  sumRowIdx++;

  // --- SECCIÓN 3: INGRESOS POR CONCEPTO ---
  if (data.concepts && data.concepts.length > 0) {
    const s3Row = wsSummary.getRow(sumRowIdx);
    s3Row.getCell(1).value = '3. INGRESOS POR CONCEPTO / MOTIVO';
    s3Row.getCell(1).font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF800020' } };
    s3Row.height = 22;
    sumRowIdx++;

    const cHeaders = ['#', 'Concepto / Motivo', 'Transacciones', 'Monto Total ($)', '% Participación'];
    const cHeaderRow = wsSummary.getRow(sumRowIdx);
    cHeaderRow.height = 24;
    cHeaders.forEach((h, i) => {
      const c = cHeaderRow.getCell(i + 1);
      c.value = h;
      c.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF800020' } };
      c.alignment = { vertical: 'middle', horizontal: i === 1 ? 'left' : (i >= 3 ? 'right' : 'center') };
      c.border = thinBorder;
    });
    sumRowIdx++;

    data.concepts.forEach((cp, i) => {
      const r = wsSummary.getRow(sumRowIdx);
      r.height = 21;

      const c1 = r.getCell(1);
      c1.value = i + 1;
      c1.alignment = { vertical: 'middle', horizontal: 'center' };
      c1.border = thinBorder;

      const c2 = r.getCell(2);
      c2.value = cp.name;
      c2.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1E293B' } };
      c2.alignment = { vertical: 'middle', horizontal: 'left' };
      c2.border = thinBorder;

      const c3 = r.getCell(3);
      c3.value = cp.count;
      c3.numFmt = '#,##0';
      c3.alignment = { vertical: 'middle', horizontal: 'center' };
      c3.border = thinBorder;

      const c4 = r.getCell(4);
      c4.value = cp.total;
      c4.numFmt = '"$"#,##0.00';
      c4.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF15803D' } };
      c4.alignment = { vertical: 'middle', horizontal: 'right' };
      c4.border = thinBorder;

      const c5 = r.getCell(5);
      c5.value = cp.percentage / 100;
      c5.numFmt = '0.0%';
      c5.alignment = { vertical: 'middle', horizontal: 'right' };
      c5.border = thinBorder;

      if (i % 2 === 1) {
        for (let col = 1; col <= 5; col++) {
          r.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
      }
      sumRowIdx++;
    });
  }

  // Autoajuste columnas Pestaña 2
  wsSummary.columns.forEach((col, colIdx) => {
    let max = 14;
    col.eachCell?.({ includeEmpty: false }, (cell, rowNumber) => {
      if (rowNumber <= 2) return;
      const str = cell.value ? cell.value.toString() : '';
      if (str.length > max) max = str.length;
    });
    col.width = Math.min(Math.max(max + 4, colIdx === 1 ? 30 : 16), 45);
  });

  // ==========================================
  // DISPARAR DESCARGA EN EL NAVEGADOR
  // ==========================================
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const cleanRange = data.dateRangeStr.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `KsaSports_Finanzas_Pagos_${cleanRange}.xlsx`;

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}


