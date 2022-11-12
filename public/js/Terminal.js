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
      "goto":"Navigates to another page on website",
      "window":"Creates a new window element",
      "wiki":"Opens up a wikipedia page, or another website (not all of them work)"
    }
    this.commands = {
      help:(args, cmd)=>{
        this.runHelp(args, cmd);
      },
      clear:(args, cmd)=>{
        this.clear(args, cmd);
      },
      echo:(args, cmd)=>{
        this.output(args)
      },
      date:(args, cmd)=>{
        this.output( new Date() );
      },
      goto:(args, cmd)=>{
        this.redirect(args[0])
      },
      background:(args, cmd)=>{
        this.changeBackground(args)
      },
      window:()=>{
        const win = new WinBox({ title: "Window Title" });
      },
      wiki:(args)=>{ //
        if(args.length == 0){
          args = [["https://wikipedia.org"]]
        }
        new WinBox({ title: "Window Title", html:`
        <iframe id="wiki-window" style="border:none;" src="${args[0]}"></iframe>
        ` });
      },
      check:()=>{ //
        // fetch("http://localhost:8000/about")
        // .then((data)=>{ return data.text() })
        // .then((text)=>{ new WinBox({ title: "Window Title", html:text }); })
        new WinBox({ title: "Window Title", html:`
        <iframe
        style="border:none;" 
        src="http://localhost:8000/about">
        </iframe>
        ` });
      },
      linguee:()=>{
        new WinBox({ title: "Window Title", html:`
        <iframe id="wiki-window" style="border:none;" src="https://linguee.fr"></iframe>
        ` });
      }
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
      $('body').css("background-color", value)
    }
    
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

  redirect(slug=""){
    if(slug == "home" || slug == "h"){
      slug = ""
    }
    var url = `/${slug}`;
    window.location = url
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

