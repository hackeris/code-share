FROM daocloud.io/library/node:6.6.0

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install --registry=https://registry.npm.taobao.org

COPY . /usr/src/app

EXPOSE 3000

CMD [ "npm", "start" ]