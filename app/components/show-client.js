import Component from '@glimmer/component';

export default class ShowClientComponent extends Component {
  get client() {
    return this.args.client;
  }
}
