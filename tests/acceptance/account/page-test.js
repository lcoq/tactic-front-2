import { module, test } from 'qunit';
import { visit, currentURL, click, fillIn } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { Response } from 'miragejs';

import { setupUtils } from '../../utils/setup';

module('Acceptance | Account > Page', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('redirects to login when not authenticated', async function (assert) {
    await visit('/account');
    assert.strictEqual(currentURL(), '/login', 'should redirect to login');
  });

  test('redirects to login when a session token is stored in cookies but is invalid', async function (assert) {
    document.cookie = 'token=invalid; path=/';
    await visit('/account');
    assert.strictEqual(currentURL(), '/login', 'should redirect to login');
  });

  test('remains on account when a valid session token is stored in cookies', async function (assert) {
    await this.utils.authentication.authenticate();
    await visit('/account');
    assert.strictEqual(currentURL(), '/account', 'should remains on account');
  });

  test('shows user form', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    await visit('/account');

    assert.dom('[data-test-user-name]').exists('should show user name input');
    assert
      .dom('[data-test-user-name]')
      .hasValue(user.name, 'should compute user name');

    assert
      .dom('[data-test-user-password]')
      .exists('should show password input');
    assert
      .dom('[data-test-user-password]')
      .hasNoValue('should have empty password');

    assert.dom('[data-test-user-submit]').exists('should show form submit');
  });

  test('toggles password input display', async function (assert) {
    await this.utils.authentication.authenticate();
    await visit('/account');
    assert
      .dom('[data-test-user-password]')
      .hasAttribute('type', 'password', 'should have password type');

    assert
      .dom('[data-test-user-password-toggle-display]')
      .exists('should show password toggle display action');
    assert
      .dom('[data-test-user-password-toggle-display]')
      .hasText(/show/i, 'should have text "show"');

    await click('[data-test-user-password-toggle-display]');
    assert
      .dom('[data-test-user-password]')
      .hasAttribute('type', 'text', 'should have text type');
    assert
      .dom('[data-test-user-password-toggle-display]')
      .hasText(/hide/i, 'should have text "hide"');

    await click('[data-test-user-password-toggle-display]');
    assert
      .dom('[data-test-user-password]')
      .hasAttribute('type', 'password', 'show have password type again');
    assert
      .dom('[data-test-user-password-toggle-display]')
      .hasText(/show/i, 'should have text "show"');
  });

  test('updates user name', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    await visit('/account');
    await fillIn('[data-test-user-name]', 'New name');
    await click('[data-test-user-submit]');
    user.reload();
    assert.strictEqual(user.name, 'New name', 'should update name');
    assert
      .dom('[data-test-user-name]')
      .hasValue('New name', 'should keep new name in name input');
  });

  test('updates user password', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    await visit('/account');
    await fillIn('[data-test-user-password]', 'My;new$passWord123');
    await click('[data-test-user-submit]');
    user.reload();
    assert.strictEqual(
      user.password,
      'My;new$passWord123',
      'should update password'
    );
    assert
      .dom('[data-test-user-password]')
      .hasNoValue('should clear password input');
  });

  test('updates user name & password', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    await visit('/account');
    await fillIn('[data-test-user-name]', 'New name');
    await fillIn('[data-test-user-password]', 'My;new$passWord123');
    await click('[data-test-user-submit]');
    user.reload();
    assert.strictEqual(user.name, 'New name', 'should update name');
    assert.strictEqual(
      user.password,
      'My;new$passWord123',
      'should update password'
    );
    assert
      .dom('[data-test-user-name]')
      .hasValue('New name', 'should keep new name in name input');
    assert
      .dom('[data-test-user-password]')
      .hasNoValue('should clear password input');

    assert
      .dom('[data-test-user-submit]')
      .isDisabled('should disable form submit after save');
  });

  test('shows user name error and clear on change', async function (assert) {
    await this.utils.authentication.authenticate();
    await visit('/account');

    this.server.patch('/users/:id', () => {
      return new Response(
        422,
        {},
        {
          errors: [
            {
              source: { pointer: '/data/attributes/name' },
              detail: 'has already been taken',
            },
          ],
        }
      );
    });

    await fillIn('[data-test-user-name]', 'Invalid');
    await click('[data-test-user-submit]');

    assert.dom('[data-test-user-name-error]').exists('should show name error');
    assert
      .dom('[data-test-user-name-error]')
      .hasText('has already been taken', 'should compute name error message');

    await fillIn('[data-test-user-name]', 'New user name');

    assert
      .dom('[data-test-user-name-error]')
      .doesNotExist('should no longer show name error');
  });
});
