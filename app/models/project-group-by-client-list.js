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

  removeClient(client) {
    const group = this._findGroupByClient(client);
    this.groups.removeObject(group);
    this.projects.removeObjects(group.projects);
    this.clients.removeObject(client);
  }

  _createGroup(client) {
    this.groups.pushObject(new GroupModel({ client }));
  }

  _addProject(project) {
    const group = this._findGroupForProject(project);
    group.addProject(project);
  }

  _findGroupForProject(project) {
    return this.groups.find(
      (g) => g.client.get('id') === (project.belongsTo('client').id() || '0')
    );
  }

  _findGroupByClient(client) {
    return this.groups.find((g) =>
      client ? g.client === client : g.client.id === '0'
    );
  }
}
