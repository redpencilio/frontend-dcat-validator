import Component from '@glimmer/component';
import { helper } from '@ember/component/helper';
import { ruleStats } from '../utils/report-helpers';

const gt = helper(function ([a, b]) {
  return a > b;
});

export default class StackedProgressBar extends Component {
  get validColor() {
    return this.args.validColor || 'bg-green-500';
  }

  get vocabColor() {
    return this.args.vocabColor || 'bg-green-300';
  }

  get stats() {
    if (this.args.stats) {
      return this.args.stats;
    }
    if (this.args.rule && this.args.cls) {
      return ruleStats(this.args.rule, this.args.cls);
    }
    return null;
  }

  get fullTitle() {
    if (!this.stats) return '';
    const s = this.stats;
    if (s.total === 0) return 'No resources';
    if (s.vocabInvalid > 0) {
      return `Coverage: ${s.covered}/${s.total} (${s.coveredPct}%) | Valid vocabulary: ${s.valid}/${s.total} (${s.validPct}%) | Invalid vocabulary: ${s.vocabInvalid}/${s.total} (${s.vocabInvalidPct}%) | Not covered: ${s.missing}/${s.total} (${s.missingPct}%)`;
    }
    return `Coverage: ${s.covered}/${s.total} (${s.coveredPct}%) | Not covered: ${s.missing}/${s.total} (${s.missingPct}%)`;
  }

  <template>
    {{#if this.stats}}
      <div
        class="flex h-2 w-36 overflow-hidden rounded-full bg-zinc-100 ring-1 ring-zinc-200/50"
        role="progressbar"
        aria-valuenow={{this.stats.validPct}}
        aria-valuemin="0"
        aria-valuemax="100"
        title={{this.fullTitle}}
      >
        {{#if (gt this.stats.valid 0)}}
          <div
            class="h-full {{this.validColor}} transition-all hover:brightness-95"
            style={{this.stats.validWidthStyle}}
            title="Valid vocabulary (vocab + coverage good): {{this.stats.valid}} / {{this.stats.total}} ({{this.stats.validPct}}%)"
          ></div>
        {{/if}}
        {{#if (gt this.stats.vocabInvalid 0)}}
          <div
            class="h-full {{this.vocabColor}} transition-all hover:brightness-95"
            style={{this.stats.vocabInvalidWidthStyle}}
            title="Invalid vocabulary (coverage good): {{this.stats.vocabInvalid}} / {{this.stats.total}} ({{this.stats.vocabInvalidPct}}%)"
          ></div>
        {{/if}}
      </div>
    {{/if}}
  </template>
}
