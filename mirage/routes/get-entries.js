export default {
  default: function () {
    return function (schema, request) {
      if (request.queryParams['filter[running]'] === '1') {
        return { data: null };
      } else {
        return schema.entries.where((e) => !!e.stoppedAt);
      }
    };
  },
  specificEntries: function (entries) {
    return function (schema, request) {
      if (request.queryParams['filter[running]'] === '1') {
        return { data: null };
      } else {
        return schema.entries.find(entries.mapBy('id'));
      }
    };
  },
  runningEntry: function (entry) {
    return function (schema, request) {
      if (request.queryParams['filter[running]'] === '1') {
        return entry;
      } else {
        return schema.entries.where((e) => !!e.stoppedAt);
      }
    };
  },
};
