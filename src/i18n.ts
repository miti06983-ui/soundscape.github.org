export interface Translations {
  // 通用文本
  home: string;
  albums: string;
  liked: string;
  likedSongs: string;
  search: string;
  playlist: string;
  createPlaylist: string;
  settings: string;
  
  // Settings 页面
  preferences: string;
  theme: string;
  darkMode: string;
  lightMode: string;
  desktopLyrics: string;
  desktopLyricsDesc: string;
  autoPlay: string;
  autoPlayDesc: string;
  volumeBoost: string;
  volumeBoostDesc: string;
  notifications: string;
  notificationsDesc: string;
  musicLibrary: string;
  musicLibraryDesc: string;
  playbackMode: string;
  language: string;
  about: string;
  
  // 按钮文本
  change: string;
  english: string;
  chinese: string;
  
  // 其他
  yourMusic: string;
  noResultsFound: string;
  startSearching: string;
  noLikedSongs: string;
  playlistEmpty: string;
  tracks: string;
}

export const translations: Record<'zh' | 'en', Translations> = {
  zh: {
    home: '首页',
  albums: '专辑',
  liked: '喜欢',
  likedSongs: '喜欢的歌曲',
  search: '搜索',
  playlist: '播放列表',
  createPlaylist: '创建播放列表',
  settings: '设置',
    preferences: '偏好设置',
    theme: '主题',
    darkMode: '深色模式',
    lightMode: '浅色模式',
    desktopLyrics: '桌面歌词',
    desktopLyricsDesc: '在屏幕上显示歌词',
    autoPlay: '自动播放',
    autoPlayDesc: '自动播放下一首歌曲',
    volumeBoost: '音量增强',
    volumeBoostDesc: '增强音频输出',
    notifications: '通知',
    notificationsDesc: '曲目切换通知',
    musicLibrary: '音乐库',
    musicLibraryDesc: '本地音频文件',
    playbackMode: '播放模式',
    language: '语言',
    about: '关于',
    change: '切换',
    english: 'English',
    chinese: '中文',
    yourMusic: '你的音乐',
    noResultsFound: '没有找到结果',
    startSearching: '开始搜索...',
    noLikedSongs: '还没有喜欢的歌曲',
    playlistEmpty: '这个播放列表是空的',
    tracks: '首歌曲'
  },
  en: {
    home: 'Home',
    albums: 'Albums',
    liked: 'Liked',
    likedSongs: 'Liked Songs',
    search: 'Search',
    playlist: 'Playlists',
    createPlaylist: 'Create Playlist',
    settings: 'Settings',
    preferences: 'Preferences',
    theme: 'Theme',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    desktopLyrics: 'Desktop Lyrics',
    desktopLyricsDesc: 'Show lyrics on screen',
    autoPlay: 'Auto-Play',
    autoPlayDesc: 'Play next track automatically',
    volumeBoost: 'Volume Boost',
    volumeBoostDesc: 'Enhance audio output',
    notifications: 'Notifications',
    notificationsDesc: 'Track change notifications',
    musicLibrary: 'Music Library',
    musicLibraryDesc: 'Local audio files',
    playbackMode: 'Playback Mode',
    language: 'Language',
    about: 'About',
    change: 'Change',
    english: 'English',
    chinese: '中文',
    yourMusic: 'Your Music',
    noResultsFound: 'No results found',
    startSearching: 'Start searching...',
    noLikedSongs: 'No liked songs yet',
    playlistEmpty: 'This playlist is empty',
    tracks: 'tracks'
  }
};

export const t = (lang: 'zh' | 'en') => translations[lang];