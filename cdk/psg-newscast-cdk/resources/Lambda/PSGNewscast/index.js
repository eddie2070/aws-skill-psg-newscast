const Alexa = require('ask-sdk-core');
const AWS = require("aws-sdk");
var AWSXRay = require('aws-xray-sdk');
var lexruntimev2 = new AWS.LexRuntimeV2({
  service: new AWS.LexRuntimeV2()
});


AWSXRay.captureAWSClient(lexruntimev2);

var lambda = new AWS.Lambda();

var params = {
  botAliasId: 'TSTALIASID', /* required */
  botId: 'CXEPMHBC6Z', /* required */
  localeId: 'en_US', /* required */
  sessionId: '123456',//Math.floor(Date.now() /1000).toString() /* required */,
  text: 'Welcome'
};

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        console.log("handlerInput: ", handlerInput.requestEnvelope.request);
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    async handle(handlerInput) {
      //var lexresp = await lexruntimev2.recognizeText(params).promise();
      const repromptText = '';
      //console.log("lexresp: ", lexresp.messages[0].content);
        return handlerInput.responseBuilder
            .withSimpleCard('PSG Newscast', "Welcome to PSG Newscast") // <--
            .speak("Welcome to PSG newscast. What would you like to know today? You can ask for the last results, live, next game, position in the leaderboard, latest news, or music.")
            .reprompt(repromptText)
            .getResponse();
    }
};

const WelcomeIntentHandler = {
    canHandle(handlerInput) {
        console.log("handlerInput2: ", handlerInput.requestEnvelope.request);
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'WelcomeIntent';
    },
    async handle(handlerInput) {
            console.log("lexreq2: ", handlerInput.requestEnvelope.request.intent.name);
            const repromptText = '';

        return handlerInput.responseBuilder
            .withSimpleCard('PSG News', "Welcome to PSG Newscast") // <--
            //.speak("Welcome to PSG newscast. What would you like to know today? You can ask for the last results, live, next game, position in the leaderboard, latest news, or music.<audio src='soundbank://soundlibrary/animals/amzn_sfx_bear_groan_roar_01'/>")
            .speak("Welcome to PSG newscast. What would you like to know today? You can ask for the last results, live, next game, position in the leaderboard, latest news, or music.")
            .reprompt(repromptText)
            .getResponse();
    }
};

const LastResultsIntentHandler = {
    canHandle(handlerInput) {
        console.log("handlerInput2: ", handlerInput.requestEnvelope.request);
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'LastResultsIntent';
    },
    async handle(handlerInput) {
            console.log("lexreq2: ", handlerInput.requestEnvelope.request.intent.name);
            //var lexresp = await lexruntimev2.recognizeText({botAliasId: 'TSTALIASID', botId: 'CXEPMHBC6Z', localeId: 'en_US', sessionId: Math.floor(Date.now() /1000).toString(),text: handlerInput.requestEnvelope.request.intent.name }).promise();
            //var lexresp = await lexruntimev2.recognizeText({botAliasId: 'TSTALIASID', botId: 'CXEPMHBC6Z', localeId: 'en_US', sessionId: '123456',text: handlerInput.requestEnvelope.request.intent.name }).promise();
            const repromptText = '';
            var paramslbd = {
                FunctionName: 'PSGNewscast-dispatcher', /* required */
                Payload: JSON.stringify({'sessionState': {'intent': {'name': 'LastResultsIntent'}}})
            };
            var displast = await lambda.invoke(paramslbd).promise();
            console.log("displast: ",JSON.parse(displast.Payload));
            var homescore = JSON.parse(displast.Payload).messages[0].content.score.homescore;
            var awayscore = JSON.parse(displast.Payload).messages[0].content.score.awayscore;
            var hometeamlogo = JSON.parse(displast.Payload).messages[0].content.score.hometeamlogo;
            var awayteamlogo = JSON.parse(displast.Payload).messages[0].content.score.awayteamlogo;
            var journey = JSON.parse(displast.Payload).messages[0].content.score.journey;
            var jsoncompetition = JSON.parse(displast.Payload).messages[0].content.score.jsoncompetition;
            var jsongamedate = JSON.parse(displast.Payload).messages[0].content.score.jsongamedate;
            console.log("homescore: ",homescore);
            console.log("awayscore: ",awayscore);
            //console.log("lexresp2: ", lexresp);
        
        return handlerInput.responseBuilder
            //.withSimpleCard('PSG News', lexresp.messages[0].content) // <--
            .withResultsCard('PSG News','{"homescore": "'+homescore+'", "awayscore": "'+awayscore+'", "hometeamlogo": "'+hometeamlogo+'", "awayteamlogo": "'+awayteamlogo+'", "journey": "'+journey+'", "jsoncompetition": "'+jsoncompetition+'", "jsongamedate": "'+jsongamedate+'"}') // <--
            .speak(JSON.parse(displast.Payload).messages[0].content.conc)
            .reprompt(repromptText)
            .getResponse();
    }
};

const NextGameIntentHandler = {
    canHandle(handlerInput) {
        console.log("handlerInput2: ", handlerInput.requestEnvelope.request);
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'NextGameIntent';
    },
    async handle(handlerInput) {
            console.log("lexreq2: ", handlerInput.requestEnvelope.request.intent.name);
            const repromptText = '';
            var paramslbd = {
                FunctionName: 'PSGNewscast-dispatcher', /* required */
                Payload: JSON.stringify({'sessionState': {'intent': {'name': 'NextGameIntent'}}})
            };
            console.log("track001");
            var displast = await lambda.invoke(paramslbd).promise();
            console.log("displast: ",JSON.parse(displast.Payload));
            console.log("displast2: ",JSON.parse(displast.Payload).messages[0].content);
            var hometeamlogo = JSON.parse(displast.Payload).messages[0].content.nextgame.hometeamlogo;
            var awayteamlogo = JSON.parse(displast.Payload).messages[0].content.nextgame.awayteamlogo;
            var journey = JSON.parse(displast.Payload).messages[0].content.nextgame.journey;
            var jsoncompetition = JSON.parse(displast.Payload).messages[0].content.nextgame.jsoncompetition;
            var jsongamedate = JSON.parse(displast.Payload).messages[0].content.nextgame.jsongamedate;
            var jsongamestadium = JSON.parse(displast.Payload).messages[0].content.nextgame.jsongamestadium;
        
        return handlerInput.responseBuilder
            //.withSimpleCard('PSG News', lexresp.messages[0].content) // <--
            .withNextCard('PSG News','{"hometeamlogo": "'+hometeamlogo+'", "awayteamlogo": "'+awayteamlogo+'", "journey": "'+journey+'", "jsoncompetition": "'+jsoncompetition+'", "jsongamedate": "'+jsongamedate+'", "jsongamestadium": "'+jsongamestadium+'"}') // <--
            .speak(JSON.parse(displast.Payload).messages[0].content.conc)
            .reprompt(repromptText)
            .getResponse();
    }
};

const StandingsIntentHandler = {
    canHandle(handlerInput) {
        console.log("handlerInput2: ", handlerInput.requestEnvelope.request);
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'StandingsIntent';
    },
    async handle(handlerInput) {
            console.log("lexreq2: ", handlerInput.requestEnvelope.request.intent.name);
            const repromptText = '';
            var paramslbd = {
                FunctionName: 'PSGNewscast-dispatcher', /* required */
                Payload: JSON.stringify({'sessionState': {'intent': {'name': 'StandingsIntent'}}})
            };
            console.log("track001");
            var displast = await lambda.invoke(paramslbd).promise();
            console.log("displast: ",JSON.parse(displast.Payload));
            console.log("displast2: ",JSON.parse(displast.Payload).messages[0].content);
            console.log("displast3: ",JSON.parse(displast.Payload).messages[0].content.standings);
            var posit = JSON.parse(displast.Payload).messages[0].content.standings.positioncard;
            var points = JSON.parse(displast.Payload).messages[0].content.standings.points;
            var jsonteamaheadname = JSON.parse(displast.Payload).messages[0].content.standings.teamaheadname;
            var jsonteamaheadposition = JSON.parse(displast.Payload).messages[0].content.standings.teamaheadposition;
            var jsonteamaheadpoints = JSON.parse(displast.Payload).messages[0].content.standings.teamaheadpoints;
            var jsonteambehindname = JSON.parse(displast.Payload).messages[0].content.standings.teambehindname;
            var jsonteambehindposition = JSON.parse(displast.Payload).messages[0].content.standings.teambehindposition;
            var jsonteambehindpoints = JSON.parse(displast.Payload).messages[0].content.standings.teambehindpoints;
            var plot3 = JSON.parse(displast.Payload).messages[0].content.standings.standingsdata;
            console.log("plot3: ",plot3);
        
        return handlerInput.responseBuilder
            .withStandingsCard('PSG News','{"listdata":'+plot3+'}')
            //.withStandingsCard('PSG News','{"listdata": [ {"score": 12, "listItemIdentifier": "1, "ordinalNumber": "1", "text": "Paris SG", "position": 1, "token": "1"}]}')
            //'+plot3+'}') // <--
            //.withSimpleCard('PSG News', lexresp.messages[0].content) // <--
            //.withStandingsCard('PSG News','{"posit": "'+posit+'","points": "'+points+'","jsonteamaheadname": "'+jsonteamaheadname+'","jsonteamaheadposition": "'+jsonteamaheadposition+'","jsonteamaheadpoints": "'+jsonteamaheadpoints+'"}') // <--
            //.withStandingsCard('PSG News','{"listdata": '+JSON.stringify(JSON.parse(displast.Payload).messages[0].content.standings)+'}') // <--
            //.withStandingsCard('PSG News','{"listdata": '+JSON.parse(displast.Payload).messages[0].content.standings+'}') // <--
            //.withStandingsCard('PSG News','"listTemplate1ListData": {"listId": "lt1Sample","type": "list","listPage": {"listItems": [{"score": 15,"listItemIdentifier": "1","ordinalNumber": 1,"text": "PSG","position": 1,"token": "1"}]},"totalNumberOfItems": 1}')
            .speak(JSON.parse(displast.Payload).messages[0].content.conc)
            .reprompt(repromptText)
            .getResponse();
    }
};

const MusicIntentHandler = {
    canHandle(handlerInput) {
        console.log("handlerInput2: ", handlerInput.requestEnvelope.request);
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'MusicIntent';
    },
    async handle(handlerInput) {
            console.log("lexreq2: ", handlerInput.requestEnvelope.request.intent.name);
            const repromptText = '';
            
            //return WelcomeIntentHandler.handle(handlerInput);

        return handlerInput.responseBuilder

            .withSimpleCard('PSG News', "PSG Intro") // <--
            //.speak("Welcome to PSG newscast. What would you like to know today? You can ask for the last results, live, next game, position in the leaderboard, latest news, or music.<audio src='soundbank://soundlibrary/animals/amzn_sfx_bear_groan_roar_01'/>")
            .speak("<audio src='https://psgnewscast-skill2021.s3.amazonaws.com/PSG_Intro.mp3'/>. ")
            .reprompt(repromptText)
            .getResponse();
        
    }
};

const TwitIntentHandler = {
    canHandle(handlerInput) {
        console.log("handlerInput2: ", handlerInput.requestEnvelope.request);
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'TwitIntent';
    },
    async handle(handlerInput) {
            console.log("lexreq2: ", handlerInput.requestEnvelope.request.intent.name);
            const repromptText = '';
            var paramslbd = {
                FunctionName: 'PSGNewscast-dispatcher', /* required */
                Payload: JSON.stringify({'sessionState': {'intent': {'name': 'TwitIntent'}}})
            };
            console.log("track001");
            var displast = await lambda.invoke(paramslbd).promise();
            console.log("displast: ",JSON.parse(displast.Payload));
            
            //return WelcomeIntentHandler.handle(handlerInput);

        return handlerInput.responseBuilder

            .withSimpleCard('PSG News', "PSG Intro") // <--
            //.speak("Welcome to PSG newscast. What would you like to know today? You can ask for the last results, live, next game, position in the leaderboard, latest news, or music.<audio src='soundbank://soundlibrary/animals/amzn_sfx_bear_groan_roar_01'/>")
            .speak(JSON.parse(displast.Payload).messages[0].content.conc)
            .reprompt(repromptText)
            .getResponse();
        
    }
};


const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speechText = '<lang xml:lang="en-US">You can say hello. How can I help you?</lang> <lang xml:lang="es-ES">Puedes decir hola. Cómo te puedo ayudar?</lang>';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};



const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent' || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.FallbackIntent');
    },
    handle(handlerInput) {
        const speechText = '<lang xml:lang="en-US">Bye bye</lang>';
        return handlerInput.responseBuilder
            .speak(speechText)
            .withShouldEndSession(true)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = handlerInput.requestEnvelope.request.intent.name;
        const speechText = `${intentName}`;

        return handlerInput.responseBuilder
            .speak(speechText)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.message}`);
        const speechText = 'Error!';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

// This handler acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        WelcomeIntentHandler,
        LastResultsIntentHandler,
        NextGameIntentHandler,
        StandingsIntentHandler,
        MusicIntentHandler,
        TwitIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addRequestInterceptors(require('./aplcard').APLHomeCardRequestInterceptor) // <---
    .addRequestInterceptors(require('./resultscard').APLHomeCardRequestInterceptor) // <---
    .addRequestInterceptors(require('./nextcard').APLHomeCardRequestInterceptor) // <---
    .addRequestInterceptors(require('./standingscard').APLHomeCardRequestInterceptor) // <---
    .addErrorHandlers(
        ErrorHandler)
    .lambda();

