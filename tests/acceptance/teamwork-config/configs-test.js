import { module, test } from 'qunit';
import { visit, click } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';

import { setupUtils } from '../../utils/setup';

module('Acceptance | Teamwork > Configs', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('shows user configs', async function (assert) {
    const user = this.server.create('user', 'withTeamwork');
    const configs = [
      this.server.create('teamwork/user-config', {
        user,
        name: 'autoreplace',
        description: 'Autoreplace something',
        value: true,
      }),
      this.server.create('teamwork/user-config', {
        user,
        name: 'otherconfig',
        description: 'Do something else',
        value: false,
      }),
    ];

    await this.utils.authentication.authenticate(user);

    await visit('/teamwork/config');

    assert
      .dom(`[data-test-config]`)
      .exists({ count: 2 }, 'should show configs');

    configs.forEach((config) => {
      assert
        .dom(`[data-test-config="${config.id}"]`)
        .exists(`should show ${config.name} config`);

      assert
        .dom(`[data-test-config="${config.id}"] [data-test-config-name]`)
        .exists(`should show ${config.name} config name`);
      assert
        .dom(`[data-test-config="${config.id}"] [data-test-config-name]`)
        .hasText(config.name, `should show ${config.name} config name`);

      assert
        .dom(`[data-test-config="${config.id}"] [data-test-config-description]`)
        .exists(`should show ${config.description} config description`);
      assert
        .dom(`[data-test-config="${config.id}"] [data-test-config-description]`)
        .hasText(
          config.description,
          `should show ${config.description} config description`
        );

      assert
        .dom(`[data-test-config="${config.id}"] [data-test-config-input]`)
        .exists(`should show ${config.input} config input`);

      const assertion = config.value ? 'isChecked' : 'isNotChecked';
      assert
        .dom(`[data-test-config="${config.id}"] [data-test-config-input]`)
        [assertion](
          config.input,
          `should compute ${config.input} config input`
        );
    });
  });

  test('updates user configs', async function (assert) {
    const user = this.server.create('user', 'withTeamwork');
    const config = this.server.create('teamwork/user-config', {
      user,
      name: 'autoreplace',
      description: 'Autoreplace something',
      value: true,
    });

    await this.utils.authentication.authenticate(user);

    await visit('/teamwork/config');

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
});
