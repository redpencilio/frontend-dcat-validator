import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';

export default class JobController extends Controller {
  @tracked errorMessage = null;
}
