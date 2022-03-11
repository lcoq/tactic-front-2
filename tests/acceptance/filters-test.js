import { module, test } from 'qunit';
import { visit, click, triggerEvent, fillIn } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import moment from 'moment';

import { setupUtils } from '../utils/setup';

module('Acceptance | Filters', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('keeps filters from reviews page on stats page', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const otherUser = this.server.create('user');

    const project = this.server.create('project');
    const otherProject = this.server.create('project');

    this.server.create('entry');
    this.server.create('entries-stat-group', { nature: 'hour/day' });

    await visit('/reviews');

    await click(`[data-test-filter-user="${otherUser.id}"]`);
    await click(`[data-test-filter-user="${user.id}"]`); // uncheck
    await triggerEvent('[data-test-filter-user-container]', 'mouseleave');

    await click(`[data-test-filter-project="${project.id}"]`); // uncheck
    await triggerEvent('[data-test-filter-project-container]', 'mouseleave');

    await click(`[data-test-filter-since]`);
    await click(`[data-test-filter-since] .ui-datepicker-prev`);
    await click(
      `[data-test-filter-since] .ui-datepicker-calendar [data-date="20"]`
    );

    await click(`[data-test-filter-before]`);
    await click(`[data-test-filter-before] .ui-datepicker-next`);
    await click(
      `[data-test-filter-before] .ui-datepicker-calendar [data-date="1"]`
    );

    await fillIn('[data-test-filter-query]', 'My query');
    await click(`[data-test-header]`);

    await visit('/stats');

    assert
      .dom(`[data-test-filter-user="${otherUser.id}"]`)
      .isChecked('should keep active user from reviews filter');
    assert
      .dom(`[data-test-filter-user="${user.id}"]`)
      .isNotChecked('should keep inactive user from reviews filter');

    assert
      .dom(`[data-test-filter-project="${otherProject.id}"]`)
      .isChecked('should keep active project from reviews filter');
    assert
      .dom(`[data-test-filter-project="${project.id}"]`)
      .isNotChecked('should keep inactive project from reviews filter');

    const expectedSince = moment()
      .startOf('month')
      .subtract(1, 'month')
      .add(19, 'd')
      .format('YYYY/MM/DD');
    assert.dom(`[data-test-filter-since]`).hasText(expectedSince);

    const expectedBefore = moment()
      .startOf('month')
      .add(1, 'month')
      .format('YYYY/MM/DD');
    assert.dom(`[data-test-filter-before]`).hasText(expectedBefore);
  });
});
