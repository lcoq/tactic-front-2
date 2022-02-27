import { module, test } from 'qunit';
import { visit, currentURL, findAll } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { setupUtils } from '../utils/setup';

module('Acceptance | projects', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('redirects to login when not authenticated', async function (assert) {
    await visit('/projects');
    assert.strictEqual(currentURL(), '/login', 'should redirect to login');
  });

  test('redirects to login when a session token is stored in cookies but is invalid', async function (assert) {
    document.cookie = 'token=invalid; path=/';
    await visit('/projects');
    assert.strictEqual(currentURL(), '/login', 'should redirect to login');
  });

  test('remains on projects when a valid session token is stored in cookies', async function (assert) {
    await this.utils.authenticate();
    await visit('/projects');
    assert.strictEqual(currentURL(), '/projects', 'should remains on projects');
  });

  test('show projects grouped by client', async function (assert) { // eslint-disable-line
    await this.utils.authenticate();

    this.server.create('project', { name: 'Music' });
    this.server.create('project', { name: 'Dungeon Master' });

    this.server.create('client', { name: 'Efficiency' });

    const client2 = this.server.create('client', { name: 'Productivity' });
    this.server.create('project', { client: client2, name: 'Tactic' });
    this.server.create('project', { client: client2, name: 'Tictoc' });

    const expected = [
      {
        name: 'No client',
        projects: [{ name: 'Dungeon Master' }, { name: 'Music' }],
      },
      {
        name: 'Efficiency',
        projects: [],
      },
      {
        name: 'Productivity',
        projects: [{ name: 'Tactic' }, { name: 'Tictoc' }],
      },
    ];

    await visit('/projects');

    assert
      .dom('[data-test-client-with-projects]')
      .exists({ count: 3 }, 'should show all clients (including "no client")');

    const clients = findAll('[data-test-client-with-projects]');

    expected.forEach(function (clientAttributes, clientIndex) {
      const client = clients[clientIndex];
      const projects = Array.from(
        client.querySelectorAll('[data-test-project]')
      );
      const clientId = `client ${clientIndex + 1}`;

      assert
        .dom(client.querySelector('[data-test-client-name]'))
        .exists(`${clientId} should show its name`);
      assert
        .dom(client.querySelector('[data-test-client-name]'))
        .hasText(clientAttributes.name, `${clientId} should compute its name`);
      assert.strictEqual(
        projects.length,
        clientAttributes.projects ? clientAttributes.projects.length : 0,
        `${clientId} should show its projects`
      );

      clientAttributes.projects.forEach(function (
        projectAttributes,
        projectIndex
      ) {
        const project = projects[projectIndex];
        const projectId = `${clientId} project ${projectIndex + 1}`;
        assert
          .dom(project.querySelector('[data-test-project-name]'))
          .exists(`${projectId} should show its name`);
        assert
          .dom(project.querySelector('[data-test-project-name]'))
          .hasText(
            projectAttributes.name,
            `${projectId} should compute its name`
          );
      });

      assert
        .dom(client.querySelector('[data-test-new-project]'))
        .exists('should show new project action');
      assert
        .dom(client.querySelector('[data-test-new-project]'))
        .includesText(
          'Create new project',
          'should show new project action label'
        );
    });

    assert
      .dom('[data-test-client-new]')
      .exists('should show new client action');
    assert
      .dom('[data-test-client-new]')
      .includesText('Create new client', 'should show new client action label');
  });
});
