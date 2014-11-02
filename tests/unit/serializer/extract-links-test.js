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
  var links = serializer.extractLinks({

  });

  deepEqual(links, []);
});

test("basic", function() {
  var links = serializer.extractLinks({
    "posts.comments": "http://example.com/posts/{posts.id}/comments"
  });

  deepEqual(links, [{
    "comment": "posts/{posts.id}/comments"
  }]);
});

test("exploding", function() {
  var links = serializer.extractLinks({
    "posts.comments": "http://example.com/comments/{posts.comments}"
  });

  deepEqual(links, [{
    "comment": "comments/{posts.comments}"
  }]);
});
