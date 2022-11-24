'use strict';

const {app, BrowserWindow} = require('electron');
const path = require('path');
const { Server } = require("socket.io");
const io = new Server();
const VirtualFileSystem = require('./public/js/virtualfilesystem.js')

const FileSystem = new VirtualFileSystem("root")

app.on('ready', () => {
    io.on("connection", (socket)=>{
      socket.on("shell-command", (commandString)=>{
        console.log(commandString)
        //Implement an arg parser
        let [ cmd, ...args ] = commandString.split(" ")
        if(!args) args = []
        const availableCommands = FileSystem.exposeCommands()
        if(availableCommands[cmd]){
          const result = FileSystem[cmd](args)
          socket.emit("shell-result", result)
        }
        
      })
    })
    io.listen(3333, ()=>{
      console.log('Listening on 3333')
    })
    const win = new BrowserWindow({
      width: 1000,
      height: 1000,
      webPreferences: {
        nodeIntegration: true
      },
    });
    win.loadURL('file://' + path.join(__dirname, 'public/index.html'))
});