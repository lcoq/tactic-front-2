import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { isEmpty } from '@ember/utils';
import moment from 'moment';

export default class FiltersService extends Service {
  @tracked initialized = false;

  @tracked since = null;
  @tracked before = null;
  @tracked query = null;
  @tracked selectedUserIds = null;

  @tracked allClients = null;
  @tracked allProjects = null;

  @tracked selectedClientIds = null;
  @tracked selectedProjectIds = null;

  get projectsForSelectedClientIds() {
    if (this.selectedClientIds) {
      return this.allProjects.filter((p) => {
        return this.selectedClientIds.includes(p.clientId || '0');
      });
    } else {
      return [];
    }
  }

  initializeWith(attributes) {
    Object.assign(this, attributes);
    this.initialized = true;
  }

  changeSince(newSince) {
    if (moment(newSince).isAfter(this.before)) {
      this.before = moment(newSince).endOf('day').toDate();
    }
    this.since = newSince;
  }

  changeBefore(newBefore) {
    if (moment(newBefore).isBefore(this.since)) {
      this.since = moment(newBefore).startOf('day').toDate();
    }
    this.before = newBefore;
  }

  changeQuery(newQuery) {
    this.query = newQuery;
  }

  changeSelectedUserIds(newUserIds) {
    this.selectedUserIds = newUserIds;
  }

  changeSelectedClientIds(newClientIds) {
    const newProjectIds = this._buildNewProjectIdsForClientIds(newClientIds);
    this.selectedClientIds = newClientIds;
    this.selectedProjectIds = newProjectIds;
  }

  changeSelectedProjectIds(newProjectIds) {
    this.selectedProjectIds = newProjectIds;
  }

  serializeForClientId(clientId) {
    const projectIds = this.selectedProjectIds.filter((projectId) => {
      const project = this.allProjects.find((p) => p.id === projectId);
      return clientId === (project.clientId || '0');
    });
    return Object.assign({}, this.serialized, { 'project-id': projectIds });
  }

  serializeForProjectId(projectId) {
    return Object.assign({}, this.serialized, { 'project-id': [projectId] });
  }

  get serialized() {
    const serialized = {
      since: this.since.toISOString(),
      before: this.before.toISOString(),
      'user-id': this.selectedUserIds,
      'project-id': this.selectedProjectIds,
    };
    if (!isEmpty(this.query)) {
      serialized.query = this.query;
    }
    return serialized;
  }

  _buildNewProjectIdsForClientIds(newClientIds) {
    const addedClientIds = newClientIds.filter(
      (id) => !this.selectedClientIds.includes(id)
    );
    const removedClientIds = this.selectedClientIds.filter(
      (id) => !newClientIds.includes(id)
    );
    const projectIdsToAdd = this.allProjects
      .filter((p) => {
        return addedClientIds.includes(p.clientId || '0');
      })
      .mapBy('id');
    const filteredProjectIds = this.selectedProjectIds.filter((id) => {
      const project = this.allProjects.findBy('id', id);
      return !removedClientIds.includes(project.clientId || '0');
    });
    return [...filteredProjectIds, ...projectIdsToAdd];
  }
}
