import { module, test } from 'qunit';
import {
  visit,
  fillIn,
  typeIn,
  triggerKeyEvent,
  currentURL,
} from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';

module('Acceptance | Login', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  test('shows users with password fields', async function (assert) {
    const users = this.server.createList('user', 3);
    await visit('/login');
    assert
      .dom('[data-test-user-name]')
      .exists({ count: 3 }, 'should show user names');
    assert.dom('[data-test-user-name]').includesText(users[0].name);
    assert
      .dom('[data-test-password]')
      .exists({ count: 3 }, 'should show user password fields');
  });

  test('logs in and redirects to index', async function (assert) {
    const user = this.server.create('user');
    await visit('/login');
    await fillIn('[data-test-password]', user.password);
    await triggerKeyEvent('[data-test-password]', 'keyup', 'Enter');
    assert.strictEqual(currentURL(), '/', 'should redirect to index');
  });

  test('does not log in with invalid password and shows error until password changes', async function (assert) {
    this.server.create('user');
    await visit('/login');
    await fillIn('[data-test-password]', 'invalid');
    await triggerKeyEvent('[data-test-password]', 'keyup', 'Enter');
    assert.strictEqual(currentURL(), '/login', 'should remain in login');
    assert.dom('[data-test-user-error]').hasClass('page__user--errored');

    await typeIn('[data-test-password]', 'new password');
    assert.dom('[data-test-user-error]').doesNotHaveClass('page__user--errored');
  });
});
