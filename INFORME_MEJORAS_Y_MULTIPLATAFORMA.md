# INFORME COMPLETO DE MEJORAS Y ESTADO MULTIPLATAFORMA

**Fecha:** 12 de septiembre de 2026  
**Proyecto:** KINETIXFITT v1.0.1  
**Autor:** Revisión Técnica Completa

---

## 📱 ESTADO MULTIPLATAFORMA

### ✅ IMPLEMENTADO Y FUNCIONAL

#### 1. **PWA (Progressive Web App)** — Android e iOS
- **Estado:** ✅ COMPLETO
- **Instalación:**
  - Android: Chrome → Menú → "Instalar aplicación"
  - iOS/iPadOS: Safari → Compartir → "Agregar a pantalla de inicio"
- **Características:**
  - Manifest.json completo con iconos 192x512px + SVG
  - Service Worker (sw.js) con caché offline para rutas core
  - Caché de audio del narrador de voz (67 archivos)
  - Background Sync preparado (Granite offline)
  - Display standalone, orientación portrait
  - Shortcuts a Entrenar/Progreso/Mensajes
  - Theme color #0A0F14, launch handler
- **Limitaciones iOS conocidas:**
  - Push notifications requieren iOS 16.4+
  - Background Sync limitado
  - Install prompt no nativo (usar Add to Home Screen)

#### 2. **Electron Desktop** — Windows y macOS
- **Estado:** ✅ CONFIGURADO (requiere build)
- **Ubicación:** `/electron/`
- **Scripts disponibles:**
  ```bash
  cd electron
  npm run dev              # Desarrollo (conecta a localhost:3001)
  npm run build:win        # Build Windows (NSIS installer x64)
  npm run build:mac        # Build macOS (DMG universal x64+arm64)
  npm run build:all        # Build ambas plataformas
  ```
- **Configuración:**
  - AppId: `com.kinetixfitt.desktop`
  - Electron 33.0.0 + electron-builder 25.0.0
  - Iconos nativos (icon-512.png)
  - NSIS installer con opción de directorio
  - DMG para macOS (categoría Healthcare & Fitness)
  - Soporte Apple Silicon (arm64) + Intel (x64)
- **Ventana:** 1280x800, sin frame, preload script para seguridad

### ❌ NO IMPLEMENTADO

#### 3. **Apps Nativas Móviles (iOS/Android nativos)**
- **Estado:** ❌ NO EXISTE
- **Tecnologías ausentes:**
  - ❌ React Native
  - ❌ Capacitor (Ionic)
  - ❌ Expo
  - ❌ Flutter
- **Recomendación:**
  - Si se requiere app nativa para stores (App Store/Play Store), usar **Capacitor 6**
  - Capacitor permite empaquetar la PWA Next.js existente sin reescribir
  - Acceso a APIs nativas (cámara, notificaciones push, HealthKit, Google Fit)
  - Instalación: `npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android`

#### 4. **Desktop shell**
La arquitectura activa mantiene Electron dentro de `apps/mobile` como shell de escritorio; no se mantiene un segundo proyecto Tauri.
- **Estado:** ❌ NO EXISTE
- **Ventaja:** Apps más livianas (Rust + WebView nativo)
- **Desventaja:** Requiere reconfiguración completa

---

## 🔧 MEJORAS NECESARIAS — MULTIPLATAFORMA

### A. PWA (Android/iOS/Desktop Web)

#### A1. **Push Notifications**
- **Estado:** Preparado pero no implementado
- **Falta:**
  - Backend: endpoint para suscripciones (Web Push API)
  - Permisos: solicitar permiso en onboarding o settings
  - Service Worker: handler para `push` event
  - Casos de uso: check-in pendiente, nuevo mensaje, inicio de sesión
- **Prioridad:** ALTA (retención de usuarios)

#### A2. **Offline First completo**
- **Estado:** Caché básica implementada
- **Falta:**
  - IndexedDB para almacenar workout logs offline (Granite-offline existe pero requiere integración)
  - Sincronización al reconectar (Background Sync ya configurado)
  - UI indicador de estado offline
  - Conflicto resolution (si el trainer modifica el programa mientras el cliente está offline)
- **Prioridad:** MEDIA

#### A3. **Instalación mejorada**
- **Estado:** Funcional pero básica
- **Falta:**
  - Prompt de instalación personalizado (before-install-prompt)
  - Onboarding post-instalación explicando ventajas
  - Badge en icono para actualizaciones disponibles
- **Prioridad:** BAJA

#### A4. **Shortcuts dinámicos**
- **Estado:** 3 shortcuts estáticos
- **Falta:**
  - Shortcuts dinámicos según uso (programa activo, último check-in)
  - Android: App Shortcuts API
- **Prioridad:** BAJA

### B. Electron Desktop (Windows/macOS)

#### B1. **Build automatizado**
- **Estado:** Scripts configurados, no testeados
- **Falta:**
  - CI/CD para builds automáticos (GitHub Actions)
  - Code signing para macOS (requiere Apple Developer cert)
  - Code signing para Windows (requiere certificado EV)
  - Auto-updater (electron-updater)
- **Prioridad:** MEDIA (si se distribuye desktop)

#### B2. **Deep linking**
- **Estado:** No configurado
- **Falta:**
  - Protocolo `ezequielcoaching://` para abrir desde navegador
  - Handler de URLs en main.js
- **Prioridad:** BAJA

#### B3. **Notificaciones nativas**
- **Estado:** No implementado
- **Falta:**
  - Electron Notification API para avisos de sistema
  - Badge count en dock/taskbar
- **Prioridad:** MEDIA

#### B4. **Menú nativo**
- **Estado:** No configurado
- **Falta:**
  - Menu.buildFromTemplate en main.js
  - Shortcuts de teclado (Cmd/Ctrl+N para nuevo mensaje)
  - About dialog con versión
- **Prioridad:** BAJA

### C. Apps Nativas (si se implementa Capacitor)

#### C1. **Capacitor Setup** (RECOMENDADO)
```bash
# Instalación
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
npx cap init "KINETIXFITT" "com.kinetixfitt.app"

# Configurar
npx cap add ios
npx cap add android
npx cap sync

# Build y abrir IDE nativa
npm run build && npx cap copy
npx cap open ios    # Xcode
npx cap open android # Android Studio
```

#### C2. **Plugins Capacitor recomendados**
- `@capacitor/push-notifications` — Push nativas
- `@capacitor/camera` — Fotos de check-in/progreso
- `@capacitor/haptics` — Vibración (ya usada en web)
- `@capacitor/status-bar` — Control de status bar
- `@capacitor/splash-screen` — Splash nativa
- `@capacitor-community/health` — HealthKit (iOS) / Google Fit (Android)
- `@capacitor/filesystem` — Guardar exports CSV/PDF offline

#### C3. **Consideraciones para apps nativas**
- **SQLite:** Cambiar a `@capacitor-community/sqlite` (Prisma no funciona en nativo)
- **API:** Toda la lógica de DB debe ir a API routes (ya está así ✅)
- **Auth:** Tokens ya en httpOnly cookies, funciona (verificar en WebView)
- **Uploads:** Usar Capacitor Camera + Filesystem en lugar de input[type=file]
- **Video:** react-player puede no funcionar, usar `<video>` nativo
- **Audio:** Narrador de voz funciona, testear en iOS (puede requerir user interaction)

---

## 🚀 MEJORAS FUNCIONALES (independiente de plataforma)

### 1. **Reorganización de la App** (según APP_REORGANIZATION_PLAN.md)
- **Estado:** PLANIFICADO, NO EJECUTADO
- **Prioridad:** ALTA
- **Tareas pendientes:**
  - Crear `/client/tools` con hub de herramientas
  - Crear `/trainer/studio` con herramientas avanzadas
  - Recortar dashboard cliente (19→8 componentes)
  - Recortar dashboard trainer (20→6 componentes)
  - Eliminar duplicados (timers, achievements, revenue)
  - Agrupar sidebar trainer por categorías

### 2. **Notificaciones Digest para Trainer**
- **Estado:** NO IMPLEMENTADO
- **Descripción:** Email/Push diario con check-ins sin revisar >24h
- **Prioridad:** ALTA (retención de clientes)

### 3. **Sistema de Favoritos en Tools**
- **Estado:** NO IMPLEMENTADO
- **Descripción:** Permitir al usuario marcar herramientas favoritas (localStorage)
- **Prioridad:** MEDIA

### 4. **Headers colapsables en Progreso**
- **Estado:** NO IMPLEMENTADO
- **Descripción:** Secciones (Peso, Cargas, Medidas) colapsables para reducir scroll
- **Prioridad:** MEDIA

### 5. **Modo Sesión Enfocada**
- **Estado:** gym-mode existe, no integrado
- **Descripción:** Fullscreen sin distracciones durante entrenamiento
- **Prioridad:** MEDIA

### 6. **Resumen semanal autogenerado**
- **Estado:** EXPERIMENTAL, NO IMPLEMENTADO
- **Descripción:** PDF/imagen con stats de la semana para compartir
- **Prioridad:** BAJA

### 7. **Integración con Wearables**
- **Estado:** UI existe (openscale-sync), backend NO
- **Falta:**
  - Bluetooth Web API para báscula
  - HealthKit/Google Fit sync (requiere Capacitor)
  - Import automático de steps/sleep
- **Prioridad:** MEDIA

### 8. **Export Center**
- **Estado:** Componente existe, funcionalidad parcial
- **Falta:**
  - CSV real de progreso (peso, cargas, medidas)
  - PDF profesional con charts
  - Compartir en redes sociales
- **Prioridad:** MEDIA

### 9. **Import desde Hevy/Strong**
- **Estado:** Componente hevy-import-pro existe, NO FUNCIONAL
- **Falta:**
  - Parser de CSV de Hevy
  - Mapeo de ejercicios a biblioteca local
  - Validación y preview antes de importar
- **Prioridad:** BAJA

### 10. **IA Coach mejorado**
- **Estado:** Componente existe, respuestas básicas
- **Falta:**
  - Integración con OpenAI/Claude API
  - Context awareness (programa actual, progreso)
  - Sugerencias de ajustes automáticos
- **Prioridad:** BAJA (costo API)

---

## 🔒 SEGURIDAD Y PERFORMANCE

### Seguridad ✅
- JWT httpOnly ✅
- RLS por userId ✅
- Zod en forms ✅
- Middleware por rol ✅
- Fotos privadas ✅
- No eval, no any ✅

### Falta:
- ❌ Rate limiting (DDoS protection)
- ❌ CSRF tokens (las cookies httpOnly ayudan pero no son suficiente)
- ❌ Helmet.js headers (CSP, X-Frame-Options)
- ❌ Input sanitization (XSS en mensajes/nombres)
- ❌ File upload validation (tipo, tamaño máx en backend)
- ❌ SQL injection review (Prisma protege, pero revisar raw queries)

### Performance ✅
- Build 102kB ✅
- Promise.all ✅
- Debounce en búsqueda ✅
- Índices DB ✅
- Paginación ✅

### Falta:
- ❌ Image optimization (next/image en fotos de progreso)
- ❌ Lazy loading de componentes pesados (Recharts, video-player)
- ❌ CDN para assets estáticos
- ❌ Database connection pooling (Prisma default OK, revisar en prod)
- ❌ Redis/cache para queries repetitivas (clientes, programas)

---

## 🧪 TESTING

### Existente:
- `test:stats` — Stats calculations ✅
- `test:voice` — Voice engine ✅
- `test:core` — Program edit regression ✅

### Falta:
- ❌ E2E tests (Playwright/Cypress)
- ❌ Integration tests (API routes)
- ❌ Unit tests de componentes (Vitest + Testing Library)
- ❌ Visual regression tests (Percy/Chromatic)
- ❌ Load testing (k6)
- ❌ A11y testing (axe-core)

---

## 📱 COMPATIBILIDAD DE FEATURES POR PLATAFORMA

| Feature | Web Desktop | PWA Android | PWA iOS | Electron Win/Mac | Nativa (Capacitor) |
|---------|-------------|-------------|---------|------------------|--------------------|
| Auth JWT | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Entrenar | ✅ | ✅ | ✅ | ✅ | ✅ |
| Timer + Audio | ✅ | ✅ | ⚠️ (requiere tap) | ✅ | ✅ |
| Vibración | ❌ | ✅ | ✅ | ❌ | ✅ |
| Fotos upload | ✅ | ✅ | ✅ | ✅ | ✅ (mejor con plugin) |
| Offline cache | ⚠️ (limitado) | ✅ | ⚠️ (50MB límite) | ✅ | ✅ |
| Push notifications | ❌ | ⚠️ (no impl) | ⚠️ (iOS 16.4+) | ⚠️ (no impl) | ✅ (nativo) |
| Background sync | ❌ | ⚠️ (limitado) | ❌ | ✅ | ✅ |
| HealthKit/Fit | ❌ | ❌ | ❌ | ❌ | ✅ |
| BT Báscula | ⚠️ (Web BT) | ⚠️ (Web BT) | ❌ | ⚠️ (Web BT) | ✅ (plugin) |
| Share nativo | ⚠️ (Web Share) | ✅ | ✅ | ❌ | ✅ |
| File System | ❌ | ⚠️ (limitado) | ⚠️ (limitado) | ✅ | ✅ |
| Deep linking | ❌ | ⚠️ (no impl) | ⚠️ (no impl) | ⚠️ (no impl) | ✅ |

**Leyenda:**
- ✅ Funciona completamente
- ⚠️ Funciona con limitaciones o requiere implementación adicional
- ❌ No funciona o no soportado

---

## 🎯 PRIORIDADES RECOMENDADAS

### CRÍTICO (Sprint 1 — 1-2 semanas)
1. ✅ Electron: Testear builds Win/Mac, documentar proceso
2. ✅ PWA: Testear instalación Android/iOS, documentar en README
3. ✅ Push Notifications: Implementar backend + SW handler
4. ✅ Reorganización App: Ejecutar Lote R1 del plan

### ALTA (Sprint 2 — 2-3 semanas)
5. ✅ Rate limiting + seguridad adicional (CSRF, sanitización)
6. ✅ Notificaciones digest trainer
7. ✅ Offline first completo (IndexedDB + sync)
8. ✅ Image optimization (next/image)

### MEDIA (Backlog Q1)
9. ⚠️ Capacitor setup para apps nativas (si se requiere stores)
10. ⚠️ Integración wearables (HealthKit/Fit)
11. ⚠️ Export Center funcional (CSV/PDF)
12. ⚠️ Testing suite (E2E + integration)

### BAJA (Backlog Q2)
13. ⏳ IA Coach con API real
14. ⏳ Import Hevy/Strong
15. ⏳ Deep linking + shortcuts dinámicos
16. ⏳ Auto-updater Electron

---

## 📋 CHECKLIST DE VERIFICACIÓN MULTIPLATAFORMA

### Windows
- [ ] Electron build funciona (NSIS installer)
- [ ] PWA instalable en Edge/Chrome
- [ ] Auth persiste tras cerrar navegador
- [ ] Audio del narrador funciona
- [ ] Upload de fotos funciona
- [ ] Dark theme se aplica correctamente

### macOS
- [ ] Electron build funciona (DMG, x64 + arm64)
- [ ] PWA instalable en Safari/Chrome
- [ ] Todas las features de Windows
- [ ] Keyboard shortcuts nativos (Cmd)
- [ ] Dock badge/menu

### Android
- [ ] PWA instalable desde Chrome
- [ ] Pantalla de splash se muestra
- [ ] Audio funciona sin tap previo (autoplay)
- [ ] Vibración funciona
- [ ] Cámara para fotos de check-in
- [ ] Notificaciones push (cuando se implemente)
- [ ] Offline cache funciona
- [ ] App shortcuts en launcher
- [ ] Status bar con theme color
- [ ] Navegación back button

### iOS/iPadOS
- [ ] PWA instalable desde Safari
- [ ] Pantalla de splash se muestra
- [ ] Audio funciona (requiere tap inicial)
- [ ] Vibración funciona (Haptic Engine)
- [ ] Cámara para fotos
- [ ] Notificaciones push (iOS 16.4+)
- [ ] Offline cache funciona (50MB límite)
- [ ] Safe area respetada (notch/Dynamic Island)
- [ ] Landscape en iPad
- [ ] No zoom en inputs (font-size 16px+)

---

## 🛠️ COMANDOS ÚTILES

### Desarrollo
```bash
npm run dev                    # Next.js dev server (puerto 3001)
cd electron && npm run dev     # Electron dev (conecta a :3001)
```

### Testing
```bash
npm run test                   # All tests
npm run test:stats             # Stats calculation tests
npm run test:core              # Program edit regression
npm run lint                   # ESLint
npx tsc --noEmit              # TypeScript check
```

### Build
```bash
npm run build                  # Next.js production build
npm start                      # Servidor producción (:3001)

# Electron
cd electron
npm run build:win              # Windows installer
npm run build:mac              # macOS DMG
npm run build:all              # Ambas plataformas
```

### Database
```bash
npm run db:generate            # Regenerar Prisma Client
npm run db:migrate             # Ejecutar migraciones
npm run db:seed                # Seed con datos demo
```

### PWA
```bash
# Testear service worker
# 1. npm run build && npm start
# 2. Abrir DevTools → Application → Service Workers
# 3. Verificar "kinetixfitt-v3-voz" activo
# 4. Network → Offline → recargar → debe funcionar
```

### Capacitor (si se instala)
```bash
npx cap init "KINETIXFITT" "com.kinetixfitt.app"
npx cap add ios
npx cap add android
npm run build && npx cap copy && npx cap sync
npx cap open ios               # Xcode
npx cap open android           # Android Studio
```

---

## 📞 SOPORTE Y CONTACTO

- **Repo:** (agregar URL del repo)
- **Docs:** `/docs`
- **Issues:** (agregar URL de issues)
- **Changelog:** `CHANGELOG.md`
- **Plan Reorganización:** `APP_REORGANIZATION_PLAN.md`

---

**Generado:** 12 sept 2026  
**Versión del informe:** 1.0  
**Próxima revisión:** Post Lote R1 (reorganización)
