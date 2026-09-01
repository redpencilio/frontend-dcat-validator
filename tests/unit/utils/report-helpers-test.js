import { module, test } from 'qunit';
import {
  ruleStats,
  mergedClassSummaries,
  severityViolations,
  rulesFor,
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
});
