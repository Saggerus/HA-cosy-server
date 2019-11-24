 HEAD
# Cosy MQTT Server for Home Assistant

GeoSuite do not currently offer a public API to allow control of the Cosy Smart Thermostat.  This project uses puppeteer running on nodejs to interact with the Cosy web app and accepts mqtt commands from home assistant in order to query the current state of your cosy system, or change the setting.  Hibernate is not yet supported (just because I've not got around to it), but slumber, comfy and cosy all work.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. This is the first version, and as such is still buggy as I've not added error handling.  It works well enough, but there's likely to be some timeout errors, although these can be safely ignored.  I've built and tested this using Hassbian on a Raspberry Pi, MQTT server and Docker are both also running on the same device.

### Prerequisites

 - An MQTT broker
 I'm using Mosquitto running locally on the same Raspberry Pi as my Hassbian instance.  A guide to install it can be found here:
https://randomnerdtutorials.com/how-to-install-mosquitto-broker-on-raspberry-pi/

You'll also need to update your configuration.yaml to point to it, as per here:
https://www.home-assistant.io/docs/mqtt/broker/

The server runs in a Docker image, so you'll also need Docker installed. You can find a guide to install that here:
https://dev.to/rohansawant/installing-docker-and-docker-compose-on-the-raspberry-pi-in-5-simple-steps-3mgl

It is also possible to not use Docker and instead install NodeJS with the puppeteer and mqtt modules and run the index_mqtt.js file with Node.  This worked well on my Windows machine, but I had a nightmare trying to get Puppeteer working on the Raspberry Pi, so went for Docker instead as it works just fine in that.

### Installing

Run Mosquitto in Daemon Mode

```
Open a command prompt and run:
 mosquitto -d
```

Create and run the Docker file

```
Once you have Mosquitto and Docker installed, copy all of the files above into a directory on your computer, open up creds.js and enter the username and password for Cosy (this will be the same as the credentials you use for the Cosy app on your phone) and save the file.  Then open index_mqtt.js and edit the line with the IP of your MQTT Broker
const client = mqtt.connect('mqtt://<ip_address_of_mqtt_server')

Open a command prompt and navigate to the directory.  Then run:
 docker build -t cosysrv  .

(nb.  the full stop after cosysrv tells docker to use the dockerfile in the local directory) 

After the image has built type:
 docker run -it cosysrv 
 
 This will launch the cosy server


```

Set up Home Assistant Entities

```
Edit configuration.yaml to enable mqtt if it's not already:

mqtt:
  discovery: true
  broker: <ip of mqtt server>
  username: <mqtt server username if you are using one>
  password: <mqtt server password if you are using one>


Next add a sensor which can read the current status of your Cosy system:

sensor:
  - platform: mqtt
    name: "Cosy"
    state_topic: "cosy/mode"

Then edit the customise section to give it a better name and icon in the Home Assistant UI:

customize:
  sensor.cosy:
      icon: mdi:home-thermometer
      friendly_name: "Cosy Current Setting"

Next add an entity control in order to be able to select the mode:

input_select:
  set_cosy:
    name: Set Mode
    options:
      - slumber
      - comfy
      - cosy

You might also want to group these two objects together so that they appear on the same card in the UI:

group:
  cosy:
    name: Cosy
    entities:
      - sensor.cosy
      - input_select.set_cosy

```
Add automations to make it all work

```
First lets get the current state of your Cosy system when HA starts:

automation:
  - alias: 'Update Cosy on Start'
      trigger:  
        platform: homeassistant
        event: start
      action:
        - service: mqtt.publish
          data:
            topic: "cosy/commands"
            payload: "mode"


Next lets update the current state every 5 mins:

- alias: 'Get Cosy State'
    trigger:  
      platform: time_pattern
      minutes: "/5"
    action:
      - service: mqtt.publish
        data:
          topic: "cosy/commands"
          payload: "mode"

Now send the appropriate mqtt messages when different modes are selected, and update the current state:

- alias: 'Set Cosy Mode'
    trigger:
      platform: state
      entity_id: input_select.set_cosy
    action:
      - service: mqtt.publish
        data_template:
          topic: "cosy/commands"
          retain: true
          payload: "{{ states('input_select.set_cosy') }}"
      
      - delay:
          seconds: '30'
      
      - service: mqtt.publish
        data:
          topic: "cosy/commands"
          payload: "mode"

Restart Home Assistant and you should now be good to go
## Authors

* **Wayne Saggers** 



# HA-cosy-server
Cosy Smart Thermostat Server to allow control via Home Assistant
>>>>>>> 5180ae27becdb782d2b23b38ace691c50b2c4228
