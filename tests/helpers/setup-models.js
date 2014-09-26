var Post, Comment, Author;

function setModels(params) {
  var options;

  if (!params) {
    params = {}
  }

  options = {
    authorAsync: params.authorAsync || false,
    commentAsync: params.commentAsync || false
  }

  Post = DS.Model.extend({
    title:    DS.attr('string'),
    comments: DS.hasMany('comment',  { async: options.commentAsync }),
    author:   DS.belongsTo('author', { async: options.authorAsync })
  });

  Author = DS.Model.extend({
    name: DS.attr('string')
  });

  Comment = DS.Model.extend({
    title: DS.attr('string'),
    body:  DS.attr('string')
  });

  return {
    'post': Post,
    'author': Author,
    'comment': Comment
  }
}
