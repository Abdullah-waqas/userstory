var User = require('../models/user');
var Story = require('../models/story');
var config = require('../../config');

var secretKey = config.secretKey;

var jsonwebtoken = require('jsonwebtoken');

function createToken(user) {

  var token = jsonwebtoken.sign({
    id: user._id,
    name: user.name,
    username: user.username
  }, secretKey, {
      expiresIn: 1440
    });
  return token;
}

module.exports = function (app, express, io) {
  var api = express.Router();

  // get all stories
  api.get('/all_stories', function (req, res) {

    Story.find({}, function (err, stories) {
      // if (err) {
      //   res.send(err);
      //   return;
      // }
      if (err) return res.status(400).send({ success: false, error: err });
      res.json(stories);
    });
  });

  //signup
  api.post('/signup', function (req, res) {

    var user = new User({
      name: req.body.name,
      username: req.body.username,
      password: req.body.password
    });
    var token = createToken(user);
    user.save(function (err) {
      // if (err) {
      //   res.send(err);
      //   return;
      // }
      if (err) return res.status(400).send({ success: false, error: err });

      res.json({
        success: true,
        message: 'User has been created!',
        token: token
      });
    });
  });

  // get all users
  api.get('/users', function (req, res) {

    User.find({}, function (err, users) {
      // if (err) {
      //   res.send(err);
      //   return;
      // }
      if (err) return res.status(400).send({ success: false, error: err });

      res.json(users);

    });
  });

  // login
  api.post('/login', function (req, res) {

    User.findOne({
      username: req.body.username
    }).select('name username password').exec(function (err, user) {

      // if (err) throw err;
      if (err) return res.status(400).send({ success: false, error: err });

      if (!user) {

        res.send({ message: "User does not exist" });
      } else if (user) {

        var validPassword = user.comparePassword(req.body.password);

        if (!validPassword) {
          res.send({ message: "Invalid Password" });
        } else {

          ///// token
          var token = createToken(user);

          res.json({
            success: true,
            message: "Successfuly login!",
            token: token
          });
        }
      }
    });
  });

  // Middleware use to  check authenticated token provided or not
  api.use(function (req, res, next) {

    console.log("Somebody just came to our app!");

    var token = req.body.token || req.param('token') || req.headers['x-access-token'];

    // check if token exist
    if (token) {

      jsonwebtoken.verify(token, secretKey, function (err, decoded) {

        if (err) {
          res.status(403).send({ success: false, message: "Failed to authenticate user" });

        } else {

          //
          req.decoded = decoded;
          next();
        }
      });
    } else {
      res.status(403).send({ success: false, message: "No Token Provided" });
    }

  });



  // Destination B // provide a legitimate token

  api.route('/')
    // create new story
    .post(function (req, res) {

      var story = new Story({
        creator: req.decoded.id,
        content: req.body.content,

      });

      story.save(function (err, newStory) {
        if (err) return res.status(400).send({ success: false, error: err });

        io.emit('story', newStory)
        res.json({
          id: newStory._id,
          content: newStory.content,
          creator: newStory.creator,
          message: "New Story Created!"
        });
      });
    })

    // get all stories
    .get(function (req, res) {
      Story.find({ creator: req.decoded.id }, function (err, stories) {
        if (err) return res.status(400).send({ success: false, error: err });
        res.send(stories);
      });
    });

  api.get('/me', function (req, res) {
    res.send(req.decoded);
  });

  /* DELETE */
  api.delete('/story/:id', function (req, res) {
    Story.findByIdAndRemove({ _id: req.params.id }, function (err, post) {
      if (err) return res.status(400).send({ success: false, error: err });
      res.json(post);
    });
  });

  // update user story
  api.post('/updateStory/:id', function (req, res) {
    if (req.body.content === null || req.body.content === undefined || req.body.content === '') {
      res.status(400).send({ success: false, message: "Content is empty." });
    } else {
      Story.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { content: req.body.content } },
        { new: true },
        function (err, post) {
          if (err) {
            return res.send(err);
          }
          res.json(post);
        });
    }
  })

  return api;

}