var get = Ember.get, set = Ember.set;
var env;
var responses, fakeServer;

module('integration/specs/urls-for-resource-collections', {
  setup: function() {
    fakeServer = stubServer();

    responses = {
      posts_not_compound: {
        data: {
          type: 'posts',
          id: '1',
          title: 'Rails is Omakase',
          links: {
            comments: {
              linkage: [{
                type: 'comments',
                id: '2'
              },{
                type: 'comments',
                id: '3'
              }]
            }
          }
        }
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
      },
      underscore_resource: {
        data: {
          type: 'some_resource',
          id: '1',
          title: 'wow'
        }
      }
    };

    env = setupStore(setModels());
    env.store.modelFor('post');
    env.store.modelFor('comment');
  },

  teardown: function() {
    Ember.run(env.store, 'destroy');
    shutdownFakeServer(fakeServer);
  }
});

asyncTest('GET /posts/1 calls later GET /comments/2,3 when Posts has async comments', function() {
  var models = setModels({
    commentAsync: true
  });
  env = setupStore(models);

  fakeServer.get('/posts/1', responses.posts_not_compound);
  fakeServer.get('/comments/2', responses.comments_2);
  fakeServer.get('/comments/3', responses.comments_3);

  Em.run(function() {
    env.store.find('post', '1').then(function(record) {
      equal(record.get('id'), '1', 'id is correct');
      equal(record.get('title'), 'Rails is Omakase', 'title is correct');

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

asyncTest('GET /some_resource, not camelCase, dasherized', function() {
  var models = setModels({
    commentAsync: true
  });
  env = setupStore(models);

  fakeServer.get('/some-resources/1', responses.underscore_resource);

  Em.run(function() {
    env.store.find('someResource', '1').then(function(record) {
      equal(record.get('id'), '1', 'id is correct');
      equal(record.get('title'), 'wow', 'title is correct');
      start();
    });
  });
});
