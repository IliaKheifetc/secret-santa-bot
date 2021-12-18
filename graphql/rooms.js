const addRoom = `
    mutation addRoom($object: rooms_insert_input!) {
        insert_rooms_one(object: $object) {
            id
            name
        }
    }
  `;

const getRooms = `
    query getRooms {
        rooms {
            admins
            id
            name
            displayedId
        }
    }
  `;

const getRoomByDisplayedId = `
    query getRoomByDisplayedId($displayedId: bigint!) {
        rooms(where: {displayedId: { _eq: $displayedId }}) {
            admins
            id
            name
            displayedId
        }
    }
  `;

const getRoomUsers = `
    query getRoomUsers($roomId: uuid!) {
        rooms_by_pk(id: $roomId) {
            rooms_users {
              user {
                id
                FIO
              }
            }
            id
            displayedId
            name
          }
    }
`;

module.exports = { addRoom, getRooms, getRoomByDisplayedId, getRoomUsers };
