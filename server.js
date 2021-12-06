/**
 * This is the main server script that provides the API endpoints
 * The script uses the database helper in /src
 * The endpoints retrieve, update, and return data to the page handlebars files
 *
 * The API returns the front-end UI handlebars pages, or
 * Raw json if the client requests it with a query parameter ?raw=json
 */

// SETTINGS ///////////////////////////////////////////////////////////////////////////////////////////
let devMode = false;


// SETUP //////////////////////////////////////////////////////////////////////////////////////////////
// Utilities we need
const fs = require("fs");
const path = require("path");

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
  // Set this to true for detailed logging:
  logger: false
});

// Setup our static files
fastify.register(require("fastify-static"), {
  root: path.join(__dirname, "public"),
  prefix: "/" // optional: default '/'
});

// fastify-formbody lets us parse incoming forms
fastify.register(require("fastify-formbody"));

// point-of-view is a templating manager for fastify
fastify.register(require("point-of-view"), {
  engine: {
    handlebars: require("handlebars")
  }
});

// Load and parse SEO data
const seo = require("./src/seo.json");
if (seo.url === "glitch-default") {
  seo.url = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
}

// We use a module for handling database operations in /src
const data = require("./src/data.json");
const db = require("./src/" + data.database);

// Twilio shit
const accountSid = "ACd039cc3f75763b1d7220e574177bc3ad";
const authToken = "2632d6a25088b5ab1346942105f2d7c8";
const client = require('twilio')(accountSid, authToken);

// FUNCTIONS ///////////////////////////////////////////////////////////////////////////////////////////
const MIN_PER_MONTH = 43200;
const MIN_PER_DAY   = 1440;
const MIN_PER_HOUR  = 60;

function timeStampToMinutes(timeStamp) {
  const timeValues = timeStamp.split(':');
  var minuteValue = 0;
  
  minuteValue += parseInt(timeValues[0]-1)*MIN_PER_MONTH;
  minuteValue += parseInt(timeValues[1]-1)*MIN_PER_DAY;
  minuteValue += parseInt(timeValues[2])*MIN_PER_HOUR;
  minuteValue += parseInt(timeValues[3]);
  
  return minuteValue;
}
//console.log( "testing timeStampToMinutes('12:02:08:52'); expected: 477172; received: " + timeStampToMinutes('12:02:08:52') );


function minutesToTimeStamp(minuteValue) {
  var timeValues = []    // [MM, DD, HH, mm]
  var timeValuesStrs = []
  var timeStamp = "";
  
  timeValues.push( Math.floor(minuteValue/MIN_PER_MONTH) );
  minuteValue -= timeValues[0]*MIN_PER_MONTH;
  timeValues[0] += 1;
  timeValues.push( Math.floor(minuteValue/MIN_PER_DAY) );
  minuteValue -= timeValues[1]*MIN_PER_DAY;
  timeValues[1] += 1;
  timeValues.push( Math.floor(minuteValue/MIN_PER_HOUR) );
  minuteValue -= timeValues[2]*MIN_PER_HOUR;
  timeValues.push( minuteValue );
  
  for (const elem of timeValues) {
    var strElem = elem.toString();
    if (strElem.length == 1) {
      strElem = '0' + strElem;
    }
    timeValuesStrs.push(strElem);
  }
  
  return timeValuesStrs[0]+':'+timeValuesStrs[1]+':'+timeValuesStrs[2]+':'+timeValuesStrs[3];
}
console.log( "testing minutesToTimeStamp(477172); expected: 12:02:08:52; received: " + minutesToTimeStamp(477172) );


function findSessionInfo(sessionStr) {
  var startTimeStamp      = sessionStr.split('::')[0]          ;
  var endTimeStampPartial = sessionStr.split('::')[1]          ;
  var startMinute         = timeStampToMinutes(startTimeStamp) ;
  var endMinute           = timeStampToMinutes( startTimeStamp.slice(0, 6) + endTimeStampPartial ) ;
  
  return [endMinute - startMinute, startMinute];
}
console.log( "testing findSessionInfo('12:02:08:52::09:35'); expected: 43,477172; received: " + findSessionInfo('12:02:08:52::09:35') );


function findSlotsInSession(sessionStr, slotLength) {
  var sessionLength = findSessionInfo(sessionStr)[0]         ;
  var sessionStart  = findSessionInfo(sessionStr)[1]         ;
  var slotsCount    = Math.floor( sessionLength/slotLength ) ;
  var slotsArray    = [] ; // each slot will be a list of [startTime, endTime]
  
  if (slotLength < 15) { slotLength = 15; }
  
  for (let i = 0; i < slotsCount; i++) {
    let slotStartMinute = sessionStart + slotLength*i   ;
    let slotEndMinute   = slotStartMinute + slotLength  ;
    slotsArray.push( [slotStartMinute, slotEndMinute] ) ;
    console.log( [slotStartMinute, slotEndMinute] )     ;
  }
  
  return slotsArray;
}
//console.log( "testing findSlotsInSession('12:02:08:52::09:35', 20); expected: 477172,477192,477192,477212; received: " + findSlotsInSession('12:02:08:52::09:35', 20) );


async function handleSessionsInput(schId, sessionsStr, slotLength) {
  // this function assumes that a schedule has already been created
  // so that the created slot entries can point towards it

  // separate the info for each session
  var sessionsArray = sessionsStr.split(';');
      //console.log("handle sessionArray input server.js")
      //console.log(sessionsArray)
    
  // for each session in the schedule
  for (const sessionStr of sessionsArray) {
    // determine how many slots are in a specific session
    console.log("handle sessionStr in server.js")
      console.log(sessionStr)
    let sessionSlots = findSlotsInSession(sessionStr, slotLength);
    // console.log("handle sessionSlots input server.js")
    //   console.log(sessionSlots)
    // create a slot associated with the schedule for each slot in the specific session
    for (const slotData of sessionSlots) {
      console.log("handle slotData input server.js")
      console.log(slotData)
      await db.createSlotForSession( schId, slotData[0], slotData[1] )
    }
    
  }
  
}

async function handlePhoneNumberInput(sch_id, phoneString){
  var phoneNumbers = phoneString.split(";");
  for(const phoneNumber of phoneNumbers ) {
    await db.createInvite(sch_id, phoneNumber);
  }
  
  alertInvitees(sch_id)
  //COMMENT
}

 async function alertInvitees(sch_id){
   //console.log("starting alertInvitees()")
   // client.messages
   //    .create({
   //       body: 'TWILIO TEST',
   //       from: '+16413632118',
   //       to: '+18473479014'
   //     })
   //    .then(message => console.log(message.sid));
       
   var inviteList = await db.getInvitationsBySchedule(sch_id);
   var sch_info = await db.getSchedule(sch_id);
   
     for (const invite of inviteList) {
       
       
       var phoneNumber = "+" + invite.phone;
     
     // https://www.twilio.com/blog/serverless-sms-messaging-javascript-twilio-functions
       client.messages
        .create({
           body: 'This is your reminder to reserve a slot in event '+sch_info[0].title,
           from: '+16413632118',
           to: phoneNumber
         })
        .then(message => console.log(message.sid));
      }
   }



// ROUTES ////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Home route for the app
 *
 * Return the poll options from the database helper script
 * The home route may be called on remix in which case the db needs setup
 *
 * Client can request raw data using a query parameter
 */
fastify.get("/", async (request, reply) => {
  /*
  Params is the data we pass to the client
  - SEO values for front-end UI but not for raw data
  */
  let params = request.query.raw ? {} : { seo: seo };
  params.devMode = devMode
  
  
  // some testing on launch
  // alertInvitees(1)
  // handlePhoneNumberInput(2, "18473479014;13192417796")
  
  // Get the available choices from the database
//   const options = await db.getOptions();
//   if (options) {
//     params.optionNames = options.map(choice => choice.language);
//     params.optionCounts = options.map(choice => choice.picks);
//   }
//   // Let the user know if there was a db error
//   else params.error = data.errorMessage;

//   // Check in case the data is empty or not setup yet
//   if (options && params.optionNames.length < 1)
//     params.setup = data.setupMessage;

  // ADD PARAMS FROM TODO HERE

  // Send the page options or raw JSON data if the client requested it
  request.query.raw
      ? reply.send(params)
      : reply.view("/src/pages/index.hbs", params);
});

/**
 * Post route to process user vote
 *
 * Retrieve vote from body data
 * Send vote to database helper
 * Return updated list of votes
 */
fastify.post("/", async (request, reply) => {
  // Create the params object -- info stored here will be passed to the next view/page
  let params = request.query.raw ? {} : { seo: seo };

  // Store in params the name and quantity from the submitted form
  // (accessed through object 'request')
  params.username = request.body.username
  params.password = request.body.password

  console.log("|"+ params.password + "|")
  let queryResult = await db.getAdminPassword(params.username)
  let storedPassword;
  console.log(queryResult.length)
  if (queryResult.length > 0)
    {
      storedPassword = queryResult[0].password
    }
  
  if (storedPassword == params.password)
    {
      params.loggedin = request.body.username
      params.dbQueryResult = await db.getSchedulesByAdmin(params.loggedin)
      console.log(params.dbQueryResult[0].id)
      request.query.raw
      ? reply.send(params)
      : reply.view("/src/pages/admin.hbs", params);
    }
  else
    {
      params.error = "invalid login"
        request.query.raw
      ? reply.send(params)
      : reply.view("/src/pages/index.hbs", params);
    }
  // Call the function (from sqlite.js) to create a new example entry in the db
  

  // Call the function to get all data from the example table in the db,
  // and store it in params
  
  // Return the info to the client

});

fastify.post("/viewschedule", async (request, reply) => {
  let params = request.query.raw ? {} : { seo: seo };
  
  params.id = request.body.id
  
  let results = await db.getSchedule(params.id)

  params.title = "okay alex"
  params.timezone = "cst"
  params.loggedin = "herkyHawk"
  params.username = "herkyHawk"
  params.schedid = "1"
  params.start_time = "90"
  params.end_time = "80"
  params.time_slots = "string"
  params.notes = "description"
  
  
  // params.title = results[0].title
  // params.timezone = results[0].timezone
  // params.loggedin = results[0].username
  // params.username = results[0].username
  // params.schedid = results[0].id
  // params.start_time = results[0].start_time
  // params.end_time = results[0].end_time
  
  
  request.query.raw
  ? reply.send(params)
  : reply.view("/src/pages/viewschedule.hbs", params)
})


fastify.post("/submit-reserve", async (request, reply) => {
  let params = request.query.raw ? {} : { seo: seo };
  //add in call to the radio button that is selected, the id pulled from the column
  // of the radio button is what is passed into the reservation id thing

});

fastify.post("/viewandedit", async (request, reply) => {
  let params = request.query.raw ? {} : { seo: seo};
  
 
  params.sched_id = request.body.schedId
  let schDetails = await db.getSchedule(params.sched_id)
   
  params.viewedit = true
  
  params.title = schDetails[0].title
 
  params.timezone = schDetails[0].timezone
  params.loggedin = schDetails[0].username
  params.username = schDetails[0].username
  params.schedid = schDetails[0].id
  params.start_time = schDetails[0].start_time
  params.end_time = schDetails[0].end_time
  params.notes = schDetails[0].description
  params.location = schDetails[0].location
  
  let  slotDetails = await db.getSlotsBySchedule(params.sched_id)
  params.slotDetails = slotDetails
  
  
  request.query.raw
  ? reply.send(params)
  : reply.view("/src/pages/create.hbs", params)

});


fastify.post("/submit-create", async (request, reply) => {
 
  let params = request.query.raw ? {} : { seo: seo };
  
  params.loggedin = request.body.username
  params.title = request.body.input_title
  // params.timezone = request.body.select_timezone
  params.timezone = request.body.select_timezone
  params.startdate = request.body.input_startdate
  params.enddate = request.body.input_enddate
  // params.deadline = request.body.input_deadline
  params.location = request.body.input_location
  // params.respertime = request.body.respertime
  // params.resperuser = request.body.resperuser
  // params.reminderhours = request.body.reminderhours
  params.slotlength = request.body.input_lenslots
  params.phonenumbers = request.body.input_phonenumbers
  params.notes = request.body.input_notes  
  params.sessionstring = request.body.session_string

  
  console.log("USERNAME  : "+params.loggedin)
  console.log("SESSIONSTR: "+params.sessionstring)
	
  params.submitted = true
  
  // create the schedule
  await db.createSchedule(params.loggedin, 0, timeStampToMinutes(params.startdate), timeStampToMinutes(params.enddate), params.location, params.timezone, params.notes, params.title);
  params.dbQueryResult = await db.getSchedulesByAdmin(params.loggedin)

  var schInfo = await db.getScheduleByUsernameAndTitle(params.loggedin, params.title);
  var sch_id = schInfo[0].id
  
  // create the slots
  handleSessionsInput(sch_id, params.sessionstring, params.slotlength);
  
  // create the invitations
  console.log("PHONENUMBERS: "+params.phonenumbers)
  handlePhoneNumberInput(sch_id, params.phonenumbers);
  
  

  
  // need to parse this and then do a for each call await db.createSlot(params.slots)
  request.query.raw
  ? reply.send(params)
  : reply.view("/src/pages/admin.hbs", params);
   
});

fastify.post("/create", async(request, reply) => {
   
  let params = request.query.raw ? {} : { seo: seo};
 
  params.devMode = devMode
  params.loggedin = request.body.username
  
    request.query.raw
      ? reply.send(params)
      : reply.view("/src/pages/create.hbs", params);
});

fastify.post("/admin", async(request, reply) => {
  let params = request.query.raw ? {} : { seo: seo};
  params.loggedin = request.body.username
  params.username = request.body.username
  params.dbQueryResult = await db.getSchedulesByAdmin(params.username)
    request.query.raw
      ? reply.send(params)
      : reply.view("/src/pages/admin.hbs", params);
});

fastify.post("/userselect", async(request, reply) => {
  let params = request.query.raw ? {} : { seo: seo};
  params.devMode = devMode
  //TO-DO
  params.sch_id = request.body.scheduleid
  params.dbQueryResult = await db.getSlotsBySchedule(params.sch_id)
  
  let titleResults = await db.getSchedule(params.sch_id)
  params.title = titleResults[0].title
  params.description = titleResults[0].description
  params.timezone = titleResults[0].timezone
  params.identifier = request.body.phonenumber
  params.name = request.body.fullname
  // params.startTimes = []
  // params.endTimes = []
  params.timesList = []
  for(const slot of params.dbQueryResult){
//     params.startTimes.push(minutesToTimeStamp(slot.start_time))
//     params.endTimes.push(minutesToTimeStamp(slot.end_time))
  let slotTimes = {"start": minutesToTimeStamp(slot.start_time), "end": minutesToTimeStamp(slot.end_time)}   
  params.timesList.push(slotTimes)
    };
   request.query.raw
    ? reply.send(params)
    : reply.view("/src/pages/userview.hbs", params);

});



fastify.get("/userviewtest", async(request, reply) => {
  let params = request.query.raw ? {} : { seo: seo};
  params.devMode = devMode
  //TO-DO
  params.sch_id = request.body.scheduleid
  params.dbQueryResult = await db.getSlotsBySchedule(params.sch_id)
  
  let titleResults = await db.getSchedule(params.sch_id)
  params.title = titleResults[0].title
  // params.startTimes = []
  // params.endTimes = []
  params.timesList = []
  for(const slot of params.dbQueryResult){
//     params.startTimes.push(minutesToTimeStamp(slot.start_time))
//     params.endTimes.push(minutesToTimeStamp(slot.end_time))
    let slotTimes = {"start": minutesToTimeStamp(slot.start_time), "end": minutesToTimeStamp(slot.end_time)}   
  params.timesList.push(slotTimes)
    };
  // console.log("startTimes: " + params.startTimes)
  // console.log("endTimes: " + params.endTimes)
  
  
  request.query.raw
    ? reply.send(params)
    : reply.view("/src/pages/userview.hbs", params);


  
});





fastify.get("/create", async(request, reply) => {
  let params = request.query.raw ? {} : { seo: seo};
  params.devMode = devMode
  
  
    request.query.raw
      ? reply.send(params)
      : reply.view("/src/pages/create.hbs", params);
});

fastify.get("/home", async (request, reply) => {
  let params = request.query.raw ? {} : { seo: seo};
  
  request.query.raw
      ? reply.send(params)
      : reply.view("/src/pages/admin.hbs", params)
})


/** other shit they wrote ******************************************************************\

 /**
 * Admin endpoint returns log of votes
 *
 * Send raw json or the admin handlebars page
 */


fastify.get("/logs", async (request, reply) => {
  let params = request.query.raw ? {} : { seo: seo };

  // Get the log history from the db
  params.optionHistory = await db.getLogs();

  // Let the user know if there's an error
  params.error = params.optionHistory ? null : data.errorMessage;

  // Send the log list
  request.query.raw
      ? reply.send(params)
      : reply.view("/src/pages/admin.hbs", params);
});

/**
 * Admin endpoint to empty all logs
 *
 * Requires authorization (see setup instructions in README)
 * If auth fails, return a 401 and the log list
 * If auth is successful, empty the history
 */
fastify.post("/reset", async (request, reply) => {
  let params = request.query.raw ? {} : { seo: seo };

  /* 
  Authenticate the user request by checking against the env key variable
  - make sure we have a key in the env and body, and that they match
  */
  if (
      !request.body.key ||
      request.body.key.length < 1 ||
      !process.env.ADMIN_KEY ||
      request.body.key !== process.env.ADMIN_KEY
  ) {
    console.error("Auth fail");

    // Auth failed, return the log data plus a failed flag
    params.failed = "You entered invalid credentials!";

    // Get the log list
    params.optionHistory = await db.getLogs();
  } else {
    // We have a valid key and can clear the log
    params.optionHistory = await db.clearHistory();

    // Check for errors - method would return false value
    params.error = params.optionHistory ? null : data.errorMessage;
  }

  // Send a 401 if auth failed, 200 otherwise
  const status = params.failed ? 401 : 200;
  // Send an unauthorized status code if the user credentials failed
  request.query.raw
      ? reply.status(status).send(params)
      : reply.status(status).view("/src/pages/admin.hbs", params);
});

// Run the server and report out to the logs
fastify.listen(process.env.PORT, function(err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Your app is listening on ${address}`);
  fastify.log.info(`server listening on ${address}`);
});


/** Frontend JS Stuff **********************************************************************/
// document.getElementById("test_button").addEventListener("click", function() {
//           var newLabel = document.createElement("Label");
//           newLabel.innerHTML = "PROOF";
//           document.getElementById("test_button").appendChild(newLabel);
//         });