import { htmlSafe } from '@ember/template';
import shortLabel from './uri-labels';

/**
 * Normalizes a SHACL severity URI into a frontend category.
 *
 * @param rule - Rule summary containing a severity URI.
 * @returns Normalized severity category.
 */
export function severityOf(rule) {
  const uri = rule?.severity ?? '';
  switch (shortLabel(uri)) {
    case 'sh:Violation':
      return 'violation';
    case 'sh:Warning':
      return 'warning';
    case 'sh:Info':
      return 'info';
    default:
      return 'info';
  }
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

/**
 * Merges the Coverage Report with the Controlled Vocabulary Report.
 *
 * The validator runs two distinct validations:
 * 1. **Coverage Report**: Checks property presence and cardinality against DCAT-AP profile shapes.
 * 2. **Vocabulary Report**: Validates that present property values conform to required controlled vocabularies.
 *
 * This function correlates both reports by target class and `ruleConstraint`:
 * - Preserves the coverage severity (Mandatory / Recommended / Optional) for UI grouping.
 * - Enriches each coverage rule with the vocabulary violation count and sample invalid terms.
 * - Appends any vocabulary-only constraints that were not present in the coverage shapes.
 *
 * @param [coverSummaries] - Target class summaries from the coverage report.
 * @param [vocabReport] - The full vocabulary validation summary.
 * @returns Merged target class summaries ready for UI rendering.
 */
export function mergedClassSummaries(coverSummaries, vocabReport) {
  if (!coverSummaries?.length) return [];

  const vocabSummaries = vocabReport?.targetClassSummaries ?? [];
  const vocabByClass = new Map();
  for (const vc of vocabSummaries) {
    if (vc.targetClass) {
      vocabByClass.set(vc.targetClass, vc);
    }
  }

  return coverSummaries.map((cs) => {
    const vc = cs.targetClass ? vocabByClass.get(cs.targetClass) : undefined;
    const vocabByConstraint = new Map();

    for (const vrs of vc?.ruleSummaries ?? []) {
      if (vrs.ruleConstraint) {
        vocabByConstraint.set(vrs.ruleConstraint, vrs);
      }
    }

    const mergedRules = [];

    for (const rs of cs.ruleSummaries ?? []) {
      const vrs = vocabByConstraint.get(rs.ruleConstraint);
      if (vrs) {
        vocabByConstraint.delete(rs.ruleConstraint);
      }

      mergedRules.push({
        ruleConstraint: rs.ruleConstraint,
        violationCount: rs.violationCount ?? 0,
        vocabViolationCount: vrs?.violationCount ?? 0,
        severity: rs.severity,
        message: vrs?.message ?? rs.message ?? null,
        ruleViolations: vrs?.ruleViolations ?? rs.ruleViolations ?? [],
      });
    }

    for (const vrs of vocabByConstraint.values()) {
      mergedRules.push({
        ruleConstraint: vrs.ruleConstraint,
        violationCount: 0,
        vocabViolationCount: vrs.violationCount ?? 0,
        severity: vrs.severity,
        message: vrs.message ?? null,
        ruleViolations: vrs.ruleViolations ?? [],
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
