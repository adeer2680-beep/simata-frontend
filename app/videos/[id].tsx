import { Platform } from "react-native";

let YoutubePlayer: any = null;
if (Platform.OS !== "web") {
  YoutubePlayer = require("react-native-youtube-iframe").default;
}

export default function VideoScreen() {
  if (Platform.OS === "web") {
    return <iframe width="100%" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" />;
  }

  return <YoutubePlayer height={300} play={false} videoId="dQw4w9WgXcQ" />;
}
