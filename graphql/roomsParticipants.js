const addRoomParticipant = `
    mutation addRoomParticipant($object: rooms_participants_insert_input!) {
        insert_rooms_participants_one(object: $object) {
            roomId
            userId
        }
    }
  `;

const getRoomParticipants = `
    query getRoomParticipants($roomId: uuid!) {
        rooms_participants(where: {roomId: {_eq: $roomId}}) {
            roomId
            userId
        }
    }
`;

const updateRoomParticipants = `
    mutation updateRoomParticipants($roomId: uuid!, $userId: bigint!, $recipientId: bigint!) {
        update_rooms_participants(where: {roomId: {_eq: $roomId}, _and: {userId: {_eq: $userId}}}, _set: {recipientId: $recipientId}) {
            returning {
                roomId
                userId
                recipientId
            }
        }
    }
`;

module.exports = {
  addRoomParticipant,
  getRoomParticipants,
  updateRoomParticipants,
};
