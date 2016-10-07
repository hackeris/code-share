<template>
    <div id="room-container">
        <div id="code-container">
            <h3><span>{{ room }}</span><span>房间</span></h3>
            <textarea id="editor"></textarea>
            <button class="circle-button" id="show-message" @click="showMessage">
                <img src="/public/images/ic_chat_black.png">
            </button>
        </div>
        <div id="message-container">
            <h3><span>消息</span></h3>
            <ul id="message-list">
                <li v-for="message in messages">
                    <div v-if="message.uid !== uid" class="message-left">
                        <img width="30" height="30" v-bind:src="message.identicon"/>
                        <p>{{ message.message }}</p>
                    </div>

                    <div v-if="message.uid === uid" class="message-right">
                        <img width="30" height="30" v-bind:src="message.identicon"/>
                        <p>{{ message.message }}</p>
                    </div>
                </li>
            </ul>
            <div id="new-message">
                <input style="width: 100%;" v-model="tempMessage" v-on:keyup.13="submitMessage" placeholder="回车发送消息">
            </div>

            <button class="circle-button" id="hide-message" @click="hideMessage">
                <img src="/public/images/ic_clear_black.png">
            </button>
        </div>
    </div>
</template>
<style>

    #room-container {
        width: 80%;
        margin: 0 auto;
        overflow: hidden;
        height: 700px;
    }

    #code-container {
        width: 70%;
        height: 100%;
        display: flex;
        flex-direction: column;
        float: left;
    }

    #message-container {
        width: 30%;
        height: 100%;
        float: right;
        background-color: white;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    h3 {
        margin: 20px;
    }

    #message-list {
        overflow: auto;
        flex: 1;
    }

    ul {
        list-style: none;
        border: 1px solid #cccccc;
        border-left: none;
    }

    li {
        margin: 10px 20px;
    }

    .message-left, .message-right {
        display: flex;
        width: 100%;
    }

    .message-right {
        flex-direction: row-reverse;
    }

    .message-left > p, .message-left > img {
        float: left;
    }

    .message-right > p, .message-right > img {
        float: right;
    }

    .message-right > p, .message-left > p {
        line-height: 30px;
        font-size: 18px;
        margin: 0 10px;
    }

    #new-message {
        padding: 0 5px;
        height: 38px;
        border-right: 1px solid #cccccc;
        border-bottom: 1px solid #cccccc;
    }

    #new-message > input {
        height: 35px;
        line-height: 35px;
        font-size: 18px;
        padding: 0;
        margin: 0;
        border-style: none;
    }

    @media screen {
        #show-message {
            display: none;
        }

        #hide-message {
            display: none;
        }
    }

    @media screen and (max-width: 600px) {
        #room-container {
            position: absolute;
            height: 100%;
            width: 100%;
        }

        #code-container {
            position: absolute;
            width: 100%;
            height: 100%;
        }

        #message-container {
            position: absolute;
            width: 100%;
            height: 100%;
            z-index: 100;
            display: none;
        }

        ul {
            border-left: none;
            border-right: none;
        }

        #new-message {
            border: none;
        }

        h3 {
            font-size: 18px;
            margin: 10px;
        }

        #show-message {
            display: block;
            position: absolute;
            right: 20px;
            bottom: 20px;
        }

        #hide-message {
            display: block;
            position: absolute;
            right: 0;
            top: 0;
            border: none;
            background: transparent;
        }

        .circle-button {
            background-color: white;
            color: white;
            width: 40px;
            border: 1px solid #cccccc;
            height: 40px;
            z-index: 100;
            border-radius: 20px;
        }

        .circle-button > img {
            padding: 8px 5px 5px;
            height: 23px;
            width: 23px;
        }
    }

    .CodeMirror {
        padding: 0;
        flex: 1;
        display: flex;
        border-right: solid 1px #cccccc;
        border-top: solid 1px #cccccc;
        border-bottom: solid 1px #cccccc;
    }

    .CodeMirror-scroll {
        flex: 1;
        height: auto;
        -webkit-flex: 1;
    }

</style>
<script>

    export default{
        data(){
            return {
                room: "",
                tempMessage: "",
                uid: "",
                messages: []
            }
        },
        ready(){

            this.room = room;

            var codeUpdated = true;
            var codeSent = true;

            var editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
                lineNumbers: true
            });

            var socket = this.socket = io('/code-room');

            this.$http.get("/code/" + room).then(function (resp) {
                editor.setValue(resp.body.code);
            });
            this.$http.get("/message/" + room).then(function (resp) {
                resp.body.forEach(function (item) {
                    this.putMessage(item);
                }.bind(this));
            });

            socket.emit('join', room);

            socket.on('uid', function (uid) {
                this.uid = uid;
            }.bind(this));

            socket.on('code sent', function () {
                codeSent = true;
            });

            socket.on('message sent', function () {
            });

            socket.on('message', function (message) {
                this.putMessage(JSON.parse(message));
            }.bind(this));

            CodeMirror.on(editor, 'change', function () {
                if (codeUpdated && codeSent) {
                    codeSent = false;
                    var code = editor.getValue();
                    socket.emit('code', code);
                }
            });

            socket.on('code', function (code) {
                codeUpdated = false;
                var cur = editor.getCursor();
                editor.setValue(code);
                editor.setCursor(cur);
                codeUpdated = true;
            });
        },
        components: {},
        methods: {
            putMessage(message){
                var data = new Identicon(message.uid, 30).toString();
                message.identicon = 'data:image/png;base64,' + data;
                this.messages.push(message);
            },
            scrollMessageListToBottom(){
                var messageList = document.getElementById('message-list');
                messageList.scrollTop = messageList.scrollHeight;
            },
            submitMessage(){
                this.socket.emit('message', this.tempMessage);
                this.putMessage({
                    uid: this.uid,
                    message: this.tempMessage
                });
                this.tempMessage = "";
            },
            showMessage(){
                document.getElementById('message-container').style.display = 'flex';
            },
            hideMessage(){
                document.getElementById('message-container').style.display = 'none';
            }
        },
        watch: {
            'messages': function (val, oldVal) {
                this.scrollMessageListToBottom();
            }
        }
    }
</script>
