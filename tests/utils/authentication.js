function authenticate(user = this._context.server.create('user')) {
  const session = this._context.server.create('session', { user: user });
  document.cookie = `token=${session.token}; path=/`;
  return user;
}

export default function setupAuthentication(hooks) {
  hooks.beforeEach(function () {
    this.utils.authentication = {
      authenticate,
      _context: this,
    };
  });
}
