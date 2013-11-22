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
    return sequelize.define("Greetings", {
	from_phone: {type: DataTypes.STRING, unique: false, allowNull: false},
	to_phone: {type: DataTypes.STRING, unique: false, allowNull: false},
	greeting: {type: DataTypes.STRING},
	greet_time: {type: DataTypes.STRING, allowNull: false}
    }, {
        timestamps: false,
	classMethods: {
	    numGreetings: function() {
		this.count().success(function(c) {
		    console.log("There are %s Greetings", c);});
	    },
	    allToJSON: function(successcb, errcb) {
		this.findAll()
		    .success(function(greetings) {
			successcb(uu.invoke(greetings, 'toJSON'));
		    })
		    .error(errcb);
	    },
	    addAllFromJSON: function(greetings, errcb) {
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
		async.eachLimit(greetings,
				MAX_CONCURRENT_POSTGRES_QUERIES,
				this.addFromJSON.bind(this), errcb);
	    },
	    addFromJSON: function(greet_obj, cb) {
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
		var greet = greet_obj.greet; // code json from phone_number
		if (greet.phone_number == "completed") {
		    cb();
		} else {
		    var _Greet = this;
		    _Greet.find({where: {from_phone: greet.from_phone, to_phone: greet.to_phone, greeting: greet.greeting}}).success(function(greet_instance) {
			if (greet_instance) {
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
			    var new_greet_instance = _Greet.build({
				from_phone: greet.from_phone,
				to_phone: greet.to_phone,
				greeting: greet.greeting,
				greet_time: code.greet_time
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
		    "Greetings <ID: %s From_Number :%s To_Number :%s Greeting:%s Greeting Time:%s " 
			, this.id, this.from_phone, this.to_number,
		    this.greeting, this.greet_time);
	    },
	    hasExpired: function() {
		/*
		  Illustrative only.

		  For a real app we'd want to periodically pull down and cache
		  the value from http://blockchain.info/ticker.
		*/
		return this.greet_time <= new Date();
	    }
	}
    });
};
