FROM nginx:1.27-bookworm

RUN rm -f /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/bdblood.conf.template /etc/nginx/templates/bdblood.conf.template
COPY snippets /etc/nginx/snippets
