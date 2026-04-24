export const validationJobSchema = {
  type: 'validation-jobs',
  identity: { kind: '@id', name: 'id' },
  fields: [
    { kind: 'field', name: 'endpointUrl', sourceKey: 'endpoint-url' },
    { kind: 'field', name: 'status' },
    { kind: 'field', name: 'createdAt', sourceKey: 'created' },
    { kind: 'field', name: 'modifiedAt', sourceKey: 'modified' },
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
    { kind: 'field', name: 'creator' },
    { kind: 'field', name: 'operation' },
    { kind: 'field', name: 'uri' },
    {
      kind: 'resource',
      name: 'shacl-report',
      type: 'validation-summaries',
      options: { async: true, inverse: null },
    },
    {
      kind: 'resource',
      name: 'coverage-report',
      type: 'validation-summaries',
      options: { async: true, inverse: null },
    },
  ],
};

export const validationSummarySchema = {
  type: 'validation-summaries',
  identity: { kind: '@id', name: 'id' },
  fields: [
    { kind: 'field', name: 'endpointUrl', sourceKey: 'endpoint-url' },
    { kind: 'field', name: 'totalViolations', sourceKey: 'total-violations' },
    { kind: 'field', name: 'uri' },
    {
      kind: 'hasMany',
      name: 'targetClassSummaries',
      type: 'target-class-summaries',
      sourceKey: 'target-class-summaries',
      options: { async: false, linksMode: true, inverse: null },
    },
    {
      kind: 'resource',
      name: 'shacl-job',
      type: 'validation-jobs',
      options: { async: true, inverse: null },
    },
    {
      kind: 'resource',
      name: 'coverage-job',
      type: 'validation-jobs',
      options: { async: true, inverse: null },
    },
  ],
};

export const targetClassSummarySchema = {
  type: 'target-class-summaries',
  identity: { kind: '@id', name: 'id' },
  fields: [
    { kind: 'field', name: 'targetClass', sourceKey: 'target-class' },
    { kind: 'field', name: 'resourceCount', sourceKey: 'resource-count' },
    { kind: 'field', name: 'uri' },
    {
      kind: 'hasMany',
      name: 'ruleSummaries',
      type: 'rule-summaries',
      sourceKey: 'rule-summaries',
      options: { async: false, linksMode: true, inverse: null },
    },
    {
      kind: 'resource',
      name: 'validation-summary',
      type: 'validation-summaries',
      options: { async: true, inverse: null },
    },
  ],
};

export const ruleSummarySchema = {
  type: 'rule-summaries',
  identity: { kind: '@id', name: 'id' },
  fields: [
    { kind: 'field', name: 'violationCount', sourceKey: 'violation-count' },
    { kind: 'field', name: 'ruleConstraint', sourceKey: 'rule-constraint' },
    { kind: 'field', name: 'severity' },
    { kind: 'field', name: 'uri' },
    {
      kind: 'resource',
      name: 'target-class-summary',
      type: 'target-class-summaries',
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
  validationSummarySchema,
  targetClassSummarySchema,
  ruleSummarySchema,
  endpointSchema,
];
