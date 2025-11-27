/**
 * Utilidades para formatear respuestas en formato OData v4
 */

/**
 * Formatea una colección de entidades según el estándar OData v4
 * @param {Array} entities - Array de entidades a formatear
 * @param {string} baseUrl - URL base del servicio
 * @param {string} entitySetName - Nombre del conjunto de entidades
 * @param {Object} queryParams - Parámetros de consulta ($top, $skip, etc.)
* * @param {number} totalCount - Total de registros antes de paginación (opcional)
 * @returns {Object} Respuesta formateada en OData v4
 */
function formatODataCollection(entities, baseUrl, entitySetName, queryParams = {}, totalCount = null) {
  const { $top, $skip = 0, $count, $select, $filter, $orderby, $search } = queryParams;
  
  // Determinar si hay más resultados ANTES de aplicar $top
  const hasMore = $top && entities.length > $top;
  
  // Aplicar paginación si se especifica $top (tomar solo los elementos a mostrar)
  let pagedEntities = entities;
  if ($top) {
    pagedEntities = entities.slice(0, $top);
  }

  const response = {
    "@odata.context": `${baseUrl}/$metadata#${entitySetName}`,
    value: pagedEntities.map(entity => formatODataEntity(entity, baseUrl, entitySetName))
  };

  // Agregar count si se solicita
  if ($count) {
    response["@odata.count"] = totalCount !== null ? totalCount : entities.length;
  }

  // Construir nextLink SOLO si hay más resultados
  if (hasMore) {
    const nextSkip = $skip + $top;
    const queryParts = [];
    
    // Preservar el $select original en el nextLink
    if ($select) {
      queryParts.push(`$select=${Array.isArray($select) ? $select.join(',') : $select}`);
    }
    
    // Preservar el $filter original
    if ($filter) {
      queryParts.push(`$filter=${encodeURIComponent($filter)}`);
    }
    
    // Preservar el $orderby original
    if ($orderby) {
      queryParts.push(`$orderby=${encodeURIComponent($orderby)}`);
    }
    
    // Preservar el $search original
    if ($search) {
      queryParts.push(`$search=${encodeURIComponent($search)}`);
    }
    
    // Agregar $skip y $top para la siguiente página
    queryParts.push(`$skip=${nextSkip}`);
    queryParts.push(`$top=${$top}`);
    
    // Agregar $count si estaba en la petición original
    if ($count) {
      queryParts.push('$count=true');
    }
    
    response["@odata.nextLink"] = `${baseUrl}/${entitySetName}?${queryParts.join('&')}`;
    
    console.log(`🔗 nextLink generado: $skip=${nextSkip}, $top=${$top} (${entities.length - $top} resultados restantes)`);
  } else {
    // No agregar @odata.nextLink si no hay más páginas (omitir la propiedad completamente)
    console.log(`✅ No hay más resultados - nextLink omitido`);
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
  const idField = 'ods_virtualgenesysqueueid';
  
  // IMPORTANTE: @odata.type DEBE ser la primera propiedad según OData v4
  return {
    "@odata.type": "#space.ods_virtualgenesysqueue",
    "@odata.id": `${baseUrl}/${entitySetName}(${entity[idField]})`,
    "@odata.editLink": `${entitySetName}(${entity[idField]})`,
    "@odata.etag": `W/"${entity.versionnumber || '1'}"`,
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

  const idField = 'ods_virtualgenesysqueueid';
  
  // IMPORTANTE: @odata.context primero, @odata.type segundo según OData v4
  return {
    "@odata.context": `${baseUrl}/$metadata#${entitySetName}/$entity`,
    "@odata.type": "#space.ods_virtualgenesysqueue",
    "@odata.id": `${baseUrl}/${entitySetName}(${entity[idField]})`,
    "@odata.editLink": `${entitySetName}(${entity[idField]})`,
    "@odata.etag": `W/"${entity.versionnumber || '1'}"`,
    ...entity
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
    <edmx:Reference Uri="https://vocabularies.odata.org/OData.Community.Keys.V1.xml">
        <edmx:Include Namespace="OData.Community.Keys.V1" Alias="Keys"/>
    </edmx:Reference>
    <edmx:Reference Uri="https://vocabularies.odata.org/OData.Community.Display.V1.xml">
        <edmx:Include Namespace="OData.Community.Display.V1" Alias="Display"/>
    </edmx:Reference>
    <edmx:DataServices>
            <Schema Namespace="Space.OData" Alias="space" xmlns="http://docs.oasis-open.org/odata/ns/edm">
              <EntityType Name="spacebaseentity" Abstract="true" />
              <EntityType Name="ods_virtualgenesysqueue" BaseType="space.spacebaseentity">
                <Key>
                    <PropertyRef Name="ods_virtualgenesysqueueid"/>
                </Key>
                <Property Name="ods_virtualgenesysqueueid" Type="Edm.Guid" Nullable="false"/>
                <Property Name="ods_name" Type="Edm.String"/>
                <Property Name="ods_description" Type="Edm.String"/>
                <Property Name="createdon" Type="Edm.DateTimeOffset"/>
                <Property Name="modifiedon" Type="Edm.DateTimeOffset"/>
                <Property Name="statecode" Type="Edm.Int32"/>
                <Property Name="statuscode" Type="Edm.Int32"/>
                <Property Name="versionnumber" Type="Edm.Int64"/>
            </EntityType>
            <EntityContainer Name="ServiceContext">
                <EntitySet Name="ods_virtualgenesysqueues" EntityType="space.ods_virtualgenesysqueue"/>
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
        name: "ods_virtualgenesysqueues",
        kind: "EntitySet",
        url: "ods_virtualgenesysqueues"
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