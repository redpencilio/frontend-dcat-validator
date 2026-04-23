import { pageTitle } from 'ember-page-title';
import { LinkTo } from '@ember/routing';
import ProgressBar from 'rpio-dcat-validator/components/progress-bar';

function statusOf(model) {
  return (model?.status || '').toLowerCase();
}

function isDone(model) {
  const s = statusOf(model);
  return s === 'completed' || s === 'success';
}

function isFailed(model) {
  const s = statusOf(model);
  return s === 'failed' || s === 'error';
}

<template>
  {{pageTitle "Validation in progress"}}

  <section class="container max-w-2xl py-16">
    <p class="text-xs uppercase tracking-wider text-zinc-500">Job
      {{@model.id}}</p>
    <h1 class="mt-2 text-2xl">
      Validating
      <span class="font-normal text-zinc-700">{{@model.endpointUrl}}</span>
    </h1>

    {{#if (isDone @model)}}
      <div class="card mt-8 border-green-200 bg-green-50 text-center">
        <h2 class="text-lg text-green-800">Validation complete</h2>
        <p class="mt-2 text-sm text-green-700">Redirecting to the report…</p>
      </div>
    {{else if (isFailed @model)}}
      <div class="card mt-8 border-red-200 bg-red-50">
        <h2 class="text-lg text-red-800">Validation failed</h2>
        {{#if @model.errorMessage}}
          <p class="mt-2 text-sm text-red-700">{{@model.errorMessage}}</p>
        {{else}}
          <p class="mt-2 text-sm text-red-700">
            Something went wrong while validating this catalog.
          </p>
        {{/if}}
        <LinkTo @route="index" class="btn-secondary mt-4">
          Back to start
        </LinkTo>
      </div>
    {{else}}
      <div class="card mt-8">
        <div class="flex items-baseline justify-between">
          <h2 class="text-sm font-medium text-zinc-800">
            {{#if @model.datasetsFound}}
              Crawling catalog
            {{else}}
              Discovering catalog
            {{/if}}
          </h2>
          <span class="text-xs tabular-nums text-zinc-500">
            {{#if @model.pagesFetched}}
              {{@model.pagesFetched}}
              pages
              {{#if @model.datasetsFound}}
                · {{@model.datasetsFound}} datasets
              {{/if}}
            {{else}}
              status: {{@model.status}}
            {{/if}}
          </span>
        </div>

        <div class="mt-3">
          <ProgressBar
            @value={{@model.pagesFetched}}
            @max={{@model.totalPages}}
          />
        </div>

        <p class="mt-4 text-xs text-zinc-500">
          Page refreshes automatically. You can safely leave this tab open.
        </p>
      </div>
    {{/if}}
  </section>
</template>
