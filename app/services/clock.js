import Service, { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class ClockService extends Service {
  @service deferer;

  @tracked clock;
  clockTimer = null;

  constructor() {
    super(...arguments);
    this._updateClock();
  }

  _updateClock() {
    this.clock = new Date();
    this.clockTimer = this.deferer.later(
      'create-entry:clock',
      this,
      this._updateClock
    );
  }
}
