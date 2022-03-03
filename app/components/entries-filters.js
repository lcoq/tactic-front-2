import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import moment from 'moment';

export default class EntriesFiltersComponent extends Component {
  @tracked isEditingSince = false;
  @tracked isEditingBefore = false;

  get allUsers() {
    return this.args.allUsers;
  }

  get allClients() {
    return this.args.allClients;
  }

  get allProjects() {
    return this.args.allProjects;
  }

  get selectedUserIds() {
    return this.args.selectedUserIds;
  }

  get selectedClientIds() {
    return this.args.selectedClientIds;
  }

  get selectedProjectIds() {
    return this.args.selectedProjectIds;
  }

  get since() {
    return this.args.since;
  }

  get before() {
    return this.args.before;
  }

  @action changeSelectedUserIds(newUserIds) {
    this.args.changeSelectedUserIds(newUserIds);
  }

  @action changeSelectedClientIds(newClientIds) {
    this.args.changeSelectedClientIds(newClientIds);
  }

  @action changeSelectedProjectIds(newProjectIds) {
    this.args.changeSelectedProjectIds(newProjectIds);
  }

  @action startEditSince() {
    this.isEditingSince = true;
  }

  @action changeSince(newDate) {
    this.isEditingSince = false;
    this.args.changeSince(newDate);
  }

  @action startEditBefore() {
    this.isEditingBefore = true;
  }

  @action changeBefore(newDate) {
    const newDateAtEndOfDay = moment(newDate).endOf('day').toDate();
    this.isEditingBefore = false;
    this.args.changeBefore(newDateAtEndOfDay);
  }
}
