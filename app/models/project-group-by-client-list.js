import { tracked } from '@glimmer/tracking';

class GroupModel {
  @tracked client = null;
  @tracked projects = [];

  constructor(attributes) {
    Object.assign(this, attributes);
  }

  addProject(project) {
    this.projects.pushObject(project);
  }
}

export default class ProjectGroupByClientListModel {
  @tracked clients = [];
  @tracked projects = [];
  @tracked groups = [];

  constructor(attributes) {
    Object.assign(this, attributes);
    this.clients.forEach((client) => {
      this._createGroup(client);
    });
    this.projects.forEach((project) => {
      this._addProject(project);
    });
  }

  addClient(client) {
    this._createGroup(client);
  }

  removeClient(client) {
    const group = this._findGroupByClient(client);
    this.groups.removeObject(group);
    this.projects.removeObjects(group.projects);
    this.clients.removeObject(client);
  }

  addProject(project) {
    this._addProject(project);
  }

  removeProject(project) {
    const group = this._findGroupByProject(project);
    group.projects.removeObject(project);
    this.projects.removeObject(project);
  }

  _createGroup(client) {
    this.groups.pushObject(new GroupModel({ client }));
  }

  _addProject(project) {
    project.client.then((client) => {
      const group = this._findGroupByClient(client);
      group.addProject(project);
    });
    this.projects.pushObject(project);
  }

  _findGroupForProject(project) {
    return this.groups.find(
      (g) => g.client.get('id') === (project.clientId || '0')
    );
  }

  _findGroupByClient(client) {
    return this.groups.find((g) =>
      client ? g.client === client : g.client.id === '0'
    );
  }

  _findGroupByProject(project) {
    return this.groups.find((g) => g.projects.includes(project));
  }
}
