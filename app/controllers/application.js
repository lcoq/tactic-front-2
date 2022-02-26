import Controller from '@ember/controller';
import { service } from '@ember/service';

export default class ApplicationController extends Controller {
  @service authentication;
  @service userSummary;
  @service runningEntry;

  get isAuthenticated() {
    return this.authentication.isAuthenticated;
  }

  get sessionName() {
    return this.authentication.sessionName;
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
}
