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
