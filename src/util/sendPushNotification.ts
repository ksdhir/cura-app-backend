import { Expo } from "expo-server-sdk";

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
const expo = new Expo();

const sendPushNotification = async (
  pushTokens: string[],
  title: string,
  body: string
) => {
  // validate pushTokens
  if (pushTokens.length === 0) {
    return;
  }

  // get messages
  const messages = prepareMessages(pushTokens, title, body);

  let chunks = expo.chunkPushNotifications(messages);

  for (let chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
      // console.log(receipts);
    } catch (error) {
      console.error(error);
    }
  }

};

function prepareMessages(pushTokens: string[], title: string, body: string) {
  // Create the messages that you want to send to clients
  let messages = [];
  for (let pushToken of pushTokens) {
    // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

    // Check that all your push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
    messages.push({
      to: pushToken,
      // sound: "default",
      title: title,
      body: body,
      data: { sample_key: "sample_property" },
    });
  }

  return messages;
}

export default sendPushNotification;

// sendPushNotification(["ExponentPushToken[W2dgyVF5GvNIGuKap10_Ew]"], "hello", "world");