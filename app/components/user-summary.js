import Component from '@glimmer/component';
import { computed } from '@ember/object';
import { bool } from '@ember/object/computed';

export default class UserSummaryComponent extends Component {

  @computed('args.weekEntries')
  get weekEntriesDuration() {
    return this._computeDuration(this.args.weekEntries);
  }

  @computed('args.monthEntries')
  get monthEntriesDuration() {
    return this._computeDuration(this.args.monthEntries);
  }

  _computeDuration(entries) {
    return (entries ?? []).reduce(function (sum, entry) {
      return sum + entry.durationInSeconds;
    }, 0);
  }
}
