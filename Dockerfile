FROM mhart/alpine-node:6
ADD package.json index.js /root/
ADD models /root/models
WORKDIR /root
RUN npm install

EXPOSE 80
CMD [ "npm", "start" ]
