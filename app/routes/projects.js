import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { hash } from 'rsvp';
import ProjectGroupByClientListModel from '../models/project-group-by-client-list';
import NullClientModel from '../models/null-client';

export default class ProjectsRoute extends Route {
  @service store;
  @service router;
  @service authentication;

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
          projects: projects,
        });
      }
    );
  }
}
