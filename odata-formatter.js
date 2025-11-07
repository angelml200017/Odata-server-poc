/**
 * Utilidades para formatear respuestas en formato OData v4
 */

/**
 * Formatea una colección de entidades según el estándar OData v4
 * @param {Array} entities - Array de entidades a formatear
 * @param {string} baseUrl - URL base del servicio
 * @param {string} entitySetName - Nombre del conjunto de entidades
 * @param {Object} queryParams - Parámetros de consulta ($top, $skip, etc.)
 * @returns {Object} Respuesta formateada en OData v4
 */
function formatODataCollection(entities, baseUrl, entitySetName, queryParams = {}) {
  const { $top, $skip = 0, $count } = queryParams;
  
  // Aplicar paginación si se especifica $top
  let pagedEntities = entities;
  if ($top) {
    pagedEntities = entities.slice($skip, $skip + $top);
  }

  const response = {
    "@odata.context": `${baseUrl}/$metadata#${entitySetName}`,
    "@odata.nextLink": null,
    value: pagedEntities.map(entity => formatODataEntity(entity, baseUrl, entitySetName))
  };

  // Agregar count si se solicita
  if ($count) {
    response["@odata.count"] = entities.length;
  }

  // Agregar nextLink si hay más resultados
  if ($top && ($skip + $top) < entities.length) {
    response["@odata.nextLink"] = `${baseUrl}/${entitySetName}?$skip=${$skip + $top}&$top=${$top}`;
  }

  return response;
}

/**
 * Formatea una entidad individual según el estándar OData v4
 * @param {Object} entity - Entidad a formatear
 * @param {string} baseUrl - URL base del servicio
 * @param {string} entitySetName - Nombre del conjunto de entidades
 * @returns {Object} Entidad formateada en OData v4
 */
function formatODataEntity(entity, baseUrl, entitySetName) {
  // Determinar el tipo basado en el nombre de la entidad
  const entityType = entitySetName === 'ods_virtualgenesysqueue' ? 'VirtualGenesysQueue' : entitySetName.slice(0, -1);
  const idField = 'ods_virtualgenesysqueueid';
  return {
    "@odata.id": `${baseUrl}/${entitySetName}(${entity[idField]})`,
    "@odata.editLink": `${entitySetName}(${entity[idField]})`,
    "@odata.type": `#${entityType}`,
    ...entity
  };
}

/**
 * Formatea respuesta de entidad única según el estándar OData v4
 * @param {Object} entity - Entidad individual
 * @param {string} baseUrl - URL base del servicio
 * @param {string} entitySetName - Nombre del conjunto de entidades
 * @returns {Object} Respuesta formateada en OData v4
 */
function formatODataSingleEntity(entity, baseUrl, entitySetName) {
  if (!entity) {
    return null;
  }

  return {
    "@odata.context": `${baseUrl}/$metadata#${entitySetName}/$entity`,
    ...formatODataEntity(entity, baseUrl, entitySetName)
  };
}

/**
 * Genera el documento de metadatos OData para el servicio
 * @param {string} baseUrl - URL base del servicio
 * @returns {string} XML de metadatos OData
 */
function generateMetadata(baseUrl) {
  return `<?xml version="1.0" encoding="utf-8"?>
<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">
  <edmx:DataServices>
    <Schema Namespace="VirtualGenesysQueuesService" xmlns="http://docs.oasis-open.org/odata/ns/edm">
      <EntityType Name="VirtualGenesysQueue">
        <Key>
          <PropertyRef Name="ods_virtualgenesysqueueid"/>
        </Key>
        <Property Name="ods_virtualgenesysqueueid" Type="Edm.Guid" Nullable="false"/>
        <Property Name="ods_name" Type="Edm.String" Nullable="false" MaxLength="255"/>
        <Property Name="ods_description" Type="Edm.String" Nullable="true" MaxLength="512"/>
      </EntityType>
      <EntityContainer Name="Container">
        <EntitySet Name="ods_virtualgenesysqueue" EntityType="VirtualGenesysQueuesService.VirtualGenesysQueue"/>
      </EntityContainer>
    </Schema>
  </edmx:DataServices>
</edmx:Edmx>`;
}

/**
 * Genera el documento de servicio OData
 * @param {string} baseUrl - URL base del servicio
 * @returns {Object} Documento de servicio JSON
 */
function generateServiceDocument(baseUrl) {
  return {
    "@odata.context": `${baseUrl}/$metadata`,
    value: [
      {
        name: "ods_virtualgenesysqueue",
        kind: "EntitySet",
        url: "ods_virtualgenesysqueue"
      }
    ]
  };
}

/**
 * Maneja errores y los formatea según el estándar OData v4
 * @param {string} code - Código de error
 * @param {string} message - Mensaje de error
 * @param {Object} details - Detalles adicionales del error
 * @returns {Object} Error formateado en OData v4
 */
function formatODataError(code, message, details = {}) {
  return {
    error: {
      code: code,
      message: message,
      details: [
        {
          code: code,
          message: message,
          ...details
        }
      ]
    }
  };
}

module.exports = {
  formatODataCollection,
  formatODataEntity,
  formatODataSingleEntity,
  generateMetadata,
  generateServiceDocument,
  formatODataError
};