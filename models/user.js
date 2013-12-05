/*
   Object/Relational mapping for instances of the Order class.

    - classes correspond to tables
    - instances correspond to rows
    - fields correspond to columns

   In other words, this code defines how a row in the PostgreSQL "Order"
   table maps to the JS Order object. Note that we've omitted a fair bit of
   error handling from the classMethods and instanceMethods for simplicity.
*/
var async = require('async');
var util = require('util');
var uu = require('underscore');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define("Users", {
	firstname: {type: DataTypes.STRING, unique: false, allowNull: false},
	lastname: {type: DataTypes.STRING, unique: false, allowNull: false},
	email: {type: DataTypes.STRING, unique: true,allowNull: false},
	phonenumber: {type: DataTypes.STRING, unique: true,allowNull: false},
	pin: {type: DataTypes.STRING, unique: false,allowNull: false},
	email_verified: {type: DataTypes.BOOLEAN, unique: false,allowNull: false},
	pin_verified: {type: DataTypes.BOOLEAN, unique: false,allowNull: false},
	password: {type: DataTypes.STRING, allowNull: false}
    }, {
        timestamps: false,
	classMethods: {
	    numUsers: function() {
		this.count().success(function(c) {
		    console.log("There are %s Users", c);});
	    },
	    allToJSON: function(successcb, errcb) {
		this.findAll()
		    .success(function(users) {
			successcb(uu.invoke(users, 'toJSON'));
		    })
		    .error(errcb);
	    },
	    addAllFromJSON: function(users, errcb) {
		/*
		  This method is implemented naively and can be slow if
		  you have many orders.

		  The ideal solution would first determine in bulk which of the
		  potentially new orders in order_json is actually new (and not
		  stored in the database). One way to do this is via the NOT IN
		  operator, which calculates a set difference:
		  http://www.postgresql.org/docs/9.1/static/functions-comparisons.html
		  This should work for even a large set of orders in the NOT IN
		  clause (http://stackoverflow.com/a/3407914) but you may need
		  to profile the query further.

		  Once you have the list of new orders (i.e. orders which are
		  in Coinbase but not locally stored in the database), then
		  you'd want to launch several concurrent addFromJSON calls
		  using async.eachLimit
		  (https://github.com/caolan/async#eachLimit). The exact value
		  of the limit is how many concurrent reads and writes your
		  Postgres installation can handle. This is outside the scope
		  of the class and depends on your Postgres database settings,
		  the tuning of your EC2 instance, and other parameters. For a
		  t1.micro, we just set this to 1 to prevent the system from
		  hanging.
		*/
		var MAX_CONCURRENT_POSTGRES_QUERIES = 1;
		async.eachLimit(users,
				MAX_CONCURRENT_POSTGRES_QUERIES,
				this.addFromJSON.bind(this), errcb);
	    },
	    addFromJSON: function(user_obj, cb) {
		/*
		  Add from JSON only if order has not already been added to
		  our database.

		  Note the tricky use of var _Order. We use this to pass in
		  the Order class to the success callback, as 'this' within
		  the scope of the callback is redefined to not be the Order
		  class but rather an individual Order instance.

		  Put another way: within this classmethod, 'this' is
		  'Order'. But within the callback of Order.find, 'this'
		  corresponds to the individual instance. We could also
		  do something where we accessed the class to which an instance
		  belongs, but this method is a bit more clear.
		*/
		var user = user_obj.user; // code json from phone_number
		if (user.phonenumber == "completed") {
		    cb();
		} else {
		    var _User = this;
		    _User.find({where: {phonenumber: user.phonenumber, email: user.email}}).success(function(user_instance) {
			if (user_instance) {
			    // order already exists, do nothing
			    cb();
			} else {
			    /*
			       Build instance and save.

			       Uses the _Code from the enclosing scope,
			       as 'this' within the callback refers to the current
			       found instance.

			       Note also that for the amount, we convert
			       satoshis (the smallest Bitcoin denomination,
			       corresponding to 1e-8 BTC, aka 'Bitcents') to
			       BTC.
			    */
			    var new_user_instance = _User.build({
				firstname: user.firstname,
				lastname: user.lastname,
				phonenumber: user.phonenumber,
				email: user.email,
				pin: user.pin,
				email_verified: "false",
				pin_verified: "false",
				password: user.password
			    });
			    new_greet_instance.save().success(function() {
				cb();
			    }).error(function(err) {
				cb(err);
			    });
			}
		    });
		}
	    }
	},
	instanceMethods: {
	    repr: function() {
		return util.format(
		    "Users <ID: %s First Name :%s Last Name :%s Email :%s  Password: %s Phone Number :%s Pin: %s Email Verified :%s Pin Verified : %s" 
			, this.id, this.firstname, this.lastname,
		    this.email, this.password, this.phonenumber, this.pin, this.email_verified, this.pin_verified);
	    },
	    pinVerified: function() {
		return this.pin_verified;
	    },
	    emailVerified: function() {
		return this.email_verified;
	    }
	}
    });
};
