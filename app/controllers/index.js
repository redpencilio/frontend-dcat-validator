import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { recordIdentifierFor } from '@warp-drive/core';
import {
  createRecord,
  serializeResources,
} from '@warp-drive/utilities/json-api';

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

function humanizeSeconds(s) {
  if (!s || s < 1) return 'a moment';
  if (s < 60) return `${Math.round(s)} seconds`;
  const minutes = Math.round(s / 60);
  if (minutes < 60) return minutes === 1 ? '1 minute' : `${minutes} minutes`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? '1 hour' : `${hours} hours`;
}

function messageForError(apiError) {
  const { code, detail, meta } = apiError;
  switch (code) {
    case 'invalid_url':
      return "That URL doesn't look right. Double-check the address and try again.";
    case 'invalid_protocol':
      return 'Only http:// or https:// URLs are accepted.';
    case 'missing_endpoint_url':
      return 'Please enter a catalog URL first.';
    case 'blocked_host':
      return 'That host is not accepted. Public catalogs only — internal or private addresses are blocked.';
    case 'unresolvable_host':
      return "We couldn't resolve that hostname. Is the URL correct?";
    case 'rate_limited': {
      const wait = humanizeSeconds(meta?.retry_after_seconds);
      return `Too many validations recently. Please try again in ${wait}.`;
    }
    case 'internal_error':
      return 'Something went wrong on our side. Please try again in a moment.';
    default:
      return detail || 'Could not start validation. Please try again.';
  }
}

function friendlyError(err) {
  const errors = err?.content?.errors || err?.errors;
  const first = Array.isArray(errors) ? errors[0] : null;
  if (first) return messageForError(first);
  return err?.message || 'Could not start validation. Please try again.';
}

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
      const job = this.store.createRecord('validation-jobs', {
        endpointUrl: this.endpointUrl,
      });
      const init = createRecord(job);
      init.body = JSON.stringify(
        serializeResources(this.store.cache, recordIdentifierFor(job)),
      );
      init.headers.set('Content-Type', 'application/vnd.api+json');
      const response = await this.store.request(init);
      const reportId = response?.content?.data?.report?.id;
      await new Promise((resolve) => setTimeout(resolve, 2000));
      if (reportId) {
        this.router.replaceWith('report', reportId);
      } else {
        this.router.transitionTo('job', job.id);
      }
    } catch (err) {
      this.errorMessage = friendlyError(err);
      this.submitting = false;
    }
  }
}
