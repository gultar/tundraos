

class WifiMenu{
    constructor(){
        this.connectedNetworks = {}
        this.networkList = ""
        this.wifiMenu = ""
        this.wifiContainer = ""
        this.ifaces = []
        this.listenerController = new AbortController()
        this.init()
    }
    
    async init(){
        const { signal } = this.listenerController
        this.wifiContainer = document.querySelector("#wifi-menu-container")
        
        // this.wifiContainer.style.visibility = 'hidden'
        
        await this.injectDOM()
        
        this.wifiMenu = document.querySelector("#wifi-menu")
        
        this.networkList = document.querySelector("#network-list")
        
        new ApplicationWindow({
            height:"420",
            width:"490",
            mount:this.wifiMenu,
            modal:true,
            onclose:()=>{
                this.close()
            }
        })
        
        await this.getIface()
        
        
        window.addEventListener('connect-network', async(e)=>{
            
            const payload = {
                ssid:document.querySelector('#network-ssid').value,
                password:document.querySelector('#network-password').value
            }
            
            const result = await runWifiCommand('connect',payload)
            
            popup(JSON.stringify(result))
        }, { signal })
        
        window.addEventListener('disconnect-network', async(e)=>{
            
            const payload = {
                iface:document.querySelector('#network-interfaces').value
            }
            
            const result = await runWifiCommand('disconnect',payload)
            
            popup(JSON.stringify(result))
        }, { signal })
        
        const { result, error } = await runWifiCommand('scan',{})
        
        
        this.networkList.innerHTML = ""
        
        let knownNetworks = {}
        
        for(const network of result){
            knownNetworks[network.ssid] = network
        }
        
        for(const networkSSID in knownNetworks){
            const network = knownNetworks[networkSSID]
            this.networkList.insertAdjacentHTML("beforeend", this.createEntry(network))
        }
    }
    
    async getIface(){
        const interfaceSelect = document.querySelector("#network-interfaces")
        const { result, error } = await runWifiCommand('list',{})
        
        this.ifaces = result
        for(const iface of this.ifaces){
            interfaceSelect.insertAdjacentHTML("beforeend", this.createInterfaceEntry(iface))
        }
    }
    
    
    close(){
        this.wifiMenu.remove()
    }
    
    createEntry(networkEntry){
        
        
        return `<span 
                    class="network-entry" 
                    onclick="document.querySelector('#network-ssid').value='${networkEntry.ssid}'" id="${networkEntry.bssid}">
                    ${networkEntry.ssid}
                </span>`
        
    }
    
    createInterfaceEntry(interfaceEntry){
        
        
        return `<option value="${interfaceEntry.iface}">
                    ${interfaceEntry.iface}
                </options>`
        
    }
    
    exec(){
        //runWifiCommand(wifiCmd, { ssid:ssid, password:password, iface:iface })
    }
    
    async injectDOM(){
        const wifiContainer = document.querySelector("#wifi-menu-container")
        wifiContainer.insertAdjacentHTML("beforeend", this.buildDOM());
    
        return true
    }
    ///*<link rel="stylesheet" href="./css/save-as-dialog.css">*/
    buildDOM(){
        return `
        <link rel="stylesheet" href="./css/wifimenu.css" />
        <div id="wifi-menu">
            <div id="wifi-menu-window">
                <span id="network-menu-label">Wifi Menu</span>
                <div id="network-list">

                </div>
                <span>Network SSID: </span><input tyle="display:block" id="network-ssid" value="" /><br>
                <span>Password: </span><input tyle="display:block" id="network-password" type="password" value="" /><br>
                
                <span>Interface: </span><select name="interfaces" id="network-interfaces">

                </select>
                <button style="display:block"
                    onclick="sendEvent('connect-network')" id="connect">
                    Connect
                </button>
                <button style="display:block" onclick="sendEvent('disconnect-network')" id="disconnect">
                    Disconnect
                </button>
            </div>
        </div>
        `
    }
}