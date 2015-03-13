var get = Ember.get, set = Ember.set;
var env;
var responses, fakeServer;

module('integration/specs/namespace', {
  setup: function() {
    fakeServer = stubServer();

    responses = {
      posts_id: {
        data: {
          type: 'posts',
          id: '1',
          title: 'Rails is Omakase',
          links: {
            author: {
              type: 'authors',
              id: '2'
            },
            comments: {
              type: 'comments',
              id: ['2', '3']
            }
          }
        }
      },
      posts_related: {
        data: {
          type: 'posts',
          id: '1',
          title: 'Rails is Omakase',
          links: {
            author: {
              related: '/api/posts/1/author',
              type: 'authors',
              id: '2'
            },
            comments: {
              related: '/api/posts/1/comments',
              type: 'comments'
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
      comments: {
        data: [{
          type: 'comments',
          'id': '2',
          'title': 'good article',
          'body': 'ideal for my startup'
        }, {
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
  fakeServer.get('/api/posts/1', responses.posts_id);
  fakeServer.get('/api/authors/2', responses.author);
  fakeServer.get('/api/comments/2', responses.comments_2);
  fakeServer.get('/api/comments/3', responses.comments_3);
  testPost();
});

asyncTest('GET /api/posts/1 calls with related URLs', function() {
  fakeServer.get('/api/posts/1', responses.posts_related);
  fakeServer.get('/api/posts/1/author', responses.author);
  fakeServer.get('/api/posts/1/comments', responses.comments);
  testPost();
});

function testPost() {
  Em.run(function() {
    env.store.find('post', '1').then(function(record) {
      equal(record.get('id'), '1', 'id is correct');
      equal(record.get('title'), 'Rails is Omakase', 'title is correct');

      record.get('author').then(function(author) {
        equal(author.get('id'), '2', 'author id is correct');
        equal(author.get('name'), 'dhh', 'author name is correct');

        record.get('comments').then(function(comments) {
          var comment1 = comments.objectAt(0);
          var comment2 = comments.objectAt(1);

          equal(comments.get('length'), 2, 'there are 2 comments');

          equal(comment1.get('title'), 'good article', 'comment1 title');
          equal(comment1.get('body'), 'ideal for my startup', 'comment1 body');

          equal(comment2.get('title'), 'bad article', 'comment2 title');
          equal(comment2.get('body'), "doesn't run Crysis", 'comment2 body');
          start();
        });
      });
    });
  });
}