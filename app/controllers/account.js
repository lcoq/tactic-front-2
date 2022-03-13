import Controller from '@ember/controller';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { isEmpty } from '@ember/utils';

export default class AccountController extends Controller {
  @service authentication;
  @service router;

  @tracked showPassword = false;
  @tracked hasChanged = false;

  get user() {
    return this.model;
  }

  get name() {
    return this.user.name;
  }
  set name(newName) {
    this.user.name = newName;
    this._computeHasChanged();
  }

  get password() {
    return this.user.password;
  }
  set password(newPassword) {
    this.user.password = !isEmpty(newPassword) ? newPassword : null;
    this._computeHasChanged();
  }

  get errors() {
    return this.user.errors;
  }

  get showPasswordLabel() {
    return this.showPassword ? 'Hide' : 'Show';
  }

  get hasNoChange() {
    return !this.hasChanged;
  }

  @action toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  @action changeName(event) {
    this.name = event.target.value;
  }

  @action changePassword(event) {
    this.password = event.target.value;
  }

  @action confirmChanges(event) {
    event.preventDefault();
    if (this.hasNoChange) {
      return;
    }
    this.user.save().then(
      () => this._computeHasChanged(),
      () => null /* nothing to do, user errors are displayed automatically */
    );
  }

  @action logout() {
    this.authentication.deauthenticate();
    this.router.transitionTo('login');
  }

  @action updateConfig(config, event) {
    config.value = event.target.checked;
    config.save();
  }

  _computeHasChanged() {
    const changedAttributes = this.user.changedAttributes();
    this.hasChanged = Object.keys(changedAttributes).length > 0;
  }
}
