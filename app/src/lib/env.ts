export const env = {
  MEDIA_ROOT: process.env.MEDIA_ROOT || "/media",
  DATA_DIR: process.env.DATA_DIR || "/data",
  LIBRARY_CONFIG: process.env.LIBRARY_CONFIG || "/data/library.yml",
  LAN_ONLY: process.env.LAN_ONLY !== "false",
};
