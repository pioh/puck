FROM avezila/nginx

ADD ./dist /var/www/html
ADD ./nginx.conf /etc/nginx/conf.d/nginx.conf
ADD ./main.nginx.conf /etc/nginx/nginx.conf
