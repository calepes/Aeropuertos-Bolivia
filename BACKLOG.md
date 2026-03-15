# Backlog

## Pendiente

### Mostrar puerta/gate de embarque en la PWA
- La página de naabol.gob.bo muestra la puerta de embarque, pero no sabemos de qué endpoint la obtiene.
- Nuestros endpoints actuales (`/Fids/itin/vuelos` y `/Fids/operativo/vuelos`) no parecen incluir ese campo, o lo incluyen y no lo estamos extrayendo.
- **TODO:** Inspeccionar el network de naabol.gob.bo para identificar el endpoint o campo que trae la puerta (posibles nombres: `PUERTA`, `GATE`, `SALA`). Una vez identificado, agregarlo a la PWA y al widget.
