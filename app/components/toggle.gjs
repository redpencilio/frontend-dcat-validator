import { on } from '@ember/modifier';
import { fn } from '@ember/helper';

const DEFAULT_OPTIONS = [
  { value: '1.1.0', label: 'mobilityDCAT-AP 1.1.0' },
  { value: '3.0.0', label: 'mobilityDCAT-AP 3.0.0' },
];

function eq(a, b) {
  return a === b;
}

function getOptions(options) {
  return options || DEFAULT_OPTIONS;
}

<template>
  <div class="flex flex-wrap items-center justify-center gap-2.5 text-sm">
    {{#if @label}}
      <span class="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {{@label}}
      </span>
    {{/if}}

    <div
      class="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-100 p-0.5"
      role="radiogroup"
    >
      {{#each (getOptions @options) as |option|}}
        {{#let (eq @value option.value) as |isSelected|}}
          <button
            type="button"
            class="rounded-full px-3.5 py-1 text-xs font-medium focus:outline-none
              {{if isSelected
                'bg-red-700 text-white font-semibold'
                'text-zinc-400 hover:text-zinc-700'
              }}
              {{if @disabled 'opacity-50 cursor-not-allowed' 'cursor-pointer'}}"
            disabled={{@disabled}}
            aria-checked={{if isSelected "true" "false"}}
            role="radio"
            {{on "click" (fn @onChange option.value)}}
          >
            {{option.label}}
          </button>
        {{/let}}
      {{/each}}
    </div>
  </div>
</template>
