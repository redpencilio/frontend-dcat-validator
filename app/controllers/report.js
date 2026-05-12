import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class ReportController extends Controller {
  @tracked errorMessage = null;
  @tracked expandedGroup = null;
  @tracked reportDate = null;
  @tracked latestReportId = null;
  @tracked latestReportDate = null;

  @action
  toggleGroup(type) {
    this.expandedGroup = this.expandedGroup === type ? null : type;
  }
}
