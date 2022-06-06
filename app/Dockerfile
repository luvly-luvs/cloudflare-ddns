# syntax=docker/dockerfile:1
FROM node:16-alpine
ENV NODE_ENV=production
RUN apk add --no-cache python2 g++ make
WORKDIR /ddns
COPY . .
COPY ddns.sh /etc/periodic/hourly

CMD ["crond", "-l", "2", "-f"]