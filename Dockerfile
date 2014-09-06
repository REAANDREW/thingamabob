# DOCKER-VERSION 1.1.2

FROM ubuntu:14.04

RUN apt-get update
RUN apt-get install -y nodejs
RUN apt-get install -y npm

COPY . /src

RUN cd /src; npm install

EXPOSE 8000

CMD ["node", "/src/app.js"]
