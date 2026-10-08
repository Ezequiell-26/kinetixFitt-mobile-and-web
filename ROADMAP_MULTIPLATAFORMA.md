# ROADMAP MULTIPLATAFORMA — KINETIXFITT

## 🎯 Estado Actual (Sept 2026)

| Plataforma | Estado | Distribución | Prioridad |
|------------|--------|--------------|-----------|
| **Web Desktop** | ✅ Producción | Web browser | P0 — Core |
| **PWA Mobile** | ✅ Producción | Web install | P0 — Core |
| **PWA Desktop** | ✅ Producción | Web install | P1 — Alta |
| **Electron Win** | 🟡 Configurado | Descarga directa | P2 — Media |
| **Electron Mac** | 🟡 Configurado | Descarga directa | P2 — Media |
| **iOS Nativo** | ❌ No existe | App Store | P3 — Baja* |
| **Android Nativo** | ❌ No existe | Play Store | P3 — Baja* |

\* *Baja prioridad porque PWA cubre el 90% de casos de uso*

---

## 📅 FASE 1: Consolidación PWA (Sprint 1-2 — 2 semanas)

**Objetivo:** Asegurar que PWA sea la experiencia principal bulletproof

### ✅ Ya completado
- [x] Manifest.json con iconos 192/512/SVG
- [x] Service Worker con cache offline
- [x] Instalable en Android/iOS/Desktop
- [x] Shortcuts a rutas principales
- [x] Theme color y status bar

### 🚧 Pendiente Sprint 1
- [ ] **Push Notifications backend**
  - Endpoint `/api/push/subscribe` (guardar subscription en DB)
  - Endpoint `/api/push/send` (enviar notificaciones)
  - Trigger: check-in sin revisar >24h
  - Trigger: nuevo mensaje del trainer
  - Handler en `sw.js` para evento `push`
  - Permisos en onboarding o settings

- [ ] **Offline First completo**
  - IndexedDB wrapper para workout logs
  - Sync automático al reconectar
  - UI indicador de estado offline/online
  - Conflict resolution (last-write-wins para MVP)

- [ ] **Install prompt personalizado**
  - Interceptar `beforeinstallprompt`
  - Modal custom explicando beneficios
  - Botón "Instalar" en settings

- [ ] **Testing PWA**
  - Android: Chrome, Samsung Internet, Firefox
  - iOS: Safari, Chrome (PWA limited)
  - Desktop: Chrome, Edge, Brave
  - Lighthouse score >90 en todas las categorías

**Entregable:** PWA completamente funcional con push y offline

---

## 📅 FASE 2: Electron Desktop (Sprint 3 — 1 semana)

**Objetivo:** Apps de escritorio distribuibles para Windows y macOS

### 🚧 Pendiente Sprint 3
- [ ] **Testing builds**
  - Build Windows x64 en máquina Windows
  - Build macOS x64+arm64 en máquina Mac
  - Testear instalador NSIS (Windows)
  - Testear DMG (macOS)
  - Verificar auth persiste tras cerrar

- [ ] **Mejoras Electron**
  - Menú nativo (File, Edit, View, Help)
  - Keyboard shortcuts (Ctrl/Cmd+N, etc.)
  - About dialog con versión
  - Tray icon con menú rápido
  - Deep linking `ezequielcoaching://`
  - Notificaciones de sistema nativas
  - Badge count en dock/taskbar

- [ ] **Auto-updater**
  - electron-updater configurado
  - Servidor para releases (GitHub Releases)
  - Check al iniciar, notificar si hay update

- [ ] **Code signing**
  - Windows: Certificado EV (DigiCert, Sectigo)
  - macOS: Apple Developer ID
  - Notarización automática (macOS)

- [ ] **CI/CD**
  - GitHub Actions para builds automáticos
  - Matrix: windows-latest, macos-latest
  - Artifacts en Releases

**Entregable:** Instaladores firmados en GitHub Releases

---

## 📅 FASE 3: Evaluación Apps Nativas (Sprint 4 — 1 semana)

**Objetivo:** Decidir si vale la pena invertir en apps nativas

### 📊 Métricas para evaluar

Analizar durante 2 semanas antes de empezar:

| Métrica | Target | Fuente |
|---------|--------|--------|
| Instalaciones PWA | >100 | Google Analytics |
| Retención D7 PWA | >40% | Analytics |
| Bounce rate en móvil | <30% | Analytics |
| Problemas reportados iOS | <5 | GitHub Issues |
| Tiempo promedio de uso | >10min/sesión | Analytics |
| Requests de "app en store" | >20 | Support/Reddit |

### ✅ SI: Instalar apps nativas vale la pena si:
- ✅ >100 usuarios activos en móvil
- ✅ >20 requests explícitos de app nativa
- ✅ Necesidad de HealthKit/Google Fit (wearables)
- ✅ Presupuesto para mantener 3 codebases
- ✅ Plan de monetización que justifique IAP stores (30% comisión)

### ❌ NO: Seguir con PWA si:
- ❌ <100 usuarios activos
- ❌ PWA satisface necesidades (>80% satisfacción)
- ❌ Equipo pequeño (1-2 devs)
- ❌ No hay necesidad de APIs nativas específicas

### 🔄 Alternativa: PWA+ (mejora incremental)
Si NO se justifica nativo, mejorar PWA con:
- Web Bluetooth API para básculas/wearables
- Web Share API para compartir
- File System Access API para exports
- Payment Request API para pagos
- Screen Wake Lock para entrenamientos
- Web NFC para gym check-in (experimental)

**Entregable:** Documento de decisión (Go/No-go apps nativas)

---

## 📅 FASE 4: Capacitor Setup (Solo si aprobado — Sprint 5-6 — 2 semanas)

**Objetivo:** Apps nativas iOS/Android en stores

### 🚧 Sprint 5: Setup y desarrollo

- [ ] **Instalación Capacitor**
  ```bash
  npm install @capacitor/core @capacitor/cli
  npm install @capacitor/ios @capacitor/android
  npm install @capacitor/camera @capacitor/haptics @capacitor/push-notifications
  npm install @capacitor/status-bar @capacitor/splash-screen @capacitor/share
  npm install @capacitor-community/health # HealthKit/Fit
  ```

- [ ] **Configuración**
  - `capacitor.config.ts` con appId, iconos, splash
  - `next.config.mjs`: `output: 'export'`
  - Generar proyectos: `npx cap add ios && npx cap add android`
  - Permisos en Info.plist (iOS) y AndroidManifest.xml

- [ ] **Integración código**
  - Wrapper `/lib/capacitor.ts`
  - Reemplazar input file → Camera plugin
  - Reemplazar vibrate → Haptics plugin
  - Status bar control
  - Push notifications nativas
  - HealthKit/Google Fit sync (opcional)

- [ ] **Testing**
  - iOS Simulator
  - Android Emulator
  - iPhone físico (TestFlight)
  - Android físico (Internal Testing)

### 🚧 Sprint 6: Publicación

- [ ] **iOS App Store**
  - Crear app en App Store Connect
  - Screenshots (iPhone 6.7", iPad 12.9")
  - Descripción, keywords, categoría (Health & Fitness)
  - Privacy Policy URL
  - Beta: TestFlight (10-20 testers)
  - Submit for Review (~24-48h)
  - Precio: Free (IAP para planes)

- [ ] **Google Play Store**
  - Crear app en Play Console
  - Generar signed AAB con keystore
  - Screenshots (phone, tablet, 7")
  - Descripción, categoría (Health & Fitness)
  - Content rating (ESRB, PEGI)
  - Privacy Policy URL
  - Internal Testing → Closed Beta → Open Beta → Production
  - Submit for Review (~3-7 días)

- [ ] **Monetización**
  - Google Play Billing (Android)
  - StoreKit 2 (iOS)
  - Productos: basic_monthly, premium_monthly, vip_yearly
  - Verificación de recibos en backend

**Entregable:** Apps en App Store y Play Store

---

## 📅 FASE 5: Mantenimiento continuo (Ongoing)

### Tareas recurrentes

**Mensual:**
- [ ] Actualizar dependencias (npm outdated)
- [ ] Regenerar iconos si hay cambio de branding
- [ ] Revisar crashes en Sentry/Firebase
- [ ] Actualizar service worker cache version

**Trimestral:**
- [ ] Upgrade major versions (Next.js, Electron, Capacitor)
- [ ] Audit de seguridad (npm audit, Snyk)
- [ ] Performance review (Lighthouse, Core Web Vitals)
- [ ] A11y audit (axe-core, WAVE)

**Anual:**
- [ ] Renovar certificados (Apple Developer, Windows EV)
- [ ] Revisar Terms of Service de stores
- [ ] Review de analytics y decisión de features

---

## 🎯 KPIs por Plataforma

| Plataforma | KPI Principal | Target Q4 2026 | Target Q1 2027 |
|------------|---------------|----------------|----------------|
| Web Desktop | Usuarios activos | 200 | 500 |
| PWA Mobile | Instalaciones | 100 | 300 |
| Electron | Descargas | 50 | 150 |
| iOS App | Descargas | N/A* | 200 |
| Android App | Descargas | N/A* | 300 |

\* *Solo si se aprueba FASE 4*

---

## 💰 Costos estimados

| Concepto | Costo anual | Notas |
|----------|-------------|-------|
| **Hosting Web** | $0-100 | Vercel Free/Pro |
| **Apple Developer** | $99 | Si apps iOS/Mac |
| **Google Play Console** | $25 | Pago único |
| **Code Signing Windows** | $0-400 | Certificado EV opcional |
| **Push Notifications** | $0-50 | Firebase free tier OK |
| **Analytics** | $0 | GA4 free |
| **Sentry/Crashlytics** | $0-26 | Free tier suficiente |
| **Domain** | $15 | .com |
| **Total sin apps nativas** | **$15-150/año** | |
| **Total con apps nativas** | **$139-700/año** | |

---

## 🚀 Quick Wins (implementar YA)

Mejoras que toman <4 horas y dan gran impacto:

1. **PWA Install Banner** (2h)
   - Interceptar `beforeinstallprompt`
   - Mostrar modal custom con beneficios
   - Guardar en localStorage si ya se mostró

2. **Offline indicator** (1h)
   - Banner fijo arriba cuando offline
   - Deshabilitar botones de submit
   - Mostrar icono en nav

3. **Electron menú nativo** (2h)
   - File → Quit
   - Edit → Copy/Paste
   - View → Reload, DevTools
   - Help → About, Docs

4. **Status bar PWA iOS** (30min)
   - Meta tag `apple-mobile-web-app-status-bar-style`
   - Probar con `black-translucent`

5. **Share button** (1h)
   - Web Share API en progreso
   - Compartir stats semanales
   - Fallback a copy link

6. **Haptic feedback adicional** (1h)
   - Al completar serie
   - Al lograr PR
   - Al enviar check-in

7. **Loading skeletons** (3h)
   - Dashboard
   - Lista de clientes
   - Progreso charts
   - Mejor UX percibida

8. **Image optimization** (2h)
   - Reemplazar `<img>` por `<Image>` de Next.js
   - Lazy loading automático
   - WebP automático

---

## ❓ FAQs

### ¿Por qué no React Native?
React Native requiere reescribir toda la UI. Capacitor empaqueta la app Next.js existente sin cambios.

### ¿Por qué no Flutter?
Flutter requiere reescribir en Dart. Capacitor usa el código JavaScript/TypeScript existente.

### ¿PWA es suficiente?
Para mayoría de usuarios SÍ. Apps nativas solo si:
- Necesitas HealthKit/Google Fit
- Quieres distribución en stores
- Necesitas mejor rendimiento (raro)

### ¿Electron es pesado?
El shell desktop actual es Electron dentro de `apps/mobile`; Tauri no forma parte de la arquitectura activa.

### ¿Cuánto cuesta publicar en stores?
- Apple: $99/año
- Google: $25 una sola vez

### ¿Cuánto tiempo toma la revisión?
- Apple: 24-48h (promedio)
- Google: 3-7 días (promedio)

### ¿Necesito Mac para iOS?
Sí, Xcode solo corre en macOS. Alternativas:
- Mac mini (~$600)
- MacStadium/AWS Mac ($30-100/mes)
- MacinCloud ($20-50/mes)
- Usar servicio CI como Codemagic

---

## 📚 Recursos

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [Capacitor Setup Guide](./docs/CAPACITOR_SETUP_GUIDE.md)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policies](https://play.google.com/about/developer-content-policy/)

---

**Última actualización:** 12 sept 2026  
**Owner:** Equipo KinetixFitt  
**Próxima revisión:** 1 oct 2026
