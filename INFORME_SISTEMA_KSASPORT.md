# 🏟️ INFORME DETALLADO DEL SISTEMA KSASPORT
### Plataforma Integral de Gestión Deportiva, Finanzas Bimonetarias, Créditos y Portal del Atleta

---

## 1. Resumen Ejecutivo y Ficha Técnica

**KsaSport** es un ecosistema de software web progresivo de alto rendimiento diseñado específicamente para academias deportivas, clubes y organizaciones atléticas (con foco principal en béisbol menor y juvenil). Resuelve de forma integral tres grandes pilares operativos:

1. **Gestión Deportiva y Operativa:** Administración de rosters, atletas, categorías por edades, asignación de equipos, estadísticas atléticas y pizarras interactivas de alineación (*Lineup*).
2. **Finanzas Bimonetarias y Conciliación Contable:** Cobranza de cuotas, matrículas y torneos con conversión en tiempo real a tasas oficiales del Banco Central de Venezuela (BCV USD/EUR) y Cripto (USDT), conciliación de comprobantes y Libro Mayor contable.
3. **Línea de Crédito y Consumo Deportivo ("Créditos" / Cantina):** Punto de venta (POS) táctil para consumos en la sede, límites de crédito por atleta, consulta de deuda desde el móvil y liquidación auditada.

### Stack Tecnológico e Infraestructura
* **Frontend & Backend Framework:** Next.js 16 (App Router con compilador Turbopack) y React 19.
* **Estilizado & Diseño:** Tailwind CSS v4, Lucide Icons, Tipografía deportiva *Bebas Neue* (Google Fonts) y *Geist / Source Sans*.
* **Base de Datos & Autenticación:** PostgreSQL en la nube mediante Supabase con Row Level Security (RLS) y Server Actions seguras con Service Role.
* **Almacenamiento Multimedia:** Arquitectura híbrida en la nube con **Cloudflare R2** (S3 compatible) y sistema de conmutación por error (*automatic fallback*) hacia **Supabase Storage** para comprobantes de pago y fotos de atletas.
* **Procesamiento de Documentos:** Generación nativa de libros de cálculo Excel corporativos (`.xlsx`) mediante **ExcelJS** y renderizado de carnets con **QR Code**.

---

## 2. Mapa Arquitectónico de Módulos

```
                                  ┌────────────────────────────────────────┐
                                  │           SISTEMA KSASPORT             │
                                  └───────────────────┬────────────────────┘
                                                      │
         ┌────────────────────────────┬───────────────┴───────────────┬────────────────────────────┐
         ▼                            ▼                               ▼                            ▼
┌──────────────────┐        ┌──────────────────┐            ┌──────────────────┐         ┌──────────────────┐
│ GESTIÓN          │        │ FINANZAS Y       │            │ CRÉDITOS Y       │         │ PORTAL DEL       │
│ DEPORTIVA        │        │ CONCILIACIÓN     │            │ CONSUMO          │         │ ATLETA           │
├──────────────────┤        ├──────────────────┤            ├──────────────────┤         ├──────────────────┤
│• Roster Atletas  │        │• Pagos y Recibos │            │• Punto de Venta  │         │• Carnet con QR   │
│• Equipos y Cat.  │        │• Libro Mayor     │            │• Catálogo Precios│         │• Reportar Pagos  │
│• Pizarra Lineup  │        │• Tasas BCV en Vio│            │• Cuentas Cobrar  │         │• Estado Crédito  │
│• Carnetización   │        │• Exoneraciones   │            │• Auditoría Abonos│         │• Estadísticas    │
│• Verificación QR │        │• Exportación XLS │            │• Balance Deudor  │         │• Solvencia Móvil │
└──────────────────┘        └──────────────────┘            └──────────────────┘         └──────────────────┘
```

---

## 3. Detalle Funcional por Módulos

### 3.1. MÓDULO DE GESTIÓN DEPORTIVA Y ATLETAS

Ubicación: `/admin/athletes`, `/admin/teams`, `/admin/categories`, `/admin/lineup`

1. **Ficha Integral del Atleta:**
   * **Datos Personales y de Identificación:** Nombre completo, cédula formateada (`V-` / `E-`), fecha de nacimiento, cálculo automático de edad y categoría reglamentaria, teléfono de contacto y representante legal.
   * **Datos Deportivos:** Posición primaria y secundaria en el campo, número de dorsal, equipo asignado y si posee convenio/alianza deportiva (`has_alliance`).
   * **Estadísticas Oficiales de Rendimiento:** Registro y visualización de Average de Bateo (`AVG`), Hits, Carreras Impulsadas (`CI/RBI`), Carreras Anotadas (`CA/Runs`), Turnos al Bate y Orden al Bate asignado.
   * **Perfil Antropométrico y Uniformes:** Talla de camisa, pantalón y calzado.

2. **Equipos y Categorías:**
   * Organización por disciplinas y rangos de edad (Iniciación, Infantil, Pre-Junior, Junior, Juvenil).
   * Carga de escudos/logos oficiales por equipo y asignación de managers o entrenadores responsables.

3. **Pizarra Táctica y Alineación Interactiva (`/admin/lineup`):**
   * Herramienta visual interactiva que simula el terreno de juego de béisbol (Infield, Outfield, Batería: Pitcher y Catcher).
   * Los entrenadores pueden arrastrar o asignar jugadores a sus posiciones defensivas y ordenar el *Batting Order* oficial antes de cada partido.
   * Filtro automático: los entrenadores solo ven el roster de su equipo asignado; el súper administrador puede visualizar la academia completa.

4. **Carnet Digital y Validación QR Pública (`/portal/verify/[id]`):**
   * Cada atleta cuenta con una URL pública única y un código QR descargable e imprimible.
   * Al escanear el QR desde cualquier teléfono inteligente (sin necesidad de iniciar sesión), el sistema despliega una pantalla de validación instantánea con semáforo de colores:
     * **Verde (Habilitada / Solvente):** El atleta está al día con sus cuotas y apto para jugar.
     * **Rojo (Restringida / En Mora):** Presenta cuotas vencidas.
     * **Gris (Inactiva):** Atleta retirado o suspendido.
   * Muestra fotografía, logo del equipo, categoría y estadísticas actualizadas para que delegados de mesa y árbitros corroboren la identidad del jugador en torneos.

---

### 3.2. MÓDULO DE FINANZAS, COBRANZAS Y CONCILIACIÓN BANCARIA

Ubicación: `/admin/payments`, `/admin/ledger`, `/admin/products`, `/admin/rates`

1. **Recepción Multimoneda y Multimétodo:**
   * El sistema está configurado para la realidad financiera venezolana, aceptando:
     * **Pago Móvil (Bolívares)**
     * **Transferencia Bancaria Nacional (Bolívares)**
     * **Efectivo en Dólares (USD)**
     * **Efectivo en Euros (EUR)**
     * **Zelle (USD)**
     * **Binance / USDT Cripto**
   * Al seleccionar métodos en bolívares, el sistema calcula de forma instantánea el contravalor exacto según la **tasa oficial del BCV del día**.

2. **Bandeja de Conciliación y Auditoría de Pagos (`/admin/payments`):**
   * Vista de auditoría dividida en tres pestañas operativas:
     * **Por Revisar (Pendientes):** Pagos reportados por los representantes desde el portal móvil pendientes de validación.
     * **Validados (Completados):** Pagos verificados en la cuenta bancaria del club.
     * **Rechazados:** Pagos no encontrados o comprobantes erróneos.
   * **Inspección de Comprobantes:** Modal con zoom integrado para examinar la captura de pantalla de la transferencia bancaria o recibo.
   * **Aprobación en 1 Clic:** Al validar un pago, el sistema:
     1. Pasa el registro a `Completado`.
     2. Actualiza la fecha de vencimiento (`paid_until`) del atleta sumando el período correspondiente.
     3. Cambia automáticamente el estatus del atleta a **Solvente**.
     4. Alimenta en tiempo real el Libro Mayor de ingresos.
   * **Rechazo con Justificación:** Si el comprobante es ilegible o inválido, el administrador ingresa un motivo obligatorio (ej. *"Referencia no coincide con extracto bancario"*), el cual se le notifica al representante en su portal para que vuelva a reportarlo.

3. **Libro Mayor Financiero (`/admin/ledger`):**
   * Centro neurálgico de inteligencia financiera para directivos y tesoreros.
   * **Tarjetas Métricas Principales:**
     * Total de Ingresos Recibidos en el período seleccionado.
     * Cantidad total de transacciones completadas.
     * Ticket Promedio por cobro.
     * Ticket Máximo y Ticket Mínimo.
   * **Desglose Analítico por Método de Pago:** Gráfico y tabla comparativa del volumen de dinero ingresado por Pago Móvil vs. Zelle vs. Efectivo vs. USDT.
   * **Desglose por Concepto / Producto:** Recaudación separada por Mensualidades, Inscripciones, Torneos Especiales, Uniformes, etc.
   * **Filtros Temporales Inteligentes:** Permite alternar con un clic entre *Hoy, Esta Semana, Este Mes, Últimos 30 días, Rango Personalizado*.

4. **Productos, Cuotas y Reglas Especiales (`/admin/products`):**
   * Configuración de conceptos de cobro con precio base en USD.
   * **Soporte de Abonos/Cuotas Fraccionadas (`allows_installments`):** Permite que un producto de monto alto (ej. Torneo $120) sea pagado en partes, llevando el saldo restante acumulado.
   * **Inscripción Exclusiva / Opt-In (`requires_opt_in`):** Para productos opcionales (ej. Copa de Verano), la deuda no se le cobra a todos los atletas del club, sino únicamente a aquellos que se registraron voluntariamente.
   * **Exoneraciones y Becas (`athlete_exemptions`):** Permite becar o exonerar a atletas específicos de un producto particular sin alterar el resto de sus cobros.

---

### 3.3. MÓDULO DE CRÉDITOS Y CONSUMO DEPORTIVO (EX-CANTINA)

Ubicación: `/admin/cantina`

Diseñado como un subsistema financiero 100% independiente para el cafetín, hidratación, snacks y material deportivo de la academia:

1. **Punto de Venta (POS) Táctil y Comandas:**
   * Diseñado para operar con agilidad desde una tablet o smartphone en el mostrador.
   * El encargado selecciona al atleta, pulsa los productos consumidos (empanadas, hidratación, malteadas, etc.) y genera la comanda en segundos.
   * El total se carga automáticamente a la **cuenta de crédito del atleta**.

2. **Catálogo de Productos Multimoneda:**
   * Catálogo liviano (sin fotos pesadas para ahorrar datos móviles).
   * Selección de moneda base por producto: **EUR (Euro BCV oficial por defecto)**, **USD (Dólar BCV)** o **USDT**.
   * Panel interactivo que calcula en vivo el contravalor en Bolívares (`Bs.`) al tipo de cambio oficial del día.
   * Botón de activación/pausa rápida de disponibilidad.
   * Tolerancia a fallos: Si la base de datos experimenta cambios de esquema, el sistema opera con respaldo dinámico sin interrumpir las ventas.

3. **Cuentas por Cobrar y Límites de Crédito:**
   * Cada atleta tiene una cuenta de crédito independiente.
   * El administrador puede fijar un límite de crédito personalizado (ej. 30 €, 50 € o 100 €).
   * Monitoreo visual de la deuda acumulada de cada deportista en tiempo real.

4. **Cobranzas, Abonos y Verificación de Pagos:**
   * **Abono Directo en Efectivo:** Si el representante o el atleta paga en efectivo en el mostrador, el administrador registra el abono con un clic, disminuyendo el saldo deudor de inmediato.
   * **Pago Digital Reportado por el Atleta:** El representante puede ver el detalle de consumos desde su portal móvil y reportar una transferencia o pago móvil con captura de pantalla.
   * **Auditoría:** Pestaña dedicada para que la administración revise el comprobante y confirme la liberación del saldo.

5. **Reportes Financieros de Créditos:**
   * Métricas de Ventas Totales, Total Recaudado, Cuentas por Cobrar vigentes y Ticket Promedio.
   * Exportación directa a Excel con libros separados: *Ventas Créditos* y *Pagos Créditos*.

---

### 3.4. MÓDULO DEL PORTAL DEL ATLETA Y REPRESENTANTES

Ubicación: `/portal`, `/portal/dashboard`, `/portal/dashboard/pagos`, `/portal/dashboard/cantina`

Interfaz optimizada para smartphones diseñada para padres, representantes y atletas:

1. **Acceso Ágil y Seguro:**
   * Acceso rápido mediante cédula de identidad y código o fecha de nacimiento, eliminando la fricción de recordar correos y contraseñas complejas.

2. **Credencial Deportiva Digital:**
   * Tarjeta con diseño premium (vinotinto, textura carbono y acento dorado) que muestra el estatus del atleta:
     * **SOLVENTE:** Indicador verde con la fecha exacta de vigencia.
     * **MOROSO / PENDIENTE:** Alerta roja con enlace directo a regularizar pagos.
   * Botón para abrir el código QR de verificación para partidos y viajes.

3. **Reporte de Pagos Autónomo (`/portal/dashboard/pagos`):**
   * El representante visualiza las cuotas pendientes del mes o los torneos activos.
   * Selecciona el método de pago y la cuenta receptora del club (con datos de Pago Móvil y Zelle copiables al portapapeles).
   * Visualiza la tasa oficial BCV del día y el monto exacto a transferir en Bolívares.
   * Sube la foto del comprobante desde la cámara del celular.
   * Recibe confirmación inmediata de *"Pago en proceso de validación"*.

4. **Estado de Cuenta de Créditos (`/portal/dashboard/cantina`):**
   * Transparencia total sobre consumos realizados en la sede: fecha, ítem consumido, cantidad y precio.
   * Visualización del saldo deudor total expresado en Euros (`€`) y su contravalor en Bolívares.
   * Botón *"Pagar Deuda de Créditos"* para liquidar la cuenta mediante comprobante bancario.

5. **Ficha y Estadísticas Personales:**
   * Resumen de números de temporada (Average, Hits, Carreras, etc.) y equipo al que pertenece.

---

### 3.5. MOTOR DE TASAS DE CAMBIO Y SINCRONIZACIÓN AUTOMATIZADA

Ubicación: `src/lib/exchangeRate.ts`, `scripts/scrape-alcambio.js`, `/api/cron/sync-rates`

1. **Sincronización Automática con el BCV:**
   * Módulo autónomo de extracción de datos (*scraper*) conectado a los marcadores oficiales y a la API de AlCambio.
   * Captura diariamente:
     * **Dólar Oficial BCV (USD)**
     * **Euro Oficial BCV (EUR)**
     * **Tether Cripto (USDT)**
   * Sistema de persistencia triple: Base de datos Supabase (`exchange_rates`), archivo JSON (`rates_history.json`) y CSV histórico (`rates_history.csv`).

2. **Cron Jobs Programados:**
   * `/api/cron/sync-rates`: Ejecutado automáticamente por las mañanas para asegurar que las cobranzas del día operen con la tasa legal vigente.
   * `/api/cron/daily-status`: Auditoría nocturna que evalúa la fecha `paid_until` de cada atleta; si la fecha expiró, conmuta el estatus automáticamente de `Solvente` a `Moroso`.

---

### 3.6. SEGURIDAD, CONTROL DE ACCESO Y ROLES (RBAC)

Ubicación: `src/lib/auth-admin.ts`, `/admin/users`

La plataforma implementa un control de acceso estricto basado en roles y permisos granulares en el servidor:

| Rol | Nombre | Permisos Clave |
| :--- | :--- | :--- |
| `superadmin` | **Súper Administrador** | Acceso total a todas las áreas, gestión de roles, ajustes globales, eliminación de registros. |
| `treasurer` | **Tesorero / Finanzas** | Acceso a Cobranzas, Conciliación de Pagos, Libro Mayor, Tasas de Cambio y Créditos. |
| `coordinator`| **Coordinador Deportivo**| Gestión de Atletas, Equipos, Categorías, Lineup y Catálogo de Productos. |
| `coach` | **Entrenador / Mánager** | Visualización exclusiva del roster de su equipo asignado y uso de la Pizarra de Alineación (Lineup). |

---

### 3.7. GENERADOR DE REPORTES CORPORATIVOS EN EXCEL

Ubicación: `src/lib/exportExcel.ts`

El sistema integra un motor de exportación profesional con estilo gráfico corporativo (cabeceras vinotinto, fuentes de datos estructuradas, formatos monetarios y anchos de columna automáticos):

1. **Reporte de Atletas:** Listado completo con cédulas, teléfonos, estatus de solvencia, categorías y equipos.
2. **Reporte de Pagos:** Bitácora de transacciones con métodos, referencias bancarias, tasas de cambio utilizadas, contravalor en Bs. y montos en USD.
3. **Reporte de Libro Mayor:** Resumen contable ejecutivo con subtotales por canal de cobro y por producto.
4. **Reporte de Créditos:** Resumen de consumo de cantina con desglose de ventas y pagos.

---

## 4. Estándares de Diseño y Experiencia de Usuario (UI/UX)

La aplicación ha sido auditada y optimizada bajo las directrices del motor **`ui-ux-pro-max`** (obteniendo una calificación de **9.11 / 10**):

* **Enfoque Móvil First (Touch-Friendly):** Todos los botones y controles táctiles tienen un tamaño mínimo garantizado de **44x44px** para facilitar la pulsación en teléfonos en pleno campo de entrenamiento.
* **Vistas Híbridas Responsivas:** Las pantallas financieras y de atletas se muestran como **tablas densas de alta productividad** en computadoras de escritorio, y se transforman automáticamente en **tarjetas táctiles verticales** en teléfonos móviles.
* **Modales Bottom Sheet:** En dispositivos móviles, los formularios y ventanas emergentes se despliegan desde la parte inferior de la pantalla con tirador ergonómico de arrastre.
* **Identidad Atlética Consolidada:** Tipografía de impacto deportivo **`Bebas Neue`** en títulos y tarjetas de métricas (*Big Number / Small Label*), contrastes WCAG AA/AAA certificados y paleta representativa Vinotinto y Dorado noble.
* **Accesibilidad Universal (a11y):** Configuración nativa `<html lang="es">`, atributos `aria-label` en iconos y componentes `EmptyState` informativos cuando no existen datos o búsquedas.

---

## 5. Ciclo de Vida del Dato: Flujo de Cobranza de Extremo a Extremo

```
[Representante realiza Pago Móvil o Zelle]
                 │
                 ▼
[Ingresa a /portal/dashboard/pagos desde su Smartphone]
                 │  • Selecciona producto y método
                 │  • Sistema calcula tasa BCV del día
                 │  • Adjunta foto del comprobante
                 ▼
[Servidor guarda comprobante en Cloudflare R2 / Supabase]
                 │
                 ▼
[Notificación en Bandeja de Administración /admin/payments]
                 │
                 ▼
[Tesorero o Administrador examina el comprobante con zoom]
                 │
        ┌────────┴────────┐
        ▼                 ▼
   [¿ES VÁLIDO?]      [¿INVÁLIDO?]
        │                 │
        │ APROBAR         │ RECHAZAR
        ▼                 ▼
 • Pasa a 'Completado'  • Pasa a 'Rechazado' con nota
 • Suma período a ficha • Representante ve motivo en portal
 • Atleta queda SOLVENTE
 • Alimenta Libro Mayor
 • QR pasa a 'Habilitado' (Verde)
```

---

## 6. Conclusión y Valor Estratégico

El software de **KsaSport** transforma una operación tradicional propensa a errores manuales, pérdidas por devaluación cambiaria y retrasos en cuadres de caja, en una **organización deportiva moderna, digitalizada y transparente**. 

Garantiza certeza contable para la directiva, autonomía y agilidad para entrenadores y una experiencia de usuario de primer nivel para los atletas y sus familias.
