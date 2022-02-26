import Component from '@glimmer/component';
import { service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { computed } from '@ember/object';

export default class FaviconComponent extends Component {
  @service('-document') document;
  headElement = this.document.head;

  @reads('args.isStarted') isStarted;

  @computed('isStarted')
  get faviconName() {
    return this.isStarted ? 'favicon-started' : 'favicon';
  }
}
