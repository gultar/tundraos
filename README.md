# Toundra OS
An electron-powered desktop graphical environment

##Installation

You will first need to clone the repo by running the following command:
```
git clone https://github.com/gultar/workspace
```

Then you need to install all necessary dependencies:
```
npm install
```

##Running
If you are using the application on Windows,
you may want to enter the Windows Subsystem for Linux, as this project was built
with Linux in mind first.
You can, however, run the following command and have a filesystem built at the root of the
project's directory.
```
npm run electron
```

OR

If you wish to have access to Linux's entire filsystem, run the following command instead:
```
npm run electron-full
```


## API

There are several tools attached to the global Window object as well as node's global object.
Ideally, all installed client applications are attached to the Window object to enable system-wide usage.

### ApplicationWindow

An ApplicationWindow instance is a wrapper for the WinBox library, which enables the creation of flexible, elegant and customizable windows. 
The wrapper gives WinBox instances to be saved and loaded on page reload, allowing developers to reload changes made to the front-end part of the applications to be loaded without having to manually open the applications they're currently using. 
The ApplicationWindow constructor takes in the same basic arguments as the WinBox class, but to save the window's state,
it needs to receive the launcher object that contains several properties.

Here is an example


```
this.winbox = new ApplicationWindow({
		title:"Code Editor",
		label: `editor-${this.editorId}`, //make sure the label is unique, to avoid having
		height:"95%",                     //conflicting application window IDs
		width:"80%",
		mount:this.editorWrapper,  //For a simple and more flexible usage, opt for mounting DOM
		launcher:{                 //elements instead of including an HTML string
				name:"Editor",
				opts:{           //The launcher needs a class name, and the opts, or options, are
					x:this.x,      //The properties that will be passed to the class constructor
					y:this.y,
					pathToFile:this.pathToFile,
					content:this.content,
				}
		},
		onclose:()=>{       //Don't forget to disable all event listeners and to remove mounted DOM elements
				this.close()    //otherwise, you may end up with wonky behaviour.
		}
})
```

### Editor

Launches a cool and simple code editor powered by Ace, with some file management capabilities.

```
const myEditor = new Editor({ pathToFile:'/path/to/file' })
```



Built by:

Sacha-Olivier Dulac

