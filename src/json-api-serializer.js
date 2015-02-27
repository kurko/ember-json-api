var get = Ember.get;
var isNone = Ember.isNone;

DS.JsonApiSerializer = DS.RESTSerializer.extend({
  keyForRelationship: function(key) {
    return key;
  },

  extractSingle: function() {
    console.log('extractSingle', arguments);
    return this._super.apply(this, arguments);
  },

  /**
   * Flatten links
   */
  normalize: function(type, hash, prop) {
    console.log('normalize', arguments);
    var json = {};
    for (var key in hash) {
      if (key !== 'links') {
        var camelizedKey = Ember.String.camelize(key);
        json[camelizedKey] = hash[key];
      } else if (typeof hash[key] === 'object') {
        for (var link in hash[key]) {
          var linkValue = hash[key][link];
          link = Ember.String.camelize(link);
          if (linkValue && typeof linkValue === 'object' && linkValue.href) {
            json.links = json.links || {};
            json.links[link] = linkValue.href;
          } else if (linkValue && typeof linkValue === 'object' && linkValue.ids) {
            json[link] = linkValue.ids;
          } else {
            json[link] = linkValue;
          }
        }
      }
    }
    return this._super(type, json, prop);
  },

  /**
   * Extract top-level "meta" & "links" before normalizing.
   */
  normalizePayload: function(payload) {
    console.log('PAYLOAD', payload);
    var data = payload.data;
    if (data) {
      if(Ember.isArray(data)) {
        this.extractArrayData(data, payload);
      } else {
        this.extractSingleData(data, payload);
      }
      delete payload.data;
    }
    if (payload.meta) {
      this.extractMeta(payload.meta);
      delete payload.meta;
    }
    if (payload.links) {
      this.extractLinks(payload.links, payload);
      delete payload.links;
    }
    if (payload.linked) {
      this.extractLinked(payload.linked);
      delete payload.linked;
    }
    console.log('normalizePayload', payload);
    return payload;
  },

  /**
   * Extract top-level "data" containing a single primary data
   */
  extractSingleData: function(data, payload) {
    if(data.links) {
      this.extractLinks(data.links, data);
      delete data.links;
    }
    payload[data.type] = data;
  },

  /**
   * Extract top-level "data" containing a single primary data
   */
  extractArrayData: function(data, payload) {
    var type = data.length > 0 ? data[0].type : null;
    data.forEach(function(item) {
      if(item.links) {
        this.extractLinks(data.links, data);
        delete data.links;
      }
    }.bind(this));

    payload[type] = data;
  },

  /**
   * Extract top-level "linked" containing associated objects
   */
  extractLinked: function(linked) {
    var store = get(this, 'store'), models = {};

    linked.forEach(function(link) {
      var type = link.type;
      delete link.type;
      if(!models[type]) {
        models[type] = [];
      }
      models[type].push(link);
    });
    console.log('pushing payload', models);
    this.pushPayload(store, models);
  },

  /**
   * Parse the top-level "links" object.
   */
  extractLinks: function(links, resource) {
    console.log('extractLinks', links, resource);
    var link, association, id, route, linkKey;

    for (link in links) {
      association = links[link];
      if(typeof association === 'string') {
        console.log('links is string');
        if(association.indexOf('/') > -1) {
          route = association;
          id = null;
        } else {
          route = null;
          id = association;
        }
      } else {
        route = association.resource || association.self;
        id = association.id || association.ids;

        console.log('links is object', route, id);
      }

    }
    if(route) {
      // strip base url
      if (route.substr(0, 4).toLowerCase() === 'http') {
        route = route.split('//').pop().split('/').slice(1).join('/');
      }
      // strip prefix slash
      if (route.charAt(0) === '/') {
        route = route.substr(1);
      }
      DS._routes[link] = route;
    }
    resource[link] = id;
  },

  // SERIALIZATION

  /**
   * Use "links" key, remove support for polymorphic type
   */
  serializeBelongsTo: function(record, json, relationship) {
    var attr = relationship.key;
    var belongsTo = record.belongsTo(attr);
    var type = this.keyForRelationship(relationship.type.typeKey);
    var key = this.keyForRelationship(attr);

    if (isNone(belongsTo)) return;

    json.links = json.links || {};
    json.links[key] = belongsToLink(key, type, get(belongsTo, 'id'));
  },

  /**
   * Use "links" key
   */
  serializeHasMany: function(record, json, relationship) {
    var attr = relationship.key;
    var type = this.keyForRelationship(relationship.type.typeKey);
    var key = this.keyForRelationship(attr);

    if (relationship.kind === 'hasMany') {
      json.links = json.links || {};
      json.links[key] = hasManyLink(key, type, record, attr);
    }
  }
});

function belongsToLink(key, type, value) {
  var link = value;
  if (link && key !== type) {
    link = {
      id: link,
      type: type
    };
  }
  return link;
}

function hasManyLink(key, type, record, attr) {
  var link = record.hasMany(attr).mapBy('id');
  if (link && key !== Ember.String.pluralize(type)) {
    link = {
      ids: link,
      type: type
    };
  }
  return link;
}

export default DS.JsonApiSerializer;
