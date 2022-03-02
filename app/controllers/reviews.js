import Controller from '@ember/controller';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { isEmpty } from '@ember/utils';
import { resolve } from 'rsvp';
import moment from 'moment';

import EntryGroupByClientAndProjectListModel from '../models/entry-group-by-client-and-project-list';

export default class ReviewsController extends Controller {
  @service store;
  @service authentication;
  @service userSummary;

  @tracked since = null;
  @tracked before = null;
  @tracked selectedUserIds = null;
  @tracked selectedClientIds = null;
  @tracked selectedProjectIds = null;

  @tracked entriesByClientAndProject = null;

  get allUsers() {
    return this.model.users;
  }

  get allClients() {
    return this.model.clients;
  }

  get allProjects() {
    return this.model.projects;
  }

  get filters() {
    return {
      since: this.since.toISOString(),
      before: this.before.toISOString(),
      'user-id': this.selectedUserIds,
      'project-id': this.selectedProjectIds,
    };
  }

  @action searchProjects(query) {
    if (isEmpty(query)) {
      return resolve();
    }
    return this.store.query('project', { filter: { query: query } });
  }

  @action didUpdateEntry(entry) {
    // TODO update user summary ?
  }

  @action didDeleteEntry(entry) {
    // TODO update user summary
  }

  @action async changeSelectedUserIds(newUserIds) {
    this.selectedUserIds = newUserIds;
    await this.reloadEntries();
  }

  async reloadEntries() {
    const entries = await this.store.query('entry', { filter: this.filters });
    this.entriesByClientAndProject = new EntryGroupByClientAndProjectListModel({
      entries: entries.toArray(),
    });
  }

  loadEntries() {
    this.entries = null;
    this.reloadEntries();
  }

  initializeFilters() {
    this.since = moment().startOf('month').toDate();
    this.before = moment().endOf('month').toDate();
    this.selectedUserIds = [this.authentication.userId];
    this.selectedClientIds = this.allClients.mapBy('id');
    this.selectedProjectIds = this.allProjects.mapBy('id');
  }
}
