import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { findRecord } from '@warp-drive/utilities/json-api';

function friendlyError(err) {
  const status = err?.status ?? err?.response?.status;
  if (status >= 500) return 'Something went wrong on our side. Please try again in a moment.';
  if (status === 404) return 'This job could not be found.';
  return err?.message || 'Failed to load this job. Please try again.';
}

const SLOW_POLL_MS = 10_000;
const FAST_POLL_MS = 3_000;
const SPEED_UP_AFTER_MS = 30_000;

export default class JobRoute extends Route {
  @service store;
  @service router;

  #startedAt = null;
  #timer = null;
  #currentId = null;
  #loadError = null;

  async model(params) {
    this.#currentId = params.job_id;
    this.#loadError = null;
    try {
      const { content } = await this.store.request(
        findRecord('validation-job', params.job_id, {
          reload: true,
          include: ['coverage-report', 'error'],
        }),
      );
      return content.data;
    } catch (err) {
      this.#loadError = friendlyError(err);
      return null;
    }
  }

  setupController(controller, model) {
    super.setupController(controller, model);
    controller.errorMessage = null;
    if (this.#loadError) {
      controller.errorMessage = this.#loadError;
    } else if (model) {
      const status = (model.status || '').split('/').at(-1).toLowerCase();
      if (status === 'failed' || status === 'error') {
        controller.errorMessage = this.#jobErrorMessage(model) || 'Something went wrong while validating this catalog.';
      }
    }
  }

  #jobErrorMessage(job) {
    const errorId = job['error']?.data?.id;
    if (!errorId) return null;
    const record = this.store.peekRecord('job-errors', errorId);
    return record?.message || null;
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
          include: ['coverage-report', 'error'],
        }),
      );
      const job = content.data;
      const status = (job.status || '').split('/').at(-1).toLowerCase();

      if (status === 'finished' || status === 'success') {
        if (job['coverage-report']?.data?.id) {
          this.router.replaceWith('report', job['coverage-report'].data.id);
        }
        return;
      }

      if (status === 'failed' || status === 'error') {
        this.controller.errorMessage = this.#jobErrorMessage(job) || 'Something went wrong while validating this catalog.';
        return;
      }
    } catch (err) {
      this.controller.errorMessage = friendlyError(err);
      return;
    }

    if (this.#currentId) this.#schedule();
  }
}
