import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class EntriesByClientAndProjectComponent extends Component {
  get list() {
    return this.args.list;
  }

  get groups() {
    return this.list.groups;
  }

  get multipleGroups() {
    return this.groups.length > 1;
  }

  get totalDurationInSeconds() {
    return this.list.durationInSeconds;
  }

  get searchProjects() {
    return this.args.searchProjects;
  }

  @action didUpdateEntry(entry) {
    this.list.updateEntry(entry);
    this.args.didUpdateEntry(entry);
  }

  @action didDeleteEntry(entry) {
    this.list.removeEntry(entry);
    this.args.didDeleteEntry(entry);
  }
}
