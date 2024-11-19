import { BskyAgent } from '@atproto/api';

interface Env {
    BLUESKY_USERNAME: string;
    BLUESKY_PASSWORD: string;
    AI: any; // or more specifically: AI: AIRunner;
	MY_BUCKET: R2Bucket;
}
async function generateRandomBasketballTweet(env: Env) {
	// Load the data
	const object = await env.MY_BUCKET.get('GSW.json');
    const basketballData = await object?.json() as Record<string, any>;

	// Get a random year
	const years = Object.keys(basketballData);
	const randomYear = years[Math.floor(Math.random() * years.length)];
	const seasonData = basketballData[randomYear];

	// Get a random game
	const randomGame = seasonData.games[Math.floor(Math.random() * seasonData.games.length)];

	// Create interesting context about the game
	const context = `Game data from ${randomGame.date}:
	Warriors ${randomGame.result} against ${randomGame.opponent} ${randomGame.teamPoints}-${randomGame.oppPoints}
	Team stats: ${randomGame.teamFG}/${randomGame.teamFGA} FG, ${randomGame.team3P} threes, ${randomGame.teamAST} assists
	Record after game: ${randomGame.wins}-${randomGame.losses}`;

	const messages = [
		{ 
			role: "system", 
			content: "You are a basketball analyst who loves sharing interesting stats and insights. Generate a single engaging tweet (max 280 characters) about the provided Warriors data. Include some analysis or interesting observation. Use basketball terminology and be enthusiastic!" 
		},
		{
			role: "user",
			content: `Generate a tweet containing a factoid or two from the following, as well as some insight: ${context}`
		}
	];

	const aiResponse = await env.AI.run("@cf/meta/llama-3.2-3b-instruct", { messages });

	// Post to Bluesky
    const agent = new BskyAgent({
        service: new URL('https://bsky.social')
    });
    await agent.login({
        identifier: env.BLUESKY_USERNAME,
        password: env.BLUESKY_PASSWORD
    });
	console.log(`post ${aiResponse.response}`);
	const record = await agent.post({
		text: aiResponse.response
	});
	console.log(JSON.stringify(record));
	return JSON.stringify(record);
}

export default {
	async scheduled(event, env, ctx) {
		ctx.waitUntil(generateRandomBasketballTweet(env));
		return new Response('Hello World!');
	},
} satisfies ExportedHandler<Env>;
