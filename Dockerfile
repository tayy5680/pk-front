FROM node:22.11.0-alpine as build-stage
ARG BUILD_CONFIGURATION=prod

ENV HOST 0.0.0.0
ENV BUILD_ENV=$BUILD_CONFIGURATION
#RUN npm install -g http-server
#RUN npm install -g vite
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:${BUILD_ENV}
EXPOSE 8080
#EXPOSE 4173
#WORKDIR /app/dist
CMD ["npm", "run", "preview"]
#ENTRYPOINT ["http-server", "-p", "8080", "/app/dist"]
