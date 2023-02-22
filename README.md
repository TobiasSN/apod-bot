# Astronomy Picture of the Day Bot

This is a program that sends NASA's Astronomy Picture of the Day to a Discord
webhook when it comes out. It is intended to be executed once a day after that
day's picture comes out. This usually happens around 5:05 AM UTC.

## Development

Firstly, make sure you have Rust set up. [Rustup](https://rustup.rs) is
recommended for this.

Then, copy the `.example.env` file to `.env` and fill out the variables.

Now, run `cargo run` to trigger the bot. Optionally, add a date after in
YY-MM-DD format, like `cargo run 23-02-22`, to make the bot use that date.
