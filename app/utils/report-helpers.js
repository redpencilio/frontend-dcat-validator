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
    .reduce(
      (sum, r) => sum + (r.violationCount ?? 0) + (r.vocabViolationCount ?? 0),
      0,
    );
}

export function rulesFor(cls, sev) {
  if (!cls.ruleSummaries) return [];
  return [...cls.ruleSummaries]
    .filter((r) => severityOf(r) === sev)
    .sort((a, b) => {
      const aViolations =
        (a.violationCount ?? 0) + (a.vocabViolationCount ?? 0);
      const bViolations =
        (b.violationCount ?? 0) + (b.vocabViolationCount ?? 0);
      return bViolations - aViolations;
    });
}

export function violationsData(rule) {
  let rawTerms = [];
  if (rule?.ruleViolations?.length) {
    rawTerms = [...rule.ruleViolations].map((r) =>
      typeof r === 'string' ? r : r.value,
    );
  } else if (rule?.message) {
    rawTerms = splitToArray(rule.message, ', ');
  }

  const terms = rawTerms.filter(Boolean);
  let hasMore = false;

  if (terms.length > 10) {
    hasMore = true;
    terms.splice(10);
  } else if (
    terms.length === 10 &&
    (rule?.vocabViolationCount || 0) > terms.length
  ) {
    hasMore = true;
  }

  return {
    terms,
    hasMore,
    isSingular: terms.length === 1 && !hasMore,
  };
}

export function violationsFor(rule) {
  return violationsData(rule).terms;
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

export function ruleStats(rule, cls) {
  const total = cls?.resourceCount ?? 0;
  const missing = rule?.violationCount ?? 0;
  const covered = Math.max(0, total - missing);
  const vocabInvalid = Math.min(covered, rule?.vocabViolationCount ?? 0);
  const valid = Math.max(0, covered - vocabInvalid);

  const coveredPct = total > 0 ? Math.round((covered / total) * 100) : 0;
  const validPct = total > 0 ? Math.round((valid / total) * 100) : 0;
  const vocabInvalidPct =
    total > 0 ? Math.round((vocabInvalid / total) * 100) : 0;
  const missingPct = total > 0 ? Math.round((missing / total) * 100) : 0;

  const validWidthPct = total > 0 ? (valid / total) * 100 : 0;
  const vocabInvalidWidthPct = total > 0 ? (vocabInvalid / total) * 100 : 0;
  const missingWidthPct = total > 0 ? (missing / total) * 100 : 0;

  return {
    total,
    missing,
    covered,
    vocabInvalid,
    valid,
    coveredPct,
    validPct,
    vocabInvalidPct,
    missingPct,
    hasVocabViolation: vocabInvalid > 0,
    validWidthStyle: htmlSafe(`width:${validWidthPct}%`),
    vocabInvalidWidthStyle: htmlSafe(`width:${vocabInvalidWidthPct}%`),
    missingWidthStyle: htmlSafe(`width:${missingWidthPct}%`),
  };
}

export function mergedClassSummaries(coverSummaries, vocabReport) {
  const vocabSummaries = vocabReport?.targetClassSummaries;
  if (!vocabSummaries?.length) return coverSummaries;

  const vocabs = [];
  for (const vc of vocabSummaries) vocabs.push(vc);
  if (!vocabs.length) return coverSummaries;

  const vocabByClass = {};
  for (const vc of vocabs) {
    vocabByClass[vc.targetClass] = vc;
  }

  const result = [];
  for (const cs of coverSummaries) {
    const vc = vocabByClass[cs.targetClass];
    if (!vc) {
      result.push(cs);
      continue;
    }

    const vocabRules = [];
    for (const vrs of vc.ruleSummaries ?? []) vocabRules.push(vrs);
    if (!vocabRules.length) {
      result.push(cs);
      continue;
    }

    const vocabByConstraint = {};
    for (const vrs of vocabRules) {
      vocabByConstraint[vrs.ruleConstraint] = vrs;
    }

    const mergedRules = [];
    for (const rs of cs.ruleSummaries ?? []) {
      const vrs = vocabByConstraint[rs.ruleConstraint];
      if (vrs) {
        delete vocabByConstraint[rs.ruleConstraint];
        mergedRules.push({
          ruleConstraint: rs.ruleConstraint,
          violationCount: rs.violationCount ?? 0,
          vocabViolationCount: vrs.violationCount ?? 0,
          severity: rs.severity,
          message: vrs.message ?? null,
          ruleViolations: vrs?.ruleViolations ?? rs?.ruleViolations ?? [],
        });
      } else {
        mergedRules.push({
          ruleConstraint: rs.ruleConstraint,
          violationCount: rs.violationCount ?? 0,
          vocabViolationCount: 0,
          severity: rs.severity,
          message: null,
          ruleViolations: rs?.ruleViolations ?? [],
        });
      }
    }

    for (const vrs of Object.values(vocabByConstraint)) {
      mergedRules.push({
        ruleConstraint: vrs.ruleConstraint,
        violationCount: 0,
        vocabViolationCount: vrs.violationCount ?? 0,
        severity: vrs.severity,
        message: vrs.message ?? null,
        ruleViolations: vrs.ruleViolations ?? [],
      });
    }

    result.push({
      targetClass: cs.targetClass,
      resourceCount: cs.resourceCount,
      ruleSummaries: mergedRules,
    });
  }

  return result;
}

export function formatDate(d) {
  if (!d) return null;
  try {
    return new Intl.DateTimeFormat('en-GB', { dateStyle: 'long' }).format(
      new Date(d),
    );
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
