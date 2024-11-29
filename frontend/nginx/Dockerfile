FROM nginx:alpine

RUN apk add --no-cache ca-certificates openssl && openssl req -subj '/CN=tr.com /O=tr /C=MR' -new -newkey rsa:2048 -sha256 -days 365 -nodes -x509 -keyout server.key -out server.crt 

COPY ./conf/nginx.conf /etc/nginx/conf.d/default.conf

VOLUME /usr/share/nginx/html

VOLUME /etc/nginx/conf.d/default.conf

WORKDIR /app

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

