import { htmlSafe } from '@ember/template';

const SPEC_LINKS = {
  '1.1.0': {
    label: 'mobilityDCAT-AP 1.1.0',
    url: 'https://mobilitydcat-ap.github.io/mobilityDCAT-AP/releases/1.1.0/index.html',
  },
  '3.0.0': {
    label: 'mobilityDCAT-AP 3.0.0',
    url: 'https://mobilitydcat-ap.github.io/mobilityDCAT-AP/drafts/latest/index.html',
  },
};

export function specInfo(version) {
  return SPEC_LINKS[version] || SPEC_LINKS['1.1.0'];
}

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

export function overallTierStats(classSummaries, severity) {
  if (!classSummaries || !classSummaries.length) {
    return {
      totalExpected: 0,
      totalCovered: 0,
      totalValid: 0,
      totalVocabInvalid: 0,
      totalMissing: 0,
      validPct: 100,
      coveredPct: 100,
      hasVocabInvalid: false,
      validWidthStyle: htmlSafe('width:100%'),
      vocabInvalidWidthStyle: htmlSafe('width:0%'),
    };
  }

  let totalExpected = 0;
  let totalCovered = 0;
  let totalValid = 0;
  let totalVocabInvalid = 0;
  let totalMissing = 0;

  for (const cls of classSummaries) {
    const resourceCount = cls.resourceCount || 0;
    if (resourceCount === 0) continue;

    for (const rule of cls.ruleSummaries || []) {
      if (severityOf(rule) !== severity) continue;

      const missing = rule.violationCount || 0;
      const covered = Math.max(0, resourceCount - missing);
      const vocabInvalid = Math.min(covered, rule.vocabViolationCount || 0);
      const valid = Math.max(0, covered - vocabInvalid);

      totalExpected += resourceCount;
      totalMissing += missing;
      totalCovered += covered;
      totalVocabInvalid += vocabInvalid;
      totalValid += valid;
    }
  }

  const validPct =
    totalExpected > 0 ? Math.round((totalValid / totalExpected) * 100) : 100;
  const coveredPct =
    totalExpected > 0 ? Math.round((totalCovered / totalExpected) * 100) : 100;

  const validWidthPct =
    totalExpected > 0 ? (totalValid / totalExpected) * 100 : 100;
  const vocabInvalidWidthPct =
    totalExpected > 0 ? (totalVocabInvalid / totalExpected) * 100 : 0;

  return {
    totalExpected,
    totalCovered,
    totalValid,
    totalVocabInvalid,
    totalMissing,
    validPct,
    coveredPct,
    hasVocabInvalid: totalVocabInvalid > 0,
    validWidthStyle: htmlSafe(`width:${validWidthPct}%`),
    vocabInvalidWidthStyle: htmlSafe(`width:${vocabInvalidWidthPct}%`),
  };
}

export function isIgnoredShaclConstraint(rule) {
  const constraint = rule?.constraint || '';
  if (constraint.includes('MinCountConstraintComponent')) {
    return true;
  }
  if (
    constraint.endsWith('#InConstraintComponent') ||
    constraint === 'InConstraintComponent' ||
    (constraint.includes('InConstraintComponent') &&
      !constraint.includes('LanguageInConstraintComponent'))
  ) {
    return true;
  }
  const msg = (rule?.message || '').toLowerCase();
  if (
    msg.includes('at least one') ||
    msg.includes('exactly one value must be provided') ||
    msg.includes('is mandatory. exactly one')
  ) {
    return true;
  }
  return false;
}

export function formatShaclMessage(message) {
  if (!message) return null;

  const trimmed = message.trim();

  // 1. NodeKindConstraint translations
  if (/^Value is not of Node Kind sh:BlankNodeOrIRI$/i.test(trimmed)) {
    return 'Value must be a valid URI resource (<https://...>), not a text string.';
  }
  if (/^Value is not of Node Kind sh:IRI$/i.test(trimmed)) {
    return 'Value must be a valid URI resource (<https://...>), not a text string.';
  }
  if (/^Value is not of Node Kind sh:Literal$/i.test(trimmed)) {
    return 'Value must be a text string literal, not a URI resource.';
  }
  if (/^Value is not of Node Kind sh:BlankNode$/i.test(trimmed)) {
    return 'Value must be a blank node resource.';
  }

  // 2. pySHACL "must conform to one or more shapes in [ sh:pattern ... ]"
  const orPatternMatch = message.match(
    /Node\s+<([^>]+)>\s+must conform to one or more shapes in\s+(.*)/i,
  );
  if (orPatternMatch) {
    const invalidNode = orPatternMatch[1];
    const rest = orPatternMatch[2];
    const patterns = [];
    const patternRegex = /Literal\("([^"]+)"\)/g;
    let match;
    while ((match = patternRegex.exec(rest)) !== null) {
      let clean = match[1]
        .replace(/^\^/, '')
        .replace(/\$$/, '')
        .replace(/\\\./g, '.')
        .replace(/\.\+/g, '*');
      patterns.push(clean);
    }
    if (patterns.length > 0) {
      return `Invalid URI <${invalidNode}>. Must match: ${patterns.join(' or ')}`;
    }
  }

  // 3. pySHACL single pattern match failure
  const singlePatternMatch = message.match(
    /Node\s+<([^>]+)>\s+does not match\s+pattern\s+(?:Literal\("([^"]+)"\)|"([^"]+)")/i,
  );
  if (singlePatternMatch) {
    const invalidNode = singlePatternMatch[1];
    const rawPattern = singlePatternMatch[2] || singlePatternMatch[3];
    const cleanPattern = rawPattern
      .replace(/^\^/, '')
      .replace(/\$$/, '')
      .replace(/\\\./g, '.')
      .replace(/\.\+/g, '*');
    return `Invalid URI <${invalidNode}>. Must match: ${cleanPattern}`;
  }

  // 4. Clean up generic Literal("...") or escaped dots from other messages
  return message.replace(/Literal\("([^"]+)"\)/g, '$1').replace(/\\\./g, '.');
}

export function mergedClassSummaries(coverSummaries, vocabReport, shaclReport) {
  if (!coverSummaries) return [];

  const vocabByClass = {};
  if (vocabReport?.targetClassSummaries) {
    for (const vc of vocabReport.targetClassSummaries) {
      if (!vc?.targetClass) continue;
      const rules = {};
      for (const vrs of vc.ruleSummaries ?? []) {
        if (vrs?.ruleConstraint) {
          rules[vrs.ruleConstraint] = vrs;
        }
      }
      vocabByClass[vc.targetClass] = rules;
    }
  }

  const shaclByClass = {};
  if (shaclReport?.targetClassSummaries) {
    for (const sc of shaclReport.targetClassSummaries) {
      if (!sc?.targetClass) continue;
      const issuesByProp = {};
      for (const srs of sc.ruleSummaries ?? []) {
        if (isIgnoredShaclConstraint(srs)) continue;
        if (!srs?.ruleConstraint) continue;
        if (!issuesByProp[srs.ruleConstraint]) {
          issuesByProp[srs.ruleConstraint] = [];
        }
        issuesByProp[srs.ruleConstraint].push({
          ruleConstraint: srs.ruleConstraint,
          constraint: srs.constraint,
          severity: srs.severity,
          message: formatShaclMessage(srs.message),
          count: srs.violationCount ?? 0,
        });
      }
      shaclByClass[sc.targetClass] = issuesByProp;
    }
  }

  const result = [];
  for (const cs of coverSummaries) {
    const vocabRules = { ...(vocabByClass[cs.targetClass] || {}) };
    const shaclRules = { ...(shaclByClass[cs.targetClass] || {}) };

    const mergedRules = [];
    for (const rs of cs.ruleSummaries ?? []) {
      const vrs = vocabRules[rs.ruleConstraint];
      if (vrs) delete vocabRules[rs.ruleConstraint];

      const sIssues = shaclRules[rs.ruleConstraint] || [];
      if (shaclRules[rs.ruleConstraint]) delete shaclRules[rs.ruleConstraint];

      mergedRules.push({
        ruleConstraint: rs.ruleConstraint,
        violationCount: rs.violationCount ?? 0,
        vocabViolationCount: vrs?.violationCount ?? 0,
        severity: rs.severity,
        message: vrs?.message ?? null,
        ruleViolations: vrs?.ruleViolations ?? rs?.ruleViolations ?? [],
        shaclIssues: sIssues,
      });
    }

    for (const vrs of Object.values(vocabRules)) {
      const sIssues = shaclRules[vrs.ruleConstraint] || [];
      if (shaclRules[vrs.ruleConstraint]) delete shaclRules[vrs.ruleConstraint];

      mergedRules.push({
        ruleConstraint: vrs.ruleConstraint,
        violationCount: 0,
        vocabViolationCount: vrs.violationCount ?? 0,
        severity: vrs.severity,
        message: vrs.message ?? null,
        ruleViolations: vrs.ruleViolations ?? [],
        shaclIssues: sIssues,
      });
    }

    for (const [propUri, sIssues] of Object.entries(shaclRules)) {
      mergedRules.push({
        ruleConstraint: propUri,
        violationCount: 0,
        vocabViolationCount: 0,
        severity: sIssues[0]?.severity || 'http://www.w3.org/ns/shacl#Warning',
        message: null,
        ruleViolations: [],
        shaclIssues: sIssues,
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
