import Service from '@ember/service';
import { later, cancel } from '@ember/runloop';

import ENV from '../config/environment';
const isTest = ENV.environment === 'test';
const isntTest = !isTest;

const ENTRY_SAVE_DELAY = isTest ? 5 : 3000;

export default class DefererService extends Service {
  get waitsByKey() {
    return {
      'mutable-record-state-manager:save': ENTRY_SAVE_DELAY,
      'mutable-record-state-manager:delete': ENTRY_SAVE_DELAY,
      'running-entry-state-manager:save': ENTRY_SAVE_DELAY,
      'create-entry:clock': isTest ? 5 : 500
    };
  }

  later(key, target, method) {
    const wait = this.wait(key);
    return this._later(key, target, method, wait);
  }

  cancel(key, timer) {
    this._cancel(key, timer);
  }

  usesNativeTimeout(key) {
    return false;
  }

  wait(key) {
    return this.waitsByKey[key];
  }

  init() {
    super.init(...arguments);
  }

  _later(key, target, method, wait) {
    if (this.usesNativeTimeout(key)) {
      return setTimeout(method.bind(target), wait);
    } else {
      return later(target, method, wait);
    }
  }

  _cancel(key, timer) {
    if (this.usesNativeTimeout(key)) {
      clearTimeout(timer);
    } else {
      cancel(timer);
    }
  }
}
