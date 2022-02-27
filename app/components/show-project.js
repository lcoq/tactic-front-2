import Component from '@glimmer/component';

export default class ShowProjectComponent extends Component {
  get project() {
    return this.args.project;
  }
}
