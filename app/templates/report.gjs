import { pageTitle } from 'ember-page-title';
import { LinkTo } from '@ember/routing';
import ClassAccordion from '../components/class-accordion';
import {
  totalResources,
  sortedClasses,
  formatDate,
  mergedClassSummaries,
  specInfo
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

      {{! ── Coverage & Vocabulary ── }}
      <section class="mt-10">
        <h2
          class="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400"
        >
          Coverage &amp; Vocabulary Compliance
        </h2>

        {{#let
          (mergedClassSummaries
            @model.targetClassSummaries
            @controller.vocabReport
            @controller.shaclReport
          )
          as |summaries|
        }}
          {{#each (sortedClasses summaries) as |cls|}}
            <ClassAccordion @cls={{cls}} @showInvalidTerms={{true}} />
          {{/each}}
        {{/let}}
      </section>
    {{/if}}
  </article>
</template>
