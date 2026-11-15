export interface VinchiDocumentationFile {
  id: string;
  driveFileName: string;
  shortTitle: string;
  category: string;
  summary: string;
  version: string;
  updatedAt: string;
  htmlBody: string;
}

function wrapGoogleDocHtml(title: string, subtitle: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; color: #1f1630; line-height: 1.55; max-width: 860px; margin: 0 auto; padding: 24px;">
  <div style="background-color: #442c61; color: #ffffff; padding: 24px 28px; border-radius: 14px; margin-bottom: 24px;">
    <p style="margin: 0 0 6px 0; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #e9d5ff;">PROYECTO VINCHI · DOCUMENTACIÓN TÉCNICA OFICIAL</p>
    <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: bold; color: #ffffff;">${title}</h1>
    <p style="margin: 0; font-size: 14px; color: #f3e8ff;">${subtitle}</p>
  </div>
  ${bodyHtml}
  <hr style="border: none; border-top: 1px solid #d8c2ef; margin: 32px 0 12px 0;" />
  <p style="font-size: 11px; color: #543b6c;">Documento generado desde el proyecto Vinchi · Versión 1.0 · Noviembre 2026</p>
</body>
</html>`;
}

export const VINCHI_DOCUMENTATION_FILES: VinchiDocumentationFile[] = [
  {
    id: 'srs',
    driveFileName: 'SRS - Vinchi',
    shortTitle: 'Especificación de Requisitos (SRS)',
    category: 'Requisitos y Reglas de Negocio',
    summary:
      'Especificación funcional completa de Vinchi (IEEE 830): actores, requisitos funcionales RF-01 a RF-36, reglas económicas (0% comisión, tarifa fija, bono domiciliario, reparto agente) y RNF.',
    version: 'v1.0',
    updatedAt: '2026-11-15',
    htmlBody: wrapGoogleDocHtml(
      'SRS - Vinchi',
      'Documento de Especificación de Requisitos de Software y Especificación Funcional (Estándar IEEE 830)',
      `
      <h2 style="color: #442c61; border-bottom: 2px solid #9c44dc; padding-bottom: 6px;">1. Propósito y Alcance del Producto</h2>
      <p><strong>Vinchi</strong> es una solución digital omnicanal B2B2C diseñada para restaurantes, cafés y comercios gastronómicos en Colombia que elimina las comisiones por intermediación (<strong>0% comisión para siempre sobre ventas</strong>). Conecta en tiempo real a Compradores, Empresarios, Agentes Comerciales Certificados, Repartidores Verificados y Superadministradores.</p>

      <h3 style="color: #543b6c;">1.1 Propuesta de Valor y Reglas Económicas Inmutables</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 13px;">
        <thead>
          <tr style="background-color: #442c61; color: #ffffff;">
            <th style="padding: 10px; border: 1px solid #d8c2ef; text-align: left;">Concepto</th>
            <th style="padding: 10px; border: 1px solid #d8c2ef; text-align: left;">Regla de Negocio Obligatoria</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 9px; border: 1px solid #d8c2ef;"><strong>Comisión por pedido</strong></td>
            <td style="padding: 9px; border: 1px solid #d8c2ef;"><strong>$0 COP (0%)</strong> para el comercio en todos los planes (Básico Gratis, Premium y Ultra).</td>
          </tr>
          <tr style="background-color: #faf5ff;">
            <td style="padding: 9px; border: 1px solid #d8c2ef;"><strong>Tarifa de entrega</strong></td>
            <td style="padding: 9px; border: 1px solid #d8c2ef;">Tarifa fija definida por cada empresa para envíos a domicilio, o <strong>$1.000 COP fijos</strong> si el cliente selecciona <em>"Yo mismo lo recojo"</em>.</td>
          </tr>
          <tr>
            <td style="padding: 9px; border: 1px solid #d8c2ef;"><strong>Bono al Domiciliario</strong></td>
            <td style="padding: 9px; border: 1px solid #d8c2ef;">Obligatorio mínimo <strong>$300 COP</strong> (<em>Paso Solidario</em>) en cada pedido, ampliable voluntariamente a <strong>$500</strong> (<em>¡Buena Energía en Ruta!</em>), <strong>$750</strong> (<em>Héroe de tu Entrega</em>) o <strong>$1.000 COP</strong> (<em>Estrella del Repartidor</em>).</td>
          </tr>
          <tr style="background-color: #faf5ff;">
            <td style="padding: 9px; border: 1px solid #d8c2ef;"><strong>Activación por Agente</strong></td>
            <td style="padding: 9px; border: 1px solid #d8c2ef;">Búsqueda inicial de agente: <strong>$15.000 COP</strong>. Visita presencial opcional: <strong>$20.000 COP</strong>. Ganancia mostrada exclusivamente al agente: $10.000 COP (virtual) o $30.000 COP (presencial).</td>
          </tr>
          <tr>
            <td style="padding: 9px; border: 1px solid #d8c2ef;"><strong>Planes de Empresario</strong></td>
            <td style="padding: 9px; border: 1px solid #d8c2ef;">Básico Gratis ($0), Premium ($60.900/mes o $669.900/año) y Ultra ($185.900/mes o $1.673.100/año).</td>
          </tr>
          <tr style="background-color: #faf5ff;">
            <td style="padding: 9px; border: 1px solid #d8c2ef;"><strong>Anuncios Dorados</strong></td>
            <td style="padding: 9px; border: 1px solid #d8c2ef;">Requieren pago único de <strong>$25.000 COP</strong> en Básico Gratis y Premium; incluidos a <strong>$0 COP adicionales</strong> en el plan Ultra.</td>
          </tr>
        </tbody>
      </table>

      <h2 style="color: #442c61; border-bottom: 2px solid #9c44dc; padding-bottom: 6px;">2. Actores y Roles del Sistema (RBAC)</h2>
      <ul>
        <li><strong>Cliente (<code>cliente</code>):</strong> Usuario comprador bloqueado en el portal de catálogo/pedidos. Puede administrar hasta 6 ubicaciones, explorar el Foro, chatear con el asistente IA y hacer pedidos.</li>
        <li><strong>Empresario en espera (<code>empresario_en_espera</code>):</strong> Usuario que inicia el flujo <em>"Crear mi espacio"</em> y espera vinculación/token de un agente certificado. Puede salir al inicio manteniendo su sesión abierta.</li>
        <li><strong>Empresario (<code>comercio</code>):</strong> Dueño de restaurante o tienda activado mediante token. Elige su plan antes de iniciar y administra órdenes, domicilios, estadísticas, logotipo, anuncios, QR y equipo.</li>
        <li><strong>Agente Certificado (<code>agente</code>):</strong> Postulante aprobado tras completar formulario de 30 preguntas, cédula, hoja de vida y biometría facial. Vincula comercios virtual o presencialmente y retira saldo.</li>
        <li><strong>Repartidor Verificado (<code>repartidor</code>):</strong> Domiciliario verificado con documento y selfie. Gestiona su estado activo, mapa de entrega en 2 pasos, códigos de verificación, chat empresa/cliente y billetera.</li>
        <li><strong>Superadministrador (<code>superadmin</code>):</strong> Revisa postulaciones, aprueba/rechaza agentes y monitorea métricas gerenciales de comercios.</li>
      </ul>

      <h2 style="color: #442c61; border-bottom: 2px solid #9c44dc; padding-bottom: 6px;">3. Requisitos Funcionales Detallados</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 13px;">
        <thead>
          <tr style="background-color: #442c61; color: #ffffff;">
            <th style="padding: 9px; border: 1px solid #d8c2ef; width: 90px;">ID</th>
            <th style="padding: 9px; border: 1px solid #d8c2ef; width: 170px;">Módulo</th>
            <th style="padding: 9px; border: 1px solid #d8c2ef;">Especificación Obligatoria</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding: 8px; border: 1px solid #d8c2ef;"><strong>RF-01</strong></td><td style="padding: 8px; border: 1px solid #d8c2ef;">Autenticación</td><td style="padding: 8px; border: 1px solid #d8c2ef;">Registro completo con nombres/apellidos obligatorios, inicio de sesión con contraseña scrypt + salt, acceso por PIN de colaborador y biometría de domiciliario.</td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 8px; border: 1px solid #d8c2ef;"><strong>RF-02</strong></td><td style="padding: 8px; border: 1px solid #d8c2ef;">Navegación por Rol</td><td style="padding: 8px; border: 1px solid #d8c2ef;">En la barra superior única, al existir sesión activa se reemplazan los botones públicos por identidad del usuario, rol, acceso a su espacio y botón <em>Cerrar sesión</em>.</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #d8c2ef;"><strong>RF-03</strong></td><td style="padding: 8px; border: 1px solid #d8c2ef;">Portal Agentes</td><td style="padding: 8px; border: 1px solid #d8c2ef;">Pago de $15.000 COP, emparejamiento en tiempo real con agente disponible, chat y llamada WebSocket, alerta de $20.000 si es visita presencial y validación de token.</td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 8px; border: 1px solid #d8c2ef;"><strong>RF-04</strong></td><td style="padding: 8px; border: 1px solid #d8c2ef;">Planes Empresario</td><td style="padding: 8px; border: 1px solid #d8c2ef;">Antes de ingresar al panel privado, el Empresario elige entre Básico Gratis, Premium o Ultra (con pasarela de método de pago para planes pagos).</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #d8c2ef;"><strong>RF-05</strong></td><td style="padding: 8px; border: 1px solid #d8c2ef;">Gestión Comercial</td><td style="padding: 8px; border: 1px solid #d8c2ef;">Cobro/anulación de órdenes, estadísticas de ventas, edición de logotipo/descripción sincronizada en vivo al catálogo, creación de anuncios, códigos QR (Premium/Ultra) y permisos por colaborador.</td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 8px; border: 1px solid #d8c2ef;"><strong>RF-06</strong></td><td style="padding: 8px; border: 1px solid #d8c2ef;">Catálogo Cliente</td><td style="padding: 8px; border: 1px solid #d8c2ef;">Carruseles con botones laterales de desplazamiento, modal automático de complementos (Bebidas, Porciones si existen, Salsas, Otros), Foro de publicaciones y perfil por empresa.</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #d8c2ef;"><strong>RF-07</strong></td><td style="padding: 8px; border: 1px solid #d8c2ef;">Asistente IA</td><td style="padding: 8px; border: 1px solid #d8c2ef;">Integrado con Gemini (<code>gemini-4-hydrogen</code>) con 3 consultas gratis/mes, desbloqueo por anuncio o plan Cliente Premium mensual de $9.900 COP.</td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 8px; border: 1px solid #d8c2ef;"><strong>RF-08</strong></td><td style="padding: 8px; border: 1px solid #d8c2ef;">Exportación Drive</td><td style="padding: 8px; border: 1px solid #d8c2ef;">Autenticación OAuth con Google Drive para crear la carpeta <em>Vinchi</em> y subir la documentación oficial en formato Google Docs previa confirmación explícita del usuario.</td></tr>
        </tbody>
      </table>

      <h2 style="color: #442c61; border-bottom: 2px solid #9c44dc; padding-bottom: 6px;">4. Requisitos No Funcionales</h2>
      <ul>
        <li><strong>RNF-01 Seguridad:</strong> Contraseñas cifradas con <code>scryptSync</code> + <code>timingSafeEqual</code>. Tokens de Google Drive almacenados exclusivamente en memoria volátil (nunca en <code>localStorage</code>).</li>
        <li><strong>RNF-02 Tiempo Real:</strong> Canal WebSocket (<code>/ws</code>) con reconexión automática para chat empresa-agente y alertas instantáneas de aprobación.</li>
        <li><strong>RNF-03 Rendimiento y UX:</strong> Carga diferida por ruta (<code>lazyWithRetry</code>), esqueletos de carga y diseño responsivo con contraste WCAG AA sobre paleta Púrpura Real (#442c61 / #9c44dc).</li>
      </ul>
      `
    ),
  },
  {
    id: 'sdd',
    driveFileName: 'Vinchi - Documento de Diseño de Software (SDD)',
    shortTitle: 'Diseño de Software (SDD)',
    category: 'Arquitectura y Componentes',
    summary:
      'Arquitectura técnica full-stack (React 19 + Vite + Express + WebSockets + Gemini + Firebase Auth/Drive), estructura de carpetas, flujos de datos y patrones de resiliencia.',
    version: 'v1.0',
    updatedAt: '2026-11-15',
    htmlBody: wrapGoogleDocHtml(
      'Vinchi - Documento de Diseño de Software (SDD)',
      'Arquitectura Técnica, Patrones de Integración y Flujos de Datos del Proyecto Vinchi',
      `
      <h2 style="color: #442c61; border-bottom: 2px solid #9c44dc; padding-bottom: 6px;">1. Visión Arquitectónica General</h2>
      <p>Vinchi opera bajo una arquitectura monolítica modular <strong>Full-Stack TypeScript</strong> servida desde un único proceso Node.js en el puerto <strong>3000</strong>. En desarrollo utiliza Express unido al middleware HMR/SSR de Vite; en producción sirve los estáticos compilados desde <code>dist/</code> junto con las rutas <code>/api/*</code> y el servidor WebSocket <code>/ws</code>.</p>

      <div style="background-color: #faf5ff; border: 2px solid #bc8ae1; border-radius: 12px; padding: 16px; margin: 16px 0; font-family: monospace; font-size: 12px; white-space: pre-wrap;">
[Navegador React 19 + Tailwind v4 + Three.js]
   |-- REST JSON (Bearer vinchi_auth_token) -----> [Express server.ts :3000]
   |-- WebSocket (/ws?token=...) ---------------> [WSS Realtime Hub]
   |-- Gemini Client Proxy (/api/ai/cliente-chat)-> [GoogleGenAI SDK -> gemini-4-hydrogen]
   |-- OAuth Popup (Firebase Auth en memoria) ----> [Google Drive API v3 (/drive/v3/files)]
                                                          |
[Persistencia .vinchi-data.json] <----------------+
      </div>

      <h2 style="color: #442c61; border-bottom: 2px solid #9c44dc; padding-bottom: 6px;">2. Organización de Capas y Módulos</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 13px;">
        <thead>
          <tr style="background-color: #442c61; color: #ffffff;">
            <th style="padding: 9px; border: 1px solid #d8c2ef; text-align: left;">Capa / Archivo</th>
            <th style="padding: 9px; border: 1px solid #d8c2ef; text-align: left;">Responsabilidad Técnica</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding: 8px; border: 1px solid #d8c2ef;"><code>server.ts</code></td><td style="padding: 8px; border: 1px solid #d8c2ef;">API REST completa, autenticación scrypt, WebSocket broadcasting, generación de códigos QR PNG (<code>qrcode</code>), fusión de catálogo dinámico y proxy Gemini.</td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 8px; border: 1px solid #d8c2ef;"><code>src/App.tsx</code></td><td style="padding: 8px; border: 1px solid #d8c2ef;">Enrutador cliente por estado con guardas de acceso RBAC (<code>canAccessRoute</code>), carga diferida con <code>ViewErrorBoundary</code> y sincronización de sesión.</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #d8c2ef;"><code>src/lib/vinchiClient.ts</code></td><td style="padding: 8px; border: 1px solid #d8c2ef;">Cliente HTTP tipado que adjunta el token Bearer de sesión y gestiona reconexiones WebSocket.</td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 8px; border: 1px solid #d8c2ef;"><code>src/lib/googleDriveClient.ts</code></td><td style="padding: 8px; border: 1px solid #d8c2ef;">Integración OAuth cliente con Firebase Auth, almacenamiento de accessToken únicamente en RAM y carga multipart a Google Drive v3.</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #d8c2ef;"><code>src/app/(public)/page.tsx</code></td><td style="padding: 8px; border: 1px solid #d8c2ef;">Landing Page interactiva con escenas Three.js, enfoque por bloques, planes SaaS y barra única reactiva al estado autenticado.</td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 8px; border: 1px solid #d8c2ef;"><code>src/app/(public)/cliente/page.tsx</code></td><td style="padding: 8px; border: 1px solid #d8c2ef;">Portal de comprador: carruseles horizontales, modal de complementos por compra, Foro tipo feed, ubicaciones (máx. 6), checkout con bono obligatorio y chatbot IA.</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #d8c2ef;"><code>src/app/(dashboards)/comercio/page.tsx</code></td><td style="padding: 8px; border: 1px solid #d8c2ef;">Onboarding de 3 planes + pasarela de pago + 6 módulos de gestión privada del Empresario.</td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 8px; border: 1px solid #d8c2ef;"><code>src/app/(portal)/* &amp; agente/repartidor</code></td><td style="padding: 8px; border: 1px solid #d8c2ef;">Flujos de postulación de 30 preguntas + biometría, vinculación agente-comercio y ruta de entrega de repartidor con códigos de seguridad.</td></tr>
        </tbody>
      </table>

      <h2 style="color: #442c61; border-bottom: 2px solid #9c44dc; padding-bottom: 6px;">3. Decisiones Clave de Diseño y Flujos Críticos</h2>
      <ol>
        <li><strong>Barra de Navegación Única Reactiva:</strong> Evita duplicar cabeceras encima de los botones originales. Al iniciar sesión, la misma cabecera reemplaza los accesos públicos (<em>Trabajar en Vinchi</em>, <em>Crear mi espacio</em>, <em>Pedir Ahora</em>) por el rol activo y el botón <em>Cerrar sesión</em>.</li>
        <li><strong>Sincronización Comercio → Catálogo y Foro:</strong> Cualquier actualización del perfil comercial (nombre, logotipo Base64/ícono, descripción, tarifa de envío) o publicación de Anuncio Dorado modifica <code>businessesByUser</code> en servidor y se refleja automáticamente en <code>getAllRegisteredCompanies()</code>.</li>
        <li><strong>Seguridad en Mutaciones de Google Drive:</strong> Toda operación de creación o actualización sobre Drive exige un diálogo modal previo donde el usuario revisa la carpeta destino (<em>Vinchi</em>) y la lista exacta de archivos antes de disparar las peticiones multipart.</li>
      </ol>
      `
    ),
  },
  {
    id: 'db',
    driveFileName: 'Vinchi - Modelo de Base de Datos y Diagramas de Datos',
    shortTitle: 'Modelo de Base de Datos y ER',
    category: 'Entidades, Relaciones y CRUD',
    summary:
      'Esquema de persistencia de VinchiDatabase (.vinchi-data.json), diagrama entidad-relación visual, diccionario de atributos tipados y matriz completa de operaciones CRUD.',
    version: 'v1.0',
    updatedAt: '2026-11-15',
    htmlBody: wrapGoogleDocHtml(
      'Vinchi - Modelo de Base de Datos y Diagramas de Datos',
      'Esquema Entidad-Relación (ER), Diccionario de Entidades y Matriz de Operaciones CRUD',
      `
      <h2 style="color: #442c61; border-bottom: 2px solid #9c44dc; padding-bottom: 6px;">1. Diagrama Entidad-Relación (ER)</h2>
      <div style="background-color: #faf5ff; border: 2px solid #bc8ae1; border-radius: 12px; padding: 18px; margin: 16px 0; font-family: monospace; font-size: 12px; white-space: pre-wrap;">
+-------------------+       1 : N       +----------------------+
|      USERS        |------------------>|       SESSIONS       |
| id (PK), email    |                   | token (PK), userId   |
| role, passwordHash|---+               +----------------------+
+-------------------+   |
   |  1 : 1             | 1 : N
   +--------------------+-------------------------------+
   |                    |                               |
   v                    v                               v
+-------------------+  +---------------------+  +-----------------------+
| BUSINESS_WORKSP.  |  |  CLIENT_LOCATIONS   |  |    AGENT_REQUESTS     |
| businessId, plan  |  | id (PK), userId     |  | id (PK), clientId     |
| profile (1:1)     |  | esConjuntoPrivado   |  | assignedAgentId (FK)  |
| ads[] (1:N)       |  | modoEntrega         |  | activationToken       |
| qrCodes[] (1:N)   |  +---------------------+  +-----------------------+
| teamMembers[] (1:N)|                                  | 1 : N
+-------------------+                                   v
   |                                            +-----------------------+
   | 1 : N                                      | PORTAL_CHAT_MESSAGES  |
   v                                            +-----------------------+
+-------------------+       1 : N       +----------------------+
|   CLIENT_ORDERS   |------------------>| COURIER_DELIVERY_ORD |
| id, codigo, items |                   | step, pickupCode     |
| bonoDomiciliario  |                   | deliveryCode, pago   |
+-------------------+                   +----------------------+
      </div>

      <h2 style="color: #442c61; border-bottom: 2px solid #9c44dc; padding-bottom: 6px;">2. Diccionario de Entidades y Atributos</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 12.5px;">
        <thead>
          <tr style="background-color: #442c61; color: #ffffff;">
            <th style="padding: 8px; border: 1px solid #d8c2ef;">Entidad / Colección</th>
            <th style="padding: 8px; border: 1px solid #d8c2ef;">Clave Principal</th>
            <th style="padding: 8px; border: 1px solid #d8c2ef;">Atributos Clave</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding: 8px; border: 1px solid #d8c2ef;"><strong>users</strong></td><td style="padding: 8px; border: 1px solid #d8c2ef;"><code>id</code></td><td style="padding: 8px; border: 1px solid #d8c2ef;">nombre, primerNombre, primerApellido, email, role (6 roles), businessActivated, agentApplicationStatus, courierApplicationStatus, passwordHash</td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 8px; border: 1px solid #d8c2ef;"><strong>businessesByUser</strong></td><td style="padding: 8px; border: 1px solid #d8c2ef;"><code>userId -> businessId</code></td><td style="padding: 8px; border: 1px solid #d8c2ef;">plan (basico|premium|ultra), planSelected, planBillingCycle, profile{negocioNombre, descripcion, logoDataUrl, costoDomicilioCop}, ads[], qrCodes[], teamMembers[]</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #d8c2ef;"><strong>agents &amp; agentApplications</strong></td><td style="padding: 8px; border: 1px solid #d8c2ef;"><code>userId / id</code></td><td style="padding: 8px; border: 1px solid #d8c2ef;">disponible, comerciosVinculados, comisionAcumuladaCop, wallet{cards[], withdrawals[], autoMonthlyEnabled}, answers[30], facialVerified</td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 8px; border: 1px solid #d8c2ef;"><strong>couriers &amp; courierApplications</strong></td><td style="padding: 8px; border: 1px solid #d8c2ef;"><code>userId / id</code></td><td style="padding: 8px; border: 1px solid #d8c2ef;">activo, togglesUsedToday, vinchiAutoContract, activeOrder{step, pickupCodeExpected, deliveryCodeExpected, bonoDomiciliarioCop}, chatMessages[], companies[]</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #d8c2ef;"><strong>requests &amp; messages</strong></td><td style="padding: 8px; border: 1px solid #d8c2ef;"><code>id / requestId</code></td><td style="padding: 8px; border: 1px solid #d8c2ef;">clientId, assignedAgentId, status (10 estados), activationMode, activationToken, callState, emailNotice</td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 8px; border: 1px solid #d8c2ef;"><strong>clientLocationsByUser &amp; clientOrders</strong></td><td style="padding: 8px; border: 1px solid #d8c2ef;"><code>userId / id</code></td><td style="padding: 8px; border: 1px solid #d8c2ef;">nombreLugar, etiqueta, esConjuntoPrivado, modoEntrega, items[], subtotalCop, costoDomicilioCop, bonoDomiciliarioCop, bonoNombre, totalCop</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #d8c2ef;"><strong>clientAiQuotaByUser</strong></td><td style="padding: 8px; border: 1px solid #d8c2ef;"><code>userId</code></td><td style="padding: 8px; border: 1px solid #d8c2ef;">monthKey, usesThisMonth, adBonusUses, isClientPremium, premiumPaymentMethod</td></tr>
        </tbody>
      </table>

      <h2 style="color: #442c61; border-bottom: 2px solid #9c44dc; padding-bottom: 6px;">3. Matriz de Operaciones CRUD</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 12.5px;">
        <thead>
          <tr style="background-color: #442c61; color: #ffffff;">
            <th style="padding: 8px; border: 1px solid #d8c2ef;">Recurso</th>
            <th style="padding: 8px; border: 1px solid #d8c2ef;">Create</th>
            <th style="padding: 8px; border: 1px solid #d8c2ef;">Read</th>
            <th style="padding: 8px; border: 1px solid #d8c2ef;">Update</th>
            <th style="padding: 8px; border: 1px solid #d8c2ef;">Delete</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding: 7px; border: 1px solid #d8c2ef;">Ubicaciones Cliente (máx. 6)</td><td style="padding: 7px; border: 1px solid #d8c2ef;">POST /locations</td><td style="padding: 7px; border: 1px solid #d8c2ef;">GET /workspace</td><td style="padding: 7px; border: 1px solid #d8c2ef;">PUT /locations/:id</td><td style="padding: 7px; border: 1px solid #d8c2ef;">DELETE /locations/:id</td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 7px; border: 1px solid #d8c2ef;">Códigos QR Comercio</td><td style="padding: 7px; border: 1px solid #d8c2ef;">POST /comercio/qr</td><td style="padding: 7px; border: 1px solid #d8c2ef;">GET /comercio/workspace</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Regeneración</td><td style="padding: 7px; border: 1px solid #d8c2ef;">DELETE /comercio/qr/:id</td></tr>
          <tr><td style="padding: 7px; border: 1px solid #d8c2ef;">Equipo y Permisos Comercio</td><td style="padding: 7px; border: 1px solid #d8c2ef;">POST /comercio/team</td><td style="padding: 7px; border: 1px solid #d8c2ef;">GET /comercio/workspace</td><td style="padding: 7px; border: 1px solid #d8c2ef;">PUT /comercio/team/:id</td><td style="padding: 7px; border: 1px solid #d8c2ef;">DELETE /comercio/team/:id</td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 7px; border: 1px solid #d8c2ef;">Tarjetas Billetera Agente/Rep.</td><td style="padding: 7px; border: 1px solid #d8c2ef;">POST .../wallet/cards</td><td style="padding: 7px; border: 1px solid #d8c2ef;">GET .../workspace</td><td style="padding: 7px; border: 1px solid #d8c2ef;">PUT .../autopay</td><td style="padding: 7px; border: 1px solid #d8c2ef;">DELETE .../cards/:id</td></tr>
          <tr><td style="padding: 7px; border: 1px solid #d8c2ef;">Órdenes Comerciales</td><td style="padding: 7px; border: 1px solid #d8c2ef;">POST /cliente/orders</td><td style="padding: 7px; border: 1px solid #d8c2ef;">GET /orders</td><td style="padding: 7px; border: 1px solid #d8c2ef;">POST /cobrar | /anular</td><td style="padding: 7px; border: 1px solid #d8c2ef;">N/A (Auditoría Anulada)</td></tr>
        </tbody>
      </table>
      `
    ),
  },
  {
    id: 'uiux',
    driveFileName: 'Vinchi - Wireframes, Mockups y Prototipos UI-UX',
    shortTitle: 'Wireframes, Mockups y UI/UX',
    category: 'Diseño de Interfaz y Experiencia',
    summary:
      'Sistema de diseño Vinchi (Púrpura Real #442c61 / #9c44dc), wireframes estructurales de Landing, Catálogo, Foro, Panel Empresario, Portales Agente/Repartidor y flujos interactivos.',
    version: 'v1.0',
    updatedAt: '2026-11-15',
    htmlBody: wrapGoogleDocHtml(
      'Vinchi - Wireframes, Mockups y Prototipos UI-UX',
      'Guía Visual, Arquitectura de Pantallas, Wireframes Estructurales y Flujos de Interacción',
      `
      <h2 style="color: #442c61; border-bottom: 2px solid #9c44dc; padding-bottom: 6px;">1. Identidad Visual y Tokens de Diseño</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 13px;">
        <thead>
          <tr style="background-color: #442c61; color: #ffffff;">
            <th style="padding: 8px; border: 1px solid #d8c2ef;">Token</th>
            <th style="padding: 8px; border: 1px solid #d8c2ef;">Valor Hex</th>
            <th style="padding: 8px; border: 1px solid #d8c2ef;">Uso en Interfaz</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding: 8px; border: 1px solid #d8c2ef;">Púrpura Profundo</td><td style="padding: 8px; border: 1px solid #d8c2ef;"><code>#442c61</code></td><td style="padding: 8px; border: 1px solid #d8c2ef;">Cabeceras fijas, títulos de jerarquía y contenedores premium.</td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 8px; border: 1px solid #d8c2ef;">Púrpura Eléctrico</td><td style="padding: 8px; border: 1px solid #d8c2ef;"><code>#9c44dc</code></td><td style="padding: 8px; border: 1px solid #d8c2ef;">Botones primarios CTA, estados activos y acentos de foco.</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #d8c2ef;">Lavanda Fondo</td><td style="padding: 8px; border: 1px solid #d8c2ef;"><code>#f6f1fc / #faf5ff</code></td><td style="padding: 8px; border: 1px solid #d8c2ef;">Lienzo base limpio y tarjetas elevadas.</td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 8px; border: 1px solid #d8c2ef;">Ámbar Anuncio Dorado</td><td style="padding: 8px; border: 1px solid #d8c2ef;"><code>#b45309 / #fde68a</code></td><td style="padding: 8px; border: 1px solid #d8c2ef;">Insignias de Anuncio Dorado, Sello Ultra y bonos de domicilio.</td></tr>
        </tbody>
      </table>

      <h2 style="color: #442c61; border-bottom: 2px solid #9c44dc; padding-bottom: 6px;">2. Wireframes Estructurales de Pantallas Principales</h2>
      <h3 style="color: #543b6c;">2.1 Landing Page — Barra Única Reactiva</h3>
      <div style="border: 2px solid #442c61; border-radius: 10px; padding: 12px; margin-bottom: 14px; font-family: monospace; font-size: 12px; background-color: #ffffff;">
Estado Público (Sin sesión):
[ vinchi ]                          [Trabajar en Vinchi] [Crear mi espacio] [Pedir Ahora]

Estado Autenticado (Reemplaza botones originales):
[ vinchi ]        [Nombre · Rol Activo] [Mi espacio / Portal] [Cerrar sesión]
-------------------------------------------------------------------------------------------
HERO (50% Izq: Copy + CTA + Acceso Documentación Drive | 50% Der: Showcase Móvil 3D)
CORREDOR SCROLL 3D (Moto Domiciliario -> Paloma Mensajera -> Corbata Empresario)
PLANES (Básico Gratis $0 · Premium $60.900 · Ultra $185.900) + FOOTER
      </div>

      <h3 style="color: #543b6c;">2.2 Portal Cliente — Catálogo, Complementos, Foro y Checkout</h3>
      <div style="border: 2px solid #9c44dc; border-radius: 10px; padding: 12px; margin-bottom: 14px; font-family: monospace; font-size: 12px; background-color: #ffffff;">
[Store] vinchi · Hola, Valeria        [Ubicación Activa] [Agregar ubicaciones (N/6)] [Carrito] [Cerrar sesión]
Nav: [Catálogo] [Foro *] [Pedidos en proceso] [Carrito] [Perfil]
-------------------------------------------------------------------------------------------
[Filtros Rápidos: Todos | Bebidas | Comida rápida | Vegana | Asiática | Carnes | Postres]
[<] [ Carrusel Empresas / Anuncios Dorados / Ultra -> Click abre Perfil Empresa ] [>]
[<] [ Carrusel Productos -> Click Agregar abre Modal Complementos:              ] [>]
    -> Modal Complementos: [Bebidas] [Porciones (si aplica)] [Salsas] [Otros]
Carrito: [Resumen] + [Tarifa Domicilio ó $1.000 Recoger] + [Bono Repartidor >= $300]
      </div>

      <h3 style="color: #543b6c;">2.3 Espacio Privado Empresario — Selección de Plan + Gestión</h3>
      <div style="border: 2px solid #442c61; border-radius: 10px; padding: 12px; margin-bottom: 14px; font-family: monospace; font-size: 12px; background-color: #ffffff;">
Paso 1 (Antes de ingresar): [Básico Gratis $0] -> Entra directo | [Premium / Ultra] -> [Método de Pago]
Paso 2 (Workspace Privado):
Tabs: [Órdenes y Domicilios] [Estadísticas] [Logo y Perfil] [Anuncios] [Códigos QR] [Permisos y Equipo]
      </div>
      `
    ),
  },
  {
    id: 'api',
    driveFileName: 'Vinchi - Documentación de la API y Backend',
    shortTitle: 'Documentación de la API y Backend',
    category: 'Endpoints REST y WebSockets',
    summary:
      'Referencia completa de los endpoints Express en server.ts: autenticación, portal agentes, operación agente, empresario, órdenes, domiciliarios, cliente, Gemini IA y eventos WebSocket.',
    version: 'v1.0',
    updatedAt: '2026-11-15',
    htmlBody: wrapGoogleDocHtml(
      'Vinchi - Documentación de la API y Backend',
      'Especificación de Endpoints REST, Esquemas de Autenticación Bearer y Canal WebSocket en Tiempo Real',
      `
      <h2 style="color: #442c61; border-bottom: 2px solid #9c44dc; padding-bottom: 6px;">1. Convenciones Generales</h2>
      <ul>
        <li><strong>URL Base:</strong> <code>/api/*</code> servido por Express en el puerto 3000.</li>
        <li><strong>Autenticación:</strong> Cabecera <code>Authorization: Bearer &lt;token&gt;</code> validada contra sesiones persistidas.</li>
        <li><strong>Formato de Respuesta:</strong> <code>application/json</code>. Errores devuelven <code>{ "error": "Mensaje descriptivo en español" }</code> con códigos HTTP 400, 401, 403, 404, 429 o 500.</li>
      </ul>

      <h2 style="color: #442c61; border-bottom: 2px solid #9c44dc; padding-bottom: 6px;">2. Catálogo Completo de Endpoints</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 12px;">
        <thead>
          <tr style="background-color: #442c61; color: #ffffff;">
            <th style="padding: 8px; border: 1px solid #d8c2ef;">Método</th>
            <th style="padding: 8px; border: 1px solid #d8c2ef;">Ruta</th>
            <th style="padding: 8px; border: 1px solid #d8c2ef;">Rol</th>
            <th style="padding: 8px; border: 1px solid #d8c2ef;">Descripción</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding: 7px; border: 1px solid #d8c2ef;"><strong>POST</strong></td><td style="padding: 7px; border: 1px solid #d8c2ef;"><code>/api/auth/register</code></td><td style="padding: 7px; border: 1px solid #d8c2ef;">Público</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Crea cuenta como <code>cliente</code> o <code>empresario_en_espera</code>.</td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 7px; border: 1px solid #d8c2ef;"><strong>POST</strong></td><td style="padding: 7px; border: 1px solid #d8c2ef;"><code>/api/auth/login</code></td><td style="padding: 7px; border: 1px solid #d8c2ef;">Público</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Valida credenciales y retorna <code>token</code> + <code>user</code>.</td></tr>
          <tr><td style="padding: 7px; border: 1px solid #d8c2ef;"><strong>POST</strong></td><td style="padding: 7px; border: 1px solid #d8c2ef;"><code>/api/auth/staff-login</code></td><td style="padding: 7px; border: 1px solid #d8c2ef;">Público</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Autentica colaborador mediante PIN creado en Equipo.</td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 7px; border: 1px solid #d8c2ef;"><strong>POST</strong></td><td style="padding: 7px; border: 1px solid #d8c2ef;"><code>/api/auth/biometric-login</code></td><td style="padding: 7px; border: 1px solid #d8c2ef;">Público</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Check-in rápido biométrico para cuenta repartidor.</td></tr>
          <tr><td style="padding: 7px; border: 1px solid #d8c2ef;"><strong>GET / POST</strong></td><td style="padding: 7px; border: 1px solid #d8c2ef;"><code>/api/auth/me</code> · <code>/logout</code></td><td style="padding: 7px; border: 1px solid #d8c2ef;">Autenticado</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Restaura o invalida sesión Bearer.</td></tr>

          <tr style="background-color: #f3e8ff;"><td colspan="4" style="padding: 7px; border: 1px solid #d8c2ef;"><strong>Portal Empresario en Espera y Vinculación Agente</strong></td></tr>
          <tr><td style="padding: 7px; border: 1px solid #d8c2ef;"><strong>GET</strong></td><td style="padding: 7px; border: 1px solid #d8c2ef;"><code>/api/portal/state</code></td><td style="padding: 7px; border: 1px solid #d8c2ef;">Cliente/Espera</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Estado de solicitud, mensajes y agentes disponibles.</td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 7px; border: 1px solid #d8c2ef;"><strong>POST</strong></td><td style="padding: 7px; border: 1px solid #d8c2ef;"><code>/api/portal/pay-search</code></td><td style="padding: 7px; border: 1px solid #d8c2ef;">Cliente/Espera</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Procesa pago inicial de $15.000 COP.</td></tr>
          <tr><td style="padding: 7px; border: 1px solid #d8c2ef;"><strong>POST</strong></td><td style="padding: 7px; border: 1px solid #d8c2ef;"><code>/api/portal/match-agent</code></td><td style="padding: 7px; border: 1px solid #d8c2ef;">Cliente/Espera</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Asigna agente disponible y emite <code>portal:update</code>.</td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 7px; border: 1px solid #d8c2ef;"><strong>POST</strong></td><td style="padding: 7px; border: 1px solid #d8c2ef;"><code>/api/portal/pay-visit</code></td><td style="padding: 7px; border: 1px solid #d8c2ef;">Cliente/Espera</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Registra pago de visita presencial ($20.000 COP).</td></tr>
          <tr><td style="padding: 7px; border: 1px solid #d8c2ef;"><strong>POST</strong></td><td style="padding: 7px; border: 1px solid #d8c2ef;"><code>/api/portal/verify-token</code></td><td style="padding: 7px; border: 1px solid #d8c2ef;">Cliente/Espera</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Valida token, promueve usuario a rol <code>comercio</code> (Empresario).</td></tr>

          <tr style="background-color: #f3e8ff;"><td colspan="4" style="padding: 7px; border: 1px solid #d8c2ef;"><strong>Espacio Privado Empresario (Comercio)</strong></td></tr>
          <tr><td style="padding: 7px; border: 1px solid #d8c2ef;"><strong>GET</strong></td><td style="padding: 7px; border: 1px solid #d8c2ef;"><code>/api/comercio/workspace</code></td><td style="padding: 7px; border: 1px solid #d8c2ef;">Empresario</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Retorna plan, perfil, anuncios, códigos QR y equipo.</td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 7px; border: 1px solid #d8c2ef;"><strong>POST</strong></td><td style="padding: 7px; border: 1px solid #d8c2ef;"><code>/api/comercio/plan/select</code></td><td style="padding: 7px; border: 1px solid #d8c2ef;">Empresario</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Activa Básico Gratis o confirma pago para Premium/Ultra.</td></tr>
          <tr><td style="padding: 7px; border: 1px solid #d8c2ef;"><strong>PUT</strong></td><td style="padding: 7px; border: 1px solid #d8c2ef;"><code>/api/comercio/profile</code></td><td style="padding: 7px; border: 1px solid #d8c2ef;">Empresario</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Actualiza logotipo, descripción, dirección y tarifa de envío.</td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 7px; border: 1px solid #d8c2ef;"><strong>POST</strong></td><td style="padding: 7px; border: 1px solid #d8c2ef;"><code>/api/comercio/ads</code></td><td style="padding: 7px; border: 1px solid #d8c2ef;">Empresario</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Publica Anuncio Dorado ($25.000 COP o $0 en Ultra).</td></tr>
          <tr><td style="padding: 7px; border: 1px solid #d8c2ef;"><strong>POST / DELETE</strong></td><td style="padding: 7px; border: 1px solid #d8c2ef;"><code>/api/comercio/qr</code> · <code>/:id</code></td><td style="padding: 7px; border: 1px solid #d8c2ef;">Premium/Ultra</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Genera imagen QR PNG escaneable en servidor (bloqueado en Básico).</td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 7px; border: 1px solid #d8c2ef;"><strong>POST/PUT/DEL</strong></td><td style="padding: 7px; border: 1px solid #d8c2ef;"><code>/api/comercio/team</code></td><td style="padding: 7px; border: 1px solid #d8c2ef;">Empresario</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Administra colaboradores, PIN de caja y 8 permisos granulares.</td></tr>
          <tr><td style="padding: 7px; border: 1px solid #d8c2ef;"><strong>GET / POST</strong></td><td style="padding: 7px; border: 1px solid #d8c2ef;"><code>/api/orders</code> · <code>/cobrar</code> · <code>/anular</code></td><td style="padding: 7px; border: 1px solid #d8c2ef;">Empresario</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Lista y gestiona cobro o anulación de órdenes activas.</td></tr>

          <tr style="background-color: #f3e8ff;"><td colspan="4" style="padding: 7px; border: 1px solid #d8c2ef;"><strong>Cliente, Agente, Repartidor e IA</strong></td></tr>
          <tr><td style="padding: 7px; border: 1px solid #d8c2ef;"><strong>CRUD</strong></td><td style="padding: 7px; border: 1px solid #d8c2ef;"><code>/api/cliente/workspace</code> · <code>/locations</code> · <code>/orders</code></td><td style="padding: 7px; border: 1px solid #d8c2ef;">Cliente</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Catálogo fusionado, ubicaciones (máx. 6) y pedidos con bono >= $300.</td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 7px; border: 1px solid #d8c2ef;"><strong>POST</strong></td><td style="padding: 7px; border: 1px solid #d8c2ef;"><code>/api/ai/cliente-chat</code></td><td style="padding: 7px; border: 1px solid #d8c2ef;">Autenticado</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Recomendador Gemini con control de cuota mensual / Cliente Premium.</td></tr>
          <tr><td style="padding: 7px; border: 1px solid #d8c2ef;"><strong>GET / POST</strong></td><td style="padding: 7px; border: 1px solid #d8c2ef;"><code>/api/agent/*</code> &amp; <code>/api/courier/*</code></td><td style="padding: 7px; border: 1px solid #d8c2ef;">Agente / Rep.</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Activaciones, billetera, retiros, ruta en mapa y códigos de entrega.</td></tr>
        </tbody>
      </table>

      <h2 style="color: #442c61; border-bottom: 2px solid #9c44dc; padding-bottom: 6px;">3. Eventos WebSocket (<code>/ws?token=...</code>)</h2>
      <ul>
        <li><code>portal:update</code> — Actualiza en vivo estado de solicitud, llamadas y cantidad de agentes disponibles.</li>
        <li><code>chat:message</code> — Entrega instantánea de mensajes entre Empresario en espera y Agente.</li>
        <li><code>agent:workspace</code> — Fuerza recarga de bandeja en el portal del Agente al entrar un comercio nuevo.</li>
        <li><code>application:reviewed</code> — Notifica aprobación automática o manual de postulación de Agente.</li>
      </ul>
      `
    ),
  },
  {
    id: 'plan',
    driveFileName: 'Vinchi - Plan de Proyecto y Backlog',
    shortTitle: 'Plan de Proyecto y Backlog',
    category: 'Fases, Prioridades y Cronograma',
    summary:
      'Hoja de ruta ejecutiva en 6 fases (Nov 2026 - Ene 2027), backlog priorizado (MoSCoW) con responsables y criterios de aceptación verificables.',
    version: 'v1.0',
    updatedAt: '2026-11-15',
    htmlBody: wrapGoogleDocHtml(
      'Vinchi - Plan de Proyecto y Backlog',
      'Fases de Desarrollo, Product Backlog Priorizado, Responsables y Fechas Estimadas',
      `
      <h2 style="color: #442c61; border-bottom: 2px solid #9c44dc; padding-bottom: 6px;">1. Fases del Proyecto y Cronograma</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 13px;">
        <thead>
          <tr style="background-color: #442c61; color: #ffffff;">
            <th style="padding: 8px; border: 1px solid #d8c2ef;">Fase</th>
            <th style="padding: 8px; border: 1px solid #d8c2ef;">Alcance Principal</th>
            <th style="padding: 8px; border: 1px solid #d8c2ef;">Fechas Estimadas</th>
            <th style="padding: 8px; border: 1px solid #d8c2ef;">Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding: 8px; border: 1px solid #d8c2ef;"><strong>Fase 1 · Fundamentos y Landing 3D</strong></td><td style="padding: 8px; border: 1px solid #d8c2ef;">Identidad Púrpura Real, Three.js showcase, planes 0% comisión y autenticación RBAC.</td><td style="padding: 8px; border: 1px solid #d8c2ef;">01 Nov - 10 Nov 2026</td><td style="padding: 8px; border: 1px solid #d8c2ef; color: #166534;"><strong>Completada</strong></td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 8px; border: 1px solid #d8c2ef;"><strong>Fase 2 · Red Agentes &amp; Repartidores</strong></td><td style="padding: 8px; border: 1px solid #d8c2ef;">Postulación 30 preguntas + biometría, emparejamiento WebSocket, mapa de entregas y billeteras.</td><td style="padding: 8px; border: 1px solid #d8c2ef;">11 Nov - 20 Nov 2026</td><td style="padding: 8px; border: 1px solid #d8c2ef; color: #166534;"><strong>Completada</strong></td></tr>
          <tr><td style="padding: 8px; border: 1px solid #d8c2ef;"><strong>Fase 3 · Portal Cliente y Complementos</strong></td><td style="padding: 8px; border: 1px solid #d8c2ef;">Catálogo con botones laterales, Foro, modal Bebidas/Porciones/Salsas/Otros, bono domiciliario e IA Gemini.</td><td style="padding: 8px; border: 1px solid #d8c2ef;">21 Nov - 30 Nov 2026</td><td style="padding: 8px; border: 1px solid #d8c2ef; color: #166534;"><strong>Completada</strong></td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 8px; border: 1px solid #d8c2ef;"><strong>Fase 4 · Espacio Privado Empresario</strong></td><td style="padding: 8px; border: 1px solid #d8c2ef;">Selección previa 3 planes + método pago, estadísticas, logo, anuncios pagos/Ultra, QR y permisos.</td><td style="padding: 8px; border: 1px solid #d8c2ef;">01 Dic - 10 Dic 2026</td><td style="padding: 8px; border: 1px solid #d8c2ef; color: #166534;"><strong>Completada</strong></td></tr>
          <tr><td style="padding: 8px; border: 1px solid #d8c2ef;"><strong>Fase 5 · Documentación y Google Drive</strong></td><td style="padding: 8px; border: 1px solid #d8c2ef;">Suite SRS/SDD/ER/UI/API/Plan e integración OAuth con Google Drive en carpeta Vinchi.</td><td style="padding: 8px; border: 1px solid #d8c2ef;">11 Dic - 18 Dic 2026</td><td style="padding: 8px; border: 1px solid #d8c2ef; color: #9c44dc;"><strong>En Entrega</strong></td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 8px; border: 1px solid #d8c2ef;"><strong>Fase 6 · Pruebas E2E y Despliegue Prod</strong></td><td style="padding: 8px; border: 1px solid #d8c2ef;">Pruebas de carga, auditoría de seguridad y puesta en producción con monitoreo continuo.</td><td style="padding: 8px; border: 1px solid #d8c2ef;">19 Dic - 05 Ene 2027</td><td style="padding: 8px; border: 1px solid #d8c2ef;">Planificada</td></tr>
        </tbody>
      </table>

      <h2 style="color: #442c61; border-bottom: 2px solid #9c44dc; padding-bottom: 6px;">2. Backlog Priorizado (MoSCoW)</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 12.5px;">
        <thead>
          <tr style="background-color: #442c61; color: #ffffff;">
            <th style="padding: 8px; border: 1px solid #d8c2ef;">ID</th>
            <th style="padding: 8px; border: 1px solid #d8c2ef;">Prioridad</th>
            <th style="padding: 8px; border: 1px solid #d8c2ef;">Historia / Entregable</th>
            <th style="padding: 8px; border: 1px solid #d8c2ef;">Responsable</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding: 7px; border: 1px solid #d8c2ef;">PBI-01</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Must Have</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Reemplazo de barra superior única al iniciar sesión (desaparece al cerrar sesión).</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Frontend Lead</td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 7px; border: 1px solid #d8c2ef;">PBI-02</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Must Have</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Onboarding 3 planes Empresario + pasarela de pago para Premium y Ultra.</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Full-Stack Lead</td></tr>
          <tr><td style="padding: 7px; border: 1px solid #d8c2ef;">PBI-03</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Must Have</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Generación real de QR descargables (solo Premium/Ultra) y anuncios pagos/Ultra.</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Backend Engineer</td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 7px; border: 1px solid #d8c2ef;">PBI-04</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Must Have</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Exportación confirmada de los 6 documentos SRS/SDD/BD/UI/API/Plan a carpeta Drive "Vinchi".</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Integrations Lead</td></tr>
          <tr><td style="padding: 7px; border: 1px solid #d8c2ef;">PBI-05</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Should Have</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Sincronización de logotipo propio en tarjetas del Catálogo, Foro y Modal de Perfil.</td><td style="padding: 7px; border: 1px solid #d8c2ef;">UI/UX Engineer</td></tr>
          <tr style="background-color: #faf5ff;"><td style="padding: 7px; border: 1px solid #d8c2ef;">PBI-06</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Could Have</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Exportación PDF multiidioma y analítica histórica comparativa por trimestres.</td><td style="padding: 7px; border: 1px solid #d8c2ef;">Product Team</td></tr>
        </tbody>
      </table>
      `
    ),
  },
];
