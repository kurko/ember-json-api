var stubResponse = function(verb, url, response) {
  return new Pretender(function(){
    this[verb](url, function(request){
      var string = JSON.stringify(response);
      return [200, {"Content-Type": "application/json"}, string]
    });
  });
}

var shutdownPretender = function() {
  pretender.shutdown();
  pretender = null;
}
