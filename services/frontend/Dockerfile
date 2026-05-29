FROM nginx:1.27-alpine

# Copy the dashboard
COPY index.html /usr/share/nginx/html/index.html

# NGINX config to proxy /health for K8s probes and serve static content
RUN echo 'server { \
  listen 80; \
  root /usr/share/nginx/html; \
  index index.html; \
  location /health { return 200 "OK"; add_header Content-Type text/plain; } \
  location / { try_files $uri $uri/ /index.html; } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
