import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { hash, resolve } from 'rsvp';
import ProjectGroupByClientListModel from '../models/project-group-by-client-list';
import EmberObject from '@ember/object';

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
        const noClient = EmberObject.create({
          id: '0',
          name: 'No client',
          projects: resolve([]),
        });
        return new ProjectGroupByClientListModel({
          clients: [noClient, ...clients.toArray()],
          projects: projects,
        });
      }
    );
  }
}
