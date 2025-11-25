const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { 
  formatODataCollection, 
  formatODataSingleEntity, 
  generateMetadata, 
  generateServiceDocument, 
  formatODataError 
} = require('./odata-formatter');

// Cargar datos de colas virtuales
const virtualGenesysQueuesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'virtual-queues.json'), 'utf8')
);

const app = express();
const PORT = process.env.PORT || 8443;
const API_PREFIX = '/api/data/v1';
const BASE_URL = `https://localhost:${PORT}${API_PREFIX}`;

// Middleware
app.use(cors());
app.use(express.json());

// Middleware para logging detallado
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  
  // Obtener la IP real del cliente (considerando proxies)
  const clientIp = req.headers['x-forwarded-for'] 
    || req.headers['x-real-ip']
    || req.connection.remoteAddress 
    || req.socket.remoteAddress
    || (req.connection.socket ? req.connection.socket.remoteAddress : null);
  
  // Log detallado de la petición
  console.log('┌─────────────────────────────────────────────────────────────');
  console.log(`│ 📅 Timestamp: ${timestamp}`);
  console.log(`│ 🌐 Client IP: ${clientIp}`);
  console.log(`│ 🔹 Method: ${req.method}`);
  console.log(`│ 🔗 URL: ${req.url}`);
  console.log(`│ 📍 Path: ${req.path}`);
  console.log(`│ 🔍 Query: ${JSON.stringify(req.query)}`);
  console.log(`│ 📋 Headers:`);
  console.log(`│   - User-Agent: ${req.headers['user-agent'] || 'N/A'}`);
  console.log(`│   - Content-Type: ${req.headers['content-type'] || 'N/A'}`);
  console.log(`│   - Accept: ${req.headers['accept'] || 'N/A'}`);
  console.log(`│   - Host: ${req.headers['host'] || 'N/A'}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`│ 📦 Body: ${JSON.stringify(req.body)}`);
  }
  
  // Capturar el tiempo de respuesta
  const startTime = Date.now();
  
  // Interceptar la respuesta para log
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`│ ✅ Status: ${res.statusCode} ${res.statusMessage || ''}`);
    console.log(`│ ⏱️  Duration: ${duration}ms`);
    console.log('└─────────────────────────────────────────────────────────────\n');
  });
  
  next();
});

// Middleware para headers OData
app.use((req, res, next) => {
  res.set({
    'OData-Version': '4.0',
    'Content-Type': 'application/json;odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false;charset=utf-8'
  });
  next();
});

// Función para parsear parámetros de consulta OData
function parseODataQuery(query) {
  const params = {};
  
  if (query.$top) {
    params.$top = parseInt(query.$top);
  }
  
  if (query.$skip) {
    params.$skip = parseInt(query.$skip);
  }
  
  if (query.$count === 'true') {
    params.$count = true;
  }
  
  if (query.$filter) {
    params.$filter = query.$filter;
  }
  
  return params;
}

// Función para aplicar filtros
function applyFilter(data, filterExpression) {
  if (!filterExpression) return data;
  
  // Implementación básica de filtros OData
  // Soporta filtros simples como: name eq 'valor' o id eq 'guid'
  const filterRegex = /(\w+)\s+(eq|ne|gt|lt|ge|le)\s+'([^']+)'/i;
  const match = filterExpression.match(filterRegex);
  
  if (!match) return data;
  
  const [, property, operator, value] = match;
  
  return data.filter(item => {
    const itemValue = item[property];
    switch (operator.toLowerCase()) {
      case 'eq':
        return itemValue === value;
      case 'ne':
        return itemValue !== value;
      case 'gt':
        return itemValue > value;
      case 'lt':
        return itemValue < value;
      case 'ge':
        return itemValue >= value;
      case 'le':
        return itemValue <= value;
      default:
        return true;
    }
  });
}

// Rutas del servicio OData

// Documento raíz del servicio
app.get(`${API_PREFIX}/`, (req, res) => {
  try {
    const serviceDoc = generateServiceDocument(BASE_URL);
    res.json(serviceDoc);
  } catch (error) {
    console.error('Error generando documento de servicio:', error);
    res.status(500).json(formatODataError('InternalServerError', 'Error interno del servidor'));
  }
});

// Metadatos del servicio
app.get(`${API_PREFIX}/\\$metadata`, (req, res) => {
  try {
    const metadata = generateMetadata(BASE_URL);
    res.set('Content-Type', 'application/xml');
    res.send(metadata);
  } catch (error) {
    console.error('Error generando metadatos:', error);
    res.status(500).json(formatODataError('InternalServerError', 'Error interno del servidor'));
  }
});

// Obtener todas las colas virtuales
app.get(`${API_PREFIX}/ods_virtualgenesysqueues`, (req, res) => {
  try {
    const queryParams = parseODataQuery(req.query);
    // Aplicar filtros
    let filteredData = applyFilter(virtualGenesysQueuesData, queryParams.$filter);
    // Formatear respuesta OData
    const odataResponse = formatODataCollection(
      filteredData,
      BASE_URL,
      'ods_virtualgenesysqueues',
      queryParams
    );
    res.json(odataResponse);
  } catch (error) {
    console.error('Error obteniendo colas virtuales:', error);
    res.status(500).json(formatODataError('InternalServerError', 'Error interno del servidor'));
  }
});

// Obtener una cola virtual específica por ID (formato OData estándar OData: /ods_virtualgenesysqueues(<id>))
app.get(`${API_PREFIX}/ods_virtualgenesysqueues*:idWithParens`, (req, res) => {
  try {
    // Extraer el id del path usando RegExp
    const match = req.path.match(/ods_virtualgenesysqueues\(([^)]+)\)$/);
    const id = match ? match[1] : null;
    if (!id) {
      return res.status(400).json(formatODataError('BadRequest', 'ID inválido en la ruta'));
    }
    const queue = virtualGenesysQueuesData.find(q => q.ods_virtualgenesysqueueid === id);
    if (!queue) {
      return res.status(404).json(
        formatODataError('NotFound', `Cola virtual con ods_virtualgenesysqueueid '${id}' no encontrada`)
      );
    }
    const odataResponse = formatODataSingleEntity(queue, BASE_URL, 'ods_virtualgenesysqueues');
    res.json(odataResponse);
  } catch (error) {
    console.error('Error obteniendo cola virtual:', error);
    res.status(500).json(formatODataError('InternalServerError', 'Error interno del servidor'));
  }
});

// Ruta alternativa para obtener cola por ID usando parámetro de ruta simple
app.get(`${API_PREFIX}/ods_virtualgenesysqueues/:id`, (req, res) => {
  try {
    const id = req.params.id;
    const queue = virtualGenesysQueuesData.find(q => q.ods_virtualgenesysqueueid === id);
    if (!queue) {
      return res.status(404).json(
        formatODataError('NotFound', `Cola virtual con ods_virtualgenesysqueueid '${id}' no encontrada`)
      );
    }
    const odataResponse = formatODataSingleEntity(queue, BASE_URL, 'ods_virtualgenesysqueues');
    res.json(odataResponse);
  } catch (error) {
    console.error('Error obteniendo cola virtual:', error);
    res.status(500).json(formatODataError('InternalServerError', 'Error interno del servidor'));
  }
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json(
    formatODataError('NotFound', `Recurso '${req.originalUrl}' no encontrado`)
  );
});

// Manejo de errores globales
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  res.status(500).json(
    formatODataError('InternalServerError', 'Error interno del servidor')
  );
});

// Función para iniciar el servidor
function startServer() {
  try {
    // Intentar cargar certificados SSL
    let server;
    
    try {
      const privateKey = fs.readFileSync(path.join(__dirname, 'certs', 'private-key.pem'), 'utf8');
      const certificate = fs.readFileSync(path.join(__dirname, 'certs', 'certificate.pem'), 'utf8');
      
      const credentials = {
        key: privateKey,
        cert: certificate
      };
      
      server = https.createServer(credentials, app);
      console.log('🔒 Servidor HTTPS configurado con certificados SSL');
    } catch (certError) {
      console.log('⚠️  No se encontraron certificados SSL, usando HTTP en su lugar');
      console.log('💡 Para usar HTTPS, ejecuta: npm run generate-certs');
      
      // Fallback a HTTP si no hay certificados
      const http = require('http');
      server = http.createServer(app);
    }
    
    server.listen(PORT, () => {
      const protocol = server instanceof https.Server ? 'https' : 'http';
      console.log('🚀 Servidor OData iniciado exitosamente');
      console.log(`📡 URL base: ${protocol}://localhost:${PORT}`);
  console.log('📋 Endpoints disponibles:');
  console.log(`   ${protocol}://localhost:${PORT}${API_PREFIX}/                    - Documento de servicio`);
  console.log(`   ${protocol}://localhost:${PORT}${API_PREFIX}/$metadata          - Metadatos del servicio`);
  console.log(`   ${protocol}://localhost:${PORT}${API_PREFIX}/ods_virtualgenesysqueues      - Todas las colas virtuales`);
  console.log(`   ${protocol}://localhost:${PORT}${API_PREFIX}/ods_virtualgenesysqueues(id)  - Cola específica por ID`);
  console.log('');
  console.log('📖 Ejemplos de uso:');
  console.log(`   GET ${protocol}://localhost:${PORT}${API_PREFIX}/ods_virtualgenesysqueues`);
  console.log(`   GET ${protocol}://localhost:${PORT}${API_PREFIX}/ods_virtualgenesysqueues?$top=3&$count=true`);
  console.log(`   GET ${protocol}://localhost:${PORT}${API_PREFIX}/ods_virtualgenesysqueues(a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789)`);
    });
    
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error.message);
    process.exit(1);
  }
}

// Iniciar servidor
startServer();

module.exports = app;