import { htmlSafe } from '@ember/template';
import shortLabel from './uri-labels';

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

/**
 * Returns specification label and URL for a given DCAT-AP version.
 *
 * @param version - The mobilityDCAT-AP version.
 * @returns Specification info with label and URL.
 */
export function specInfo(version) {
  return SPEC_LINKS[version] || SPEC_LINKS['1.1.0'];
}

/**
 * Normalizes a SHACL severity URI into a frontend category.
 *
 * @param rule - Rule summary containing a severity URI.
 * @returns Normalized severity category.
 */
export function severityOf(rule) {
  const uri = rule?.severity ?? '';
  if (uri.includes('Violation')) return 'violation';
  if (uri.includes('Warning')) return 'warning';
  if (uri.includes('Info')) return 'info';
  return 'info';
}

/**
 * Calculates the combined total of missing property violations and
 * controlled vocabulary violations for a given class and severity tier.
 *
 * @param cls - Target class summary with its rules.
 * @param sev - The severity tier to sum.
 * @returns Total count of violations in that tier.
 */
export function severityViolations(cls, sev) {
  if (!cls?.ruleSummaries) return 0;
  return cls.ruleSummaries
    .filter((r) => severityOf(r) === sev)
    .reduce(
      (sum, r) => sum + (r.violationCount ?? 0) + (r.vocabViolationCount ?? 0),
      0,
    );
}

/**
 * Returns all rules for a target class matching a specific severity tier,
 * sorted in descending order by total violation count (highest impact first).
 *
 * @param cls - Target class summary.
 * @param sev - Severity tier filter.
 * @returns Sorted list of matching rule summaries.
 */
export function rulesFor(cls, sev) {
  if (!cls?.ruleSummaries) return [];
  return Array.from(cls.ruleSummaries)
    .filter((r) => severityOf(r) === sev)
    .sort((a, b) => {
      const aViolations =
        (a.violationCount ?? 0) + (a.vocabViolationCount ?? 0);
      const bViolations =
        (b.violationCount ?? 0) + (b.vocabViolationCount ?? 0);
      return bViolations - aViolations;
    });
}

/**
 * Extracts and prepares invalid controlled vocabulary terms for display.
 *
 * Truncates the preview list to at most 10 terms and indicates whether
 * additional terms exist beyond the preview.
 *
 * @param rule - rule where invalid vocabulary is used
 * @returns Up to 10 (invalid) terms with indicator whether there are more
 */
export function violationsData(rule) {
  let rawTerms = [];
  if (rule?.ruleViolations?.length) {
    rawTerms = Array.from(rule.ruleViolations)
      .map((r) => (typeof r === 'string' ? r : r?.value || ''))
      .filter(Boolean);
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

/**
 * Sorts target classes by validation priority so the most critical classes appear first.
 *
 * Sorting formula:
 * 1. Weighted score: (Mandatory violations * 1000) + (Recommended * 10) + Optional
 * 2. Resource count (descending) as a secondary tie-breaker.
 *
 * @param summaries - List of target class summaries.
 * @returns Sorted class summaries.
 */
export function sortedClasses(summaries) {
  if (!summaries) return [];
  return Array.from(summaries).sort((a, b) => {
    const score = (cls) =>
      severityViolations(cls, 'violation') * 1000 +
      severityViolations(cls, 'warning') * 10 +
      severityViolations(cls, 'info');
    const diff = score(b) - score(a);
    if (diff !== 0) return diff;
    return (b.resourceCount ?? 0) - (a.resourceCount ?? 0);
  });
}

/**
 * Calculates the grand total of discovered RDF resources across all target classes.
 *
 * @param summaries - Target class summaries.
 * @returns Total resource count.
 */
export function totalResources(summaries) {
  if (!summaries) return 0;
  return summaries.reduce((sum, cls) => sum + (cls.resourceCount ?? 0), 0);
}

/**
 * Computes coverage and vocabulary compliance statistics and progress bar styles for a single rule.
 *
 * Breakdown semantics:
 * - `total`: Total instances of the target class.
 * - `missing`: Instances lacking the property (coverage violation).
 * - `covered`: Instances containing the property (`total - missing`).
 * - `vocabInvalid`: Covered instances with invalid vocabulary terms.
 * - `valid`: Covered instances with valid vocabulary terms (`covered - vocabInvalid`).
 *
 * @param rule - The rule summary.
 * @param cls - The enclosing class summary.
 * @returns Calculated metrics, percentage integers, and CSS width styles.
 */
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
  return message
    .replace(/Literal\("([^"]+)"\)/g, '$1')
    .replace(/\\\./g, '.');
}

/**
 * Merges Coverage Report, Controlled Vocabulary Report, and SHACL Validation Report.
 *
 * @param coverSummaries - Target class summaries from the coverage report.
 * @param vocabReport - The full vocabulary validation summary.
 * @param shaclReport - The full SHACL validation summary.
 * @returns Merged target class summaries ready for UI rendering.
 */
export function mergedClassSummaries(coverSummaries, vocabReport, shaclReport) {
  if (!coverSummaries?.length) return [];

  const vocabByClass = new Map();
  if (vocabReport?.targetClassSummaries) {
    for (const vc of vocabReport.targetClassSummaries) {
      if (!vc?.targetClass) continue;
      const rules = new Map();
      for (const vrs of vc.ruleSummaries ?? []) {
        if (vrs?.ruleConstraint) {
          rules.set(vrs.ruleConstraint, vrs);
        }
      }
      vocabByClass.set(vc.targetClass, rules);
    }
  }

  const shaclByClass = new Map();
  if (shaclReport?.targetClassSummaries) {
    for (const sc of shaclReport.targetClassSummaries) {
      if (!sc?.targetClass) continue;
      const issuesByProp = new Map();
      for (const srs of sc.ruleSummaries ?? []) {
        if (isIgnoredShaclConstraint(srs)) continue;
        if (!srs?.ruleConstraint) continue;
        if (!issuesByProp.has(srs.ruleConstraint)) {
          issuesByProp.set(srs.ruleConstraint, []);
        }
        issuesByProp.get(srs.ruleConstraint).push({
          ruleConstraint: srs.ruleConstraint,
          constraint: srs.constraint,
          severity: srs.severity,
          message: formatShaclMessage(srs.message),
          count: srs.violationCount ?? 0,
        });
      }
      shaclByClass.set(sc.targetClass, issuesByProp);
    }
  }

  return coverSummaries.map((cs) => {
    const vocabRules = new Map(vocabByClass.get(cs.targetClass) || []);
    const shaclRules = new Map(shaclByClass.get(cs.targetClass) || []);

    const mergedRules = [];

    for (const rs of cs.ruleSummaries ?? []) {
      const vrs = vocabRules.get(rs.ruleConstraint);
      if (vrs) vocabRules.delete(rs.ruleConstraint);

      const sIssues = shaclRules.get(rs.ruleConstraint) || [];
      if (shaclRules.has(rs.ruleConstraint)) shaclRules.delete(rs.ruleConstraint);

      mergedRules.push({
        ruleConstraint: rs.ruleConstraint,
        violationCount: rs.violationCount ?? 0,
        vocabViolationCount: vrs?.violationCount ?? 0,
        severity: rs.severity,
        message: vrs?.message ?? rs.message ?? null,
        ruleViolations: vrs?.ruleViolations ?? rs?.ruleViolations ?? [],
        shaclIssues: sIssues,
      });
    }

    for (const vrs of vocabRules.values()) {
      const sIssues = shaclRules.get(vrs.ruleConstraint) || [];
      if (shaclRules.has(vrs.ruleConstraint)) shaclRules.delete(vrs.ruleConstraint);

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

    for (const [propUri, sIssues] of shaclRules.entries()) {
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

    return {
      targetClass: cs.targetClass,
      resourceCount: cs.resourceCount ?? 0,
      ruleSummaries: mergedRules,
    };
  });
}

/**
 * Formats an ISO date string or timestamp into British English long format (e.g., "27 August 2026").
 *
 * @param d - The date value to format.
 * @returns Formatted date string, or null if invalid.
 */
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
