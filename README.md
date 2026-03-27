# Family Packlist

Aplicación web self-hosted para gestionar listas de equipaje familiares con Next.js + TypeScript + Prisma + SQLite.

## Características

- Crear, editar, borrar y duplicar listas.
- Crear, editar, borrar, marcar/desmarcar y reordenar ítems.
- Agrupación por categorías con colapso por categoría.
- Asignación por persona o "toda la familia".
- Filtros por estado, categoría y persona.
- Progreso total/completado/pendiente/porcentaje.
- Configuración completa desde interfaz:
  - Categorías: crear, editar, ordenar, activar/desactivar.
  - Ítems base: crear, editar, asignar categoría/persona, sugeridos, activar/desactivar.
  - Plantillas: crear, editar, activar/desactivar.
  - Ítems de plantilla: crear, editar, activar/desactivar.
- Modo oscuro.
- Manifest PWA básico.
- Persistencia local en volumen Docker.

## Estructura

```text
family-packlist/
  app/
    api/
    components/
    lists/
    settings/
    lib/
  prisma/
    migrations/
    schema.prisma
    seed.js
  public/
  docker/start.sh
  Dockerfile
  docker-compose.yml
  .env.example
  README.md
```

## Despliegue paso a paso (Docker Compose)

### 1) Preparar carpeta en servidor

En tu servidor `192.168.1.112`:

```bash
mkdir -p /opt/family-packlist
cd /opt/family-packlist
```

Copia aquí el contenido del proyecto **sin crear una carpeta anidada** `family-packlist/family-packlist`.
Alternativa recomendada: desplegar directamente desde GitHub (sección "Replicar con GitHub").

### 2) Variables de entorno

```bash
cp .env.example .env
```

Si quieres cambiar el puerto externo, edita `APP_PORT` en `.env`.

### 3) Levantar

```bash
docker compose up -d --build
```

### 4) Verificar

```bash
docker compose ps
docker compose logs -f family-packlist
```

Acceso desde red local:

- `http://192.168.1.112:3000` (o el puerto que pongas en `APP_PORT`).

## Cambio de puerto

En `.env`:

```env
APP_PORT=3100
```

Reaplica:

```bash
docker compose up -d
```

Acceso:

- `http://192.168.1.112:3100`

## Reverse proxy (Nginx Proxy Manager)

- Host destino: `192.168.1.112`
- Puerto destino: el valor real configurado en `APP_PORT` (ejemplo: `3001`)
- Esquema: `http`

## Volumen y persistencia

Se usa el volumen Docker:

- `family_packlist_data` montado en `/app/data`
- SQLite: `/app/data/app.db`

## Backup de datos

### Backup rápido

```bash
docker compose exec family-packlist sh -c 'cp /app/data/app.db /app/data/app.db.bak'
```

### Backup recomendado a archivo externo

```bash
docker run --rm \
  -v family_packlist_data:/data \
  -v /opt/family-packlist:/backup \
  alpine sh -c 'cp /data/app.db /backup/app.db.backup'
```

## Restauración

1. Parar app:

```bash
docker compose down
```

2. Restaurar `app.db` al volumen:

```bash
docker run --rm \
  -v family_packlist_data:/data \
  -v /opt/family-packlist:/backup \
  alpine sh -c 'cp /backup/app.db.backup /data/app.db'
```

3. Levantar:

```bash
docker compose up -d
```

## Actualizar sin perder datos

```bash
cd /opt/family-packlist
# actualizar código
git pull
docker compose up -d --build
```

Los datos permanecen porque están en `family_packlist_data`.

Si desplegaste por copia manual (sin `git clone`), reemplaza archivos del proyecto y luego ejecuta:

```bash
cd /opt/family-packlist
docker compose up -d --build
```

## Replicar con GitHub (recomendado)

### Publicar este proyecto en tu repositorio

En tu máquina local (donde tienes la carpeta `family-packlist`):

```bash
cd /ruta/local/family-packlist
rm -rf .next node_modules prisma/prisma/dev.db prisma/prisma/dev.db-journal tsconfig.tsbuildinfo
git init
git add .
git commit -m "Initial commit: family-packlist"
git branch -M main
git remote add origin git@github.com:TU_USUARIO/TU_REPO.git
git push -u origin main
```

Si no usas SSH en GitHub:

```bash
git remote set-url origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

### Redesplegar en otro servidor desde GitHub

```bash
sudo mkdir -p /opt
cd /opt
sudo git clone https://github.com/TU_USUARIO/TU_REPO.git family-packlist
sudo chown -R $USER:$USER /opt/family-packlist
cd /opt/family-packlist
cp .env.example .env
sed -i 's/^APP_PORT=.*/APP_PORT=3001/' .env
docker compose up -d --build
```

## Compatibilidad ARM (Raspberry Pi)

Sí, esta aplicación es compatible con ARM64 (por ejemplo Raspberry Pi 4/5 con OS 64-bit):

- La imagen `node:20-bookworm-slim` es multi-arquitectura.
- El stack actual (Debian + OpenSSL) evita el problema que viste con Alpine.
- Para Raspberry Pi, usa preferiblemente `linux/arm64` y sistema operativo de 64 bits.

Comprobación rápida en la Pi:

```bash
uname -m
docker version
docker compose version
```

Si `uname -m` devuelve `aarch64`, estás en ARM64 correcto.

## Seed de ejemplo incluido

Al primer arranque (si no existe `app.db`) se cargan datos iniciales:

- Categorías: ropa, medicamentos, documentación, higiene, tecnología, niñas, varios.
- Personas: adulto 1, adulto 2, niña 14, niña 8, niña 2.
- Ítems base de ejemplo.
- Plantillas: viaje corto y playa.
- Lista inicial de ejemplo.

## Notas de operación

- Desactivar categorías/ítems base/plantillas **no borra** histórico existente.
- Listas antiguas mantienen referencia a categorías aunque luego se desactiven.
- La app funciona íntegramente sin servicios cloud.
