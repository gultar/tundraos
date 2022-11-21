'use strict';

const {app, BrowserWindow} = require('electron');
const path = require('path');

app.on('ready', () => {
  const win = new BrowserWindow({
    width: 500,
    height: 500,
    webPreferences: {
      nodeIntegration: true
    },
  });
  win.loadURL('file://' + path.join(__dirname, 'public/index.html'))
});