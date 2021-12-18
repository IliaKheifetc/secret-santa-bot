const { v4: uuidv4 } = require('uuid');

const WizardScene = require('telegraf/scenes/wizard');

const {
  ADMIN_BUTTONS,
  DEFAULT_BUTTONS,
  HASURA_ERROR_MESSAGES,
  SCENES,
  USER_ERROR_MESSAGES,
} = require('../constants.js');

const ApiSource = require('../api/ApiSource.js');
const {
  getRoomParticipants,
  updateRoomParticipants,
} = require('../graphql/roomsParticipants.js');
const { getRoomByDisplayedId, getRoomUsers } = require('../graphql/rooms.js');
const { getUser } = require('../graphql/users.js');

const { getPairs, getDisplayedIdFromRoomName } = require('../utils.js');

const askForRoomName = async (ctx) => {
  await ctx.reply(
    'Пожалуйста, введите название комнаты, для которой хотите распределить участников',
  );

  return ctx.wizard.next();
};

const checkIfUserIsAdmin = async (ctx) => {
  const { text: roomName, chat } = ctx.update.message;

  const roomDisplayedId = getDisplayedIdFromRoomName(roomName);

  if (!roomDisplayedId) {
    ctx.reply(USER_ERROR_MESSAGES.roomNotFound);

    return ctx.scene.leave();
  }

  // fetch room by roomName
  const getRoomResponse = await ApiSource.post({
    data: {
      query: getRoomByDisplayedId,
      variables: {
        displayedId: roomDisplayedId,
      },
      operationName: 'getRoomByDisplayedId',
    },
  });

  const room = getRoomResponse?.data?.rooms?.[0];

  if (!room) {
    ctx.reply(USER_ERROR_MESSAGES.roomNotFound);

    return ctx.scene.leave();
  }

  // fetch user adminOf field
  const getUserResponse = await ApiSource.graphql({
    query: getUser,
    variables: {
      userId: chat.id,
    },
    operationName: 'getUser',
    errorMessage: 'Error when executing getUser query: ',
  });
  const { users } = getUserResponse?.data || {};

  console.log('room', room);
  console.log('user[0]', users[0]);
  const isAdmin = users?.[0]?.adminOf.includes(room.id);

  if (isAdmin) {
    ctx.wizard.state.room = room;

    // https://github.com/telegraf/telegraf/issues/566
    ctx.wizard.next();
    return ctx.wizard.steps[ctx.wizard.cursor](ctx);
  } else {
    ctx.reply(
      'Только администратор комнаты может запускать распределение участников',
    );

    return ctx.scene.leave();
  }
};

const assignRecipients = async (ctx) => {
  const { room } = ctx.wizard.state;

  const getRoomUsersResponse = await ApiSource.graphql({
    query: getRoomUsers,
    variables: {
      roomId: room.id,
    },
    operationName: 'getRoomUsers',
    errorMessage: 'Error when executing getRoomUsers: ',
  });

  console.log('getRoomUsersResponse', getRoomUsersResponse);

  const {
    rooms_by_pk: { rooms_users: roomParticipants },
  } = getRoomUsersResponse?.data || {};

  console.log('roomParticipants', roomParticipants);

  // assign recipients for each participant randomly
  const pairsDictionary = getPairs(
    roomParticipants.map((roomParticipant) => roomParticipant.user.id),
  );

  console.log('pairsDictionary', pairsDictionary);

  // save recipients info into rooms_participants
  roomParticipants.forEach(async (roomParticipant) => {
    const recipientId = pairsDictionary[roomParticipant.user.id];

    const response = await ApiSource.graphql({
      query: updateRoomParticipants,
      variables: {
        roomId: room.id,
        userId: roomParticipant.user.id,
        recipientId,
      },
      operationName: 'updateRoomParticipants',
      errorMessage: 'Error when executing updateRoomParticipants: ',
    });

    const recipient = roomParticipants?.find(
      (roomParticipant) => roomParticipant.user.id === recipientId,
    );

    console.log('recipientId', recipientId);
    console.log('recipient', recipient);

    // notify a participant about their corresponding recipient
    ctx.reply(
      `Для Вас был выбран участник ${recipient.user.FIO}, Вам нужно отправить ему/ей подарок!`,
    );
  });

  return ctx.scene.leave();
};

const assignRecipientsScene = new WizardScene(
  SCENES.assignRecipients,
  askForRoomName,
  checkIfUserIsAdmin,
  assignRecipients,
);

module.exports = assignRecipientsScene;
