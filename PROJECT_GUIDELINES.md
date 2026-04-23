# Barba CRM - Project Guidel    ines & Hacker Strategy

Este documento establece la filosofía de desarrollo y las directrices técnicas para construir el **Barba CRM**, priorizando costos operativos mínimos (acercándose a cero) y una usabilidad máxima en campo.

## 1. Filosofía de Desarrollo: "Cero Fricción"

*   **Enfoque Mobile-First (Tablets/Phones):** La interfaz para los vendedores y cuadrillas debe operar con hitboxes grandes, texto legible bajo la luz del sol y navegación instantánea.
*   **Aislamiento de Interfaces (Roles):** El Vendedor solo ve el Estimator POS. El Administrador ve todo el Pipeline. Cero menús confusos.
*   **QuickBooks es Contabilidad, no CRM:** El CRM será el dueño de las operaciones diarias y la gestión de leads. QBO será tratado estrictamente como el motor contable al final del pipeline.

## 2. Estrategia "Hacker" (Costos y Sustituciones Open Source)

El objetivo central es derrotar al paradigma tradicional de SaaS (Software as a Service) por usuario. No pagaremos licencias recurrentes infladas por herramientas que podemos sustituir con APIs gratuitas o software Open Source.

### A. Medición de Techos y Superficies (Sustituto de EagleView / RoofSnap)
*   **Problema original:** Costos de $15 a $50 dólares por reporte comercial.
*   **Nuestra Solución ($0 Costo Fijo):** Integrar la **Google Maps Solar API** o incrustar vistas de alta resolución gratuitas de **Google Earth**, permitiendo a los vendedores trazar polígonos (*squares*) a mano libre de forma táctil en sus tablets, devolviendo los cálculos matemáticos instantáneamente. Si se introducen drones en el futuro, integraremos **OpenDroneMap** (Open Source).

### B. Firmas Electrónicas (Sustituto de DocuSign)
*   **Problema original:** Planes corporativos costosos limitados por cantidad de "sobres" (envelopes) al año ($40+ por paquete).
*   **Nuestra Solución ($0 Costo):** Renderizar el contrato en pantalla e integrar un entorno de firma directo (`HTML5 Canvas` o `signature_pad`) para que el cliente firme físicamente en la tablet. Si se requiere firma remota, usar una instancia autoalojada de **Documenso** o **Docuseal** (Sistemas Open Source de grado legal).

### C. Registro Fotográfico y Subida Rápida (Sustituto de CompanyCam)
*   **Problema original:** ~$25/mes por usuario activo para poder subir las fotos de "antes y después".
*   **Nuestra Solución (Costo Irrisorio):** Utilizar **WhatsApp API** (Meta) con un Webhook apuntando al Bucket de **Supabase Storage**. Los obreros / Project Managers no instalan aplicaciones, solo mandan la foto al chat de WhatsApp y el backend adjunta la imagen automáticamente al Kanban board de esa propiedad. Costo aproximado de menos de $10 USD mensuales para 50+ trabajadores.

### D. Alertas y Seguimiento de Clima (Sustituto de HailTrace o InteractiveHailMaps)
*   **Problema original:** Membresías premium carísimas ($100-$300/mes) para alertar sobre áreas afectadas por granizadas.
*   **Nuestra Solución ($0 Costo):** Extracción directa desde la fuente primaria: la API de la **NOAA** (National Oceanic and Atmospheric Administration) o datos meteorológicos públicos gratuitos. Las alertas y zonas (polígonos de ZipCodes) se inyectarán proactivamente al pipeline del administrador de área.

## 3. Próximos Pasos Arquitectónicos

1.  **Backend & Auth:** Integración nativa a **Supabase** (PostgreSQL / RLS Policies).
2.  **Integración QBO:** API bidireccional usando Node.js/Edge Functions para creación dinámica de Invoices aprobados en etapa "Done".
3.  **Bot de WhatsApp:** Pipeline de validación de imágenes directo de celular a la nube, atado a `property_id`.
