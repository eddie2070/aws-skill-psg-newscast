'use strict';
const AWS = require("aws-sdk");
var stepfunctions = new AWS.StepFunctions();


function get_session_attributes(intentRequest){
    var sessionState = intentRequest.sessionState;
    if (sessionState.hasOwnProperty("sessionAttributes") == true){
        return sessionState.sessionAttributes;
    } else {
        return{};
    }
}

async function dispatch(intentRequest, callback) {
    console.log("date1: ", Date.now());
    console.log(`request received for userId intentName`);
    console.log("intentRequest: ",intentRequest);
    //var sessionAttributes = get_session_attributes(intentRequest);
    //var sessionAttributes = get_session_attributes(intentRequest);
    //const apiKey = process.env.apiKey;
    console.log("intentname: ",intentRequest.sessionState.intent.name);
    var sfname= 'testing'+Date.now();
    var params = {
        stateMachineArn: 'arn:aws:states:us-east-1:753451452012:stateMachine:PSGNewscast-MyStateMachineStandard', /* required */
        input: '{\"intentname\": \"'+intentRequest.sessionState.intent.name+'\", "token": "'+sfname+'"}',
        name: sfname,
        traceHeader: 'test'
    };
    console.log("params: ", params);
    console.log("date1: ", Date.now());
        var sfoutput = stepfunctions.startExecution(params).promise()
        .then(async data => {
            console.log('==> data: ', data);
            await new Promise(r => setTimeout(r, 8000));
            return stepfunctions.describeExecution({ executionArn: data.executionArn }).promise();
        })
        .then(result => {
            console.log("result: ", result);
            //var resultparse = JSON.parse(result.output).Payload.lastresults;
            var resultparse = JSON.parse(result.output).Payload;
            console.log("results: ", resultparse);
            //console.log("results home: ", resultparse.lastresults.score.homescore);
            var sessionAttributes = get_session_attributes(intentRequest);
            callback(close(intentRequest,sessionAttributes, 'Fulfilled',
                {'contentType': 'PlainText', 'content': resultparse.lastresults}));
          return {
                statusCode: 200,
                message: JSON.stringify(result)
            };
        })
        .catch(err => {
            console.error('err: ', err);
            return {
                statusCode: 500,
                message: JSON.stringify({ message: 'facing error' })
            };
        });
    console.log("sfoutput: ",sfoutput);
    console.log("date2: ", Date.now());
    //const apiKey = process.env.apiKey;
}


function close(intentRequest,sessionAttributes, fulfillmentState, message) {
    //console.log("dialogAction: ", intentRequest.sessionState.dialogAction);
    intentRequest.sessionState.intent.state = fulfillmentState;
    console.log("date3: ", Date.now());
    return {
    "sessionState": {
        "sessionAttributes": {},
        "dialogAction": {
            "type": "Close"
            },
        "intent": intentRequest.sessionState.intent

    },
    "messages": [message],
    "requestAttributes": {}
    };
}

// --------------- Main handler -----------------------
 
// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) => {
        console.log("event: ", event);
        dispatch(event,
            (response) => {
                callback(null, response);
            });
};