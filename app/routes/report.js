import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { findRecord } from '@warp-drive/utilities/json-api';

function friendlyError(err) {
  const status = err?.status ?? err?.response?.status;
  if (status >= 500)
    return 'Something went wrong on our side. Please try again in a moment.';
  if (status === 404) return 'This report could not be found.';
  return err?.message || 'Failed to load this report. Please try again.';
}

export default class ReportRoute extends Route {
  @service store;

  #loadError = null;

  async model(params) {
    this.#loadError = null;
    try {
      const { content } = await this.store.request(
        findRecord('validation-reports', params.report_id, {
          reload: true,
          include: ['violations'],
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
    controller.errorMessage = this.#loadError;
    controller.expandedGroup = null;
  }
}
