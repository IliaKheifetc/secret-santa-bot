function getRandomNumber(n) {
  const maxLength = n.toString().length;
  return Math.trunc(Math.random() * 10 ** maxLength) % n;
}

function getPairs(arr) {
  // TODO remove later, for testing with 1 room participant
  if (arr.length === 1) {
    return { [arr[0]]: arr[0] };
  }
  let arrCopy = [...arr];

  let dict = {};

  for (let i = 0; i < arr.length; i++) {
    let index = getRandomNumber(arrCopy.length);

    if (arrCopy[index] === arr[i]) {
      index = arrCopy[index + 1] === undefined ? index - 1 : index + 1;
    }

    dict[arr[i]] = arrCopy[index];
    arrCopy.splice(index, 1);
  }

  for (let key in dict) {
    if (dict[key] === +key || dict[key] === undefined) {
      return getPairs(arr);
    }
  }

  return dict;
}

function getDisplayedIdFromRoomName(roomName) {
  const id = roomName?.replace?.(/[^0-9]/g, '');

  return id ? Number(id) : null;
}

module.exports = { getPairs, getDisplayedIdFromRoomName };
