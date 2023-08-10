# ReadMe Metrics/Webhooks Express Demo

[![Remix on Glitch](https://cdn.glitch.com/2703baf2-b643-4da7-ab91-7ee2a2d00b5b%2Fremix-button.svg)](https://glitch.com/edit/#!/remix/readme-metrics-demo)

This starter project is a [Node.js/Express API](https://docs.readme.com/main/docs/sending-logs-to-readme-with-nodejs) that integrates with [ReadMe's Developer Dashboard](https://readme.com/developer-dashboard).

[Node.js](https://nodejs.org/en/about/) is a popular runtime that lets you run server-side JavaScript. This project uses the [Express](https://expressjs.com/) framework for the web server.

<!-- TODO: Maybe add link to GitHub repo? -->

## Prerequisites

You'll get best use out of this project if you're familiar with basic JavaScript. If you've written JavaScript for client-side web pages this is a little different because it uses server-side JS, but the syntax is the same!

## What's in this project?

← `public/index.html`: The webpage that is shown when you navigate to the root URL.

← `.env`: This contains your environment variables. This file is important — you'll need to ensure these values are correct so your API is properly connected with Developer Dashboard. See the "Populating your environment variables" section below for more information

← `README.md`: That’s this file! Hi!

← `index.js`: The **Node.js** server script for your API. The JavaScript defines several things for the API back-end:

- An endpoint to serve the homepage, located in `public/index.html`
- A few basic API endpoints for demonstrative purposes
- A`/webhook` endpoint, which is what we'll use to set up the Personalized Docs Webhook. This is what is used to surface API keys and other data for users that log into your ReadMe docs.
- Middleware that integrates [ReadMe Metrics SDK](https://docs.readme.com/main/docs/sending-logs-to-readme-with-nodejs). This is what captures your API request history and populates it in your Developer Dashboard.

← `openapi.json`: An [OpenAPI](https://docs.readme.com/main/docs/openapi) description of the endpoints implemented in the server. You can optionally sync this file to your ReadMe project, which will create reference docs for these API endpoints!

← `package.json`: The NPM packages for your project's dependencies.

## Populating your environment variables
