const DEFAULT_BUTTONS = {
  createRoom: {
    text: 'Создать комнату',
  },
  joinRoom: {
    text: 'Присоединиться к комнате',
  },
};

const ADMIN_BUTTONS = {
  ...DEFAULT_BUTTONS,
  viewRoomInfo: {
    text: 'Просмотреть информацию о комнате',
  },
  assignRecipients: {
    text: 'Распределить участников',
  },
};

const SCENES = {
  assignRecipients: 'assign_recipients',
  joinRoom: 'join_room_scene',
};

const HASURA_ERROR_MESSAGES = {
  uniquenessViolationSubstr:
    'Uniqueness violation. duplicate key value violates unique constraint',
};

const USER_ERROR_MESSAGES = {
  roomNotFound: 'К сожалению, комната с таким названием не найдена',
};

module.exports = {
  ADMIN_BUTTONS,
  DEFAULT_BUTTONS,
  HASURA_ERROR_MESSAGES,
  SCENES,
  USER_ERROR_MESSAGES,
};
