import Controller from '@ember/controller';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { isEmpty } from '@ember/utils';
import moment from 'moment';

export default class StatsController extends Controller {
  @service store;
  @service authentication;

  @tracked since = null;
  @tracked before = null;
  @tracked query = null;
  @tracked selectedUserIds = null;
  @tracked selectedClientIds = null;
  @tracked selectedProjectIds = null;

  @tracked group = 'day'; // TODO avoid day group when too many entries
  @tracked statGroup = null;

  get allUsers() {
    return this.model.users;
  }

  get allClients() {
    return this.model.clients;
  }

  get allProjects() {
    return this.model.projects;
  }

  get allProjectsForSelectedClientIds() {
    if (!this.selectedClientIds) return [];
    return this.allProjects.filter((p) => {
      return this.selectedClientIds.includes(p.clientId || '0');
    });
  }

  get isDayGroup() {
    return this.group === 'day';
  }

  get isMonthGroup() {
    return this.group === 'month';
  }

  @action async changeSelectedUserIds(newUserIds) {
    this.selectedUserIds = newUserIds;
    await this.reload();
  }

  @action async changeSelectedClientIds(newClientIds) {
    const newProjectIds = this._buildNewProjectIdsForClientIds(newClientIds);
    this.selectedClientIds = newClientIds;
    this.selectedProjectIds = newProjectIds;
    await this.reload();
  }

  @action async changeSelectedProjectIds(newProjectIds) {
    this.selectedProjectIds = newProjectIds;
    await this.reload();
  }

  @action async changeSince(newSince) {
    if (moment(newSince).isAfter(this.before)) {
      this.before = moment(newSince).endOf('day').toDate();
    }
    this.since = newSince;
    await this.reload();
  }

  @action async changeBefore(newBefore) {
    if (moment(newBefore).isBefore(this.since)) {
      this.since = moment(newBefore).startOf('day').toDate();
    }
    this.before = newBefore;
    await this.reload();
  }

  @action async changeQuery(newQuery) {
    this.query = newQuery;
    await this.reload();
  }

  @action async changeGroup(event) {
    this.group = event.target.value;
    await this.reload();
  }

  get filters() {
    const filters = {
      since: this.since.toISOString(),
      before: this.before.toISOString(),
      'user-id': this.selectedUserIds,
      'project-id': this.selectedProjectIds,
    };
    if (!isEmpty(this.query)) {
      filters['query'] = this.query;
    }
    return filters;
  }

  async reload() {
    this.statGroup = await this.store.queryRecord('entries-stat-group', {
      filter: this.filters,
      _group: this.group,
    });
  }

  async load() {
    this.statGroup = null;
    this.reload();
  }

  initializeFilters() {
    this.since = moment().startOf('month').toDate();
    this.before = moment().endOf('month').toDate();
    this.query = null;
    this.selectedUserIds = [this.authentication.userId];
    this.selectedClientIds = this.allClients.mapBy('id');
    this.selectedProjectIds = this.allProjects.mapBy('id');
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
