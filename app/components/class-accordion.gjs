import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { helper } from '@ember/component/helper';
import { on } from '@ember/modifier';
import shortLabel from '../utils/uri-labels';
import {
  severityViolations,
  rulesFor,
  compliant,
  compliancePct,
  barStyle,
  splitToArray,
} from '../utils/report-helpers';

const eq = helper(function([a, b]) {
  return a === b;
});

const isNotLast = helper(function([index, array]) {
  return index < array.length - 1;
});

const and = helper(function([a, b]) {
  return a && b;
});

const isMoreIndicator = helper(function([term]) {
  return typeof term === 'string' && term.startsWith('(+');
});

const get = helper(function([obj, key]) {
  return obj[key];
});

const SEVERITY_CONFIG = {
  violation: {
    headerBg: 'bg-red-50',
    label: 'Mandatory',
    labelColor: 'text-red-600',
    failText: 'text-red-700',
    failBarBg: 'bg-red-100',
    failBarFill: 'bg-red-500',
    fontWeight: 'font-semibold',
  },
  warning: {
    headerBg: 'bg-amber-50',
    label: 'Recommended',
    labelColor: 'text-amber-600',
    failText: 'text-amber-700',
    failBarBg: 'bg-amber-100',
    failBarFill: 'bg-amber-400',
    fontWeight: 'font-semibold',
  },
  info: {
    headerBg: 'bg-zinc-50',
    label: 'Optional',
    labelColor: 'text-zinc-400',
    failText: 'text-zinc-500',
    failBarBg: 'bg-zinc-200',
    failBarFill: 'bg-zinc-400',
    fontWeight: 'font-medium',
  },
};

const SeverityGroup = <template>
  {{#let (rulesFor @cls @severity) as |rules|}}
    {{#if rules.length}}
      {{#let (get SEVERITY_CONFIG @severity) as |cfg|}}
        <tr class={{cfg.headerBg}}>
          <td colspan="4" class="px-5 py-1">
            <span class="text-[10px] font-bold uppercase tracking-widest {{cfg.labelColor}}">{{cfg.label}}</span>
          </td>
        </tr>
        {{#each rules as |rule|}}
          <tr class="hover:bg-zinc-50">
            <td class="px-5 py-2.5 text-xs text-zinc-700">
              <div class="font-mono"><abbr title={{rule.ruleConstraint}}>{{shortLabel rule.ruleConstraint}}</abbr></div>
              {{#if (and @showInvalidTerms rule.message)}}
                <div class="mt-0.5 text-[11px] text-zinc-400">
                {{#let (splitToArray rule.message ', ') as |invalid_terms|}}
                  {{if (eq invalid_terms.length 1) "Invalid term:" "Invalid terms:"}}
                  {{#each invalid_terms as |invalid_term index|}}
                    {{#if (isMoreIndicator invalid_term)}}
                      <span class="mb-1 inline-block rounded bg-zinc-100 px-1.5 py-0.5 font-sans font-medium text-zinc-500">{{invalid_term}}</span>
                    {{else}}
                      <span class="mb-1 inline-block rounded bg-transparent px-1.5 py-0.5 font-mono text-red-600 transition-colors hover:bg-red-50" title={{invalid_term}}>{{shortLabel invalid_term}}</span>{{if (isNotLast index invalid_terms) ","}}
                    {{/if}}
                  {{/each}}
                {{/let}}
                </div>
              {{/if}}
            </td>
            <td class="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-xs {{cfg.fontWeight}}
              {{if (eq (compliancePct rule @cls) 100) "text-green-700" cfg.failText}}">
              {{compliant rule @cls}} / {{@cls.resourceCount}}
            </td>
            <td class="w-36 px-4 py-2.5">
              <div class="h-1.5 overflow-hidden rounded-full {{if (eq (compliancePct rule @cls) 100) "bg-green-100" cfg.failBarBg}}">
                <div class="h-full rounded-full {{if (eq (compliancePct rule @cls) 100) "bg-green-500" cfg.failBarFill}}" style={{barStyle rule @cls}}></div>
              </div>
            </td>
            <td class="w-14 py-2.5 pr-5 text-right text-xs {{if (eq (compliancePct rule @cls) 100) "font-semibold text-green-700" "text-zinc-400"}}">
              {{compliancePct rule @cls}}%
            </td>
          </tr>
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
          <span class="font-semibold text-zinc-900">{{shortLabel @cls.targetClass}}</span>
          <span class="block truncate text-xs text-zinc-400">{{@cls.targetClass}}</span>
        </div>
        <span class="shrink-0 text-sm text-zinc-500">
          <span class="font-semibold text-zinc-700">{{@cls.resourceCount}}</span> resources
        </span>
        {{#let
          (severityViolations @cls "violation")
          (severityViolations @cls "warning")
        as |mandatory recommended|}}
          {{#if (eq @cls.resourceCount 0)}}
            <span class="shrink-0 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
              No resources
            </span>
          {{else if (eq mandatory 0)}}
            <span class="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
              {{if (eq recommended 0) "Compliant" "Mandatory compliant"}}
            </span>
            {{#if recommended}}
              <span class="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                {{recommended}} recommended violations
              </span>
            {{/if}}
          {{else}}
            <span class="shrink-0 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
              {{mandatory}} mandatory violations
            </span>
            {{#if recommended}}
              <span class="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                {{recommended}} recommended violations
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
                <th class="px-5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Property</th>
                <th class="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Compliant</th>
                <th class="w-36"></th>
                <th class="w-14 pr-5 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Score</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-50 bg-white">
              <SeverityGroup @cls={{@cls}} @severity="violation" @showInvalidTerms={{@showInvalidTerms}} />
              <SeverityGroup @cls={{@cls}} @severity="warning"   @showInvalidTerms={{@showInvalidTerms}} />
              <SeverityGroup @cls={{@cls}} @severity="info"      @showInvalidTerms={{@showInvalidTerms}} />
            </tbody>
          </table>
        {{/if}}
      {{/if}}
    </div>
  </template>
}
