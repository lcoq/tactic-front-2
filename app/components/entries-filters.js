import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class EntriesFiltersComponent extends Component {
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

  get allClientsAreSelected() {
    return this.selectedClientIds.length === this.allClients.length;
  }

  get allProjectsAreSelected() {
    return this.selectedProjectIds.length === this.allProjects.length;
  }

  @action changeSelectedUserIds(newUserIds) {
    this.args.changeSelectedUserIds(newUserIds);
  }

  @action changeSince() {}

  @action changeBefore() {}

  @action checkAllClients() {}

  @action uncheckAllClients() {}

  @action changeClientSelection(client) {}

  @action checkAllProjects() {}

  @action uncheckAllProjects() {}

  @action changeProjectSelection(client) {}
}
