import Component from '@glimmer/component';

export default class UserSummaryComponent extends Component {
  get rounding() {
    return this.args.rounding;
  }

  get weekEntriesDuration() {
    const entries = this.args.weekEntries;
    return this._computeDuration(entries);
  }

  get monthEntriesDuration() {
    const entries = this.args.monthEntries;
    return this._computeDuration(entries);
  }

  _computeDuration(entries) {
    const key = this.rounding
      ? 'roundedDurationInSeconds'
      : 'durationInSeconds';
    return entries.reduce((sum, entry) => sum + entry[key], 0);
  }
}
