const matchers = {
  isFilters(request) {
    const p = request.queryParams;
    return (
      p['filter[since]'] &&
      p['filter[before]'] &&
      p['filter[user-id]'] &&
      p['filter[project-id]']
    );
  },
};

function daily() {
  return function (schema) {
    return schema.entriesStatGroups.findBy({ nature: 'hour/day' });
  };
}

function monthly() {
  return function (schema) {
    return schema.entriesStatGroups.findBy({ nature: 'hour/month' });
  };
}

function dailyFilters(group, additionalCheck = () => true) {
  return function (schema, request) {
    if (matchers.isFilters(request) && additionalCheck(schema, request)) {
      return group;
    } else {
      return daily()(schema, request);
    }
  };
}

function monthlyFilters(group, additionalCheck = () => true) {
  return function (schema, request) {
    if (matchers.isFilters(request) && additionalCheck(schema, request)) {
      return group;
    } else {
      return monthly()(schema, request);
    }
  };
}

export default {
  daily,
  monthly,
  dailyFilters,
  monthlyFilters,
};
