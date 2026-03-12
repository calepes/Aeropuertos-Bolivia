# CLAUDE.md

## Descripción del Proyecto

**widget-vuelos-bolivia** es un widget para iOS que muestra salidas de vuelos en tiempo real desde aeropuertos bolivianos, construido para la app [Scriptable](https://scriptable.app/). Obtiene datos en vivo de las APIs de NAABOL (operador aeroportuario boliviano) y renderiza un tablero compacto de salidas.

Una funcionalidad secundaria proporciona tasas de cambio USD/BOB mediante una función serverless de Cloudflare.

## Estructura del Repositorio

```
widget-vuelos-bolivia/
├── widget-vuelos-naabol.js   # Script principal del widget (API de Scriptable)
├── loader-scriptable.js      # Cargador con auto-actualización y caché en iCloud
├── index.html                # Página HTML simple para mostrar tipo de cambio
├── functions/
│   └── exchange.js           # Función de Cloudflare para tasas USD/BOB
└── README.md                 # Documentación para usuarios (en español)
```

## Stack Tecnológico

- **Runtime**: App Scriptable (iOS) — no es Node.js
- **Lenguaje**: JavaScript (ES6+), usando APIs globales de Scriptable (`ListWidget`, `Request`, `FileManager`, etc.)
- **Serverless**: Cloudflare Functions (`functions/exchange.js`)
- **Sin proceso de build** — scripts de archivo único desplegados directamente vía GitHub

## Arquitectura Principal

### Widget (`widget-vuelos-naabol.js`)

1. Obtiene datos de vuelos de dos endpoints de NAABOL (Itinerario + Operativo)
2. Fusiona información programada y real por código de aerolínea + número de vuelo
3. Filtra a una ventana de 12 horas, máximo 10 vuelos (`HOURS_AHEAD`, `MAX_FLIGHTS`)
4. Renderiza una tabla de 5 columnas: PROG | REAL | VUELO | EST | DST

**Parametrizado por código de aeropuerto** vía `args.widgetParameter` (por defecto: `VVI`). Aeropuertos soportados: VVI, LPB, CBB, TJA, SRE, ORU, UYU, CIJ, RIB, RBQ, TDD, GYA.

### Cargador (`loader-scriptable.js`)

Descarga automáticamente la última versión del widget desde la API de GitHub, guarda caché local en iCloud para uso sin conexión y lo evalúa dinámicamente.

### Tipo de Cambio (`functions/exchange.js`)

Endpoint serverless que retorna tasas de compra/venta de USD desde dolarboliviahoy.com. Caché: 300s.

## Convenciones de Código

- **Constantes**: `SCREAMING_SNAKE_CASE` (`HOURS_AHEAD`, `MAX_FLIGHTS`, `AIRPORT_PARAM`)
- **Funciones/variables**: `camelCase`
- **Texto de UI/docs**: Español; identificadores de código: Inglés
- **Procesamiento de datos**: Cadenas de `map`/`filter` en arrays, retornos tempranos para datos inválidos
- **Manejo de errores**: Fallos silenciosos en errores de API (retorna `[]`), valores por defecto con `||`
- **Colores**: `Color.dynamic()` para soporte de modo claro/oscuro, valores hex con mapeos RGB

## Códigos de Estado de Vuelos

| Código | Significado    | Color           |
|--------|----------------|-----------------|
| PRE    | Pre-embarque   | Azul            |
| EMB    | Embarcando     | Verde           |
| DEM    | Demorado       | Texto rojo      |
| CAN    | Cancelado      | Fondo rojo      |
| OK     | Normal         | Por defecto     |

Los estados activos (PRE/EMB/DEM) se muestran siempre, incluso pasada la hora programada.

## Notas de Desarrollo

- **Sin package.json, sin dependencias npm, sin bundler** — scripts independientes para Scriptable
- **Sin framework de testing** — pruebas manuales en la app Scriptable
- **Despliegue**: Push a la rama `main`; el cargador descarga actualizaciones automáticamente desde GitHub
- Los widgets de Scriptable son stateless — cada ejecución obtiene datos frescos
- Los vuelos que cruzan medianoche se manejan con corrección de fecha al día siguiente

## Funciones Clave en `widget-vuelos-naabol.js`

| Función | Propósito |
|---------|-----------|
| `normalizeHHMM(x)` | Parsea cadenas de tiempo al formato HH:MM |
| `todayWithHHMM(x)` | Convierte tiempo a Date, manejando vuelos del día siguiente |
| `airlineCode(name)` | Mapea nombres de aerolíneas a códigos IATA |
| `destinationIATA(route)` | Extrae el primer destino de una ruta |
| `statusInfo(obs)` | Normaliza el texto de estado del vuelo |
| `load(url)` | Obtiene JSON con manejo de errores |

## Al Modificar Este Código

- La API de Scriptable **no** es la del navegador ni Node.js — no usar `document`, `window`, `require` ni `module.exports` en los archivos del widget
- Probar cambios en la app Scriptable en iOS; no existe un emulador local
- Mantener el script del widget autocontenido (un solo archivo, sin imports)
- Respetar el diseño denso de la tabla — el espacio en pantalla es extremadamente limitado en widgets de iOS
- Los diccionarios de aeropuertos/aerolíneas están inline; agregar nuevas entradas directamente en los objetos
