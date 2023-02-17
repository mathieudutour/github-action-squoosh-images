import * as core from "@actions/core";
import fs from "fs/promises";
import { ImagePool, encoders } from "@squoosh/lib";
import { cpus } from "os";
const imagePool = new ImagePool(cpus().length);

export default async function main() {
  const images = core
    .getInput("images", {
      required: true,
      trimWhitespace: true,
    })
    .split(",")
    .map((x) => x.trim());

  for (const imagePath of images) {
    try {
      const file = await fs.readFile(imagePath);

      const array = new Uint8Array(file);
      const firstChunk = array.slice(0, 16);
      const firstChunkString = Array.from(firstChunk)
        .map((v) => String.fromCodePoint(v))
        .join("");
      const encoderKey = Object.entries(encoders).find(
        ([_name, { detectors }]) =>
          detectors.some((detector) => detector.exec(firstChunkString))
      )?.[0];

      if (!encoderKey) {
        core.info(`Skipping ${imagePath} as there is no matching encoder`);
        continue;
      }

      const image = imagePool.ingestImage(file);

      await image.encode({
        [encoderKey]: {},
      });

      // @ts-ignore
      await fs.writeFile(imagePath, image.encodedWith[encoderKey].binary);
    } catch (err) {
      // @ts-ignore
      core.error(err);
    }
  }

  await imagePool.close();
}
