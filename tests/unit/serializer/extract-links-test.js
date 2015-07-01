var serializer;

module('unit/ember-json-api-adapter - serializer - extract-links-test', {
  setup: function() {
    // TODO remove global
    DS._routes = Ember.create(null);
    serializer = DS.JsonApiSerializer.create();
  },
  tearDown: function() {
    // TODO remove global
    DS._routes = Ember.create(null);
    Ember.run(serializer, 'destroy');
  }
});

test("no links", function() {
  var links = serializer.extractRelationships({

  }, {});

  deepEqual(links, {});
});

test("related link", function() {
  var links = serializer.extractRelationships({
    "author": {
      "links": {
        "related": "http://example.com/authors/1"
      },
      "data": {
        "id": "1",
        "type": "authors"
      }
    }
  }, { id:1, type:'posts' });

  deepEqual(links, {
    "author": "/authors/1"
  });
});

test("related link with replacement", function() {
  var links = serializer.extractRelationships({
    "author": {
      "links": {
        "related": "http://example.com/authors/{author.id}",
      },
      "data": {
        "id": "1",
        "type": "authors"
      }
    }
  }, { id:1, type:'posts' });

  deepEqual(links, {
    "author": "/authors/{author.id}"
  });
});
