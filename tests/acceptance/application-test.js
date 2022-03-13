import { module, test } from 'qunit';
import { visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';

import { setupUtils } from '../utils/setup';

module('Acceptance | Application', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('shows index link when authenticated', async function (assert) {
    await this.utils.authentication.authenticate();
    await visit('/');
    assert
      .dom('[data-test-index-link]')
      .exists('should have link to index page');
    assert
      .dom('[data-test-index-link]')
      .hasAttribute('href', '/', 'should links to index page');
  });

  test('shows projects link when authenticated', async function (assert) {
    await this.utils.authentication.authenticate();
    await visit('/');
    assert
      .dom('[data-test-projects-link]')
      .exists('should have link to projects page');
    assert
      .dom('[data-test-projects-link]')
      .hasAttribute('href', '/projects', 'should links to projects page');
  });

  test('shows reviews link when authenticated', async function (assert) {
    await this.utils.authentication.authenticate();
    await visit('/');
    assert
      .dom('[data-test-reviews-link]')
      .exists('should have link to reviews page');
    assert
      .dom('[data-test-reviews-link]')
      .hasAttribute('href', '/reviews', 'should links to reviews page');
  });

  test('shows account link when authenticated', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    await visit('/');
    assert
      .dom('[data-test-account-link]')
      .exists('should have link to account page');
    assert
      .dom('[data-test-account-link]')
      .hasAttribute('href', '/account', 'should links to account page');
    assert
      .dom('[data-test-account-link]')
      .includesText(user.name, 'should show user name on link to login page');
  });
});
