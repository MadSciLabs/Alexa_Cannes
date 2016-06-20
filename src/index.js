/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * This sample shows how to create a Lambda function for handling Alexa Skill requests that:
 *
 * - Web service: communicate with an external web service to get events for specified days in history (Wikipedia API)
 * - Pagination: after obtaining a list of events, read a small subset of events and wait for user prompt to read the next subset of events by maintaining session state
 * - Dialog and Session state: Handles two models, both a one-shot ask and tell model, and a multi-turn dialog model.
 * - SSML: Using SSML tags to control how Alexa renders the text-to-speech.
 *
 * Examples:
 * One-shot model:
 * User:  "Alexa, ask History Buff what happened on August thirtieth."
 * Alexa: "For August thirtieth, in 2003, [...] . Wanna go deeper in history?"
 * User: "No."
 * Alexa: "Good bye!"
 *
 * Dialog model:
 * User:  "Alexa, open History Buff"
 * Alexa: "History Buff. What day do you want events for?"
 * User:  "August thirtieth."
 * Alexa: "For August thirtieth, in 2003, [...] . Wanna go deeper in history?"
 * User:  "Yes."
 * Alexa: "In 1995, Bosnian war [...] . Wanna go deeper in history?"
 * User: "No."
 * Alexa: "Good bye!"
 */


/**
 * App ID for the skill
 */

var https = require('https');
var http = require('http');

var APP_ID = undefined; //replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

/**
 * The AlexaSkill Module that has the AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * URL prefix to download history content from Wikipedia
 */
var urlPrefix = 'https://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&explaintext=&exsectionformat=plain&redirects=&titles=';

/**
 * Variable defining number of events to be read at one time
 */
var paginationSize = 3;

/**
 * Variable defining the length of the delimiter between events
 */
var delimiterSize = 2;

/**
 * HistoryBuffSkill is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var HistoryBuffSkill = function() {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
HistoryBuffSkill.prototype = Object.create(AlexaSkill.prototype);
HistoryBuffSkill.prototype.constructor = HistoryBuffSkill;

HistoryBuffSkill.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("HistoryBuffSkill onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // any session init logic would go here
};

HistoryBuffSkill.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("HistoryBuffSkill onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    getWelcomeResponse(session, response);
};

HistoryBuffSkill.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // any session cleanup logic would go here
};

HistoryBuffSkill.prototype.intentHandlers = {

    "YesNoIntent": function (intent, session, response) {
        handleYesNoRequest(intent, session, response);
    },

    "ContinueIntent": function (intent, session, response) {
        handleContinueRequest(intent, session, response);
    },

    "QuestionIntent": function (intent, session, response) {
        handleQuestionRequest(intent, session, response);
    },

    "DayOfWeekIntent": function (intent, session, response) {
        handleDayOfWeekRequest(intent, session, response);
    },
    "WashHandsIntent": function (intent, session, response) {
        handleWashHandsRequest(intent, session, response);
    },

    "GoToIntent": function (intent, session, response) {
        handleGoToRequest(intent, session, response);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        var speechText = "Tell child o rama what you would like to do, such as: create a story or play a game";
        var repromptText = "Would you like to create a story or play a game?";
        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        var repromptOutput = {
            speech: repromptText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.ask(speechOutput, repromptOutput);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = {
                speech: "See ya later",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = {
                speech: "See ya later",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.tell(speechOutput);
    }
};

function getColor(_color) {
//function getJsonEventsTest(eventCallback) {

    var url = "http://50.112.244.54/alexa/" + _color;

    http.get(url, function(res) {

        var body = '';

        /*
        res.on('data', function (chunk) {
            body += chunk;
        });

        res.on('end', function () {
            //var stringResult = parseJson(body);
            //eventCallback(stringResult);
        };
        */
    });
}

/**
 * Function to handle the onLaunch skill behavior
 */



function getWelcomeResponse(session, response) {

    // If we wanted to initialize the session to have some attributes we could add those here.
    var cardTitle = "There";
    var repromptText = "Would you like to learn, laugh, or make.";
    
    var speechText = "<audio src=\"https://s3.amazonaws.com/lab-alexa/there/n1.mp3\" />";
    //var speechText = "<audio src=\"https://s3.amazonaws.com/lab-alexa/hear/learn_intro.mp3\" />";

    var cardOutput = "Would you like to learn, laugh, or make.";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.

    session.attributes.myState = 0;
    session.attributes.stateName = "Welcome back to There";

    //speechText = session.attributes.stateName;

    var speechOutput = {
        speech: "<speak>" + speechText + "</speak>",
        type: AlexaSkill.speechOutputType.SSML
    };
    var repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };

    response.askWithCard(speechOutput, repromptOutput, cardTitle, cardOutput);

    //var sessionAttributes = {};
    //sessionAttributes.myState = 0;
    //session.attributes = sessionAttributes;
}

function getNextPrompt(_val, session, response, _state) {

    var speechText = "";

    if (!session.attributes.myState)
    {
        session.attributes.myState = 0;
        session.attributes.stateName = "Welcome";
        speechText = "<audio src=\"https://s3.amazonaws.com/lab-alexa/there/n1.mp3\" />";
    }

    switch (_state) {

        case 0:

            session.attributes.myState = 1;
            speechText = "<audio src=\"https://s3.amazonaws.com/lab-alexa/there/n2.mp3\" />";
            break;

        case 1:

            session.attributes.myState = 2;
            speechText = "<audio src=\"https://s3.amazonaws.com/lab-alexa/there/n3.mp3\" />";
            break;

        case 2:

            session.attributes.myState = 3;
            speechText = "<audio src=\"https://s3.amazonaws.com/lab-alexa/there/n4.mp3\" />";
            break;

        case 3:

            session.attributes.myState = 4;
            speechText = "<audio src=\"https://s3.amazonaws.com/lab-alexa/there/n5.mp3\" />";
            break;

        case 4:

            session.attributes.myState = 5;
            speechText = "<audio src=\"https://s3.amazonaws.com/lab-alexa/there/n6.mp3\" />";
            break;

        case 5:

            session.attributes.myState = 6;
            speechText = "<audio src=\"https://s3.amazonaws.com/lab-alexa/there/n7.mp3\" />";
            break;

        case 6:

            session.attributes.myState = 8;
            session.attributes.stateName = "Ok, hope you enjoy it.";

            speechText = "<audio src=\"https://s3.amazonaws.com/lab-alexa/there/n8.mp3\" /><audio src=\"https://s3.amazonaws.com/lab-alexa/there/g1.mp3\" />";
            break;

        case 8:

            //if (_val == "Wednesday") {
            if (1 == 1)
            {

                session.attributes.stateName = "9 - Story - Wednesday";
                session.attributes.myState = 9;

                speechText = "<audio src=\"https://s3.amazonaws.com/lab-alexa/there/g2.mp3\" />";
            } else {

                session.attributes.stateName = "10 - Story - Not Wednesday";
                session.attributes.myState = 10;

                speechText = "<audio src=\"https://s3.amazonaws.com/lab-alexa/there/g5.mp3\" />";
            }
            break;

        case 9:
        case 10:

            if (_val == "washes hands" || _val == "washes his hands") {

                session.attributes.stateName = "11 - Story - Wash";
                session.attributes.myState = 11;

                speechText = "<audio src=\"https://s3.amazonaws.com/lab-alexa/there/g4.mp3\" />";

            } else {

                session.attributes.stateName = "12 - Story - Not Wash";
                session.attributes.myState = 11;

                speechText = "<audio src=\"https://s3.amazonaws.com/lab-alexa/there/g3.mp3\" />";
            }
            break;

        case 11:

            speechText = "<audio src=\"https://s3.amazonaws.com/lab-alexa/there/n9.mp3\" />";
            break;
    }

    var repromptText = "Reprompt";
    var cardTitle = "Card title";
    var cardContent = "Card content";

    
    if (speechText == "") {
        speechText = session.attributes.stateName;
    }

    /*
    if (_val == 12) {
        speechText = "<audio src=\"https://s3.amazonaws.com/lab-alexa/hear/body_4.mp3\" /><audio src=\"https://s3.amazonaws.com/lab-alexa/hear/body_6.mp3\" /><audio src=\"https://s3.amazonaws.com/lab-alexa/hear/body_8.mp3\" /><audio src=\"https://s3.amazonaws.com/lab-alexa/hear/body_9.mp3\" /><audio src=\"https://s3.amazonaws.com/lab-alexa/hear/body_10.mp3\" />";
    } else {
        speechText = "<audio src=\"https://s3.amazonaws.com/lab-alexa/hear/body_5.mp3\" />";
    }
    */

    var speechOutput = {
                speech: "<speak>" + speechText + "</speak>",
                type: AlexaSkill.speechOutputType.SSML
            };

    var repromptOutput = {
                speech: repromptText,
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };

    response.askWithCard(speechOutput, repromptOutput, cardTitle, cardContent);
}

function handleYesNoRequest(intent, session, response) {

    var _yesno = "";

    if (intent.slots.myyesno) {

        _yesno = intent.slots.myyesno.value;
    }

    getNextPrompt(_yesno,session,response,session.attributes.myState);
}

function handleContinueRequest(intent, session, response) {

    getNextPrompt("",session,response,session.attributes.myState);
}

function handleQuestionRequest(intent, session, response) {

    var _question = "";

    if (intent.slots.myquestion) {
        _question = intent.slots.myquestion.value;
    }

    getNextPrompt(_question,session,response,session.attributes.myState);
}

function handleDayOfWeekRequest(intent, session, response) {

    var _day = "";

    if (intent.slots.mydayofweek) {
        _day = intent.slots.mydayofweek.value;
    }

    getNextPrompt(_day,session,response,session.attributes.myState);
}

function handleWashHandsRequest(intent, session, response) {

    var _wash = "";

    if (intent.slots.mywashhands) {
        _wash = intent.slots.mywashhands.value;
    }

    getNextPrompt(_wash,session,response,session.attributes.myState);
}

function handleGoToRequest(_val, session, response) {

    _num = 8;

/*
    switch (_val) {

        case "one":
            _num = 1;
            break;
        case "two":
            _num = 2;
            break;
        case "three":
            _num = 3;
            break;
        case "four":
            _num = 4;
            break;
        case "five":
            _num = 5;
            break;
        case "six":
            _num = 6;
            break;
        case "seven":
            _num = 7;
            break;
        case "eight":
            _num = 8;
            break;
        case "nine":
            _num = 9;
            break;
        case "ten":
            _num = 10;
            break;
    }
*/

    session.attributes.myState = 8;

    getNextPrompt("", session, response, _num);

    //var sessionAttributes = {};
    //sessionAttributes.myState = 0;
    //session.attributes = sessionAttributes;
}

function handleColorRequest(intent, session, response) {

   var _color = "";

    if (intent.slots.mycolor) {
        _color = intent.slots.mycolor.value;

        getColor(_color);
    }

    var repromptText = "What color?";

    var cardTitle = "Card title";
    var cardContent = "Card content";
    
    var sessionAttributes = {};

    speechText = "Color " + _color;
    //sessionAttributes.mychoice = _choice;

    var speechOutput = {
                speech: "<speak>" + speechText + "</speak>",
                type: AlexaSkill.speechOutputType.SSML
            };

    var repromptOutput = {
                speech: repromptText,
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };

    response.askWithCard(speechOutput, repromptOutput, cardTitle, cardContent);
}

/*
function handleSelectionEventRequest(intent, session, response) {

   var _choice = "";

    if (intent.slots.mychoice) {
        _choice = intent.slots.mychoice.value;
    }

    var repromptText = "Can you count to seven?";

    var cardTitle = "Card title";
    var cardContent = "Card content";
    
    var sessionAttributes = {};

    speechText = "Selected " + _choice;
    sessionAttributes.mychoice = _choice;

    if (_choice == "learn")
    {

        speechText = "<audio src=\"https://s3.amazonaws.com/lab-alexa/hear/body_1.mp3\" />"
    } else {

        speechText = "Would you like to learn, laugh, or make. Please select learn. It's all I can do right now.";
    }

    var speechOutput = {
                speech: "<speak>" + speechText + "</speak>",
                type: AlexaSkill.speechOutputType.SSML
            };

    var repromptOutput = {
                speech: repromptText,
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };

    response.askWithCard(speechOutput, repromptOutput, cardTitle, cardContent);
}
*/

/**
 * Gets a poster prepares the speech to reply to the user.
 */
 /*
function handleCountSevenEventRequest(intent, session, response) {

    var _val = "";

    var repromptText = "Can you count to thirty?";

    var cardTitle = "Card title";
    var cardContent = "Card content";
    
    var sessionAttributes = {};
    
    speechText = "<audio src=\"https://s3.amazonaws.com/lab-alexa/hear/body_2.mp3\" />";

    var speechOutput = {
                speech: "<speak>" + speechText + "</speak>",
                type: AlexaSkill.speechOutputType.SSML
            };

    var repromptOutput = {
                speech: repromptText,
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };

    response.askWithCard(speechOutput, repromptOutput, cardTitle, cardContent);
}
*/
/*
function handleCountThirtyEventRequest(intent, session, response) {

    var _val = "";

    var repromptText = "How many months are in a year?";

    var cardTitle = "Card title";
    var cardContent = "Card content";
    
    var sessionAttributes = {};
    
    speechText = "<audio src=\"https://s3.amazonaws.com/lab-alexa/hear/body_3.mp3\" />";

    var speechOutput = {
                speech: "<speak>" + speechText + "</speak>",
                type: AlexaSkill.speechOutputType.SSML
            };

    var repromptOutput = {
                speech: repromptText,
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };

    response.askWithCard(speechOutput, repromptOutput, cardTitle, cardContent);
}
*/
/*
function handleHowManyMonthsRequest(intent, session, response) {

    var _val = "";

    if (intent.slots.num) {
        _val = intent.slots.num.value;
    }

    var repromptText = "How many months are in a year?";

    var cardTitle = "Card title";
    var cardContent = "Card content";
    
    var sessionAttributes = {};
    
    if (_val == 12) {
        speechText = "<audio src=\"https://s3.amazonaws.com/lab-alexa/hear/body_4.mp3\" /><audio src=\"https://s3.amazonaws.com/lab-alexa/hear/body_6.mp3\" /><audio src=\"https://s3.amazonaws.com/lab-alexa/hear/body_8.mp3\" /><audio src=\"https://s3.amazonaws.com/lab-alexa/hear/body_9.mp3\" /><audio src=\"https://s3.amazonaws.com/lab-alexa/hear/body_10.mp3\" />";
    } else {
        speechText = "<audio src=\"https://s3.amazonaws.com/lab-alexa/hear/body_5.mp3\" />";
    }

    var speechOutput = {
                speech: "<speak>" + speechText + "</speak>",
                type: AlexaSkill.speechOutputType.SSML
            };

    var repromptOutput = {
                speech: repromptText,
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };

    response.askWithCard(speechOutput, repromptOutput, cardTitle, cardContent);
}
*/


/**
 * Gets a poster prepares the speech to reply to the user.
 */


function getJsonEventsFromWikipedia(day, date, eventCallback) {
    var url = urlPrefix + day + '_' + date;

    https.get(url, function(res) {
        var body = '';

        res.on('data', function (chunk) {
            body += chunk;
        });

        res.on('end', function () {
            var stringResult = parseJson(body);
            eventCallback(stringResult);
        });
    }).on('error', function (e) {
        console.log("Got error: ", e);
    });
}

function parseJson(inputText) {
    // sizeOf (/nEvents/n) is 10
    var text = inputText.substring(inputText.indexOf("\\nEvents\\n")+10, inputText.indexOf("\\n\\n\\nBirths")),
        retArr = [],
        retString = "",
        endIndex,
        startIndex = 0;

    if (text.length == 0) {
        return retArr;
    }

    while(true) {
        endIndex = text.indexOf("\\n", startIndex+delimiterSize);
        var eventText = (endIndex == -1 ? text.substring(startIndex) : text.substring(startIndex, endIndex));
        // replace dashes returned in text from Wikipedia's API
        eventText = eventText.replace(/\\u2013\s*/g, '');
        // add comma after year so Alexa pauses before continuing with the sentence
        eventText = eventText.replace(/(^\d+)/,'$1,');
        eventText = 'In ' + eventText;
        startIndex = endIndex+delimiterSize;
        retArr.push(eventText);
        if (endIndex == -1) {
            break;
        }
    }
    if (retString != "") {
        retArr.push(retString);
    }
    retArr.reverse();
    return retArr;
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the HistoryBuff Skill.
    var skill = new HistoryBuffSkill();
    skill.execute(event, context);
};

