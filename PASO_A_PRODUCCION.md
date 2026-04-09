# Paso A Produccion

Este documento deja el flujo manual para subir el embebible a un servidor por SSH.

El objetivo es desplegar:

- backend `opencode serve`
- frontend `packages/app-min`
- modo embed con Keycloak
- modelo global fijo desde `opencode.json`

## Dominios Obligatorios

La configuracion obligatoria queda asi:

- frontend: `https://openzero.centauro.host`
- backend: `https://ozeroapi.centauro.host`

El frontend ya queda preparado para apuntar por defecto al backend usando:

- `VITE_OPENCODE_SERVER_URL=https://ozeroapi.centauro.host`

Y el backend debe aceptar CORS desde:

- `https://openzero.centauro.host`

## Recomendacion Actual

La forma mas limpia para este proyecto es usar `docker compose` con directorios reales del host.

No recomiendo guardar esto en volumenes Docker anonimos para tu caso.

La estructura obligatoria del servidor es esta:

```bash
/opt/openzero/
  app/
  config/
    .env.embed
    opencode.json
    MASTER_PROMPT.md
  data/
```

Ventajas:

- moverlo a otro servidor es trivial
- hacer backup es trivial
- puedes inspeccionar config y datos sin entrar al contenedor
- no quedas atado a `docker volume inspect`

En este repo ya quedaron listos:

- [deploy/embed/docker-compose.yml](/home/metrofico/WebstormProjects/zero_opencode/deploy/embed/docker-compose.yml)
- [deploy/embed/backend.Dockerfile](/home/metrofico/WebstormProjects/zero_opencode/deploy/embed/backend.Dockerfile)
- [deploy/embed/frontend.Dockerfile](/home/metrofico/WebstormProjects/zero_opencode/deploy/embed/frontend.Dockerfile)
- [deploy/embed/Caddyfile](/home/metrofico/WebstormProjects/zero_opencode/deploy/embed/Caddyfile)

El frontend queda servido por un `Caddy` propio en puerto `8081`, separado del resto de tus servicios.

## Opcion Recomendada Con Docker Compose

### 1. Preparar el servidor

Asumamos Ubuntu o Debian:

```bash
sudo apt update
sudo apt install -y git curl unzip docker.io docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
```

Opcional para no usar `sudo` siempre:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Clonar el proyecto

```bash
sudo mkdir -p /opt/openzero
sudo chown -R $USER:$USER /opt/openzero
chmod 755 /opt/openzero
cd /opt/openzero
mkdir -p app
cd /opt/openzero/app
git clone <URL_DE_TU_REPO> .
```

Importante:

- usa `git clone <URL> .` para clonar dentro de la carpeta actual
- no uses `git clone <URL>` porque eso crea una subcarpeta adicional

### 3. Crear directorios obligatorios

```bash
sudo mkdir -p /opt/openzero/config
sudo mkdir -p /opt/openzero/data
sudo chown -R $USER:$USER /opt/openzero
chmod 755 /opt/openzero/app
chmod 755 /opt/openzero/config
chmod 755 /opt/openzero/data
```

### 4. Crear `.env.embed`

```bash
cp .env.embed.example /opt/openzero/config/.env.embed
nano /opt/openzero/config/.env.embed
chmod 600 /opt/openzero/config/.env.embed
```

Contenido base:

```bash
OPENCODE_EMBED=1
OPENCODE_DISABLE_PROJECT_CONFIG=1
OPENCODE_SERVER_CORS=https://openzero.centauro.host

KEYCLOAK_URL=https://auth.centauro.host
KEYCLOAK_REALM=centauro
OPENCODE_EMBED_AZP=test-api-centauro

OPENCODE_EMBED_ROOT=/data
```

### 5. Crear `opencode.json`

```bash
nano /opt/openzero/config/opencode.json
chmod 644 /opt/openzero/config/opencode.json
```

Ejemplo:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "llama-local/tu-modelo",
  "small_model": "llama-local/tu-modelo",
  "instructions": [
    "/config/MASTER_PROMPT.md"
  ]
}
```

### 5.1. Crear `MASTER_PROMPT.md`

```bash
nano /opt/openzero/config/MASTER_PROMPT.md
chmod 644 /opt/openzero/config/MASTER_PROMPT.md
```

Ese archivo se monta dentro del contenedor backend como:

```text
/config/MASTER_PROMPT.md
```

Por eso en `opencode.json` la ruta correcta es:

```json
"/config/MASTER_PROMPT.md"
```

### 6. Levantar el stack

```bash
cd /opt/openzero/app/deploy/embed
docker compose up -d --build
```

### 7. Ver logs

```bash
docker compose logs -f backend
docker compose logs -f web
```

### 8. Verificar puertos

La pila deja:

- backend: `127.0.0.1:4096`
- caddy/frontend: `0.0.0.0:8081`

Pruebas:

```bash
curl http://127.0.0.1:4096/global/health
curl http://127.0.0.1:8081
```

### 9. URL final del embebido

Si accedes directo:

```text
http://TU_SERVIDOR:8081/?token=ACCESS_TOKEN
```

Si lo pasas por Cloudflare Tunnel:

```text
https://openzero.centauro.host/?token=ACCESS_TOKEN
```

## Como Funciona Esta Pila

El compose crea dos servicios:

### `backend`

- ejecuta `opencode serve`
- valida JWT de Keycloak
- lee `/app/opencode.json`
- guarda datos tenant en `/data`

### `web`

- builda `packages/app-min`
- lo sirve con Caddy
- Caddy proxea las rutas API al backend
- todo sale por un solo origen

Eso es importante porque `app-min` en produccion usa `location.origin`.

## Cloudflare Tunnel

Debes crear dos rutas en Cloudflare Tunnel:

- `openzero.centauro.host` -> `http://127.0.0.1:8081`
- `ozeroapi.centauro.host` -> `http://127.0.0.1:4096`

El frontend usa el dominio API por defecto, por eso necesitas ambas.

Como ya usaras Cloudflare Tunnel por dominio, lo ideal es apuntarlo asi:

```text
openzero.centauro.host -> http://127.0.0.1:8081
ozeroapi.centauro.host -> http://127.0.0.1:4096
```

No necesitas exponer puertos publicos del servidor fuera del tunnel.

Cloudflare debe ver:

```text
http://127.0.0.1:8081
http://127.0.0.1:4096
```

Y Caddy se encarga de servir la SPA del frontend.

El backend queda servido directo por su propio dominio API.

## Actualizar El Deploy

```bash
cd /opt/openzero/app
git fetch origin
git checkout dev
git pull origin dev
cd /opt/openzero/app/deploy/embed
docker compose up -d --build
```

## Detener O Reiniciar

```bash
cd /opt/openzero/app/deploy/embed
docker compose stop
docker compose start
docker compose restart
```

## Backup

Solo necesitas respaldar estas rutas:

```bash
/opt/openzero/config
/opt/openzero/data
```

No necesitas respaldar contenedores ni volumenes Docker.

## Errores Comunes En Docker

### El frontend abre pero no responde

Revisa:

```bash
docker compose logs -f web
docker compose logs -f backend
```

### El modelo no aparece

Revisa:

- `/srv/openzero/config/opencode.json`
- nombre exacto del provider/model
- `OPENCODE_DISABLE_PROJECT_CONFIG=1`

### La sesion sale invalida

Revisa:

- `KEYCLOAK_URL`
- `KEYCLOAK_REALM`
- `OPENCODE_EMBED_AZP`
- expiracion del token

## Opcion Antigua

Mas abajo se mantiene el flujo manual con `systemd + nginx`, pero para tu caso la recomendacion actual es `docker compose + caddy + directorios del host`.

## Arquitectura Final

En produccion conviene correr asi:

- `Nginx` sirve el frontend estatico de `packages/app-min/dist`
- `Nginx` proxea las rutas API al backend `opencode` en `127.0.0.1:4096`
- `opencode` corre como proceso del sistema con `systemd`
- el archivo `opencode.json` vive en la raiz del deploy y define el modelo global

Con esto:

- todos los usuarios embed usan la misma config global del servicio
- el backend valida el JWT de Keycloak
- el frontend embebido ya no deja cambiar providers/modelos visualmente

## Requisitos Del Servidor

Asumamos un servidor Linux Ubuntu o Debian.

Necesitas:

- acceso SSH
- `git`
- `curl`
- `unzip`
- `nginx`
- `bun`
- `systemd`

Instalacion base:

```bash
sudo apt update
sudo apt install -y git curl unzip nginx
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

Verifica:

```bash
bun --version
nginx -v
```

## Directorio De Deploy

Vamos a usar este path:

```bash
/opt/openzero
```

Crealo:

```bash
sudo mkdir -p /opt/openzero
sudo chown -R $USER:$USER /opt/openzero
cd /opt/openzero
```

## Clonar El Proyecto

```bash
git clone <URL_DE_TU_REPO> app
cd /opt/openzero/app
```

Si ya existe:

```bash
cd /opt/openzero/app
git fetch origin
git checkout dev
git pull origin dev
```

## Instalar Dependencias

```bash
cd /opt/openzero/app
bun install
```

## Crear Configuracion Embed

Copia el ejemplo:

```bash
cp .env.embed.example .env.embed
```

Edita:

```bash
nano .env.embed
```

Contenido base recomendado:

```bash
OPENCODE_EMBED=1
OPENCODE_DISABLE_PROJECT_CONFIG=1

KEYCLOAK_URL=https://auth.centauro.host
KEYCLOAK_REALM=centauro
OPENCODE_EMBED_AZP=test-api-centauro

# Opcional
# OPENCODE_EMBED_AUDIENCE=account
# OPENCODE_EMBED_ROOT=/opt/openzero/data
```

Notas:

- `OPENCODE_DISABLE_PROJECT_CONFIG=1` evita que configs de proyecto pisen la config global del servicio
- `OPENCODE_EMBED_ROOT` te sirve si quieres controlar el storage multi-tenant en una ruta fija

## Crear El opencode.json Global Del Servicio

Este archivo debe vivir en la raiz donde arrancas el backend:

```bash
/opt/openzero/app/opencode.json
```

Crealo:

```bash
nano /opt/openzero/app/opencode.json
```

Ejemplo:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "llama-local/tu-modelo",
  "small_model": "llama-local/tu-modelo"
}
```

Importante:

- el nombre de `model` debe coincidir exactamente con el provider/model que OpenCode expone
- este archivo ya lo lee el backend embed desde `process.cwd()`
- esto aplica para todos los usuarios del embebido

## Build Del Frontend

```bash
cd /opt/openzero/app
bun --cwd packages/app-min build
```

El build queda en:

```bash
/opt/openzero/app/packages/app-min/dist
```

## Probar Manualmente Antes De systemd

Primero prueba el backend:

```bash
cd /opt/openzero/app
set -a
. ./.env.embed
set +a
bun run --cwd packages/opencode src/index.ts serve --hostname 127.0.0.1 --port 4096
```

En otra terminal:

```bash
curl http://127.0.0.1:4096/global/health
```

Si responde, el backend esta bien.

Para probar frontend estatico rapido:

```bash
cd /opt/openzero/app/packages/app-min
bunx serve dist -l 3001
```

Esto es solo prueba local.

## Crear Servicio systemd Para El Backend

Crea el archivo:

```bash
sudo nano /etc/systemd/system/openzero-backend.service
```

Contenido:

```ini
[Unit]
Description=OpenZero Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/openzero/app
EnvironmentFile=/opt/openzero/app/.env.embed
ExecStart=/root/.bun/bin/bun run --cwd packages/opencode src/index.ts serve --hostname 127.0.0.1 --port 4096
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Si tu usuario no es `root`, cambia:

- `User=root`
- `/root/.bun/bin/bun`

por tu usuario real y la ruta real de Bun.

Por ejemplo:

```bash
which bun
```

Luego:

```bash
sudo systemctl daemon-reload
sudo systemctl enable openzero-backend
sudo systemctl start openzero-backend
sudo systemctl status openzero-backend
```

Logs:

```bash
sudo journalctl -u openzero-backend -f
```

## Configurar Nginx

Crea el sitio:

```bash
sudo nano /etc/nginx/sites-available/openzero
```

Configuracion base:

```nginx
server {
    listen 80;
    server_name TU_DOMINIO;

    root /opt/openzero/app/packages/app-min/dist;
    index index.html;

    location /assets/ {
        try_files $uri =404;
        access_log off;
        expires 7d;
    }

    location /embed {
        proxy_pass http://127.0.0.1:4096;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /global {
        proxy_pass http://127.0.0.1:4096;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /provider {
        proxy_pass http://127.0.0.1:4096;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /project {
        proxy_pass http://127.0.0.1:4096;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /session {
        proxy_pass http://127.0.0.1:4096;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /agent {
        proxy_pass http://127.0.0.1:4096;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /path {
        proxy_pass http://127.0.0.1:4096;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /command {
        proxy_pass http://127.0.0.1:4096;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /permission {
        proxy_pass http://127.0.0.1:4096;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /question {
        proxy_pass http://127.0.0.1:4096;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /mcp {
        proxy_pass http://127.0.0.1:4096;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /file {
        proxy_pass http://127.0.0.1:4096;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /vcs {
        proxy_pass http://127.0.0.1:4096;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /config {
        proxy_pass http://127.0.0.1:4096;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /auth {
        proxy_pass http://127.0.0.1:4096;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri /index.html;
    }
}
```

Activa el sitio:

```bash
sudo ln -s /etc/nginx/sites-available/openzero /etc/nginx/sites-enabled/openzero
sudo nginx -t
sudo systemctl reload nginx
```

## SSL Con Certbot

Si ya tienes dominio:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d TU_DOMINIO
```

## Verificacion Final

Prueba:

```bash
curl -I http://127.0.0.1:4096/global/health
curl -I http://TU_DOMINIO
```

Abre en navegador:

```text
https://TU_DOMINIO/?token=TU_ACCESS_TOKEN
```

Si el token es valido:

- entra al embed
- abre la sesion del usuario
- usa el modelo fijo del `opencode.json`

Si el token no es valido:

- aparece la pantalla bloqueante de sesion invalida

## Como Lo Embebes Desde Tu Otro Frontend

La URL del iframe es:

```text
https://TU_DOMINIO/?token=ACCESS_TOKEN
```

Ejemplo:

```html
<iframe
  src="https://TU_DOMINIO/?token=TOKEN"
  style="width:100%;height:100%;border:0;"
  allow="clipboard-read; clipboard-write"
></iframe>
```

## Flujo De Actualizacion

Cuando quieras actualizar:

```bash
cd /opt/openzero/app
git fetch origin
git checkout dev
git pull origin dev
bun install
bun --cwd packages/app-min build
sudo systemctl restart openzero-backend
sudo systemctl reload nginx
```

## Errores Comunes

### El provider o modelo desaparece

Revisa:

- `opencode.json` en la raiz del deploy
- `OPENCODE_DISABLE_PROJECT_CONFIG=1`
- nombre correcto del provider/model

### Sale `Sesion no valida`

Revisa:

- `KEYCLOAK_URL`
- `KEYCLOAK_REALM`
- `OPENCODE_EMBED_AZP`
- expiracion del JWT

### El frontend carga pero no responde la API

Revisa:

- `sudo systemctl status openzero-backend`
- `sudo journalctl -u openzero-backend -f`
- `nginx -t`
- que el proxy apunte a `127.0.0.1:4096`

## Recomendacion Operativa

Primera salida:

- deploy manual
- `systemd` para backend
- `nginx` para frontend

Siguiente mejora:

- automatizar con script de deploy
- separar secretos de `.env.embed`
- cambiar `?token=` por un flujo de bootstrap con token corto o URL efimera
