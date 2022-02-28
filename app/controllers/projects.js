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
}
