FROM docker.io/rust:1.67.1 as builder

RUN cargo new --bin apod_bot
WORKDIR ./apod_bot
COPY ./Cargo.toml ./Cargo.lock ./
RUN cargo build --release
RUN rm src/*.rs

ADD . ./

RUN rm ./target/release/deps/apod_bot*
RUN cargo build --release

FROM gcr.io/distroless/cc
COPY --from=builder /apod_bot/target/release/apod_bot /app/apod_bot

ENTRYPOINT ["/app/apod_bot"]
