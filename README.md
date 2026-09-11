# Reporte Electro

App web/móvil (PWA) para registrar y seguir la venta de **garantía extendida**, **Seguro Connect**,
**Fpuntos**, **Fpuntos + Pesos** y **No Mix**, y armar el reporte por **área → departamento → asesor**.

Todo vive en un solo archivo (`index.html`). Funciona sin instalar nada; para que sea **multiusuario en
línea** se conecta a **Firebase**, y para **leer boletas con IA** usa **Google Gemini** (opcional).

## Pestañas

- **Registrar** — Garantía o Seguro (foto/PDF de boleta con IA o manual), botones **Fpuntos** y
  **Fpuntos + Pesos $**, y tarjeta **No Mix** (departamento + monto). Puedes registrar a tu nombre o **a otra persona**.
- **Reporte** — Avance **del día** por área y departamento (garantía, seguro, total, cumplimiento) +
  **Total tienda** con lo que falta para la meta diaria + detalle por asesor. Botón **🖥️ Reporte** = vista
  a pantalla completa con **fondo blanco** para tomar captura y enviar.
- **Avance** — Se alimenta del **HTML/TXT de Looker** que sube un admin. Muestra avance del mes por área
  y departamento, **meta**, **meta diaria** y **falta**, más la venta por asesor.
- **Config** — Apariencia (claro/oscuro y colores), y para **administradores**: mes comercial, metas,
  usuarios, subir avances, clave de Gemini y Firebase.

## Cuentas y roles

- Registro con **nombre, apellido, número de vendedor y clave (repetida)**. Se inicia sesión con **usuario = `nombre.apellido`**.
- Al registrarse, la cuenta queda **pendiente**; un **administrador** la aprueba en Config → Usuarios.
- El **primer usuario** que se registra queda como **administrador** automáticamente.
- Un admin designa a otros administradores. (Respaldo: en Config, un usuario puede volverse admin con la clave `connect2025`.)

## Probar ya (modo local)

Abre `index.html`. El primer registro será admin. Los datos quedan **solo en ese dispositivo** hasta conectar Firebase.

## Conectar Firebase (multiusuario en línea)

1. Crea un proyecto en <https://console.firebase.google.com>.
2. **Authentication → Sign-in method →** habilita **Correo/contraseña**.
3. **Firestore Database →** crear (producción) → pestaña **Reglas** → pega `firestore.rules` → Publicar.
4. *(Opcional, fotos de boleta)* **Storage →** crear → pega `storage.rules` → Publicar.
5. **⚙️ Configuración del proyecto → Tus apps → Web `</>`** → copia el objeto `firebaseConfig`.
6. **Déjalo fijo (recomendado):** pega esos valores en la constante **`FIREBASE_CONFIG`** al inicio de
   `index.html` y sube el cambio al repo. Así queda en línea siempre, sin pegar nada en la UI.
   *(Alternativa: pegar el JSON en Config → Firebase, solo para tu dispositivo.)*
7. **Authentication → Settings → Dominios autorizados:** agrega el dominio donde lo publiques
   (ej. `tuusuario.github.io`).

## Leer boletas con IA (Gemini)

Config → *Extracción de boletas* → pega una API key gratis de <https://aistudio.google.com/apikey>.
Al sacar/subir la boleta, la IA extrae vendedor, código, producto, monto y sugiere área/departamento;
**siempre** muestra un formulario para verificar/editar antes de registrar.

## Publicar

- **GitHub Pages:** Settings → Pages → Deploy from branch → `main` (raíz).
- **Firebase Hosting:** `firebase init hosting` + `firebase deploy`.

## Archivos

`index.html` (app), `manifest.json`, `sw.js`, `icon-180.png`, `icon-512.png`,
`firestore.rules`, `storage.rules`.
