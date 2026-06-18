export const MAX_PROOF_IMAGE_BYTES = 5 * 1024 * 1024;
export const PROOF_IMAGE_SIZE_MESSAGE = "Please upload an image below 5 MB.";

export async function imageFileToWebpDataUrl(file: File): Promise<string> {
  if (file.size > MAX_PROOF_IMAGE_BYTES) {
    throw new Error(PROOF_IMAGE_SIZE_MESSAGE);
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Select a valid image file.");
  }

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read selected image."));
    };
    img.src = url;
  });

  const maxDimension = 1200;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to prepare selected image.");
  }

  context.drawImage(image, 0, 0, width, height);
  const dataUrl = canvas.toDataURL("image/webp", 0.82);
  const base64 = dataUrl.split(",", 2)[1] || "";
  const decodedSize = Math.floor((base64.length * 3) / 4);

  if (decodedSize > MAX_PROOF_IMAGE_BYTES) {
    throw new Error(PROOF_IMAGE_SIZE_MESSAGE);
  }

  return dataUrl;
}
