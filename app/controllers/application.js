import Controller from '@ember/controller';
import { service } from '@ember/service';
import { reads } from '@ember/object/computed';

export default class ApplicationController extends Controller {
  @service authentication;
  @service userSummary;

  @reads('authentication.isAuthenticated') isAuthenticated;
  @reads('authentication.sessionName') currentUserName;

  @reads('userSummary.weekEntries') weekEntries;
}
