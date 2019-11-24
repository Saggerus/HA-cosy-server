FROM raspbian/stretch

RUN apt-get update -y
RUN apt-get install -y curl

RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get install -y nodejs

RUN apt-get update

RUN apt install chromium-browser chromium-codecs-ffmpeg -y
RUN apt-get --fix-broken install

RUN npm install puppeteer --verbose
RUN npm puppeteer -v

RUN npm install mqtt --verbose
RUN npm mqtt -v

WORKDIR  /

RUN find / -name 'chromium-browser'
COPY creds.js creds.js
COPY index_mqtt.js index_mqtt.js

ENTRYPOINT [ "node", "index_mqtt.js" ]
