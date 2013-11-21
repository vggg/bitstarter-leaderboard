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
    return sequelize.define("Codes", {
	phone_number: {type: DataTypes.STRING, unique: true, allowNull: false},
	code_id: {type: DataTypes.STRING},
	exp_time: {type: DataTypes.STRING, allowNull: false}
    }, {
        timestamps: false,
	classMethods: {
	    numCodes: function() {
		this.count().success(function(c) {
		    console.log("There are %s Codes", c);});
	    },
	    allToJSON: function(successcb, errcb) {
		this.findAll()
		    .success(function(codes) {
			successcb(uu.invoke(codes, 'toJSON'));
		    })
		    .error(errcb);
	    },
	    addAllFromJSON: function(codes, errcb) {
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
		async.eachLimit(codes,
				MAX_CONCURRENT_POSTGRES_QUERIES,
				this.addFromJSON.bind(this), errcb);
	    },
	    addFromJSON: function(code_obj, cb) {
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
		var code = code_obj.code; // code json from phone_number
		if (code.phone_number == "completed") {
		    cb();
		} else {
		    var _Code = this;
		    _Code.find({where: {phone_number: code.phone_number}}).success(function(code_instance) {
			if (code_instance) {
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
			    var new_code_instance = _Code.build({
				phone_number: code.phone_number,
				code_id: code.code_id,
				exp_time: code.exp_time
			    });
			    new_order_instance.save().success(function() {
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
		    "Codes <ID: %s Phone_Number :%s Code:%s Expiration Time:%s " 
			, this.id, this.phone_number,
		    this.code_id, this.exp_time);
	    },
	    hasExpired: function() {
		/*
		  Illustrative only.

		  For a real app we'd want to periodically pull down and cache
		  the value from http://blockchain.info/ticker.
		*/
		return this.exp_time <= new Date().getTime();
	    }
	}
    });
};
