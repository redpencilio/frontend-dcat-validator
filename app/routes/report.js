import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { findRecord } from '@warp-drive/utilities/json-api';
import { fetchLatestReport } from 'rpio-dcat-validator/utils/fetch-latest-report';
import { friendlyError } from 'rpio-dcat-validator/utils/errors';

export default class ReportRoute extends Route {
  @service store;

  #loadError = null;

  async model(params) {
    this.#loadError = null;
    try {
      const { content } = await this.store.request(
        findRecord('validation-summary', params.report_id, {
          reload: true,
          include: [
            'coverage-job',
            'target-class-summaries.rule-summaries.rule-violations',
            'coverage-job.vocabulary-report.target-class-summaries.rule-summaries.rule-violations',
          ],
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
    controller.reportDate = null;
    controller.latestReportId = null;
    controller.latestReportDate = null;
    controller.vocabReport = null;

    const jobId = model?.['coverage-job']?.data?.id;
    if (jobId) {
      try {
        const job = this.store.peekRecord('validation-jobs', jobId);
        controller.reportDate = job?.modifiedAt ?? job?.createdAt ?? null;
        const vocabId = job?.['vocabulary-report']?.data?.id;
        if (vocabId) {
          controller.vocabReport = this.store.peekRecord(
            'validation-summaries',
            vocabId,
          );
        }
      } catch {
        // date unavailable
      }
    }

    if (model?.endpointUrl) {
      fetchLatestReport(model.endpointUrl).then((latest) => {
        if (latest?.id && latest.id !== model.id) {
          controller.latestReportId = latest.id;
          controller.latestReportDate = latest.date;
        }
      });
    }
  }
}
