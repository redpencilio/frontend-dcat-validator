import { pageTitle } from 'ember-page-title';
import { LinkTo } from '@ember/routing';
import { on } from '@ember/modifier';
import { fn } from '@ember/helper';

function shortLabel(uri) {
  if (!uri) return '—';
  return uri.includes('#') ? uri.split('#').at(-1) : uri.split('/').at(-1);
}

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function groupViolations(violations) {
  if (!violations) return [];
  const groups = new Map();
  for (const v of violations) {
    const key = v.resourceType || 'General';
    if (!groups.has(key)) {
      groups.set(key, { type: key, errors: 0, warnings: 0, infos: 0, byRule: new Map() });
    }
    const g = groups.get(key);
    const sev = (v.severity || '').toLowerCase();
    if (sev.includes('violation') || sev === 'error') g.errors++;
    else if (sev.includes('warning')) g.warnings++;
    else g.infos++;

    const rule = v.checkType || 'Unknown rule';
    if (!g.byRule.has(rule)) g.byRule.set(rule, []);
    g.byRule.get(rule).push(v);
  }
  return [...groups.values()]
    .map((g) => ({ ...g, rules: [...g.byRule.entries()].map(([rule, items]) => ({ rule, items })) }))
    .sort((a, b) => b.errors - a.errors || b.warnings - a.warnings);
}

function scoreColor(score) {
  if (score == null) return 'text-zinc-400';
  if (score >= 0.8) return 'text-green-700';
  if (score >= 0.5) return 'text-amber-700';
  return 'text-red-700';
}

function pct(score) {
  return score != null ? `${Math.round(score * 100)}%` : '—';
}

function eq(a, b) {
  return a === b;
}

<template>
  {{pageTitle "Validation report"}}

  <section class="container max-w-4xl py-16">
    {{#if @controller.errorMessage}}
      <div class="card border-red-200 bg-red-50">
        <h2 class="text-lg text-red-800">Something went wrong</h2>
        <p class="mt-2 text-sm text-red-700">{{@controller.errorMessage}}</p>
        <LinkTo @route="index" class="btn-secondary mt-4">Back to start</LinkTo>
      </div>
    {{else}}
      <p class="text-xs uppercase tracking-wider text-zinc-500">
        Validated on {{formatDate @model.createdAt}}
      </p>
      <h1 class="mt-2 text-2xl break-all">{{@model.endpointUrl}}</h1>

      {{! Summary card }}
      <div class="card mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
        <div class="text-center">
          <p class="text-xs uppercase tracking-wider text-zinc-500">Overall</p>
          <p class="mt-1 text-3xl font-semibold {{scoreColor @model.overallScore}}">
            {{pct @model.overallScore}}
          </p>
        </div>
        <div class="text-center">
          <p class="text-xs uppercase tracking-wider text-zinc-500">Datasets</p>
          <p class="mt-1 text-3xl font-semibold text-zinc-800">{{@model.datasetCount}}</p>
        </div>
        <div class="text-center">
          <p class="text-xs uppercase tracking-wider text-zinc-500">Errors</p>
          <p class="mt-1 text-3xl font-semibold text-red-700">{{@model.errorCount}}</p>
        </div>
        <div class="text-center">
          <p class="text-xs uppercase tracking-wider text-zinc-500">Warnings</p>
          <p class="mt-1 text-3xl font-semibold text-amber-700">{{@model.warningCount}}</p>
        </div>
      </div>

      {{! Violations grouped by target class }}
      <h2 class="mt-12 text-lg font-medium">Violations by class</h2>

      {{#each (groupViolations @model.violations) as |group|}}
        <div class="mt-3 overflow-hidden rounded border border-zinc-200">
          <button
            type="button"
            class="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-zinc-50"
            {{on "click" (fn @controller.toggleGroup group.type)}}
          >
            <span class="font-medium text-zinc-800">{{shortLabel group.type}}</span>
            <span class="flex items-center gap-3 text-sm">
              {{#if group.errors}}
                <span class="text-red-700">{{group.errors}} errors</span>
              {{/if}}
              {{#if group.warnings}}
                <span class="text-amber-700">{{group.warnings}} warnings</span>
              {{/if}}
              {{#if group.infos}}
                <span class="text-zinc-500">{{group.infos}} info</span>
              {{/if}}
              <span class="text-zinc-400">
                {{if (eq @controller.expandedGroup group.type) "▲" "▼"}}
              </span>
            </span>
          </button>

          {{#if (eq @controller.expandedGroup group.type)}}
            <div class="divide-y divide-zinc-100 border-t border-zinc-200">
              {{#each group.rules as |ruleGroup|}}
                <div class="px-4 py-3">
                  <p class="text-xs font-medium text-zinc-500">
                    {{shortLabel ruleGroup.rule}}
                    <span class="ml-2 font-normal">
                      ({{ruleGroup.items.length}}
                      {{if (eq ruleGroup.items.length 1) "violation" "violations"}})
                    </span>
                  </p>
                  <ul class="mt-2 space-y-2">
                    {{#each ruleGroup.items as |v|}}
                      <li class="text-sm">
                        {{#if v.resourceUri}}
                          <p class="truncate text-xs text-zinc-400">{{v.resourceUri}}</p>
                        {{/if}}
                        <p class="text-zinc-700">{{v.message}}</p>
                        {{#if v.recommendation}}
                          <p class="mt-0.5 text-xs text-zinc-500">{{v.recommendation}}</p>
                        {{/if}}
                      </li>
                    {{/each}}
                  </ul>
                </div>
              {{/each}}
            </div>
          {{/if}}
        </div>
      {{/each}}

      {{#if @model.expiresAt}}
        <p class="mt-8 text-xs text-zinc-400">
          Report expires {{formatDate @model.expiresAt}}.
        </p>
      {{/if}}
    {{/if}}
  </section>
</template>
