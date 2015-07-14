/* global Ember,DS */
var get = Ember.get;
var isNone = Ember.isNone;
var HOST = /(^https?:\/\/.*?)(\/.*)/;

DS.JsonApiSerializer = DS.RESTSerializer.extend({

  primaryRecordKey: 'data',
  sideloadedRecordsKey: 'included',
  relationshipKey: 'self',
  relatedResourceKey: 'related',

  keyForAttribute: function(key) {
    return Ember.String.dasherize(key);
  },
  keyForRelationship: function(key) {
    return Ember.String.dasherize(key);
  },
  keyForSnapshot: function(snapshot) {
    return snapshot.modelName;
  },

  /**
   * Flatten links
   */
  normalize: function(type, hash, prop) {
    var json = {};
    for (var key in hash) {
      // This is already normalized
      if (key === 'relationships') {
        json[key] = hash[key];
        continue;
      }

      if (key === 'attributes') {
        for (var attributeKey in hash[key]) {
          var camelizedKey = Ember.String.camelize(attributeKey);
          json[camelizedKey] = hash[key][attributeKey];
        }
        continue;
      }
      var camelizedKey = Ember.String.camelize(key);
      json[camelizedKey] = hash[key];
    }

    return this._super(type, json, prop);
  },

  /**
   * Extract top-level "meta" & "links" before normalizing.
   */
  normalizePayload: function(payload) {
    if(!payload) {
      return {};
    }

    var data = payload[this.primaryRecordKey];
    if (data) {
      if (Ember.isArray(data)) {
        this.extractArrayData(data, payload);
      } else {
        this.extractSingleData(data, payload);
      }
      delete payload[this.primaryRecordKey];
    }
    if (payload.meta) {
      this.extractMeta(payload.meta);
      delete payload.meta;
    }
    if (payload.links) {
      // FIXME Need to handle top level links, like pagination
      delete payload.links;
    }
    if (payload[this.sideloadedRecordsKey]) {
      this.extractSideloaded(payload[this.sideloadedRecordsKey]);
      delete payload[this.sideloadedRecordsKey];
    }

    return payload;
  },

  extractArray: function(store, type, arrayPayload, id, requestType) {
    if (Ember.isEmpty(arrayPayload[this.primaryRecordKey])) {
      return Ember.A();
    }
    return this._super(store, type, arrayPayload, id, requestType);
  },

  /**
   * Extract top-level "data" containing a single primary data
   */
  extractSingleData: function(data, payload) {
    if (data.relationships) {
      this.extractRelationships(data.relationships, data);
    }
    payload[data.type] = data;
    delete data.type;
  },

  /**
   * Extract top-level "data" containing a single primary data
   */
  extractArrayData: function(data, payload) {
    var type = data.length > 0 ? data[0].type : null;
    var serializer = this;
    data.forEach(function(item) {
      if(item.relationships) {
        serializer.extractRelationships(item.relationships, item);
      }
    });

    payload[type] = data;
  },

  /**
   * Extract top-level "included" containing associated objects
   */
  extractSideloaded: function(sideloaded) {
    var store = get(this, 'store');
    var models = {};
    var serializer = this;

    sideloaded.forEach(function(link) {
      var type = link.type;
      if (link.relationships) {
        serializer.extractRelationships(link.relationships, link);
      }
      delete link.type;
      if (!models[type]) {
        models[type] = [];
      }
      models[type].push(link);
    });

    this.pushPayload(store, models);
  },

  /**
   * Parse the top-level "links" object.
   */
  extractRelationships: function(links, resource) {
    var link, association, id, route, relationshipLink, cleanedRoute;

    // Clear the old format
    resource.links = {};

    for (link in links) {
      association = links[link];
      link = Ember.String.camelize(link.split('.').pop());

      if(!association) {
        continue;
      }

      if (typeof association === 'string') {
        if (association.indexOf('/') > -1) {
          route = association;
          id = null;
        } else { // This is no longer valid in JSON API. Potentially remove.
          route = null;
          id = association;
        }
        relationshipLink = null;
      } else {
        if (association.links) {
          relationshipLink =  association.links[this.relationshipKey];
          route = association.links[this.relatedResourceKey];
        }
        id = getLinkageId(association.data);
      }

      if (route) {
        cleanedRoute = this.removeHost(route);
        resource.links[link] = cleanedRoute;

        // Need clarification on how this is used
        if (cleanedRoute.indexOf('{') > -1) {
          DS._routes[link] = cleanedRoute.replace(/^\//, '');
        }
      }
      if (id) {
        resource[link] = id;
      }
    }
    return resource.links;
  },

  removeHost: function(url) {
    return url.replace(HOST, '$2');
  },

  // SERIALIZATION

  serialize: function(snapshot, options) {
    var data = this._super(snapshot, options);
    var type = (options ? options.type : null) || snapshot.modelName;
    data['attributes'] = {};
    for (var key in data) {
      if (key === 'links' || key === 'attributes' || key === 'id' || key === 'type' || key === 'relationships') {
        if (key === 'links') {
          if (!data.relationships) {
            data.relationships = {};
          }
          for (var k in data[key]) {
            data.relationships[k] = data[key][k];
          }
          delete data.links;
        }
        continue;
      }
      data['attributes'][key] = data[key];
      delete data[key];
    }
    if (!data.hasOwnProperty('type') && type) {
      data.type = Ember.String.pluralize(this.keyForRelationship(type));
    }
    return data;
  },

  serializeArray: function(snapshots, options) {
    var data = Ember.A();
    var serializer = this;

    if(!snapshots) {
      return data;
    }

    snapshots.forEach(function(snapshot) {
      data.push(serializer.serialize(snapshot, options));
    });
    return data;
  },

  serializeIntoHash: function(hash, type, snapshot, options) {
    var data = this.serialize(snapshot, options);
    if (!data.hasOwnProperty('type')) {
      data.type = Ember.String.pluralize(this.keyForRelationship(type.modelName));
    }
    hash[this.keyForAttribute(type.modelName)] = data;
  },

  /**
   * Use "links" key, remove support for polymorphic type
   */
  serializeBelongsTo: function(record, json, relationship) {
    var attr = relationship.key;
    var belongsTo = record.belongsTo(attr);
    var type, key;

    if (isNone(belongsTo)) {
      return;
    }

    type = this.keyForSnapshot(belongsTo);
    key = this.keyForRelationship(attr);

    if (!json.links) {
      json.links = json.relationships || {};
    }
    json.links[key] = belongsToLink(key, type, get(belongsTo, 'id'));
  },

  /**
   * Use "links" key
   */
  serializeHasMany: function(record, json, relationship) {
    var attr = relationship.key;
    var type = this.keyForRelationship(relationship.type);
    var key = this.keyForRelationship(attr);

    if (relationship.kind === 'hasMany') {
      json.relationships = json.relationships || {};
      json.relationships[key] = hasManyLink(key, type, record, attr);
    }
  }
});

function belongsToLink(key, type, value) {
  if (!value) {
    return value;
  }

  return {
    data: {
      id: value,
      type: Ember.String.pluralize(type)
    }
  };
}

function hasManyLink(key, type, record, attr) {
  var links = Ember.A(record.hasMany(attr)).mapBy('id') || [];
  var typeName = Ember.String.pluralize(type);
  var linkages = [];
  var index, total;

  for (index = 0, total = links.length; index < total; ++index) {
    linkages.push({
      id: links[index],
      type: typeName
    });
  }

  return { data: linkages };
}

function normalizeLinkage(linkage) {
  if (!linkage.type) {
    return linkage.id;
  }

  return {
    id: linkage.id,
    type: Ember.String.camelize(Ember.String.singularize(linkage.type))
  };
}
function getLinkageId(linkage) {
  if (Ember.isEmpty(linkage)) {
    return null;
  }

  return (Ember.isArray(linkage)) ? getLinkageIds(linkage) : normalizeLinkage(linkage);
}
function getLinkageIds(linkage) {
  if (Ember.isEmpty(linkage)) {
    return null;
  }

  var ids = [];
  var index, total;
  for (index = 0, total = linkage.length; index < total; ++index) {
    ids.push(normalizeLinkage(linkage[index]));
  }
  return ids;
}

export default DS.JsonApiSerializer;
