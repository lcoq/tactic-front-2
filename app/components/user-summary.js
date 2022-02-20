import Component from '@glimmer/component';
import { computed } from '@ember/object';
import { bool } from '@ember/object/computed';

export default class UserSummaryComponent extends Component {
  @bool('args.weekEntries.isFulfilled') hasWeekEntries;

  @computed('hasWeekEntries')
  get weekEntriesDuration() {
    if (!this.hasWeekEntries) return 0;
    return this.args.weekEntries.reduce(function (sum, entry) {
      return sum + entry.durationInSeconds;
    }, 0);
  }
}
