import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
  alwaysIncludeLinkageData: true,

  /* eslint-disable ember/avoid-leaking-state-in-ember-objects */
  include: ['entries-stats'],
});
