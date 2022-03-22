import { module, test } from 'qunit';
import { visit, click, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';

import { setupUtils } from '../utils/setup';

module('Acceptance | Notifications', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('toggle notifications on notifications toggle click', async function (assert) {
    await this.utils.authentication.authenticate();
    await visit('/');
    assert
      .dom('[data-test-notifications-toggle]')
      .exists('should have notifications toggle action');
    assert
      .dom('[data-test-notifications-list]')
      .doesNotExist('should not show notifications');

    await click('[data-test-notifications-toggle]');
    assert
      .dom('[data-test-notifications-list]')
      .exists('should show notifications');

    await click('[data-test-notifications-toggle]');
    assert
      .dom('[data-test-notifications-list]')
      .doesNotExist('should no longer show notifications');
  });

  test('close notifications on notifications close click', async function (assert) {
    await this.utils.authentication.authenticate();
    await visit('/');
    await click('[data-test-notifications-toggle]');
    assert
      .dom('[data-test-notifications-close]')
      .exists('should show notification close button');
    await click('[data-test-notifications-close]');
    assert
      .dom('[data-test-notifications-list]')
      .doesNotExist('should no longer show notifications');
  });

  test('shows empty notifications when the user has no notifications', async function (assert) {
    await this.utils.authentication.authenticate();
    await visit('/');
    await click('[data-test-notifications-toggle]');
    assert
      .dom('[data-test-notifications-empty]')
      .exists('should show empty notifications message');
  });

  test('closes notifications on click out', async function (assert) {
    await this.utils.authentication.authenticate();
    await visit('/');
    await click('[data-test-notifications-toggle]');
    assert
      .dom('[data-test-notifications-list]')
      .exists('should show notifications');

    await click('[data-test-header]');
    assert
      .dom('[data-test-notifications-list]')
      .doesNotExist('should no longer show notifications');
  });

  test('shows notifications', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const notification = this.server.create('user-notification', {
      user,
      createdAt: new Date(),
      nature: 'error',
      status: 'unread',
      title: 'My notification title',
      message: 'My notification message',
    });
    const notification2 = this.server.create('user-notification', {
      user,
      createdAt: new Date(),
      nature: 'warning',
      status: 'read',
      title: 'My other notification title',
      message: 'My other notification message',
    });
    const notification3 = this.server.create('user-notification', {
      user,
      createdAt: new Date(),
      nature: 'info',
      status: 'read',
      title: 'Another notification title',
      message: 'Another notification message',
      resource: this.server.create('entry', { user, title: 'My entry' }),
    });
    this.server.create('user-notification-list', {
      user,
      notifications: [notification, notification2, notification3],
    });
    await visit('/');
    await click('[data-test-notifications-toggle]');

    assert
      .dom('[data-test-notifications-empty]')
      .doesNotExist('should not show empty notifications message');

    assert
      .dom(`[data-test-notification]`)
      .exists({ count: 3 }, 'should show notifications');

    assert
      .dom(`[data-test-notification="${notification.id}"]`)
      .exists('should show notification');
    assert
      .dom(`[data-test-notification="${notification.id}"]`)
      .hasClass('notif__item--new', 'should mark unread notification');
    assert
      .dom(`[data-test-notification="${notification.id}"]`)
      .hasClass('notif__item--error', 'should mark error notification');

    assert
      .dom(
        `[data-test-notification="${notification.id}"] [data-test-notification-title]`
      )
      .exists('should show notification title');
    assert
      .dom(
        `[data-test-notification="${notification.id}"] [data-test-notification-title]`
      )
      .hasText(notification.title, 'should compute notification title');

    assert
      .dom(
        `[data-test-notification="${notification.id}"] [data-test-notification-message]`
      )
      .exists('should show notification message');
    assert
      .dom(
        `[data-test-notification="${notification.id}"] [data-test-notification-message]`
      )
      .hasText(notification.message, 'should compute notification message');

    assert
      .dom(
        `[data-test-notification="${notification.id}"] [data-test-notification-date]`
      )
      .exists('should show notification date');
    assert
      .dom(
        `[data-test-notification="${notification.id}"] [data-test-notification-date]`
      )
      .hasText('a few seconds ago', 'should compute notification date');

    assert
      .dom(`[data-test-notification="${notification2.id}"]`)
      .doesNotHaveClass(
        'notif__item--new',
        'should not mark unread notification when read'
      );
    assert
      .dom(`[data-test-notification="${notification2.id}"]`)
      .hasClass('notif__item--warning', 'should mark warning notification');

    assert
      .dom(`[data-test-notification="${notification3.id}"]`)
      .hasClass('notif__item--info', 'should mark info notification');

    assert
      .dom(
        `[data-test-notification="${notification3.id}"] [data-test-notification-resource]`
      )
      .exists('should show notification resource');
    assert
      .dom(
        `[data-test-notification="${notification3.id}"] [data-test-notification-resource]`
      )
      .hasText('My entry', 'should compute notification resource title');
  });

  test('shows entry on notification entry resource click', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const entry = this.server.create('entry', { user, title: 'My entry' });
    const notification = this.server.create('user-notification', {
      user,
      resource: entry,
    });
    this.server.create('user-notification-list', {
      user,
      notifications: [notification],
    });
    await visit('/');
    await click('[data-test-notifications-toggle]');

    await click(
      `[data-test-notification="${notification.id}"] [data-test-notification-resource]`
    );
    assert.strictEqual(
      currentURL(),
      `/entries/${entry.id}`,
      'should redirect to entry page'
    );

    assert
      .dom('[data-test-notifications-list]')
      .doesNotExist('should no longer show notifications');
  });

  test('mark notifications read on notification list close', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const notification = this.server.create('user-notification', { user });
    const notificationList = this.server.create('user-notification-list', {
      user,
      notifications: [notification],
    });
    await visit('/');

    await click('[data-test-notifications-toggle]');
    await click('[data-test-notifications-toggle]');

    const patchRequests = this.server.pretender.handledRequests.filterBy(
      'method',
      'PATCH'
    );
    assert.strictEqual(patchRequests.length, 1, 'should send PATCH request');

    const request = patchRequests[0];
    assert.strictEqual(
      request.url,
      `http://localhost:3000/users/${user.id}/notification_lists/${notificationList.id}`,
      'should set URL'
    );
    assert.strictEqual(
      JSON.parse(request.requestBody).data.attributes.status,
      'read',
      'should send status => read'
    );
  });

  test('deletes notification', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const notification = this.server.create('user-notification', { user });
    this.server.create('user-notification-list', {
      user,
      notifications: [notification],
    });
    await visit('/');

    await click('[data-test-notifications-toggle]');

    assert
      .dom(
        `[data-test-notification="${notification.id}"] [data-test-notification-delete]`
      )
      .exists('should show notification delete');

    await click(
      `[data-test-notification="${notification.id}"] [data-test-notification-delete]`
    );

    assert
      .dom(`[data-test-notification="${notification.id}"]`)
      .doesNotExist('should remove notification from list');

    assert.notOk(
      this.server.db.userNotifications.find(notification.id),
      'should destroy notification'
    );
  });
});
