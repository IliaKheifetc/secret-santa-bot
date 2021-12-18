const addUser = `
    mutation addUser($object: users_insert_input!) {
        insert_users_one(object: $object) {
            adminOf
            id
            FIO
        }
    }
  `;

const getUser = `
    query getUser($userId: bigint!) {
        users(where: {id: {_eq: $userId}}) {
            id
            adminOf
        }
    }
  `;

const updateUserAdminOf = `
    mutation updateUserAdminOf($userId: bigint!, $adminOf: jsonb) {
        update_users(where: {id: {_eq: $userId}}, _set: {adminOf: $adminOf}) {
            returning {
                id
                adminOf
            }
        }
    }
`;

const updateUserFIO = `
    mutation updateUserFIO($userId: bigint!, $fio: String) {
        update_users(where: {id: {_eq: $userId}}, _set: {FIO: $fio}) {
            returning {
              FIO
              id
            }
        }
    }
`;

module.exports = { addUser, getUser, updateUserAdminOf, updateUserFIO };
