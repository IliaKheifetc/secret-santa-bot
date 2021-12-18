const WizardScene = require('telegraf/scenes/wizard');

const {
  ADMIN_BUTTONS,
  DEFAULT_BUTTONS,
  HASURA_ERROR_MESSAGES,
  SCENES,
  USER_ERROR_MESSAGES,
} = require('../constants.js');
const ApiSource = require('../api/ApiSource.js');
const { addUser, updateUserFIO } = require('../graphql/users.js');
const { addRoomParticipant } = require('../graphql/roomsParticipants.js');
const { getRoomByDisplayedId } = require('../graphql/rooms.js');
const { getDisplayedIdFromRoomName } = require('../utils.js');

const askForRoomName = async (ctx) => {
  await ctx.reply('Введите название комнаты, к которой хотите присоединиться');

  return ctx.wizard.next();
};

const handleRoomNameInput = async (ctx) => {
  try {
    const { text: roomName, chat } = ctx.update.message;

    const roomDisplayedId = getDisplayedIdFromRoomName(roomName);

    if (!roomDisplayedId) {
      ctx.reply(USER_ERROR_MESSAGES.roomNotFound);

      return ctx.scene.leave();
    }

    let room;

    try {
      const response = await ApiSource.post({
        data: {
          query: getRoomByDisplayedId,
          variables: {
            displayedId: roomDisplayedId,
          },
          operationName: 'getRoomByDisplayedId',
        },
      });

      room = response?.data?.rooms?.[0];
      console.log({ room });
    } catch (err) {
      console.error('Error when executing getRoomByDisplayedId query: ', err);
    }

    if (!room) {
      await ctx.reply(USER_ERROR_MESSAGES.roomNotFound);
      return ctx.scene.leave();
    }

    ctx.wizard.state.room = room;

    // because of weird telegraf's WizardScene mechanics, need to send prompt message in the end of that handler
    /// instead of int the next one, so it correctly transitions from one handler to the next

    // https://github.com/telegraf/telegraf/issues/566
    ctx.wizard.next();
    return ctx.wizard.steps[ctx.wizard.cursor](ctx);
  } catch (err) {
    console.error('handleRoomNameInput', err);
  }
};

const askForFIO = async (ctx) => {
  await ctx.reply('Введите ваши ФИО');

  return ctx.wizard.next();
};

const addUserAndRoomParticipant = async (ctx) => {
  console.log('ctx', ctx);
  const { text: fio, chat } = ctx.update.message;
  const { room } = ctx.wizard.state;

  console.log({ chat });

  const addUserResponse = await ApiSource.graphql({
    query: addUser,
    variables: {
      object: {
        // adminOf: "",
        id: chat.id,
        FIO: fio,
      },
    },
    operationName: 'addUser',
    errorMessage: 'Error when executing addUser mutation: ',
  });

  if (addUserResponse.errors) {
    const userAlreadyExists = addUserResponse.errors[0]?.message.includes(
      HASURA_ERROR_MESSAGES.uniquenessViolationSubstr,
    );

    console.error({ userAlreadyExists });

    if (userAlreadyExists) {
      const updateUserFIOResponse = await ApiSource.graphql({
        query: updateUserFIO,
        variables: {
          userId: chat.id,
          fio,
        },
        operationName: 'updateUserFIO',
        errorMessage: 'Error when executing updateUserFIO mutation: ',
      });
    } else {
      ctx.reply('Извините, при добавлении участника возникла ошибка');

      return ctx.scene.leave();
    }
  }

  try {
    const response = await ApiSource.post({
      data: {
        query: addRoomParticipant,
        variables: {
          object: {
            roomId: room.id,
            userId: chat.id,
          },
        },
        operationName: 'addRoomParticipant',
      },
    });

    console.log('addRoomParticipant response', response);

    if (
      response.errors?.[0]?.message?.includes(
        HASURA_ERROR_MESSAGES.uniquenessViolationSubstr,
      )
    ) {
      ctx.reply('Вы уже являетесь участником данной комнаты');

      return ctx.scene.leave();
    }

    ctx.reply(
      'Вы успешно присоединились к комнате! Ожидайте сообщение с именем выбранного для Вас человека',
    );
  } catch (err) {
    console.error('Error when executing addRoomParticipant query: ', err);
  }

  return ctx.scene.leave();
};

const joinRoomScene = new WizardScene(
  SCENES.joinRoom,
  askForRoomName,
  handleRoomNameInput,
  askForFIO,
  addUserAndRoomParticipant,
);

module.exports = joinRoomScene;
