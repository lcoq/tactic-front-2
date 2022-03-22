import Controller from '@ember/controller';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import moment from 'moment';

import { delegateTo } from '../utils/decorator';

export default class StatsController extends Controller {
  @service store;
  @service authentication;
  @service filters;

  @delegateTo('filters') since;
  @delegateTo('filters') before;
  @delegateTo('filters') query;
  @delegateTo('filters') selectedUserIds;
  @delegateTo('filters') selectedClientIds;
  @delegateTo('filters') selectedProjectIds;

  @tracked group = 'day';
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
    return this.filters.projectsForSelectedClientIds;
  }

  get isDayGroup() {
    return this.group === 'day';
  }

  get isMonthGroup() {
    return this.group === 'month';
  }

  @action async changeSelectedUserIds(newUserIds) {
    this.filters.changeSelectedUserIds(newUserIds);
    await this.reload();
  }

  @action async changeSelectedClientIds(newClientIds) {
    this.filters.changeSelectedClientIds(newClientIds);
    await this.reload();
  }

  @action async changeSelectedProjectIds(newProjectIds) {
    this.filters.changeSelectedProjectIds(newProjectIds);
    await this.reload();
  }

  @action async changeSince(newSince) {
    this.filters.changeSince(newSince);
    await this.reload();
  }

  @action async changeBefore(newBefore) {
    this.filters.changeBefore(newBefore);
    await this.reload();
  }

  @action async changeQuery(newQuery) {
    this.filters.changeQuery(newQuery);
    await this.reload();
  }

  @action async changeGroup(event) {
    this.group = event.target.value;
    await this.reload();
  }

  async reload() {
    this.statGroup = await this.store.queryRecord('entries-stat-group', {
      filter: this.filters.serialized,
      _group: this.group,
    });
  }

  async load() {
    this.statGroup = null;
    this.reload();
  }

  initializeFilters() {
    this.filters.allClients = this.allClients;
    this.filters.allProjects = this.allProjects;
    if (!this.filters.initialized) {
      this.filters.initializeWith({
        since: moment().startOf('month').toDate(),
        before: moment().endOf('month').toDate(),
        query: null,
        selectedUserIds: [this.authentication.userId],
        selectedClientIds: this.allClients.mapBy('id'),
        selectedProjectIds: this.allProjects.mapBy('id'),
      });
    }
  }
}
