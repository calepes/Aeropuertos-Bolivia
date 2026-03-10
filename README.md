# NAABOL – Widget de Salidas de Vuelos (Scriptable)

## Documento de Funcionamiento

---

## Instalación Rápida

### Opción 1: Loader automático (recomendado)

1. Descargar e instalar [Scriptable](https://apps.apple.com/app/scriptable/id1405459188) en iOS
2. Copiar el contenido de [`loader-scriptable.js`](./loader-scriptable.js) en un nuevo script
3. Agregar un widget Scriptable a la pantalla de inicio
4. Configurar el widget para usar el script creado
5. (Opcional) En "Widget Parameter" escribir el código del aeropuerto (ej: `LPB`)

El loader descarga automáticamente la última versión del widget desde GitHub cada vez que se ejecuta, y mantiene una copia en cache local (iCloud) para funcionar sin conexión.

### Opción 2: Copia manual

1. Copiar el contenido de [`widget-vuelos-naabol.js`](./widget-vuelos-naabol.js) en un nuevo script de Scriptable
2. Agregar un widget Scriptable a la pantalla de inicio
3. Configurar el widget para usar el script creado
4. (Opcional) En "Widget Parameter" escribir el código del aeropuerto (ej: `LPB`)

> **Nota:** Con esta opción deberás actualizar el código manualmente cada vez que haya cambios.

---

## 1. Propósito

Este widget muestra las salidas de vuelos en tiempo casi real desde aeropuertos administrados por NAABOL (Bolivia), utilizando la app Scriptable en iOS.

El objetivo es tener una vista:
- **Compacta**
- **Legible**
- **Confiable**
- **Parametrizable por aeropuerto**

Para uso operativo o personal.

---

## 2. Plataforma

| Característica | Valor |
|----------------|-------|
| Sistema operativo | iOS |
| Aplicación | Scriptable |
| Tipo | Widget (Small / Medium recomendado) |
| Lenguaje | JavaScript (Scriptable API) |

---

## 3. Alcance Funcional

### El widget incluye:
- Muestra vuelos de **SALIDA**
- Cruza información de dos fuentes NAABOL:
  - **Itinerario** (hora programada)
  - **Operativo** (hora real y estado)
- Filtra vuelos en una ventana futura configurable
- Normaliza aerolíneas, destinos y estados
- Renderiza una tabla ultra densa optimizada para widgets

### No incluye:
- Llegadas
- Scroll
- Interacción táctil

> **Cache:** El loader incluye cache local en iCloud para funcionar sin conexión.

---

## 4. Configuración del Widget

El script es **ÚNICO** para todos los aeropuertos.

El aeropuerto se define mediante:
```
args.widgetParameter
```

### Ejemplos:
- Sin parámetro → Viru Viru (VVI)
- Con parámetro `"LPB"` → El Alto (La Paz)

### Configuración en iOS:
1. Añadir widget Scriptable
2. Seleccionar el script
3. En "Widget Parameter" escribir el código del aeropuerto

---

## 5. Aeropuertos Soportados

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

## 6. Fuentes de Datos (NAABOL)

Se consumen dos endpoints oficiales:

### 1. ITINERARIO (base)
- Contiene hora programada y ruta

### 2. OPERATIVO (complemento)
- Contiene hora real y estado del vuelo

Ambos se consultan por aeropuerto y se cruzan internamente.

---

## 7. Lógica de Merge de Vuelos

- El **itinerario** define qué vuelos existen
- El **operativo** se indexa por: `Código de aerolínea + número de vuelo`
- Si hay coincidencia:
  - Se toma la hora real
  - Se toma el estado
- Si no hay coincidencia:
  - El vuelo sigue apareciendo con hora programada

> Esto evita perder vuelos cuando el operativo no está completo.

---

## 8. Ventana de Tiempo

El widget solo muestra vuelos que salen dentro de las próximas X horas.

| Parámetro | Valor |
|-----------|-------|
| Ventana futura | 12 horas |
| Máximo de vuelos mostrados | 10 |

> Esto mantiene el widget limpio y relevante.

---

## 9. Fix de Día Siguiente (CRÍTICO)

### Problema:
- NAABOL entrega horas sin fecha
- Vuelos después de medianoche se "pierden"

### Solución:
- Si la hora del vuelo es menor que la hora actual
- Se asume que el vuelo es del día siguiente

> Esto garantiza que vuelos nocturnos (00:00–03:00) se muestren correctamente.

---

## 10. Estados de Vuelo

Los estados se normalizan a códigos cortos.

### Orden de evaluación (importante):

| Código | Significado |
|--------|-------------|
| PRE | Pre-embarque |
| EMB | Embarcando / Abordando |
| DEM | Demorado |
| CAN | Cancelado |
| OK | Normal / Sin observación |

### Reglas visuales:
- Si el vuelo está **cancelado**, toda la fila se pinta de rojo
- **PRE** siempre tiene prioridad sobre EMB (evita errores de interpretación)

---

## 11. Aerolíneas – Manejo de Casos Especiales

NAABOL no siempre entrega códigos IATA estándar.

Para evitar vuelos incompletos (—), el script usa:
- Diccionario principal de aerolíneas IATA
- Diccionario de respaldo (fallback) para aerolíneas no estándar

### Ejemplos manejados:
- BOA
- LATAM
- Copa Airlines
- Paraná Air
- Air Europa
- Minera
- Avianca
- Sky
- Flybondi

> Si una aerolínea no se reconoce, se intenta inferir. Último recurso: mostrar "–"

---

## 12. Destinos – Normalización y Compactación

NAABOL puede entregar rutas con múltiples tramos.

### Ejemplo:
```
SANTA CRUZ - ASUNCION - MIAMI
```

### Regla aplicada:
- Se toma **SOLO** el primer destino
- Se cuenta cuántos destinos adicionales existen

### Resultado mostrado:
```
VVI (2)
```

> Esto mantiene el widget legible sin perder información relevante.

---

## 13. Diseño del Widget

### Columnas mostradas:

| Columna | Descripción |
|---------|-------------|
| PROG | Hora programada |
| REAL | Hora real |
| VUELO | Aerolínea + número |
| EST | Estado |
| DST | Destino (compactado) |

### Características visuales:
- Diseño ultra denso
- Zebra rows
- Encabezados centrados
- Fuentes monoespaciadas para horas y vuelos
- Sin íconos innecesarios
- Optimizado para lectura rápida

---

## 14. Limitaciones Técnicas

Por limitaciones de Scriptable:
- No se puede tachar texto
- No hay scroll
- No hay interacción
- No hay tooltips

> El diseño prioriza estabilidad y claridad.

---

## 15. Estado del Proyecto

**Estado actual: ESTABLE / PRODUCCIÓN**

- Usado en múltiples aeropuertos
- Probado con vuelos nacionales e internacionales
- Maneja inconsistencias reales de NAABOL

---

## 16. Posibles Mejoras Futuras

- [ ] Llegadas de vuelos
- [ ] Toggle salidas / llegadas
- [ ] Vista extendida para iPad
- [ ] Agrupación por destino
- [ ] Métricas operativas (demoras, cancelaciones)

---

## Licencia

Este proyecto está destinado para uso personal y operativo con datos públicos de NAABOL.
