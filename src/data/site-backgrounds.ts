import background01 from "../assets/images/backgrounds/background-01.jpg";
import background02 from "../assets/images/backgrounds/background-02.png";
import background03 from "../assets/images/backgrounds/background-03.jpg";
import background04 from "../assets/images/backgrounds/background-04.png";
import background05 from "../assets/images/backgrounds/background-05.png";
import currentBackground from "../assets/images/site-background.jpg";

export const SITE_BACKGROUNDS = [
	currentBackground,
	background01,
	background02,
	background03,
	background04,
	background05,
] as const;

export const BACKGROUND_ROTATION_INTERVAL_MS = 30_000;
export const BACKGROUND_FADE_DURATION_MS = 1_500;
export const BACKGROUND_MOBILE_MAX_WIDTH = 1_440;
export const BACKGROUND_DESKTOP_MAX_WIDTH = 2_560;
export const BACKGROUND_WEBP_QUALITY = 91;
