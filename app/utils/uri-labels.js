const PREFIX_MAP = [
  ['adms',   'http://www.w3.org/ns/adms#'],
  ['cnt',    'http://www.w3.org/2011/content#'],
  ['dcat',   'http://www.w3.org/ns/dcat#'],
  ['dcatap',         'http://data.europa.eu/r5r/'],
  ['mobilitydcatap', 'https://w3id.org/mobilitydcat-ap#'],
  ['dct',    'http://purl.org/dc/terms/'],
  ['dqv',    'http://www.w3.org/ns/dqv#'],
  ['foaf',   'http://xmlns.com/foaf/0.1/'],
  ['locn',   'http://www.w3.org/ns/locn#'],
  ['oa',     'https://www.w3.org/ns/oa#'],
  ['org',    'http://www.w3.org/ns/org#'],
  ['owl',    'http://www.w3.org/2002/07/owl#'],
  ['rdf',    'http://www.w3.org/1999/02/22-rdf-syntax-ns#'],
  ['rdfs',   'http://www.w3.org/2000/01/rdf-schema#'],
  ['sh',     'http://www.w3.org/ns/shacl#'],
  ['skos',   'http://www.w3.org/2004/02/skos/core#'],
  ['spdx',   'http://spdx.org/rdf/terms#'],
  ['vcard',  'http://www.w3.org/2006/vcard/ns#'],
  ['xsd',    'http://www.w3.org/2001/XMLSchema#'],
];

export default function shortLabel(uri) {
  if (!uri) return '—';
  for (const [prefix, ns] of PREFIX_MAP) {
    if (uri.startsWith(ns)) return `${prefix}:${uri.slice(ns.length)}`;
  }
  const local = uri.includes('#') ? uri.split('#').at(-1) : uri.split('/').at(-1);
  return local || uri;
}
