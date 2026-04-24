import { pageTitle } from 'ember-page-title';
import { LinkTo } from '@ember/routing';
import { on } from '@ember/modifier';
import { fn } from '@ember/helper';
import { htmlSafe } from '@ember/template';

function shortLabel(uri) {
  if (!uri) return '—';
  const local = uri.includes('#') ? uri.split('#').at(-1) : uri.split('/').at(-1);
  const ns = uri.includes('#')
    ? uri.split('#')[0].split('/').at(-1)
    : uri.split('/').at(-2);
  return ns ? `${ns}:${local}` : local;
}

function eq(a, b) {
  return a === b;
}

function totalResources(summaries) {
  if (!summaries) return 0;
  return [...summaries].reduce((sum, cls) => sum + (cls.resourceCount ?? 0), 0);
}

function classViolations(cls) {
  if (!cls.ruleSummaries) return 0;
  return [...cls.ruleSummaries].reduce((sum, r) => sum + (r.violationCount ?? 0), 0);
}

function sortedClasses(summaries) {
  if (!summaries) return [];
  return [...summaries].sort((a, b) => {
    const av = [...(a.ruleSummaries ?? [])].reduce((s, r) => s + (r.violationCount ?? 0), 0);
    const bv = [...(b.ruleSummaries ?? [])].reduce((s, r) => s + (r.violationCount ?? 0), 0);
    if (bv !== av) return bv - av;
    return (b.resourceCount ?? 0) - (a.resourceCount ?? 0);
  });
}

function severityOf(rule) {
  const uri = rule.severity ?? '';
  if (uri.includes('Warning')) return 'warning';
  if (uri.includes('Info')) return 'info';
  return 'violation';
}

function rulesFor(cls, sev) {
  if (!cls.ruleSummaries) return [];
  return [...cls.ruleSummaries]
    .filter((r) => severityOf(r) === sev)
    .sort((a, b) => (b.violationCount ?? 0) - (a.violationCount ?? 0));
}

function pct(rule, cls) {
  if (!cls.resourceCount) return 0;
  return Math.round((rule.violationCount / cls.resourceCount) * 100);
}

function barStyle(rule, cls) {
  return htmlSafe(`width:${pct(rule, cls)}%`);
}

function formatDate(d) {
  if (!d) return null;
  try {
    return new Intl.DateTimeFormat('en-GB', { dateStyle: 'long' }).format(new Date(d));
  } catch {
    return null;
  }
}

<template>
  {{pageTitle "Validation Report"}}

  <article class="container max-w-4xl py-12 print:py-6">
    {{#if @controller.errorMessage}}
      <div class="card border-red-200 bg-red-50">
        <h2 class="text-lg text-red-800">Something went wrong</h2>
        <p class="mt-2 text-sm text-red-700">{{@controller.errorMessage}}</p>
        <LinkTo @route="index" class="btn-secondary mt-4">Back to start</LinkTo>
      </div>
    {{else}}
      {{! ── Report header ── }}
      <header class="border-b-2 border-zinc-900 pb-8">
        <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">
          DCAT-AP Mobility
        </p>
        <h1 class="mt-1 text-4xl font-bold tracking-tight text-zinc-900">
          Validation Report
        </h1>

        <p class="mt-4 break-all text-base text-zinc-600">
          {{@model.endpointUrl}}
        </p>

        <p class="mt-2 text-sm text-zinc-400">
          {{#let (formatDate @controller.reportDate) as |d|}}
            {{#if d}}{{d}} · {{/if}}
          {{/let}}
          {{totalResources @model.targetClassSummaries}} datasets ·
          {{#if @model.totalViolations}}
            <span class="font-semibold text-red-600">{{@model.totalViolations}} violations</span>
          {{else}}
            <span class="font-semibold text-green-600">No violations</span>
          {{/if}}
        </p>
      </header>

      {{! ── Coverage ── }}
      <section class="mt-10">
        <h2 class="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">
          Coverage
        </h2>

        {{#each (sortedClasses @model.targetClassSummaries) as |cls|}}
          <div class="mt-3 overflow-hidden rounded-lg border border-zinc-200">

            {{! Class accordion header }}
            <button
              type="button"
              class="group flex w-full items-center gap-4 bg-zinc-50 px-5 py-3.5 text-left hover:bg-zinc-100"
              {{on "click" (fn @controller.toggleGroup cls.id)}}
            >
              <div class="min-w-0 flex-1">
                <span class="font-semibold text-zinc-900">{{shortLabel cls.targetClass}}</span>
                <span class="ml-2.5 text-xs text-zinc-400">{{cls.targetClass}}</span>
              </div>
              <span class="shrink-0 text-sm text-zinc-500">
                <span class="font-semibold text-zinc-700">{{cls.resourceCount}}</span> resources
              </span>
              {{#if (eq (classViolations cls) 0)}}
                <span class="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                  Compliant
                </span>
              {{else}}
                <span class="shrink-0 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                  {{classViolations cls}} violations
                </span>
              {{/if}}
              <span class="shrink-0 text-zinc-300 group-hover:text-zinc-500">
                {{if (eq @controller.expandedGroup cls.id) "▲" "▼"}}
              </span>
            </button>

            {{! Expanded body }}
            {{#if (eq @controller.expandedGroup cls.id)}}
              {{#if (eq (classViolations cls) 0)}}
                <div class="border-t border-zinc-100 px-5 py-5 text-sm text-green-700">
                  All {{cls.resourceCount}} resources fully comply with all constraints for this class.
                </div>
              {{else}}
                <div class="divide-y divide-zinc-100 border-t border-zinc-200">

                  {{! ── Mandatory (sh:Violation) ── }}
                  {{#let (rulesFor cls "violation") as |rules|}}
                    {{#if rules.length}}
                      <div>
                        <div class="bg-red-50 px-5 py-1.5">
                          <span class="text-[10px] font-bold uppercase tracking-widest text-red-600">
                            Mandatory
                          </span>
                        </div>
                        <table class="w-full text-sm">
                          <tbody class="divide-y divide-zinc-50 bg-white">
                            {{#each rules as |rule|}}
                              <tr class="hover:bg-zinc-50">
                                <td class="w-1/3 px-5 py-2.5 font-mono text-xs text-zinc-700">
                                  {{shortLabel rule.ruleConstraint}}
                                </td>
                                <td class="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-xs font-semibold text-red-700">
                                  {{rule.violationCount}} / {{cls.resourceCount}}
                                </td>
                                <td class="w-36 px-4 py-2.5">
                                  <div class="h-1.5 overflow-hidden rounded-full bg-red-100">
                                    <div class="h-full rounded-full bg-red-500" style={{barStyle rule cls}}></div>
                                  </div>
                                </td>
                                <td class="w-10 py-2.5 pr-5 text-right text-xs text-zinc-400">
                                  {{pct rule cls}}%
                                </td>
                              </tr>
                            {{/each}}
                          </tbody>
                        </table>
                      </div>
                    {{/if}}
                  {{/let}}

                  {{! ── Recommended (sh:Warning) ── }}
                  {{#let (rulesFor cls "warning") as |rules|}}
                    {{#if rules.length}}
                      <div>
                        <div class="bg-amber-50 px-5 py-1.5">
                          <span class="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                            Recommended
                          </span>
                        </div>
                        <table class="w-full text-sm">
                          <tbody class="divide-y divide-zinc-50 bg-white">
                            {{#each rules as |rule|}}
                              <tr class="hover:bg-zinc-50">
                                <td class="w-1/3 px-5 py-2.5 font-mono text-xs text-zinc-700">
                                  {{shortLabel rule.ruleConstraint}}
                                </td>
                                <td class="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-xs font-semibold text-amber-700">
                                  {{rule.violationCount}} / {{cls.resourceCount}}
                                </td>
                                <td class="w-36 px-4 py-2.5">
                                  <div class="h-1.5 overflow-hidden rounded-full bg-amber-100">
                                    <div class="h-full rounded-full bg-amber-400" style={{barStyle rule cls}}></div>
                                  </div>
                                </td>
                                <td class="w-10 py-2.5 pr-5 text-right text-xs text-zinc-400">
                                  {{pct rule cls}}%
                                </td>
                              </tr>
                            {{/each}}
                          </tbody>
                        </table>
                      </div>
                    {{/if}}
                  {{/let}}

                  {{! ── Optional (sh:Info) — collapsible ── }}
                  {{#let (rulesFor cls "info") as |rules|}}
                    {{#if rules.length}}
                      <details>
                        <summary class="flex cursor-pointer list-none items-center gap-2 bg-zinc-50 px-5 py-1.5 hover:bg-zinc-100">
                          <span class="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                            Optional
                          </span>
                          <span class="text-xs text-zinc-400">({{rules.length}} properties)</span>
                          <span class="ml-auto text-xs text-zinc-300">▼</span>
                        </summary>
                        <table class="w-full text-sm">
                          <tbody class="divide-y divide-zinc-50 bg-white">
                            {{#each rules as |rule|}}
                              <tr class="hover:bg-zinc-50">
                                <td class="w-1/3 px-5 py-2.5 font-mono text-xs text-zinc-500">
                                  {{shortLabel rule.ruleConstraint}}
                                </td>
                                <td class="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-xs font-medium text-zinc-500">
                                  {{rule.violationCount}} / {{cls.resourceCount}}
                                </td>
                                <td class="w-36 px-4 py-2.5">
                                  <div class="h-1.5 overflow-hidden rounded-full bg-zinc-200">
                                    <div class="h-full rounded-full bg-zinc-400" style={{barStyle rule cls}}></div>
                                  </div>
                                </td>
                                <td class="w-10 py-2.5 pr-5 text-right text-xs text-zinc-400">
                                  {{pct rule cls}}%
                                </td>
                              </tr>
                            {{/each}}
                          </tbody>
                        </table>
                      </details>
                    {{/if}}
                  {{/let}}

                </div>
              {{/if}}
            {{/if}}

          </div>
        {{/each}}
      </section>
    {{/if}}
  </article>
</template>
