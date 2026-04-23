import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { findRecord } from '@warp-drive/utilities/json-api';

const SLOW_POLL_MS = 10_000;
const FAST_POLL_MS = 3_000;
const SPEED_UP_AFTER_MS = 30_000;

export default class JobRoute extends Route {
  @service store;
  @service router;

  #startedAt = null;
  #timer = null;
  #currentId = null;

  async model(params) {
    this.#currentId = params.job_id;
    const { content } = await this.store.request(
      findRecord('validation-job', params.job_id, {
        reload: true,
        include: ['report'],
      }),
    );
    return content.data;
  }

  activate() {
    this.#startedAt = Date.now();
    this.#schedule();
  }

  deactivate() {
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = null;
    this.#startedAt = null;
    this.#currentId = null;
  }

  #schedule() {
    const elapsed = Date.now() - this.#startedAt;
    const delay = elapsed > SPEED_UP_AFTER_MS ? FAST_POLL_MS : SLOW_POLL_MS;
    this.#timer = setTimeout(() => this.#tick(), delay);
  }

  async #tick() {
    if (!this.#currentId) return;
    try {
      const { content } = await this.store.request(
        findRecord('validation-job', this.#currentId, {
          reload: true,
          include: ['report'],
        }),
      );
      const job = content.data;
      const status = (job.status || '').toLowerCase();

      if (status === 'completed' || status === 'success') {
        if (job.report?.id) {
          this.router.replaceWith('report', job.report.id);
        }
        return;
      }

      if (status === 'failed' || status === 'error') {
        return;
      }
    } catch (err) {
      console.warn('job poll failed', err);
    }

    if (this.#currentId) this.#schedule();
  }
}
