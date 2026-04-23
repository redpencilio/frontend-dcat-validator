import EmberRouter from '@embroider/router';
import config from 'rpio-dcat-validator/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  this.route('about');
  this.route('job', { path: '/jobs/:job_id' });
  this.route('report', { path: '/reports/:report_id' });
});
