var stubServer = function() {
  var pretender = new Pretender();

  pretender.unhandledRequest = function(verb, path, request) {
    var string = "Pretender: non-existing "+verb+" "+path, request
    console.error(string);
    throw(string);
  };

  return {
    pretender: pretender,

    get: function(url, response) {
      this.validateResponse(response, 'GET', url);
      this.pretender.get(url, function(request){
        var string = JSON.stringify(response);
        return [200, {"Content-Type": "application/json"}, string]
      });
    },

    validateResponse: function(response, verb, url) {
      if (!response) {
        console.warn("No Response defined for "+verb+" "+url);
        throw("No response defined for "+verb+" "+url);
      }
    }
  };
}

var shutdownFakeServer = function(fakeServer) {
  fakeServer.pretender.shutdown();
}
