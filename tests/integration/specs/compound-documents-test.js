var get = Ember.get, set = Ember.set;
var env;
var responses, fakeServer;

module('integration/specs/compound-documents', {
  setup: function() {
    fakeServer = stubServer();

    responses = {
      posts_compound_document: {
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
            },
            author: {
              linkage: {
                type: 'authors',
                id: '4'
              }
            }
          }
        },
        included: [{
          type: 'comments',
          id: '2',
          title: 'good article',
          body: 'ideal for my startup'
        }, {
          type: 'comments',
          id: '3',
          title: 'bad article',
          body: "doesn't run Crysis"
        }, {
          type: 'authors',
          id: '4',
          name: 'dhh'
        }]
      },
      posts_nested_compound_document: {
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
            },
            author: {
              linkage: {
                type: 'authors',
                  id: '4'
              }
            }
          }
        },
        included: [{
          type: 'comments',
          id: '2',
          title: 'good article',
          body: 'ideal for my startup',
          links: {
            writer: {
              linkage: {
                id: 5,
                type: 'authors'
              }
            }
          }
        }, {
          type: 'comments',
          id: '3',
          title: 'bad article',
          body: "doesn't run Crysis",
          links: {
            writer: {
              linkage: {
                id: 4,
                type: 'authors'
              }
            }
          }
        }, {
          type: 'authors',
          id: '4',
          name: 'dhh'
        }, {
          type: 'authors',
          id: '5',
          name: 'ado'
        }]
      }
    };

  },

  teardown: function() {
    Ember.run(env.store, 'destroy');
    shutdownFakeServer(fakeServer);
  }
});

function setupCompoundModels(async) {
  var models = setModels({
    commentAsync: async,
    authorAsync: async
  });
  env = setupStore(models);
  env.store.modelFor('post');
  env.store.modelFor('comment');
  env.store.modelFor('author');
}

function setupNestedCompoundModels(async) {
  var Post, Comment, Author;
  Post = DS.Model.extend({
    title:    DS.attr('string'),
    postSummary: DS.attr('string'),
    comments: DS.hasMany('comment',  { async: async }),
    author:   DS.belongsTo('author', { async: async })
  });

  Author = DS.Model.extend({
    name: DS.attr('string')
  });

  Comment = DS.Model.extend({
    title: DS.attr('string'),
    body:  DS.attr('string'),
    writer: DS.belongsTo('author', { async: async })
  });

  env = setupStore({
    post: Post,
    comment: Comment,
    author: Author
  });

  env.store.modelFor('post');
  env.store.modelFor('comment');
  env.store.modelFor('author');
}

asyncTest('Post with sync comments uses included resources', function() {
  setupCompoundModels(false);

  fakeServer.get('/posts/1', responses.posts_compound_document);

  Em.run(function() {
    env.store.find('post', '1').then(function(record) {
      equal(record.get('id'), '1', 'id is correct');
      equal(record.get('title'), 'Rails is Omakase', 'title is correct');

      var comments = record.get('comments');
      var author   = record.get('author');
      var comment1 = comments.objectAt(0);
      var comment2 = comments.objectAt(1);

      equal(comments.get('length'), 2, 'there are 2 comments');

      equal(comment1.get('title'), 'good article', 'comment1 title');
      equal(comment1.get('body'), 'ideal for my startup', 'comment1 body');
      equal(comment2.get('title'), 'bad article', 'comment2 title');
      equal(comment2.get('body'), "doesn't run Crysis", 'comment2 body');
      equal(author.get('id'), '4', 'author id');
      equal(author.get('name'), 'dhh', 'author name');
      start();
    });
  });
});

asyncTest('Post with async comments uses included resources', function() {
  setupCompoundModels(true);

  fakeServer.get('/posts/1', responses.posts_compound_document);

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
        return record.get('author')
      }).then(function(author) {
        equal(author.get('id'), '4', 'author id');
        equal(author.get('name'), 'dhh', 'author name');
        start();
      });
    });
  });
});

asyncTest('Post with sync comments uses included resources and nested included resource', function() {
  setupNestedCompoundModels(false);

  fakeServer.get('/posts/1', responses.posts_nested_compound_document);

  Em.run(function() {
    env.store.find('post', '1').then(function(record) {
      equal(record.get('id'), '1', 'id is correct');
      equal(record.get('title'), 'Rails is Omakase', 'title is correct');

      var comments = record.get('comments');
      var author   = record.get('author');
      var comment1 = comments.objectAt(0);
      var comment2 = comments.objectAt(1);
      var writer1 = comment1.get('writer');
      var writer2 = comment2.get('writer');

      equal(comments.get('length'), 2, 'there are 2 comments');

      equal(comment1.get('title'), 'good article', 'comment1 title');
      equal(comment1.get('body'), 'ideal for my startup', 'comment1 body');
      equal(comment2.get('title'), 'bad article', 'comment2 title');
      equal(comment2.get('body'), "doesn't run Crysis", 'comment2 body');
      equal(author.get('id'), '4', 'author id');
      equal(author.get('name'), 'dhh', 'author name');
      equal(writer1.get('id'), '5', 'writer1 id');
      equal(writer1.get('name'), 'ado', 'writer1 name');
      equal(writer2.get('id'), '4', 'writer2 id');
      equal(writer2.get('name'), 'dhh', 'writer2 name');
      start();
    });
  });
});

asyncTest('Post with async comments uses included resources and nested included resource', function() {
  setupNestedCompoundModels(true);

  fakeServer.get('/posts/1', responses.posts_nested_compound_document);

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

        return comment1.get('writer')
      }).then(function(author) {
        equal(author.get('id'), '5', 'author id');
        equal(author.get('name'), 'ado', 'author name');
        start();
      });
    });
  });
});
