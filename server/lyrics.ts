export async function fetchLyrics(title: string, artist: string) {
  console.log(`Searching lyrics for: ${title} - ${artist}`);
  
  // 模拟智能抓取逻辑
  // 在真实场景中，这里可以接入网易云、QQ音乐等 API
  
  const commonLyrics: Record<string, string> = {
    '周杰伦': '[00:00.00] 正在搜索周杰伦的歌词...\n[00:02.00] 哎哟不错哦！\n[00:04.00] 这是一个为你准备的音乐空间。',
    '陈奕迅': '[00:00.00] 你的背包，背到现在还没烂。\n[00:05.00] 岁月长，衣裳薄。\n[00:10.00] 后端已为你精准定位歌词。',
    'Coldplay': '[00:00.00] Look at the stars, look how they shine for you.\n[00:05.00] And everything you do.\n[00:10.00] Yeah, they were all yellow.'
  };

  const artistLyrics = commonLyrics[artist] || Object.entries(commonLyrics).find(([k]) => artist.includes(k))?.[1];

  if (artistLyrics) {
    return artistLyrics;
  }

  return `[00:00.00] 正在抓取 ${title} 的实时歌词...\n[00:05.00] 找到了一份来自后端的神秘歌词。\n[00:10.00] 音乐让生活更美好。\n[00:15.00] --- 音乐播放中 ---`;
}
