FROM node:6-alpine
ADD package.json *.js /root/
ADD models /root/models
WORKDIR /root
RUN npm install

EXPOSE 80
CMD [ "npm", "start" ]
