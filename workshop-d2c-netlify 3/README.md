# Workshop E-Commerce D2C Chile · versión Netlify

**Softys · Initiative · Infracommerce** — Mi Tienda Cotidian + Club Softys

Cada persona entra con el **código de su mesa** y elige su nombre. Todo se guarda en Netlify (Netlify Blobs) y el Resumen se consolida en vivo.

## 1. Subir al repositorio
Sube **todo el contenido de esta carpeta** a la raíz del repositorio (sin la carpeta contenedora). Debe verse así:
```
netlify.toml
package.json
public/index.html
netlify/functions/api.mjs
netlify/functions/core.mjs
```

## 2. Build settings en Netlify
Deja **vacíos** Base directory, Package directory, Build command y Publish directory: el `netlify.toml` ya lo define todo.

## 3. Códigos de acceso (Site configuration → Environment variables)
| Variable | Quién la usa | Ejemplo |
|---|---|---|
| `ADMIN_CODE` | Facilitador | `softys-fac-2027` |
| `MESA1_CODE` | Las 4 personas de la Mesa 1 | `AZUL` |
| `MESA2_CODE` | Las 4 personas de la Mesa 2 | `VERDE` |
| `MESA3_CODE` | Las 4 personas de la Mesa 3 | `TURQUESA` |

Después de crear o cambiar variables: **Deploys → Trigger deploy → Deploy site**.

## 4. Preparar (facilitador)
1. Entra con `ADMIN_CODE` → ⚙ Configuración.
2. Escribe las 4 personas de cada mesa y marca al **líder** (círculo).
3. **Imprimir accesos**: hoja con la URL, el código y los integrantes de cada mesa.
4. Para ensayar: *Cargar ejemplo*; antes del día: *Borrar todos los aportes*.

## 5. Roles
| Rol | Registra |
|---|---|
| Facilitador | Configuración, votos, plan, Gantt 2027, acuerdos |
| ★ Líder de mesa | Sus aportes + lo de la mesa: oportunidad #1, flujo, propuestas, iniciativas |
| Participante | Sus aportes: titular, ideas, check-out |

El servidor valida permisos: nadie edita lo de otra mesa ni de otra persona.

## 6. Datos
- Se guardan en **Netlify Blobs** (store `workshop-d2c`), con respaldos cada 10 minutos.
- Descarga completa: botón *Respaldo* en Resumen, o `/api/export` como facilitador.
