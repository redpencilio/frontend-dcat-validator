import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { helper } from '@ember/component/helper';
import { on } from '@ember/modifier';
import shortLabel from '../utils/uri-labels';
import StackedProgressBar from './stacked-progress-bar';
import {
  severityViolations,
  rulesFor,
  ruleStats,
  splitToArray,
} from '../utils/report-helpers';

const eq = helper(function ([a, b]) {
  return a === b;
});

const gt = helper(function ([a, b]) {
  return a > b;
});

const isNotLast = helper(function ([index, array]) {
  return index < array.length - 1;
});

const and = helper(function ([a, b]) {
  return a && b;
});

const isMoreIndicator = helper(function ([term]) {
  return typeof term === 'string' && term.startsWith('(+');
});

const get = helper(function ([obj, key]) {
  return obj[key];
});

const scoreTooltip = helper(function ([stats]) {
  if (!stats) return '';
  if (stats.vocabInvalid > 0) {
    return `Valid: ${stats.validPct}% (${stats.valid}/${stats.total} with valid vocabulary)\nCoverage: ${stats.coveredPct}% (${stats.covered}/${stats.total} resources covered)\nInvalid Vocabulary: ${stats.vocabInvalid} with disallowed terms\nNot Covered: ${stats.missing} missing`;
  }
  return `Valid: ${stats.validPct}% (${stats.valid}/${stats.total} covered & valid)\nNot Covered: ${stats.missing} missing`;
});

const shaclSeverityConfig = helper(function ([severity]) {
  const s = severity || '';
  if (s.includes('Violation')) {
    return {
      textColor: 'text-red-700',
      icon: '🚫',
    };
  }
  if (s.includes('Info')) {
    return {
      textColor: 'text-blue-700',
      icon: 'ℹ️',
    };
  }
  return {
    textColor: 'text-amber-700',
    icon: '⚠️',
  };
});

const SEVERITY_CONFIG = {
  violation: {
    headerBg: 'bg-red-50',
    label: 'Mandatory',
    labelColor: 'text-red-600',
    validBarFill: 'bg-green-500',
    vocabBarFill: 'bg-green-300',
    validText: 'text-green-700',
    failText: 'text-red-700',
    fontWeight: 'font-semibold',
  },
  warning: {
    headerBg: 'bg-amber-50',
    label: 'Recommended',
    labelColor: 'text-amber-600',
    validBarFill: 'bg-amber-400',
    vocabBarFill: 'bg-amber-200',
    validText: 'text-amber-700',
    failText: 'text-amber-700',
    fontWeight: 'font-semibold',
  },
  info: {
    headerBg: 'bg-zinc-50',
    label: 'Optional',
    labelColor: 'text-zinc-400',
    validBarFill: 'bg-zinc-400',
    vocabBarFill: 'bg-zinc-200',
    validText: 'text-zinc-500',
    failText: 'text-zinc-500',
    fontWeight: 'font-medium',
  },
};

const SeverityGroup = <template>
  {{#let (rulesFor @cls @severity) as |rules|}}
    {{#if rules.length}}
      {{#let (get SEVERITY_CONFIG @severity) as |cfg|}}
        <tr class={{cfg.headerBg}}>
          <td colspan="4" class="px-5 py-1">
            <span
              class="text-[10px] font-bold uppercase tracking-widest
                {{cfg.labelColor}}"
            >{{cfg.label}}</span>
          </td>
        </tr>
        {{#each rules as |rule|}}
          {{#let (ruleStats rule @cls) as |stats|}}
            <tr class="hover:bg-zinc-50">
              <td class="px-5 py-2.5 text-xs text-zinc-700">
                <div class="font-mono"><abbr
                    title={{rule.ruleConstraint}}
                  >{{shortLabel rule.ruleConstraint}}</abbr></div>
                {{#if (and @showInvalidTerms rule.message)}}
                  <div class="mt-0.5 text-[11px] text-zinc-400">
                    {{#let (splitToArray rule.message ", ") as |invalid_terms|}}
                      {{if
                        (eq invalid_terms.length 1)
                        "Invalid term:"
                        "Invalid terms:"
                      }}
                      {{#each invalid_terms as |invalid_term index|}}
                        {{#if (isMoreIndicator invalid_term)}}
                          <span
                            class="mb-1 inline-block rounded bg-zinc-100 px-1.5 py-0.5 font-sans font-medium text-zinc-500"
                          >{{invalid_term}}</span>
                        {{else}}
                          <span
                            class="mb-1 inline-block rounded bg-transparent px-1.5 py-0.5 font-mono text-red-600 transition-colors hover:bg-red-50"
                            title={{invalid_term}}
                          >{{shortLabel invalid_term}}</span>{{if
                            (isNotLast index invalid_terms)
                            ","
                          }}
                        {{/if}}
                      {{/each}}
                    {{/let}}
                  </div>
                {{/if}}
                {{#if rule.shaclIssues.length}}
                  <div class="mt-1 space-y-1">
                    {{#each rule.shaclIssues as |issue|}}
                      {{#let (shaclSeverityConfig issue.severity) as |sCfg|}}
                        <div class="flex items-start gap-1 text-[11px] {{sCfg.textColor}}">
                          <span class="shrink-0">{{sCfg.icon}}</span>
                          <span>
                            {{#if issue.message}}
                              {{issue.message}}
                            {{else if issue.constraint}}
                              Quality issue ({{shortLabel issue.constraint}})
                            {{else}}
                              Quality constraint issue
                            {{/if}}
                            {{#if (gt issue.count 0)}}
                              <span class="font-normal font-sans text-zinc-400">({{issue.count}} {{if (eq issue.count 1) "issue" "issues"}})</span>
                            {{/if}}
                          </span>
                        </div>
                      {{/let}}
                    {{/each}}
                  </div>
                {{/if}}
              </td>
              <td
                class="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-xs
                  {{cfg.fontWeight}}
                  {{if
                    (and (eq stats.validPct 100) (eq stats.vocabInvalid 0))
                    cfg.validText
                    'text-zinc-800'
                  }}"
              >
                <div>{{stats.valid}} / {{stats.total}}</div>
                {{#if (gt stats.vocabInvalid 0)}}
                  <div
                    class="mt-0.5 text-[11px] font-normal text-zinc-400 leading-tight whitespace-nowrap"
                  >
                    {{stats.covered}}
                    covered ·
                    <span
                      class="font-medium text-red-600"
                    >{{stats.vocabInvalid}} invalid</span>
                  </div>
                {{/if}}
              </td>
              <td class="w-36 px-4 py-2.5">
                <StackedProgressBar
                  @stats={{stats}}
                  @validColor={{cfg.validBarFill}}
                  @vocabColor={{cfg.vocabBarFill}}
                />
              </td>
              <td class="w-32 py-2.5 pr-5 text-right text-xs whitespace-nowrap">
                <div class="cursor-help" title={{scoreTooltip stats}}>
                  {{#if (gt stats.vocabInvalid 0)}}
                    <span
                      class="font-semibold tabular-nums text-zinc-900"
                    >{{stats.validPct}}%</span>
                    <span
                      class="ml-1 text-[11px] font-normal text-zinc-400 tabular-nums"
                    >({{stats.coveredPct}}% cov)</span>
                  {{else}}
                    <span
                      class="font-semibold tabular-nums
                        {{if
                          (eq stats.validPct 100)
                          cfg.validText
                          'text-zinc-900'
                        }}"
                    >{{stats.validPct}}%</span>
                  {{/if}}
                </div>
              </td>
            </tr>
          {{/let}}
        {{/each}}
      {{/let}}
    {{/if}}
  {{/let}}
</template>;

export default class ClassAccordion extends Component {
  @tracked isExpanded = false;

  @action
  toggle() {
    this.isExpanded = !this.isExpanded;
  }

  <template>
    <div class="mt-3 overflow-hidden rounded-lg border border-zinc-200">
      <button
        type="button"
        class="group flex w-full items-center gap-4 bg-zinc-50 px-5 py-3.5 text-left hover:bg-zinc-100"
        {{on "click" this.toggle}}
      >
        <div class="min-w-0 flex-1">
          <span class="font-semibold text-zinc-900">{{shortLabel
              @cls.targetClass
            }}</span>
          <span
            class="block truncate text-xs text-zinc-400"
          >{{@cls.targetClass}}</span>
        </div>
        <span class="shrink-0 text-sm text-zinc-500">
          <span
            class="font-semibold text-zinc-700"
          >{{@cls.resourceCount}}</span>
          resources
        </span>
        {{#let
          (severityViolations @cls "violation")
          (severityViolations @cls "warning")
          as |mandatory recommended|
        }}
          {{#if (eq @cls.resourceCount 0)}}
            <span
              class="shrink-0 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800"
            >
              No resources
            </span>
          {{else if (eq mandatory 0)}}
            <span
              class="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800"
            >
              {{if (eq recommended 0) "Compliant" "Mandatory compliant"}}
            </span>
            {{#if recommended}}
              <span
                class="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800"
              >
                {{recommended}}
                recommended violations
              </span>
            {{/if}}
          {{else}}
            <span
              class="shrink-0 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800"
            >
              {{mandatory}}
              mandatory violations
            </span>
            {{#if recommended}}
              <span
                class="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800"
              >
                {{recommended}}
                recommended violations
              </span>
            {{/if}}
          {{/if}}
        {{/let}}
        <span class="shrink-0 text-zinc-300 group-hover:text-zinc-500">
          {{if this.isExpanded "▲" "▼"}}
        </span>
      </button>

      {{#if this.isExpanded}}
        {{#if (eq @cls.resourceCount 0)}}
          <div class="border-t border-zinc-100 px-5 py-5 text-sm text-red-700">
            No resources found for this class.
          </div>
        {{else}}
          <table class="w-full border-t border-zinc-200 text-sm">
            <thead>
              <tr class="border-b border-zinc-100 bg-white">
                <th
                  class="px-5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-400"
                >Property</th>
                <th
                  class="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-400"
                >Compliant</th>
                <th
                  class="w-36 px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-400"
                >
                  <span
                    class="inline-flex cursor-help items-center justify-center gap-1 hover:text-zinc-600"
                    title="Dark segment: Covered with valid vocabulary&#10;Light segment: Covered with invalid vocabulary&#10;Grey track: Not covered"
                  >
                    Coverage & Validity
                    <svg
                      class="h-3 w-3 text-zinc-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </span>
                </th>
                <th
                  class="w-32 pr-5 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-400"
                >Score</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-50 bg-white">
              <SeverityGroup
                @cls={{@cls}}
                @severity="violation"
                @showInvalidTerms={{@showInvalidTerms}}
              />
              <SeverityGroup
                @cls={{@cls}}
                @severity="warning"
                @showInvalidTerms={{@showInvalidTerms}}
              />
              <SeverityGroup
                @cls={{@cls}}
                @severity="info"
                @showInvalidTerms={{@showInvalidTerms}}
              />
            </tbody>
          </table>
        {{/if}}
      {{/if}}
    </div>
  </template>
}
