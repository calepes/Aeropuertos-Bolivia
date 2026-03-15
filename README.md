# Aeropuertos Bolivia

Aplicaciones para consultar información de aeropuertos administrados por NAABOL (Bolivia).

## Estructura

```
widget/    — Widget de salidas de vuelos para iOS (Scriptable)
pwa/       — Progressive Web App (por construir)
```

---

## Widget de Salidas de Vuelos (Scriptable)

### Instalación Rápida

#### Opción 1: Loader automático (recomendado)

1. Descargar e instalar [Scriptable](https://apps.apple.com/app/scriptable/id1405459188) en iOS
2. Copiar el contenido de [`widget/loader-scriptable.js`](./widget/loader-scriptable.js) en un nuevo script
3. Agregar un widget Scriptable a la pantalla de inicio
4. Configurar el widget para usar el script creado
5. (Opcional) En "Widget Parameter" escribir el código del aeropuerto (ej: `LPB`)

El loader descarga automáticamente la última versión del widget desde GitHub (via `raw.githubusercontent.com`) cada vez que se ejecuta, y mantiene una copia en cache local (iCloud) para funcionar sin conexión.

#### Opción 2: Copia manual

1. Copiar el contenido de [`widget/widget-vuelos-naabol.js`](./widget/widget-vuelos-naabol.js) en un nuevo script de Scriptable
2. Agregar un widget Scriptable a la pantalla de inicio
3. Configurar el widget para usar el script creado
4. (Opcional) En "Widget Parameter" escribir el código del aeropuerto (ej: `LPB`)

> **Nota:** Con esta opción deberás actualizar el código manualmente cada vez que haya cambios.

---

### Propósito

Widget que muestra las salidas de vuelos en tiempo casi real desde aeropuertos NAABOL, utilizando Scriptable en iOS.

Vista compacta, legible, confiable y parametrizable por aeropuerto.

---

### Configuración

El aeropuerto se define mediante `args.widgetParameter`:
- Sin parámetro → Viru Viru (VVI)
- Con parámetro `"LPB"` → El Alto (La Paz)

---

### Aeropuertos Soportados

| Código | Aeropuerto |
|--------|------------|
| VVI | Viru Viru (Santa Cruz) |
| LPB | El Alto (La Paz) |
| CBB | Cochabamba |
| TJA | Tarija |
| SRE | Sucre |
| ORU | Oruro |
| UYU | Uyuni |
| CIJ | Cobija |
| RIB | Riberalta |
| RBQ | Rurrenabaque |
| TDD | Trinidad |
| GYA | Guayaramerín |

> Si se pasa un código no reconocido, el widget usa **VVI** por defecto.

---

### Fuentes de Datos

Se consumen dos endpoints oficiales de NAABOL:
1. **Itinerario** — hora programada y ruta
2. **Operativo** — hora real y estado del vuelo

Ambos se cruzan internamente por código de aerolínea + número de vuelo.

---

### Diseño Visual

Estilo split-flap board (tablero de aeropuerto clásico):
- Fondo negro con cards oscuras por carácter
- Fuentes monoespaciadas bold
- Icono SF Symbol `airplane.departure` en el header

| Columna | Chars | Descripción |
|---------|-------|-------------|
| TIME | 5 | HH:MM — naranja si actualizada, amarillo si programada |
| DST | 4 | Destino IATA + `+` si tiene escalas |
| FLIGHT | 6 | Aerolínea + número de vuelo |
| RMKS | 3 | Estado (OK, PRE, EMB, DEM, CAN) |

---

### Tests

```bash
cd widget
npm install
npm test
```

Tests de helpers (funciones puras).

---

### Limitaciones

- Solo salidas (no llegadas)
- Sin scroll ni interacción (limitación de Scriptable)
- Máximo 13 vuelos mostrados

---

## PWA

Por construir.

---

## Licencia

Uso personal y operativo con datos públicos de NAABOL.
