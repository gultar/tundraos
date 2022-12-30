#!/bin/bash

browserify ./public/js/filesystem/filesystem-init.js -o ./public/js/filesystem/filesystem.bundle.js
browserify ./public/js/terminal/hyperwatcher.js -o ./public/js/terminal/hyperwatcher.bundle.js
browserify ./public/login/hyperwatcher.js -o ./public/login/hyperwatcher.bundle.js