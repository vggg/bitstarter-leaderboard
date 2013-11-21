var uu      = require('underscore')
  , db      = require('./models')
  , TWILIO  = require('./twilio')
  , fs      = require('fs')
  , Constants = require('./constants');

var build_errfn = function(errmsg, response) {
    return function errfn(err) {
	console.log(err);
	response.send(errmsg);
    };
};

/*
   Define the routes for the app, i.e. the functions
   which are executed once specific URLs are encountered.

    example.com/ -> indexfn
    example.com/orders -> orderfn
    example.com/refresh_orders -> refresh_orderfn
    example.com/api/orders -> api_orderfn

   Specifically, in each case we get an HTTP request as a JS object
   ('request') and use it along with internal server variables to synthesize
   and return an HTTP response ('response'). In our simple example none of
   the features of the request are used aside from the path itself; in a
   more complex example you might want to return different results on the
   basis of the user's IP.

   The responses are generated by accessing the "Order" table in the local
   PostgreSQL database through the Sequelize ORM (specifically through
   model/order.js) and using the resulting Order instances to either
   populate server-side templates (via response.render), to trigger a
   redirect to another URL (via response.redirect), or to directly send data
   (via response.json or response.send).

   Note that to the maximum extent possible, these handler functions do not
   do heavy work on Order instances. We save that for the classMethods and
   instanceMethods defined in model/order.js. Instead, route handlers focus
   on the networking aspects of parsing the request and response, initiating
   the query to the database, and packaging it all up in a request.
*/



var validatecodefn = function(request, response){
    console.log(request.body.phoneNo);
    console.log(request.body.code);
    response.send({ status: 'SUCCESS' });
};

var callcodefn = function(request, response){
    console.log(request.body);
    //TWILIO.callcode('5109968313');
    //console.log(request.body);
    //response.send({ status: 'SUCCESS' });
};

var dialcodeurlfn = function(request, response){
  //var buffer = new Buffer(fs.readFileSync('dialcode.xml'),'utf-8');
  //response.send(buffer.toString());
  response.sendfile('dialcode.xml');
};


var dialcodefn = function(request, response){
    console.log("----- dialcodefn --------");
    console.log(request.body);
    var t_url = "http://" + request.headers.host + "/dialcodeurl";
  
 

    // Need to generate code based on phonenumber
    // Generate Code based on phone number.
    var code = Math.floor(Math.random()*100000).toString(); 
    var expDate = new Date();
    expDate = new Date(expDate.getTime() + 1000*30); 
    // Add it to the codes database
    global.db.Codes.sync().success(function(){ console.log("Codes db Sync");}).error(function(err) {console.log(err);});
/*
Project.find({ where: {title: 'aProject'} }).on('success', function(project) {
  if (project) { // if the record exists in the db
    project.updateAttributes({
      title: 'a very different title now'
    }).success(function() {});
  }
})
*/
   global.db.Codes.find({where: {phone_number: request.body.phoneNo }}).success(function(record){
    // Update the code and exp date
    if (record) {
	record.updateAttributes( {
	   code_id: code,
           exp_time: expDate.toString()
        }).success(function() {});
    } else {

        global.db.Codes.build({phone_number: request.body.phoneNo, code_id: code, exp_time: expDate.toString()}).save().success(function() {
    	  console.log("write to Codes");	
    	  console.log(request.body.phoneNo + " " + code + " " + expDate.toString());
    	}).error(function (err) {
     	  console.log("Error Codes.build");
     	  //console.log(err);
        });
   
    }
    
   });

    //Comment the folln line during dev to stop making call to deliver code.
    TWILIO.callcode(request.body.phoneNo, t_url);
    //console.log(request.body);
    //response.send({ status: 'SUCCESS' });
    response.render("dialcode", {
        name: Constants.APP_NAME,
        title: "" + Constants.APP_NAME,
        product_name: Constants.PRODUCT_NAME,
        twitter_username: Constants.TWITTER_USERNAME,
        twitter_tweet: Constants.TWITTER_TWEET,
        product_short_description: Constants.PRODUCT_SHORT_DESCRIPTION,
        coinbase_preorder_data_code: Constants.COINBASE_PREORDER_DATA_CODE,
        try_me_data_code: Constants.TRY_ME_DATA_CODE,
        frameTitle: "Verify Code",
        phoneNo: request.body.phoneNo,
        codeid: code
    });
};


var greetingfn = function(request, response){
    console.log("-------greetingfn:------");
    console.log(request.body);
    // Get Code from db and verify it
    var code_from_db = "x";
    global.db.Codes.find({where: {phone_number: request.body.phoneNo }}).success(function(record) 
    {
        if (record) {
           code_from_db = record.code_id;
           console.log("got code from db " + code_from_db);


   console.log("Code from request == Code from db? " + request.body.code + " == " + code_from_db);
    if (request.body.code.toString() == code_from_db) {
    response.render("greeting", {
        name: Constants.APP_NAME,
        title: "" + Constants.APP_NAME,
        product_name: Constants.PRODUCT_NAME,
        twitter_username: Constants.TWITTER_USERNAME,
        twitter_tweet: Constants.TWITTER_TWEET,
        product_short_description: Constants.PRODUCT_SHORT_DESCRIPTION,
        coinbase_preorder_data_code: Constants.COINBASE_PREORDER_DATA_CODE,
        try_me_data_code: Constants.TRY_ME_DATA_CODE,
        phoneNo: request.body.phoneNo
    });
    } else { response.redirect("/tryme?failcode=true"); }  

        }
        else {
           console.log("find record failed");
          
        }
        //console.log(record)
    });
/*
    //response.send({ status: 'SUCCESS' });
   console.log("Code from request == Code from db? " + request.body.code + " == " + code_from_db);
    if (request.body.code.toString() == code_from_db) {
    response.render("greeting", {
        name: Constants.APP_NAME,
        title: "" + Constants.APP_NAME,
        product_name: Constants.PRODUCT_NAME,
        twitter_username: Constants.TWITTER_USERNAME,
        twitter_tweet: Constants.TWITTER_TWEET,
        product_short_description: Constants.PRODUCT_SHORT_DESCRIPTION,
        coinbase_preorder_data_code: Constants.COINBASE_PREORDER_DATA_CODE,
        try_me_data_code: Constants.TRY_ME_DATA_CODE,
        phoneNo: request.body.phoneNo
    });
    } else { response.redirect("/tryme?failcode=true"); }
*/
};

var greetemfn = function(request, response){
    console.log("-------greetemfn:------");
    console.log(request.body);
    console.log(request.body.phoneNo);
    console.log(request.body.toPhoneNo);
    console.log(request.body.greettext);
     var t_url = "http://" + request.headers.host + "/greetcodeurl";
    console.log("Twilio Url" + t_url);
    //Comment off the following line in dev env to stop making calls
    TWILIO.callcode(request.body.toPhoneNo, t_url);
    response.render("greetem", {
        name: Constants.APP_NAME,
        title: "" + Constants.APP_NAME,
        product_name: Constants.PRODUCT_NAME,
        twitter_username: Constants.TWITTER_USERNAME,
        twitter_tweet: Constants.TWITTER_TWEET,
        product_short_description: Constants.PRODUCT_SHORT_DESCRIPTION,
        coinbase_preorder_data_code: Constants.COINBASE_PREORDER_DATA_CODE,
        try_me_data_code: Constants.TRY_ME_DATA_CODE,
        phoneNo: request.body.phoneNo
    });
};

var greetcodeurlfn = function(request, response){
  //var buffer = new Buffer(fs.readFileSync('dialcode.xml'),'utf-8');
  //response.send(buffer.toString());
  response.sendfile('greetcode.xml');
};

/*
   Helper functions which create a ROUTES array for export and use by web.js

   Each element in the ROUTES array has two fields: path and fn,
   corresponding to the relative path (the resource asked for by the HTTP
   request) and the function executed when that resource is requested.

     [ { path: '/', fn: [Function] },
       { path: '/orders', fn: [Function] },
       { path: '/api/orders', fn: [Function] },
       { path: '/refresh_orders', fn: [Function] } ]

   It is certainly possible to implement define_routes with a simple for
   loop, but we use a few underscore methods (object, zip, map, pairs), just
   to familiarize you with the use of functional programming, which
   becomes more necessary when dealing with async programming.
*/
var define_routes = function(dict) {
    var toroute = function(item) {
	return uu.object(uu.zip(['path', 'fn'], [item[0], item[1]]));
    };
    return uu.map(uu.pairs(dict), toroute);
};

var POST_ROUTES = define_routes({
    '/validatecode': validatecodefn,
    '/dialcode': dialcodefn,
    '/dialcodeurl': dialcodeurlfn,
    '/greeting': greetingfn,
    '/greetem': greetemfn,
    '/callcode': callcodefn,
    '/greetcodeurl': greetcodeurlfn
});

module.exports = POST_ROUTES;
