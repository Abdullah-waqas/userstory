var underscore = angular.module('underscore', []);
underscore.factory('_', function () {
  return window._; //Underscore should be loaded on the page
});

angular.module('storyCtrl', ['storyService', 'underscore'])
  .controller('StoryController', function (Story, socketio, _) {

    var vm = this;
    Story.all()
      .success(function (data) {
        vm.stories = data;

        var newArr = _.map(vm.stories, function (element) {
          return _.extend({}, element, { isEdit: false });
        });
      });

    vm.editStory = function (e) {
      var id = e.each._id;
      _.map(vm.stories, function (obj) {
        if (obj._id == id) {
          obj.isEdit = true;
        } else {
          obj.isEdit = false;
        }
      });
    }
    vm.cancelEditStory = function (e) {
      _.map(vm.stories, function (obj) {
          obj.isEdit = false;
      });
    }

    vm.saveEditStory = function (e) {
      var id = e.each._id;
      Story.editStory(id, { "content": vm.editStoryData })
        .then(function (data) {
          _.map(vm.stories, function (obj) {
            if (obj._id == id) {
              obj.isEdit = false;
              obj.content = data.content;
            }
          });
        }).catch(function (err) {
          console.log(err)
        })
    }

    vm.deleteStory = function (e) {
      Story.removeStory(e.each._id)
        .success(function (data) {
          var myArray = vm.stories.filter(function (obj) {
            return obj._id !== data._id;
          });
          vm.stories = myArray
        })
    };

    vm.createStory = function () {
      vm.processing = true;
      vm.message = '';
      Story.create(vm.storyData)
        .success(function (data) {
          vm.processing = false;
          //clear up the form
          vm.storyData = {};
          vm.message = data.message;
        });
    };

    socketio.on('story', function (data) {
      vm.stories.push(data);
    })

  })

  .controller('AllStoriesController', function (stories, socketio) {
    var vm = this;
    vm.stories = stories.data;
    socketio.on('story', function (data) {
      vm.stories.push(data);
    });
  });