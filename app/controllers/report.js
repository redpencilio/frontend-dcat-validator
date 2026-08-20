import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class ReportController extends Controller {
  @tracked errorMessage = null;
  @tracked reportDate = null;
  @tracked latestReportId = null;
  @tracked latestReportDate = null;
  @tracked vocabReport = null;
  @tracked shaclReport = null;
}

