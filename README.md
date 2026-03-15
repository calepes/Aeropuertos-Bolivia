# Aeropuertos Bolivia

Aplicaciones para consultar salidas de vuelos desde aeropuertos NAABOL (Bolivia).

## Apps

### PWA — Tablero de salidas

Web app estilo split-flap board, accesible desde cualquier navegador móvil.

- **URL:** https://apps.lepesqueur.net/Aeropuertos-Bolivia/pwa/
- Selector de 12 aeropuertos bolivianos
- Actualización automática cada 5 minutos
- Instalable como app en iOS (Add to Home Screen)

### Widget iOS — Scriptable

Widget de pantalla de inicio para iOS usando [Scriptable](https://apps.apple.com/app/scriptable/id1405459188).

#### Instalación rápida

1. Instalar [Scriptable](https://apps.apple.com/app/scriptable/id1405459188)
2. Copiar [`widget/loader-scriptable.js`](./widget/loader-scriptable.js) en un nuevo script
3. Agregar widget Scriptable a la pantalla de inicio
4. (Opcional) En "Widget Parameter" escribir el código del aeropuerto (ej: `LPB`)

El loader descarga la última versión desde GitHub y mantiene cache local en iCloud.

## Aeropuertos soportados

| Código | Aeropuerto |
|--------|------------|
| VVI | Viru Viru (Santa Cruz) — default |
| LPB | El Alto (La Paz) |
| CBB | Jorge Wilstermann (Cochabamba) |
| TJA | Tarija |
| SRE | Sucre |
| ORU | Oruro |
| UYU | Uyuni |
| CIJ | Cobija |
| RIB | Riberalta |
| RBQ | Rurrenabaque |
| TDD | Trinidad |
| GYA | Guayaramerín |

## Fuente de datos

Endpoints públicos de [NAABOL](https://fids.naabol.gob.bo) (itinerario y operativo), accedidos via proxy CORS en Cloudflare Workers.

## Tests

```bash
cd widget && npm test
```

## Licencia

Uso personal y operativo con datos públicos de NAABOL.
