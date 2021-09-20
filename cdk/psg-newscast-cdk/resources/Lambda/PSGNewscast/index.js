const Alexa = require('ask-sdk-core');
const AWS = require("aws-sdk");
var AWSXRay = require('aws-xray-sdk');
var lexruntimev2 = new AWS.LexRuntimeV2({
  service: new AWS.LexRuntimeV2()
});
var documentClient = new AWS.DynamoDB.DocumentClient();


AWSXRay.captureAWSClient(lexruntimev2);

var lambda = new AWS.Lambda();

var ddbcheckfn = async (id) => {
    var ddbcheckparams = {
            Key: {
                "ID": id
            }, 
            TableName: "PSGNewscast-refresher"
        };
    var ddbcheck  = await documentClient.get(ddbcheckparams).promise();
    console.log('ddbcheck: ', ddbcheck);
    return ddbcheck;
};

// var params = {
//   botAliasId: 'TSTALIASID', /* required */
//   botId: 'CXEPMHBC6Z', /* required */
//   localeId: 'en_US', /* required */
//   sessionId: '123456',//Math.floor(Date.now() /1000).toString() /* required */,
//   text: 'Welcome'
// };

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        console.log("handlerInput: ", handlerInput.requestEnvelope.request);
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    async handle(handlerInput) {
        var livespeak = "";
        var checkddblivgam = await ddbcheckfn("livemarker");
        try { if (checkddblivgam.Item.current === "true") {
            livespeak = "Paris is playing right now, say <phoneme alphabet='ipa' ph='laɪv'> live </phoneme> to learn about the current game.";
            if (checkddblivgam.Item.gameinfo != "notstarted") {
            var footer = "<span color='red' fontSize='14dp'>Game in progress:</span> <span color='black'>. </span>  <span fontSize='20dp'>" +checkddblivgam.Item.gameinfo.jsongamelivehome+ " "+checkddblivgam.Item.gameinfo.jsongamelivehomescore+" - " + checkddblivgam.Item.gameinfo.jsongameliveawayscore+ " " +checkddblivgam.Item.gameinfo.jsongameliveaway+ " ("+checkddblivgam.Item.gameinfo.jsongameliveclock+"') </span><span fontSize='10dp'><i>  <span color='black'> . . . . . . . . . </span> *Say live to know more</i></span> ";
            footer = footer.replace("Paris Saint-Germain FC","Paris\-SG")
            } else {
                footer = "";
            }
            const repromptText = 'Welcome to PSG newscast. What would you like to know today? You can ask for the last results, next game, position in the leaderboard, latest news, or music.';

            return handlerInput.responseBuilder
                .withSimpleCard('PSG Newscast', "Welcome to PSG Newscast",footer) // <--
                .speak("Welcome to PSG newscast. What would you like to know today? Ask for the last results, next game, position in the leaderboard, latest news, or music. "+livespeak)
                .reprompt(repromptText)
                .getResponse();
        } else {console.log("no live marker in ddb")}
        } catch(err) {console.log(err)}
        console.log("livespeak:", livespeak);
      const repromptText = 'Welcome to PSG newscast. What would you like to know today? You can ask for the last results, next game, position in the leaderboard, latest news, or music.';
        return handlerInput.responseBuilder
            .withSimpleCard('PSG Newscast', "Welcome to PSG Newscast") // <--
            .speak("Welcome to PSG newscast. What would you like to know today? Ask for the last results, next game, position in the leaderboard, latest news, or music. "+livespeak)
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
        var livespeak = "";
        var checkddblivgam = await ddbcheckfn("livemarker");
        if (JSON.parse(checkddblivgam).current === "true") {
            livespeak = "Say live to learn about the current live game.";
        }
            console.log("lexreq2: ", handlerInput.requestEnvelope.request.intent.name);
            const repromptText = 'Welcome to PSG newscast. What would you like to know today? You can ask for the last results, next game, position in the leaderboard, latest news, or music.';

        return handlerInput.responseBuilder
            .withSimpleCard('PSG News', "Welcome to PSG Newscast") // <--
            //.speak("Welcome to PSG newscast. What would you like to know today? You can ask for the last results, live, next game, position in the leaderboard, latest news, or music.<audio src='soundbank://soundlibrary/animals/amzn_sfx_bear_groan_roar_01'/>")
            .speak("Welcome to PSG newscast. What would you like to know today? You can ask for the last results, next game, position in the leaderboard, latest news, or music."+livespeak)
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

            const repromptText = '';
            var checkddblast = await ddbcheckfn("lastresults");
            console.log("checkddblast: ",checkddblast);
            if (JSON.stringify(checkddblast) === "{}") {
                var paramslbd = {
                    FunctionName: 'PSGNewscast-dispatcher', /* required */
                    Payload: JSON.stringify({'sessionState': {'intent': {'name': 'LastResultsIntent'}}})
                };
                var displast = await lambda.invoke(paramslbd).promise();
                console.log("displast: ",JSON.parse(displast.Payload));
                console.log("displast content: ",JSON.parse(displast.Payload).messages[0].content);
                var homescore = JSON.parse(displast.Payload).messages[0].content.score.homescore;
                var awayscore = JSON.parse(displast.Payload).messages[0].content.score.awayscore;
                var hometeamlogo = JSON.parse(displast.Payload).messages[0].content.score.hometeamlogo;
                var awayteamlogo = JSON.parse(displast.Payload).messages[0].content.score.awayteamlogo;
                var journey = JSON.parse(displast.Payload).messages[0].content.score.journey;
                var jsoncompetition = JSON.parse(displast.Payload).messages[0].content.score.jsoncompetition;
                var jsongamedate = JSON.parse(displast.Payload).messages[0].content.score.jsongamedate;
                var jsonstageUEFA = JSON.parse(displast.Payload).messages[0].content.score.jsonstageUEFA;
                var jsongroupUEFA = JSON.parse(displast.Payload).messages[0].content.score.jsongroupUEFA;
                console.log("homescore: ",homescore);
                console.log("awayscore: ",awayscore);
                var speak = JSON.parse(displast.Payload).messages[0].content.conc;
                console.log("speak: ",speak);

            } else {
                var homescore = checkddblast.Item.score.scoredata.homescore;
                console.log("eeee: ", homescore);
                var awayscore = checkddblast.Item.score.scoredata.awayscore;
                var hometeamlogo = checkddblast.Item.score.scoredata.hometeamlogo;
                var awayteamlogo = checkddblast.Item.score.scoredata.awayteamlogo;
                var journey = checkddblast.Item.score.scoredata.journey;
                var jsoncompetition = checkddblast.Item.score.scoredata.jsoncompetition;
                var jsongamedate = checkddblast.Item.score.scoredata.jsongamedate;
                var jsonstageUEFA = checkddblast.Item.score.scoredata.jsonstageUEFA;
                var jsongroupUEFA = checkddblast.Item.score.scoredata.jsongroupUEFA;
                var speak = checkddblast.Item.output.conc;
            }

        
        return handlerInput.responseBuilder
            .withResultsCard('PSG News','{"homescore": "'+homescore+'", "awayscore": "'+awayscore+'", "hometeamlogo": "'+hometeamlogo+'", "awayteamlogo": "'+awayteamlogo+'", "journey": "'+journey+'", "jsoncompetition": "'+jsoncompetition+'", "jsongamedate": "'+jsongamedate+'", "jsonstageUEFA": "'+jsonstageUEFA+'", "jsongroupUEFA": "'+jsongroupUEFA+'"}') // <--
            .speak(speak)
            .reprompt(speak)
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
            var checkddbnext = await ddbcheckfn("nextgame");
            console.log("checkddbnext: ",checkddbnext);
             if (JSON.stringify(checkddbnext) === "{}") {
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
                var jsongamenexthome = JSON.parse(displast.Payload).messages[0].content.nextgame.jsongamenexthome;
                var jsongamenextaway = JSON.parse(displast.Payload).messages[0].content.nextgame.jsongamenextaway;
                var speak = JSON.parse(displast.Payload).messages[0].content.conc;
             } else {
                var hometeamlogo = checkddbnext.Item.nextgame.nextgamedata.hometeamlogo;
                var awayteamlogo = checkddbnext.Item.nextgame.nextgamedata.awayteamlogo;
                var journey = checkddbnext.Item.nextgame.nextgamedata.journey;
                var jsoncompetition = checkddbnext.Item.nextgame.nextgamedata.jsoncompetition;
                var jsongamedate = checkddbnext.Item.nextgame.nextgamedata.jsongamedate;
                var jsongamestadium = checkddbnext.Item.nextgame.nextgamedata.jsongamestadium;
                var jsongamenexthome = checkddbnext.Item.nextgame.nextgamedata.jsongamenexthome;
                var jsongamenextaway = checkddbnext.Item.nextgame.nextgamedata.jsongamenextaway;
                var speak = checkddbnext.Item.output.conc;
             }
        
        return handlerInput.responseBuilder
            //.withSimpleCard('PSG News', lexresp.messages[0].content) // <--
            .withNextCard('PSG News','{"hometeamlogo": "'+hometeamlogo+'", "awayteamlogo": "'+awayteamlogo+'", "journey": "'+journey+'", "jsoncompetition": "'+jsoncompetition+'", "jsongamedate": "'+jsongamedate+'", "jsongamestadium": "'+jsongamestadium+'","jsongamenexthome": "'+jsongamenexthome+'", "jsongamenextaway":"'+jsongamenextaway+'"}') // <--
            .speak(speak)
            .reprompt(speak)
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
            var checkddbstand = await ddbcheckfn("standings");
            console.log("checkddbstand: ",checkddbstand);
             if (JSON.stringify(checkddbstand) === "{}") {
                    var paramslbd = {
                        FunctionName: 'PSGNewscast-dispatcher', /* required */
                        Payload: JSON.stringify({'sessionState': {'intent': {'name': 'StandingsIntent'}}})
                    };
                    console.log("track001");
                    var displast = await lambda.invoke(paramslbd).promise();
                    console.log("displast: ",JSON.parse(displast.Payload));
                    console.log("displast2: ",JSON.parse(displast.Payload).messages[0].content);
                    console.log("displast3: ",JSON.parse(displast.Payload).messages[0].content.standings);
                    var plot3 = JSON.parse(displast.Payload).messages[0].content.standings.standingsdata.substring(1).slice(0, -1);
                    console.log("plot3: ",plot3);
                    var plot4 = JSON.parse(displast.Payload).messages[0].content.fullstandings.fullstandingdataparse.substring(1).slice(0, -1);
                    console.log("plot4: ",plot4);
                    var plotmerge = [plot3,plot4]
                    console.log("plotmerge: ",plotmerge);
                    var speak = JSON.parse(displast.Payload).messages[0].content.conc;
             } else {
                    var plot3 = checkddbstand.Item.standings.standingsdata.substring(1).slice(0, -1);
                    console.log("plot3: ",plot3);
                    var plot4 = checkddbstand.Item.fullstandings.fullstandingdataparse.substring(1).slice(0, -1);
                    console.log("plot4: ",plot4);
                    var plotmerge = [plot3,plot4];
                    console.log("plotmerge: ",plotmerge);
                    var speak = checkddbstand.Item.output.conc;
             }
        
        return handlerInput.responseBuilder
            .withStandingsCard('PSG News','{"listdata": ['+plot3+','+plot4+']}')
            //.withStandingsCard('PSG News','{"listdata":'+plot3+'}')
            .speak(speak)
            .reprompt(speak)
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
            
        return handlerInput.responseBuilder

            .withSimpleCard('PSG News', "PSG Intro") // <--
            //.speak("Welcome to PSG newscast. What would you like to know today? You can ask for the last results, live, next game, position in the leaderboard, latest news, or music.<audio src='soundbank://soundlibrary/animals/amzn_sfx_bear_groan_roar_01'/>")
            .speak("<audio src='https://psgnewscast-skill2021.s3.amazonaws.com/PSG_Intro.mp3'/> ")
            .reprompt("<audio src='https://psgnewscast-skill2021.s3.amazonaws.com/PSG_Intro.mp3'/> ")
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
            var checkddbtwit = await ddbcheckfn("news");
            console.log("checkddbtwit: ",checkddbtwit);
            if (JSON.stringify(checkddbtwit) === "{}") {
                var paramslbd = {
                    FunctionName: 'PSGNewscast-dispatcher', /* required */
                    Payload: JSON.stringify({'sessionState': {'intent': {'name': 'TwitIntent'}}})
                };
                console.log("track001");
                var displast = await lambda.invoke(paramslbd).promise();
                console.log("displast: ",JSON.parse(displast.Payload));
                console.log("displast: ",JSON.parse(displast.Payload).messages[0].content);
                var plot3 = JSON.parse(displast.Payload).messages[0].content.livetweet.tweetslist;
                console.log("plot3: ",plot3);
                var speak = JSON.parse(displast.Payload).messages[0].content.conc;
            } else {
                var plot3 = checkddbtwit.Item.livetweet.tweetslist;
                var speak = checkddbtwit.Item.output.conc;
            }
            

        return handlerInput.responseBuilder

            .withNewsCard('PSG News','{"listdata":'+plot3+'}')            //.speak("Welcome to PSG newscast. What would you like to know today? You can ask for the last results, live, next game, position in the leaderboard, latest news, or music.<audio src='soundbank://soundlibrary/animals/amzn_sfx_bear_groan_roar_01'/>")
            .speak(speak)
            .reprompt(speak)
            .getResponse();
        
    }
};

const EggIntentHandler = {
    canHandle(handlerInput) {
        console.log("handlerInput2: ", handlerInput.requestEnvelope.request);
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && handlerInput.requestEnvelope.request.intent.name === 'EggIntent';
    },
    async handle(handlerInput) {
            console.log("lexreq2: ", handlerInput.requestEnvelope.request.intent.name);
            const repromptText = '';
            

        return handlerInput.responseBuilder
            .withEggCard('E. D. D. I. E.', "Eddie2070") // <--
            //.speak("Welcome to PSG newscast. What would you like to know today? You can ask for the last results, live, next game, position in the leaderboard, latest news, or music.<audio src='soundbank://soundlibrary/animals/amzn_sfx_bear_groan_roar_01'/>")
            .speak("Eddie Twenty Seventy ")
            .reprompt("E. D. D. I. E. ")
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
        console.log("handlerInputReflector: ", handlerInput.requestEnvelope.request);
        console.log("handlerInputReflectorarg: ", handlerInput.requestEnvelope.request.arguments[0]);
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

const GoBackHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'Alexa.Presentation.APL.UserEvent'
        && handlerInput.requestEnvelope.request.arguments[0] === 'goBack';
    },
    async handle(handlerInput) {
         return handlerInput.responseBuilder
            .withSimpleCard('PSG News', "Welcome to PSG Newscast") // <--
            //.speak("Welcome to PSG newscast. What would you like to know today? You can ask for the last results, live, next game, position in the leaderboard, latest news, or music.<audio src='soundbank://soundlibrary/animals/amzn_sfx_bear_groan_roar_01'/>")
            .speak("Welcome to PSG newscast. What would you like to know today? You can ask for the last results, live, next game, position in the leaderboard, latest news, or music.")
            .reprompt("Welcome to PSG newscast. What would you like to know today? You can ask for the last results, live, next game, position in the leaderboard, latest news, or music.")
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
        EggIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        GoBackHandler,
        IntentReflectorHandler)
    .addRequestInterceptors(require('./aplcard').APLHomeCardRequestInterceptor) // <---
    .addRequestInterceptors(require('./resultscard').APLHomeCardRequestInterceptor) // <---
    .addRequestInterceptors(require('./nextcard').APLHomeCardRequestInterceptor) // <---
    .addRequestInterceptors(require('./standingscard').APLHomeCardRequestInterceptor) // <---
    .addRequestInterceptors(require('./newscard').APLHomeCardRequestInterceptor) // <---
    .addRequestInterceptors(require('./eggcard').APLHomeCardRequestInterceptor) // <---
    .addErrorHandlers(
        ErrorHandler)
    .lambda();

