import Component from '@glimmer/component';
import { service } from '@ember/service';

export default class FaviconComponent extends Component {
  @service('-document') document;
  headElement = this.document.head;

  get isStarted() {
    return this.args.isStarted;
  }

  get faviconName() {
    return this.isStarted ? 'favicon-started' : 'favicon';
  }
}
