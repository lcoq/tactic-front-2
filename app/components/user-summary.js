import Component from '@glimmer/component';
import { computed } from '@ember/object';
import { bool } from '@ember/object/computed';

export default class UserSummaryComponent extends Component {

  @bool('args.weekEntries.isFulfilled') hasWeekEntries;
  @bool('args.monthEntries.isFulfilled') hasMonthEntries;

  @computed('hasWeekEntries')
  get weekEntriesDuration() {
    return this.hasWeekEntries ? this._computeDuration(this.args.weekEntries) : 0;
  }

  @computed('hasMonthEntries')
  get monthEntriesDuration() {
    return this.hasMonthEntries ? this._computeDuration(this.args.monthEntries) : 0;
  }

  _computeDuration(entries) {
    return entries.reduce(function (sum, entry) {
      return sum + entry.durationInSeconds;
    }, 0);
  }
}
