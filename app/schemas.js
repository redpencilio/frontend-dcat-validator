export const validationJobSchema = {
  type: 'validation-jobs',
  identity: { kind: '@id', name: 'id' },
  fields: [
    { kind: 'field', name: 'endpointUrl', sourceKey: 'endpoint-url' },
    { kind: 'field', name: 'status' },
    { kind: 'field', name: 'createdAt', sourceKey: 'created-at' },
    { kind: 'field', name: 'modifiedAt', sourceKey: 'modified-at' },
    { kind: 'field', name: 'pagesFetched', sourceKey: 'pages-fetched' },
    { kind: 'field', name: 'totalPages', sourceKey: 'total-pages' },
    { kind: 'field', name: 'datasetsFound', sourceKey: 'datasets-found' },
    { kind: 'field', name: 'errorMessage', sourceKey: 'error-message' },
    { kind: 'field', name: 'cached' },
    {
      kind: 'field',
      name: 'cachedFromAgeHours',
      sourceKey: 'cached-from-age-hours',
    },
    {
      kind: 'resource',
      name: 'report',
      type: 'validation-reports',
      options: { async: true, inverse: null },
    },
  ],
};

export const validationReportSchema = {
  type: 'validation-reports',
  identity: { kind: '@id', name: 'id' },
  fields: [
    { kind: 'field', name: 'endpointUrl', sourceKey: 'endpoint-url' },
    { kind: 'field', name: 'overallScore', sourceKey: 'overall-score' },
    { kind: 'field', name: 'datasetCount', sourceKey: 'dataset-count' },
    { kind: 'field', name: 'errorCount', sourceKey: 'error-count' },
    { kind: 'field', name: 'warningCount', sourceKey: 'warning-count' },
    { kind: 'field', name: 'infoCount', sourceKey: 'info-count' },
    {
      kind: 'field',
      name: 'completenessScore',
      sourceKey: 'completeness-score',
    },
    { kind: 'field', name: 'createdAt', sourceKey: 'created-at' },
    { kind: 'field', name: 'expiresAt', sourceKey: 'expires-at' },
    {
      kind: 'resource',
      name: 'job',
      type: 'jobs',
      options: { async: true, inverse: null },
    },
    {
      kind: 'collection',
      name: 'violations',
      type: 'violations',
      options: { async: true, inverse: null },
    },
  ],
};

export const violationSchema = {
  type: 'violations',
  identity: { kind: '@id', name: 'id' },
  fields: [
    { kind: 'field', name: 'severity' },
    { kind: 'field', name: 'layer' },
    { kind: 'field', name: 'checkType', sourceKey: 'check-type' },
    { kind: 'field', name: 'resourceUri', sourceKey: 'resource-uri' },
    { kind: 'field', name: 'resourceType', sourceKey: 'resource-type' },
    { kind: 'field', name: 'message' },
    { kind: 'field', name: 'recommendation' },
    {
      kind: 'resource',
      name: 'report',
      type: 'validation-reports',
      options: { async: true, inverse: null },
    },
  ],
};

export const endpointSchema = {
  type: 'endpoints',
  identity: { kind: '@id', name: 'id' },
  fields: [
    { kind: 'field', name: 'url' },
    { kind: 'field', name: 'label' },
    { kind: 'field', name: 'country' },
    {
      kind: 'field',
      name: 'lastValidatedAt',
      sourceKey: 'last-validated-at',
    },
  ],
};

export const schemas = [
  validationJobSchema,
  validationReportSchema,
  violationSchema,
  endpointSchema,
];
