export const validationJobSchema = {
  type: 'validation-job',
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
    {
      kind: 'resource',
      name: 'report',
      type: 'validation-report',
      options: { async: true, inverse: 'job' },
    },
  ],
};

export const validationReportSchema = {
  type: 'validation-report',
  identity: { kind: '@id', name: 'id' },
  fields: [
    { kind: 'field', name: 'endpointUrl', sourceKey: 'endpoint-url' },
    { kind: 'field', name: 'overallScore', sourceKey: 'overall-score' },
    { kind: 'field', name: 'datasetCount', sourceKey: 'dataset-count' },
    { kind: 'field', name: 'errorCount', sourceKey: 'error-count' },
    { kind: 'field', name: 'warningCount', sourceKey: 'warning-count' },
    { kind: 'field', name: 'infoCount', sourceKey: 'info-count' },
    { kind: 'field', name: 'completenessScore', sourceKey: 'completeness-score' },
    { kind: 'field', name: 'createdAt', sourceKey: 'created-at' },
    { kind: 'field', name: 'expiresAt', sourceKey: 'expires-at' },
    {
      kind: 'resource',
      name: 'job',
      type: 'validation-job',
      options: { async: true, inverse: 'report' },
    },
    {
      kind: 'collection',
      name: 'violations',
      type: 'violation',
      options: { async: true, inverse: 'report' },
    },
  ],
};

export const violationSchema = {
  type: 'violation',
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
      type: 'validation-report',
      options: { async: true, inverse: 'violations' },
    },
  ],
};

export const endpointSchema = {
  type: 'endpoint',
  identity: { kind: '@id', name: 'id' },
  fields: [
    { kind: 'field', name: 'url' },
    { kind: 'field', name: 'label' },
    { kind: 'field', name: 'country' },
    { kind: 'field', name: 'lastValidatedAt', sourceKey: 'last-validated-at' },
  ],
};

export const schemas = [
  validationJobSchema,
  validationReportSchema,
  violationSchema,
  endpointSchema,
];
