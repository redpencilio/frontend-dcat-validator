import { pageTitle } from 'ember-page-title';

<template>
  {{pageTitle "About"}}

  <section class="container max-w-3xl py-16">
    <h1 class="text-3xl">About the validator</h1>
    <p class="mt-4 text-zinc-700">
      This tool validates DCAT catalog endpoints against the
      <a
        href="https://mobilitydcat-ap.github.io/mobilityDCAT-AP/releases/index.html"
        target="_blank" rel="noopener noreferrer" class="text-red-700 hover:text-red-600"
      >mobilityDCAT-AP</a>
      specification. It crawls paginated catalogs, aggregates the graph, and
      runs both SHACL validation and the deeper semantic-quality checks we
      developed for our
      <a
        href="https://github.com/redpencilio/mobilitydcatap-study"
        target="_blank" rel="noopener noreferrer" class="text-red-700 hover:text-red-600"
      ><em>mobilityDCAT-AP in practice</em> study</a>
      (ITS Europe 2026).
    </p>

    <h2 class="mt-10 text-xl">Methodology</h2>
    <ul class="mt-3 list-disc space-y-2 pl-5 text-zinc-700">
      <li>SHACL validation against the official mobilityDCAT-AP shapes.</li>
      <li>Controlled-vocabulary checks for key properties
        (<code>mobilityTheme</code>,
        <code>mobilityDataStandard</code>,
        <code>applicableLegislation</code>).</li>
      <li>URI reuse and duplication analysis.</li>
      <li>Typo detection on property and class URIs.</li>
      <li>Cardinality and conflicting-rights checks.</li>
      <li>Per-dataset completeness score.</li>
    </ul>

    <h2 class="mt-10 text-xl">Built by redpencil.io</h2>
    <p class="mt-3 text-zinc-700">
      Red Pencil builds semantic web applications. See
      <a
        href="https://redpencil.io"
        target="_blank" rel="noopener noreferrer" class="text-red-700 hover:text-red-600"
      >redpencil.io</a>
      for more.
    </p>
  </section>
</template>
