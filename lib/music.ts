/**
 * Music section on the About page.
 * To change a song, replace the `id` (the part after `v=` in the YouTube Music link).
 * To change the playlist photo, put your image at /public/music/playlist.webp (or change `cover` below).
 */
export type Track = {
  /** YouTube video id: music.youtube.com/watch?v=THIS_PART */
  id: string;
  title: string;
  artist: string;
};

export const music = {
  playlist: {
    title: "My JKT48 Playlist",
    description: "The JKT48 songs I keep on repeat while coding.",
    /** Put your thumbnail at public/music/playlist.webp. Until it exists, a placeholder is shown. */
    cover: "/music/playlist.webp",
    youtubeMusic: "https://music.youtube.com/playlist?list=PLlusqwJxX40lDS5ViQN_vPXduLjPkMoRz",
    spotify: "https://open.spotify.com/playlist/3ax9QNFnIMRSIQHalXJXNj",
  },
  tracks: [
    { id: "7Fmm3yizGQY", title: "Ayo Senyumlah", artist: "JKT48" },
    { id: "hFkaF8xuxps", title: "Fushidara Na Natsu", artist: "JKT48" },
    { id: "Sq0oSlmbDOc", title: "Sahabat atau Cinta", artist: "JKT48" },
  ] as Track[],
};

export const ytMusicUrl = (id: string) => `https://music.youtube.com/watch?v=${id}`;