# Análisis Administrativo y Requerimientos de Integración Bancaria
**Proyecto:** Kasa Sports
**Objetivo:** Transición del control manual (Excel) a una plataforma de conciliación 100% automática.

---

## 1. Análisis del Control Financiero Actual
Tras la revisión del documento de control (Google Sheet) actual de Kasa Sports, se han identificado los flujos manuales críticos que el nuevo Ecosistema Web automatizará por completo:

1. **Gestión de Atletas por Equipo:**
   * **Actualidad:** El registro de jugadoras activas, inactivas y nuevos ingresos se lleva manualmente agrupado por equipos (Sirenitas, Auroras, Valientes, etc.).
   * **Solución Automatizada:** El sistema estructurará la base de datos de manera relacional. La plataforma conocerá exactamente el tamaño del roster activo de cada equipo y proyectará automáticamente los ingresos esperados del mes sin cruzar datos a mano.

2. **Gestión Multimoneda (USD y BS):**
   * **Actualidad:** Se debe anotar el monto correspondiente de la cuota en dólares (ej. $20 o $30) y verificar la cantidad exacta transferida en Bolívares.
   * **Solución Automatizada:** La base de datos registrará la transacción con la tasa de cambio del momento. El panel del administrador mostrará los totales unificados en la moneda preferida sin necesidad de calculadoras.

3. **Detección de Morosidad y Deudas ("Faltan $"):**
   * **Actualidad:** Se realiza un conteo manual (filas de "FALTAN" y "FALTAN $") para saber qué jugadora debe y cuánto dinero falta por recolectar en el mes.
   * **Solución Automatizada:** El **Dashboard Financiero** calculará esto en tiempo real. Emitirá alertas sobre los montos pendientes y cruzará esta información con el Roster Deportivo, marcando con un "semáforo rojo" a la atleta morosa e impidiendo su habilitación en los juegos.

4. **Eventos Extra y Egresos:**
   * **Actualidad:** En el Excel se lleva registro de abonos menores para eventos paralelos (Clases, Amistosos, Caimaneras) y se descuentan gastos operativos (Umpire, Campo, Hidratación).
   * **Solución Automatizada:** El sistema permitirá al atleta seleccionar en el portal si su pago corresponde a la "Mensualidad" o a un "Tryout/Amistoso". A futuro, se podrá incluir un módulo de egresos para calcular la ganancia neta automática.

---

## 2. Propuesta de Automatización Total (API Directa)

Para lograr un sistema donde el **administrador no tenga que revisar ni aprobar los pagos manualmente**, proponemos una integración directa a nivel de código con los bancos (Bancamiga) y plataformas (Cashea).

* **Flujo con Cashea:** El atleta selecciona "Cashea" en el portal de Kasa Sports, se genera un código o redirección de pago, el atleta aprueba en su app, y Cashea envía una notificación silenciosa (Webhook) a nuestros servidores. El pago se aprueba al instante.
* **Flujo con Bancamiga (C2P):** El atleta ingresa su teléfono y cédula en la plataforma de Kasa Sports, recibe una clave dinámica (SMS) de Bancamiga, y al introducirla, el banco debita el dinero y lo deposita en la cuenta jurídica de la agencia.

Al lograr esto, **se elimina el factor humano**, el margen de error es cero, y la atleta queda habilitada en el Roster de su Manager en cuestión de segundos, de forma completamente desatendida.

---

## 3. Requerimientos Técnicos (A solicitar por el Cliente)

Para que el equipo de desarrollo pueda programar estas integraciones automáticas, el cliente (Kasa Sports) debe gestionar y proveernos la siguiente documentación e información técnica con sus ejecutivos de cuenta:

### A. Requerimientos de Bancamiga:
1. **Contrato de Botón de Pago / C2P:** Asegurar que la cuenta jurídica de Kasa Sports tenga habilitado el servicio de cobro a clientes (API C2P / Botón de Pago Web).
2. **Credenciales de API (API Keys):** El banco debe entregar las llaves de desarrollo y producción (generalmente un `Client ID`, un `Secret Key` o un `Token`).
3. **Manual de Integración:** Documentación técnica (PDF o Swagger) que especifica cómo nuestros servidores deben comunicarse con Bancamiga.

### B. Requerimientos de Cashea:
1. **Acceso al Portal de Desarrolladores:** La cuenta comercial de Kasa Sports en Cashea debe generar credenciales de API (`Public Key` y `Private Key`) para uso en plataformas e-commerce/web.
2. **Configuración de Webhooks:** Necesitamos permiso o instrucciones para configurar la URL a la cual Cashea nos avisará cuando un cliente pague con éxito.

*Nota para el cliente: Mientras el banco y Cashea gestionan estas credenciales (lo cual puede demorar varios días), el equipo de desarrollo puede comenzar a construir la plataforma en modo simulación (Sandbox), de manera que una vez entregadas las llaves, solo haya que conectarlas al sistema ya construido.*
