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
  const entityType = entitySetName === 'ods_virtualgenesysqueues' ? 'VirtualGenesysQueue' : entitySetName.slice(0, -1);
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
  <edmx:Reference Uri="https://vocabularies.odata.org/OData.Community.Keys.V1.xml">
    <edmx:Include Namespace="OData.Community.Keys.V1" Alias="Keys"/>
  </edmx:Reference>
  <edmx:Reference Uri="https://vocabularies.odata.org/OData.Community.Display.V1.xml">
    <edmx:Include Namespace="OData.Community.Display.V1" Alias="Display"/>
  </edmx:Reference>
  <edmx:DataServices>
    <Schema Namespace="Microsoft.Dynamics.CRM" Alias="mscrm" xmlns="http://docs.oasis-open.org/odata/ns/edm">
      
      <!-- Virtual Genesys Queue Entity -->
      <EntityType Name="ods_virtualgenesysqueue">
         <Key>
          <PropertyRef Name="ods_virtualgenesysqueueid"/>
        </Key>
        <Property Name="ods_virtualgenesysqueueid" Type="Edm.Guid" Nullable="false"/>
        <Property Name="ods_name" Type="Edm.String" MaxLength="255">
          <Annotation Term="Org.OData.Core.V1.Description" String="Name of the virtual queue"/>
        </Property>
        <Property Name="ods_description" Type="Edm.String" MaxLength="512">
          <Annotation Term="Org.OData.Core.V1.Description" String="Description of the virtual queue"/>
        </Property>
        <Property Name="createdon" Type="Edm.DateTimeOffset">
          <Annotation Term="Org.OData.Core.V1.Description" String="Date and time when the record was created"/>
        </Property>
        <Property Name="modifiedon" Type="Edm.DateTimeOffset">
          <Annotation Term="Org.OData.Core.V1.Description" String="Date and time when the record was modified"/>
        </Property>
        <Property Name="statecode" Type="Edm.Int32">
          <Annotation Term="Org.OData.Core.V1.Description" String="Status of the virtual queue"/>
        </Property>
        <Property Name="statuscode" Type="Edm.Int32">
          <Annotation Term="Org.OData.Core.V1.Description" String="Reason for the status of the virtual queue"/>
        </Property>
      </EntityType>
      
      <!-- Entity Container -->
      <EntityContainer Name="ServiceContext">
        <EntitySet Name="ods_virtualgenesysqueues" EntityType="mscrm.ods_virtualgenesysqueue">
          <Annotation Term="Org.OData.Core.V1.Description" String="Virtual Genesys queues for call center management"/>
          <Annotation Term="Org.OData.Capabilities.V1.SearchRestrictions">
            <Record>
              <PropertyValue Property="Searchable" Bool="true"/>
            </Record>
          </Annotation>
          <Annotation Term="Org.OData.Capabilities.V1.InsertRestrictions">
            <Record>
              <PropertyValue Property="Insertable" Bool="false"/>
            </Record>
          </Annotation>
          <Annotation Term="Org.OData.Capabilities.V1.UpdateRestrictions">
            <Record>
              <PropertyValue Property="Updatable" Bool="false"/>
            </Record>
          </Annotation>
          <Annotation Term="Org.OData.Capabilities.V1.DeleteRestrictions">
            <Record>
              <PropertyValue Property="Deletable" Bool="false"/>
            </Record>
          </Annotation>
        </EntitySet>
      </EntityContainer>
      
      <!-- Annotations -->
      <Annotations Target="Microsoft.Dynamics.CRM.ServiceContext">
        <Annotation Term="Org.OData.Capabilities.V1.ConformanceLevel">
          <EnumMember>Org.OData.Capabilities.V1.ConformanceLevelType/Advanced</EnumMember>
        </Annotation>
        <Annotation Term="Org.OData.Capabilities.V1.SupportedFormats">
          <Collection>
            <String>application/json;odata.metadata=full</String>
            <String>application/json;odata.metadata=minimal</String>
            <String>application/json;odata.metadata=none</String>
          </Collection>
        </Annotation>
        <Annotation Term="Org.OData.Capabilities.V1.FilterFunctions">
          <Collection>
            <String>contains</String>
            <String>endswith</String>
            <String>startswith</String>
            <String>tolower</String>
            <String>toupper</String>
            <String>trim</String>
            <String>length</String>
            <String>year</String>
            <String>month</String>
            <String>day</String>
            <String>hour</String>
            <String>minute</String>
            <String>second</String>
          </Collection>
        </Annotation>
      </Annotations>
      
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