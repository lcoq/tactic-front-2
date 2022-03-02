const matchers = {
  isFilters(request) {
    const p = request.queryParams;
    return p['filter[since]'] && p['filter[before]'] && p['filter[user-id]'];
  },
  isRunning(request) {
    return request.queryParams['filter[running]'] === '1';
  },
};

function defaultFn() {
  return function (schema, request) {
    if (matchers.isRunning(request)) {
      return { data: null };
    } else {
      return schema.entries.where((e) => !!e.stoppedAt);
    }
  };
}

function specificEntries(entries) {
  return function (schema, request) {
    if (!matchers.isRunning(request)) {
      return schema.entries.find(entries.mapBy('id'));
    } else {
      return defaultFn()(schema, request);
    }
  };
}

function runningEntry(entry) {
  return function (schema, request) {
    if (matchers.isRunning(request)) {
      return entry;
    } else {
      return defaultFn()(schema, request);
    }
  };
}

function filters(entries, additionalCheck = () => true) {
  return function (schema, request) {
    if (matchers.isFilters(request) && additionalCheck(schema, request)) {
      return schema.entries.find(entries.mapBy('id'));
    } else {
      return defaultFn()(schema, request);
    }
  };
}

export default {
  default: defaultFn,
  specificEntries,
  runningEntry,
  filters,
};
