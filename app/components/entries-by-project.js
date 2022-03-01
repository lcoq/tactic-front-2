import Component from '@glimmer/component';

export default class EntriesByProjectComponent extends Component {
  get list() {
    return this.args.list;
  }

  get groups() {
    return this.list.groups;
  }
}
