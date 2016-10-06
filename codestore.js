class CodeStore {
  constructor() {
    this._codeRoom = {};
  }

  allocateRoomId() {
    function make4Rand() {
      var result = "";
      for (var i = 0; i < 4; i++) {
        result += parseInt(Math.random() * 10);
      }
      return result;
    }

    var tries = 0;
    do {
      var rand = make4Rand();
      tries++;
    } while (this._codeRoom[rand] && tries < 10);
    this._codeRoom[rand] = {count: 0, code: ""};
    return rand;
  }

  leaveRoom(room) {
    if (this._codeRoom[room]) {
      this._codeRoom[room].count--;
      if (!this.isActive(room) && this._codeRoom[room].count == 0) {
        delete this._codeRoom[room];
      }
    }
  }

  joinRoom(room) {
    if (this.isActive(room)) {
      this._codeRoom[room].count++;
    }
  }

  isActive(room) {
    return this._codeRoom[room];
  }

  setCode(room, code) {
    this._codeRoom[room].code = code;
  }

  getCode(room) {
    return this._codeRoom[room].code;
  }
}

module.exports = CodeStore;