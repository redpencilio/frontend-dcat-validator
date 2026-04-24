const currentYear = new Date().getFullYear();

<template>
  <footer class="mt-24 bg-gradient-to-r from-zinc-100 to-zinc-50">
    <div class="container grid gap-10 py-12 md:grid-cols-3">
      <div class="space-y-4">
            <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          About us
        </h4>
        <p class="max-w-sm text-sm text-zinc-600">
          Built by
          <a
            href="https://redpencil.io"
            target="_blank" rel="noopener noreferrer" class="font-medium text-red-700 hover:text-red-600"
          >redpencil.io</a>. We build interoperable, open-data platforms on the
          semantic web.
        </p>
      </div>

      <div class="text-sm">
        <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          About this tool
        </h4>
        <p class="text-zinc-600">
          Validates DCAT catalog endpoints against the
          <a
            href="https://mobilitydcat-ap.github.io/mobilityDCAT-AP/releases/index.html"
            target="_blank" rel="noopener noreferrer" class="text-red-700 hover:text-red-600"
          >mobilityDCAT-AP</a>
          specification, including the deeper checks developed during our
          <em>mobilityDCAT-AP in practice</em>
          study (ITS Europe 2026).
        </p>
      </div>

      <div class="text-sm">
        <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Resources
        </h4>
        <ul class="space-y-2 text-zinc-600">
          <li><a
              href="https://github.com/redpencilio/mobilitydcatap-study"
              target="_blank" rel="noopener noreferrer" class="hover:text-zinc-900"
            ><em>mobilityDCAT-AP in practice</em> (ITS Europe 2026)</a></li>
          <li><a
              href="https://github.com/mobilityDCAT-AP/mobilityDCAT-AP"
              target="_blank" rel="noopener noreferrer" class="hover:text-zinc-900"
            >Official SHACL shapes</a></li>
        </ul>
      </div>
    </div>

    <div class="border-t border-zinc-200">
      <div class="container py-4 text-xs text-zinc-500">
        &copy; {{currentYear}} Red Pencil. MIT licensed.
      </div>
    </div>
  </footer>
</template>
