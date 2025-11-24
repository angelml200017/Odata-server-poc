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
  <edmx:DataServices>
    <Schema Namespace="VirtualGenesysQueuesService" xmlns="http://docs.oasis-open.org/odata/ns/edm">
      
      <!-- Entity Type: Virtual Genesys Queue -->
      <EntityType Name="VirtualGenesysQueue">
        <Key>
          <PropertyRef Name="ods_virtualgenesysqueueid"/>
        </Key>
        <Property Name="ods_virtualgenesysqueueid" Type="Edm.Guid" Nullable="false">
          <Annotation Term="Org.OData.Core.V1.Permissions">
            <EnumMember>Org.OData.Core.V1.Permission/Read</EnumMember>
          </Annotation>
          <Annotation Term="Org.OData.Core.V1.Description" String="Unique identifier for the virtual queue"/>
        </Property>
        <Property Name="ods_name" Type="Edm.String" Nullable="false" MaxLength="255">
          <Annotation Term="Org.OData.Core.V1.Description" String="Name of the virtual queue"/>
        </Property>
        <Property Name="ods_description" Type="Edm.String" Nullable="true" MaxLength="512">
          <Annotation Term="Org.OData.Core.V1.Description" String="Detailed description of the queue purpose and functionality"/>
        </Property>
      </EntityType>

      <!-- Functions -->
      <Function Name="GetQueueByName" IsBound="false" IsComposable="true">
        <Parameter Name="queueName" Type="Edm.String" Nullable="false"/>
        <ReturnType Type="VirtualGenesysQueuesService.VirtualGenesysQueue" Nullable="true"/>
      </Function>

      <Function Name="SearchQueues" IsBound="false" IsComposable="true">
        <Parameter Name="searchTerm" Type="Edm.String" Nullable="false"/>
        <ReturnType Type="Collection(VirtualGenesysQueuesService.VirtualGenesysQueue)" Nullable="false"/>
      </Function>

      <!-- Actions -->
      <Action Name="ResetQueues">
        <ReturnType Type="Edm.Boolean" Nullable="false"/>
      </Action>

      <Action Name="ActivateQueue" IsBound="true">
        <Parameter Name="queue" Type="VirtualGenesysQueuesService.VirtualGenesysQueue" Nullable="false"/>
        <ReturnType Type="Edm.Boolean" Nullable="false"/>
      </Action>

      <!-- Entity Container -->
      <EntityContainer Name="DefaultContainer">
        <EntitySet Name="ods_virtualgenesysqueues" EntityType="VirtualGenesysQueuesService.VirtualGenesysQueue">
          
          <!-- Resource Path -->
          <Annotation Term="Org.OData.Core.V1.ResourcePath" String="ods_virtualgenesysqueues"/>
          
          <!-- Description -->
          <Annotation Term="Org.OData.Core.V1.Description" String="Collection of virtual Genesys queues for call routing and management"/>
          
          <!-- Search Restrictions -->
          <Annotation Term="Org.OData.Capabilities.V1.SearchRestrictions">
            <Record>
              <PropertyValue Property="Searchable" Bool="true"/>
              <PropertyValue Property="UnsupportedExpressions">
                <EnumMember>Org.OData.Capabilities.V1.SearchExpressions/none</EnumMember>
              </PropertyValue>
            </Record>
          </Annotation>

          <!-- Filter Restrictions -->
          <Annotation Term="Org.OData.Capabilities.V1.FilterRestrictions">
            <Record>
              <PropertyValue Property="Filterable" Bool="true"/>
              <PropertyValue Property="RequiresFilter" Bool="false"/>
              <PropertyValue Property="RequiredProperties">
                <Collection/>
              </PropertyValue>
              <PropertyValue Property="FilterExpressionRestrictions">
                <Collection>
                  <Record>
                    <PropertyValue Property="Property" PropertyPath="ods_name"/>
                    <PropertyValue Property="AllowedExpressions" String="SearchExpressions"/>
                  </Record>
                </Collection>
              </PropertyValue>
            </Record>
          </Annotation>

          <!-- Sort Restrictions -->
          <Annotation Term="Org.OData.Capabilities.V1.SortRestrictions">
            <Record>
              <PropertyValue Property="Sortable" Bool="true"/>
              <PropertyValue Property="AscendingOnlyProperties">
                <Collection/>
              </PropertyValue>
              <PropertyValue Property="DescendingOnlyProperties">
                <Collection/>
              </PropertyValue>
              <PropertyValue Property="NonSortableProperties">
                <Collection/>
              </PropertyValue>
            </Record>
          </Annotation>

          <!-- Expand Restrictions -->
          <Annotation Term="Org.OData.Capabilities.V1.ExpandRestrictions">
            <Record>
              <PropertyValue Property="Expandable" Bool="false"/>
            </Record>
          </Annotation>

          <!-- Insert Restrictions -->
          <Annotation Term="Org.OData.Capabilities.V1.InsertRestrictions">
            <Record>
              <PropertyValue Property="Insertable" Bool="true"/>
              <PropertyValue Property="NonInsertableNavigationProperties">
                <Collection/>
              </PropertyValue>
              <PropertyValue Property="MaxLevels" Int="1"/>
            </Record>
          </Annotation>

          <!-- Update Restrictions -->
          <Annotation Term="Org.OData.Capabilities.V1.UpdateRestrictions">
            <Record>
              <PropertyValue Property="Updatable" Bool="true"/>
              <PropertyValue Property="NonUpdatableNavigationProperties">
                <Collection/>
              </PropertyValue>
            </Record>
          </Annotation>

          <!-- Delete Restrictions -->
          <Annotation Term="Org.OData.Capabilities.V1.DeleteRestrictions">
            <Record>
              <PropertyValue Property="Deletable" Bool="true"/>
              <PropertyValue Property="NonDeletableNavigationProperties">
                <Collection/>
              </PropertyValue>
            </Record>
          </Annotation>

          <!-- Count Restrictions -->
          <Annotation Term="Org.OData.Capabilities.V1.CountRestrictions">
            <Record>
              <PropertyValue Property="Countable" Bool="true"/>
              <PropertyValue Property="NonCountableProperties">
                <Collection/>
              </PropertyValue>
              <PropertyValue Property="NonCountableNavigationProperties">
                <Collection/>
              </PropertyValue>
            </Record>
          </Annotation>

          <!-- Navigation Restrictions -->
          <Annotation Term="Org.OData.Capabilities.V1.NavigationRestrictions">
            <Record>
              <PropertyValue Property="Navigability">
                <EnumMember>Org.OData.Capabilities.V1.NavigationType/None</EnumMember>
              </PropertyValue>
              <PropertyValue Property="RestrictedProperties">
                <Collection/>
              </PropertyValue>
            </Record>
          </Annotation>

          <!-- Top Support -->
          <Annotation Term="Org.OData.Capabilities.V1.TopSupported" Bool="true"/>
          
          <!-- Skip Support -->
          <Annotation Term="Org.OData.Capabilities.V1.SkipSupported" Bool="true"/>

          <!-- Batch Support -->
          <Annotation Term="Org.OData.Capabilities.V1.BatchSupported" Bool="false"/>

        </EntitySet>

        <!-- Function Imports -->
        <FunctionImport Name="GetQueueByName" Function="VirtualGenesysQueuesService.GetQueueByName" EntitySet="ods_virtualgenesysqueues" IncludeInServiceDocument="true">
          <Annotation Term="Org.OData.Core.V1.Description" String="Retrieves a queue by its name"/>
        </FunctionImport>

        <FunctionImport Name="SearchQueues" Function="VirtualGenesysQueuesService.SearchQueues" EntitySet="ods_virtualgenesysqueues" IncludeInServiceDocument="true">
          <Annotation Term="Org.OData.Core.V1.Description" String="Searches queues by name or description"/>
        </FunctionImport>

        <!-- Action Imports -->
        <ActionImport Name="ResetQueues" Action="VirtualGenesysQueuesService.ResetQueues">
          <Annotation Term="Org.OData.Core.V1.Description" String="Resets all queues to default state"/>
        </ActionImport>

        <!-- Container Description -->
        <Annotation Term="Org.OData.Core.V1.Description" String="Virtual Genesys Queues Service provides access to call routing queues"/>
        
      </EntityContainer>

      <!-- Container-level Annotations -->
      <Annotations Target="VirtualGenesysQueuesService.DefaultContainer">
        
        <!-- Dereferenceable IDs -->
        <Annotation Term="Org.OData.Core.V1.DereferenceableIDs" Bool="true"/>
        
        <!-- Conventional IDs -->
        <Annotation Term="Org.OData.Core.V1.ConventionalIDs" Bool="true"/>
        
        <!-- Conformance Level -->
        <Annotation Term="Org.OData.Capabilities.V1.ConformanceLevel">
          <EnumMember>Org.OData.Capabilities.V1.ConformanceLevelType/Advanced</EnumMember>
        </Annotation>

        <!-- Supported Formats -->
        <Annotation Term="Org.OData.Capabilities.V1.SupportedFormats">
          <Collection>
            <String>application/json;odata.metadata=full;IEEE754Compatible=false;odata.streaming=true</String>
            <String>application/json;odata.metadata=minimal;IEEE754Compatible=false;odata.streaming=true</String>
            <String>application/json;odata.metadata=none;IEEE754Compatible=false;odata.streaming=true</String>
          </Collection>
        </Annotation>

        <!-- Asynchronous Requests Support -->
        <Annotation Term="Org.OData.Capabilities.V1.AsynchronousRequestsSupported" Bool="false"/>
        
        <!-- Batch Continue on Error -->
        <Annotation Term="Org.OData.Capabilities.V1.BatchContinueOnErrorSupported" Bool="false"/>

        <!-- Change Tracking -->
        <Annotation Term="Org.OData.Capabilities.V1.ChangeTracking">
          <Record>
            <PropertyValue Property="Supported" Bool="false"/>
          </Record>
        </Annotation>

        <!-- Filter Functions -->
        <Annotation Term="Org.OData.Capabilities.V1.FilterFunctions">
          <Collection>
            <String>contains</String>
            <String>endswith</String>
            <String>startswith</String>
            <String>length</String>
            <String>indexof</String>
            <String>substring</String>
            <String>tolower</String>
            <String>toupper</String>
            <String>trim</String>
            <String>concat</String>
            <String>year</String>
            <String>month</String>
            <String>day</String>
            <String>hour</String>
            <String>minute</String>
            <String>second</String>
            <String>round</String>
            <String>floor</String>
            <String>ceiling</String>
            <String>cast</String>
            <String>isof</String>
          </Collection>
        </Annotation>

        <!-- Key as Segment Support -->
        <Annotation Term="Org.OData.Capabilities.V1.KeyAsSegmentSupported" Bool="true"/>

        <!-- Query Segment Support -->
        <Annotation Term="Org.OData.Capabilities.V1.QuerySegmentSupported" Bool="true"/>

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