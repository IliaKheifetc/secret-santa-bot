const { v4: uuidv4 } = require('uuid');
const Markup = require('telegraf/markup');

const { ADMIN_BUTTONS, DEFAULT_BUTTONS } = require('../constants.js');

const ApiSource = require('../api/ApiSource.js');
const { addRoom, getRooms } = require('../graphql/rooms.js');
const { addUser, getUser, updateUserAdminOf } = require('../graphql/users.js');

const INITIAL_ROOM_DISPLAYED_ID = 0;

const showAdminButtons = (ctx) => {
  console.log(ctx);

  ctx.reply(
    'Теперь Вам доступны функции администратора',
    Markup.keyboard([
      ...Object.values(ADMIN_BUTTONS).map((btn) => [btn.text]), // Row1 with 2 buttons
    ])
      .oneTime()
      .resize()
      .extra(),
  );
};

const addRoomHandler = (bot) => {
  bot.hears(DEFAULT_BUTTONS.createRoom.text, async (ctx) => {
    console.log('ctx.update.message.chat', ctx.update.message.chat);

    const chatId = ctx?.update?.message?.chat?.id;

    await ctx.reply('начинаем создавать комнату...');

    const roomUuid = uuidv4();

    const getRoomsResponse = await ApiSource.graphql({
      query: getRooms,
      operationName: 'getRooms',
      errorMessage: 'Error when getting a list of rooms: ',
    });
    const { rooms } = getRoomsResponse?.data || {};

    if (!rooms) {
      return ctx.reply('Произошла ошибка при добавлении комнаты');
    }

    const currentMaxDisplayedId =
      rooms?.reduce?.((maxId, room) => {
        return Math.max(maxId, room.displayedId);
      }, rooms?.[0]?.displayedId) || INITIAL_ROOM_DISPLAYED_ID;

    const newRoom = {
      admins: `{${chatId}}`,
      id: roomUuid,
      name: `Комната ${currentMaxDisplayedId + 1}`,
      displayedId: currentMaxDisplayedId + 1,
    };

    try {
      const response = await ApiSource.post({
        data: {
          query: addRoom,
          variables: {
            object: newRoom,
          },
          operationName: 'addRoom',
        },
      });

      console.log('response', response);

      await ctx.reply(
        `Для Вас была создана комната: "${response?.data?.insert_rooms_one?.name}". ` +
          'Это название надо будет отправить тем, кого Вы захотите пригласить в комнату',
        // { reply_markup: { remove_keyboard: true } },
      );
    } catch (err) {
      console.error('Error when adding a room: ', err);
    }

    // search for the user
    const getUserResponse = await ApiSource.graphql({
      query: getUser,
      variables: {
        userId: chatId,
      },
      operationName: 'getUser',
      errorMessage: 'Error when executing getUser query: ',
    });
    const { users } = getUserResponse?.data || {};

    console.log('users[0]', users[0]);

    if (!users?.[0]) {
      const addUserResponse =
        (await ApiSource.graphql({
          query: addUser,
          variables: {
            object: {
              adminOf: `{${roomUuid}}`,
              id: chatId,
              FIO: 'Пока что пустое ФИО',
            },
          },
          operationName: 'addUser',
          errorMessage: 'Error when executing addUser query: ',
        })) || {};
    } else {
      const prevRoomsUuids = users[0].adminOf.replace(/{|}/g, '');

      const updateUserAdminOfResponse = await ApiSource.graphql({
        query: updateUserAdminOf,
        variables: {
          adminOf: `{${prevRoomsUuids},${roomUuid}}`,
          userId: chatId,
        },
        operationName: 'updateUserAdminOf',
        errorMessage: 'Error when executing updateUserAdminOf query: ',
      });

      const { update_users } = updateUserAdminOfResponse?.data || {};

      console.log(
        'updateUseupdateUserAdminOfResponseResponse',
        updateUserAdminOfResponse,
      );
      console.log('update_users.returning', update_users.returning);
    }

    showAdminButtons(ctx);
  });
};

module.exports = addRoomHandler;
