import { mkdir, copyFile, access, writeFile } from "node:fs/promises";
const rate = 22050;
const count = Math.floor(rate * 0.65);
await mkdir("native", { recursive: true });
for (const silent of [false, true]) {
  const wav = Buffer.alloc(44 + count * 2);
  wav.write("RIFF");
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(count * 2, 40);
  for (let i = 0; i < count; i++) {
    const t = i / rate;
    const hz = t < 0.15 ? 523.25 : 659.25;
    const envelope = Math.min(1, t / 0.025) * Math.exp(-t * 8);
    wav.writeInt16LE(
      silent ? 0 : Math.round(Math.sin(2 * Math.PI * hz * t) * envelope * 2000),
      44 + i * 2,
    );
  }
  await writeFile(`native/${silent ? "silent" : "gentle"}.wav`, wav);
}
try {
  await access("android/app/src/main");
  await mkdir("android/app/src/main/res/drawable", { recursive: true });
  await mkdir("android/app/src/main/res/raw", { recursive: true });
  await copyFile(
    "native/android/ic_stat_focus.xml",
    "android/app/src/main/res/drawable/ic_stat_focus.xml",
  );
  for (const name of ["gentle", "silent"])
    await copyFile(
      `native/${name}.wav`,
      `android/app/src/main/res/raw/${name}.wav`,
    );
  console.log("Android sound and icon resources copied.");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  console.log(
    "No generated Android project yet; resources are ready under native/.",
  );
}
console.log(
  "iOS: add native/gentle.wav to the App target in Xcode Copy Bundle Resources.",
);
