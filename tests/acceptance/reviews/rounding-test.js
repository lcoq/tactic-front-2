import { module, test } from 'qunit';
import { visit, click } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import moment from 'moment';

import { setupUtils } from '../../utils/setup';

module('Acceptance | Reviews > Rounding', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('rounds by default when user has rounding config enabled', async function (assert) {
    const user = this.server.create('user');
    this.server.create('user-config', {
      user,
      id: 'reviews-rounding',
      name: 'rounding',
      type: 'boolean',
      description: 'Rounding bool',
      value: true,
    });
    await this.utils.authentication.authenticate(user);

    await visit('/reviews');

    assert.dom(`[data-test-rounding]`).exists('should show rounding checkbox');
    assert
      .dom(`[data-test-rounding]`)
      .isChecked(
        'should have rounding by default when user has rounding option enabled'
      );
  });

  test('rounds entries and groups durations', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const entry = this.server.create('entry', {
      user,
      startedAt: moment().startOf('month').add(2, 'h'),
      stoppedAt: moment()
        .startOf('month')
        .add(6, 'h')
        .add(14, 'm')
        .add(59, 's'),
    });
    const client = this.server.create('client');
    const project = this.server.create('project', { client });
    const otherEntry = this.server.create('entry', {
      user,
      project,
      startedAt: moment().startOf('month').add(3, 'h'),
      stoppedAt: moment().startOf('month').add(3, 'h').add(1, 'm').add(2, 's'),
    });

    await visit('/reviews');

    assert
      .dom(`[data-test-entries-total-duration]`)
      .hasText('04:16:01', 'should compute total duration');

    assert
      .dom(`[data-test-client-group="-1"] [data-test-client-group-duration]`)
      .hasText('04:14:59', 'should compute "No client" duration');
    assert
      .dom(`[data-test-project-group="-1"] [data-test-project-group-duration]`)
      .hasText('04:14:59', 'should compute "No project" duration');
    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-duration]`)
      .hasText('04:14:59', 'should compute entry duration');

    assert
      .dom(
        `[data-test-client-group="${client.id}"] [data-test-client-group-duration]`
      )
      .hasText('00:01:02', 'should compute client duration');
    assert
      .dom(
        `[data-test-project-group="${project.id}"] [data-test-project-group-duration]`
      )
      .hasText('00:01:02', 'should compute project duration');
    assert
      .dom(`[data-test-entry="${otherEntry.id}"] [data-test-entry-duration]`)
      .hasText('00:01:02', 'should compute other entry duration');

    assert.dom(`[data-test-rounding]`).exists('should show rounding checkbox');
    assert
      .dom(`[data-test-rounding]`)
      .isNotChecked('should not have rounding by default');

    await click('[data-test-rounding]');

    assert
      .dom(`[data-test-rounding]`)
      .isChecked('should have rounding enabled');

    assert
      .dom(`[data-test-entries-total-duration]`)
      .hasText('04:20:00', 'should compute rounded total duration');

    assert
      .dom(`[data-test-client-group="-1"] [data-test-client-group-duration]`)
      .hasText('04:15:00', 'should compute "No client" duration');
    assert
      .dom(`[data-test-project-group="-1"] [data-test-project-group-duration]`)
      .hasText('04:15:00', 'should compute "No project" duration');
    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-duration]`)
      .hasText('04:15:00', 'should compute rounded entry duration');

    assert
      .dom(
        `[data-test-client-group="${client.id}"] [data-test-client-group-duration]`
      )
      .hasText('00:05:00', 'should compute client duration');
    assert
      .dom(
        `[data-test-project-group="${project.id}"] [data-test-project-group-duration]`
      )
      .hasText('00:05:00', 'should compute project duration');
    assert
      .dom(`[data-test-entry="${otherEntry.id}"] [data-test-entry-duration]`)
      .hasText('00:05:00', 'should compute other entry duration');
  });

  test('does not allow entry edit when rounded', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const entry = this.server.create('entry', { user });

    await visit('/reviews');
    await click('[data-test-rounding]');

    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-delete]`)
      .doesNotExist('should not show entry delete action');
    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-edit-date]`)
      .doesNotExist('should not show entry edit date action');

    await click(`[data-test-entry="${entry.id}"] [data-test-entry-title]`);
    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-edit-title]`)
      .doesNotExist('should not show title edit');

    await click(`[data-test-entry="${entry.id}"] [data-test-entry-started-at]`);
    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-edit-started-at]`)
      .doesNotExist('should not show started at edit');

    await click(`[data-test-entry="${entry.id}"] [data-test-entry-stopped-at]`);
    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-edit-stopped-at]`)
      .doesNotExist('should not show stopped at edit');

    await click(`[data-test-entry="${entry.id}"] [data-test-entry-duration]`);
    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-edit-duration]`)
      .doesNotExist('should not show duration edit');

    await click(`[data-test-entry="${entry.id}"] [data-test-entry-project]`);
    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-edit-project]`)
      .doesNotExist('should not show project edit');
  });

  test('keeps rounding state after transition', async function (assert) {
    await this.utils.authentication.authenticate();
    await visit('/reviews');
    await click('[data-test-rounding]');

    assert
      .dom(`[data-test-rounding]`)
      .isChecked('should have rounding enabled');

    await visit('/');
    await visit('/reviews');

    assert
      .dom(`[data-test-rounding]`)
      .isChecked('should keep rounding enabled');
  });
});
