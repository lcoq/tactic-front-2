import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { hash } from 'rsvp';

import ProjectGroupByClientListModel from '../models/project-group-by-client-list';
import NullClientModel from '../models/null-client';
import StateManagerListCommitter from '../models/state-manager-list-committer';

export default class ProjectsRoute extends Route {
  @service store;
  @service router;
  @service authentication;

  activate() {
    super.activate(...arguments);
    this.router.on('routeWillChange', this, this._willTransition);
  }

  deactivate() {
    super.deactivate(...arguments);
    this.router.off('routeWillChange', this, this._willTransition);
  }

  beforeModel() {
    if (this.authentication.notAuthenticated) {
      this.router.transitionTo('login');
    }
  }

  model() {
    const clientsPromise = this.store.query('client', {});
    const projectsPromise = this.store.query('project', {});
    return hash({ clients: clientsPromise, projects: projectsPromise }).then(
      ({ clients, projects }) => {
        return new ProjectGroupByClientListModel({
          clients: [new NullClientModel(), ...clients.toArray()],
          projects: projects.toArray(),
        });
      }
    );
  }

  _willTransition(transition) {
    if (transition.to.find((route) => route.name === this.routeName)) return;

    /* eslint-disable ember/no-controller-access-in-routes */
    /* see issue https://github.com/ember-learn/guides-source/issues/1590 */
    const controller = this.controller;
    const list = controller.projectByClientList;

    const committer = new StateManagerListCommitter();
    committer.addObjects(list.clients.mapBy('stateManager'));
    committer.addObjects(list.projects.mapBy('stateManager'));

    if (committer.isClear) {
      return;
    }
    if (committer.hasInvalid) {
      if (this._confirmInvalid()) {
        committer.clearInvalids();
      } else {
        transition.abort();
        return;
      }
    }
    transition.abort();
    committer.commit().then(
      () => transition.retry(),
      () => this._alertCommitError()
    );
  }

  _confirmInvalid() {
    return confirm(
      'Some edits are invalid, do you want to cancel your invalid changes ? '
    );
  }

  _alertCommitError() {
    return alert(
      'Some edits cannot be saved, please review your changes or try again.'
    );
  }
}
