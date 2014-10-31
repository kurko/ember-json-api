var get = Ember.get, set = Ember.set;
var Post, Comment, Author, env, store;
var responses, fakeServer;

module('integration/specs/link-with-type', {
  setup: function() {
    fakeServer = stubServer();

    responses = {
      post: {
        post: {
          id: '1',
          title: 'Rails is Omakase',
          links: {
            observations: {
              ids: ['2', '3'],
              type: 'comment'
            },
            writer: {
              id: '1',
              type: 'author'
            }
          }
        }
      },
      comments_2: {
        comments: {
          id: 2,
          title: 'good article'
        }
      },
      comments_3: {
        comments: {
          id: 3,
          title: 'bad article'
        }
      },
      author: {
        author: {
          id: 1,
          name: 'Tomster'
        }
      }
    };

    Post = DS.Model.extend({
      title: DS.attr('string'),
      observations: DS.hasMany('comment',  {async: true}),
      writer: DS.belongsTo('author', {async: true})
    });

    Comment = DS.Model.extend({
      title: DS.attr('string'),
      post: DS.belongsTo('post')
    });

    Author = DS.Model.extend({
      name: DS.attr('string'),
      post: DS.belongsTo('post')
    });

    env = setupStore({
      post: Post,
      comment: Comment,
      author: Author
    });

    store = env.store;

    store.modelFor('post');
    store.modelFor('comment');
  },

  teardown: function() {
    Ember.run(store, 'destroy');
    shutdownFakeServer(fakeServer);
  }
});

asyncTest("GET /posts/1 with array of unmatched named relationship", function() {
  fakeServer.get('/posts/1', responses.post);
  fakeServer.get('/comments/2', responses.comments_2);
  fakeServer.get('/comments/3', responses.comments_3);

  Em.run(function() {
    store.find('post', 1).then(function(record) {
      equal(record.get('id'), '1', 'id is correct');
      equal(record.get('title'), 'Rails is Omakase', 'title is correct');
      record.get('observations').then(function(comments) {
        var comment1 = comments.objectAt(0);
        var comment2 = comments.objectAt(1);

        equal(comments.get('length'), 2, 'there are 2 comments');

        equal(comment1.get('title'), 'good article', 'comment1 title');
        equal(comment2.get('title'), 'bad article', 'comment2 title');
        start();
      });
    });
  });
});

asyncTest("GET /posts/1 with single unmatched named relationship", function() {
  fakeServer.get('/posts/1', responses.post);
  fakeServer.get('/authors/1', responses.author);

  Em.run(function() {
    store.find('post', 1).then(function(record) {
      equal(record.get('id'), '1', 'id is correct');
      equal(record.get('title'), 'Rails is Omakase', 'title is correct');
      record.get('writer').then(function(writer) {
        equal(writer.get('name'), 'Tomster', 'author name');
        start();
      });
    });
  });
});
