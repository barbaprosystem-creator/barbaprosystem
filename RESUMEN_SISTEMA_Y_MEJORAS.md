# 🏗️ Barba CRM & Construction System — Resumen Técnico, Arquitectura y Mejoras

---

## 1. 🛠️ Stack Tecnológico Actual

| Capa / Módulo | Tecnología / Herramienta | Descripción y Uso |
| :--- | :--- | :--- |
| **Frontend Core** | **React 19 + Vite** | Aplicación web SPA de alto rendimiento con renderizado optimizado y carga modular de rutas (`React.lazy`). |
| **Enrutamiento** | **React Router v7** | Navegación protegida con autenticación basada en roles (`admin`, `office`, `supervisor`, `salesperson`). |
| **Estilos & UI** | **Tailwind CSS v4 + Vanilla CSS** | Sistema de diseño oscuro premium con glassmorphism, microanimaciones y paleta dorada corporativa (`#F5C518`). |
| **Estado Global** | **Zustand + React Context** | Gestión global de sesión (`AuthContext`), idioma y configuraciones del estimador. |
| **Base de Datos & Auth** | **Supabase (PostgreSQL + RLS)** | Almacenamiento relacional en la nube con Row Level Security, Auth y Storage (`ddwyutisxymuvofkjhpz.supabase.co`). |
| **Motores de IA** | **Google Gemini (3.1/3.6/Flash)** + OpenAI Fallback | Extracción OCR multimodal de recibos y facturas en Contabilidad, Barba Copilot, Generador de Propuestas y Entrenador de IA. |
| **Contabilidad & ERP** | **QuickBooks Online API (QBO Sync)** | Sincronización bidireccional de clientes, facturas de venta, estimados y pagos. |
| **Comunicaciones & VoIP** | **Twilio API (SMS + WebRTC Softphone)** | Envío de mensajes SMS directos y marcador telefónico VoIP en el navegador para contacto con leads. |
| **Correos Transaccionales** | **Resend API** | Notificaciones automáticas de contratos firmados, estimados y recordatorios de cobro. |
| **Calendario & Citas** | **Google Calendar API** | Sincronización de eventos de instalación, visitas y citas de inspección. |

---

## 2. ⚠️ Los Problemas con el *Clear Site Data* y la Purga de Sesión

### ¿Qué estaba ocurriendo?
El sistema presentaba un comportamiento molesto donde la sesión se cerraba sola (incluso tras 15 minutos o al cerrar la ventana) y la aplicación parecía "frizarse" o "re-descargar el mundo entero" en cada inicio.

### Causas Raíz Identificadas:
1. **Uso estricto de `sessionStorage`:**
   * La sesión de Supabase estaba forzada a guardarse en `window.sessionStorage`.
   * Por especificación de los navegadores web, `sessionStorage` se destruye en el momento exacto en que se cierra la pestaña o el navegador. Al reabrir, el usuario era expulsado y debía iniciar sesión de nuevo.
2. **Purga Incondicional de `CacheStorage` en `main.jsx`:**
   * En cada recarga de página se ejecutaba `caches.keys().then(names => names.forEach(name => caches.delete(name)))`.
   * Esto obligaba al navegador a desechar los archivos JavaScript, CSS e imágenes previamente descargados, forzando una descarga completa por red en cada visita.
3. **Descargas Brutas Sin Caché:**
   * Al abrir Proyectos o Leads de TZEL, el sistema no recordaba los datos anteriores y ejecutaba consultas pesadas de **1,000 contactos, 300 proyectos y 700 leads** simultáneamente, creando bloqueos de CPU y retrasos en la interfaz.

---

## 3. 🚀 Mejoras y Soluciones Implementadas

### A. Persistencia Real de Sesión (`localStorage`)
* **Migración:** Se configuró el cliente de Supabase ([supabase.js](file:///c:/TRABAJO/barba%20construction/barba-crm/src/lib/supabase.js)) para utilizar `localStorage` (`barba-crm-auth-token`) con renovación automática de tokens en segundo plano (`autoRefreshToken: true`).
* **Resultado:** Si sales de la ventana, te vas a almorzar o cierras el navegador, **la sesión permanece activa y lista**. Solo se cierra si haces clic voluntariamente en *"Cerrar Sesión"*.

---

### B. Motor de Caché Inteligente y Carga Instantánea (0ms) ([dataCache.js](file:///c:/TRABAJO/barba%20construction/barba-crm/src/lib/dataCache.js))
* **Carga en 0 Segundos:** Al entrar a cualquier pantalla (Dashboard, Proyectos, Leads de TZEL), los datos guardados en tu navegador se muestran **de inmediato**.
* **Sincronización Diferencial en Segundo Plano:** En lugar de bajar toda la base de datos, el sistema solo consulta a Supabase:
  $$\text{¿Hay registros nuevos con } \text{updated\_at} > \text{última\_sincronización}?$$
  * Si no hay cambios → **0 consumo de internet y 0 demora**.
  * Si hay 2 registros nuevos → Se integran silenciosamente a la lista local.

---

### C. Optimización del Radar de Leads de TZEL ([TzelLeadsPage.jsx](file:///c:/TRABAJO/barba%20construction/barba-crm/src/pages/admin/TzelLeadsPage.jsx))
1. **Paginación Fluida:** Se implementó paginación de 24 leads por página con selectores numéricos y botones Anterior/Siguiente.
2. **Sincronización de Estados en Caché:** Al cambiar el estado de un lead (ej. de *"Sin Contactar"* a *"Contactado"*), el cambio se guarda instantáneamente en pantalla, en la caché local y en Supabase.
3. **Notificación Flotante (*Toast*):** Se añadió un aviso flotante de confirmación cada vez que se actualiza el estado de un lead, indicando a qué categoría se movió si hay filtros activos.

---

### D. Integración de Google Gemini en Contabilidad ([api/ai.js](file:///c:/TRABAJO/barba%20construction/barba-crm/api/ai.js))
* **OCR Multimodal con Gemini:** Se reemplazó la dependencia estricta de OpenAI por **Google Gemini** (`gemini-3.1-flash-lite` / `gemini-flash-latest`) como motor principal de lectura de recibos y facturas en la pestaña de Contabilidad de Proyectos.
* **Velocidad y Respaldo:** Extracción de datos en menos de 1 segundo con tolerancia a fallos y conmutación automática.

---

### E. Corrección de Errores en Base de Datos y Sincronizaciones de QBO
* **Corrección Error 400 en `daily_reports`:** Se eliminó la solicitud de una columna inexistente (`notes`) en la consulta del Dashboard ([AdminDashboard.jsx](file:///c:/TRABAJO/barba%20construction/barba-crm/src/pages/admin/AdminDashboard.jsx)).
* **Cooldown de 10 minutos para QuickBooks:** Se evitó que `ProjectsList.jsx` y `EstimatesList.jsx` disparen llamadas pasivas a la API de QuickBooks en cada renderizado.
* **Resolución de Direcciones de Obras:** En [api/qbo.js](file:///c:/TRABAJO/barba%20construction/barba-crm/api/qbo.js), se prioriza la dirección física de la obra (`ShipAddr` / `BillAddr`) sobre la dirección general del contacto.

---

## 4. 📦 Historial de Commits en Git (`main`)

| Commit | Descripción del Cambio |
| :--- | :--- |
| `dd97750` | Integración de Google Gemini para OCR en contabilidad y resolución de direcciones físicas en QBO. |
| `ed37a06` | Corrección de error 400 en `daily_reports`, paginación en Leads de TZEL y eliminación de purga de caché. |
| `4f75b47` | Implementación de sesión persistente (`localStorage`) y motor de caché diferencial `dataCache.js` (0ms). |
| `c009cc0` | Sincronización instantánea de cambio de estados de leads en caché local y avisos flotantes *Toast*. |

---

*Documento generado y guardado en la raíz del proyecto para referencia del equipo.*
