FROM node:latest
COPY app /home/node
WORKDIR /home/node
RUN npm install pm2 -g
RUN npm install
CMD [ "pm2","start", "index.js" ]