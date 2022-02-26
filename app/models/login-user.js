import { tracked } from '@glimmer/tracking';

export default class LoginUser {
  @tracked user;
  @tracked id;
  @tracked hasError = false;

  constructor({ user }) {
    this.user = user;
    this.id = user.id;
  }
}
