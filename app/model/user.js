/////////////////////////////////////////SETTING UP THE USER MODEL

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs'); // for hashing password information

////////////////////////////////////////SETTING UP THE USER SCHEMA

var UserSchema = new Schema({
	name: String,
	username: {
		type: String,
		required: true,
		index: {
			unique:true
		}
	},
	password: {
		type: String,
		required: true,
		select:false //won't pass password insecurely
	}
});

//password hashing before user is saved
UserSchema.pre('save',function(next){
	var user = this;

	//hash password only if the password has been changed or user is new
	if(!user.isModified('password')) return next();

	bcrypt.hash(user.password, null, null, function(err,hash){
		if(err) return next(err);

		//set password to hashed version
		user.password = hash;
		next();
	});
});

UserSchema.methods.comparePassword = function(password){
	var user = this;

	return bcrypt.compareSync(password, user.password);
};

//export the model
module.exports = mongoose.model('User',UserSchema);