import { tracked } from '@glimmer/tracking';

export default class LoginUserModel {
  @tracked user;
  @tracked id;
  @tracked hasError = false;

  constructor({ user }) {
    this.user = user;
    this.id = user.id;
  }
}
