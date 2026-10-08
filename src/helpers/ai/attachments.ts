import type { AiOptions } from "../../types/helpers";
import { classifyAttachment, type CodeFile, fetchCodeFiles } from "./files";
import { type AttachmentInfo, fetchImages, pickCandidates } from "./images";
import type { AiImage } from "./gemini";

/** What the model gets from the attachments of a message, and what it must be told about the rest. */
export interface PreparedAttachments {
  images: AiImage[];
  imagesFailed: number;
  /** Pictures attached while the server has looking at pictures switched off. */
  imagesOff: number;
  files: CodeFile[];
  filesFailed: number;
  /** Files attached while the server has reading code files switched off. */
  filesOff: number;
}

/** Attachments the AI has any use for: pictures and code or text files. */
export function usableAttachments(attachments: AttachmentInfo[]): AttachmentInfo[] {
  return attachments.filter((attachment) => classifyAttachment(attachment) !== null);
}

/**
 * Sort attachments into pictures and code files, and download what the server's switches allow.
 * Never throws: whatever could not be used is counted, so the answer can say so.
 */
export async function prepareAttachments(
  attachments: AttachmentInfo[],
  options: Pick<AiOptions, "images" | "code">,
): Promise<PreparedAttachments> {
  const pictures = attachments.filter((a) => classifyAttachment(a) === "image");
  const code = attachments.filter((a) => classifyAttachment(a) === "code");

  const prepared: PreparedAttachments = {
    images: [],
    imagesFailed: 0,
    imagesOff: 0,
    files: [],
    filesFailed: 0,
    filesOff: 0,
  };

  const [fetchedImages, fetchedFiles] = await Promise.all([
    pictures.length > 0 && options.images ? fetchImages(pictures) : null,
    code.length > 0 && options.code ? fetchCodeFiles(code) : null,
  ]);

  if (pictures.length > 0) {
    if (fetchedImages) {
      prepared.images = fetchedImages.images;
      prepared.imagesFailed =
        fetchedImages.skipped + Math.max(0, pictures.length - pickCandidates(pictures).length);
    } else {
      prepared.imagesOff = pictures.length;
    }
  }

  if (code.length > 0) {
    if (fetchedFiles) {
      prepared.files = fetchedFiles.files;
      prepared.filesFailed = fetchedFiles.skipped;
    } else {
      prepared.filesOff = code.length;
    }
  }

  return prepared;
}
