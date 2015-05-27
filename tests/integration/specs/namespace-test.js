var get = Ember.get, set = Ember.set;
var env;
var responses, fakeServer;

module('integration/specs/namespace', {
  setup: function() {
    fakeServer = stubServer();

    responses = {
      posts1_id: {
        data: {
          type: 'posts',
          id: '1',
          title: 'Rails is Omakase',
          links: {
            author: {
              linkage: {
                type: 'authors',
                id: '2'
              }
            },
            comments: {
              linkage: [{
                type: 'comments',
                id: '2'
              }]
            }
          }
        }
      },
      posts2_id: {
        data: {
          type: 'posts',
          id: '2',
          title: 'TDD Is Dead lol',
          links: {
            author: {
              linkage: {
                type: 'authors',
                id: '2'
              }
            },
            comments: {
              linkage: [{
                type: 'comments',
                id: '3'
              }]
            }
          }
        }
      },
      posts1_related: {
        data: {
          type: 'posts',
          id: '1',
          title: 'Rails is Omakase',
          links: {
            author: {
              related: '/api/posts/1/author',
              linkage: {
                type: 'authors',
                id: '2'
              }
            },
            comments: {
              related: '/api/posts/1/comments'
            }
          }
        }
      },
      posts2_related: {
        data: {
          type: 'posts',
          id: '2',
          title: 'TDD Is Dead lol',
          links: {
            author: {
              related: '/api/posts/2/author',
              linkage: {
                type: 'authors',
                id: '2'
              }
            },
            comments: {
              related: '/api/posts/2/comments'
            }
          }
        }
      },
      author: {
        data: {
          type: 'authors',
          id: '2',
          name: 'dhh'
        }
      },
      post1_comments: {
        data: [{
          type: 'comments',
          'id': '2',
          'title': 'good article',
          'body': 'ideal for my startup'
        }]
      },
      post2_comments: {
        data: [{
          type: 'comments',
          id: '3',
          title: 'bad article',
          body: "doesn't run Crysis"
        }]
      },
      comments_2: {
        data: {
          type: 'comments',
          'id': '2',
          'title': 'good article',
          'body': 'ideal for my startup'
        }
      },
      comments_3: {
        data: {
          type: 'comments',
          id: '3',
          title: 'bad article',
          body: "doesn't run Crysis"
        }
      }
    };

    env = setupStore($.extend({
      adapter: DS.JsonApiAdapter.extend({
        namespace: 'api'
      })
    }, setModels({
      authorAsync: true,
      commentAsync: true
    })));
    env.store.modelFor('post');
    env.store.modelFor('author');
    env.store.modelFor('comment');
  },

  teardown: function() {
    Ember.run(env.store, 'destroy');
    shutdownFakeServer(fakeServer);
  }
});

asyncTest('GET /api/posts/1 calls with type and id to comments', function() {
  fakeServer.get('/api/posts/1', responses.posts1_id);
  fakeServer.get('/api/posts/2', responses.posts2_id);
  fakeServer.get('/api/authors/2', responses.author);
  fakeServer.get('/api/comments/2', responses.comments_2);
  fakeServer.get('/api/comments/3', responses.comments_3);

  runTests();
});

asyncTest('GET /api/posts/1 calls with related URLs', function() {
  fakeServer.get('/api/posts/1', responses.posts1_related);
  fakeServer.get('/api/posts/2', responses.posts2_related);
  fakeServer.get('/api/posts/1/author', responses.author);
  fakeServer.get('/api/posts/2/author', responses.author);
  fakeServer.get('/api/posts/1/comments', responses.post1_comments);
  fakeServer.get('/api/posts/2/comments', responses.post2_comments);
  runTests();
});

function runTests() {
  Em.run(function() {
    var promises = [];
    promises.push(testPost1());
    promises.push(testPost2());

    Ember.RSVP.all(promises).then(start);
  });
}

function testPost1() {
  return env.store.find('post', '1').then(function(record) {
    equal(record.get('id'), '1', 'id is correct');
    equal(record.get('title'), 'Rails is Omakase', 'title is correct');

    record.get('author').then(function(author) {
      equal(author.get('id'), '2', 'author id is correct');
      equal(author.get('name'), 'dhh', 'author name is correct');

      record.get('comments').then(function(comments) {
        var comment = comments.objectAt(0);

        equal(comments.get('length'), 1, 'there is 1 comment');

        equal(comment.get('title'), 'good article', 'comment1 title');
        equal(comment.get('body'), 'ideal for my startup', 'comment1 body');
      });
    });
  });
}

function testPost2() {
  return env.store.find('post', '2').then(function(record) {
    equal(record.get('id'), '2', 'id is correct');
    equal(record.get('title'), 'TDD Is Dead lol', 'title is correct');

    record.get('author').then(function(author) {
      equal(author.get('id'), '2', 'author id is correct');
      equal(author.get('name'), 'dhh', 'author name is correct');

      record.get('comments').then(function(comments) {
        var comment = comments.objectAt(0);

        equal(comments.get('length'), 1, 'there is 1 comment');

        equal(comment.get('title'), 'bad article', 'comment2 title');
        equal(comment.get('body'), "doesn't run Crysis", 'comment2 body');
      });
    });
  });
}