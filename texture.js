export const textureList = [
  { name: "stone_0", file: "assets/stone_etto.png" },
  { name: "double_stone_0", file: "assets/double_stone_etto.png" },
  { name: "platform_0", file: "assets/platform_etto.png" },
  { name: "double_platform_0", file: "assets/double_platform_etto.png" },
  { name: "punta_0", file: "assets/punta_etto.png" },
  { name: "doppiaPunta_0", file: "assets/doppiaPunta_etto.png" },
  { name: "stone_1", file: "assets/stone_potter.png" },
  { name: "double_stone_1", file: "assets/double_stone_potter.png" },
  { name: "platform_1", file: "assets/platform_potter.png" },
  { name: "double_platform_1", file: "assets/double_platform_potter.png" },
  { name: "punta_1", file: "assets/punta_potter.png" },
  { name: "doppiaPunta_1", file: "assets/doppiaPunta_potter.png" },
  { name: "stone_2", file: "assets/stone_albert.png" },
  { name: "double_stone_2", file: "assets/double_stone_albert.png" },
  { name: "platform_2", file: "assets/platform_albert.png" },
  { name: "double_platform_2", file: "assets/double_platform_albert.png" },
  { name: "punta_2", file: "assets/punta_albert.png" },
  { name: "doppiaPunta_2", file: "assets/doppiaPunta_albert.png" },
  { name: "stone_3", file: "assets/stone_homer.png" },
  { name: "double_stone_3", file: "assets/double_stone_homer.png" },
  { name: "platform_3", file: "assets/platform_homer.png" },
  { name: "double_platform_3", file: "assets/double_platform_homer.png" },
  { name: "punta_3", file: "assets/punta_homer.png" },
  { name: "doppiaPunta_3", file: "assets/doppiaPunta_homer.png" },
  { name: "stone_4", file: "assets/stone_mine.png" },
  { name: "double_stone_4", file: "assets/double_stone_mine.png" },
  { name: "platform_4", file: "assets/platform_mine.png" },
  { name: "double_platform_4", file: "assets/double_platform_mine.png" },
  { name: "punta_4", file: "assets/punta_mine.png" },
  { name: "doppiaPunta_4", file: "assets/doppiaPunta_mine.png" },
  { name: "fastForward", file: "assets/fastForward.png" },
  { name: "stoneball", file: "assets/stoneball.png" },
];
export function loadTextures() {
  const textures = {};

  textureList.forEach(entry => {
    const img = new Image();
    img.src = entry.file;
    textures[entry.name] = img;
  });

  return textures;
}
