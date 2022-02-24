export default {
  default: function () {
    return function (schema, request) {
      if (request.queryParams['filter[running]'] === '1') {
        return { data: null };
      } else {
        return schema.entries.all();
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
    }
  }
}
