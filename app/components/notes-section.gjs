import Component from '@glimmer/component';

export default class NotesSection extends Component {
  <template>
    {{#if @comment}}
      <section class="mt-10">
        <h2 class="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">
          Note
        </h2>
        <div class="mt-3 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-5 py-3.5 text-sm text-amber-800">
          <span>
            {{@comment}}
          </span>
        </div>
      </section>
    {{/if}}
  </template>
}
