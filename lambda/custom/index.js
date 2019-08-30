
/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');
const dbHelper = require('./helpers/dbHelper');
const GENERAL_REPROMPT = "What would you like to do?";
const dynamoDBTableName = "FlashiestCard"; //use your db name here

//change to your Dynamodb table name; have `userId` as a partrition key, and `front` as a sort key for this to work. 
// also create an item in Dynamodb as `back` --- append it after front.

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechText = 'Welcome to dynamo cards. You can give the following commands: add, followed by a topic to create a card. Get cards, to see existing cards. Remove card, to get rid of a card. Or study cards, to randomly generate one of your existing cards. Which will it be?';
    const repromptText = 'What would you like to do? You can say HELP to get available options';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .getResponse();
  },
};

const InProgressAddCardIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'AddCardIntent' &&
      request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    return handlerInput.responseBuilder
      .addDelegateDirective(currentIntent)
      .getResponse();
  }
}

const AddCardIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AddCardIntent';
  },
  async handle(handlerInput) {
    const {responseBuilder } = handlerInput;
    const userID = handlerInput.requestEnvelope.context.System.user.userId; 
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const card = slots.card.value;
    const answer = slots.answer.value;
    return dbHelper.addCard(answer, card, userID)
      .then((data) => {
        const speechText = `You have added ${card} as a card. You can say add to add another one or remove to remove a card`;

        return responseBuilder
          .speak(speechText)
          .reprompt(GENERAL_REPROMPT)
          .getResponse();
      })
      .catch((err) => {
        console.log("Error occured while saving your card", err);
        const speechText = "we cannot save your card right now. Try again!"
        return responseBuilder
          .speak(speechText)
          .getResponse();
      })
  },
};

const GetCardsIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'GetCardsIntent';
  },
  async handle(handlerInput) {
    const {responseBuilder } = handlerInput;
    const userID = handlerInput.requestEnvelope.context.System.user.userId; 
    return dbHelper.getCards(userID)
      .then((data) => {
        let speechText = 'Your cards are ';
        // data.<your own table properties here>
        if(data.length === 1) {
          speechText = `You only have ${data.length} card, which is ${data[0].cardTitle}`
        }
        else if (data.length === 0) {
          speechText = "You do not have any cards yet, add a card by saying add, followed by a topic or question."
        } else {
          speechText += data.map(e => e.cardTitle).join(", ")
        }
        return responseBuilder
          .speak(speechText)
          .reprompt(GENERAL_REPROMPT)
          .getResponse();
      })
      .catch((err) => {
        const speechText = "we cannot get your card right now. Try again!"
        return responseBuilder
          .speak(speechText)
          .getResponse();
      })
  }
}

const TestMeIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'TestMeIntent';
  },
  async handle(handlerInput) {
    let testAnswer;
    const {responseBuilder } = handlerInput;
    const userID = handlerInput.requestEnvelope.context.System.user.userId; 
    return dbHelper.getCards(userID)
      .then((data) => {
        let arr = data.map(e => e);
        let randomCard = Math.floor(Math.random()*arr.length);

        // make sure data is corresponding to your own table properties 
        // data[randomCard].<your property here>

        let speechText = `your card is ${data[randomCard].cardTitle}`;
        testAnswer = `The answer was ${data[randomCard].cardContent}`;

        return responseBuilder
          .speak(speechText)
          .reprompt(testAnswer)
          .getResponse();
      })
      .catch((err) => {
        const speechText = "we cannot get your card right now. Try again!"
        return responseBuilder
          .speak(speechText)
          .getResponse();
      })
  }
}


const InProgressRemoveCardIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'RemoveCardIntent' &&
      request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    return handlerInput.responseBuilder
      .addDelegateDirective(currentIntent)
      .getResponse();
  }
}

const RemoveCardIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'RemoveCardIntent';
  }, 
  handle(handlerInput) {
    const {responseBuilder } = handlerInput;
    const userID = handlerInput.requestEnvelope.context.System.user.userId; 
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const card = slots.card.value;
    // const answer = slots.answer.value;
    return dbHelper.removeCard(card, userID)
      .then((data) => {
        const speechText = `You have removed ${card}, you can add another one by saying add`
        return responseBuilder
          .speak(speechText)
          .reprompt(GENERAL_REPROMPT)
          .getResponse();
      })
      .catch((err) => {
        console.log("Error occured while removing card", err);
        const speechText = `You do not have a card called ${card}, you can add it by saying add`
        return responseBuilder
          .speak(speechText)
          .reprompt(GENERAL_REPROMPT)
          .getResponse();
      })
  }
}

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'You can introduce yourself by telling me your name';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    InProgressAddCardIntentHandler,
    AddCardIntentHandler,
    GetCardsIntentHandler,
    TestMeIntentHandler,
    InProgressRemoveCardIntentHandler,
    RemoveCardIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .withTableName(dynamoDBTableName)
  .withAutoCreateTable(true)
  .lambda();


