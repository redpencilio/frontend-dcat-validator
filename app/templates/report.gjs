import { pageTitle } from 'ember-page-title';
import { LinkTo } from '@ember/routing';
import ClassAccordion from '../components/class-accordion';
import shortLabel from '../utils/uri-labels';
import {
  totalResources,
  sortedClasses,
  formatDate,
  splitToArray,
  mergedClassSummaries,
  specInfo,
  overallTierStats,
} from '../utils/report-helpers';

<template>
  {{pageTitle "Validation Report"}}

  <article class="container py-12 print:py-6">
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
          {{#let (specInfo @controller.dcatApVersion) as |spec|}}
            <a href={{spec.url}}
              target="_blank" rel="noopener noreferrer"
              class="hover:text-zinc-600 hover:underline">
              {{spec.label}}
            </a>
          {{/let}}
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
          {{totalResources @model.targetClassSummaries}}
          resources reviewed ·
          {{#if @model.totalViolations}}
            <span class="font-semibold text-red-600">{{@model.totalViolations}}
              violations</span>
          {{else}}
            <span class="font-semibold text-green-600">No violations</span>
          {{/if}}
        </p>
      </header>

      {{#if @controller.latestReportId}}
        <div
          class="mt-6 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800"
        >
          <span>
            A newer report is available
            {{#let (formatDate @controller.latestReportDate) as |d|}}
              {{#if d}} from {{d}}{{/if}}
            {{/let}}.
          </span>
          <LinkTo
            @route="report"
            @model={{@controller.latestReportId}}
            class="font-semibold underline hover:text-amber-900"
          >
            View latest report
          </LinkTo>
        </div>
      {{/if}}
        {{#let
          (mergedClassSummaries
            @model.targetClassSummaries
            @controller.vocabReport
            @controller.shaclReport
          )
          as |summaries|
        }}
        <section class="mt-10">
          <h2
            class="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400"
          >
            Compliance Overview
          </h2>

          <div class="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {{! 1. MANDATORY COMPLIANCE CARD }}
            {{#let (overallTierStats summaries "violation") as |mand|}}
              <div class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold uppercase tracking-[0.16em] text-red-600">
                    Mandatory Compliance
                  </span>
                  <span class="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                    Strict Specification
                  </span>
                </div>

                <div class="mt-4 flex items-baseline gap-2">
                  <span class="text-4xl font-extrabold tracking-tight text-zinc-900">
                    {{mand.validPct}}%
                  </span>
                  {{#if mand.hasVocabInvalid}}
                    <span class="text-xs text-zinc-400">
                      ({{mand.coveredPct}}% covered)
                    </span>
                  {{/if}}
                </div>

                {{! Stacked Mini-Progress Bar }}
                <div class="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div class="bg-green-500 transition-all duration-500" style={{mand.validWidthStyle}}></div>
                  <div class="bg-green-300 transition-all duration-500" style={{mand.vocabInvalidWidthStyle}}></div>
                </div>

                <p class="mt-3 text-xs text-zinc-500">
                  <span class="font-medium text-zinc-700">{{mand.totalValid}} / {{mand.totalExpected}}</span> checks compliant
                  {{#if mand.hasVocabInvalid}}
                    · <span class="font-medium text-red-600">{{mand.totalVocabInvalid}} invalid vocabulary</span>
                  {{/if}}
                </p>
              </div>
            {{/let}}

            {{! 2. RECOMMENDED COMPLIANCE CARD }}
            {{#let (overallTierStats summaries "warning") as |rec|}}
              <div class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-600">
                    Recommended Compliance
                  </span>
                  <span class="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                    Quality &amp; Richness
                  </span>
                </div>

                <div class="mt-4 flex items-baseline gap-2">
                  <span class="text-4xl font-extrabold tracking-tight text-zinc-900">
                    {{rec.validPct}}%
                  </span>
                  {{#if rec.hasVocabInvalid}}
                    <span class="text-xs text-zinc-400">
                      ({{rec.coveredPct}}% covered)
                    </span>
                  {{/if}}
                </div>

                {{! Stacked Mini-Progress Bar }}
                <div class="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div class="bg-amber-400 transition-all duration-500" style={{rec.validWidthStyle}}></div>
                  <div class="bg-amber-200 transition-all duration-500" style={{rec.vocabInvalidWidthStyle}}></div>
                </div>

                <p class="mt-3 text-xs text-zinc-500">
                  <span class="font-medium text-zinc-700">{{rec.totalValid}} / {{rec.totalExpected}}</span> checks compliant
                  {{#if rec.hasVocabInvalid}}
                    · <span class="font-medium text-red-600">{{rec.totalVocabInvalid}} invalid vocabulary</span>
                  {{/if}}
                </p>
              </div>
            {{/let}}
          </div>
        </section>

        {{! ── Detailed Breakdown ── }}
        <section class="mt-10">
          <h2
            class="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400"
          >
            Detailed Report
          </h2>

          <div class="mt-4 space-y-3">
            {{#each (sortedClasses summaries) as |cls|}}
              <ClassAccordion @cls={{cls}} @showInvalidTerms={{true}} />
            {{/each}}
          </div>
        </section>
      {{/let}}
    {{/if}}
  </article>
</template>
