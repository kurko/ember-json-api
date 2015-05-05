var get = Ember.get, set = Ember.set;
var env;
var responses, fakeServer;

module('integration/specs/updating-an-individual-resource', {
  setup: function() {
    fakeServer = stubServer();

    responses = {
      post: {
        data: {
          type: 'posts',
          id: '1',
          title: 'Rails is Omakase',
          links: {
            author: {
              self: '/posts/1/links/author',
              related: '/posts/1/author',
              linkage: {}
            }
          }
        }
      },
      author: {
        data: {
          type: 'authors',
          id: '1',
          name: 'dhh'
        }
      },
      postAfterUpdate: {
        data: {
          type: 'posts',
          id: '1',
          title: 'TDD Is Dead lol',
          'post-summary': 'summary'
        }
      },
      postAfterUpdateAuthor: {
        data: {
          type: 'posts',
          id: '1',
          title: 'TDD Is Dead lol',
          'post-summary': 'summary',
          links: {
            author: {
              self: '/posts/1/links/author',
              related: '/posts/1/author',
              linkage: {
                type: 'authors',
                id: '1'
              }
            }
          }
        }
      }
    };

    env = setupStore(setModels({
      authorAsync: true,
      commentAsync: true
    }));
    env.store.modelFor('post');
    env.store.modelFor('author');
    env.store.modelFor('comment');
  },

  teardown: function() {
    Ember.run(env.store, 'destroy');
    shutdownFakeServer(fakeServer);
  }
});

asyncTest("PATCH /posts/1 won't push an array", function() {
  var request = {
    data: {
      id: '1',
      title: 'TDD Is Dead lol',
      'post-summary': null,
      links: {
        comments: {
          linkage: []
        }
      },
      type: 'posts'
    }
  };

  fakeServer.get('/posts/1', responses.post);
  fakeServer.patch('/posts/1', request, responses.postAfterUpdate);

  Em.run(function() {
    env.store.find('post', '1').then(function(post) {
      equal(post.get('title'), 'Rails is Omakase', 'title is correct');
      post.set('title', 'TDD Is Dead lol');
      post.save().then(function(record) {
        equal(record.get('id'), '1', 'id is correct');
        equal(record.get('title'), 'TDD Is Dead lol', 'title is correct');
        equal(record.get('postSummary'), 'summary', 'summary is correct');

        start();
      });
    });
  });
});

asyncTest("Update a post with an author", function() {
  var request = {
    data: {
      id: '1',
      title: 'TDD Is Dead lol',
      'post-summary': null,
      links: {
        comments: {
          linkage: []
        },
        author: {
          linkage: {
            id: '1',
            type: 'authors'
          }
        }
      },
      type: 'posts'
    }
  };

  fakeServer.get('/posts/1', responses.post);
  fakeServer.get('/authors/1', responses.author);
  // FIXME This call shouldn't have to be made since it already exists
  fakeServer.get('/posts/1/author', responses.author);
  // FIXME Need a way to PATCH to /posts/1/links/author
  fakeServer.patch('/posts/1', request, responses.postAfterUpdateAuthor);

  Em.run(function() {
    var findPost = env.store.find('post', '1'),
      findAuthor = env.store.find('author', '1');

    findPost.then(function(post) {
      equal(post.get('title'), 'Rails is Omakase', 'title is correct');
      findAuthor.then(function(author) {
        equal(author.get('name'), 'dhh', 'author name is correct');
        post.set('title', 'TDD Is Dead lol');
        post.set('author', author);
        post.save().then(function(record) {
          equal(record.get('id'), '1', 'id is correct');
          equal(record.get('title'), 'TDD Is Dead lol', 'title is correct');
          equal(record.get('postSummary'), 'summary', 'summary is correct');
          equal(record.get('author.id'), '1', 'author ID is correct');
          equal(record.get('author.name'), 'dhh', 'author name is correct');
          start();
        });
      });
    });
  });
});
