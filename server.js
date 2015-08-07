//SETTING UP EXPRESS APPLICATION

var express 		= require('express'),
	app 			= express(),
	bodyParser 		= require('body-parser'),
	morgan 			= require('morgan'),
	mongoose 		= require('mongoose'),
	port 			= process.env.PORT || 8080,
	User 			= require('./app/model/user'),
	jwt				= require('jsonwebtoken');

/////////////////////////DATABASE CONFIGURATION

mongoose.connect('mongodb://localhost:27017/userdb');

//secret handling

var superSecret = 'theroadlesstravelled';

////////////////////////APPLICATION CONFIGURATION

//use body parser so we can get info form post requests
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

//configure CORS request 
app.use(function(req,res,next){
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, \
		Authorization');
	next();

});

//log all requests to the console
app.use(morgan('dev'));

/////////////////////////////ROUTES FOR API

//basic routes
app.get('/',function(req,res){
	res.send('Welcome to the home page');
});

//router for API
var apiRouter = express.Router();

apiRouter.post('/authenticate',function(req,res){
	User.findOne({
		username: req.body.username
	}).select('name username password').exec(function(err,user){
		if(err)
			throw err;

		if(!user){
			res.json({
				success:false,
				message:"Authenication failed, User not found"
			});
		} else if(user){
			var validPassword = user.comparePassword(req.body.password);

			if(!validPassword){
				res.json({
					success: false,
					message: "Authenication failed, Wrong Password"
				});
			} else {
				//if the user is successfully authenticated: found and correct password

				var token = jwt.sign({
					name: user.name,
					username: user.username
				}, superSecret, {
					expiresInMinutes: 1440
				});

				res.json({
					success:true,
					message: "Authenication Successful",
					token: token
				});
			}
		}
	})
});

//apiRouter MiddleWare
apiRouter.use(function(req ,res, next){//this middleware will be used to authenticate users
	
	//verify token on each request
	var token = req.body.token || req.query.token || req.headers['x-access-token'];

	if(token){
		jwt.verify(token,superSecret,function(err, decoded){
			if(err){
				return res.status(403).send({
					sucess:false,
					message: 'Failed to Authenticate Token'
				});					
			} else {
				//successful token

				req.decoded = decoded;

				next();
			}

		});
	} else{
		//if token doesn't exist

		return res.status(403).send({
			success: false,
			message: 'No Token found'
		});
	}
});

//test api route at GET http://localhost:8080/api
apiRouter.get('/',function(req,res){
	res.json({
		message: 'Welcome to this test api'
	});
});

//routes that end in /users
apiRouter.route('/users')//for dealing with groups of users

		.post(function(req,res){//for creating new users!
			var user = new User();

			//set the user information 

			user.name = req.body.name;
			user.username = req.body.username;
			user.password = req.body.password;


			//save the user and error checking
			user.save(function(err){
				if(err){
					if(err.code == 11000)//checks to see if username is unique
						return res.json({success:false,message: 'Oops! a user with that username already exists!'})
					else
						return res.send(err);
				}

				res.json({message: 'User Created!'});
			});
		})
		.get(function(req, res){//for getting all users
			User.find(function(err, users){
				if(err)
					res.send(err);

				res.json(users);
			});
		});

apiRouter.route('/users/:user_id')//for dealing with single users
		
		.get(function(req, res){//get single user
			User.findById(req.params.user_id, function(err, user){
				if(err)
					res.send(err);

				res.json(user);
			});
		})

		.delete(function(req, res){
 			User.remove({
 				_id: req.params.user_id
 			}, function(err, user){
 				if(err)
 					return res.send(err);

 				res.json({message: 'User deleted!'});
 			});
 		})

 		.put(function(req, res){

 			User.findById(req.params.user_id, function(err, user){
 				if(err)
 					res.send(err);

 				if(req.body.name)
 					user.name = req.body.name;

 				if(req.body.username)
 					user.username = req.body.username;

 				if(req.body.password)
 					user.password = req.body.password;

 				user.save(function(err){
 					if(err)
 						res.send(err);

 					res.json({message: "Success!"});
 				});
 			});

 			// res.json({message: "PUT Test"});
 		});

apiRouter.get('/me',function(req,res){
	res.send(req.decoded);
});





/////////////////////////////REGISTER ROUTES

app.use('/api',apiRouter);

////////////////////////////START SERVER

app.listen(port);

console.log('Server running on port ' + port);