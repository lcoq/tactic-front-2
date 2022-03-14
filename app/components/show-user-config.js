import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class ShowUserConfigComponent extends Component {
  get config() {
    return this.args.config;
  }

  @action updateConfig(event) {
    const value = event.target.checked;
    this.args.updateConfig(this.config, value);
  }
}
