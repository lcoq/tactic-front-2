import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class EntriesByDayComponent extends Component {
  get list() {
    return this.args.list;
  }

  get willUpdateEntry() {
    return this.args.willUpdateEntry;
  }

  get willDeleteEntry() {
    return this.args.willDeleteEntry;
  }

  get didRevertEntry() {
    return this.args.didRevertEntry;
  }

  get restartEntry() {
    return this.args.restartEntry;
  }

  get searchProjects() {
    return this.args.searchProjects;
  }

  @action didUpdateEntry(entry) {
    this.list.updateEntry(entry);
    this.args.didUpdateEntry?.(entry);
  }

  @action didDeleteEntry(entry) {
    this.list.removeEntry(entry);
    this.args.didDeleteEntry?.(entry);
  }
}
