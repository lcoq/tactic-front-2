import Component from '@glimmer/component';

export default class EntriesByProjectComponent extends Component {
  get list() {
    return this.args.list;
  }

  get groups() {
    return this.list.groups;
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
}
