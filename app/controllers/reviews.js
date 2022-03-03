/* global $ */
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
    if (!this.selectedClientIds) return [];
    return this.allProjects.filter((p) => {
      return this.selectedClientIds.includes(p.clientId || '0');
    });
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
    this.selectedUserIds = newUserIds;
    await this.reloadEntries();
  }

  @action async changeSelectedClientIds(newClientIds) {
    const newProjectIds = this._buildNewProjectIdsForClientIds(newClientIds);
    this.selectedClientIds = newClientIds;
    this.selectedProjectIds = newProjectIds;
    await this.reloadEntries();
  }

  @action async changeSelectedProjectIds(newProjectIds) {
    this.selectedProjectIds = newProjectIds;
    await this.reloadEntries();
  }

  @action async changeSince(newSince) {
    if (moment(newSince).isAfter(this.before)) {
      this.before = moment(newSince).endOf('day').toDate();
    }
    this.since = newSince;
    await this.reloadEntries();
  }

  @action async changeBefore(newBefore) {
    if (moment(newBefore).isBefore(this.since)) {
      this.since = moment(newBefore).startOf('day').toDate();
    }
    this.before = newBefore;
    await this.reloadEntries();
  }

  @action changeRounding(newRounding) {
    this.rounding = newRounding;
  }

  @action generateCSV(filters = {}) {
    let projectIds;
    if (Object.prototype.hasOwnProperty.call(filters, 'client')) {
      const clientId = (filters.client && filters.client.id) || '0';
      let project;
      projectIds = this.selectedProjectIds.filter((projectId) => {
        project = this.allProjects.find((project) => project.id === projectId);
        return clientId === (project.clientId || '0');
      });
    } else if (Object.prototype.hasOwnProperty.call(filters, 'project')) {
      projectIds = [filters.project?.id || '0'];
    } else {
      projectIds = this.selectedProjectIds;
    }

    const adapter = this.store.adapterFor('entry');

    const requestFilters = Object.assign({}, this.filters, {
      'project-id': projectIds,
    });
    const requestOptions = this.rounding ? { rounded: 1 } : {};
    const requestParams = Object.assign(
      { filter: requestFilters, options: requestOptions },
      adapter.headers
    );

    const pathWithoutParams =
      adapter.buildURL('entry', null, null, 'query', requestParams) + '.csv';
    const url = [pathWithoutParams, $.param(requestParams)].join('?');

    this._downloadFile(url);
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
    this.rounding = false;
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

  _downloadFile(url) {
    const link = document.createElement('a');
    link.setAttribute('download', '');
    link.classList = ['hidden'];
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  }
}
