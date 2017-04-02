angular.module('storyService', [])


  .factory('Story', function ($http, $q) {


    var storyFactory = {};

    storyFactory.allStories = function () {
      return $http.get('/api/all_stories');
    }

    storyFactory.all = function () {
      return $http.get('/api/');
    }
    // create new story
    storyFactory.create = function (storyData) {
      return $http.post('/api/', storyData);
    }
    // remove story
    storyFactory.removeStory = function (id) {
      return $http.delete('api/story/' + id);
    }
    // edit story
    storyFactory.editStory = function (id, editedData) {
      return $http.post('api/updateStory/' + id, editedData)
        .then(function (response) {
          if (typeof response.data === 'object') {
            return response.data;
          } else {
            // invalid response
            return $q.reject(response.data);
          }

        }, function (response) {
          // something went wrong
          return $q.reject(response.data);
        });
    }

    return storyFactory;


  })

  .factory('socketio', function ($rootScope) {

    var socket = io.connect();
    return {

      on: function (eventName, callback) {
        socket.on(eventName, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            callback.apply(socket, args);
          });

        });
      },

      emit: function (eventName, data, callback) {
        socket.emit(eventName, data, function () {
          var args = arguments;
          $rootScope.apply(function () {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        });
      }

    };

  });