# Servidor OData de Colas Virtuales

Un servidor Node.js que expone datos de colas virtuales a través de una API OData v4 con soporte HTTPS.

## Características

- ✅ API OData v4 completa
- 🔒 Soporte HTTPS con certificados SSL
- 📊 Datos de colas virtuales con ID (GUID) y nombre
- 🔍 Soporte para consultas OData ($filter, $top, $skip, $count)
- 📝 Metadatos de servicio OData
- 🚀 Servidor Express.js optimizado

## Instalación

```bash
# Clonar el proyecto
git clone <url-del-repositorio>
cd ACH-ods-Odata-server-poc

# Instalar dependencias
npm install

# Generar certificados SSL (opcional, para HTTPS)
npm run generate-certs
```

## Uso

### Iniciar el servidor

```bash
# Modo producción
npm start

# Modo desarrollo (con nodemon)
npm run dev
```

El servidor se iniciará en:
- **HTTPS**: `https://localhost:8443` (si hay certificados SSL)
- **HTTP**: `http://localhost:8443` (fallback si no hay certificados)

## Endpoints de la API

### 🏠 Documento de Servicio
```http
GET https://localhost:8443/api/data/v1/
```

### 📋 Metadatos del Servicio
```http
GET https://localhost:8443/api/data/v1/$metadata
```

### 📊 Todas las Colas Virtuales
```http
GET https://localhost:8443/api/data/v1/ods_virtualgenesysqueue
```

### 🎯 Cola Virtual Específica
```http
GET https://localhost:8443/api/data/v1/ods_virtualgenesysqueue(a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789)
```

## Consultas OData Soportadas

### Paginación
```http
# Obtener los primeros 3 registros
GET https://localhost:8443/api/data/v1/ods_virtualgenesysqueue?$top=3

# Saltar los primeros 2 registros y obtener 3
GET https://localhost:8443/api/data/v1/ods_virtualgenesysqueue?$skip=2&$top=3

# Incluir el conteo total
GET https://localhost:8443/api/data/v1/ods_virtualgenesysqueue?$count=true
```

### Filtros
```http
# Filtrar por nombre exacto
GET https://localhost:8443/api/data/v1/ods_virtualgenesysqueue?$filter=ods_name eq 'Cola de Procesamiento de Pagos'

# Filtrar por ID
GET https://localhost:8443/api/data/v1/ods_virtualgenesysqueue?$filter=ods_virtualgenesysqueueid eq 'a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789'
```

### Combinación de parámetros
```http
GET https://localhost:8443/api/data/v1/ods_virtualgenesysqueue?$top=5&$count=true&$filter=ods_name eq 'Cola de Backup Automático'
```

## Estructura de Datos

### Virtual Queue
```json
{
  "ods_virtualgenesysqueueid": "a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789",
  "ods_name": "Payment Processing Queue",
  "ods_description": "Processes customer payments in real time."
}
```

### OData Collection Response
```json
{
  "@odata.context": "https://localhost:8443/api/data/v1/$metadata#ods_virtualgenesysqueue",
  "@odata.count": 8,
  "@odata.nextLink": null,
  "value": [
    {
      "@odata.id": "https://localhost:8443/api/data/v1/ods_virtualgenesysqueue(a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789)",
      "@odata.editLink": "ods_virtualgenesysqueue(a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789)",
      "@odata.type": "#VirtualGenesysQueue",
      "ods_virtualgenesysqueueid": "a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789",
      "ods_name": "Payment Processing Queue",
      "ods_description": "Processes customer payments in real time."
    }
  ]
}
```

### OData Single Entity Response
```json
{
  "@odata.context": "https://localhost:8443/api/data/v1/$metadata#ods_virtualgenesysqueue/$entity",
  "@odata.id": "https://localhost:8443/api/data/v1/ods_virtualgenesysqueue(a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789)",
  "@odata.editLink": "ods_virtualgenesysqueue(a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789)",
  "@odata.type": "#VirtualGenesysQueue",
  "ods_virtualgenesysqueueid": "a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789",
  "ods_name": "Payment Processing Queue",
  "ods_description": "Processes customer payments in real time."
}
```

## Ejemplos de Uso con cURL

### Obtener todas las colas
```bash
curl -k https://localhost:8443/api/data/v1/ods_virtualgenesysqueue
```

### Obtener cola específica
```bash
curl -k https://localhost:8443/api/data/v1/ods_virtualgenesysqueue\(a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789\)
```

### Obtener metadatos
```bash
curl -k https://localhost:8443/api/data/v1/\$metadata
```

### Consulta con filtros
```bash
curl -k "https://localhost:8443/api/data/v1/ods_virtualgenesysqueue?\$filter=ods_name%20eq%20%27Cola%20de%20Procesamiento%20de%20Pagos%27"
```

## Datos de Ejemplo

The server includes 8 example virtual queues:

1. **Payment Processing Queue** - `a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789`
2. **Push Notification Queue** - `f7e8d9c0-b1a2-4356-9087-1f2e3d4c5b6a`
3. **Document Validation Queue** - `3b2c1d0e-9f8a-4567-8901-2b3c4d5e6f7a`
4. **Image Processing Queue** - `7c6b5a49-3e2d-4123-8907-6f5e4d3c2b1a`
5. **Database Synchronization Queue** - `e9f8a7b6-c5d4-4890-a123-b456c789d012`
6. **Email Sending Queue** - `2d3c4b5a-6978-4567-9abc-def012345678`
7. **Automatic Backup Queue** - `9a8b7c6d-5e4f-4123-8901-234567890abc`
8. **Log Analysis Queue** - `5f4e3d2c-1b0a-4789-8456-123def456789`

## Configuración HTTPS

### Generar Certificados SSL
```bash
npm run generate-certs
```

Esto creará:
- `certs/private-key.pem` - Clave privada
- `certs/certificate.pem` - Certificado público

### Nota de Seguridad
Los certificados generados son **autofirmados** y solo deben usarse para desarrollo. En producción, usa certificados de una autoridad de certificación (CA) confiable.

## Estructura del Proyecto

```
ACH-ods-Odata-server-poc/
├── package.json                # Configuración del proyecto y dependencias
├── server.js                   # Servidor principal Express.js
├── odata-formatter.js          # Utilidades para formato OData v4
├── virtual-queues.json         # Datos de ejemplo de colas virtuales
├── generate-certs.js           # Script para generar certificados SSL
├── certs/                      # Directorio de certificados SSL (generado)
│   ├── private-key.pem
│   └── certificate.pem
└── README.md                   # Documentación del proyecto
```

## Scripts Disponibles

- `npm start` - Inicia el servidor en modo producción
- `npm run dev` - Inicia el servidor en modo desarrollo con nodemon
- `npm run generate-certs` - Genera certificados SSL autofirmados

## Requisitos del Sistema

- Node.js 14.x o superior
- npm 6.x o superior
- OpenSSL (para generar certificados SSL)

## Tecnologías Utilizadas

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **HTTPS** - Protocolo seguro
- **OData v4** - Estándar de API REST
- **CORS** - Soporte para peticiones cross-origin
- **UUID** - Para validación de GUIDs

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Soporte

Si encuentras algún problema o tienes preguntas, por favor abre un issue en el repositorio del proyecto.