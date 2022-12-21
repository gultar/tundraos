class MinimalTerminal{
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
          "pwd":"Print the name of current working directory",
          "cat":"Concatenate FILE(s) to standard output. Usage: cat filename",
          "mkdir":"Create the DIRECTORY, if it does not already exist. Usage: mkdir directoryname/",
          "touch":"Creates an empty file if it does not already exist. Usage: touch filename",
          "rmdir":"Remove the DIRECTORY, if it is empty. Usage: rmdir directoryname",
        },
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
  
    echo(args){
      const message = args.join(" ")
      this.output(message)
      return message
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
  
    async runBash(cmd, args){
      let result = await exec(cmd, args)
      let formattedResult = (typeof result == 'object' ? JSON.stringify(result, null, 2) : result)
      this.output(`<xmp>${formattedResult}</xmp>`)
      return result
    }
  
    whereis(args){
      exec("whereis", args)
      .then(result => {
        this.output(result)
      })
    }
  
    search(args){
      exec("search", args)
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
  
    async processCommand(commandLine){
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
            break;
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
      this.addCurrentLineToConsole();
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
        if(this.containsChainOp(this.cmdLine_.value))return await this.processCommand(this.cmdLine_.value)
        else{
          this.addCurrentLineToConsole();
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
    
        const partialPathHasContent = await exec("ls", [partialPath])
        if(partialPathHasContent && partialPathHasContent.length){
          this.output(partialPathHasContent.join(" "))
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
        const suggestions = await exec("autoCompletePath", [relativePath+partialTarget])
        
        if(suggestions.length > 1){
          this.output(suggestions.join(" "))
        }else if(suggestions.length === 1){
  
          const contentOfTarget = await exec('ls', [relativePath+partialTarget])
          const isCompletePath = contentOfTarget.length > 0
          if(!isCompletePath){
            const argString = relativePath+partialTarget
            const newPath = argString.replace(argString, relativePath+suggestions[0])
            this.cmdLine_.value = `${cmd} ${(otherArgs.length > 0? otherArgs.join(" ")+" ":"")}${newPath}`
          }
          
        }else{
          const current = await exec("ls")
          this.output(current.join(" "))
        }
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
  
    formatHelpMessage(commandName, message){
      return `<span class'help-line' style="display:flex;justify-content:flex-start;"><b class='help-cmd' style="display:inline-block;width:25%;">${commandName}</b><span style="display:inline-block;">${message}</span></span>`
    }
  }
  
  