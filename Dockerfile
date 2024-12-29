FROM node:23-alpine AS ui

COPY ui/wolweb /app
WORKDIR /app

RUN npm install
RUN npm run build


FROM golang:1.23-alpine AS server

COPY . /app
COPY --from=ui /app/dist /app/ui/wolweb/dist
WORKDIR /app

RUN go build -o /wolweb

FROM scratch

COPY --from=server /wolweb /app/wolweb
WORKDIR /app

EXPOSE 8951

CMD ["/app/wolweb"]
