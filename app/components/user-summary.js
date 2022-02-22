import Component from '@glimmer/component';
import { computed } from '@ember/object';
import { bool } from '@ember/object/computed';

export default class UserSummaryComponent extends Component {
  @computed('args.weekEntries')
  get weekEntriesDuration() {
    const entries = this.args.weekEntries;
    if (!entries && this._lastComputedWeekEntriesDuration) {
      return this._lastComputedWeekEntriesDuration;
    }
    const duration = this._computeDuration(entries);
    this._lastComputedWeekEntriesDuration = duration;
    return duration;
  }

  @computed('args.monthEntries')
  get monthEntriesDuration() {
    const entries = this.args.monthEntries;
    if (!entries && this._lastComputedMonthEntriesDuration) {
      return this._lastComputedMonthEntriesDuration;
    }
    const duration = this._computeDuration(entries);
    this._lastComputedMonthEntriesDuration = duration;
    return duration;
  }

  _lastComputedWeekEntriesDuration = null;
  _lastComputedMonthEntriesDuration = null;


  _computeDuration(entries) {
    return (entries ?? []).reduce(function (sum, entry) {
      return sum + entry.durationInSeconds;
    }, 0);
  }
}
