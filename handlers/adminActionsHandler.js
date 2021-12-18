const { v4: uuidv4 } = require('uuid');

const { ADMIN_BUTTONS, SCENES } = require('../constants.js');

const ApiSource = require('../api/ApiSource.js');
// const { addRoom, getRooms } = require('../api/rooms.js');
// const { addUser } = require('../api/users.js');
const {
  getRoomParticipants,
  updateRoomParticipants,
} = require('../graphql/roomsParticipants.js');
const { getPairs } = require('../utils.js');

const assignRecipients = async (ctx) => {
  const { rooms_participants: roomParticipants } = await ApiSource.graphql({
    query: getRoomParticipants,
    variables: {
      roomId: '8f870640-38e2-4d13-956a-0f3d02b2a746',
    },
    operationName: 'getRoomParticipants',
    errorMessage: 'Error when executing getRoomParticipants: ',
  });

  // assign recipients for each participant randomly
  const pairsDictionary = getPairs(
    roomParticipants.map((roomParticipant) => roomParticipant.userId),
  );

  console.log('pairsDictionary', pairsDictionary);

  // save recipients info into rooms_participants
  roomParticipants.forEach(async (roomParticipant) => {
    const response = await ApiSource.graphql({
      query: updateRoomParticipants,
      variables: {
        roomId: '8f870640-38e2-4d13-956a-0f3d02b2a746',
        userId: roomParticipant.userId,
        recipientId: pairsDictionary[roomParticipant.userId],
      },
      operationName: 'updateRoomParticipants',
      errorMessage: 'Error when executing updateRoomParticipants: ',
    });

    // notify a participant about their corresponding recipient
    ctx.reply(
      `Для Вас был выбран участник с id ${
        pairsDictionary[roomParticipant.userId]
      }, Вам нужно отправить ему/ей подарок!`,
    );
  });
};

const adminActionsHandler = (bot) => {
  bot.hears(ADMIN_BUTTONS.viewRoomInfo.text, async (ctx) => {});

  bot.hears('Распределить участников', (ctx) => {
    ctx.scene.enter(SCENES.assignRecipients);
  });
};

module.exports = adminActionsHandler;
