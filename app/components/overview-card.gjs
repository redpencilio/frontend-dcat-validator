import Component from '@glimmer/component';

const TIER_CONFIG = {
  violation: {
    title: 'Mandatory Compliance',
    titleColor: 'text-red-600',
    validBarColor: 'bg-green-500',
    vocabBarColor: 'bg-green-300',
  },
  warning: {
    title: 'Recommended Compliance',
    titleColor: 'text-amber-600',
    validBarColor: 'bg-amber-400',
    vocabBarColor: 'bg-amber-200',
  },
  info: {
    title: 'Optional Compliance',
    titleColor: 'text-zinc-400',
    validBarColor: 'bg-zinc-400',
    vocabBarColor: 'bg-zinc-200'
  }
};

export default class OverviewCard extends Component {
  get config() {
    const tier = this.args.tier || 'violation';
    return TIER_CONFIG[tier] || TIER_CONFIG.violation;
  }

  get title() {
    return this.args.title || this.config.title;
  }

  get titleColor() {
    return this.args.titleColor || this.config.titleColor;
  }

  get validBarColor() {
    return this.args.validBarColor || this.config.validBarColor;
  }

  get vocabBarColor() {
    return this.args.vocabBarColor || this.config.vocabBarColor;
  }

  <template>
    {{#if @stats}}
      <div class="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <span
            class="text-[11px] font-bold uppercase tracking-[0.16em]
              {{this.titleColor}}"
          >
            {{this.title}}
          </span>
        </div>

        <div class="mt-4 flex items-baseline gap-2">
          <span class="text-4xl font-extrabold tracking-tight text-zinc-900">
            {{@stats.validPct}}%
          </span>
          {{#if @stats.hasVocabInvalid}}
            <span class="text-xs text-zinc-400">
              ({{@stats.coveredPct}}% covered)
            </span>
          {{/if}}
        </div>

        {{! Stacked Mini-Progress Bar }}
        <div
          class="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-zinc-100"
        >
          <div
            class="{{this.validBarColor}} transition-all duration-500"
            style={{@stats.validWidthStyle}}
          ></div>
          <div
            class="{{this.vocabBarColor}} transition-all duration-500"
            style={{@stats.vocabInvalidWidthStyle}}
          ></div>
        </div>

        <p class="mt-3 text-xs text-zinc-500">
          <span class="font-medium text-zinc-700">{{@stats.totalValid}}
            /
            {{@stats.totalExpected}}</span>
          checks compliant
          {{#if @stats.hasVocabInvalid}}
            ·
            <span class="font-medium text-red-600">{{@stats.totalVocabInvalid}}
              invalid vocabulary</span>
          {{/if}}
        </p>
      </div>
    {{/if}}
  </template>
}
