import { module, test } from 'qunit';
import {
  ruleStats,
  mergedClassSummaries,
  severityViolations,
  rulesFor,
  formatShaclMessage,
  overallTierStats,
} from 'rpio-dcat-validator/utils/report-helpers';

module('Unit | Utility | report-helpers', function () {
  test('ruleStats calculates valid, invalid vocab, and missing counts correctly', function (assert) {
    const cls = { resourceCount: 10 };
    const ruleWithVocab = {
      ruleConstraint: 'http://purl.org/dc/terms/spatial',
      violationCount: 2, // 2 missing -> 8 covered
      vocabViolationCount: 3, // 3 invalid vocab -> 5 valid
    };

    const stats = ruleStats(ruleWithVocab, cls);
    assert.strictEqual(stats.total, 10, 'total is 10');
    assert.strictEqual(stats.missing, 2, 'missing is 2');
    assert.strictEqual(stats.covered, 8, 'covered is 8');
    assert.strictEqual(stats.vocabInvalid, 3, 'vocabInvalid is 3');
    assert.strictEqual(stats.valid, 5, 'valid is 5');
    assert.strictEqual(stats.coveredPct, 80, 'coveredPct is 80%');
    assert.strictEqual(stats.validPct, 50, 'validPct is 50%');
    assert.strictEqual(stats.vocabInvalidPct, 30, 'vocabInvalidPct is 30%');
    assert.strictEqual(stats.missingPct, 20, 'missingPct is 20%');
    assert.true(stats.hasVocabViolation, 'hasVocabViolation is true');
  });

  test('ruleStats handles 100% compliant properties', function (assert) {
    const cls = { resourceCount: 10 };
    const cleanRule = {
      ruleConstraint: 'http://purl.org/dc/terms/title',
      violationCount: 0,
      vocabViolationCount: 0,
    };

    const stats = ruleStats(cleanRule, cls);
    assert.strictEqual(stats.covered, 10);
    assert.strictEqual(stats.valid, 10);
    assert.strictEqual(stats.vocabInvalid, 0);
    assert.strictEqual(stats.missing, 0);
    assert.strictEqual(stats.validPct, 100);
    assert.strictEqual(stats.coveredPct, 100);
    assert.false(stats.hasVocabViolation);
  });

  test('ruleStats handles 0 resources safely', function (assert) {
    const cls = { resourceCount: 0 };
    const rule = {
      ruleConstraint: 'http://purl.org/dc/terms/title',
      violationCount: 0,
      vocabViolationCount: 0,
    };

    const stats = ruleStats(rule, cls);
    assert.strictEqual(stats.total, 0);
    assert.strictEqual(stats.validPct, 0);
    assert.strictEqual(stats.coveredPct, 0);
  });

  test('mergedClassSummaries merges coverage and vocabulary reports properly', function (assert) {
    const coverSummaries = [
      {
        targetClass: 'http://www.w3.org/ns/dcat#Dataset',
        resourceCount: 10,
        ruleSummaries: [
          {
            ruleConstraint: 'https://w3id.org/mobilitydcat-ap#transportMode',
            violationCount: 4, // 4 missing, 6 covered
            severity: 'http://www.w3.org/ns/shacl#Warning',
          },
          {
            ruleConstraint: 'http://purl.org/dc/terms/title',
            violationCount: 0,
            severity: 'http://www.w3.org/ns/shacl#Violation',
          },
        ],
      },
    ];

    const vocabReport = {
      targetClassSummaries: [
        {
          targetClass: 'http://www.w3.org/ns/dcat#Dataset',
          ruleSummaries: [
            {
              ruleConstraint: 'https://w3id.org/mobilitydcat-ap#transportMode',
              violationCount: 2, // 2 invalid terms
              severity: 'http://www.w3.org/ns/shacl#Warning',
              message: 'https://example.org/invalid-mode',
            },
          ],
        },
      ],
    };

    const merged = mergedClassSummaries(coverSummaries, vocabReport);
    assert.strictEqual(merged.length, 1);
    const rules = merged[0].ruleSummaries;
    assert.strictEqual(rules.length, 2);

    const transportRule = rules.find(
      (r) =>
        r.ruleConstraint === 'https://w3id.org/mobilitydcat-ap#transportMode',
    );
    assert.ok(transportRule);
    assert.strictEqual(
      transportRule.violationCount,
      4,
      'coverage missing is 4',
    );
    assert.strictEqual(
      transportRule.vocabViolationCount,
      2,
      'vocab invalid is 2',
    );
    assert.strictEqual(
      transportRule.message,
      'https://example.org/invalid-mode',
    );
  });

  test('mergedClassSummaries integrates SHACL report and filters out minCount and inConstraint', function (assert) {
    const coverSummaries = [
      {
        targetClass: 'http://www.w3.org/ns/dcat#Dataset',
        resourceCount: 20,
        ruleSummaries: [
          {
            ruleConstraint: 'http://purl.org/dc/terms/description',
            violationCount: 0,
            severity: 'http://www.w3.org/ns/shacl#Violation',
          },
          {
            ruleConstraint: 'http://purl.org/dc/terms/accrualPeriodicity',
            violationCount: 16,
            severity: 'http://www.w3.org/ns/shacl#Violation',
          },
        ],
      },
    ];

    const shaclReport = {
      targetClassSummaries: [
        {
          targetClass: 'http://www.w3.org/ns/dcat#Dataset',
          ruleSummaries: [
            {
              ruleConstraint: 'http://purl.org/dc/terms/accrualPeriodicity',
              violationCount: 16,
              constraint: 'http://www.w3.org/ns/shacl#MinCountConstraintComponent',
              message: 'Frequency is mandatory. Exactly one value must be provided',
              severity: 'http://www.w3.org/ns/shacl#Violation',
            },
            {
              ruleConstraint: 'http://purl.org/dc/terms/description',
              violationCount: 20,
              constraint: 'http://www.w3.org/ns/shacl#LanguageInConstraintComponent',
              message:
                'Description is mandatory, must have a valid EU language tag, cannot be empty, each language only once',
              severity: 'http://www.w3.org/ns/shacl#Warning',
            },
          ],
        },
      ],
    };

    const merged = mergedClassSummaries(coverSummaries, null, shaclReport);
    assert.strictEqual(merged.length, 1);
    const rules = merged[0].ruleSummaries;

    const periodicityRule = rules.find(
      (r) => r.ruleConstraint === 'http://purl.org/dc/terms/accrualPeriodicity',
    );
    assert.ok(periodicityRule);
    assert.strictEqual(
      periodicityRule.shaclIssues.length,
      0,
      'MinCount issue is filtered out for accrualPeriodicity',
    );

    const descRule = rules.find(
      (r) => r.ruleConstraint === 'http://purl.org/dc/terms/description',
    );
    assert.ok(descRule);
    assert.strictEqual(
      descRule.shaclIssues.length,
      1,
      'LanguageIn issue is attached to description',
    );
    assert.strictEqual(
      descRule.shaclIssues[0].message,
      'Description is mandatory, must have a valid EU language tag, cannot be empty, each language only once',
    );
    assert.strictEqual(descRule.shaclIssues[0].count, 20);
    assert.strictEqual(
      descRule.shaclIssues[0].severity,
      'http://www.w3.org/ns/shacl#Warning',
    );
  });

  test('formatShaclMessage formats pySHACL pattern and or-constraint messages cleanly', function (assert) {
    const rawOrPattern =
      'Node <https://example.org/frequency/every-10-seconds> must conform to one or more shapes in [ sh:pattern Literal("^http://publications\\.europa\\.eu/resource/authority/frequency/.+$") ] , [ sh:pattern Literal("^https://w3id\\.org/mobilitydcat-ap/update-frequency/.+$") ]';

    const formatted = formatShaclMessage(rawOrPattern);
    assert.strictEqual(
      formatted,
      'Invalid URI <https://example.org/frequency/every-10-seconds>. Must match: http://publications.europa.eu/resource/authority/frequency/* or https://w3id.org/mobilitydcat-ap/update-frequency/*',
    );

    const rawSinglePattern =
      'Node <https://example.org/bad-theme> does not match pattern Literal("^https://w3id\\.org/mobilitydcat-ap/mobility-theme/.+$")';
    const formattedSingle = formatShaclMessage(rawSinglePattern);
    assert.strictEqual(
      formattedSingle,
      'Invalid URI <https://example.org/bad-theme>. Must match: https://w3id.org/mobilitydcat-ap/mobility-theme/*',
    );
  });

  test('formatShaclMessage translates NodeKind messages into plain English', function (assert) {
    assert.strictEqual(
      formatShaclMessage('Value is not of Node Kind sh:BlankNodeOrIRI'),
      'Value must be a valid URI resource (<https://...>), not a text string.',
    );
    assert.strictEqual(
      formatShaclMessage('Value is not of Node Kind sh:IRI'),
      'Value must be a valid URI resource (<https://...>), not a text string.',
    );
    assert.strictEqual(
      formatShaclMessage('Value is not of Node Kind sh:Literal'),
      'Value must be a text string literal, not a URI resource.',
    );
  });

  test('overallTierStats computes aggregate compliance correctly for mandatory and recommended tiers', function (assert) {
    const classSummaries = [
      {
        targetClass: 'http://www.w3.org/ns/dcat#Dataset',
        resourceCount: 10,
        ruleSummaries: [
          {
            ruleConstraint: 'http://purl.org/dc/terms/title',
            violationCount: 0, // 10 valid
            vocabViolationCount: 0,
            severity: 'http://www.w3.org/ns/shacl#Violation', // Mandatory
          },
          {
            ruleConstraint: 'http://purl.org/dc/terms/spatial',
            violationCount: 2, // 2 missing -> 8 covered, 3 invalid vocab -> 5 valid
            vocabViolationCount: 3,
            severity: 'http://www.w3.org/ns/shacl#Violation', // Mandatory
          },
          {
            ruleConstraint: 'https://w3id.org/mobilitydcat-ap#transportMode',
            violationCount: 4, // 4 missing -> 6 covered, 0 invalid vocab -> 6 valid
            vocabViolationCount: 0,
            severity: 'http://www.w3.org/ns/shacl#Warning', // Recommended
          },
        ],
      },
      {
        targetClass: 'http://www.w3.org/ns/dcat#Distribution',
        resourceCount: 5,
        ruleSummaries: [
          {
            ruleConstraint: 'http://www.w3.org/ns/dcat#accessURL',
            violationCount: 0, // 5 valid
            vocabViolationCount: 0,
            severity: 'http://www.w3.org/ns/shacl#Violation', // Mandatory
          },
        ],
      },
    ];

    // Mandatory:
    // Total expected: 10 (title) + 10 (spatial) + 5 (accessURL) = 25
    // Total valid: 10 + 5 + 5 = 20
    // Total covered: 10 + 8 + 5 = 23
    // Total vocab invalid: 3
    // Total missing: 2
    // validPct: 20 / 25 = 80%
    // coveredPct: 23 / 25 = 92%
    const mandStats = overallTierStats(classSummaries, 'violation');
    assert.strictEqual(mandStats.totalExpected, 25, 'Mandatory expected is 25');
    assert.strictEqual(mandStats.totalValid, 20, 'Mandatory valid is 20');
    assert.strictEqual(mandStats.totalCovered, 23, 'Mandatory covered is 23');
    assert.strictEqual(mandStats.totalVocabInvalid, 3, 'Mandatory vocab invalid is 3');
    assert.strictEqual(mandStats.totalMissing, 2, 'Mandatory missing is 2');
    assert.strictEqual(mandStats.validPct, 80, 'Mandatory validPct is 80%');
    assert.strictEqual(mandStats.coveredPct, 92, 'Mandatory coveredPct is 92%');
    assert.true(mandStats.hasVocabInvalid, 'hasVocabInvalid is true');

    // Recommended:
    // Total expected: 10 (transportMode) = 10
    // Total valid: 6
    // Total covered: 6
    // validPct: 60%
    const recStats = overallTierStats(classSummaries, 'warning');
    assert.strictEqual(recStats.totalExpected, 10, 'Recommended expected is 10');
    assert.strictEqual(recStats.totalValid, 6, 'Recommended valid is 6');
    assert.strictEqual(recStats.validPct, 60, 'Recommended validPct is 60%');
    assert.false(recStats.hasVocabInvalid, 'Recommended hasVocabInvalid is false');
  });
});
