import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { on } from '@ember/modifier';
import { fn } from '@ember/helper';
import EmberPopover from 'ember-tooltips/components/ember-popover';
import shortLabel from '../utils/uri-labels';
import { eq, get } from '../helpers/template';

export default class InvalidTermBadge extends Component {
  @tracked copiedUri = null;
  timeoutId = null;

  @action
  async copyToClipboard(uri, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!uri) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(uri);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = uri;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      this.copiedUri = uri;
      if (this.timeoutId) clearTimeout(this.timeoutId);
      this.timeoutId = setTimeout(() => {
        this.copiedUri = null;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  }

  willDestroy() {
    super.willDestroy(...arguments);
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  <template>
    <span class="inline-block relative">
      <span
        class="mb-1 inline-block rounded bg-transparent px-1.5 py-0.5 font-mono text-red-600 transition-colors hover:bg-red-50 hover:underline cursor-pointer"
      >
        {{shortLabel @term.value}}
        <EmberPopover
          @side="bottom"
          @spacing={{6}}
          @popoverHideDelay={{300}}
          @popperContainer="body"
          @tooltipClass="term-popover"
        >
          <div
            class="w-80 max-w-sm rounded-lg border border-zinc-200 bg-white p-3 text-left shadow-xl text-xs text-zinc-700 font-sans"
          >
            <div class="mb-2.5">
              <div
                class="text-[10px] font-bold uppercase tracking-wider text-red-600 mb-1"
              >
                Invalid Term
              </div>
              <div class="font-mono text-[11px] text-red-900 break-all select-text">
                {{@term.value}}
              </div>
            </div>

            {{#if @term.suggestions.length}}
              <div class="border-t border-zinc-100 pt-2">
                <div
                  class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5"
                >
                  <span>Did you mean:</span>
                </div>
                <div class="space-y-1 max-h-48 overflow-y-auto pr-0.5">
                  {{#each @term.suggestions as |sug|}}
                    {{#let (if (get sug "value") sug.value sug) as |sugValue|}}
                      <button
                        type="button"
                        class="group w-full flex items-center justify-between gap-2 rounded p-1.5 font-mono text-[11px] text-left text-zinc-800 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 hover:border-zinc-300 transition-colors cursor-pointer"
                        title="Click to copy suggestion"
                        {{on "click" (fn this.copyToClipboard sugValue)}}
                      >
                        <span
                          class="break-all text-zinc-900 font-medium"
                        >{{sugValue}}</span>
                        <span
                          class="shrink-0 flex items-center gap-1 text-[10px] font-sans"
                        >
                          {{#if (eq this.copiedUri sugValue)}}
                            <span
                              class="text-green-600 font-semibold flex items-center gap-0.5"
                            >
                              <svg
                                class="h-3 w-3"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fill-rule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clip-rule="evenodd"
                                />
                              </svg>
                              Copied!
                            </span>
                          {{else}}
                            <span
                              class="text-zinc-400 group-hover:text-zinc-700 flex items-center"
                            >
                              <svg
                                class="h-3.5 w-3.5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
                                />
                                <path
                                  d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 2H9a3 3 0 01-3-2z"
                                />
                              </svg>
                            </span>
                          {{/if}}
                        </span>
                      </button>
                    {{/let}}
                  {{/each}}
                </div>
              </div>
            {{/if}}
          </div>
        </EmberPopover>
      </span>
    </span>
  </template>
}
