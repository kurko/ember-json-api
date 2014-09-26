var stubServer = function() {
  var pretender = new Pretender();

  pretender.unhandledRequest = function(verb, path, request) {
    var string = "Pretender: non-existing "+verb+" "+path, request
    console.error(string);
    throw(string);
  };

  return {
    pretender: pretender,

    availableRequests: {
      'post': [],
      'put': []
    },

    get: function(url, response) {
      this.validatePayload(response, 'GET', url);

      this.pretender.get(url, function(request){
        var string = JSON.stringify(response);
        return [200, {"Content-Type": "application/json"}, string]
      });
    },

    post: function(url, expectedRequest, response) {
      var _this = this;

      this.validatePayload(expectedRequest, 'POST', url);
      this.validatePayload(response, 'POST', url);

      this.availableRequests.post.push({
        request: expectedRequest,
        response: response
      });

      this.pretender.post(url, function(request){
        var responseForRequest = _this.responseForRequest('post', request);

        var string = JSON.stringify(responseForRequest);
        console.log(string);
        return [201, {"Content-Type": "application/json"}, string]
      });
    },

    /**
     * We have a set of expected requests. Each one returns a particular
     * response. Here, we check that what's being requests exists in
     * `this.availableRequests` and then return it.
     *
     * If it doesn't exist, we throw errors (and rocks).
     */
    responseForRequest: function(verb, currentRequest) {
      var respectiveResponse;
      var availableRequests = this.availableRequests[verb];

      currentRequest = currentRequest.requestBody;

      for (requests in availableRequests) {
        if (!availableRequests.hasOwnProperty(requests))
          continue;

        var actualRequest = JSON.stringify(JSON.parse(currentRequest));
        var request = JSON.stringify(availableRequests[requests].request);
        var response = JSON.stringify(availableRequests[requests].response);

        if (actualRequest === request) {
          respectiveResponse = availableRequests[requests].response;
          break;
        }
      }

      if (respectiveResponse) {
        return respectiveResponse;
      } else {
        var error = "No "+verb+" request defined for request";
        console.error(error, currentRequest);

        if (availableRequests.length) {
          console.log("Current defined requests:");
          for (requests in availableRequests) {
            if (!availableRequests.hasOwnProperty(requests))
              continue;

            console.log(JSON.stringify(availableRequests[requests].request));
          }
        }

        throw(error);
      }
    },

    validatePayload: function(response, verb, url) {
      if (!response) {
        var string = "No request or response defined for "+verb+" "+url;
        console.warn(string);
        throw(string);
      }
    }
  };
}

var shutdownFakeServer = function(fakeServer) {
  fakeServer.pretender.shutdown();
}
