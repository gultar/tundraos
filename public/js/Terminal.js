class TerminalEmulator{
  constructor(id){
    this.id = id
    this.cmdLineId = `#cmdline-${this.id}`
    this.cmdLine_ = document.querySelector(this.cmdLineId);
    this.outputId = `#output-${this.id}`
    this.output_ = document.querySelector(this.outputId);
    this.terminalWindowId = `#terminal-window-${this.id}`
    this.terminalWindow = document.querySelector(this.terminalWindowId);
    this.pageAnchor = document.querySelector("#page-anchor");
    this.dateElement = {}
    this.history_ = [];
    this.histpos_ = 0;
    this.histtemp_ = 0;
    this.listPossibilities = false
    this.helpMessages = {
      "help":"Displays this message",
      "clear":"Clears the console",
      "date":"Displays the current date",
      "echo":"Outputs a string into the console. Usage: echo string. Ex: echo Hello World",
      "background":"Changes the background image. Usage: background http://url.url",
      "wiki":"Opens up a wikipedia page, or another website (not all of them work)",
      "gdt":"Opens up the Grand dictionnaire terminologique",
      "linguee":"Searches on Linguee for a translation of the text provided",
      "map":"Displays a Google Maps window",
      "tirex":"Start the famous tirex game from Google",
      "ls":'List information about the FILEs (the current directory by default). Usage: ls directory/',
      "rm":'Removes specified file. By default, it does not remove directories. . Usage: rm filename',
      "cd":"Change the working directory of the current shell execution environment. Usage: cd dir1/dir2/dir3",
      "pwd":"Print the name of current working directory",
      "cat":"Concatenate FILE(s) to standard output. Usage: cat filename",
      "mkdir":"Create the DIRECTORY, if it does not already exist. Usage: mkdir directoryname/",
      "touch":"Creates an empty file if it does not already exist. Usage: touch filename",
      "rmdir":"Remove the DIRECTORY, if it is empty. Usage: rmdir directoryname"
    }

    this.commands = {
      //Basic commands
      help:(args, cmd)=>this.runHelp(args, cmd),
      clear:(args, cmd)=>this.clear(args, cmd),
      echo:(args, cmd)=>this.echo(args),
      date:(args, cmd)=>this.output( new Date() ),
      ls:(args)=>this.runBash("ls",args),
      cd:(args)=>this.runBash("cd",args),
      cat:(args)=>this.runBash("cat",args),
      pwd:(args)=>this.runBash("pwd",args),
      mkdir:(args)=>this.runBash("mkdir",args),
      touch:(args)=>this.runBash("touch",args),
      rmdir:(args)=>this.runBash("rmdir",args),
      rm:(args)=>this.runBash("rm",args),
      whereis:(args)=>this.search(args),
      //Style Settings
      background:(args, cmd)=>changeBackground(args),
      //Web Tools
      web:(args)=>runWeb(args),
      wiki:()=>runWeb(["https://wikipedia.org"]),
      gdt:()=>runWeb(["https://gdt.oqlf.gouv.qc.ca/Resultat.aspx"]),
      iching:()=>runWeb(["https://gultar.github.io/iching/"]),//
      georatio:()=>runWeb(["https://georatio.com/"]),
      linguee:(args)=>runLinguee(args),
      tirex:()=>runTirex(),
      test:()=>this.runTest(),
      map:()=>runMap(),
      lofi:()=>runLofi()
      // explorer:()=>runFileManager()
    }
  }
  
  init(){
    this.defineKeyEventListeners();
    this.initTerminalMsg();
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
    // this.cmdLine_.addEventListener('click', (e)=>this.inputTextClick(e), false);
    this.cmdLine_.addEventListener('keydown', (e)=>{
      console.log('Event', e)
      this.processNewCommand(e)
    }, false);
  }

  outputHelpMenu(){
    for(const command of Object.keys(this.helpMessages)){
      this.output(this.formatHelpMessage(command, this.helpMessages[command]));
    }
  }

  runHelp(args){
    if(args.length > 0){
      const commandName = args[0]
      this.output(this.formatHelpMessage(commandName, commands[commandName]));
    }else{
      this.outputHelpMenu();
    }
  }

  echo(args){
    const hasPipeOperator = args.includes("|")
    if(hasPipeOperator === false){
      this.output(args.join(" "))
    }else{
      const indexOfPipeOp = args.indexOf("|")
      let echoMessage = args.slice(0, indexOfPipeOp).join(" ")
      this.output(echoMessage)
      const newCommand = args.slice(indexOfPipeOp+1)
      const [ cmd, ...newArgs ] = newCommand
      const path = newArgs[0]
      this.runBash(cmd, [path, echoMessage])
    }
    
  }

  output(data){
    if(typeof data == 'object'){
      data = JSON.stringify(data, null, 2)
    }
    this.output_.insertAdjacentHTML('beforeEnd', '<p>' + data + '</p>');
    this.cmdLine_.focus();
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

  runBash(cmd, args){
    const result = runFileSystemCommand(cmd, args)
    this.output(result)
  }

  search(args){
    runFileSystemCommand("search", args)
    .then(result => {
      if(result){
        if(result.directory){
          this.output(FileSystem.getAbsolutePath(result.directory))
        }else if(result.file){
          const { file, containedIn } = result
          this.output(FileSystem.getAbsolutePath(containedIn)+"/"+file.name)
        }
      }
    })
  }

  runFileManager(){
    const anchor = document.getElementById("filemanager")
    const temp = anchor.insertAdjacentHTML('beforeEnd', `
    <iframe src="./js-fileexplorer/demo.html"></iframe>
    `)
    new WinBox({ title: "Window Title", mount:temp });
  }

  runTest(){
    // const editor = `<iframe height="30%" width="60%" src="./text-editor.html"></iframe>`
    new WinBox({ title: "Window Title", height:"95%", width:"80%", url:"./editor.html"  });
  }

  runMap(){
    const maps = `<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d11061.57471035846!2d-70.6774246087825!3d46.12298747613765!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4cb9bfe1bb01d291%3A0x5040cadae4d29b0!2sSaint-Georges%2C%20QC%2C%20Canada!5e0!3m2!1sfr!2smx!4v1668968664821!5m2!1sfr!2smx" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`
    new WinBox({ title: "Window Title", height:"95%", width:"80%", html:maps  });
  }

  //Already existing
  processNewCommand(e){
    let [ cmd, ...args ] = this.parseArguments(this.cmdLine_.value);

    if (e.key == "Tab") { // tab
      e.preventDefault();
      this.autoCompleteCommand()
      // this.autoCompletePath(cmd, args[0])
      this.parsePath(args[0], cmd)
      // Implement tab suggest.
    } else if (e.key == "Enter") { // enter
      // Save shell history.
      return this.makeCommandReady(cmd, args)
    }else{
      this.historyHandler(e)
    }
  }

  makeCommandReady(cmd, args){

    if(!cmd){
      return this.output("");
    }

    this.saveShellHistory()
    this.enterNewLine();

    cmd = cmd.toLowerCase();
    if(Object.hasOwn(this.commands, cmd)){
      const runCommand = this.commands[cmd]

      runCommand(args, cmd)
      this.listPossibilities = false
      return true
    }else{
      return this.output(cmd + ': command not found');
    }
  }

  handleChainingOperators(args){
    const hasOrOrOperator = indexOf("||") !== -1
    const hasPipeOperator = args.indexOf("|") !== -1
    const hasAndAndOperator = args.indexOf("&&") !== -1

    if(hasPipeOperator){
      const indexOfPipeOp = args.indexOf("|")
      const newCommand = args.slice(indexOfPipeOp+1)
      const [ cmd, ...newArgs ] = newCommand
      return this.makeCommandReady(cmd, newArgs)
    }

    if(hasAndAndOperator){
      const indexOfPipeOp = args.indexOf("|")
      const newCommand = args.slice(indexOfPipeOp+1)
      const [ cmd, ...newArgs ] = newCommand
      return this.makeCommandReady(cmd, newArgs)
    }

  }

  enterNewLine(){
    this.addCurrentLineToConsole();
    window.scrollTo(0, this.getDocHeight_());
    this.cmdLine_.value = ''; // Clear/setup line for next input.
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
      this.output(potentialCmds.join(" "))
    }
  }

  parsePath(partialPath, cmd){
    const hasSubPaths = partialPath.includes("/")
    
    if(hasSubPaths){
      const subPaths = partialPath.split("/")
      const partialSubPath = subPaths[subPaths.length - 1]

      subPaths.pop()
      const relativePath = subPaths.join("/")

      const suggestion = this.suggestPath(partialSubPath, relativePath)
      if(suggestion.length === 1){
        this.cmdLine_.value = `${cmd} ${relativePath}/${suggestion[0]}/`
        return suggestion[0]
      }else{
        this.output(suggestion.join(" "))
        return suggestion
      }

    }else{

      const suggestion = this.suggestPath(partialPath)
      if(suggestion.length === 1){
        this.cmdLine_.value = `${cmd} ${suggestion[0]}/`
        return suggestion[0]
      }else{
        this.output(suggestion.join(" "))
        return suggestion
      }

    }
    // const potentialDirs = this.findMatchinPartialValues(partialPath, [...dirnames, ...filenames])
  }

  suggestPath(partialPath, relativePath){
    if(!relativePath) relativePath = FileSystem.wd().name
    const directory = FileSystem.find(relativePath)
    if(!directory) return []

    const dirnames = directory.getDirnames()
    const filenames = directory.getFilenames()
    const potentialDirs = this.findMatchinPartialValues(partialPath, [...dirnames, ...filenames])
    return potentialDirs
  }

  autoFillPath(partialPath){
    const dirnames = FileSystem.wd().getDirnames()
    const filenames = FileSystem.wd().getFilenames()
    const potentialDirs = this.findMatchinPartialValues(partialPath, [...dirnames, ...filenames])
    if(potentialDirs.length === 1){
      return potentialDirs[0]
    }else{
      if(this.listPossibilities == true){
        this.output(potentialDirs.join(" "))
        this.listPossibilities = false
      }else{
        this.listPossibilities = true
      }

      return false
    }
  }

  autoCompletePath(cmd, partialPath){
    const dirnames = FileSystem.wd().getDirnames()
    const filenames = FileSystem.wd().getFilenames()
    const potentialDirs = this.findMatchinPartialValues(partialPath, [...dirnames, ...filenames])
    if(potentialDirs.length === 1){
      this.cmdLine_.value = `${cmd} ${potentialDirs[0]}/`
    }else{
      if(this.listPossibilities == true){
        this.output(potentialDirs.join(" "))
        this.listPossibilities = false
      }else{
        this.listPossibilities = true
      }
    }
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
        this.cmdLine_.value = this.cmdLine_.value; // Sets cursor to end of input.
      }
    }
  }

  getDocHeight_() {
    const d = document;

    return Math.max(
        Math.max(d.body.scrollHeight, d.documentElement.scrollHeight),
        Math.max(d.body.offsetHeight, d.documentElement.offsetHeight),
        Math.max(d.body.clientHeight, d.documentElement.clientHeight)
    );
  }

  formatHelpMessage(commandName, message){
    return `<span class'help-line'><b class='help-cmd'>${commandName}</b> ----------- ${message}</span>`
  }
}

