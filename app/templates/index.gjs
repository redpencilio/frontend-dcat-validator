import { pageTitle } from 'ember-page-title';
import { on } from '@ember/modifier';
import { fn } from '@ember/helper';

<template>
  {{pageTitle "mobilityDCAT-AP Validator"}}

  <section class="bg-gradient-to-b from-zinc-50 to-white">
    <div class="container max-w-3xl py-20 text-center">
      <h1 class="text-4xl sm:text-5xl">
        Go beyond SHACL.<br />Validate your live catalog.
      </h1>
      <p class="mx-auto mt-4 max-w-xl text-zinc-600">
        Point us at your DCAT catalog endpoint. We crawl the full catalog, run
        the official SHACL shapes, and apply the deeper quality checks
        developed during our <em>mobilityDCAT-AP in practice</em> study
        (ITS Europe 2026).
      </p>

      <form
        class="mx-auto mt-10 flex max-w-2xl flex-col gap-3 sm:flex-row"
        {{on "submit" @controller.submit}}
      >
        <input
          type="url"
          required
          placeholder="https://example.org/catalog.ttl"
          value={{@controller.endpointUrl}}
          {{on "input" @controller.updateUrl}}
          class="input flex-1"
          disabled={{@controller.submitting}}
        />
        <button
          type="submit"
          class="btn-primary"
          disabled={{@controller.submitting}}
        >
          {{if @controller.submitting "Starting…" "Validate"}}
        </button>
      </form>

      {{#if @controller.errorMessage}}
        <p class="mt-3 text-sm text-red-700">{{@controller.errorMessage}}</p>
      {{/if}}

      <div class="mt-10 text-left">
        <h2
          class="text-xs font-semibold uppercase tracking-wider text-zinc-500"
        >
          Try a known National Access Point
        </h2>
        <ul class="mt-3 grid gap-2 sm:grid-cols-3">
          {{#each @controller.knownEndpoints as |endpoint|}}
            <li>
              <button
                type="button"
                class="w-full rounded border border-zinc-200 bg-white px-3 py-2 text-left text-sm hover:border-red-300 hover:bg-red-50"
                {{on "click" (fn @controller.useExample endpoint.url)}}
              >
                <span
                  class="block text-xs text-zinc-500"
                >{{endpoint.country}}</span>
                <span
                  class="block font-medium text-zinc-900"
                >{{endpoint.label}}</span>
              </button>
            </li>
          {{/each}}
        </ul>
      </div>
    </div>
  </section>

  <section class="container max-w-5xl py-16">
    <div class="grid gap-8 md:grid-cols-3">
      <div class="card">
        <div
          class="mb-3 flex h-8 w-8 items-center justify-center rounded bg-red-50 text-red-700"
        >
          1
        </div>
        <h3 class="text-lg">Crawl</h3>
        <p class="mt-2 text-sm text-zinc-600">
          We follow Hydra pagination (the pattern most CKAN-based NAPs use) and
          aggregate every page into a single graph.
        </p>
      </div>
      <div class="card">
        <div
          class="mb-3 flex h-8 w-8 items-center justify-center rounded bg-red-50 text-red-700"
        >
          2
        </div>
        <h3 class="text-lg">Validate</h3>
        <p class="mt-2 text-sm text-zinc-600">
          SHACL validation against the official mobilityDCAT-AP shapes, plus
          our deeper semantic-quality checks.
        </p>
      </div>
      <div class="card">
        <div
          class="mb-3 flex h-8 w-8 items-center justify-center rounded bg-red-50 text-red-700"
        >
          3
        </div>
        <h3 class="text-lg">Share</h3>
        <p class="mt-2 text-sm text-zinc-600">
          Every report gets a permalink so you can share findings with NAP
          operators and track improvements over time.
        </p>
      </div>
    </div>
  </section>
</template>
