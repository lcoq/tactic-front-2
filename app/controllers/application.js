import Controller from '@ember/controller';
import { service } from '@ember/service';

export default class ApplicationController extends Controller {
  @service authentication;
  @service userSummary;
  @service runningEntry;

  get isAuthenticated() {
    return this.authentication.isAuthenticated;
  }

  get currentUserName() {
    return this.authentication.userName;
  }

  get weekEntries() {
    return this.userSummary.weekEntries;
  }

  get monthEntries() {
    return this.userSummary.monthEntries;
  }

  get hasRunningEntry() {
    return this.runningEntry.isStarted;
  }

  get summaryRounding() {
    const config = this.authentication.configs.findBy('id', 'summary-rounding');
    return (config && config.value) || false;
  }
}
