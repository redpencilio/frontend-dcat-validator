import { LinkTo } from '@ember/routing';

<template>
  <header class="border-b border-zinc-200 bg-white">
    <div class="container flex items-center justify-between py-4">
      <LinkTo @route="index" class="flex items-center gap-3">
        <img
          src="/assets/vector/rpio-logo.svg"
          alt="mobilityDCAT-AP Validator"
          class="h-8 w-auto"
        />
        <span class="hidden text-sm font-medium text-zinc-900 sm:inline">
          mobilityDCAT-AP Validator
        </span>
      </LinkTo>

      <nav class="flex items-center gap-6 text-sm">
        <LinkTo
          @route="index"
          class="text-zinc-700 hover:text-zinc-900"
        >Home</LinkTo>
        <LinkTo
          @route="about"
          class="text-zinc-700 hover:text-zinc-900"
        >About</LinkTo>
      </nav>
    </div>
  </header>
</template>
