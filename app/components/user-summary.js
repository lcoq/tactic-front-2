import Component from '@glimmer/component';

export default class UserSummaryComponent extends Component {
  get weekEntriesDuration() {
    const entries = this.args.weekEntries;
    return this._computeDuration(entries);
  }

  get monthEntriesDuration() {
    const entries = this.args.monthEntries;
    return this._computeDuration(entries);
  }

  _computeDuration(entries) {
    return entries.reduce(function (sum, entry) {
      return sum + entry.durationInSeconds;
    }, 0);
  }
}
