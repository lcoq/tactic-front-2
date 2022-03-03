import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class EntriesByProjectComponent extends Component {
  get list() {
    return this.args.list;
  }

  get searchProjects() {
    return this.args.searchProjects;
  }

  get didUpdateEntry() {
    return this.args.didUpdateEntry;
  }

  get didDeleteEntry() {
    return this.args.didDeleteEntry;
  }

  get rounding() {
    return this.args.rounding;
  }

  get groups() {
    return this.list.groups;
  }

  @action generateCSV(project) {
    this.args.generateCSV({ project });
  }
}
