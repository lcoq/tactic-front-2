/* global $ */
import Controller from '@ember/controller';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { isEmpty } from '@ember/utils';
import { resolve } from 'rsvp';
import moment from 'moment';

import EntryGroupByClientAndProjectListModel from '../models/entry-group-by-client-and-project-list';
import { delegateTo } from '../utils/decorator';

export default class ReviewsController extends Controller {
  @service store;
  @service authentication;
  @service userSummary;
  @service filters;

  @delegateTo('filters') since;
  @delegateTo('filters') before;
  @delegateTo('filters') query;
  @delegateTo('filters') selectedUserIds;
  @delegateTo('filters') selectedClientIds;
  @delegateTo('filters') selectedProjectIds;

  @tracked rounding = null;

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

  get allProjectsForSelectedClientIds() {
    return this.filters.projectsForSelectedClientIds;
  }

  @action searchProjects(query) {
    if (isEmpty(query)) {
      return resolve();
    }
    return this.store.query('project', { filter: { query: query } });
  }

  @action didUpdateEntry(entry) {
    const since = moment(this.since);
    const before = moment(this.before);
    if (since.isAfter(entry.startedAt) || before.isBefore(entry.startedAt)) {
      this.entriesByClientAndProject.removeEntry(entry);
    }
    this.userSummary.reload();
  }

  @action didDeleteEntry() {
    this.userSummary.reload();
  }

  @action async changeSelectedUserIds(newUserIds) {
    this.filters.changeSelectedUserIds(newUserIds);
    await this.reloadEntries();
  }

  @action async changeSelectedClientIds(newClientIds) {
    this.filters.changeSelectedClientIds(newClientIds);
    await this.reloadEntries();
  }

  @action async changeSelectedProjectIds(newProjectIds) {
    this.filters.changeSelectedProjectIds(newProjectIds);
    await this.reloadEntries();
  }

  @action async changeSince(newSince) {
    this.filters.changeSince(newSince);
    await this.reloadEntries();
  }

  @action async changeBefore(newBefore) {
    this.filters.changeBefore(newBefore);
    await this.reloadEntries();
  }

  @action async changeQuery(newQuery) {
    this.filters.changeQuery(newQuery);
    await this.reloadEntries();
  }

  @action changeRounding(newRounding) {
    this.rounding = newRounding;
  }

  @action generateCSV(csvFilters = {}) {
    let serializedFilters;
    if (Object.prototype.hasOwnProperty.call(csvFilters, 'client')) {
      const clientId = csvFilters.client?.id || '0';
      serializedFilters = this.filters.serializeForClientId(clientId);
    } else if (Object.prototype.hasOwnProperty.call(csvFilters, 'project')) {
      const projectId = csvFilters.project?.id || '0';
      serializedFilters = this.filters.serializeForProjectId(projectId);
    } else {
      serializedFilters = this.filters.serialized;
    }

    const adapter = this.store.adapterFor('entry');
    const requestOptions = this.rounding ? { rounded: 1 } : {};
    const requestParams = Object.assign(
      { filter: serializedFilters, options: requestOptions },
      adapter.headers
    );

    const pathWithoutParams =
      adapter.buildURL('entry', null, null, 'query', requestParams) + '.csv';
    const url = [pathWithoutParams, $.param(requestParams)].join('?');

    this._downloadFile(url);
  }

  async reloadEntries() {
    const entries = await this.store.query('entry', {
      filter: this.filters.serialized,
    });
    this.entriesByClientAndProject = new EntryGroupByClientAndProjectListModel({
      entries: entries.toArray(),
    });
  }

  loadEntries() {
    this.entries = null;
    this.reloadEntries();
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
    if (this.rounding === null) {
      const roundingConfig = this.authentication.configs.findBy(
        'id',
        'reviews-rounding'
      );
      this.rounding = (roundingConfig && roundingConfig.value) || false;
    }
  }

  _downloadFile(url) {
    const link = document.createElement('a');
    link.setAttribute('download', '');
    link.style.display = 'none';
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  }
}
