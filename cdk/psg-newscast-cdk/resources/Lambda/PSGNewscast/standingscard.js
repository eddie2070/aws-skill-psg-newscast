const APLHomeCardRequestInterceptor = {
    process(handlerInput) {
        const withStandingsCard = handlerInput.responseBuilder.withStandardCard;
        console.log("payload: ",handlerInput);
        console.log("payload2: ",handlerInput.context.succeed);
        function withStandingsAPLCard(cardTitle, cardContent){
            console.log("cardContent: ",cardContent);
            var sourcingdata = JSON.stringify(cardContent).toString().replace(/\\/g, "").substring(1).slice(0, -1);
            console.log("sourcingdata: ",sourcingdata);
            //console.log("JSON.parse(cardContent).hometeamlogo: ",JSON.parse(cardContent).hometeamlogo);
            if(supportsAPL(handlerInput)){
                var toto = handlerInput.responseBuilder.addDirective({
                    type: 'Alexa.Presentation.APL.RenderDocument',
                    version: '1.0',
                    document: APLDoc,
                    datasources: {
                        "assets": {
                                //"home": JSON.parse(cardContent).hometeamlogo.toString(),//JSON.parse(cardContent).hometeamlogo, //"https://medias.lequipe.fr/logo-football/26/120-2021-2022",
                                //"away": JSON.parse(cardContent).awayteamlogo //"https://medias.lequipe.fr/logo-football/6/120-2021-2022"
                        },
                         "standings": {
                        //     "positioncard": JSON.parse(cardContent).positioncard,
                        //     "points": JSON.parse(cardContent).points,
                        //     "teamaheadname": JSON.parse(cardContent).teamaheadname,
                        //     "teamaheadposition": JSON.parse(cardContent).teamaheadposition,
                        //     "teamaheadpoints": JSON.parse(cardContent).teamaheadpoints,
                        //     "teambehindname": JSON.parse(cardContent).teambehindname,
                        //     "teambehindposition": JSON.parse(cardContent).teambehindposition,
                        //     "teambehindpoints": JSON.parse(cardContent).teambehindpoints
                         },
                        "sourcing": JSON.parse(sourcingdata)
                        //{"listdata": [ {"score": 12, "listItemIdentifier": "1", "ordinalNumber": "1", "text": "Paris SG", "position": 1, "token": "1"},{"score": 12, "listItemIdentifier": "1", "ordinalNumber": "1", "text": "Paris SG", "position": 1, "token": "1"}]}
                        //{ "listdata":
//                          [
//   {
//     score: 12,
//     listItemIdentifier: '1',
//     ordinalNumber: '1',
//     text: 'Paris SG',
//     position: 1,
//     token: '1'
//   },
//   {
//     score: 10,
//     listItemIdentifier: '2',
//     ordinalNumber: 2,
//     text: 'Angers SCO',
//     position: 2,
//     token: '2'
//   },
//   {
//     score: 8,
//     listItemIdentifier: '2',
//     ordinalNumber: 2,
//     text: 'Clermont Foot 63',
//     position: 3,
//     token: '2'
//   }
// }
            },
                    templateData: {
                            "header": cardTitle,
                            "text": cardContent,
                            // default background for simple card
                            "backgroundSmall": "",
                            //"backgroundLarge": "https://i.etsystatic.com/11598164/r/il/a180b4/824313786/il_1588xN.824313786_qt51.jpg",
                            "backgroundLarge": "https://w0.peakpx.com/wallpaper/26/11/HD-wallpaper-psg-french-football-club-logo-blue-fabric-background-t-shirt-emblem-paris-saint-germain-france-football.jpg",
                            "headerAttributionImage": "https://nationaldailyng.com/wp-content/uploads/2019/06/AS.png"
                        }
                });
            }
            withStandingsCard(cardTitle, cardContent);
            console.log("toto: ", toto);
            return handlerInput.responseBuilder;
        }

        handlerInput.responseBuilder.withStandingsCard = (...args) => withStandingsAPLCard(...args);
    }
};

function supportsAPL(handlerInput){
    const {supportedInterfaces} = handlerInput.requestEnvelope.context.System.device;
    return supportedInterfaces['Alexa.Presentation.APL'];
}

function deviceType(handlerInput){
    if(supportsAPL(handlerInput)){
        const {Viewport} = handlerInput.requestEnvelope.context;
        const resolution = Viewport.pixelWidth + 'x' + Viewport.pixelHeight;
        switch(resolution){
            case "480x480": return "EchoSpot";
            case "960x480": return "EchoShow5";
            case "1024x600": return "EchoShow";
            case "1200x800": return "FireHD8";
            case "1280x800": return "EchoShow2";
            case "1920x1080": return "FireTV";
            case "1920x1200": return "FireHD10";
            default: return "unknown";
        }
    } else {
        return "screenless";
    }
}

const APLDoc = 
{
    "type": "APL",
    "version": "1.5",
    "settings": {},
    "theme": "dark",
    "background": "black",
    "import": [
        {
            "name": "alexa-layouts",
            "version": "1.4.0"
        }
    ],
    "mainTemplate": {
        "parameters": [
            "payload",
            "sourcing"
        ],
        "items": [
            {
                "type": "Container",
                "items": [
                    {
                        "type": "AlexaBackground",
                        "colorOverlay": "True",
                        "backgroundImageSource": "https://w0.peakpx.com/wallpaper/26/11/HD-wallpaper-psg-french-football-club-logo-blue-fabric-background-t-shirt-emblem-paris-saint-germain-france-football.jpg"
                    },
                    {
                        "type": "Container",
                        "items": [
                            {
                                "type": "Frame",
                                "item": {
                                    "type": "Container",
                                    "width": "100vw",
                                    "height": "100vh",
                                    "direction": "column",
                                    "items": [
                                        {
                                            "type": "AlexaBackground",
                                            "colorOverlay": "True",
                                            "backgroundImageSource": "https://w0.peakpx.com/wallpaper/26/11/HD-wallpaper-psg-french-football-club-logo-blue-fabric-background-t-shirt-emblem-paris-saint-germain-france-football.jpg"
                                        },
                                        {
                                            "type": "AlexaHeader",
                                            "headerTitle": "Position in the leaderboard",
                                            "headerAttributionImage": "${logo}",
                                            "headerBackButton": true,
                                            "headerBackButtonCommand": [	
                                                {"type":"SendEvent","arguments":["goBack"],
                                                "components": [ "idForTheTextComponent"]
                                                }
                                            ],
                                        },
                                        {
                                            "direction": "row",
                                            "items": [
                                                {
                                                    "text": "#",
                                                    "maxLines": 1,
                                                    "fontSize": "${@viewportProfile == @hubLandscapeLarge ? '50dp' : '50dp'}",
                                                    "textAlign": "left",
                                                    "color": "#AADDAA",
                                                    "textAlignVertical": "Center",
                                                    "type": "Text",
                                                    "width": "15vw",
                                                    "paddingTop": "30",
                                                    "paddingLeft": "0",
                                                    "paddingBottom": "50"
                                                },
                                                {
                                                    "text": "Teams",
                                                    "maxLines": 1,
                                                    "fontSize": "${@viewportProfile == @hubLandscapeLarge ? '50dp' : '50dp'}",
                                                    "textAlign": "left",
                                                    "color": "#AADDAA",
                                                    "textAlignVertical": "center",
                                                    "type": "Text",
                                                    "width": "45vw",
                                                    "paddingTop": "30",
                                                    "paddingLeft": "130",
                                                    "paddingBottom": "50"
                                                },
                                                {
                                                    "text": "Points",
                                                    "fontSize": "${@viewportProfile == @hubLandscapeLarge ? '50dp' : '50dp'}",
                                                    "color": "#AADDAA",
                                                    "textAlign": "left",
                                                    "textAlignVertical": "center",
                                                    "type": "Text",
                                                    "paddingLeft": "0",
                                                    "paddingTop": "30",
                                                    "paddingBottom": "50"
                                                }
                                            ],
                                            "type": "Container",
                                            "when": "${viewport.shape != 'round'}",
                                            "paddingLeft": "${@viewportProfile == @hubLandscapeLarge ? '150' : '150'}"
                                        },
                                        {
                                            "type": "Sequence",
                                            "data": "${sourcing.listdata}",
                                            "scrollDirection": "vertical",
                                            "numbered": true,
                                            "grow": 1,
                                            "shrink": 1,
                                            "item": {
                                                "type": "TouchWrapper",
                                                "item": {
                                                    "type": "Container",
                                                    "direction": "row",
                                                    "height": 100,
                                                    "alignItems": "start",
                                                    "items": [
                                                        {
                                                            "type": "Text"
                                                        },
                                                        {
                                                            "type": "Text",
                                                            "text": "${data.position}",
                                                            "style": "textStylePrimary2",
                                                            "grow": 1,
                                                            "shrink": 1,
                                                            "spacing": 150
                                                        },
                                                        {
                                                            "type": "Text",
                                                            "text": "${data.text}",
                                                            "style": "textStylePrimary2",
                                                            "textAlign": "left",
                                                            "width": "12vw",
                                                            "grow": 1,
                                                            "shrink": 1,
                                                            "spacing": 24
                                                        },
                                                        {
                                                            "type": "Text",
                                                            "text": "${data.score}",
                                                            "style": "textStylePrimary2",
                                                            "textAlign": "left",
                                                            "grow": 1,
                                                            "shrink": 1,
                                                            "spacing": 40
                                                        }
                                                    ]
                                                }
                                            }
                                        },
                                        {
                                            "type": "Text",
                                            "when": "${viewport.shape == 'round'}",
                                            "height": "80dp"
                                        }
                                    ]
                                }
                            }
                        ],
                        "height": "100%",
                        "width": "100%",
                        "direction": "row",
                        "wrap": "noWrap"
                    }
                ],
                "height": "100%",
                "width": "100%",
                "direction": "column",
                "wrap": "noWrap"
            }
        ]
    }
}

module.exports = {
    APLHomeCardRequestInterceptor
};