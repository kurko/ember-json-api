var get = Ember.get;
var isNone = Ember.isNone;

DS.JsonApiSerializer = DS.RESTSerializer.extend({

  primaryRecord: 'data',

  keyForRelationship: function(key) {
    return key;
  },

  /**
   * Flatten links
   */
  normalize: function(type, hash, prop) {
    var json = {};
    for (var key in hash) {
      // This is already normalized
      if (key === 'links') {
        json[key] = hash[key];
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
    if(!payload) { return; }
    var data = payload[this.primaryRecord];
    if (data) {
      if(Ember.isArray(data)) {
        this.extractArrayData(data, payload);
      } else {
        this.extractSingleData(data, payload);
      }
      delete payload[this.primaryRecord];
    }
    if (payload.meta) {
      this.extractMeta(payload.meta);
      delete payload.meta;
    }
    if (payload.links) {
      this.extractLinks(payload.links, payload);
      delete data.links;
    }
    if (payload.linked) {
      this.extractLinked(payload.linked);
      delete payload.linked;
    }

    return payload;
  },

  /**
   * Extract top-level "data" containing a single primary data
   */
  extractSingleData: function(data, payload) {
    if(data.links) {
      this.extractLinks(data.links, data);
      //delete data.links;
    }
    payload[data.type] = data;
    delete data.type;
  },

  /**
   * Extract top-level "data" containing a single primary data
   */
  extractArrayData: function(data, payload) {
    var type = data.length > 0 ? data[0].type : null, serializer = this;
    data.forEach(function(item) {
      if(item.links) {
        serializer.extractLinks(item.links, item);
        //delete data.links;
      }
    });

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

    this.pushPayload(store, models);
  },

  /**
   * Parse the top-level "links" object.
   */
  extractLinks: function(links, resource) {
    var link, association, id, route, selfLink, cleanedRoute, linkKey, hasReplacement;
    // Used in unit test
    var extractedLinks = [], linkEntry;

    // Clear the old format
    delete resource.links;

    for (link in links) {
      association = links[link];
      link = Ember.String.camelize(link.split('.').pop());
      if(!association) { continue; }
      if (typeof association === 'string') {
        if (association.indexOf('/') > -1) {
          route = association;
          id = null;
        } else {
          route = null;
          id = association;
        }
        selfLink = null;
      } else {
        route = association.resource || association.self;
        id = association.id || association.ids;
        selfLink = association.self;
      }

      if (route) {
        if (!resource.links) {
          resource.links = {};
        }
        resource.links[link] = route;

        linkEntry = {};
        // If there is a placeholder for the id (i.e. /resource/{id}), don't include the ID in the key
        hasReplacement = route.indexOf('{') > -1;
        linkKey  = (id && !hasReplacement) ? link + '.' + id : link;
        cleanedRoute = cleanRoute(route);
        DS._routes[linkKey] = cleanedRoute;
        linkEntry[linkKey] = cleanedRoute;
        if(selfLink) {
          linkKey = this.buildSelfKey(resource.type, hasReplacement ? null : resource.id, link, (hasReplacement) ? null : id);
          cleanedRoute = cleanRoute(selfLink);
          DS._routes[linkKey] = cleanedRoute;
          linkEntry[linkKey] = cleanedRoute;
        }
        extractedLinks.push(linkEntry);
      }
      if(id) {
          resource[link] = id;
      }
    }
    return extractedLinks;
  },

  buildSelfKey: function(parentType, parentId, link, id) {
    var keys = [];
    if(parentType) {
      keys.push(Ember.String.pluralize(parentType));
      if(parentId) {
        keys.push(parentId);
      }
    }
    keys.push(link);
    if(id) {
      keys.push(id);
    }
    return keys.join('.') + '--self';
  },

  // SERIALIZATION

  serializeIntoHash: function(hash, type, snapshot, options) {
    var pluralType = Ember.String.pluralize(type.typeKey),
      data = this.serialize(snapshot, options);
    if(!data.hasOwnProperty('type')) {
      data.type = pluralType;
    }
    hash[type.typeKey] = data;
  },

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
    var attr = relationship.key,
      type = this.keyForRelationship(relationship.type.typeKey),
      key = this.keyForRelationship(attr);

    if (relationship.kind === 'hasMany') {
      json.links = json.links || {};
      json.links[key] = hasManyLink(key, type, record, attr);
    }
  }
});

function belongsToLink(key, type, value) {
  var link = value;
  if (link) {
    link = {
      id: link,
      type: Ember.String.pluralize(type)
    };
  }
  return link;
}

function hasManyLink(key, type, record, attr) {
  var link = record.hasMany(attr).mapBy('id');
  if (link) {
    link = {
      ids: link,
      type: Ember.String.pluralize(type)
    };
  }
  return link;
}

function cleanRoute(route) {
  var cleaned = route;
  // strip base url
  if (cleaned.substr(0, 4).toLowerCase() === 'http') {
    cleaned = cleaned.split('//').pop().split('/').slice(1).join('/');
  }
  // strip prefix slash
  if (cleaned.charAt(0) === '/') {
    cleaned = cleaned.substr(1);
  }
  return cleaned;
}

export default DS.JsonApiSerializer;
