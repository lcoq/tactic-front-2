import { Promise } from 'rsvp';

function sleep(delay) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export default function setupSleep(hooks) {
  hooks.beforeEach(function () {
    this.utils.sleep = sleep;
  });
}
