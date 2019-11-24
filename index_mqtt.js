const puppeteer = require('puppeteer');
const mqtt = require('mqtt')
const client = mqtt.connect('mqtt://<ip_address_of_mqtt_server')


//Get Setting

var setting = 'default'
var varCurrent = 'default'
async function run(){
    client.on('connect', () => {
        // Inform controllers that cosy server is connected
        client.publish('cosy/connected', 'true')
      })

//Broadcast current mode on startup
var mode = await process('current');
client.publish('cosy/mode', mode);
client.subscribe('cosy/commands')

//Listner for mqtt commands
client.on('message', (topic, message) => {
    console.log('received message %s %s', topic, message)
    if(message == 'mode'){
       get_status();   
    }
    //pass the identifier of the appropriate element on the cosy webapp page that should be clicked in order to set the mode
    if(message == 'slumber'){
        setting == 'slumber;'
        set_mode('[ng-click="vm.showSlumberPanel()"]');   
     }

     if(message == 'comfy'){
        set_mode('[ng-click="vm.showOptions(vm.modes.comfy)"]');   
     }

     if(message == 'cosy'){
        set_mode('[ng-click="vm.showOptions(vm.modes.cosy)"]');   
     }
   
  })
}

run();

//function to publish current state to mode topic
async function get_status(){
    var mode = await process('current');
    client.publish('cosy/mode', mode);
    return mode;
}

//set mode based on received mqtt command
async function set_mode(newMode){
    var mode = await process(newMode);
    //return mode;
}

//workhorse function
async function process(setting) {
    const browser = await puppeteer.launch({executablePath: '/usr/bin/chromium-browser',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
  const page = await browser.newPage();
  //page.setDefaultTimeout(0);
  
  
  //goto cosy webapp and login
  await page.goto('https://cosy.geotogether.com/geosuite/#/cosy');
  

  const USERNAME_SELECTOR = '#emailAddress-field';
  const PASSWORD_SELECTOR = '#password-field';
  const BUTTON_SELECTOR = 'input#login-btn.btn.btn-cosy-pink.full-width-xs-large';

  const CREDS = require('./creds');

  await page.click(USERNAME_SELECTOR);
  await page.keyboard.type(CREDS.username);

  await page.click(PASSWORD_SELECTOR);
  await page.keyboard.type(CREDS.password);

  await page.click(BUTTON_SELECTOR);

  //if request is for current setting run current function
  if(setting == 'current'){
    current_setting = await current(page);
    browser.close();
    return current_setting
   
  }else{

//open the panel that lets you select a mode
    await page.waitForNavigation();
    const mode = await page.waitForSelector('[ng-click="settings.selected =! settings.selected"]');
  
    await mode.click();
   
    //set the mode to comfy or cosy using the passsed element identifier
    const comfy = await page.waitForSelector(setting);
  
    await comfy.click();
 //slumber opens a different panel on the page, open and click the button   
    if(setting == '[ng-click="vm.showSlumberPanel()"]'){
      console.log('it is')
      const set_slumber = await page.waitForSelector('[ng-click="vm.saveSlumber(vm.modes.slumber)"]');
      set_slumber.click();
      
    }
  else{
    //save the new mode
    const set_slumber = await page.waitForSelector('[ng-click="vm.saveModechange()"]');
    set_slumber.click();
    
  }
  //wait for success notification and close browser
  const set_slumber = await page.waitForSelector('[class="geo-glyphicon geo-glyphicon-info success-icon"]');
  browser.close();
   
    }
  
}


//current mode is shown on page using different icons, this cycles through checking which one is shown and returns the result
async function current(page){
var flag = 0
try {
  const el = await page.waitForSelector('.geo-glyphicon-slumber-circle', { timeout: 5000 }); 
  varCurrent = 'slumber'
  flag = 1
} catch (error) {
  console.log ('not slumber');
}

if(flag !== 1){

try {
  const el = await page.waitForSelector('.geo-glyphicon-comfy-circle', { timeout: 5000 }); 
  varCurrent = 'comfy'
  flag = 1
} catch (error) {
  console.log ('not comfy');
}
 
}

if(flag !== 1){
  try {
    const el = await page.waitForSelector('.geo-glyphicon-cosy-circle', { timeout: 5000 }); 
    varCurrent = 'cosy'
    flag = 1
  } catch (error) {
    console.log ('not cosy');
  } 
  }
return varCurrent;
  
}
  

