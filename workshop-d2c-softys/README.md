# Workshop E-Commerce D2C Chile · Plataforma en línea

**Softys · Initiative · Infracommerce** — Mi Tienda Cotidian + Club Softys

Plataforma para guiar el workshop en vivo. Cada persona entra con su **PIN personal**, registra sus aportes y todo queda guardado en un servidor central. El **Resumen** se consolida en vivo para todos.

---

## 1. Qué incluye

| Archivo | Para qué sirve |
|---|---|
| `server.js` | Servidor liviano (Node.js 18+, **sin dependencias**). Guarda todo en `data/state.json` y hace respaldos cada 5 min. |
| `public/index.html` | La plataforma del workshop (agenda, bloques, Gantt 2027 y resumen). |
| `Dockerfile` | Opcional, para publicar con Docker. |
| `.env.example` | Variables de configuración. |

## 2. Roles y accesos

| Rol | Cómo entra | Qué registra |
|---|---|---|
| **Facilitador** | Código `ADMIN_CODE` | Configuración (mesas, líderes, PIN), votos, plan de acción, Gantt 2027 y acuerdos de coordinación. Puede ver y editar todo. |
| **★ Líder de mesa** (1 por mesa) | Su PIN personal | Sus aportes **y** lo que acuerda la mesa: oportunidad #1, evaluación del flujo, propuestas de coordinación, iniciativas y cuánto mueve cada palanca. |
| **Participante** | Su PIN personal | Sus propios aportes: titular 2027, ideas y check-out. Ve las cajas de la mesa, pero solo el líder las edita. |

Todos ven los resultados consolidados. El servidor valida los permisos: nadie puede editar lo de otra mesa ni lo de otra persona.

## 3. Publicarlo (elige una opción)

### Opción A · En la red de la oficina (la más rápida, 5 minutos)
Sirve si todos están en la misma red Wi-Fi.
1. Instala [Node.js](https://nodejs.org) (versión 18 o superior) en el computador del facilitador.
2. En la carpeta del proyecto, ejecuta:
   ```bash
   # Windows (PowerShell)
   $env:ADMIN_CODE="tu-codigo"; node server.js
   # Mac / Linux
   ADMIN_CODE=tu-codigo node server.js
   ```
3. Busca la IP del computador (`ipconfig` en Windows) y comparte `http://TU-IP:3000`.
4. Si no carga en otros equipos, permite Node.js en el firewall o pide apoyo a TI.

### Opción B · Azure App Service (recomendada por Softys / TI)
1. Sube esta carpeta a un repositorio (GitHub o Azure DevOps).
2. Crea un **App Service** con *Runtime: Node 20 LTS* (Linux).
3. Conecta el repositorio en *Deployment Center*.
4. En *Configuration → Application settings* agrega:
   - `ADMIN_CODE` = tu código de facilitador
   - `DATA_DIR` = `/home/data` (carpeta persistente: los datos no se pierden al reiniciar)
5. Comando de inicio: `node server.js`.

### Opción C · Render / Railway u otro servicio con Docker
Conecta el repositorio y usa el `Dockerfile`. Define `ADMIN_CODE` y agrega un **disco persistente** montado en `/data`. Sin disco persistente, los datos se borran al reiniciar el servicio.

> Recomendación: publícalo con TI o en Azure App Service y valida con TI antes de exponer datos de venta en un servicio externo.

## 4. Preparar el workshop (facilitador, unos 10 minutos)
1. Abre la URL e ingresa con tu `ADMIN_CODE`.
2. Ve a ⚙ **Configuración**:
   - Escribe las 4 personas de cada una de las 3 mesas.
   - Marca con el círculo **Líder** a una persona por mesa (puedes cambiarlo en vivo si la mesa elige otro).
   - Pulsa **Generar PIN faltantes**.
   - Pulsa **Imprimir accesos**: sale una hoja con la URL, el nombre, el rol y el PIN de cada persona, para recortar y entregar.
3. Revisa la **meta** (por defecto x4) y la hora de inicio.
4. Para ensayar: *Cargar ejemplo* y luego *Borrar todos los aportes* antes del día.

## 5. El día del workshop
- Proyecta tu pantalla (botón **Presentar** o tecla **P**; flechas ← → para avanzar).
- Cada persona entra desde su laptop o celular con su PIN.
- Todo se guarda automáticamente; en la esquina inferior aparece **● En línea · guardado**.
- Si alguien pierde la conexión, sus aportes quedan guardados en su equipo y se envían solos al volver la red.
- Al final, en **Resumen**: *Imprimir / PDF* (minuta), *Excel (CSV)* y *Respaldo*.

## 6. Datos y respaldos
- Estado vigente: `data/state.json`.
- Respaldos automáticos: `data/backup-*.json` (cada 5 minutos si hubo cambios; se guardan los últimos 50).
- Descarga completa (facilitador): `GET /api/export` o el botón *Respaldo* en Resumen.
- `data/` está en `.gitignore`: los aportes **no** se suben al repositorio.

## 7. Seguridad
- Cambia `ADMIN_CODE` (el valor por defecto `softys2027` es solo para pruebas).
- Los PIN solo los ve el facilitador; el servidor no los envía a los participantes.
- Es una herramienta para una sesión de trabajo, no un sistema con login corporativo. Para uso prolongado, publícala detrás del acceso de Microsoft Entra ID (App Service → *Authentication*).

## 8. Sin servidor
`public/index.html` también funciona abriéndolo directo desde el computador (modo sin conexión). En ese modo cada mesa envía sus aportes con **⇅ Enviar / recibir**.
