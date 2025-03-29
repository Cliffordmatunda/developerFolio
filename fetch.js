const fs = require("fs");
const https = require("https");
require("dotenv").config(); // Load environment variables

const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME; // Fixed typo
const USE_GITHUB_DATA = process.env.USE_GITHUB_DATA;
const MEDIUM_USERNAME = process.env.MEDIUM_USERNAME;

const ERR = {
  noUserName: "Github Username was found to be undefined. Please set all relevant environment variables.",
  requestFailed: "The request to GitHub didn't succeed. Check if GitHub token in your .env file is correct.",
  requestFailedMedium: "The request to Medium didn't succeed. Check if Medium username in your .env file is correct."
};

if (USE_GITHUB_DATA?.toLowerCase() === "true") { // Case-insensitive check
  if (!GITHUB_USERNAME) {
    throw new Error(ERR.noUserName);
  }

  console.log(`Fetching profile data for ${GITHUB_USERNAME}`);
  const data = JSON.stringify({
    query: `
      {
        user(login:"${GITHUB_USERNAME}") { 
          name
          bio
          avatarUrl
          location
          pinnedItems(first: 6, types: [REPOSITORY]) {
            totalCount
            edges {
              node {
                ... on Repository {
                  name
                  description
                  forkCount
                  stargazers { totalCount }
                  url
                  id
                  diskUsage
                  primaryLanguage { name color }
                }
              }
            }
          }
        }
      }
    `
  });

  const req = https.request({
    hostname: "api.github.com",
    path: "/graphql",
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "User-Agent": "Node",
      "Content-Type": "application/json"
    }
  }, (res) => {
    let responseData = "";
    console.log(`GitHub Status Code: ${res.statusCode}`);

    if (res.statusCode !== 200) {
      console.error(ERR.requestFailed);
      return;
    }

    res.on("data", (chunk) => responseData += chunk);
    res.on("end", () => {
      fs.writeFile(`${__dirname}/public/profile.json`, responseData, (err) => {
        if (err) console.error(err);
        else console.log("Saved GitHub data to public/profile.json");
      });
    });
  });

  req.on("error", (error) => console.error(error));
  req.write(data);
  req.end();
}

if (MEDIUM_USERNAME) {
  console.log(`Fetching Medium blogs data for ${MEDIUM_USERNAME}`);
  const req = https.request({
    hostname: "api.rss2json.com",
    path: `/v1/api.json?rss_url=${encodeURIComponent(`https://medium.com/feed/@${MEDIUM_USERNAME}`)}`,
    method: "GET"
  }, (res) => {
    let mediumData = "";
    console.log(`Medium Status Code: ${res.statusCode}`);

    if (res.statusCode !== 200) {
      console.error(ERR.requestFailedMedium); // Fixed error key
      return;
    }

    res.on("data", (chunk) => mediumData += chunk);
    res.on("end", () => {
      fs.writeFile(`${__dirname}/public/blogs.json`, mediumData, (err) => {
        if (err) console.error(err);
        else console.log("Saved Medium data to public/blogs.json");
      });
    });
  });

  req.on("error", (error) => console.error(error));
  req.end();
}