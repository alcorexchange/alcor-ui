FROM node:12

# create destination directory
RUN mkdir /app
WORKDIR /app

# update and install dependency
#RUN apk update && apk upgrade
#RUN apk add git

# copy the app, note .dockerignore
COPY . /app/
RUN yarn install

# build necessary, even if no static files are needed,
# since it builds the server as well
ENV NETWORK=eos
RUN yarn build

# expose 5000 on container
EXPOSE 7000

# set app serving to permissive / assigned
ENV NUXT_HOST=0.0.0.0
# set app port
ENV NUXT_PORT=7000

# start the app
CMD [ "yarn", "start" ]
