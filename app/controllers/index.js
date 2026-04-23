import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { createRecord } from '@warp-drive/utilities/json-api';

const KNOWN_ENDPOINTS = [
  {
    country: 'Belgium',
    label: 'transportdata.be',
    url: 'https://transportdata.be/catalog.ttl',
  },
  {
    country: 'Germany',
    label: 'mobilithek.info',
    url: 'https://mobilithek.info/mdp-api/files/aux/catalog',
  },
  {
    country: 'France',
    label: 'transport.data.gouv.fr',
    url: 'https://transport.data.gouv.fr/api/datasets',
  },
];

export default class IndexController extends Controller {
  @service store;
  @service router;

  knownEndpoints = KNOWN_ENDPOINTS;

  @tracked endpointUrl = '';
  @tracked submitting = false;
  @tracked errorMessage = null;

  @action
  updateUrl(event) {
    this.endpointUrl = event.target.value;
    this.errorMessage = null;
  }

  @action
  useExample(url) {
    this.endpointUrl = url;
    this.errorMessage = null;
  }

  @action
  async submit(event) {
    event.preventDefault();
    if (!this.endpointUrl || this.submitting) return;

    this.submitting = true;
    this.errorMessage = null;

    try {
      const job = this.store.createRecord('validation-job', {
        endpointUrl: this.endpointUrl,
        status: 'pending',
      });
      await this.store.request(createRecord(job));
      this.router.transitionTo('job', job.id);
    } catch (err) {
      this.errorMessage =
        err?.message || 'Could not start validation. Please try again.';
      this.submitting = false;
    }
  }
}
