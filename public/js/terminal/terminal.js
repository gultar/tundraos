class Terminal{
  constructor(id, directoryPointerId){
    this.id = id
    this.directoryPointerId = directoryPointerId

    this.cmdLineId = `#cmdline-${this.id}`
    this.cmdLine_ = document.querySelector(this.cmdLineId);
    this.outputId = `#output-${this.id}`
    this.output_ = document.querySelector(this.outputId);
    this.terminalWindowId = `#terminal-window-${this.id}`
    this.terminalWindow = document.querySelector(this.terminalWindowId);
    this.pageAnchor = document.querySelector("#page-anchor");
    this.prompt = document.querySelector(`#prompt-${this.id}`)
    this.dateElement = {}
    this.history_ = [];
    this.histpos_ = 0;
    this.histtemp_ = 0;
    this.mode = "terminal"
    this.isDoubleTab = false
    this.listPossibilities = false
    this.helpMsgs = {
      "system":{
        "help":"Displays this message",
        "clear":"Clears the console",
        "date":"Displays the current date",
        "echo":"Outputs a string into the console. Usage: echo Hello World",
        "whereis":"Searches for a file or a directory and gives absolute path",
        "ls":'List information about the FILEs (the current directory by default). Usage: ls directory/',
        "rm":'Removes specified file. By default, it does not remove directories. . Usage: rm filename',
        "cd":"Change the working directory of the shell environment. Usage: cd dir1/",
        "cp":"Copies file or entire directory to selected path. Usage: cp src/ target/",
        "mv":"Moves file or entire directory to selected path. Usage: mv src/ target/",
        "pwd":"Print the name of current working directory",
        "cat":"Concatenate FILE(s) to standard output. Usage: cat filename",
        "mkdir":"Create the DIRECTORY, if it does not already exist. Usage: mkdir directoryname/",
        "touch":"Creates an empty file if it does not already exist. Usage: touch filename",
        "rmdir":"Remove the DIRECTORY, if it is empty. Usage: rmdir directoryname",
        "whoami":"Displays information concerning host",
        "whereis":"Search for possible paths for a file or directory name",
        "reboot":"Reboots/refreshes system",
        "logout":"Closes the current user's session",
        "shutdown":"Shuts down system",
      },
      "effect":{
          "Possible Commands":"effect particles/wave/halo",
          "effect wave":"Toggles a background color wave effect. Colors are set in variables.css",
          "effect halo":"Toggles a colored halo around cursor. Usage: effect halo 300 - Default is 200 (px)",
          "effect particles":"Toggles javascript particles effect in background.",
      },
      "settings":{
        "background":"Changes the background image. Usage: background http://url.url",
      },
      "applications":{
        "browser":"Launches a simple Web browser",
        "web":"*An alias of browser*",
        "wiki":"Opens up a wikipedia page, or another website (not all of them work)",
        "gdt":"Opens up the Grand dictionnaire terminologique",
        "linguee":"Searches on Linguee for a translation of the text provided",
        "map":"Displays a Google Maps window",
        "tirex":"Start the famous tirex game from Google",
        "lofi":"Opens up Lo Fi Girl's Youtube channel",
        "webamp":"Launches a Webamp Music Player window",
        "editor":"Launches a code editor window",
        "markdown":"Launches a markdown file editor window",
        "text":"Launches a rich text editor window",
        "view":"Opens a simple image viewer",
        "weather":"Displays local weather information",
        "explorer":"Launches a file explorer window at selected path. Usage: explorer path/",
      },
      "wifi":{
        "Possible Commands":"wifi scan/list/connect/disconnect",
        "wifi scan":"Scans for available wifi networks and returns them as objects",
        "wifi list":"Lists active wifi connections",
        "wifi connect":"Connects to network. Usage: wifi connect --ssid 'NetworkName' --password 'psswrd123' "
      }
    };

    this.commands = {
      //Basic commands
      help:(args, cmd)=>this.runHelp(args, cmd),
      clear:(args, cmd)=>this.clear(args, cmd),
      echo:(args, cmd)=>this.echo(args),
      date:(args, cmd)=>this.output( new Date() ),
      ls:async(args)=>await this.runBash("ls",args),
      cd:async(args)=>await this.runBash("cd",args),
      cp:async(args)=>await this.runBash("cp",args),
      mv:async(args)=>await this.runBash("mv",args),
      cat:async(args)=>await this.runBash("cat",args),
      pwd:async(args)=>await this.runBash("pwd",args),
      mkdir:async(args)=>await this.runBash("mkdir",args),
      touch:async(args)=>await this.runBash("touch",args),
      rmdir:async(args)=>await this.runBash("rmdir",args),
      rm:async(args)=>await this.runBash("rm",args),
      whereis:async(args)=>await this.runBash("whereis", args),
      '#':(args)=>this.runRoot(args),
      reboot:()=>this.reboot(),
      shutdown:()=>this.shutdown(),
      logout:()=>logout(),
      //Settings
      background:(args)=>changeBackground(args),
      effect:(args)=>this.setEffect(args),
      //Applications
      web:(args)=>this.startBrowser(args),
      browser:(args)=>this.startBrowser(args),
      wiki:()=>new Browser("https://wikipedia.org"),
      gdt:()=>new Browser("https://gdt.oqlf.gouv.qc.ca/"),
      iching:()=>new Browser("https://gultar.github.io/iching/"),//
      georatio:()=>new Browser("https://georatio.com/"),
      linguee:(args)=>runLinguee(args),
      tirex:()=>runTirex(),
      map:()=>runMap(),
      lofi:()=>runLofi(),
      editor:async (args)=>await this.runEditor(args), //Alias
      markdown:(args)=>this.runMarkdownEditor(args),
      text:(args)=>this.runRichTextEditor(args),
      weather:async()=>await this.getWeather(),
      whoami:()=>this.whoami(),
      view:async (args)=>await this.viewImage(args),
      test:async(args)=>await this.testSomething(args),
      explorer:async(args)=>await this.runExplorer(args),
      wifi:async(args)=>await this.makeWifiCommand(args),
      hyperwatch:()=>this.enableHyperwatch()
    }
  }
  
  init(){
    this.defineKeyEventListeners();
    this.initTerminalMsg();
    this.setPromptDecoration()
  }

  async exec(cmd, args){
    return await exec(cmd, args, this.directoryPointerId)
  }

  setPromptDecoration(decoration=`[${window.username}@sh]`){
    this.prompt.innerHTML = decoration
  }

  initTerminalMsg(){
    this.output(`<div id="date" class="date">${new Date()}</div><p>Enter "help" for more information.</p>`);
    
    setInterval(function(){
      $(`.date`).html(new Date());
    }, 1000)
  }

  defineKeyEventListeners(){
    this.terminalWindow.addEventListener('click', ()=>{
      this.cmdLine_.focus();
    }, false);
    self.addEventListener('click', ()=>{
      this.pageAnchor.focus();
    }, false);
    
    this.cmdLine_.addEventListener('keydown', (e)=>{
      // console.log('Event', e)
      this.processNewCommand(e)
    }, false);
  }

  outputHelpMenu(){
    for(const category in this.helpMsgs){
      this.output(`<span><b>======================${category}======================</b></span>`)
      for(const command in this.helpMsgs[category]){
        this.output(this.formatHelpMessage(command, this.helpMsgs[category][command]));
      }
    }
  }

  runHelp(args){
    if(args.length > 0){
      const commandName = args[0]
      let found = false
      
      if(this.helpMsgs[commandName]){
          const category = this.helpMsgs[commandName]
          for(const name in category){
            const message = category[name]
            found = message
            this.output(this.formatHelpMessage(name, message))
          }
      }
      
      for(const category in this.helpMsgs){
        if(this.helpMsgs[category][commandName]){
          found = this.helpMsgs[category][commandName]
          this.output(this.formatHelpMessage(commandName, found))
        }
      }
      if(!found){
        this.output(`Could not find help message for ${commandName}`)
      }
    }else{
      this.outputHelpMenu();
    }
  }

  reboot(){
    window.ipcRenderer.send("reboot",{ args:[], now:true })
    location.reload()
  }

  shutdown(){
    window.close()
  }

  echo(args){
    const message = args.join(" ")
    this.output(message)
    return message
  }

  output(data){
    if(typeof data == 'object'){
      data = JSON.stringify(data, null, 2)
      this.output_.insertAdjacentHTML('beforeEnd', '<pre>' + data + '</pre>');
      this.cmdLine_.focus();
    }else{
      this.output_.insertAdjacentHTML('beforeEnd', '<p>' + data + '</p>');
      this.cmdLine_.focus();
    }
    
  }

  clear(){
      $(this.outputId).html('');
      this.initTerminalMsg();
  }

  turnToURLQueryText(args){
    const argsFused = args.toString()
    const text = argsFused.replaceAll(",","+")
    return text
  }

  setEffect(args){
    const effect = args[0]
    const radius = args[1]
    if(radius){
      this.output(`Wave effect activated with radius ${radius}`)
      toggleMouseHaloEffect("force", radius)
    }

    if(effect == 'wave'){
      this.output(`Wave effect activated ${toggleWaveEffect()}`)
    }else if(effect == 'halo'){
      this.output(`Halo effect activated ${toggleMouseHaloEffect()}`)
    }else if(effect == "particles"){
      toggleParticles()
      this.output(`Particle effect actived ${window.particles.paused?false:true}`)
    }

  }

  async runBash(cmd, args){
    let result = await this.exec(cmd, args)
    let formattedResult = (typeof result == 'object' ? JSON.stringify(result, null, 2) : result)
    this.output(`<xmp>${formattedResult}</xmp>`)
    return result
  }

  async runRoot(args){
    if(args.length == 0){
      //run true-shell mode
      console.log('Is root mode')
      const cancel = (this.mode == "true-shell")
      console.log('Cancel?', cancel)
      // this.enterTrueShellMode(cancel)
    }else{
      const command = args.join(" ")
      let result = await runRootCommand(command)
      this.output(`<pre>${result}</pre>`)
      return result
    }
  }

  async runEditor(args){
    const path = args[0]
    const currentDir = await this.exec("pwd")
    const file = await this.exec("getFile", [path])
    let content = ""
    if(file){
      content = file.content
    }

    if(path){
        path = currentDir+"/"+path
    }

    new Editor({ pathToFile:path, content:content })
    return true
  }
  
  async runMarkdownEditor(args){
    const path = args[0]
    const file = await this.exec("getFile", [path])
    let content = ""
    if(file){
      content = file.content
    }

    new MarkdownEditor(path, content)
    return true
  }
  
  async runRichTextEditor(args){
    const path = args[0]
    const file = await this.exec("getFile", [path])
    let content = ""
    

    const editor = new RichTextEditor(path, file.content)
    return true
  }

  async runExplorer(args){
    const current = await this.exec("pwd")
    const path = args[0]
    new FileExplorer({ workingDir:current+"/"+path })
  }

  startBrowser(args){
    const url = args[0]
    new Browser(url)
  }
  
  enableHyperwatch(args){
    if(args){
        const enabled = args[0]
        if(enabled == 'on'){
           window.hyperwatchDisabled = false
        }else if(enabled == 'off'){
           window.hyperwatchDisabled = true
        }else{
           this.output("ERROR: You can only toggle hyperwatch by providing an 'on' or 'off' parameter")
        }
        this.output("Hyperwatch enabled: "+ !window.hyperwatchDisabled)
    }else{
        window.hyperwatchDisabled = !window.hyperwatchDisabled
        this.output("Hyperwatch enabled: "+ !window.hyperwatchDisabled)
    }

    this.output("To disable or enable hyperwatch, you have to either login again or reload the environment")
  }

  async makeWifiCommand(args){
    //list, scan, connect, disconnect
    

    const [ wifiCmd, ...wifiArgs ] = args

    const splitArgumentsByApostrophe = (argsBySpace) =>{
      let argString = argsBySpace.join(" ")
      
      let argsByApostrophe = []
      if(argString.includes('"')) argsByApostrophe = argString.split('"')
      
      if(argString.includes("'")) argsByApostrophe = argString.split("'")
      
      argsByApostrophe = argsByApostrophe.filter(e => e != "")
      argsByApostrophe = argsByApostrophe.map(e => e.trim())
      
      return argsByApostrophe
    }

    const parseArgument = (flag, args) =>{
      console.log(args)
      if(!args.includes(flag)){
        return null
      }
      
      const index = args.indexOf(flag)
      if(index == -1){
        return null
      }

      return args[index + 1]
      
    }

    const newArgs = splitArgumentsByApostrophe(wifiArgs)

    let ssid = parseArgument("--ssid", newArgs)
    let password = parseArgument("--password", newArgs)
    let iface = parseArgument("--iface", newArgs)

    console.log("Split",ssid, password, iface)

    this.output("Running Wifi Command "+wifiCmd)
    this.output("Standy...")

    const { result, error } = await runWifiCommand(wifiCmd, { ssid:ssid, password:password, iface:iface })
    if(error) this.output(`Wifi Error: ${JSON.stringify(error)}`)
    else {
      this.output(result)
    }
  }

  async testSomething(args){
    // new BrowserTabs()
     const menu = new WifiMenu()
  }

  async getWeather(){
      const currentWeather = await getCurrentWeather()
      
      this.output(`<xmp>${JSON.stringify(currentWeather, null, 2)}</xmp>`)
  }

  whoami(){
    this.output(navigator.userAgent)
    this.output("")
    this.output(`Username: ${getUsername()}`)
  }

  async processMultipleCommands(commandLine){
    //parse command line using chaining operators
    //loop through all segments

    this.saveShellHistory()
    this.enterNewLine();

    const isChainOp = (word) =>{
      const contains = 
      word === '||' ||
      word === '&&' || 
      word === '|' ||
      word === ';'

      return contains;
    }

    const useChainOp = (word) =>{
      switch(word){
        case '||':
          return async (resultPrevious, nextCmd, cmd, args) =>{
            return (resultPrevious.error ? await nextCmd(args, cmd) : resultPrevious)
          }
        case '&&':
          return async (resultPrevious, nextCmd, cmd, args) =>{
            return (resultPrevious.error ? resultPrevious.error : await nextCmd(args, cmd))
          }
        case '|':
          return async (resultPrevious={}, nextCmd, cmd, args) =>{
            args.push(resultPrevious)
            return (resultPrevious.error ? resultPrevious.error : await nextCmd(args, cmd))
          }
        case ';':
          return async (resultPrevious, nextCmd, cmd, args) =>{
            return await nextCmd(args, cmd)
          }
      }
    }


    let commandArray = commandLine.split(" ")
    let resultBuffer = []
    let chainOpBuffer = []
    let wordBuffer = []
    let commandBuffer = []
    // let cmdToExecute = ''
    
    for(const word of commandArray){
      if(isChainOp(word)){
        chainOpBuffer.unshift(word)
        commandBuffer.push(wordBuffer.join(" "))
        wordBuffer = []
      }else{
        wordBuffer.push(word)
      }
    }

    commandBuffer.push(wordBuffer.join(" "))
    wordBuffer = []

    // this.addCurrentLineToConsole()

    for(const line of commandBuffer){
      let [ cmd, ...args ] = this.parseArguments(line);
      if(Object.hasOwn(this.commands, cmd)){
        const runCommand = this.commands[cmd]
        if(resultBuffer.length > 0){
          const chainOpWord = chainOpBuffer.pop()
          const chainOp = useChainOp(chainOpWord)
          const previousResult = resultBuffer.pop()
          const newResult = await chainOp(previousResult, runCommand, cmd, args)
          resultBuffer.push(newResult)
        }else{
          const result = await runCommand(args, cmd)
          resultBuffer.push(result)
        }

      }else{
        resultBuffer.push({ error:cmd + ': command not found' })
      }
      
    }
    this.resetLine()
    return true

  }

  containsChainOp = (line) =>{
    const contains = 
    line.includes(' || ') ||
    line.includes(' && ') || 
    line.includes(' | ') ||
    line.includes(' ; ')

    return contains;
  }

  //Already existing
  async processNewCommand(e){
    
    let [ cmd, ...args ] = this.parseArguments(this.cmdLine_.value);

    if (e.key == "Tab") { // tab
      
      e.preventDefault();
      this.autoCompleteCommand()
      await this.parsePath(args, cmd)
    } else if (e.key == "Enter") { // enter
      // Save shell history.
      if(this.containsChainOp(this.cmdLine_.value))return await this.processMultipleCommands(this.cmdLine_.value)
      else{
        
        this.addCurrentLineToConsole()
        const result = await this.makeCommandReady(cmd, args)
        
        this.resetLine()
        return result
      }
    }else{
      this.historyHandler(e)
    }
  }

  async makeCommandReady(cmd, args){
    try{
      if(!cmd) return this.output("");

      this.saveShellHistory()
      

      cmd = cmd.toLowerCase();
      if(Object.hasOwn(this.commands, cmd)){
        const runCommand = this.commands[cmd]
        this.listPossibilities = false
        const result = await runCommand(args, cmd)
        return result
      }else{
        return this.output(cmd + ': command not found');
      }
    }catch(e){
      return { error:e }
    }
  }

  enterNewLine(){
    this.addCurrentLineToConsole();
    this.resetLine() // Clear/setup line for next input.
  }

  resetLine(){
    this.cmdLine_.value = '';
    this.cmdLine_.scrollIntoView()
  }

  saveShellHistory(){
    if (this.cmdLine_.value) {
      this.history_[this.history_.length] = this.cmdLine_.value;
      this.histpos_ = this.history_.length;
    }
  }

  findMatchinPartialValues(partialValue, setOfValues){
    const options = []
    for(let value of setOfValues){
      const contains = value.substr(0, partialValue.length) == partialValue
      if(contains){
        options.push(value)
      }
    }

    return options
  }

  autoCompleteCommand(){
    const partialCmd = this.cmdLine_.value
    const potentialCmds = this.findMatchinPartialValues(partialCmd, Object.keys(this.commands))

    if(potentialCmds.length === 1){
      this.cmdLine_.value = potentialCmds[0]
    }else{
      this.output(`${potentialCmds.join(" ")}`)
    }
  }

  async parsePath(args=[], cmd){

    setTimeout(()=>{
      this.isDoubleTab = false
    }, 1000)

    if(this.isDoubleTab){
      const currentContents = await this.exec("ls")
      if(currentContents && currentContents.length){
        this.output(currentContents.join("<br>"))
      }
    }else{
      this.isDoubleTab = true
    }
    
    for(const arg of args){
      const argIndex = args.indexOf(arg)
      const otherArgs = args.slice(0, argIndex)
      
      const isArray = Array.isArray(args)
      let partialPath = args
      let relativePath = ""
      let partialTarget = ""
      if(isArray){
        partialPath = arg
      }
  
      const partialPathHasContent = await this.exec("ls", [partialPath])
      if(partialPathHasContent && partialPathHasContent.length){
        this.output(partialPathHasContent.join("<br>"))
      }
  
      const hasSubPaths = partialPath.includes("/")
      if(hasSubPaths){
        const subPaths = partialPath.split("/")
        partialTarget = subPaths[subPaths.length - 1]
        subPaths.pop()
        relativePath = subPaths.join("/")
      }else{
        partialTarget = partialPath
      }
      if(relativePath !== "") relativePath = relativePath + "/"
      const suggestions = await this.exec("autoCompletePath", [relativePath+partialTarget])
      console.log('Suggestions', suggestions)
      if(suggestions.length > 1){
        this.output(suggestions.join("<br>"))
      }else if(suggestions.length === 1){

        const contentOfTarget = await this.exec('ls', [relativePath+partialTarget])
        const isCompletePath = contentOfTarget.length > 0
        if(!isCompletePath){
          const argString = relativePath+partialTarget
          const newPath = argString.replace(argString, relativePath+suggestions[0])
          this.cmdLine_.value = `${cmd} ${(otherArgs.length > 0? otherArgs.join(" ")+" ":"")}${newPath}`
        }
        
      }else{
        const current = await this.exec("ls")
        this.output(current.join("<br>"))
      }
    }

    this.cmdLine_.scrollIntoView()
    
  }

  addCurrentLineToConsole(){
    const line = this.cmdLine_.parentNode.parentNode.cloneNode(true);
    line.removeAttribute('id')
    line.classList.add('line');
    const input = line.querySelector(this.cmdLineId);
    input.autofocus = false;
    input.readOnly = true;
    this.output_.appendChild(line);
  }

  parseArguments(fullCommand){
    const args = fullCommand.split(' ').filter(function(val, i) {
      return val;
    });

    return args
  }

  argumentsToString(args){
    const argsFused = args.toString()
    const text = argsFused.replaceAll(","," ")
    return text
  }

  historyHandler(e){
    if (this.history_.length >= 0) {
      if (e.key == "ArrowUp" || e.key == "ArrowDown") {
        //Stores current value or past value in temporary variable
        //for switching back and forth between both of them
        if (this.history_[this.histpos_]) {
          this.history_[this.histpos_] = this.cmdLine_.value;
        } else {
          this.histtemp_ = this.cmdLine_.value;
        }

      }
      //Move cursor up and down history
      if (e.key == "ArrowUp") { // up
        this.histpos_--;
        if (this.histpos_ < 0) {
          this.histpos_ = 0;
        }
      } else if (e.key == "ArrowDown") { // down
        this.histpos_++;
        if (this.histpos_ > this.history_.length) {
          this.histpos_ = this.history_.length;
        }
      }

      //Displays past or current command, depending on cursor position
      if (e.key == "ArrowUp" || e.key == "ArrowDown") {
        this.cmdLine_.value = this.history_[this.histpos_] ? this.history_[this.histpos_] : this.histtemp_;
        // this.cmdLine_.value = this.cmdLine_.value; // Sets cursor to end of input.
      }
    }
  }

  formatHelpMessage(commandName, message){
    return `<span class'help-line' style="display:flex;justify-content:flex-start;"><b class='help-cmd' style="display:inline-block;width:25%;">${commandName}</b><span style="display:inline-block;">${message}</span></span>`
  }
}

window.Terminal = Terminal

