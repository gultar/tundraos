const activeTerminals = []

const spawnTerminalContainer = ()=>{
  const id = Date.now()
  const domElement = `
  <div id="terminal-window-${id}" class="terminal-window" style="">
    <div id="container-${id}" class="container">
            <output id="output-${id}" class="output">
            </output>
            <div action="#" id="input-line-${id}" class="input-line">
                <div id="prompt-${id}" class="prompt">
                </div>
                <div>
                  <input id="cmdline-${id}" class="cmdline" autofocus />
                </div>
            </div>
    </div>
  </div>
  `
  const parentNode = $("#main-container")
  parentNode.append(domElement)
  activeTerminals.push(id)
  return id
}

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
    this.socket = io()
    this.dateElement = {}
    this.history_ = [];
    this.histpos_ = 0;
    this.histtemp_ = 0;
    this.helpMessages = {
      "help":"Displays this message",
      "clear":"Clears the console",
      "date":"Displays the current date",
      "echo":"Outputs a string into the console. Usage: echo string. Ex: echo Hello World",
      "background":"Changes the background image. Usage: background http://url.url",
      "wiki":"Opens up a wikipedia page, or another website (not all of them work)",
      "gdt":"Opens up the Grand dictionnaire terminologique",
      "linguee":"Searches on Linguee for a translation of the text provided",
      "#":"Runs most terminal commands (cd does not work, for example) Usage: # ls -la"
    }
    this.commands = {
      help:(args, cmd)=>this.runHelp(args, cmd),
      clear:(args, cmd)=>this.clear(args, cmd),
      echo:(args, cmd)=>this.output(args),
      date:(args, cmd)=>this.output( new Date() ),
      background:(args, cmd)=>this.changeBackground(args),
      web:(args)=>this.runWeb(args),
      wiki:()=>this.runWeb(["https://wikipedia.org"]),
      gdt:()=>this.runWeb(["https://gdt.oqlf.gouv.qc.ca/Resultat.aspx"]),
      iching:()=>this.runWeb(["https://gultar.github.io/iching/"]),//
      georatio:()=>this.runWeb(["https://georatio.com/"]),
      linguee:(args)=>this.runLingueeSearch(args),
      createuser:(args)=>this.createUser(args),
      login:(args)=>this.login(args),
      "#":(args)=>this.runBashCommand(args), //DANGEROUS
      ls:(args)=>this.runBashCommand(["ls", ...args]),
      cd:(args)=>this.runBashCommand(["cd", ...args]),
      cat:(args)=>this.runBashCommand(["cat", ...args]),
      pwd:(args)=>this.runBashCommand(["pwd", ...args]),
      mkdir:(args)=>this.runBashCommand(["mkdir", ...args]),
      touch:(args)=>this.runBashCommand(["touch", ...args]),
      rmdir:(args)=>this.runBashCommand(["rmdir", ...args]),
      rm:(args)=>this.runBashCommand(["rm", ...args]),
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

  runBashCommand(args){
    const formatResult = (data) =>{
      if(Array.isArray(data)){
        data = data.join(" ")
      }

      if(typeof data == "object"){
        data = JSON.stringify(data, null, 2)
      }

      return data
    }

    const cmd = this.argumentsToString(args)
    this.socket.once("stdout", (data)=>{
      this.output(`
<pre>
${formatResult(data)}
</pre>
      `)
    })
    this.socket.emit("stdin",cmd)
  }

  defineKeyEventListeners(){
    this.terminalWindow.addEventListener('click', ()=>{
      this.cmdLine_.focus();
    }, false);
    self.addEventListener('click', ()=>{
      this.pageAnchor.focus();
    }, false);
    // this.cmdLine_.addEventListener('click', (e)=>this.inputTextClick(e), false);
    this.cmdLine_.addEventListener('keydown', (e)=>this.historyHandler(e), false);
    this.cmdLine_.addEventListener('keydown', (e)=>this.processNewCommand(e), false);
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

  output(html){
    this.output_.insertAdjacentHTML('beforeEnd', '<p>' + html + '</p>');
    this.cmdLine_.focus();
  }

  clear(){
      $(this.outputId).html('');
      this.initTerminalMsg();
  }

  changeBackground(args){
    const value = args[0]
    if(value.substr(0, 4) == "http"){
      console.log('Make http')
      $('body').css("background-image", "url("+args[0]+")")
      $('body').css("background-size", "cover")
    }else{
      $('body').css("background-image", "none")
      console.log(value)
      $('body').css("background", value)
    }
  }

  turnToURLQueryText(args){
    const argsFused = args.toString()
    const text = argsFused.replaceAll(",","+")
    return text
  }

  createUser(args){
    const [ username, password ] = args

    if(username == undefined) return this.output("LOGIN ERROR: Need to provide username")
    if(password == undefined) return this.output("LOGIN ERROR: Need to provide password")
   
    $.ajax({
      type: "POST",
      url: "/createUser",
      data: {
        timestamp:Date.now(),
        username:username,
        password:sha256(password),
      },
      success: (res)=>{
        this.output(res)
      },
    })
  }

  login(args){
    const [ username, rawPassword ] = args
    if(username == undefined) return this.output("LOGIN ERROR: Need to provide username")
    if(rawPassword == undefined) return this.output("LOGIN ERROR: Need to provide password")
    
    const password = sha256(rawPassword)
    this.socket.once('login-result', (result)=>{
      this.output(result)
    })
    this.socket.emit('login', JSON.stringify({username, password}))

  }

  runWeb(args=[]){
    new WinBox({ title: "Window Title", height:"90%", width:"90%", html:`
    <iframe id="wiki-window" style="border:none;" src="${args[0]}"></iframe>
    ` });
  }

  runLingueeSearch(args){
    const text = this.turnToURLQueryText(args)
    new WinBox({ title: "Window Title", height:"100%", width:"100%", html:`
    <iframe 
    id="wiki-window" 
    style="border:none;" 
    src="https://www.linguee.fr/search?source=auto&query=${text}">
    </iframe>
    ` });
  }

  //Already existing
  processNewCommand(e){
    if (e.key == "Tab") { // tab
      e.preventDefault();
      // Implement tab suggest.
    } else if (e.key == "Enter") { // enter
      // Save shell history.
      if (this.cmdLine_.value) {
        this.history_[this.history_.length] = this.cmdLine_.value;
        this.histpos_ = this.history_.length;
      }
      
      let [ cmd, ...args ] = this.parseArguments(this.cmdLine_.value);
      if(!cmd){
        this.output("");
      }else{
        this.addCurrentLineToConsole();
        cmd = cmd.toLowerCase();
        if(Object.hasOwn(this.commands, cmd)){
          const runCommand = this.commands[cmd]
          runCommand(args, cmd)
        }else{
          if (cmd) {
            this.output(cmd + ': command not found');
          }
        }
      }

      window.scrollTo(0, this.getDocHeight_());
      this.cmdLine_.value = ''; // Clear/setup line for next input.
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
        if (this.history_[this.histpos_]) {
          this.history_[this.histpos_] = this.cmdLine_.value;
        } else {
          this.histtemp_ = this.cmdLine_.value;
        }
      }
      
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

      if (e.key == "ArrowUp" || e.key == "ArrowDown") {
        this.cmdLine_.value = this.history_[this.histpos_] ? this.history_[this.histpos_] : this.histtemp_;
        // this.cmdLine_.value = this.cmdLine_.value; // Sets cursor to end of input.
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

  //Divided functions
  defineAvailableFunctions(){}

  formatHelpMessage(commandName, message){
    return `<span class'help-line'><b class='help-cmd'>${commandName}</b> ----------- ${message}</span>`
  }
}

