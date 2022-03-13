import { module, test } from 'qunit';
import { visit, click, settled } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';

import { setupUtils } from '../../utils/setup';

module('Acceptance | Account > Configs', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('shows user configs', async function (assert) {
    const user = this.server.create('user');
    const roundingConfig = this.server.create('user-config', {
      user,
      name: 'rounding',
      type: 'boolean',
      description: 'Rounding bool',
      value: true,
    });
    const otherConfig = this.server.create('user-config', {
      user,
      name: 'other',
      type: 'boolean',
      description: 'Other config',
      value: false,
    });
    await this.utils.authentication.authenticate(user);

    await visit('/account');

    assert
      .dom(`[data-test-config="${roundingConfig.id}"]`)
      .exists('should show rounding config');

    assert
      .dom(`[data-test-config="${roundingConfig.id}"] [data-test-config-name]`)
      .exists('should show rounding config name');
    assert
      .dom(`[data-test-config="${roundingConfig.id}"] [data-test-config-name]`)
      .hasText('rounding', 'should compute rounding config name');

    assert
      .dom(
        `[data-test-config="${roundingConfig.id}"] [data-test-config-description]`
      )
      .exists('should show rounding config description');
    assert
      .dom(
        `[data-test-config="${roundingConfig.id}"] [data-test-config-description]`
      )
      .hasText('Rounding bool', 'should compute rounding config description');

    assert
      .dom(`[data-test-config="${roundingConfig.id}"] [data-test-config-input]`)
      .exists('should show rounding config input');
    assert
      .dom(`[data-test-config="${roundingConfig.id}"] [data-test-config-input]`)
      .isChecked('should have rounding config input checked');

    assert
      .dom(`[data-test-config="${otherConfig.id}"]`)
      .exists('should show other config');

    assert
      .dom(`[data-test-config="${otherConfig.id}"] [data-test-config-name]`)
      .exists('should show other config name');
    assert
      .dom(`[data-test-config="${otherConfig.id}"] [data-test-config-name]`)
      .hasText('other', 'should compute other config name');

    assert
      .dom(
        `[data-test-config="${otherConfig.id}"] [data-test-config-description]`
      )
      .exists('should show other config description');
    assert
      .dom(
        `[data-test-config="${otherConfig.id}"] [data-test-config-description]`
      )
      .hasText('Other config', 'should compute other config description');

    assert
      .dom(`[data-test-config="${otherConfig.id}"] [data-test-config-input]`)
      .exists('should show other config input');
    assert
      .dom(`[data-test-config="${otherConfig.id}"] [data-test-config-input]`)
      .isNotChecked('should not have other config input checked');
  });

  test('updates user configs', async function (assert) {
    const user = this.server.create('user');
    const config = this.server.create('user-config', {
      user,
      name: 'rounding',
      type: 'boolean',
      description: 'Rounding bool',
      value: true,
    });

    await this.utils.authentication.authenticate(user);

    await visit('/account');

    assert
      .dom(`[data-test-config="${config.id}"] [data-test-config-input]`)
      .isChecked('should have config input checked');

    await click(`[data-test-config="${config.id}"] [data-test-config-input]`);

    assert
      .dom(`[data-test-config="${config.id}"] [data-test-config-input]`)
      .isNotChecked('should no longer have config input checked');

    config.reload();
    assert.false(config.value, 'should have updated config');
  });

  test('disable config while saving', async function (assert) {
    const user = this.server.create('user');
    const config = this.server.create('user-config', {
      user,
      name: 'rounding',
      type: 'boolean',
      description: 'Rounding bool',
      value: true,
    });

    this.server.patch('/users/:userId/configs/:configId', () => {}, {
      timing: 100,
    });

    await this.utils.authentication.authenticate(user);

    await visit('/account');

    click(`[data-test-config="${config.id}"] [data-test-config-input]`); // do not `await here`
    await this.utils.sleep(50);

    assert
      .dom(`[data-test-config="${config.id}"] [data-test-config-input]`)
      .isDisabled('should disable input while saving');

    await settled();

    assert
      .dom(`[data-test-config="${config.id}"] [data-test-config-input]`)
      .isNotDisabled('should not disable input after save');
  });
});
