# Changelog

Todas las versiones notables de KINETIXFITT.

## [Unreleased] - 2026-09-28

### Mejorado
- Alineación de branding móvil y compartido con el token semántico emerald `#34D399` ya definido por el design system.
- Navegación, landing, botones, badges y estados de carga/error migrados desde acentos hardcodeados a tokens semánticos.
- Soporte de WhatsApp convertido en configuración opcional mediante `NEXT_PUBLIC_WHATSAPP_NUMBER`; sin número configurado no se muestra ningún enlace de WhatsApp inválido.

### Corregido
- Eliminadas acciones sin comportamiento de Recursos VIP ("Ver" y "Guardar") que aparentaban estar implementadas.
- El contador de recursos ahora refleja el catálogo realmente visible en pantalla en lugar de una cifra fija.
- Añadido `rel="noreferrer"` y nombre accesible al enlace de WhatsApp.

### Validación
- Auditoría `npm run ai:audit` ejecutada en remoto: OK.
- Instalación reproducible `npm ci` ejecutada en remoto: OK.
- La validación de CI/Vercel queda pendiente sobre el PR #82; la conexión Vercel disponible actualmente no expone los proyectos para inspeccionar sus logs.

