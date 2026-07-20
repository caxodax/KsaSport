# Documento de Especificaciones Técnicas y UX/UI
**Proyecto:** Kasa Sports • Ecosistema Web de Gestión Deportiva, Eventos y Cobranza
**Fecha:** Julio 2026

---

## 1. Visión General del Proyecto
Desarrollo de una plataforma web progresiva (PWA / SPA) de alto rendimiento diseñada para automatizar la gestión operativa y financiera de Kasa Sports. La aplicación actúa como un **Hub Deportivo** que unifica la captación de talento (Tryouts) y la gestión de ligas (Kickingball/Fútbol), eliminando el cuello de botella de cobranzas por WhatsApp mediante un portal de autogestión directa para los atletas.

### Métricas Clave de Rendimiento y UX (KPIs)
* **Reducción de Carga Operativa:** Disminución del 80% en el tiempo invertido en validación manual de pagos y conciliación bancaria.
* **Tiempo de Interactividad (TTI):** Carga instantánea (menor a 1.2s en redes 3G/4G) garantizando acceso fluido en el campo de juego.
* **Autonomía Financiera:** Centralización del 100% de la cobranza directo a la agencia, eliminando la intermediación de delegados.

---

## 2. Stack Tecnológico e Infraestructura (Costo Operativo $0)

| Tecnología | Rol Arquitectural | Impacto directo en la UX / Operación |
| :--- | :--- | :--- |
| **SvelteKit** | Framework principal (Frontend/Backend Edge). | Aplicación ultraligera, ideal para consultas rápidas desde dispositivos móviles en los estadios o canchas. |
| **Supabase (PostgreSQL)** | Base de datos relacional directa y Autenticación. | Estructura robusta para relacionar Torneos -> Equipos -> Atletas -> Pagos sin latencia en consultas complejas. |
| **Bulma CSS** | Framework de diseño de interfaz (UI). | Componentes limpios, modulares y responsivos que aseguran consistencia visual sin sobrecargar el peso del sitio. |
| **Cloudflare R2** | Almacenamiento de objetos masivos. | Alojamiento de fotos de perfil de atletas, logos de equipos y capturas de transferencias con carga en milisegundos. |
| **Vercel** | Infraestructura Serverless. | Evita que el servidor "se duerma", garantizando tiempos de respuesta inmediatos 24/7 sin costos fijos. |
| **Resend / WhatsApp** | Motor de notificaciones. | Automatización de envío de recibos y recordatorios de pago. |
| **Service Workers (PWA)** | Caché y Funcionamiento Offline. | Garantiza que si un Manager se queda sin señal en el estadio, pueda visualizar el último Roster cargado sin interrupciones. |

---

## 3. Arquitectura de Módulos y Flujos de Usuario

### 3.1. Vista Pública (Aficionados y Nuevos Talentos)
* **Landing Page Institucional:** Enfoque dual orientado a las dos ramas de negocio: un llamado a la acción (CTA) para "Próximos Tryouts" (Scouting) y otro para "Ligas Activas" (Eventos). 
* **Hub de Eventos y Calendario:** Cartelera dinámica de los eventos en Barquisimeto y otras locaciones.
* **Centro de Estadísticas:** Módulo para visualizar tablas de posiciones, resultados de las jornadas y líderes de ligas.

### 3.2. Portal de Autogestión (Atletas y Delegados)
* **Perfil del Atleta:** Cada jugador tiene un perfil individual donde gestiona sus pagos, sube comprobantes,visualiza su estatus, estadisticas y Datos de contacto y personales.
* **Credenciales Digitales:** Generación de un Carnet Digital con código QR por atleta para validación rápida en la mesa técnica antes de cada juego con toda su informacion Estadistica. *Nota UX:* Integración con la cámara nativa del teléfono para que la mesa técnica escanee y reciba validación visual inmediata (Pantalla Verde/Roja).
* **Visor del Delegado:** El delegado del equipo no maneja dinero. Solo posee un panel de lectura para visualizar el estatus de su plantilla y confirmar quiénes están habilitados.

### 3.3. Portal del Cuerpo Técnico (Managers y Coaches)
* **Perfil de Usuario Técnico:** Los Managers y Coaches contarán con un usuario propio. En este apartado podrán visualizar su información base e historial de trayectoria.
* **Panel de Gestión Deportiva:** Es desde este usuario donde el cuerpo técnico ejecutará todas las acciones operativas detalladas en la **Sección 8**, como armar la plantilla, convocar jugadoras y gestionar el roster con visibilidad del estatus financiero de las atletas.

### 3.4. Portal de Administración (Superusuario)
* **Gestión Total:** El usuario Administrador posee acceso y control integral sobre todos los demás usuarios y roles dentro de la plataforma (conectado al Centro de Comando de la **Sección 6**).
* **Operaciones Administrativas:** Es el encargado exclusivo de crear nuevos equipos, asignar a los Managers y Coaches a dichos equipos, incluir nuevos jugadores al ecosistema, o desactivarlos visualmente del sistema en caso de que se retiren de la liga.

---

## 4. Sistema de Diseño y Fundamentos de Interfaz (UI/UX)
La interfaz refleja el profesionalismo del "Manager Deportivo", adoptando una estética audaz, deportiva e institucional.

### 4.1. Definición Cromática Oficial
* **Vinotinto Kasa (`#5A0F1D`):** Color principal de la marca. Utilizado en el Navbar, fondos de cabeceras de tablas y botones primarios.
* **Dorado Estrella (`#D4AF37`):** Color de acento. Reservado para resaltar eventos especiales, estatus "Solvente" y CTAs secundarios.
* **Blanco Lienzo (`#FFFFFF`):** Fondo global de la aplicación.
* **Gris Pizarra (`#2D3748`):** Textos principales, bordes sutiles y tarjetas inactivas.

### 4.2. Tipografía y Estructura Visual (Bulma CSS)
* Implementación de tipografías impactantes para marcadores y títulos.
* Uso de clases nativas de **Bulma CSS** adaptadas a los colores de la marca para mantener uniformidad en formularios y tablas.
* **Micro-interacciones y UI Moderna:** Inyección de animaciones sutiles, bordes redondeados e iconografía (ej. Lucide) para asegurar que la experiencia, especialmente en el panel del Administrador, se sienta como una app nativa moderna y no como un panel de control estático.

---

## 5. El Flujo Lógico de Pagos y Conciliación Individual
Diseñado para centralizar los ingresos directamente en la agencia, automatizando el cobro por jugador.

**5.1. Notificación y Carga de Pago:**
* El sistema notifica al atleta 48 horas antes de sus fechas de corte.
* El atleta selecciona el concepto (Mensualidad, Torneo, Tryout), ingresa los datos de la transferencia y sube el capture.
* El estatus pasa a "En Revisión". Kasa Sports aprueba el pago desde su panel y el atleta pasa a "Solvente". *(Fase MVP)*
* **Escalabilidad a Conciliación 100% Automática:** A futuro, la arquitectura permite integrar APIs de pagos locales o pasarelas mediante Webhooks, eliminando la validación manual y automatizando totalmente el cambio de estatus a "Solvente".

**5.2. Estatus de Morosidad, Multas por Mensualidad y Acuerdos de Pago:**
El ecosistema separa estrictamente los pagos de eventos de la mensualidad recurrente, aplicando lógicas de bloqueo cruzado.
* **Regla de los 5 Días (Mensualidad):** La multa por mora aplica *exclusivamente* a la mensualidad. Si un atleta no reporta el pago de su mes dentro de los primeros 5 días calendario, el sistema suma automáticamente un recargo a su estado de cuenta. Los pagos de torneos no generan multas por retraso.
* **Bloqueo Cruzado:** La solvencia es integral. Si un atleta pagó el torneo completo, pero debe su mensualidad operativa, el sistema desactiva automáticamente su Carnet Digital (QR) y lo inhabilita.
* **Acuerdos de Pago (Prórrogas):** Para permitir jugar a un atleta moroso, la administración activa un "Acuerdo de Pago". Esto reactiva el QR exclusivamente para ese juego, exigiendo el pago de la deuda + la multa acumulada en el próximo corte.

---

## 6. Panel de Administración UX-Móvil (Centro de Comando)
Gestión total desde `/admin`.

* **Dashboard Financiero:** Métricas de solvencia vs morosidad en tiempo real.
* **Aprobación de Pagos:** Bandeja de entrada rápida para verificar transferencias y aprobar pagos reportados por los atletas.
* **Gestor de Torneos:** Interfaz para crear ligas, cupos, costos y generar calendarios (Fixture).
* **Directorio de Talentos (Scouting):** Base de datos centralizada de atletas de tryouts.

---

## 7. Esquema de Datos Transaccionales (Supabase)
Estructura relacional optimizada (consultas directas a Supabase):
* **`tournaments`:** Ligas y tryouts (Nombre, categoría, fechas, costos).
* **`teams`:** Perfiles de equipos.
* **`athletes`:** Ficha técnica (Nombre, DOB, métricas, ID equipo).
* **`matches`:** Calendario de juegos.
* **`payments`:** Motor financiero (Monto, referencia, concepto, capture, estado, ID atleta).
* **`team_staff`:** Tabla relacional para el historial de entrenadores por equipo.
* **`audit_logs` & Custom Claims:** Sistema de bitácora para registrar acciones críticas (quién aprobó un pago, quién desactivó a un jugador) y uso de *Custom Claims* en el JWT para manejar roles avanzados (Admin) de forma más segura que un simple campo booleano.

---

## 8. Gestión del Cuerpo Técnico y Rosters
La arquitectura de roles separa las funciones administrativas de las deportivas, otorgando credenciales a Managers y Coaches.

**8.1. Arquitectura de Roles: Potestad Compartida y Visibilidad**
* **Gestión del Roster:** Tanto el **Manager** como el **Coach** tienen potestad en la plataforma para armar la plantilla, convocar jugadoras y asignar posiciones de campo.
* **Semáforo Financiero en el Armado de Roster:** Al armar la alineación, el Manager o Coach verá una etiqueta visual junto a cada atleta señalando si está "Moroso". Esto evita convocar a jugadoras que rebotarán administrativamente en el campo.

**8.2. Historial y Rotación de Entrenadores**
* El sistema contempla la rotación del cuerpo técnico. La base de datos no ata permanentemente a un entrenador a un equipo. 
* Al rotar un Manager, se cierra su ciclo histórico en su equipo actual y se le abre un nuevo ciclo en el equipo destino, otorgándole acceso inmediato al nuevo Roster sin pérdida de métricas pasadas.

---

## 9. Propiedad Intelectual y Licenciamiento
*El presupuesto detallado en esta propuesta comercial cubre exclusivamente los costos correspondientes a los servicios de arquitectura, diseño, desarrollo web e implementación del sistema operativo. Se aclara que esto es solo el desarrollo; el código fuente sigue siendo de mi propiedad. Si en el futuro la agencia requiere la propiedad y transferencia total del código fuente para fines de reventa o internalización absoluta, dicho código tiene un precio de licenciamiento aparte.*