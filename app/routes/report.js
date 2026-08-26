import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { findRecord } from '@warp-drive/utilities/json-api';
import { fetchLatestReport } from 'rpio-dcat-validator/utils/fetch-latest-report';

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
        findRecord('validation-summary', params.report_id, {
          reload: true,
          include: [
            'coverage-job',
            'target-class-summaries',
            'target-class-summaries.rule-summaries',
            'target-class-summaries.rule-summaries.rule-violations',
            'coverage-job.vocabulary-report',
            'coverage-job.vocabulary-report.target-class-summaries',
            'coverage-job.vocabulary-report.target-class-summaries.rule-summaries',
            'coverage-job.vocabulary-report.target-class-summaries.rule-summaries.rule-violations',
            'coverage-job.vocabulary-report.target-class-summaries.rule-summaries.rule-violations.suggestions',
            'target-class-summaries.rule-summaries.rule-violations.suggestions',
            'coverage-job.shacl-report',
            'coverage-job.shacl-report.target-class-summaries',
            'coverage-job.shacl-report.target-class-summaries.rule-summaries',
            'coverage-job.shacl-report.target-class-summaries.rule-summaries.rule-violations',
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
    controller.expandedGroup = null;
    controller.reportDate = null;
    controller.latestReportId = null;
    controller.latestReportDate = null;
    controller.vocabReport = null;
    controller.shaclReport = null;
    controller.dcatApVersion = '1.1.0';

    const jobId = model?.['coverage-job']?.data?.id;
    const job = jobId ? this.store.peekRecord('validation-jobs', jobId) : null;
    if (job) {
      try {
        controller.reportDate = job?.modifiedAt ?? job?.createdAt ?? null;
        const vocabId = job?.['vocabulary-report']?.data?.id;
        if (vocabId) {
          controller.vocabReport = this.store.peekRecord(
            'validation-summaries',
            vocabId,
          );
        }
        const shaclId = job?.['shacl-report']?.data?.id;
        if (shaclId) {
          controller.shaclReport = this.store.peekRecord(
            'validation-summaries',
            shaclId,
          );
        }
        controller.dcatApVersion = job?.dcatApVersion || '1.1.0';
      } catch {
        // date unavailable
      }
    }

    if (model?.endpointUrl) {
      fetchLatestReport(model.endpointUrl, controller.dcatApVersion).then(
        (latest) => {
          if (latest?.id && latest.id !== model.id) {
            controller.latestReportId = latest.id;
            controller.latestReportDate = latest.date;
          }
        },
      );
    }
  }
}
