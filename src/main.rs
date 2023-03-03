use std::env;

use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
struct Apod {
	copyright: Option<String>,
	date: String,
	explanation: String,
	hdurl: Option<String>, // TODO: Enforce this only being here when it's an image?
	media_type: MediaType,
	service_version: String,
	title: String,
	url: String,
}

#[derive(Debug, Deserialize)]
enum MediaType {
	#[serde(rename = "image")]
	Image,
	#[serde(rename = "video")]
	Video,
}

// Simplified Discord webhook types

#[derive(Serialize)]
#[serde(untagged)]
enum Message {
	Image(ImageMessage),
	Video(VideoMessage),
}

#[derive(Serialize)]
struct ImageMessage {
	embeds: [Embed; 1],
}

#[derive(Serialize)]
struct Embed {
	title: String,
	description: String,
	footer: EmbedFooter,
	url: String,
	color: u32,
	image: EmbedImage,
}

#[derive(Serialize)]
struct EmbedFooter {
	text: String,
}

#[derive(Serialize)]
struct EmbedImage {
	url: String,
}

#[derive(Serialize)]
struct VideoMessage {
	content: String,
}

fn main() {
	let _ = dotenvy::dotenv(); // We are fine with the file not existing.

	let nasa_api_key = env::var("NASA_API_KEY").unwrap();
	let webhook_url = env::var("WEBHOOK_URL").unwrap();

	let date_arg = env::args().nth(1);

	let http_client = reqwest::blocking::Client::new();
	let mut builder = http_client
		.get("https://api.nasa.gov/planetary/apod")
		.query(&[("api_key", nasa_api_key)]);

	if let Some(date) = date_arg {
		builder = builder.query(&[("date", date)]);
	}

	let data = builder
		.send()
		.expect("Error occured during request")
		.json::<Apod>()
		.expect("Failed to parse response");

	// For debugging, in case the resulting message looks wrong.
	println!("{data:#?}");

	let url_date = &data.date.replace('-', "")[2..];
	let url = format!("https://apod.nasa.gov/apod/ap{url_date}.html");

	let date_string = chrono::NaiveDate::parse_from_str(&data.date, "%Y-%m-%d")
		.unwrap()
		.format("%B %d, %Y")
		.to_string();

	let message = match data.media_type {
		MediaType::Image => Message::Image(ImageMessage {
			embeds: [Embed {
				title: data.title,
				description: data.explanation,
				footer: EmbedFooter { text: date_string },
				url,
				color: 0x063785,
				image: EmbedImage {
					url: data.hdurl.unwrap(),
				},
			}],
		}),
		MediaType::Video => {
			let embed_url = reqwest::Url::parse(&data.url).unwrap();
			let video_id = embed_url.path_segments().unwrap().last().unwrap();
			let video_url = format!("https://youtube.com/watch?v={video_id}");
			Message::Video(VideoMessage {
				content: format!(
					"**{title} ({date_string}):** {explanation} (<{url}>)\n\n{video_url}",
					title = data.title,
					explanation = data.explanation
				),
			})
		}
	};

	let response = http_client
		.post(webhook_url)
		.json(&message)
		.send()
		.expect("Failed to send webhook request.");

	if !response.status().is_success() {
		panic!("Discord API returned error: {}", response.text().unwrap());
	}
}
