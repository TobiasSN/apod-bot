import { APIEmbed, APIMessage, RESTPostAPIChannelMessageJSONBody } from "discord-api-types/v10";

/// <reference path="types.d.ts" />

/**
 * Welcome to Cloudflare Workers! This is your first scheduled worker.
 *
 * - Run `wrangler dev --local` in your terminal to start a development server
 * - Run `curl "http://localhost:8787/cdn-cgi/mf/scheduled"` to trigger the scheduled event
 * - Go back to the console to see what your worker has logged
 * - Update the Cron trigger in wrangler.toml (see https://developers.cloudflare.com/workers/wrangler/configuration/#triggers)
 * - Run `wrangler publish --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/runtime-apis/scheduled-event/
 */

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	KV: KVNamespace;
	NASA_API_KEY: string;
	WEBHOOK_URL: string;
}

interface APOD {
	copyright: string;
	date: string;
	explanation: string;
	hdurl: string;
	media_type: "image" | "video";
	service_version: string;
	title: string;
	url: string;
}

const months = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December"
];

export default {
	async scheduled(
		controller: ScheduledController,
		env: Env,
		ctx: ExecutionContext
	): Promise<void> {
		try {
			const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${env.NASA_API_KEY}`);
			const data = await res.json() as APOD;

			console.log(data);

			// Check if this one has already been sent.
			if (data.date == await env.KV.get("last-date")) return;

			env.KV.put("last-date", data.date);

			// The URL isn't included in the API response, figure it out manually.
			const urlDate = data.date.replaceAll("-", "").slice(2);
			const url = `https://apod.nasa.gov/apod/ap${urlDate}.html`;

			const [year, month, day] = data.date.split("-");
			const date = new Date();
			date.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day));
			const dateString = date.toLocaleDateString("en-US", { dateStyle: "long" });

			let message: RESTPostAPIChannelMessageJSONBody | null;
			if (data.media_type == "image") {
				message = {
					embeds: [{
						title: data.title,
						description: data.explanation,
						footer: {
							text: dateString
						},
						url,
						color: 407429, // Blue color from the NASA logo
						image: {
							url: data.hdurl
						}
					}]
				};
			} else {
				// Video
				const videoId = new URL(data.url).pathname.split("/").pop(); // Get the last element
				const videoUrl = `https://youtube.com/watch?v=${videoId}`;
				message = {
					content: `**${data.title} (${dateString}):** ${data.explanation} (<${url}>)\n\n${videoUrl}`
				};
			}

			const request = new Request(env.WEBHOOK_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify(message)
			});
			request.headers.delete("cf-workers-preview-token"); // Workaround due to Wrangler bug.
			const _ = await fetch(request);
			console.log(await _.text());
		} catch (e) {
			console.error(e);
		}
	},
};
