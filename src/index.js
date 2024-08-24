const axios = require("axios");

async function recall_jwt(retryCount = 10) {
  try {
    const url =
      "https://tg-api.grafilab.io/auth/tg/clicker?bot=grafilab&tguserid=5482770289&sign=bb998d1476d5bd1d16adfb151483aeb91b20c56d2a46cd93e7881641e33e25bb";
    const response = await axios.get(url);

    const url_data = response.request.path;
    const start = url_data.indexOf("jwt=") + 4;
    const end = url_data.indexOf("&version");
    const jwt = url_data.substring(start, end);

    return jwt;
  } catch (error) {
    console.log("Error recalling jwt, will retry again");
    if (retryCount > 0) {
      return recall_jwt(retryCount - 1);
    } else {
      console.log("Failed to recall JWT after multiple attempts");
      return;
    }
  }
}

async function callApiRecursively(
  url,
  data,
  delay,
  delayBetweenRetries,
  retries,
  token
) {
  try {
    // Set up the headers with the Bearer token
    const config = {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json", // Adjust if your API expects a different content type
      },
    };

    // Make the POST request with the token and data
    const response = await axios.post(url, data, config);
    console.log("API response:", response.data);
    console.log("====================================================");

    if (response.data.status === 200 && response.data.error === true) {
      console.error(
        "Received status 200 but Energy Insufficient Error. Initiating cooldown..."
      );
      console.log(
        "Cooldown complete in " + delayBetweenRetries / 1000 + " seconds"
      );
      setTimeout(() => {
        console.log("Cooldown complete. Resuming API calls...");
        callApiRecursively(
          url,
          data,
          delay,
          delayBetweenRetries,
          retries - 1,
          token
        );
      }, delayBetweenRetries); // 3-minute cooldown
    } else {
      setTimeout(() => {
        callApiRecursively(
          url,
          data,
          delay,
          delayBetweenRetries,
          retries - 1,
          token
        );
      }, delay);
    }
  } catch (error) {
    console.log("Error calling API:", error);
    // If the status is 400, initiate a cooldown
    if (error.response && error.response.status === 400) {
      console.error("Received status 400. Initiating cooldown...");
      console.log(
        "Cooldown complete in " + delayBetweenRetries / 1000 / 60 + " minutes"
      );
      setTimeout(() => {
        console.log("Cooldown complete. Resuming API calls...");
        callApiRecursively(
          url,
          data,
          delay,
          delayBetweenRetries,
          retries - 1,
          token
        );
      }, delayBetweenRetries); // 3-minute cooldown
    } else if (error.response && error.response.status === 429) {
      console.error(
        "Received status 429 Rate Limit Exceeded. Initiating cooldown..."
      );
      console.log("Cooldown complete in " + 300000 / 1000 / 60 + " minutes");
      setTimeout(() => {
        console.log("Cooldown complete. Resuming API calls...");
        callApiRecursively(
          url,
          data,
          delay,
          delayBetweenRetries,
          retries - 1,
          token
        );
      }, 300000); // 5-minutes cooldown
    } else if (error.response && error.response.status === 403) {
      console.error(
        "Received status 403 Token Invalid. New Token Recalling will be initiated in 3 mins..."
      );

      setTimeout(async () => {
        console.log("Cooldown complete. Resuming API calls for New Token...");
        const new_token = await recall_jwt();
        console.log("New TOKEN : ", new_token);
        callApiRecursively(
          url,
          data,
          delay,
          delayBetweenRetries,
          retries - 1,
          new_token
        );
      }, delayBetweenRetries); // 3-minute cooldown
    } else {
      // Log other errors and continue without cooldown
      console.error("Error calling API:", error.message);
      setTimeout(() => {
        callApiRecursively(
          url,
          data,
          delay,
          delayBetweenRetries,
          retries - 1,
          token
        );
      }, delay);
    }
  }
}

// Example usage
// const apiUrl = "https://tg-api.grafilab.io/power/main";
// const postData = {
//   tap_count: 5,
//   timestamp: 17231876554,
//   signature: "83bb8fe01664750af40bd23e29b6e83375fe1797aee5729dd0915ae911873422",
// };
const apiUrl = "https://tg-api.grafilab.io/power/task";
const postData = {
  tap_count: 5,
  task_id: 1,
  timestamp: 17231876554,
  signature: "83bb8fe01664750af40bd23e29b6e83375fe1797aee5729dd0915ae911873422",
};
const delayBetweenRetries = 180000; // 3mins delay
const delayBetweenCalls = 800; // 500ms delay
const numberOfRetries = 10; // Number of recursive calls
const bearerToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3Mjk2NTkxNTksImlkIjoyNjksImhhc2giOiI0YTQ0YWE1YmFjOTM1YzZhMjVkMzUxNDhmMzFjNDQ0YTE1ZThiMjRlZWJjNTU3NzdiMzVlZmI3Zjg4ZjUzZGM4NGMwNDFlMWRjMzJiZWJkZDI1YzYwMDE0MGE5MjdjYWYzMzMxMTg3MmFjMGFlZTI2MjRjM2FmNzJiZmYxNTE3NyIsImxvZ2luX3R5cGUiOiJ1c2VyX3RlbGVncmFtX2xvZ2luIiwiYWNjZXNzX3Rva2VuIjoiZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBaQ0k2TWpZNUxDSm9ZWE5vSWpvaU5HRTBOR0ZoTldKaFl6a3pOV00yWVRJMVpETTFNVFE0WmpNeFl6UTBOR0V4TldVNFlqSTBaV1ZpWXpVMU56YzNZak0xWldaaU4yWTRPR1kxTTJSak9EUmpNRFF4WlRGa1l6TXlZbVZpWkdReU5XTTJNREF4TkRCaE9USTNZMkZtTXpNek1URTROekpoWXpCaFpXVXlOakkwWXpOaFpqY3lZbVptTVRVeE56Y2lMQ0p5WVc1a2IyMXBlbVZrYUdWNElqb2labUpqTkRCaVpqZzNNV1F3WldReE5EUmtNV1JqTkRFNFlXSmlZekF4WmpFek9XVmtPV1JpTlRNeE1HWTBNamN3TkRGaU1XTmxaRFptTXpGa05UUXdPRFpoTTJSbU4ySm1NR015TXpsak5tWm1NbUppWkdKaFlXTXlOalpqTkRZME56RmxPVFkwWmpsbU5XRmxZVEExTUdSaU1EWmtNMlJrTkRSbE1tRTJZVEVpTENKcFlYUWlPakUzTWpRME56VXhOVGw5Li16ZWhIc0lYWUJqMmxJVTQtSnVrSnRQWklmSGdBMjRhajdvSWZVYnB0VDQiLCJncHVfc2VsZWN0ZWQiOiJOVklESUEiLCJpYXQiOjE3MjQ0NzUxNTl9.IIiBPrUjOdN20zpeuAJAi6fjgrOAawFXZgtAp3B6kX0"; // Replace with your actual Bearer token

callApiRecursively(
  apiUrl,
  postData,
  delayBetweenCalls,
  delayBetweenRetries,
  numberOfRetries,
  bearerToken
);
