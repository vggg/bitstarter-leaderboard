//require the Twilio module and create a REST client
//var ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
//var AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
var ACCOUNT_SID = 'AC30fb989c30065e231a94d816bd6178d6';
var AUTH_TOKEN = 'a821d934bd1de0f906cb8d6fa6a2307f';
var client = require('twilio')(ACCOUNT_SID, AUTH_TOKEN);
/*
//Send an SMS text message
client.sendMessage({

    to:'+16515556677', // Any number Twilio can deliver to
    from: '+14506667788', // A number you bought from Twilio and can use for outbound communication
    body: 'word to your mother.' // body of the SMS message

}, function(err, responseData) { //this function is executed when a response is received from Twilio

    if (!err) { // "err" is an error received during the request, if any

        // "responseData" is a JavaScript object containing data received from Twilio.
        // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
        // http://www.twilio.com/docs/api/rest/sending-sms#example-1

        console.log(responseData.from); // outputs "+14506667788"
        console.log(responseData.body); // outputs "word to your mother."

    }
});*/
//    url: 'http://www.example.com/twiml.php' // A URL that produces an XML document (TwiML) which contains instructions for the call
//Place a phone call, and respond with TwiML instructions from the given URL
/*
var phoneNo='+15109968313';
var twilioUrl='http://ec2-54-201-70-148.us-west-2.compute.amazonaws.com:8080/dialcodeurl';
    console.log(phoneNo);
    console.log(twilioUrl);
client.makeCall({

    to: phoneNo, // Any number Twilio can call
    from: '+15102300080', // A number you bought from Twilio and can use for outbound communication
    url: twilioUrl

}, function(err, responseData) {

    //executed when the call has been initiated.
    console.log(responseData.from); // outputs "+14506667788"

});

//*/

module.exports = {
  callcode: function (phoneNo, twilioUrl) {
   //---
    //Place a phone call, and respond with TwiML instructions from the given URL
    console.log(phoneNo);
    console.log(twilioUrl);
    client.makeCall({

        to: phoneNo, // Any number Twilio can call
        from: '+15102300080', // A number you bought from Twilio and can use for outbound communication
        url: twilioUrl

    }, function(err, responseData) {
    //executed when the call has been initiated.
        console.log(responseData.from); // outputs "+14506667788"
   });


  //-- 
  },
  greet: function () {
    // whatever
  }
};

