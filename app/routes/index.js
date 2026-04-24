import Route from '@ember/routing/route';

export default class IndexRoute extends Route {
    setupController(controller) {
        controller.submitting = false;
        super.setupController(...arguments);
    }
}
