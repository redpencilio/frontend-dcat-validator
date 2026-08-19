import { htmlSafe } from '@ember/template';

export function severityOf(rule) {
  const uri = rule.severity ?? '';
  if (uri.includes('Warning')) return 'warning';
  if (uri.includes('Info')) return 'info';
  return 'violation';
}

export function severityViolations(cls, sev) {
  if (!cls.ruleSummaries) return 0;
  return [...cls.ruleSummaries]
    .filter((r) => severityOf(r) === sev)
    .reduce((sum, r) => sum + (r.violationCount ?? 0), 0);
}

export function rulesFor(cls, sev) {
  if (!cls.ruleSummaries) return [];
  return [...cls.ruleSummaries]
    .filter((r) => severityOf(r) === sev)
    .sort((a, b) => (b.violationCount ?? 0) - (a.violationCount ?? 0));
}

export function sortedClasses(summaries) {
  if (!summaries) return [];
  return [...summaries].sort((a, b) => {
    const score = (cls) =>
      severityViolations(cls, 'violation') * 1000 +
      severityViolations(cls, 'warning') * 10 +
      severityViolations(cls, 'info');
    const diff = score(b) - score(a);
    if (diff !== 0) return diff;
    return (b.resourceCount ?? 0) - (a.resourceCount ?? 0);
  });
}

export function totalResources(summaries) {
  if (!summaries) return 0;
  return [...summaries].reduce((sum, cls) => sum + (cls.resourceCount ?? 0), 0);
}

export function compliant(rule, cls) {
  return (cls.resourceCount ?? 0) - (rule.violationCount ?? 0);
}

export function compliancePct(rule, cls) {
  if (!cls.resourceCount) return 0;
  return Math.round((compliant(rule, cls) / cls.resourceCount) * 100);
}

export function barStyle(rule, cls) {
  return htmlSafe(`width:${compliancePct(rule, cls)}%`);
}

export function formatDate(d) {
  if (!d) return null;
  try {
    return new Intl.DateTimeFormat('en-GB', { dateStyle: 'long' }).format(new Date(d));
  } catch {
    return null;
  }
}

export function splitToArray(string, splitter, mapfn) {
  if (!string) return [];
  let res = string.split(splitter);
  if (mapfn) {
    res = res.map((item) => mapfn(item));
  }
  return res;
}
