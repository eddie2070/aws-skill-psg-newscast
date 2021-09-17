const AWS = require('aws-sdk');
var documentClient = new AWS.DynamoDB.DocumentClient();
const moment = require('moment-timezone');
var s3 = new AWS.S3();
var lambda = new AWS.Lambda();
var eventbridge = new AWS.EventBridge();
const axios = require('axios');
const jp = require('jsonpath');


var livegamemarker = (date) => {
    console.log("livegamemarker: ", date);
    var cronexp = moment(date[0]).format("m H D M [?] YYYY");
    console.log("cronexp: ",cronexp);
    
    var paramseventrule = {
      Name: 'PSGNewscast-livemarker', /* required */
      Description: 'adds live game marker',
      //RoleArn: 'STRING_VALUE',
      ScheduleExpression: 'cron('+cronexp+')',
      State: "ENABLED",
      Tags: [
        {
          Key: 'Name', /* required */
          Value: 'PSGNewscast' /* required */
        },
        /* more items */
  ]
};
    eventbridge.putRule(paramseventrule, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response
    });
    
    var paramseventtarget = {
        Rule: "PSGNewscast-livemarker",
        Targets: [{Arn: "arn:aws:lambda:us-east-1:753451452012:function:PSGNewscast-livegame-refresher", 
        Id: "Lambdalivemarker", 
        Input: '{"marker": "playingnow"}'
        }]
    };
    eventbridge.putTargets(paramseventtarget, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response
});

};

var liverefresh = async (state) => {
    console.log("liverefresh: ", state);

            var paramseventrule = {
                Name: 'PSGNewscast-liverefresh', /* required */
                Description: 'refreshes score every 3 minutes, when game is occuring',
                ScheduleExpression: 'rate(3 minutes)',
                State: state,
                Tags: [
                    {
                    Key: 'Project', /* required */
                    Value: 'PSGNewscast' /* required */
                    },
                    ]
            };
            console.log("paramseventrule: ", paramseventrule);

            var putrulefresh = await eventbridge.putRule(paramseventrule).promise();
            console.log("putrulefresh ARN: ", putrulefresh.RuleArn);
            
            var paramlambdatrigperm = {
                Action: 'lambda:InvokeFunction',
                FunctionName: 'PSGNewscast-livegame',
                Principal: 'events.amazonaws.com', 
                StatementId: 'Event'+Date.now(),
                SourceArn: putrulefresh.RuleArn
            };
            var lambdatrigperm = await lambda.addPermission(paramlambdatrigperm).promise();
            console.log("lambdatrigperm: ",lambdatrigperm);
    
            var paramseventtarget = {
                Rule: "PSGNewscast-liverefresh",
                Targets: [{Arn: "arn:aws:lambda:us-east-1:753451452012:function:PSGNewscast-livegame", 
                Id: "Lambdaliverefresh"+Date.now()
                }]
            };

            var liveputtarget = await eventbridge.putTargets(paramseventtarget).promise();
            console.log("liveputtarget: ",liveputtarget);
            console.log("target added to Eventbridge rule");
            // return liveputtarget;

};


const url = 'http://api.football-data.org/v2/teams/524/matches?status=SCHEDULED';
const headers = {
  Accept: 'application/json',
  'Accept-Charset': 'utf-8',
  'X-Auth-Token': 'a9bc952d181c47268446a51dafc83286'
};

exports.handler = async (event, context, callback) => {
    console.log("event: ", event);
    const response = await axios.get(url, { headers });
    var jsongamescheduled = jp.query(response.data, '$.matches[?(@.status==="SCHEDULED")]');
    var jsongamenextgame = jsongamescheduled[0];
    var jsongamedate = jp.query(jsongamenextgame, '$.utcDate');

    livegamemarker(jsongamedate);


    try {console.log("event: ", event.Records[0].dynamodb);} catch (err) {console.log(err)}
    try {
        if (event.marker == "playingnow") {
            console.log("marker for live game detected");
            var paramsddb = {
                Item: {
                    "ID": "livemarker",
                    "current": "true",
                    "gameinfo": "notstarted",
                    'UpdateTime': Math.floor(Date.now() /1000) ,
                    'TTL':  Math.floor(Date.now()/1000 + 6500) ,
                }, 
                ReturnConsumedCapacity: "TOTAL",
                TableName: "PSGNewscast-refresher"
            };
            var ddbputmarker = await documentClient.put(paramsddb).promise();
            console.log("ddbputmarker: ", ddbputmarker);
            var refreshactivation = await liverefresh("ENABLED");
            console.log("refreshactivation: ", refreshactivation);
           
        } else {console.log("event marker not at true")}
        
        try {
            console.log('event.Records[0].eventName :' , event.Records[0].eventName);
            console.log('event.Records[0].dynamodb.Keys.ID :' , event.Records[0].dynamodb.Keys.ID);
        
        if (event.Records[0].eventName == "REMOVE" && event.Records[0].dynamodb.Keys.ID.S === 'livemarker') {
            var refreshoff = liverefresh("DISABLED");
            console.log("Disabled Eventbridge Rule");
            return refreshoff;
        } else {console.log("game still playing or not started")}
        } catch {console.log("no ddb event stream")}
        
        if (event.Records[0].eventName == "REMOVE" && event.Records[0].dynamodb.Keys.ID.S != 'livemarker') {
            console.log("Triggered by REMOVE on nextgame or anything else than livemarker. Not doing anything");
            return "Exit. Triggered by REMOVE on nextgame or anything else than livemarker. Not doing anything";
        }
        
    } catch(err) {console.log("no live game marker or err: ",err)}
    
    

};
    