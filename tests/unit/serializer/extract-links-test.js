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

test("basic", function() {
  var links = serializer.extractRelationships({
    "posts.comments": "http://example.com/posts/{posts.id}/comments"
  }, {});

  deepEqual(links, {
    "comments": "/posts/{posts.id}/comments"
  });
});

test("exploding", function() {
  var links = serializer.extractRelationships({
    "posts.comments": "http://example.com/comments/{posts.comments}"
  }, {});

  deepEqual(links, {
    "comments": "/comments/{posts.comments}"
  });
});

test("self link", function() {
  var links = serializer.extractRelationships({
    "author": {
      "self": "http://example.com/links/posts/1/author",
      "linkage": {
        "id": "1",
        "type": "authors"
      }
    }
  }, { id:1, type:'posts' });

  deepEqual(links, {
    "author--self": "/links/posts/1/author"
  });
});

test("self link with replacement", function() {
  var links = serializer.extractRelationships({
    "author": {
      "self": "http://example.com/posts/{post.id}/author/{author.id}",
      "linkage": {
        "id": "1",
        "type": "authors"
      }
    }
  }, { id:1, type:'posts' });

  deepEqual(links, {
    "author--self": "/posts/{post.id}/author/{author.id}"
  });
});

test("related link", function() {
  var links = serializer.extractRelationships({
    "author": {
      "related": "http://example.com/authors/1",
      "linkage": {
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
      "related": "http://example.com/authors/{author.id}",
      "id": "1",
      "type": "authors"
    }
  }, { id:1, type:'posts' });

  deepEqual(links, {
    "author": "/authors/{author.id}"
  });
});


test("self and related link", function() {
  var links = serializer.extractRelationships({
    "author": {
      "self": "http://example.com/posts/1/links/author",
      "related": "http://example.com/posts/1/author",
      "id": "1",
      "type": "authors"
    }
  }, { id:'1', type:'post' });

  deepEqual(links, {
    "author": "/posts/1/author",
    "author--self": "/posts/1/links/author"
  });
});