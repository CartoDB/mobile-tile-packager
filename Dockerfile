FROM node:dubnium

ARG WORKDIR=/usr/src/app
WORKDIR ${WORKDIR}

ADD ./ ${WORKDIR}
RUN ./tippecanoe_install.sh
RUN npm install

ENTRYPOINT ["node", "service.js"]
