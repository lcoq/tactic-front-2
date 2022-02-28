import Controller from '@ember/controller';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class ProjectsController extends Controller {
  @service store;

  get projectByClientList() {
    return this.model;
  }

  @action startEditClient(client) {
    client.stateManager.send('edit');
  }

  @action stopEditClient(client) {
    client.stateManager.send('markForSave');
  }

  @action cancelEditClient(client) {
    client.stateManager.send('clear');
    if (client.isDeleted) {
      this.projectByClientList.removeClient(client);
    }
  }

  @action markClientForDelete(client) {
    client.stateManager.send('markForDelete');
  }

  @action didDeleteClient(client) {
    this.projectByClientList.removeClient(client);
  }

  @action retrySaveOrDeleteClient(client) {
    client.stateManager.send('retry');
  }

  @action buildClient() {
    const client = this.store.createRecord('client');
    client.stateManager.send('edit');
    this.projectByClientList.addClient(client);
  }

  @action async startEditProject(project) {
    await this._cancelClientPendingDelete(project);
    project.stateManager.send('edit');
  }

  @action stopEditProject(project) {
    project.stateManager.send('markForSave');
  }

  @action async cancelEditProject(project) {
    await this._cancelClientPendingDelete(project);
    project.stateManager.send('clear');
    if (project.isDeleted) {
      this.projectByClientList.removeProject(project);
    }
  }

  @action markProjectForDelete(project) {
    project.stateManager.send('markForDelete');
  }

  @action didDeleteProject(project) {
    this.projectByClientList.removeProject(project);
  }

  @action retrySaveOrDeleteProject(project) {
    project.stateManager.send('retry');
  }

  @action async buildProject(client) {
    const project = this.store.createRecord('project', { client });
    project.stateManager.send('edit');
    this.projectByClientList.addProject(project);
    await this._cancelClientPendingDelete(project);
  }

  async _cancelClientPendingDelete(project) {
    const client = await project.client;
    if (client && client.stateManager.isPendingDeleteOrDeleteErrored) {
      this.cancelEditClient(client);
    }
  }
}
