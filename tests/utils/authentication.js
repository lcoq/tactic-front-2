import { getContext } from '@ember/test-helpers';

export function authenticate() {
  const user = this.server.create('user');
  const session = this.server.create('session', { user: user });
  document.cookie = `token=${session.token}; path=/`;
  return user;
}
