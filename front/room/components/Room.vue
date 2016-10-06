<template>
    <div id="room-container">
        <div id="code-container">
            <h3><span>房间编号：</span><span>{{ room }}</span></h3>
            <textarea id="editor"></textarea>
        </div>
        <div id="message-container">
            <h3><span>消息：</span></h3>
            <ul>
                <li v-for="message in messages">
                    <p v-if="message.uid !== id">{{ message.message }}</p>
                    <p v-if="message.uid === id" style="text-align: right;">{{ message.message }}</p>
                </li>
            </ul>
            <div id="message">
                <input style="width: 100%;" v-model="tempMessage" v-on:keyup.13="submitMessage">
            </div>
        </div>
    </div>
</template>
<style>

    #room-container {
        width: 80%;
        margin: 0 auto;
    }

    #code-container {
        width: 70%;
        float: left;
    }

    #message-container {
        width: 30%;
        height: 100%;
        float: right;
    }

    h3 {
        margin: 20px;
    }

    ul {
        list-style: none;
        height: 670px;
        border: 1px solid #cccccc;
    }

    li {
        margin: 10px 20px;
    }

    #message {
        height: 28px;
        border: 1px solid #cccccc;
    }

    #message > input {
        height: 27px;
        padding: 0;
        margin: 0;
        border-style: none;
    }

    @media screen and (max-width: 600px) {
        #room-container {
            width: 100%;
        }

        #code-container {
            width: 100%;
        }

        #message-container {
            width: 0;
        }

        h3 {
            font-size: 15px;
            margin: 10px;
        }
    }

    .CodeMirror {
        padding: 0;
        height: 700px;
        border-right: solid 1px #cccccc;
        border-top: solid 1px #cccccc;
        border-bottom: solid 1px #cccccc;
    }

</style>
<script>
    export default{
        data(){
            return {
                room: "",
                tempMessage: "",
                id: "",
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
                    this.messages.push(item);
                }.bind(this));
            });

            socket.emit('join', room);

            socket.on('id', function (id) {
                this.id = id;
            }.bind(this));

            socket.on('code sent', function () {
                codeSent = true;
            });

            socket.on('message sent', function () {
            });

            socket.on('message', function (message) {
                console.log(message);
                this.messages.push(JSON.parse(message));
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
            submitMessage(){
                this.socket.emit('message', this.tempMessage);
                this.messages.push({
                    uid: this.id,
                    message: this.tempMessage
                });
                this.tempMessage = "";
            }
        }
    }
</script>
