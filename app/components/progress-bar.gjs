import Component from '@glimmer/component';

export default class ProgressBar extends Component {
  get isDeterminate() {
    return (
      typeof this.args.value === 'number' &&
      typeof this.args.max === 'number' &&
      this.args.max > 0
    );
  }

  get fillStyle() {
    const pct = Math.min(
      100,
      Math.max(0, (this.args.value / this.args.max) * 100),
    );
    return `width: ${pct}%;`;
  }

  <template>
    <div class="progress-bar" role="progressbar" aria-busy="true">
      {{#if this.isDeterminate}}
        <div class="progress-bar-fill" style={{this.fillStyle}}></div>
      {{else}}
        <div class="progress-bar-shimmer"></div>
      {{/if}}
    </div>
  </template>
}
