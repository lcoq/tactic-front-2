import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
  // TODO we should not include user by default here and instead use `serializeIds: 'always'`
  // option but it does not work with JSONAPISerializer for now :
  // https://github.com/miragejs/ember-cli-mirage/issues/2365
  include: ['user'],
});
