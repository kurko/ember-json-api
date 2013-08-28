(function() {

  var get = Ember.get;

  DS.JsonApiAdapter = DS.RESTAdapter.extend({

    serializer: DS.JsonApiSerializer,

    /**
     * Fix query URL
     */
    findMany: function(store, type, ids, owner) {
      var root = this.rootForType(type),
      adapter = this;

      ids = this.serializeIds(ids);

      return this.ajax(this.buildURL(root), "GET", {
        data: {ids: ids.join(',')}
      }).then(function(json) {
        adapter.didFindMany(store, type, json);
      }).then(null, DS.rejectionHandler);
    },

    /**
     * Cast individual record to array
     */
    createRecord: function(store, type, record) {
      var root = this.rootForType(type);
      var adapter = this;
      var data = {};

      data[root] = [this.serialize(record, { includeId: true })];

      return this.ajax(this.buildURL(root), "POST", {
        data: data
      }).then(function(json){
        adapter.didCreateRecord(store, type, record, json);
      }, function(xhr) {
        adapter.didError(store, type, record, xhr);
        throw xhr;
      }).then(null, DS.rejectionHandler);
    },

    /**
     * Cast individual record to array
     */
    updateRecord: function(store, type, record) {
      var id, root, adapter, data;

      id = get(record, 'id');
      root = this.rootForType(type);
      adapter = this;

      data = {};
      data[root] = [this.serialize(record)];

      return this.ajax(this.buildURL(root, id, record), "PUT",{
        data: data
      }).then(function(json){
        adapter.didUpdateRecord(store, type, record, json);
      }, function(xhr) {
        adapter.didError(store, type, record, xhr);
        throw xhr;
      }).then(null, DS.rejectionHandler);
    }

  });

}).call(this);
